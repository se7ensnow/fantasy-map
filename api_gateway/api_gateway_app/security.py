import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from uuid import UUID

from api_gateway_app.config import USER_SERVICE_URL

security = HTTPBearer()

optional_security = HTTPBearer(auto_error=False)

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UUID:
    token = credentials.credentials

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{USER_SERVICE_URL}/auth/verify-token",
                json={"access_token": token}
            )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="User service unavailable")

    if response.status_code != status.HTTP_200_OK:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id_str = response.json().get("user_id")
    if not user_id_str:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    try:
        user_id = UUID(user_id_str)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user_id format")

    return user_id

async def soft_verify_token(
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security)
) -> Optional[UUID]:
    if credentials is None:
        return None

    token = credentials.credentials

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{USER_SERVICE_URL}/auth/verify-token",
                json={"access_token": token}
            )
        except httpx.RequestError:
            return None

    if response.status_code != status.HTTP_200_OK:
        return None

    user_id_str = response.json().get("user_id")
    if not user_id_str:
        return None

    try:
        user_id = UUID(user_id_str)
    except ValueError:
        return None

    return user_id

