import logging
from typing import List, Optional
from uuid import UUID

import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File, status, Query, Request

from api_gateway_app.config import USER_SERVICE_URL, MAP_SERVICE_URL
from api_gateway_app.log_config import log
from api_gateway_app.schemas import (
    MapCreateRequest,
    MapUpdateRequest,
    ListMapCardResponse,
    MapResponse,
    TagStatResponse,
    ShareIdResponse,
)
from api_gateway_app.security import require_user_id, optional_user_id
from api_gateway_app.utils import forward_error, build_headers

router = APIRouter()


@router.post("/create", response_model=MapResponse)
async def create_map(request: Request, map_data: MapCreateRequest, user_id: UUID = require_user_id()):
    log(request, logging.INFO, "map_create_started", user_id=str(user_id))

    headers = build_headers(request, user_id)

    async with httpx.AsyncClient() as client:
        try:
            user_response = await client.get(f"{USER_SERVICE_URL}/users/me", headers=headers)
        except httpx.RequestError:
            log(request, logging.ERROR, "map_create_user_service_unavailable", user_id=str(user_id))
            raise HTTPException(status_code=503, detail="User service unavailable")

        if user_response.status_code != 200:
            log(
                request,
                logging.WARNING,
                "map_create_user_lookup_failed",
                user_id=str(user_id),
                status_code=user_response.status_code,
            )
            raise HTTPException(status_code=user_response.status_code, detail=user_response.text)

        owner_username = user_response.json()["username"]
        body = map_data.model_dump()
        body["owner_username"] = owner_username

        try:
            response = await client.post(f"{MAP_SERVICE_URL}/maps/create", json=body, headers=headers)
        except httpx.RequestError:
            log(request, logging.ERROR, "map_create_map_service_unavailable", user_id=str(user_id))
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        log(
            request,
            logging.WARNING,
            "map_create_failed",
            user_id=str(user_id),
            status_code=response.status_code,
        )
        return forward_error(response)

    result = response.json()
    log(request, logging.INFO, "map_create_finished", user_id=str(user_id), map_id=result.get("id"))
    return result


@router.get("/owned", response_model=ListMapCardResponse)
async def get_owned_maps(
    request: Request,
    page: int = Query(1, alias="page", ge=1),
    size: int = Query(10, alias="size", ge=1, le=100),
    user_id: UUID = require_user_id(),
):
    headers = build_headers(request, user_id)

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{MAP_SERVICE_URL}/maps/owned",
                params={"page": page, "size": size},
                headers=headers,
            )
        except httpx.RequestError:
            log(request, logging.ERROR, "owned_maps_service_unavailable", user_id=str(user_id))
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code == 404:
        return ListMapCardResponse(items=[], total=0)

    if response.status_code != 200:
        log(
            request,
            logging.WARNING,
            "owned_maps_failed",
            user_id=str(user_id),
            status_code=response.status_code,
        )
        return forward_error(response)

    return response.json()


@router.get("/all", response_model=ListMapCardResponse)
async def get_all_maps(
    request: Request,
    page: int = Query(1, alias="page", ge=1),
    size: int = Query(10, alias="size", ge=1, le=100),
    q: Optional[str] = Query(None, alias="q"),
    tags: Optional[str] = Query(None, alias="tags"),
    tags_mode: str = Query("any", alias="tags_mode"),
):
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
                headers=build_headers(request),
            )
        except httpx.RequestError:
            log(request, logging.ERROR, "maps_list_service_unavailable")
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        log(request, logging.WARNING, "maps_list_failed", status_code=response.status_code)
        return forward_error(response)

    return response.json()


@router.get("/tags", response_model=List[TagStatResponse])
async def list_tags(
    request: Request,
    q: Optional[str] = Query(None, alias="q"),
    limit: int = Query(50, alias="limit", ge=1, le=200),
):
    params: dict[str, object] = {"limit": limit}
    if q:
        params["q"] = q

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{MAP_SERVICE_URL}/maps/tags",
                params=params,
                headers=build_headers(request),
            )
        except httpx.RequestError:
            log(request, logging.ERROR, "tags_list_service_unavailable")
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        log(request, logging.WARNING, "tags_list_failed", status_code=response.status_code)
        return forward_error(response)

    return response.json()


@router.get("/share/{share_id}", response_model=MapResponse)
async def get_map_by_share_id(request: Request, share_id: str):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{MAP_SERVICE_URL}/maps/share/{share_id}",
                headers=build_headers(request),
            )
        except httpx.RequestError:
            log(request, logging.ERROR, "shared_map_service_unavailable", share_id=share_id)
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        if response.status_code == 404:
            log(request, logging.INFO, "shared_map_not_found", share_id=share_id)
            raise HTTPException(status_code=404, detail="Shared map not found or expired")

        log(request, logging.WARNING, "shared_map_failed", share_id=share_id, status_code=response.status_code)
        return forward_error(response)

    return response.json()


@router.get("/{map_id}", response_model=MapResponse)
async def get_map(request: Request, map_id: UUID, user_id: Optional[UUID] = optional_user_id()):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{MAP_SERVICE_URL}/maps/{map_id}",
                headers=build_headers(request, user_id),
            )
        except httpx.RequestError:
            log(request, logging.ERROR, "map_get_service_unavailable", map_id=str(map_id))
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        log(request, logging.WARNING, "map_get_failed", map_id=str(map_id), status_code=response.status_code)
        return forward_error(response)

    return response.json()


@router.put("/{map_id}", response_model=MapResponse)
async def update_map(
    request: Request,
    map_id: UUID,
    map_data: MapUpdateRequest,
    user_id: UUID = require_user_id(),
):
    body = map_data.model_dump_json()
    headers = build_headers(request, user_id)

    log(request, logging.INFO, "map_update_started", map_id=str(map_id), user_id=str(user_id))

    async with httpx.AsyncClient() as client:
        try:
            response = await client.put(
                f"{MAP_SERVICE_URL}/maps/{map_id}",
                content=body,
                headers=headers,
            )
        except httpx.RequestError:
            log(request, logging.ERROR, "map_update_service_unavailable", map_id=str(map_id), user_id=str(user_id))
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        log(
            request,
            logging.WARNING,
            "map_update_failed",
            map_id=str(map_id),
            user_id=str(user_id),
            status_code=response.status_code,
        )
        return forward_error(response)

    log(request, logging.INFO, "map_update_finished", map_id=str(map_id), user_id=str(user_id))
    return response.json()


@router.delete("/{map_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_map(request: Request, map_id: UUID, user_id: UUID = require_user_id()):
    headers = build_headers(request, user_id)

    log(request, logging.INFO, "map_delete_started", map_id=str(map_id), user_id=str(user_id))

    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(f"{MAP_SERVICE_URL}/maps/{map_id}", headers=headers)
        except httpx.RequestError:
            log(request, logging.ERROR, "map_delete_service_unavailable", map_id=str(map_id), user_id=str(user_id))
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 204:
        log(
            request,
            logging.WARNING,
            "map_delete_failed",
            map_id=str(map_id),
            user_id=str(user_id),
            status_code=response.status_code,
        )
        return forward_error(response)

    log(request, logging.INFO, "map_delete_finished", map_id=str(map_id), user_id=str(user_id))
    return


@router.post("/{map_id}/upload-image")
async def upload_image(
    request: Request,
    map_id: UUID,
    file: UploadFile = File(...),
    user_id: UUID = require_user_id(),
):
    log(
        request,
        logging.INFO,
        "map_upload_started",
        map_id=str(map_id),
        user_id=str(user_id),
        filename=file.filename,
    )

    files = {"file": (file.filename, await file.read(), file.content_type)}
    headers = build_headers(request, user_id)

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{MAP_SERVICE_URL}/maps/{map_id}/upload-image",
                files=files,
                headers=headers,
            )
        except httpx.RequestError:
            log(
                request,
                logging.ERROR,
                "map_upload_service_unavailable",
                map_id=str(map_id),
                user_id=str(user_id),
            )
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        log(
            request,
            logging.WARNING,
            "map_upload_failed",
            map_id=str(map_id),
            user_id=str(user_id),
            status_code=response.status_code,
        )
        return forward_error(response)

    log(request, logging.INFO, "map_upload_finished", map_id=str(map_id), user_id=str(user_id))
    return response.json()


@router.post("/{map_id}/share", response_model=ShareIdResponse)
async def create_share(request: Request, map_id: UUID, user_id: UUID = require_user_id()):
    headers = build_headers(request, user_id)

    log(request, logging.INFO, "share_create_started", map_id=str(map_id), user_id=str(user_id))

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{MAP_SERVICE_URL}/maps/{map_id}/share", headers=headers)
        except httpx.RequestError:
            log(request, logging.ERROR, "share_create_service_unavailable", map_id=str(map_id), user_id=str(user_id))
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        log(
            request,
            logging.WARNING,
            "share_create_failed",
            map_id=str(map_id),
            user_id=str(user_id),
            status_code=response.status_code,
        )
        return forward_error(response)

    log(request, logging.INFO, "share_create_finished", map_id=str(map_id), user_id=str(user_id))
    return response.json()


@router.get("/{map_id}/share", response_model=ShareIdResponse)
async def get_share_id(request: Request, map_id: UUID, user_id: UUID = require_user_id()):
    headers = build_headers(request, user_id)

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{MAP_SERVICE_URL}/maps/{map_id}/share", headers=headers)
        except httpx.RequestError:
            log(request, logging.ERROR, "share_get_service_unavailable", map_id=str(map_id), user_id=str(user_id))
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        log(
            request,
            logging.WARNING,
            "share_get_failed",
            map_id=str(map_id),
            user_id=str(user_id),
            status_code=response.status_code,
        )
        return forward_error(response)

    return response.json()


@router.delete("/{map_id}/share", status_code=status.HTTP_204_NO_CONTENT)
async def delete_share(request: Request, map_id: UUID, user_id: UUID = require_user_id()):
    headers = build_headers(request, user_id)

    log(request, logging.INFO, "share_delete_started", map_id=str(map_id), user_id=str(user_id))

    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(f"{MAP_SERVICE_URL}/maps/{map_id}/share", headers=headers)
        except httpx.RequestError:
            log(request, logging.ERROR, "share_delete_service_unavailable", map_id=str(map_id), user_id=str(user_id))
            raise HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 204:
        log(
            request,
            logging.WARNING,
            "share_delete_failed",
            map_id=str(map_id),
            user_id=str(user_id),
            status_code=response.status_code,
        )
        return forward_error(response)

    log(request, logging.INFO, "share_delete_finished", map_id=str(map_id), user_id=str(user_id))
    return