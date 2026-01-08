import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Header, Query
from sqlalchemy.orm import Session
from uuid import UUID
from redis import Redis
from rq import Queue

from map_service_app.crud import (create_map, update_map, delete_map, get_map_by_id, get_maps_by_owner,
                                  is_map_owned_by_user, get_all_maps, get_map_by_share_id)
from map_service_app.schemas import MapCreate, MapUpdate, MapResponse, ListMapResponse
from map_service_app.database import get_db
from map_service_app.config import REDIS_URL, SOURCE_IMAGES_PATH, TILES_BASE_PATH, TILE_SERVICE_TASK

router = APIRouter()

@router.post("/create", response_model=MapResponse)
async def create_map_endpoint(map_data: MapCreate,
                     user_id: str = Header(..., alias="X-User-Id"),
                     db: Session = Depends(get_db)):
    user_id = UUID(user_id)
    map_obj = create_map(db, user_id, map_data)
    return map_obj

@router.get("/all", response_model=ListMapResponse)
async def get_all_maps_endpoint(
        page: int = Query(1, alias="page", ge=1),
        size: int = Query(10, alias="size", ge=1, le=100),
        db: Session = Depends(get_db)):
    offset = (page - 1) * size
    maps, total = get_all_maps(db, offset=offset, limit=size)
    if not maps:
        raise HTTPException(status_code=404, detail="Maps not found")
    maps_dict = [map_obj.__dict__ for map_obj in maps]
    return ListMapResponse(total=total, items=maps_dict)

@router.get("/owned", response_model=ListMapResponse)
async def get_owned_maps_endpoint(
        page: int = Query(1, alias="page", ge=1),
        size: int = Query(10, alias="size", ge=1, le=100),
        owner_id: UUID = Header(..., alias="X-User-Id"),
        db: Session = Depends(get_db)):
    offset = (page - 1) * size
    maps, total = get_maps_by_owner(db, owner_id, offset=offset, limit=size)
    if not maps:
        raise HTTPException(status_code=404, detail="Maps not found")
    maps_dict = [map_obj.__dict__ for map_obj in maps]
    return ListMapResponse(total=total, items=maps_dict)

@router.get("/{map_id}", response_model=MapResponse)
async def get_map_endpoint(map_id: UUID, user_id: str | None = Header(None, alias="X-User-Id"), db: Session = Depends(get_db)):
    map_obj = get_map_by_id(db, map_id)
    if not map_obj:
        raise HTTPException(status_code=404, detail="Map not found")

    is_owner = False

    if user_id:
        user_id = UUID(user_id)
        if is_map_owned_by_user(db, user_id, map_id):
            is_owner = True

    resp = map_obj.__dict__
    if not is_owner:
        resp.pop("share_id")
    else:
        sid = resp.get("share_id")
        if sid:
            resp["share_url"] = f"/maps/share/{sid}"

    return resp

@router.put("/{map_id}", response_model=MapResponse)
async def update_map_endpoint(map_id: UUID,
                              data: MapUpdate,
                              user_id: str = Header(..., alias="X-User-Id"),
                              db: Session = Depends(get_db)):
    user_id = UUID(user_id)
    if not is_map_owned_by_user(db, user_id, map_id):
        raise HTTPException(status_code=403, detail="You do not own this map")

    map_obj = update_map(db, map_id, data)
    if not map_obj:
        raise HTTPException(status_code=404, detail="Map not found")

    resp = map_obj.__dict__
    sid = resp.get("share_id")
    if sid:
        resp["share_url"] = f"/maps/share/{sid}"
    return resp

@router.delete("/{map_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_map_endpoint(map_id: UUID,
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

    return

@router.get("/share/{share_id}", response_model=MapResponse)
def get_map_by_share_id_endpoint(share_id: str, db: Session = Depends(get_db)):
    map_obj = get_map_by_share_id(db, share_id)
    if not map_obj:
        raise HTTPException(status_code=404, detail="Shared map not found")

    resp = map_obj.__dict__
    resp.pop("share_id", None)
    return resp

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
