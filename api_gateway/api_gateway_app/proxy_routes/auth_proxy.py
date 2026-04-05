import logging

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm

from api_gateway_app.config import USER_SERVICE_URL
from api_gateway_app.log_config import log
from api_gateway_app.schemas import RegisterRequest, TokenResponse, UserResponse
from api_gateway_app.utils import forward_error, build_headers

router = APIRouter()


@router.post("/register", response_model=UserResponse)
async def register(request: Request, data: RegisterRequest):
    log(request, logging.INFO, "register_started", username=data.username)

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{USER_SERVICE_URL}/auth/register",
                json=data.model_dump(),
                headers=build_headers(request),
            )
        except httpx.RequestError:
            log(request, logging.ERROR, "register_user_service_unavailable", username=data.username)
            raise HTTPException(status_code=503, detail="User service unavailable.")

    if response.status_code != 200:
        log(
            request,
            logging.WARNING,
            "register_failed",
            username=data.username,
            status_code=response.status_code,
        )
        return forward_error(response)

    result = response.json()
    log(request, logging.INFO, "register_finished", user_id=result.get("id"), username=result.get("username"))
    return result


@router.post("/login", response_model=TokenResponse)
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    log(request, logging.INFO, "login_started", username=form_data.username)

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{USER_SERVICE_URL}/auth/login",
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
            log(request, logging.ERROR, "login_user_service_unavailable", username=form_data.username)
            raise HTTPException(status_code=503, detail="User service unavailable.")

    if response.status_code != 200:
        log(
            request,
            logging.WARNING,
            "login_failed",
            username=form_data.username,
            status_code=response.status_code,
        )
        return forward_error(response)

    log(request, logging.INFO, "login_finished", username=form_data.username)
    return response.json()