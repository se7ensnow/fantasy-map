import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query, Header, Request
from sqlalchemy.orm import Session

from map_service_app.crud import (
    create_location,
    update_location,
    delete_location,
    get_location_by_id,
    get_locations_by_map_id,
    is_map_owned_by_user,
    is_location_owned_by_user,
)
from map_service_app.database import get_db
from map_service_app.log_config import log
from map_service_app.schemas import LocationCreate, LocationUpdate, LocationResponse

router = APIRouter()


@router.post("/create", response_model=LocationResponse)
def create_location_endpoint(
    request: Request,
    location_data: LocationCreate,
    user_id: str = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    user_uuid = UUID(user_id)

    log(request, logging.INFO, "location_create_started", user_id=str(user_uuid), map_id=str(location_data.map_id))

    if not is_map_owned_by_user(db, user_uuid, location_data.map_id):
        log(request, logging.WARNING, "location_create_forbidden", user_id=str(user_uuid), map_id=str(location_data.map_id))
        raise HTTPException(status_code=404, detail="Map not owned by user")

    location = create_location(db=db, location_in=location_data)
    log(request, logging.INFO, "location_create_finished", user_id=str(user_uuid), location_id=str(location.id))
    return location


@router.get("/", response_model=List[LocationResponse])
def list_locations_endpoint(request: Request, map_id: UUID = Query(...), db: Session = Depends(get_db)):
    return get_locations_by_map_id(db=db, map_id=map_id)


@router.get("/{location_id}", response_model=LocationResponse)
def get_location_endpoint(request: Request, location_id: UUID, db: Session = Depends(get_db)):
    location = get_location_by_id(db=db, location_id=location_id)
    if not location:
        log(request, logging.INFO, "location_get_not_found", location_id=str(location_id))
        raise HTTPException(status_code=404, detail="Location not found")
    return location


@router.put("/{location_id}", response_model=LocationResponse)
def update_location_endpoint(
    request: Request,
    location_id: UUID,
    data: LocationUpdate,
    user_id: str = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    user_uuid = UUID(user_id)

    log(request, logging.INFO, "location_update_started", location_id=str(location_id), user_id=str(user_uuid))

    if not is_location_owned_by_user(db, user_uuid, location_id):
        log(request, logging.WARNING, "location_update_forbidden", location_id=str(location_id), user_id=str(user_uuid))
        raise HTTPException(status_code=404, detail="Location not owned by user")

    location = update_location(db=db, location_id=location_id, location_in=data)
    if not location:
        log(request, logging.INFO, "location_update_not_found", location_id=str(location_id), user_id=str(user_uuid))
        raise HTTPException(status_code=404, detail="Location not found")

    log(request, logging.INFO, "location_update_finished", location_id=str(location_id), user_id=str(user_uuid))
    return location


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location_endpoint(
    request: Request,
    location_id: UUID,
    user_id: str = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    user_uuid = UUID(user_id)

    log(request, logging.INFO, "location_delete_started", location_id=str(location_id), user_id=str(user_uuid))

    if not is_location_owned_by_user(db, user_uuid, location_id):
        log(request, logging.WARNING, "location_delete_forbidden", location_id=str(location_id), user_id=str(user_uuid))
        raise HTTPException(status_code=404, detail="Location not owned by user")

    success = delete_location(db=db, location_id=location_id)
    if not success:
        log(request, logging.INFO, "location_delete_not_found", location_id=str(location_id), user_id=str(user_uuid))
        raise HTTPException(status_code=404, detail="Location not found")

    log(request, logging.INFO, "location_delete_finished", location_id=str(location_id), user_id=str(user_uuid))
    return