from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from map_service_app.crud import (create_location, update_location, delete_location, get_location_by_id,
                                  get_locations_by_map_id, is_map_owned_by_user, is_location_owned_by_user)
from map_service_app.schemas import LocationCreate, LocationUpdate, LocationResponse
from map_service_app.database import get_db

router = APIRouter()

@router.post("/create", response_model=LocationResponse)
async def create_location_endpoint(location_data: LocationCreate,
                          user_id: str = Header(..., alias="X-User-Id"),
                          db: Session = Depends(get_db)):
    user_id = UUID(user_id)
    if not is_map_owned_by_user(db, user_id, location_data.map_id):
        raise HTTPException(status_code=404, detail="Map not owned by user")
    location = create_location(db=db, location_in=location_data)
    return location

@router.get("/", response_model=List[LocationResponse])
async def list_locations_endpoint(map_id: UUID = Query(...), db: Session = Depends(get_db)):
    locations = get_locations_by_map_id(db=db, map_id=map_id)
    return locations

@router.get("/{location_id}", response_model=LocationResponse)
async def get_location_endpoint(location_id: UUID, db: Session = Depends(get_db)):
    location = get_location_by_id(db=db, location_id=location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location

@router.put("/{location_id}", response_model=LocationResponse)
async def update_location_endpoint(location_id: UUID,
                          data: LocationUpdate,
                          user_id: str = Header(..., alias="X-User-Id"),
                          db: Session = Depends(get_db)):
    user_id = UUID(user_id)
    if not is_location_owned_by_user(db, user_id, location_id):
        raise HTTPException(status_code=404, detail="Location not owned by user")
    location = update_location(db=db, location_id=location_id, location_in=data)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location

@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location_endpoint(location_id: UUID,
                          user_id: str = Header(..., alias="X-User-Id"),
                          db: Session = Depends(get_db)):
    user_id = UUID(user_id)
    if not is_location_owned_by_user(db, user_id, location_id):
        raise HTTPException(status_code=404, detail="Location not owned by user")
    success = delete_location(db=db, location_id=location_id)
    if not success:
        raise HTTPException(status_code=404, detail="Location not found")
    return
