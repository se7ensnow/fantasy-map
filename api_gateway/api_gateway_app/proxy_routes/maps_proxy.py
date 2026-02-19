from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, status, Query, Request
import httpx
from uuid import UUID
from typing import Optional, Optional

from api_gateway_app.config import USER_SERVICE_URL, MAP_SERVICE_URL
from api_gateway_app.security import verify_token, soft_verify_token
from api_gateway_app.schemas import MapCreateRequest, MapUpdateRequest, MapResponse, ListMapResponse, TagStatResponse

router = APIRouter()


@router.post("/create", response_model=MapResponse)
async def create_map(map_data: MapCreateRequest, user_id: UUID = Depends(verify_token)):
    headers = {
        "X-User-Id": str(user_id)
    }

    async with httpx.AsyncClient() as client:
        try:
            user_response = await client.get(
                f"{USER_SERVICE_URL}/users/me",
                headers=headers
            )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="User service unavailable")

        if user_response.status_code != 200:
            raise HTTPException(status_code=user_response.status_code, detail=user_response.text)

        user_data = user_response.json()
        owner_username = user_data["username"]

        body = map_data.model_dump()
        body["owner_username"] = owner_username

        try:
            response = await client.post(
                f"{MAP_SERVICE_URL}/maps/create",
                json=body,
                headers=headers
            )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()


@router.get("/owned", response_model=ListMapResponse)
async def get_owned_maps(
        page: int = Query(1, alias="page", ge=1),
        size: int = Query(10, alias="size", ge=1, le=100),
        user_id: UUID = Depends(verify_token)):
    headers = {
        "X-User-Id": str(user_id)
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{MAP_SERVICE_URL}/maps/owned",
                params={"page": page, "size": size},
                headers=headers
            )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code == 404:
        return ListMapResponse(
            items=[],
            total=0
        )

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()


@router.get("/all", response_model=ListMapResponse)
async def get_all_maps(
        page: int = Query(1, alias="page", ge=1),
        size: int = Query(10, alias="size", ge=1, le=100),
        q: Optional[str] = Query(None, alias="q"),
        tags: Optional[str] = Query(None, alias="tags"),
        tags_mode: str = Query("any", alias="tags_mode")):
    params: dict[str, object] = {"page": page, "size": size}

    if q:
        params["q"] = q
    if tags:
        params["tags"] = tags
    if tags_mode:
        params["tags_mode"] = tags_mode

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{MAP_SERVICE_URL}/maps/all",
                params=params,
            )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()


@router.get("/tags", response_model=List[TagStatResponse])
async def list_tags(
        q: Optional[str] = Query(None, alias="q"),
        limit: int = Query(50, alias="limit", ge=1, le=200)):
    params: dict[str, object] = {"limit": limit}
    if q:
        params["q"] = q

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{MAP_SERVICE_URL}/maps/tags",
                params=params
            )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()


@router.get("/{map_id}", response_model=MapResponse)
async def get_map(map_id: UUID, user_id: Optional[UUID] = Depends(soft_verify_token)):
    headers = {}
    if user_id:
        headers["X-User-Id"] = str(user_id)

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{MAP_SERVICE_URL}/maps/{map_id}",
                headers=headers if headers else None
            )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()


@router.put("/{map_id}", response_model=MapResponse)
async def update_map(map_id: UUID, map_data: MapUpdateRequest, user_id: UUID = Depends(verify_token)):
    body = map_data.model_dump_json()

    headers = {
        "X-User-Id": str(user_id)
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.put(
                f"{MAP_SERVICE_URL}/maps/{map_id}",
                content=body,
                headers=headers
            )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()


@router.delete("/{map_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_map(map_id: UUID, user_id: UUID = Depends(verify_token)):
    headers = {
        "X-User-Id": str(user_id)
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(
                f"{MAP_SERVICE_URL}/maps/{map_id}",
                headers=headers
            )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 204:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return

@router.get("/share/{share_id}", response_model=MapResponse)
async def get_map_by_share_id(share_id: str):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{MAP_SERVICE_URL}/maps/share/{share_id}")
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="Shared map not found or expired")
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()


@router.post("/{map_id}/upload-image")
async def upload_image(map_id: UUID, file: UploadFile = File(...), user_id: UUID = Depends(verify_token)):
    files = {"file": (file.filename, await file.read(), file.content_type)}

    headers = {
        "X-User-Id": str(user_id)
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{MAP_SERVICE_URL}/maps/{map_id}/upload-image",
                files=files,
                headers=headers
            )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()
