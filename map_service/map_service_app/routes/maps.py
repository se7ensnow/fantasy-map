import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Header, Query, Request
from redis import Redis
from rq import Queue
from sqlalchemy.orm import Session

from map_service_app.config import REDIS_URL, TILE_SERVICE_TASK
from map_service_app.crud import (
    create_map,
    update_map,
    delete_map,
    get_map_by_id,
    get_maps_by_owner,
    is_map_owned_by_user,
    list_maps_catalog,
    list_tags,
    get_map_by_share_id,
    update_map_tiles_info,
    create_share,
    delete_share,
    delete_map_tiles_info,
)
from map_service_app.database import get_db
from map_service_app.log_config import log
from map_service_app.schemas import (
    MapCreate,
    MapUpdate,
    ListMapCardResponse,
    MapResponse,
    TagStatResponse,
    TilesInfo,
    ShareIdResponse,
)
from map_service_app.storage import (storage, StorageError, build_map_source_key, build_map_prefix,
                                     build_map_source_prefix)

router = APIRouter()

SUPPORTED_CONTENT_TYPES = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
}


@router.post("/create", response_model=MapResponse)
def create_map_endpoint(
    request: Request,
    map_data: MapCreate,
    user_id: str = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    user_uuid = UUID(user_id)

    log(request, logging.INFO, "map_create_started", user_id=str(user_uuid))

    try:
        map_obj = create_map(db, user_uuid, map_data)
    except (ValueError, RuntimeError) as e:
        log(request, logging.WARNING, "map_create_failed", user_id=str(user_uuid), detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))

    log(request, logging.INFO, "map_create_finished", user_id=str(user_uuid), map_id=str(map_obj.id))
    return map_obj


@router.get("/all", response_model=ListMapCardResponse)
def get_all_maps_endpoint(
    request: Request,
    page: int = Query(1, alias="page", ge=1),
    size: int = Query(10, alias="size", ge=1, le=100),
    q: Optional[str] = Query(None, alias="q"),
    tags: Optional[str] = Query(None, alias="tags"),
    tags_mode: str = Query("any", alias="tags_mode"),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * size
    tag_names: list[str] = [tag.strip() for tag in tags.split(",") if tag.strip()] if tags else []

    if tags_mode not in ("any", "all"):
        log(request, logging.WARNING, "maps_list_invalid_tags_mode", tags_mode=tags_mode)
        raise HTTPException(status_code=400, detail="Invalid tags_mode. Must be 'any' or 'all'.")

    try:
        maps, total = list_maps_catalog(
            db,
            q=q,
            tags=tag_names,
            tags_mode=tags_mode,
            offset=offset,
            limit=size,
        )
    except ValueError as e:
        log(request, logging.WARNING, "maps_list_failed", detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))

    return ListMapCardResponse(total=total, items=maps)


@router.get("/owned", response_model=ListMapCardResponse)
def get_owned_maps_endpoint(
    page: int = Query(1, alias="page", ge=1),
    size: int = Query(10, alias="size", ge=1, le=100),
    owner_id: UUID = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * size
    maps, total = get_maps_by_owner(db, owner_id, offset=offset, limit=size)
    return ListMapCardResponse(total=total, items=maps)


@router.get("/tags", response_model=list[TagStatResponse])
def list_tags_endpoint(
    q: Optional[str] = Query(None, alias="q"),
    limit: int = Query(50, alias="limit", ge=1, le=200),
    db: Session = Depends(get_db),
):
    rows = list_tags(db, q=q, limit=limit)
    return [TagStatResponse(name=name, count=int(count)) for name, count in rows]


@router.get("/share/{share_id}", response_model=MapResponse)
def get_map_by_share_id_endpoint(request: Request, share_id: str, db: Session = Depends(get_db)):
    map_obj = get_map_by_share_id(db, share_id)
    if not map_obj:
        log(request, logging.INFO, "shared_map_not_found", share_id=share_id)
        raise HTTPException(status_code=404, detail="Shared map not found")
    return map_obj


@router.get("/{map_id}", response_model=MapResponse)
def get_map_endpoint(
    request: Request,
    map_id: UUID,
    user_id: Optional[str] = Header(None, alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    map_obj = get_map_by_id(db, map_id)
    if not map_obj:
        log(request, logging.INFO, "map_get_not_found", map_id=str(map_id))
        raise HTTPException(status_code=404, detail="Map not found")

    is_owner = False
    if user_id:
        user_uuid = UUID(user_id)
        if is_map_owned_by_user(db, user_uuid, map_id):
            is_owner = True

    if map_obj.visibility != "public" and not is_owner:
        log(request, logging.INFO, "map_get_forbidden_hidden", map_id=str(map_id))
        raise HTTPException(status_code=404, detail="Map not found")

    return map_obj


@router.put("/{map_id}", response_model=MapResponse)
def update_map_endpoint(
    request: Request,
    map_id: UUID,
    data: MapUpdate,
    user_id: str = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    user_uuid = UUID(user_id)

    log(request, logging.INFO, "map_update_started", map_id=str(map_id), user_id=str(user_uuid))

    if not is_map_owned_by_user(db, user_uuid, map_id):
        log(request, logging.WARNING, "map_update_forbidden", map_id=str(map_id), user_id=str(user_uuid))
        raise HTTPException(status_code=403, detail="You do not own this map")

    try:
        map_obj = update_map(db, map_id, data)
        if not map_obj:
            log(request, logging.INFO, "map_update_not_found", map_id=str(map_id), user_id=str(user_uuid))
            raise HTTPException(status_code=404, detail="Map not found")
    except ValueError as e:
        log(request, logging.WARNING, "map_update_failed", map_id=str(map_id), user_id=str(user_uuid), detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))

    log(request, logging.INFO, "map_update_finished", map_id=str(map_id), user_id=str(user_uuid))
    return map_obj


@router.delete("/{map_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_map_endpoint(
    request: Request,
    map_id: UUID,
    user_id: str = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    user_uuid = UUID(user_id)

    log(request, logging.INFO, "map_delete_started", map_id=str(map_id), user_id=str(user_uuid))

    if not is_map_owned_by_user(db, user_uuid, map_id):
        log(request, logging.WARNING, "map_delete_forbidden", map_id=str(map_id), user_id=str(user_uuid))
        raise HTTPException(status_code=403, detail="You do not own this map")

    deleted = delete_map(db, map_id)
    if not deleted:
        log(request, logging.INFO, "map_delete_not_found", map_id=str(map_id), user_id=str(user_uuid))
        raise HTTPException(status_code=404, detail="Map not found")

    map_prefix = build_map_prefix(map_id)
    try:
        deleted_count = storage.delete_prefix(map_prefix)
    except StorageError as e:
        log(request, logging.ERROR, "map_delete_storage_failed", map_id=str(map_id), user_id=str(user_uuid))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete map files from storage: {str(e)}",
        )

    log(
        request,
        logging.INFO,
        "map_delete_finished",
        map_id=str(map_id),
        user_id=str(user_uuid),
        deleted_objects=deleted_count,
    )
    return


@router.post("/{map_id}/upload-image")
async def upload_image_endpoint(
    request: Request,
    map_id: UUID,
    file: UploadFile = File(...),
    user_id: str = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    user_uuid = UUID(user_id)

    log(
        request,
        logging.INFO,
        "map_upload_started",
        map_id=str(map_id),
        user_id=str(user_uuid),
        filename=file.filename,
        content_type=file.content_type,
    )

    if not is_map_owned_by_user(db, user_uuid, map_id):
        log(request, logging.WARNING, "map_upload_forbidden", map_id=str(map_id), user_id=str(user_uuid))
        raise HTTPException(status_code=403, detail="You do not own this map")

    map_obj = get_map_by_id(db, map_id)
    if not map_obj:
        log(request, logging.INFO, "map_upload_not_found", map_id=str(map_id), user_id=str(user_uuid))
        raise HTTPException(status_code=404, detail="Map not found")

    source_ext = SUPPORTED_CONTENT_TYPES.get(file.content_type)
    if source_ext is None:
        log(
            request,
            logging.WARNING,
            "map_upload_invalid_content_type",
            map_id=str(map_id),
            user_id=str(user_uuid),
            content_type=file.content_type,
        )
        raise HTTPException(status_code=400, detail="Supported formats: PNG, JPEG/JPG, WEBP")

    source_prefix = build_map_source_prefix(str(map_id))
    object_key = build_map_source_key(map_id, source_ext)

    try:
        deleted_count = storage.delete_prefix(source_prefix)
        log(
            request,
            logging.INFO,
            "map_old_source_deleted",
            map_id=str(map_id),
            user_id=str(user_uuid),
            deleted_count=deleted_count,
        )

        storage.upload_fileobj(
            file_obj=file.file,
            object_key=object_key,
            content_type=file.content_type,
        )
    except StorageError as e:
        log(request, logging.ERROR, "map_upload_storage_failed", map_id=str(map_id), user_id=str(user_uuid))
        raise HTTPException(status_code=500, detail=f"Failed to upload image to storage: {str(e)}")

    delete_map_tiles_info(db, map_id)
    log(request, logging.INFO, "map_tiles_reset", map_id=str(map_id), user_id=str(user_uuid))

    redis_conn = Redis.from_url(REDIS_URL)
    q = Queue(connection=redis_conn)
    job = q.enqueue(TILE_SERVICE_TASK, str(map_id), source_ext, request.state.request_id)

    log(
        request,
        logging.INFO,
        "tile_job_enqueued",
        map_id=str(map_id),
        user_id=str(user_uuid),
        job_id=job.id,
        source_ext=source_ext,
    )

    return {
        "status": "image uploaded",
        "task": "tile generation started",
        "job_id": job.id,
    }


@router.post("/{map_id}/tiles_info", status_code=status.HTTP_202_ACCEPTED)
def tiles_info_endpoint(request: Request, map_id: UUID, info: TilesInfo, db: Session = Depends(get_db)):
    log(
        request,
        logging.INFO,
        "tiles_info_received",
        map_id=str(map_id),
        width=info.width,
        height=info.height,
        max_zoom=info.max_zoom,
    )

    updated = update_map_tiles_info(db, map_id, info)
    if not updated:
        log(request, logging.WARNING, "tiles_info_map_not_found", map_id=str(map_id))
        raise HTTPException(status_code=404, detail="Map not found")

    log(request, logging.INFO, "tiles_info_applied", map_id=str(map_id))
    return


@router.post("/{map_id}/share", response_model=ShareIdResponse)
def create_share_endpoint(
    request: Request,
    map_id: UUID,
    user_id: str = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    user_uuid = UUID(user_id)

    if not is_map_owned_by_user(db, user_uuid, map_id):
        log(request, logging.WARNING, "share_create_forbidden", map_id=str(map_id), user_id=str(user_uuid))
        raise HTTPException(status_code=403, detail="You do not own this map")

    try:
        sid = create_share(db, map_id)
    except RuntimeError as e:
        log(request, logging.WARNING, "share_create_failed", map_id=str(map_id), user_id=str(user_uuid), detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))

    if sid is None:
        log(request, logging.INFO, "share_create_map_not_found", map_id=str(map_id), user_id=str(user_uuid))
        raise HTTPException(status_code=404, detail="Map not found")

    log(request, logging.INFO, "share_create_finished", map_id=str(map_id), user_id=str(user_uuid), share_id=sid)
    return ShareIdResponse(share_id=sid)


@router.delete("/{map_id}/share", status_code=status.HTTP_204_NO_CONTENT)
def delete_share_endpoint(
    request: Request,
    map_id: UUID,
    user_id: str = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    user_uuid = UUID(user_id)

    if not is_map_owned_by_user(db, user_uuid, map_id):
        log(request, logging.WARNING, "share_delete_forbidden", map_id=str(map_id), user_id=str(user_uuid))
        raise HTTPException(status_code=403, detail="You do not own this map")

    ok = delete_share(db, map_id)
    if not ok:
        log(request, logging.INFO, "share_delete_map_not_found", map_id=str(map_id), user_id=str(user_uuid))
        raise HTTPException(status_code=404, detail="Map not found")

    log(request, logging.INFO, "share_delete_finished", map_id=str(map_id), user_id=str(user_uuid))
    return


@router.get("/{map_id}/share", response_model=ShareIdResponse)
def get_share_id_endpoint(
    request: Request,
    map_id: UUID,
    user_id: str = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    user_uuid = UUID(user_id)

    if not is_map_owned_by_user(db, user_uuid, map_id):
        log(request, logging.WARNING, "share_get_forbidden", map_id=str(map_id), user_id=str(user_uuid))
        raise HTTPException(status_code=403, detail="You do not own this map")

    map_obj = get_map_by_id(db, map_id)
    if not map_obj:
        log(request, logging.INFO, "share_get_map_not_found", map_id=str(map_id), user_id=str(user_uuid))
        raise HTTPException(status_code=404, detail="Map not found")

    return ShareIdResponse(share_id=map_obj.share_id)