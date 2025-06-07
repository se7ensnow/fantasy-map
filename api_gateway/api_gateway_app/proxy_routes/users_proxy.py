from fastapi import APIRouter, HTTPException, Depends
import httpx
from uuid import UUID

from api_gateway_app.config import USER_SERVICE_URL
from api_gateway_app.schemas import UserResponse
from api_gateway_app.security import verify_token

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_me(user_id: UUID = Depends(verify_token)):
    headers = {
        "X-User-Id": str(user_id)
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{USER_SERVICE_URL}/users/me",
                headers=headers
            )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="User service unavailable.")

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: UUID):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{USER_SERVICE_URL}/users/{user_id}"
            )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="User service unavailable.")

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()