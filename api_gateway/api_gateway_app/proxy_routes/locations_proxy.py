import logging
import typing
import uuid

import httpx
import fastapi

from api_gateway_app import config
from api_gateway_app import log_config
from api_gateway_app import schemas
from api_gateway_app import security
from api_gateway_app import utils

router = fastapi.APIRouter()


@router.post("/create", response_model=schemas.LocationResponse)
async def create_location(
    request: fastapi.Request,
    location_data: schemas.LocationCreateRequest,
    user_id: uuid.UUID = security.require_user_id(),
):
    body = location_data.model_dump(mode="json")

    log_config.log(request, logging.INFO, "location_create_started", user_id=str(user_id))

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{config.MAP_SERVICE_URL}/locations/create",
                json=body,
                headers=utils.build_headers(request, user_id),
            )
        except httpx.RequestError:
            log_config.log(request, logging.ERROR, "location_create_service_unavailable", user_id=str(user_id))
            raise fastapi.HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        log_config.log(
            request,
            logging.WARNING,
            "location_create_failed",
            user_id=str(user_id),
            status_code=response.status_code,
            response_error=response.text,
        )
        return utils.forward_error(response)

    result = response.json()
    log_config.log(
        request,
        logging.INFO,
        "location_create_finished",
        user_id=str(user_id),
        location_id=result.get("id"),
        map_id=result.get("map_id"),
    )
    return result


@router.get("/", response_model=typing.List[schemas.LocationResponse])
async def list_locations(request: fastapi.Request, map_id: uuid.UUID = fastapi.Query(...)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{config.MAP_SERVICE_URL}/locations/",
                params={"map_id": str(map_id)},
                headers=utils.build_headers(request),
            )
        except httpx.RequestError:
            log_config.log(request, logging.ERROR, "locations_list_service_unavailable", map_id=str(map_id))
            raise fastapi.HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code == 404:
        return []

    if response.status_code != 200:
        log_config.log(
            request,
            logging.WARNING,
            "locations_list_failed",
            map_id=str(map_id),
            status_code=response.status_code,
            response_error=response.text,
        )
        return utils.forward_error(response)

    return response.json()


@router.get("/{location_id}", response_model=schemas.LocationResponse)
async def get_location(request: fastapi.Request, location_id: uuid.UUID):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{config.MAP_SERVICE_URL}/locations/{location_id}",
                headers=utils.build_headers(request),
            )
        except httpx.RequestError:
            log_config.log(request, logging.ERROR, "location_get_service_unavailable", location_id=str(location_id))
            raise fastapi.HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        log_config.log(
            request,
            logging.WARNING,
            "location_get_failed",
            location_id=str(location_id),
            status_code=response.status_code,
            response_error=response.text,
        )
        return utils.forward_error(response)

    return response.json()


@router.put("/{location_id}", response_model=schemas.LocationResponse)
async def update_location(
    request: fastapi.Request,
    location_id: uuid.UUID,
    location_data: schemas.LocationUpdateRequest,
    user_id: uuid.UUID = security.require_user_id(),
):
    body = location_data.model_dump(mode="json")

    log_config.log(
        request,
        logging.INFO,
        "location_update_started",
        location_id=str(location_id),
        user_id=str(user_id),
    )

    async with httpx.AsyncClient() as client:
        try:
            response = await client.put(
                f"{config.MAP_SERVICE_URL}/locations/{location_id}",
                json=body,
                headers=utils.build_headers(request, user_id),
            )
        except httpx.RequestError:
            log_config.log(
                request,
                logging.ERROR,
                "location_update_service_unavailable",
                location_id=str(location_id),
                user_id=str(user_id),
            )
            raise fastapi.HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        log_config.log(
            request,
            logging.WARNING,
            "location_update_failed",
            location_id=str(location_id),
            user_id=str(user_id),
            status_code=response.status_code,
            response_error=response.text,
        )
        return utils.forward_error(response)

    log_config.log(
        request,
        logging.INFO,
        "location_update_finished",
        location_id=str(location_id),
        user_id=str(user_id),
    )
    return response.json()


@router.delete("/{location_id}", status_code=fastapi.status.HTTP_204_NO_CONTENT)
async def delete_location(
        request: fastapi.Request,
        location_id: uuid.UUID,
        user_id: uuid.UUID = security.require_user_id()
):
    log_config.log(
        request,
        logging.INFO,
        "location_delete_started",
        location_id=str(location_id),
        user_id=str(user_id),
    )

    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(
                f"{config.MAP_SERVICE_URL}/locations/{location_id}",
                headers=utils.build_headers(request, user_id),
            )
        except httpx.RequestError:
            log_config.log(
                request,
                logging.ERROR,
                "location_delete_service_unavailable",
                location_id=str(location_id),
                user_id=str(user_id),
            )
            raise fastapi.HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 204:
        log_config.log(
            request,
            logging.WARNING,
            "location_delete_failed",
            location_id=str(location_id),
            user_id=str(user_id),
            status_code=response.status_code,
            response_error=response.text,
        )
        return utils.forward_error(response)

    log_config.log(
        request,
        logging.INFO,
        "location_delete_finished",
        location_id=str(location_id),
        user_id=str(user_id),
    )
    return