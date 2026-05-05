import logging
import typing
import uuid

import fastapi
from sqlalchemy import orm

from map_service_app import crud
from map_service_app import database
from map_service_app import log_config
from map_service_app import schemas

router = fastapi.APIRouter()


@router.post("/create", response_model=schemas.LocationResponse)
def create_location_endpoint(
    request: fastapi.Request,
    location_data: schemas.LocationCreate,
    user_id: str = fastapi.Header(..., alias="X-User-Id"),
    db: orm.Session = fastapi.Depends(database.get_db),
):
    user_uuid = uuid.UUID(user_id)

    log_config.log(request, logging.INFO, "location_create_started", user_id=str(user_uuid), map_id=str(location_data.map_id))

    if not crud.is_map_owned_by_user(db, user_uuid, location_data.map_id):
        log_config.log(request, logging.WARNING, "location_create_forbidden", user_id=str(user_uuid), map_id=str(location_data.map_id))
        raise fastapi.HTTPException(status_code=404, detail="Map not owned by user")

    location = crud.create_location(db=db, location_in=location_data)
    log_config.log(request, logging.INFO, "location_create_finished", user_id=str(user_uuid), location_id=str(location.id))
    return location


@router.get("/", response_model=typing.List[schemas.LocationResponse])
def list_locations_endpoint(
    request: fastapi.Request,
    map_id: uuid.UUID = fastapi.Query(...),
    db: orm.Session = fastapi.Depends(database.get_db),
):
    return crud.get_locations_by_map_id(db=db, map_id=map_id)


@router.get("/{location_id}", response_model=schemas.LocationResponse)
def get_location_endpoint(
    request: fastapi.Request,
    location_id: uuid.UUID,
    db: orm.Session = fastapi.Depends(database.get_db),
):
    location = crud.get_location_by_id(db=db, location_id=location_id)
    if not location:
        log_config.log(request, logging.INFO, "location_get_not_found", location_id=str(location_id))
        raise fastapi.HTTPException(status_code=404, detail="Location not found")
    return location


@router.put("/{location_id}", response_model=schemas.LocationResponse)
def update_location_endpoint(
    request: fastapi.Request,
    location_id: uuid.UUID,
    data: schemas.LocationUpdate,
    user_id: str = fastapi.Header(..., alias="X-User-Id"),
    db: orm.Session = fastapi.Depends(database.get_db),
):
    user_uuid = uuid.UUID(user_id)

    log_config.log(request, logging.INFO, "location_update_started", location_id=str(location_id), user_id=str(user_uuid))

    if not crud.is_location_owned_by_user(db, user_uuid, location_id):
        log_config.log(request, logging.WARNING, "location_update_forbidden", location_id=str(location_id), user_id=str(user_uuid))
        raise fastapi.HTTPException(status_code=404, detail="Location not owned by user")

    location = crud.update_location(db=db, location_id=location_id, location_in=data)
    if not location:
        log_config.log(request, logging.INFO, "location_update_not_found", location_id=str(location_id), user_id=str(user_uuid))
        raise fastapi.HTTPException(status_code=404, detail="Location not found")

    log_config.log(request, logging.INFO, "location_update_finished", location_id=str(location_id), user_id=str(user_uuid))
    return location


@router.delete("/{location_id}", status_code=fastapi.status.HTTP_204_NO_CONTENT)
def delete_location_endpoint(
    request: fastapi.Request,
    location_id: uuid.UUID,
    user_id: str = fastapi.Header(..., alias="X-User-Id"),
    db: orm.Session = fastapi.Depends(database.get_db),
):
    user_uuid = uuid.UUID(user_id)

    log_config.log(request, logging.INFO, "location_delete_started", location_id=str(location_id), user_id=str(user_uuid))

    if not crud.is_location_owned_by_user(db, user_uuid, location_id):
        log_config.log(request, logging.WARNING, "location_delete_forbidden", location_id=str(location_id), user_id=str(user_uuid))
        raise fastapi.HTTPException(status_code=404, detail="Location not owned by user")

    success = crud.delete_location(db=db, location_id=location_id)
    if not success:
        log_config.log(request, logging.INFO, "location_delete_not_found", location_id=str(location_id), user_id=str(user_uuid))
        raise fastapi.HTTPException(status_code=404, detail="Location not found")

    log_config.log(request, logging.INFO, "location_delete_finished", location_id=str(location_id), user_id=str(user_uuid))
    return