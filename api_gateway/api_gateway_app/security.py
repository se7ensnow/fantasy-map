import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from uuid import UUID

from api_gateway_app.config import USER_SERVICE_URL

bearer_scheme = HTTPBearer(auto_error=False)

async def get_current_user_id(
    optional: bool = False,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[UUID]:
    if credentials is None:
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
            )
        except httpx.RequestError:
            if optional:
                return None
            raise HTTPException(status_code=503, detail="User service unavailable")

    if resp.status_code >= 500:
        if optional:
            return None
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="User service unavailable",
        )

    if resp.status_code != status.HTTP_200_OK:
        if optional:
            return None
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = resp.json().get("user_id")
    try:
        return UUID(user_id_str)
    except Exception:
        if optional:
            return None
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def _require_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> UUID:
    user_id = await get_current_user_id(optional=False, credentials=credentials)
    return user_id

async def _optional_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[UUID]:
    return await get_current_user_id(optional=True, credentials=credentials)


def require_user_id():
    return Depends(_require_user_id)

def optional_user_id():
    return Depends(_optional_user_id)