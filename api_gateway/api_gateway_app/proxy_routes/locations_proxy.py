import logging
from typing import List
from uuid import UUID

import httpx
from fastapi import APIRouter, HTTPException, Query, Request
from starlette import status

from api_gateway_app.config import MAP_SERVICE_URL
from api_gateway_app.log_config import log
from api_gateway_app.schemas import LocationCreateRequest, LocationUpdateRequest, LocationResponse
from api_gateway_app.security import require_user_id
from api_gateway_app.utils import forward_error, build_headers

router = APIRouter()


@router.post("/create", response_model=LocationResponse)
async def create_location(
    request: Request,
    location_data: LocationCreateRequest,
    user_id: UUID = require_user_id(),
):
    body = location_data.model_dump(mode="json")

    log(request, logging.INFO, "location_create_started", user_id=str(user_id))

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{MAP_SERVICE_URL}/locations/create",
                json=body,
                headers=build_headers(request, user_id),
            )
        except httpx.RequestError:
            log(request, logging.ERROR, "location_create_service_unavailable", user_id=str(user_id))
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        log(
            request,
            logging.WARNING,
            "location_create_failed",
            user_id=str(user_id),
            status_code=response.status_code,
            response_error=response.text,
        )
        return forward_error(response)

    result = response.json()
    log(
        request,
        logging.INFO,
        "location_create_finished",
        user_id=str(user_id),
        location_id=result.get("id"),
        map_id=result.get("map_id"),
    )
    return result


@router.get("/", response_model=List[LocationResponse])
async def list_locations(request: Request, map_id: UUID = Query(...)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{MAP_SERVICE_URL}/locations/",
                params={"map_id": str(map_id)},
                headers=build_headers(request),
            )
        except httpx.RequestError:
            log(request, logging.ERROR, "locations_list_service_unavailable", map_id=str(map_id))
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code == 404:
        return []

    if response.status_code != 200:
        log(
            request,
            logging.WARNING,
            "locations_list_failed",
            map_id=str(map_id),
            status_code=response.status_code,
            response_error=response.text,
        )
        return forward_error(response)

    return response.json()


@router.get("/{location_id}", response_model=LocationResponse)
async def get_location(request: Request, location_id: UUID):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{MAP_SERVICE_URL}/locations/{location_id}",
                headers=build_headers(request),
            )
        except httpx.RequestError:
            log(request, logging.ERROR, "location_get_service_unavailable", location_id=str(location_id))
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        log(
            request,
            logging.WARNING,
            "location_get_failed",
            location_id=str(location_id),
            status_code=response.status_code,
            response_error=response.text,
        )
        return forward_error(response)

    return response.json()


@router.put("/{location_id}", response_model=LocationResponse)
async def update_location(
    request: Request,
    location_id: UUID,
    location_data: LocationUpdateRequest,
    user_id: UUID = require_user_id(),
):
    body = location_data.model_dump(mode="json")

    log(
        request,
        logging.INFO,
        "location_update_started",
        location_id=str(location_id),
        user_id=str(user_id),
    )

    async with httpx.AsyncClient() as client:
        try:
            response = await client.put(
                f"{MAP_SERVICE_URL}/locations/{location_id}",
                json=body,
                headers=build_headers(request, user_id),
            )
        except httpx.RequestError:
            log(
                request,
                logging.ERROR,
                "location_update_service_unavailable",
                location_id=str(location_id),
                user_id=str(user_id),
            )
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        log(
            request,
            logging.WARNING,
            "location_update_failed",
            location_id=str(location_id),
            user_id=str(user_id),
            status_code=response.status_code,
            response_error=response.text,
        )
        return forward_error(response)

    log(
        request,
        logging.INFO,
        "location_update_finished",
        location_id=str(location_id),
        user_id=str(user_id),
    )
    return response.json()


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(request: Request, location_id: UUID, user_id: UUID = require_user_id()):
    log(
        request,
        logging.INFO,
        "location_delete_started",
        location_id=str(location_id),
        user_id=str(user_id),
    )

    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(
                f"{MAP_SERVICE_URL}/locations/{location_id}",
                headers=build_headers(request, user_id),
            )
        except httpx.RequestError:
            log(
                request,
                logging.ERROR,
                "location_delete_service_unavailable",
                location_id=str(location_id),
                user_id=str(user_id),
            )
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 204:
        log(
            request,
            logging.WARNING,
            "location_delete_failed",
            location_id=str(location_id),
            user_id=str(user_id),
            status_code=response.status_code,
            response_error=response.text,
        )
        return forward_error(response)

    log(
        request,
        logging.INFO,
        "location_delete_finished",
        location_id=str(location_id),
        user_id=str(user_id),
    )
    return