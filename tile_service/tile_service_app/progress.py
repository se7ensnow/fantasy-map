import datetime
import json
import typing

import redis

from tile_service_app import config

redis_conn = redis.Redis.from_url(config.REDIS_URL, decode_responses=True)


def build_progress_key(job_id: str) -> str:
    return f"tile_progress:{job_id}"


def build_progress_channel(job_id: str) -> str:
    return f"tile_progress_events:{job_id}"


def set_tile_progress(
    job_id: str,
    *,
    map_id: str,
    status: str,
    stage: str,
    progress: int,
    message: str,
    total_tiles: int | None = None,
    generated_tiles: int | None = None,
    uploaded_tiles: int | None = None,
    extra: dict[str, typing.Any] | None = None,
    ttl_seconds: int = 3600,
) -> dict[str, typing.Any]:
    payload: dict[str, typing.Any] = {
        "job_id": job_id,
        "map_id": map_id,
        "status": status,
        "stage": stage,
        "progress": progress,
        "message": message,
        "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "total_tiles": total_tiles,
        "generated_tiles": generated_tiles,
        "uploaded_tiles": uploaded_tiles,
    }

    if extra:
        payload.update(extra)

    data = json.dumps(payload, ensure_ascii=False)

    redis_conn.set(build_progress_key(job_id), data, ex=ttl_seconds)
    redis_conn.publish(build_progress_channel(job_id), data)

    return payload


def set_tile_heartbeat(job_id: str, ttl_seconds: int = 3600) -> None:
    key = build_progress_key(job_id)
    data: typing.Optional[str] = redis_conn.get(key)
    if not data:
        return

    payload = json.loads(data)
    payload["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    redis_conn.set(key, json.dumps(payload, ensure_ascii=False), ex=ttl_seconds)