from fastapi import APIRouter, HTTPException, Depends, Query
import httpx
from uuid import UUID
from typing import List

from starlette import status

from api_gateway_app.config import MAP_SERVICE_URL
from api_gateway_app.security import require_user_id
from api_gateway_app.schemas import LocationCreateRequest, LocationUpdateRequest, LocationResponse

router = APIRouter()

@router.post("/create", response_model=LocationResponse)
async def create_location(location_data: LocationCreateRequest, user_id: UUID = require_user_id()):
    body = location_data.model_dump_json()

    headers = {
        "X-User-Id": str(user_id)
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{MAP_SERVICE_URL}/locations/create",
                content=body,
                headers=headers
            )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()

@router.get("/", response_model=List[LocationResponse])
async def list_locations(map_id: UUID = Query(...)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{MAP_SERVICE_URL}/locations/",
                params={"map_id": str(map_id)},
            )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code == 404:
        return []

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()

@router.get("/{location_id}", response_model=LocationResponse)
async def get_location(location_id: UUID):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{MAP_SERVICE_URL}/locations/{location_id}"
            )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()

@router.put("/{location_id}", response_model=LocationResponse)
async def update_location(location_id: UUID, location_data: LocationUpdateRequest, user_id: UUID = require_user_id()):
    body = location_data.model_dump_json()

    headers = {
        "X-User-Id": str(user_id)
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.put(
                f"{MAP_SERVICE_URL}/locations/{location_id}",
                content=body,
                headers=headers
            )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()

@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(location_id: UUID, user_id: UUID = require_user_id()):
    headers = {
        "X-User-Id": str(user_id)
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(
                f"{MAP_SERVICE_URL}/locations/{location_id}",
                headers=headers
            )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 204:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return