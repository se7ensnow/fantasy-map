import asyncio
import json
from collections.abc import AsyncIterable
from datetime import datetime, timezone

import redis.asyncio as redis
from fastapi import APIRouter, Request
from fastapi.sse import EventSourceResponse, ServerSentEvent

from api_gateway_app.config import REDIS_URL

router = APIRouter()

redis_client = redis.from_url(REDIS_URL, decode_responses=True)

INITIAL_SNAPSHOT_GRACE_SECONDS = 15
PROGRESS_STALE_TIMEOUT_SECONDS = 12
PUBSUB_POLL_TIMEOUT_SECONDS = 5.0
LOOP_SLEEP_SECONDS = 0.05


def build_progress_key(job_id: str) -> str:
    return f"tile_progress:{job_id}"


def build_progress_channel(job_id: str) -> str:
    return f"tile_progress_events:{job_id}"


def parse_updated_at(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
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


@router.get("/{job_id}/events", response_class=EventSourceResponse)
async def stream_job_progress(request: Request, job_id: str) -> AsyncIterable[ServerSentEvent]:
    key = build_progress_key(job_id)
    channel = build_progress_channel(job_id)

    event_id = 0
    stream_started_at = datetime.now(timezone.utc)
    has_seen_snapshot = False

    snapshot = await redis_client.get(key)
    if snapshot:
        payload = json.loads(snapshot)
        has_seen_snapshot = True
        event_id += 1
        yield ServerSentEvent(
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
                timeout=PUBSUB_POLL_TIMEOUT_SECONDS,
            )

            if message and message.get("data"):
                payload = json.loads(message["data"])
                has_seen_snapshot = True
                event_id += 1

                yield ServerSentEvent(
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
                    age_seconds = (datetime.now(timezone.utc) - updated_at).total_seconds()

                    if age_seconds > PROGRESS_STALE_TIMEOUT_SECONDS:
                        timeout_payload = build_timeout_error_payload(job_id)
                        event_id += 1
                        yield ServerSentEvent(
                            data=timeout_payload,
                            event="progress",
                            id=str(event_id),
                        )
                        break
            else:
                now = datetime.now(timezone.utc)

                if not has_seen_snapshot:
                    startup_age_seconds = (now - stream_started_at).total_seconds()
                    if startup_age_seconds <= INITIAL_SNAPSHOT_GRACE_SECONDS:
                        await asyncio.sleep(LOOP_SLEEP_SECONDS)
                        continue

                timeout_payload = build_timeout_error_payload(job_id)
                event_id += 1
                yield ServerSentEvent(
                    data=timeout_payload,
                    event="progress",
                    id=str(event_id),
                )
                break

            await asyncio.sleep(LOOP_SLEEP_SECONDS)

    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()