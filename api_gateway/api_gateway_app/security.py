import logging
import typing
import uuid

import httpx
import fastapi
from fastapi import security

from api_gateway_app import config
from api_gateway_app import log_config


bearer_scheme = security.HTTPBearer(auto_error=False)


async def get_current_user_id(
    request: fastapi.Request,
    optional: bool = False,
    credentials: typing.Optional[security.HTTPAuthorizationCredentials] = fastapi.Depends(bearer_scheme),
) -> typing.Optional[uuid.UUID]:
    if credentials is None:
        log_config.log(request, logging.INFO, "auth_missing", optional=optional)
        if optional:
            return None
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            resp = await client.post(
                f"{config.USER_SERVICE_URL}/auth/verify-token",
                json={"access_token": token},
                headers={"X-Request-ID": request.state.request_id},
            )
        except httpx.RequestError:
            log_config.log(request, logging.ERROR, "auth_user_service_unavailable", optional=optional)
            if optional:
                return None
            raise fastapi.HTTPException(status_code=503, detail="User service unavailable")

    if resp.status_code >= 500:
        log_config.log(request, logging.ERROR, "auth_user_service_error", status_code=resp.status_code, optional=optional)
        if optional:
            return None
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="User service unavailable",
        )

    if resp.status_code != fastapi.status.HTTP_200_OK:
        log_config.log(request, logging.WARNING, "auth_invalid", status_code=resp.status_code, optional=optional)
        if optional:
            return None
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = resp.json().get("user_id")
    try:
        user_id = uuid.UUID(user_id_str)
    except Exception:
        log_config.log(request, logging.ERROR, "auth_invalid_payload", optional=optional)
        if optional:
            return None
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user_id


async def _require_user_id(
    request: fastapi.Request,
    credentials: typing.Optional[security.HTTPAuthorizationCredentials] = fastapi.Depends(bearer_scheme),
) -> uuid.UUID:
    return await get_current_user_id(request=request, optional=False, credentials=credentials)


async def _optional_user_id(
    request: fastapi.Request,
    credentials: typing.Optional[security.HTTPAuthorizationCredentials] = fastapi.Depends(bearer_scheme),
) -> typing.Optional[uuid.UUID]:
    return await get_current_user_id(request=request, optional=True, credentials=credentials)


def require_user_id():
    return fastapi.Depends(_require_user_id)


def optional_user_id():
    return fastapi.Depends(_optional_user_id)