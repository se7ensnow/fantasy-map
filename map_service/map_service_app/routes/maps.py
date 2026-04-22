import logging
import typing
import uuid

import fastapi
import redis
import rq
from sqlalchemy import orm

from map_service_app import config
from map_service_app import crud
from map_service_app import database
from map_service_app import log_config
from map_service_app import schemas
from map_service_app import storage

router = fastapi.APIRouter()

SUPPORTED_CONTENT_TYPES = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
}


@router.post("/create", response_model=schemas.MapResponse)
def create_map_endpoint(
    request: fastapi.Request,
    map_data: schemas.MapCreate,
    user_id: str = fastapi.Header(..., alias="X-User-Id"),
    db: orm.Session = fastapi.Depends(database.get_db),
):
    user_uuid = uuid.UUID(user_id)

    log_config.log(request, logging.INFO, "map_create_started", user_id=str(user_uuid))

    try:
        map_obj = crud.create_map(db, user_uuid, map_data)
    except (ValueError, RuntimeError) as e:
        log_config.log(request, logging.WARNING, "map_create_failed", user_id=str(user_uuid), detail=str(e))
        raise fastapi.HTTPException(status_code=400, detail=str(e))

    log_config.log(request, logging.INFO, "map_create_finished", user_id=str(user_uuid), map_id=str(map_obj.id))
    return map_obj


@router.get("/all", response_model=schemas.ListMapCardResponse)
def get_all_maps_endpoint(
    request: fastapi.Request,
    page: int = fastapi.Query(1, alias="page", ge=1),
    size: int = fastapi.Query(10, alias="size", ge=1, le=100),
    q: typing.Optional[str] = fastapi.Query(None, alias="q"),
    tags: typing.Optional[str] = fastapi.Query(None, alias="tags"),
    tags_mode: str = fastapi.Query("any", alias="tags_mode"),
    db: orm.Session = fastapi.Depends(database.get_db),
):
    offset = (page - 1) * size
    tag_names: list[str] = [tag.strip() for tag in tags.split(",") if tag.strip()] if tags else []

    if tags_mode not in ("any", "all"):
        log_config.log(request, logging.WARNING, "maps_list_invalid_tags_mode", tags_mode=tags_mode)
        raise fastapi.HTTPException(status_code=400, detail="Invalid tags_mode. Must be 'any' or 'all'.")

    try:
        maps, total = crud.list_maps_catalog(
            db,
            q=q,
            tags=tag_names,
            tags_mode=tags_mode,
            offset=offset,
            limit=size,
        )
    except ValueError as e:
        log_config.log(request, logging.WARNING, "maps_list_failed", detail=str(e))
        raise fastapi.HTTPException(status_code=400, detail=str(e))

    return schemas.ListMapCardResponse(total=total, items=maps)


@router.get("/owned", response_model=schemas.ListMapCardResponse)
def get_owned_maps_endpoint(
    page: int = fastapi.Query(1, alias="page", ge=1),
    size: int = fastapi.Query(10, alias="size", ge=1, le=100),
    owner_id: uuid.UUID = fastapi.Header(..., alias="X-User-Id"),
    db: orm.Session = fastapi.Depends(database.get_db),
):
    offset = (page - 1) * size
    maps, total = crud.get_maps_by_owner(db, owner_id, offset=offset, limit=size)
    return schemas.ListMapCardResponse(total=total, items=maps)


@router.get("/tags", response_model=list[schemas.TagStatResponse])
def list_tags_endpoint(
    q: typing.Optional[str] = fastapi.Query(None, alias="q"),
    limit: int = fastapi.Query(50, alias="limit", ge=1, le=200),
    db: orm.Session = fastapi.Depends(database.get_db),
):
    rows = crud.list_tags(db, q=q, limit=limit)
    return [schemas.TagStatResponse(name=name, count=int(count)) for name, count in rows]


@router.get("/share/{share_id}", response_model=schemas.MapResponse)
def get_map_by_share_id_endpoint(
    request: fastapi.Request,
    share_id: str,
    db: orm.Session = fastapi.Depends(database.get_db),
):
    map_obj = crud.get_map_by_share_id(db, share_id)
    if not map_obj or map_obj.status != "ready":
        log_config.log(request, logging.INFO, "shared_map_not_found", share_id=share_id)
        raise fastapi.HTTPException(status_code=404, detail="Shared map not found")
    return map_obj


@router.get("/{map_id}", response_model=schemas.MapResponse)
def get_map_endpoint(
    request: fastapi.Request,
    map_id: uuid.UUID,
    user_id: typing.Optional[str] = fastapi.Header(None, alias="X-User-Id"),
    db: orm.Session = fastapi.Depends(database.get_db),
):
    map_obj = crud.get_map_by_id(db, map_id)
    if not map_obj:
        log_config.log(request, logging.INFO, "map_get_not_found", map_id=str(map_id))
        raise fastapi.HTTPException(status_code=404, detail="Map not found")

    is_owner = False
    if user_id:
        user_uuid = uuid.UUID(user_id)
        if crud.is_map_owned_by_user(db, user_uuid, map_id):
            is_owner = True

    if (map_obj.status != "ready" or map_obj.visibility != "public") and not is_owner:
        log_config.log(request, logging.INFO, "map_get_forbidden_hidden", map_id=str(map_id))
        raise fastapi.HTTPException(status_code=404, detail="Map not found")

    return map_obj


@router.put("/{map_id}", response_model=schemas.MapResponse)
def update_map_endpoint(
    request: fastapi.Request,
    map_id: uuid.UUID,
    data: schemas.MapUpdate,
    user_id: str = fastapi.Header(..., alias="X-User-Id"),
    db: orm.Session = fastapi.Depends(database.get_db),
):
    user_uuid = uuid.UUID(user_id)

    log_config.log(request, logging.INFO, "map_update_started", map_id=str(map_id), user_id=str(user_uuid))

    if not crud.is_map_owned_by_user(db, user_uuid, map_id):
        log_config.log(
            request,
            logging.WARNING,
            "map_update_forbidden",
            map_id=str(map_id),
            user_id=str(user_uuid)
        )
        raise fastapi.HTTPException(status_code=403, detail="You do not own this map")

    try:
        map_obj = crud.update_map(db, map_id, data)
        if not map_obj:
            log_config.log(
                request,
                logging.INFO,
                "map_update_not_found",
                map_id=str(map_id),
                user_id=str(user_uuid)
            )
            raise fastapi.HTTPException(status_code=404, detail="Map not found")
    except ValueError as e:
        log_config.log(
            request,
            logging.WARNING,
            "map_update_failed",
            map_id=str(map_id),
            user_id=str(user_uuid),
            detail=str(e)
        )
        raise fastapi.HTTPException(status_code=400, detail=str(e))

    log_config.log(request, logging.INFO, "map_update_finished", map_id=str(map_id), user_id=str(user_uuid))
    return map_obj


@router.delete("/{map_id}", status_code=fastapi.status.HTTP_204_NO_CONTENT)
def delete_map_endpoint(
    request: fastapi.Request,
    map_id: uuid.UUID,
    user_id: str = fastapi.Header(..., alias="X-User-Id"),
    db: orm.Session = fastapi.Depends(database.get_db),
):
    user_uuid = uuid.UUID(user_id)

    log_config.log(request, logging.INFO, "map_delete_started", map_id=str(map_id), user_id=str(user_uuid))

    if not crud.is_map_owned_by_user(db, user_uuid, map_id):
        log_config.log(
            request,
            logging.WARNING,
            "map_delete_forbidden",
            map_id=str(map_id),
            user_id=str(user_uuid)
        )
        raise fastapi.HTTPException(status_code=403, detail="You do not own this map")

    deleted = crud.delete_map(db, map_id)
    if not deleted:
        log_config.log(request, logging.INFO, "map_delete_not_found", map_id=str(map_id), user_id=str(user_uuid))
        raise fastapi.HTTPException(status_code=404, detail="Map not found")

    map_prefix = storage.build_map_prefix(map_id)
    try:
        deleted_count = storage.storage.delete_prefix(map_prefix)
    except storage.StorageError as e:
        log_config.log(
            request,
            logging.ERROR,
            "map_delete_storage_failed",
            map_id=str(map_id),
            user_id=str(user_uuid)
        )
        raise fastapi.HTTPException(
            status_code=500,
            detail=f"Failed to delete map files from storage: {str(e)}",
        )

    log_config.log(
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
    request: fastapi.Request,
    map_id: uuid.UUID,
    file: fastapi.UploadFile = fastapi.File(...),
    user_id: str = fastapi.Header(..., alias="X-User-Id"),
    db: orm.Session = fastapi.Depends(database.get_db),
):
    user_uuid = uuid.UUID(user_id)

    log_config.log(
        request,
        logging.INFO,
        "map_upload_started",
        map_id=str(map_id),
        user_id=str(user_uuid),
        filename=file.filename,
        content_type=file.content_type,
    )

    if not crud.is_map_owned_by_user(db, user_uuid, map_id):
        log_config.log(
            request,
            logging.WARNING,
            "map_upload_forbidden",
            map_id=str(map_id),
            user_id=str(user_uuid)
        )
        raise fastapi.HTTPException(status_code=403, detail="You do not own this map")

    map_obj = crud.get_map_by_id(db, map_id)
    if not map_obj:
        log_config.log(request, logging.INFO, "map_upload_not_found", map_id=str(map_id), user_id=str(user_uuid))
        raise fastapi.HTTPException(status_code=404, detail="Map not found")

    source_ext = SUPPORTED_CONTENT_TYPES.get(file.content_type)
    if source_ext is None:
        log_config.log(
            request,
            logging.WARNING,
            "map_upload_invalid_content_type",
            map_id=str(map_id),
            user_id=str(user_uuid),
            content_type=file.content_type,
        )
        raise fastapi.HTTPException(status_code=400, detail="Supported formats: PNG, JPEG/JPG, WEBP")

    source_prefix = storage.build_map_source_prefix(str(map_id))
    object_key = storage.build_map_source_key(map_id, source_ext)

    try:
        deleted_count = storage.storage.delete_prefix(source_prefix)
        log_config.log(
            request,
            logging.INFO,
            "map_old_source_deleted",
            map_id=str(map_id),
            user_id=str(user_uuid),
            deleted_count=deleted_count,
        )

        storage.storage.upload_fileobj(
            file_obj=file.file,
            object_key=object_key,
            content_type=file.content_type,
        )
    except storage.StorageError as e:
        log_config.log(
            request,
            logging.ERROR,
            "map_upload_storage_failed",
            map_id=str(map_id),
            user_id=str(user_uuid)
        )
        raise fastapi.HTTPException(status_code=500, detail=f"Failed to upload image to storage: {str(e)}")

    next_tiles_version = map_obj.tiles_version + 1

    redis_conn = redis.Redis.from_url(config.REDIS_URL)
    q = rq.Queue(connection=redis_conn)
    job = q.enqueue(
        config.TILE_SERVICE_TASK,
        str(map_id),
        source_ext,
        next_tiles_version,
        request.state.request_id,
    )

    log_config.log(
        request,
        logging.INFO,
        "tile_job_enqueued",
        map_id=str(map_id),
        user_id=str(user_uuid),
        job_id=job.id,
        source_ext=source_ext,
        next_tiles_version=next_tiles_version,
        current_tiles_version=map_obj.tiles_version,
    )

    return {
        "status": "image uploaded",
        "task": "tile generation started",
        "job_id": job.id,
        "next_tiles_version": next_tiles_version,
    }


@router.post("/{map_id}/tiles_info", status_code=fastapi.status.HTTP_202_ACCEPTED)
def tiles_info_endpoint(
    request: fastapi.Request,
    map_id: uuid.UUID,
    info: schemas.TilesInfo,
    db: orm.Session = fastapi.Depends(database.get_db),
):
    log_config.log(
        request,
        logging.INFO,
        "tiles_info_received",
        map_id=str(map_id),
        width=info.width,
        height=info.height,
        max_zoom=info.max_zoom,
        tiles_version=info.tiles_version,
    )

    current_map = crud.get_map_by_id(db, map_id)
    if not current_map:
        log_config.log(request, logging.WARNING, "tiles_info_map_not_found", map_id=str(map_id))
        raise fastapi.HTTPException(status_code=404, detail="Map not found")

    previous_tiles_version = current_map.tiles_version

    updated = crud.update_map_tiles_info(db, map_id, info)
    if not updated:
        log_config.log(request, logging.WARNING, "tiles_info_map_not_found", map_id=str(map_id))
        raise fastapi.HTTPException(status_code=404, detail="Map not found")

    old_version_deleted = 0

    if info.tiles_version > previous_tiles_version > 0:
        old_tiles_prefix = storage.build_map_tiles_version_prefix(str(map_id), previous_tiles_version)
        try:
            old_version_deleted = storage.storage.delete_prefix(old_tiles_prefix)
            log_config.log(
                request,
                logging.INFO,
                "old_tiles_version_deleted",
                map_id=str(map_id),
                deleted_tiles_version=previous_tiles_version,
                deleted_objects=old_version_deleted,
            )
        except storage.StorageError as e:
            log_config.log(
                request,
                logging.ERROR,
                "old_tiles_version_delete_failed",
                map_id=str(map_id),
                deleted_tiles_version=previous_tiles_version,
                detail=str(e),
            )

    if info.tiles_version < previous_tiles_version:
        log_config.log(
            request,
            logging.INFO,
            "tiles_info_ignored_outdated",
            map_id=str(map_id),
            callback_tiles_version=info.tiles_version,
            current_tiles_version=previous_tiles_version,
        )
    else:
        log_config.log(
            request,
            logging.INFO,
            "tiles_info_applied",
            map_id=str(map_id),
            tiles_version=updated.tiles_version,
            previous_tiles_version=previous_tiles_version,
            deleted_old_objects=old_version_deleted,
        )
    return


@router.post("/{map_id}/share", response_model=schemas.ShareIdResponse)
def create_share_endpoint(
    request: fastapi.Request,
    map_id: uuid.UUID,
    user_id: str = fastapi.Header(..., alias="X-User-Id"),
    db: orm.Session = fastapi.Depends(database.get_db),
):
    user_uuid = uuid.UUID(user_id)

    if not crud.is_map_owned_by_user(db, user_uuid, map_id):
        log_config.log(
            request,
            logging.WARNING,
            "share_create_forbidden",
            map_id=str(map_id),
            user_id=str(user_uuid)
        )
        raise fastapi.HTTPException(status_code=403, detail="You do not own this map")

    map_obj = crud.get_map_by_id(db, map_id)
    if not map_obj:
        log_config.log(
            request,
            logging.INFO,
            "share_create_map_not_found",
            map_id=str(map_id),
            user_id=str(user_uuid)
        )
        raise fastapi.HTTPException(status_code=404, detail="Map not found")

    if map_obj.status != "ready":
        log_config.log(
            request,
            logging.WARNING,
            "share_create_not_ready",
            map_id=str(map_id),
            user_id=str(user_uuid)
        )
        raise fastapi.HTTPException(status_code=409, detail="Only ready maps can be shared")

    try:
        sid = crud.create_share(db, map_id)
    except RuntimeError as e:
        log_config.log(
            request,
            logging.WARNING,
            "share_create_failed",
            map_id=str(map_id),
            user_id=str(user_uuid),
            detail=str(e)
        )
        raise fastapi.HTTPException(status_code=400, detail=str(e))

    if sid is None:
        log_config.log(
            request,
            logging.INFO,
            "share_create_map_not_found",
            map_id=str(map_id),
            user_id=str(user_uuid)
        )
        raise fastapi.HTTPException(status_code=404, detail="Map not found")

    log_config.log(
        request,
        logging.INFO,
        "share_create_finished",
        map_id=str(map_id),
        user_id=str(user_uuid),
        share_id=sid
    )
    return schemas.ShareIdResponse(share_id=sid)


@router.delete("/{map_id}/share", status_code=fastapi.status.HTTP_204_NO_CONTENT)
def delete_share_endpoint(
    request: fastapi.Request,
    map_id: uuid.UUID,
    user_id: str = fastapi.Header(..., alias="X-User-Id"),
    db: orm.Session = fastapi.Depends(database.get_db),
):
    user_uuid = uuid.UUID(user_id)

    if not crud.is_map_owned_by_user(db, user_uuid, map_id):
        log_config.log(
            request,
            logging.WARNING,
            "share_delete_forbidden",
            map_id=str(map_id),
            user_id=str(user_uuid)
        )
        raise fastapi.HTTPException(status_code=403, detail="You do not own this map")

    ok = crud.delete_share(db, map_id)
    if not ok:
        log_config.log(

            request,

            logging.INFO,

            "share_delete_map_not_found",

            map_id=str(map_id),

            user_id=str(user_uuid)

        )
        raise fastapi.HTTPException(status_code=404, detail="Map not found")

    log_config.log(request, logging.INFO, "share_delete_finished", map_id=str(map_id), user_id=str(user_uuid))
    return


@router.get("/{map_id}/share", response_model=schemas.ShareIdResponse)
def get_share_id_endpoint(
    request: fastapi.Request,
    map_id: uuid.UUID,
    user_id: str = fastapi.Header(..., alias="X-User-Id"),
    db: orm.Session = fastapi.Depends(database.get_db),
):
    user_uuid = uuid.UUID(user_id)

    if not crud.is_map_owned_by_user(db, user_uuid, map_id):
        log_config.log(
            request,
            logging.WARNING,
            "share_get_forbidden",
            map_id=str(map_id),
            user_id=str(user_uuid)
        )
        raise fastapi.HTTPException(status_code=403, detail="You do not own this map")

    map_obj = crud.get_map_by_id(db, map_id)
    if not map_obj:
        log_config.log(
            request,
            logging.INFO,
            "share_get_map_not_found",
            map_id=str(map_id),
            user_id=str(user_uuid)
        )
        raise fastapi.HTTPException(status_code=404, detail="Map not found")
    if map_obj.status != "ready":
        log_config.log(
            request,
            logging.WARNING,
            "share_get_not_ready",
            map_id=str(map_id),
            user_id=str(user_uuid)
        )
        raise fastapi.HTTPException(status_code=409, detail="Only ready maps can be shared")

    return schemas.ShareIdResponse(share_id=map_obj.share_id)