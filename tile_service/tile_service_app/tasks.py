import logging
import os
import shutil
import tempfile
import time
import threading

import httpx
from rq import get_current_job

from tile_service_app.config import MAP_SERVICE_URL
from tile_service_app.log_config import log
from tile_service_app.progress import set_tile_progress, set_tile_heartbeat
from tile_service_app.storage import (
    storage,
    StorageError,
    build_map_source_key,
    build_map_source_prefix,
    build_map_tiles_version_prefix,
)
from tile_service_app.tiler import generate_tile_pyramid
from tile_service_app.utils import upload_generated_tiles


def process_task(
    map_id: str,
    source_ext: str,
    next_tiles_version: int,
    request_id: str | None = None,
) -> dict:
    started_at = time.perf_counter()
    temp_dir = tempfile.mkdtemp(prefix=f"tiles_{map_id}_")

    job = get_current_job()
    job_id = job.id if job else None

    log(
        logging.INFO,
        "tile_task_started",
        request_id=request_id,
        map_id=map_id,
        source_ext=source_ext,
        next_tiles_version=next_tiles_version,
        job_id=job_id,
    )

    heartbeat_stop = threading.Event()

    def heartbeat_loop():
        while not heartbeat_stop.wait(3):
            if job_id:
                set_tile_heartbeat(job_id)

    if job_id:
        set_tile_progress(
            job_id,
            map_id=map_id,
            status="running",
            stage="queued",
            progress=1,
            message="Task queued",
        )

    heartbeat_thread = None
    if job_id:
        heartbeat_thread = threading.Thread(target=heartbeat_loop, daemon=True)
        heartbeat_thread.start()

    try:
        source_path = os.path.join(temp_dir, f"source.{source_ext}")
        source_key = build_map_source_key(map_id, source_ext)

        if job_id:
            set_tile_progress(
                job_id,
                map_id=map_id,
                status="running",
                stage="downloading_source",
                progress=3,
                message="Downloading source image",
            )

        download_started = time.perf_counter()
        storage.download_file(source_key, source_path)
        download_ms = round((time.perf_counter() - download_started) * 1000, 2)

        log(
            logging.INFO,
            "tile_source_downloaded",
            request_id=request_id,
            map_id=map_id,
            source_key=source_key,
            duration_ms=download_ms,
            job_id=job_id,
        )

        source_prefix = build_map_source_prefix(map_id)
        source_delete_started = time.perf_counter()
        deleted_source_count = storage.delete_prefix(source_prefix)
        source_delete_ms = round((time.perf_counter() - source_delete_started) * 1000, 2)

        log(
            logging.INFO,
            "tile_source_deleted_after_download",
            request_id=request_id,
            map_id=map_id,
            deleted_count=deleted_source_count,
            duration_ms=source_delete_ms,
            job_id=job_id,
        )

        def on_generation_progress(generated_tiles: int, total_tiles: int) -> None:
            if not job_id or total_tiles <= 0:
                return

            progress = 5 + int(65 * generated_tiles / total_tiles)

            set_tile_progress(
                job_id,
                map_id=map_id,
                status="running",
                stage="generating_tiles",
                progress=min(progress, 70),
                message="Generating tiles",
                total_tiles=total_tiles,
                generated_tiles=generated_tiles,
                uploaded_tiles=0,
            )

        if job_id:
            set_tile_progress(
                job_id,
                map_id=map_id,
                status="running",
                stage="generating_tiles",
                progress=5,
                message="Generating tiles",
            )

        generation_started = time.perf_counter()
        result = generate_tile_pyramid(
            map_id=map_id,
            source_image_path=source_path,
            output_base_path=temp_dir,
            progress_callback=on_generation_progress,
            progress_every=10,
        )
        generation_ms = round((time.perf_counter() - generation_started) * 1000, 2)

        log(
            logging.INFO,
            "tile_generation_finished",
            request_id=request_id,
            map_id=map_id,
            width=result["width"],
            height=result["height"],
            max_zoom=result["max_zoom"],
            duration_ms=generation_ms,
            next_tiles_version=next_tiles_version,
            job_id=job_id,
        )

        def on_upload_progress(uploaded_tiles: int, total_tiles: int) -> None:
            if not job_id or total_tiles <= 0:
                return

            progress = 70 + int(25 * uploaded_tiles / total_tiles)

            set_tile_progress(
                job_id,
                map_id=map_id,
                status="running",
                stage="uploading_tiles",
                progress=min(progress, 95),
                message="Uploading tiles",
                total_tiles=total_tiles,
                generated_tiles=result["generated_tiles"],
                uploaded_tiles=uploaded_tiles,
            )

        if job_id:
            set_tile_progress(
                job_id,
                map_id=map_id,
                status="running",
                stage="uploading_tiles",
                progress=70,
                message="Uploading tiles",
                total_tiles=result["total_tiles"],
                generated_tiles=result["generated_tiles"],
                uploaded_tiles=0,
            )

        tiles_version_prefix = build_map_tiles_version_prefix(map_id, next_tiles_version)
        cleanup_started = time.perf_counter()
        deleted_version_objects = storage.delete_prefix(tiles_version_prefix)
        cleanup_ms = round((time.perf_counter() - cleanup_started) * 1000, 2)

        log(
            logging.INFO,
            "tiles_version_prefix_cleaned_before_upload",
            request_id=request_id,
            map_id=map_id,
            tiles_version=next_tiles_version,
            deleted_objects=deleted_version_objects,
            duration_ms=cleanup_ms,
            job_id=job_id,
        )

        upload_started = time.perf_counter()
        uploaded_count = upload_generated_tiles(
            map_id=map_id,
            tiles_version=next_tiles_version,
            tiles_local_dir=result["tiles_local_dir"],
            workers=20,
            progress_callback=on_upload_progress,
            progress_every=50,
        )
        upload_ms = round((time.perf_counter() - upload_started) * 1000, 2)

        log(
            logging.INFO,
            "tiles_uploaded",
            request_id=request_id,
            map_id=map_id,
            uploaded_count=uploaded_count,
            duration_ms=upload_ms,
            next_tiles_version=next_tiles_version,
            job_id=job_id,
        )

        if job_id:
            set_tile_progress(
                job_id,
                map_id=map_id,
                status="running",
                stage="finalizing",
                progress=96,
                message="Finalizing map",
                total_tiles=result["total_tiles"],
                generated_tiles=result["generated_tiles"],
                uploaded_tiles=uploaded_count,
            )

        callback_url = f"{MAP_SERVICE_URL}/maps/{map_id}/tiles_info"
        callback_payload = {
            "width": result["width"],
            "height": result["height"],
            "max_zoom": result["max_zoom"],
            "tiles_version": next_tiles_version,
        }

        with httpx.Client() as client:
            response = client.post(
                callback_url,
                json=callback_payload,
                headers={"X-Request-ID": request_id} if request_id else None,
            )
            response.raise_for_status()

        log(
            logging.INFO,
            "tiles_callback_sent",
            request_id=request_id,
            map_id=map_id,
            status_code=response.status_code,
            next_tiles_version=next_tiles_version,
            job_id=job_id,
        )

        total_ms = round((time.perf_counter() - started_at) * 1000, 2)

        log(
            logging.INFO,
            "tile_task_finished",
            request_id=request_id,
            map_id=map_id,
            width=result["width"],
            height=result["height"],
            max_zoom=result["max_zoom"],
            total_duration_ms=total_ms,
            next_tiles_version=next_tiles_version,
            job_id=job_id,
        )

        if job_id:
            set_tile_progress(
                job_id,
                map_id=map_id,
                status="done",
                stage="completed",
                progress=100,
                message="Tile generation completed",
                total_tiles=result["total_tiles"],
                generated_tiles=result["generated_tiles"],
                uploaded_tiles=uploaded_count,
                extra={
                    "width": result["width"],
                    "height": result["height"],
                    "max_zoom": result["max_zoom"],
                    "uploaded_count": uploaded_count,
                    "total_duration_ms": total_ms,
                    "tiles_version": next_tiles_version,
                },
            )

        return {
            "status": "ok",
            "map_id": map_id,
            "width": result["width"],
            "height": result["height"],
            "max_zoom": result["max_zoom"],
            "tiles_version": next_tiles_version,
        }

    except Exception as e:
        total_ms = round((time.perf_counter() - started_at) * 1000, 2)

        failed_tiles_prefix = build_map_tiles_version_prefix(map_id, next_tiles_version)
        deleted_failed_tiles = None

        try:
            deleted_failed_tiles = storage.delete_prefix(failed_tiles_prefix)
            log(
                logging.INFO,
                "failed_tiles_version_deleted",
                request_id=request_id,
                map_id=map_id,
                failed_tiles_version=next_tiles_version,
                deleted_objects=deleted_failed_tiles,
                job_id=job_id,
            )
        except StorageError as cleanup_error:
            log(
                logging.ERROR,
                "failed_tiles_version_delete_failed",
                request_id=request_id,
                map_id=map_id,
                failed_tiles_version=next_tiles_version,
                job_id=job_id,
                detail=str(cleanup_error),
            )

        logger = logging.getLogger("tile-service")
        logger.exception(
            "tile_task_failed",
            extra={
                "extra_fields": {
                    "event": "tile_task_failed",
                    "request_id": request_id,
                    "map_id": map_id,
                    "source_ext": source_ext,
                    "next_tiles_version": next_tiles_version,
                    "job_id": job_id,
                    "total_duration_ms": total_ms,
                    "deleted_failed_tiles": deleted_failed_tiles,
                }
            },
        )

        if job_id:
            set_tile_progress(
                job_id,
                map_id=map_id,
                status="error",
                stage="failed",
                progress=100,
                message=str(e),
                extra={
                    "total_duration_ms": total_ms,
                    "tiles_version": next_tiles_version,
                },
            )

        raise

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
        heartbeat_stop.set()
        if heartbeat_thread:
            heartbeat_thread.join(timeout=1)