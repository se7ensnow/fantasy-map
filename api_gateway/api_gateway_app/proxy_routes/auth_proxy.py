import logging

import httpx
import fastapi
from fastapi import security

from api_gateway_app import config
from api_gateway_app import log_config
from api_gateway_app import schemas
from api_gateway_app import utils

router = fastapi.APIRouter()


@router.post("/register", response_model=schemas.UserResponse)
async def register(request: fastapi.Request, data: schemas.RegisterRequest):
    log_config.log(request, logging.INFO, "register_started", username=data.username)

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{config.USER_SERVICE_URL}/auth/register",
                json=data.model_dump(mode="json"),
                headers=utils.build_headers(request),
            )
        except httpx.RequestError:
            log_config.log(request, logging.ERROR, "register_user_service_unavailable", username=data.username)
            raise fastapi.HTTPException(status_code=503, detail="User service unavailable.")

    if response.status_code != 200:
        log_config.log(
            request,
            logging.WARNING,
            "register_failed",
            username=data.username,
            status_code=response.status_code,
            response_error=response.text,
        )
        return utils.forward_error(response)

    result = response.json()
    log_config.log(
        request,
        logging.INFO,
        "register_finished",
        user_id=result.get("id"),
        username=result.get("username")
    )
    return result


@router.post("/login", response_model=schemas.TokenResponse)
async def login(request: fastapi.Request, form_data: security.OAuth2PasswordRequestForm = fastapi.Depends()):
    log_config.log(request, logging.INFO, "login_started", username=form_data.username)

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{config.USER_SERVICE_URL}/auth/login",
                data={
                    "username": form_data.username,
                    "password": form_data.password,
                },
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-Request-ID": request.state.request_id,
                },
            )
        except httpx.RequestError:
            log_config.log(request, logging.ERROR, "login_user_service_unavailable", username=form_data.username)
            raise fastapi.HTTPException(status_code=503, detail="User service unavailable.")

    if response.status_code != 200:
        log_config.log(
            request,
            logging.WARNING,
            "login_failed",
            username=form_data.username,
            status_code=response.status_code,
            response_error=response.text,
        )
        return utils.forward_error(response)

    log_config.log(request, logging.INFO, "login_finished", username=form_data.username)
    return response.json()