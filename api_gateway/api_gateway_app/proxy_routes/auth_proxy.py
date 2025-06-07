from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
import httpx

from api_gateway_app.config import USER_SERVICE_URL
from api_gateway_app.schemas import RegisterRequest, TokenResponse, UserResponse

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register(data: RegisterRequest):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{USER_SERVICE_URL}/auth/register",
                json=data.model_dump()
            )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="User service unavailable.")
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()

@router.post("/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{USER_SERVICE_URL}/auth/login",
                data={
                    "username": form_data.username,
                    "password": form_data.password
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="User service unavailable.")

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()