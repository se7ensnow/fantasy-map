import logging
from uuid import UUID

import httpx
from fastapi import APIRouter, HTTPException, Request

from api_gateway_app.config import USER_SERVICE_URL
from api_gateway_app.log_config import log
from api_gateway_app.schemas import UserResponse
from api_gateway_app.security import require_user_id
from api_gateway_app.utils import forward_error, build_headers

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_me(request: Request, user_id: UUID = require_user_id()):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{USER_SERVICE_URL}/users/me",
                headers=build_headers(request, user_id),
            )
        except httpx.RequestError:
            log(request, logging.ERROR, "user_me_service_unavailable", user_id=str(user_id))
            raise HTTPException(status_code=503, detail="User service unavailable.")

    if response.status_code != 200:
        log(
            request,
            logging.WARNING,
            "user_me_failed",
            user_id=str(user_id),
            status_code=response.status_code,
            response_error=response.text,
        )
        return forward_error(response)

    return response.json()


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(request: Request, user_id: UUID):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{USER_SERVICE_URL}/users/{user_id}",
                headers=build_headers(request),
            )
        except httpx.RequestError:
            log(request, logging.ERROR, "user_get_service_unavailable", user_id=str(user_id))
            raise HTTPException(status_code=503, detail="User service unavailable.")

    if response.status_code != 200:
        log(
            request,
            logging.WARNING,
            "user_get_failed",
            user_id=str(user_id),
            status_code=response.status_code,
            response_error=response.text,
        )
        return forward_error(response)

    return response.json()