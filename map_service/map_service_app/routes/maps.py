import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Header, Query
from typing import Optional
from sqlalchemy.orm import Session
from uuid import UUID
from redis import Redis
from rq import Queue

from map_service_app.crud import (create_map, update_map, delete_map, get_map_by_id, get_maps_by_owner,
                                  is_map_owned_by_user, list_maps_catalog, list_tags, get_map_by_share_id,
                                  update_map_tiles_info, create_share, delete_share)
from map_service_app.schemas import (MapCreate, MapUpdate, ListMapCardResponse, MapResponse, TagStatResponse, TilesInfo,
                                     ShareIdResponse)
from map_service_app.database import get_db
from map_service_app.config import REDIS_URL, SOURCE_IMAGES_PATH, TILES_BASE_PATH, TILE_SERVICE_TASK

router = APIRouter()


@router.post("/create", response_model=MapResponse)
def create_map_endpoint(map_data: MapCreate,
                              user_id: str = Header(..., alias="X-User-Id"),
                              db: Session = Depends(get_db)):
    user_id = UUID(user_id)
    try:
        map_obj = create_map(db, user_id, map_data)
    except (ValueError, RuntimeError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    return map_obj


@router.get("/all", response_model=ListMapCardResponse)
def get_all_maps_endpoint(
        page: int = Query(1, alias="page", ge=1),
        size: int = Query(10, alias="size", ge=1, le=100),
        q: Optional[str] = Query(None, alias="q"),
        tags: Optional[str] = Query(None, alias="tags"),
        tags_mode: str = Query("any", alias="tags_mode"),
        db: Session = Depends(get_db)):
    offset = (page - 1) * size

    tag_names: list[str] = []
    if tags:
        tag_names = [tag.strip() for tag in tags.split(",") if tag.strip()]

    if tags_mode not in ("any", "all"):
        raise HTTPException(status_code=400, detail="Invalid tags_mode. Must be 'any' or 'all'.")

    try:
        maps, total = list_maps_catalog(
            db,
            q=q,
            tags=tag_names,
            tags_mode=tags_mode,
            offset=offset,
            limit=size
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return ListMapCardResponse(total=total, items=maps)


@router.get("/owned", response_model=ListMapCardResponse)
def get_owned_maps_endpoint(
        page: int = Query(1, alias="page", ge=1),
        size: int = Query(10, alias="size", ge=1, le=100),
        owner_id: UUID = Header(..., alias="X-User-Id"),
        db: Session = Depends(get_db)):
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
def get_map_by_share_id_endpoint(share_id: str, db: Session = Depends(get_db)):
    map_obj = get_map_by_share_id(db, share_id)
    if not map_obj:
        raise HTTPException(status_code=404, detail="Shared map not found")
    return map_obj


@router.get("/{map_id}", response_model=MapResponse)
def get_map_endpoint(
        map_id: UUID,
        user_id: Optional[str] = Header(None, alias="X-User-Id"),
        db: Session = Depends(get_db)
):
    map_obj = get_map_by_id(db, map_id)
    if not map_obj:
        raise HTTPException(status_code=404, detail="Map not found")

    is_owner = False

    if user_id:
        user_id = UUID(user_id)
        if is_map_owned_by_user(db, user_id, map_id):
            is_owner = True

    if map_obj.visibility != "public" and not is_owner:
        raise HTTPException(status_code=404, detail="Map not found")

    return map_obj



@router.put("/{map_id}", response_model=MapResponse)
def update_map_endpoint(map_id: UUID,
                              data: MapUpdate,
                              user_id: str = Header(..., alias="X-User-Id"),
                              db: Session = Depends(get_db)):
    user_id = UUID(user_id)
    if not is_map_owned_by_user(db, user_id, map_id):
        raise HTTPException(status_code=403, detail="You do not own this map")

    try:
        map_obj = update_map(db, map_id, data)
        if not map_obj:
            raise HTTPException(status_code=404, detail="Map not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return map_obj


@router.delete("/{map_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_map_endpoint(map_id: UUID,
                              user_id: str = Header(..., alias="X-User-Id"),
                              db: Session = Depends(get_db)):
    user_id = UUID(user_id)
    if not is_map_owned_by_user(db, user_id, map_id):
        raise HTTPException(status_code=403, detail="You do not own this map")

    deleted = delete_map(db, map_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Map not found")

    tiles_dir = os.path.join(TILES_BASE_PATH, str(map_id))
    if os.path.isdir(tiles_dir):
        shutil.rmtree(tiles_dir)

    src_dir = os.path.join(SOURCE_IMAGES_PATH, str(map_id))
    if os.path.isdir(src_dir):
        shutil.rmtree(src_dir)

    return


@router.post("/{map_id}/upload-image")
async def upload_image_endpoint(map_id: UUID,
                                file: UploadFile = File(...),
                                user_id: str = Header(..., alias="X-User-Id"),
                                db: Session = Depends(get_db)):
    user_id = UUID(user_id)
    if not is_map_owned_by_user(db, user_id, map_id):
        raise HTTPException(status_code=403, detail="You do not own this map")

    map_obj = get_map_by_id(db, map_id)
    if not map_obj:
        raise HTTPException(status_code=404, detail="Map not found")

    print('found map_obj')

    if file.content_type != "image/png":
        raise HTTPException(status_code=400, detail="Only PNG images are supported")

    save_dir = os.path.join(SOURCE_IMAGES_PATH, str(map_id))
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, "source.png")

    with open(save_path, mode="wb") as f:
        f.write(await file.read())

    redis_conn = Redis.from_url(REDIS_URL)
    q = Queue(connection=redis_conn)
    q.enqueue(TILE_SERVICE_TASK, map_id)

    return {"status": "image uploaded", "task": "tile generation started"}


@router.post("/{map_id}/tiles_info", status_code=status.HTTP_202_ACCEPTED)
def tiles_info_endpoint(map_id: UUID, info: TilesInfo, db: Session = Depends(get_db)):
    updated = update_map_tiles_info(db, map_id, info)

    if not updated:
        raise HTTPException(status_code=404, detail="Map not found")

    return


@router.post("/{map_id}/share", response_model=ShareIdResponse)
def create_share_endpoint(
    map_id: UUID,
    user_id: str = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    user_uuid = UUID(user_id)
    if not is_map_owned_by_user(db, user_uuid, map_id):
        raise HTTPException(status_code=403, detail="You do not own this map")

    try:
        sid = create_share(db, map_id)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if sid is None:
        raise HTTPException(status_code=404, detail="Map not found")

    return ShareIdResponse(share_id=sid)


@router.delete("/{map_id}/share", status_code=status.HTTP_204_NO_CONTENT)
def delete_share_endpoint(
    map_id: UUID,
    user_id: str = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    user_uuid = UUID(user_id)
    if not is_map_owned_by_user(db, user_uuid, map_id):
        raise HTTPException(status_code=403, detail="You do not own this map")

    ok = delete_share(db, map_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Map not found")
    return


@router.get("/{map_id}/share", response_model=ShareIdResponse)
def get_share_id_endpoint(
    map_id: UUID,
    user_id: str = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    user_uuid = UUID(user_id)
    if not is_map_owned_by_user(db, user_uuid, map_id):
        raise HTTPException(status_code=403, detail="You do not own this map")

    map_obj = get_map_by_id(db, map_id)
    if not map_obj:
        raise HTTPException(status_code=404, detail="Map not found")

    return ShareIdResponse(share_id=map_obj.share_id)