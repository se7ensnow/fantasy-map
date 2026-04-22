import logging
import uuid

import httpx
import fastapi

from api_gateway_app import config
from api_gateway_app import log_config
from api_gateway_app import schemas
from api_gateway_app import security
from api_gateway_app import utils

router = fastapi.APIRouter()


@router.get("/me", response_model=schemas.UserResponse)
async def get_me(request: fastapi.Request, user_id: uuid.UUID = security.require_user_id()):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{config.USER_SERVICE_URL}/users/me",
                headers=utils.build_headers(request, user_id),
            )
        except httpx.RequestError:
            log_config.log(request, logging.ERROR, "user_me_service_unavailable", user_id=str(user_id))
            raise fastapi.HTTPException(status_code=503, detail="User service unavailable.")

    if response.status_code != 200:
        log_config.log(
            request,
            logging.WARNING,
            "user_me_failed",
            user_id=str(user_id),
            status_code=response.status_code,
            response_error=response.text,
        )
        return utils.forward_error(response)

    return response.json()


@router.get("/{user_id}", response_model=schemas.UserResponse)
async def get_user(request: fastapi.Request, user_id: uuid.UUID):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{config.USER_SERVICE_URL}/users/{user_id}",
                headers=utils.build_headers(request),
            )
        except httpx.RequestError:
            log_config.log(request, logging.ERROR, "user_get_service_unavailable", user_id=str(user_id))
            raise fastapi.HTTPException(status_code=503, detail="User service unavailable.")

    if response.status_code != 200:
        log_config.log(
            request,
            logging.WARNING,
            "user_get_failed",
            user_id=str(user_id),
            status_code=response.status_code,
            response_error=response.text,
        )
        return utils.forward_error(response)

    return response.json()