import asyncio
import json
from collections.abc import AsyncIterable

import redis.asyncio as redis
from fastapi import APIRouter, Request
from fastapi.sse import EventSourceResponse, ServerSentEvent

from api_gateway_app.config import REDIS_URL

router = APIRouter()

redis_client = redis.from_url(REDIS_URL, decode_responses=True)


def build_progress_key(job_id: str) -> str:
    return f"tile_progress:{job_id}"


def build_progress_channel(job_id: str) -> str:
    return f"tile_progress_events:{job_id}"


@router.get("/{job_id}/events", response_class=EventSourceResponse)
async def stream_job_progress(request: Request, job_id: str) -> AsyncIterable[ServerSentEvent]:
    key = build_progress_key(job_id)
    channel = build_progress_channel(job_id)

    snapshot = await redis_client.get(key)
    if snapshot:
        yield ServerSentEvent(
            data=json.loads(snapshot),
            event="progress",
            id="snapshot",
        )

    pubsub = redis_client.pubsub()
    await pubsub.subscribe(channel)

    try:
        event_id = 0

        while True:
            if await request.is_disconnected():
                break

            message = await pubsub.get_message(
                ignore_subscribe_messages=True,
                timeout=5.0,
            )

            if message and message.get("data"):
                data = message["data"]
                payload = json.loads(data)
                event_id += 1

                yield ServerSentEvent(
                    data=payload,
                    event="progress",
                    id=str(event_id),
                )

                if payload.get("status") in {"done", "error"}:
                    break

            await asyncio.sleep(0.05)

    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()