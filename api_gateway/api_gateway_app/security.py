import logging
from typing import Optional
from uuid import UUID

import httpx
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from api_gateway_app.config import USER_SERVICE_URL
from api_gateway_app.log_config import log

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user_id(
    request: Request,
    optional: bool = False,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[UUID]:
    if credentials is None:
        log(request, logging.INFO, "auth_missing", optional=optional)
        if optional:
            return None
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            resp = await client.post(
                f"{USER_SERVICE_URL}/auth/verify-token",
                json={"access_token": token},
                headers={"X-Request-ID": request.state.request_id},
            )
        except httpx.RequestError:
            log(request, logging.ERROR, "auth_user_service_unavailable", optional=optional)
            if optional:
                return None
            raise HTTPException(status_code=503, detail="User service unavailable")

    if resp.status_code >= 500:
        log(request, logging.ERROR, "auth_user_service_error", status_code=resp.status_code, optional=optional)
        if optional:
            return None
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="User service unavailable",
        )

    if resp.status_code != status.HTTP_200_OK:
        log(request, logging.WARNING, "auth_invalid", status_code=resp.status_code, optional=optional)
        if optional:
            return None
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = resp.json().get("user_id")
    try:
        user_id = UUID(user_id_str)
    except Exception:
        log(request, logging.ERROR, "auth_invalid_payload", optional=optional)
        if optional:
            return None
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user_id


async def _require_user_id(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> UUID:
    return await get_current_user_id(request=request, optional=False, credentials=credentials)


async def _optional_user_id(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[UUID]:
    return await get_current_user_id(request=request, optional=True, credentials=credentials)


def require_user_id():
    return Depends(_require_user_id)


def optional_user_id():
    return Depends(_optional_user_id)