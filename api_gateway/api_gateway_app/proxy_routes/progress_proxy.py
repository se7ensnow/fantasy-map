import asyncio
import json
from collections import abc
import datetime

import redis.asyncio as redis
import fastapi
from fastapi import sse

from api_gateway_app import config

router = fastapi.APIRouter()

redis_client = redis.from_url(config.REDIS_URL, decode_responses=True)


def build_progress_key(job_id: str) -> str:
    return f"tile_progress:{job_id}"


def build_progress_channel(job_id: str) -> str:
    return f"tile_progress_events:{job_id}"


def parse_updated_at(value: str | None) -> datetime.datetime | None:
    if not value:
        return None
    try:
        return datetime.datetime.fromisoformat(value)
    except ValueError:
        return None


def is_payload_terminal(payload: dict) -> bool:
    return payload.get("status") in {"done", "error"}


def build_timeout_error_payload(job_id: str) -> dict:
    return {
        "job_id": job_id,
        "status": "error",
        "stage": "failed",
        "progress": 100,
        "message": "Tile processing heartbeat timed out",
        "error_code": "processing_timeout",
    }


@router.get("/{job_id}/events", response_class=sse.EventSourceResponse)
async def stream_job_progress(request: fastapi.Request, job_id: str) -> abc.AsyncIterable[sse.ServerSentEvent]:
    key = build_progress_key(job_id)
    channel = build_progress_channel(job_id)

    event_id = 0
    stream_started_at = datetime.datetime.now(datetime.timezone.utc)
    has_seen_snapshot = False

    snapshot = await redis_client.get(key)
    if snapshot:
        payload = json.loads(snapshot)
        has_seen_snapshot = True
        event_id += 1
        yield sse.ServerSentEvent(
            data=payload,
            event="progress",
            id=str(event_id),
        )
        if is_payload_terminal(payload):
            return

    pubsub = redis_client.pubsub()
    await pubsub.subscribe(channel)

    try:
        while True:
            if await request.is_disconnected():
                break

            message = await pubsub.get_message(
                ignore_subscribe_messages=True,
                timeout=config.PUBSUB_POLL_TIMEOUT_SECONDS,
            )

            if message and message.get("data"):
                payload = json.loads(message["data"])
                has_seen_snapshot = True
                event_id += 1

                yield sse.ServerSentEvent(
                    data=payload,
                    event="progress",
                    id=str(event_id),
                )

                if is_payload_terminal(payload):
                    break

            current_snapshot = await redis_client.get(key)

            if current_snapshot:
                payload = json.loads(current_snapshot)
                has_seen_snapshot = True
                updated_at = parse_updated_at(payload.get("updated_at"))

                if not is_payload_terminal(payload) and updated_at is not None:
                    age_seconds = (datetime.datetime.now(datetime.timezone.utc) - updated_at).total_seconds()

                    if age_seconds > config.PROGRESS_STALE_TIMEOUT_SECONDS:
                        timeout_payload = build_timeout_error_payload(job_id)
                        event_id += 1
                        yield sse.ServerSentEvent(
                            data=timeout_payload,
                            event="progress",
                            id=str(event_id),
                        )
                        break
            else:
                now = datetime.datetime.now(datetime.timezone.utc)

                if not has_seen_snapshot:
                    startup_age_seconds = (now - stream_started_at).total_seconds()
                    if startup_age_seconds <= config.INITIAL_SNAPSHOT_GRACE_SECONDS:
                        await asyncio.sleep(config.LOOP_SLEEP_SECONDS)
                        continue

                timeout_payload = build_timeout_error_payload(job_id)
                event_id += 1
                yield sse.ServerSentEvent(
                    data=timeout_payload,
                    event="progress",
                    id=str(event_id),
                )
                break

            await asyncio.sleep(config.LOOP_SLEEP_SECONDS)

    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()