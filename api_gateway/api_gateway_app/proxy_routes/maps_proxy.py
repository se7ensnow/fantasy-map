import logging
import typing
import uuid

import httpx
import fastapi

from api_gateway_app import config
from api_gateway_app import log_config
from api_gateway_app import schemas
from api_gateway_app import security
from api_gateway_app import utils

router = fastapi.APIRouter()


@router.post("/create", response_model=schemas.MapResponse)
async def create_map(
        request: fastapi.Request,
        map_data: schemas.MapCreateRequest,
        user_id: uuid.UUID = security.require_user_id()
):
    log_config.log(request, logging.INFO, "map_create_started", user_id=str(user_id))

    headers = utils.build_headers(request, user_id)

    async with httpx.AsyncClient() as client:
        try:
            user_response = await client.get(f"{config.USER_SERVICE_URL}/users/me", headers=headers)
        except httpx.RequestError:
            log_config.log(request, logging.ERROR, "map_create_user_service_unavailable", user_id=str(user_id))
            raise fastapi.HTTPException(status_code=503, detail="User service unavailable")

        if user_response.status_code != 200:
            log_config.log(
                request,
                logging.WARNING,
                "map_create_user_lookup_failed",
                user_id=str(user_id),
                status_code=user_response.status_code,
                response_error=user_response.text,
            )
            raise fastapi.HTTPException(status_code=user_response.status_code, detail=user_response.text)

        owner_username = user_response.json()["username"]
        body = map_data.model_dump(mode="json")
        body["owner_username"] = owner_username

        try:
            response = await client.post(f"{config.MAP_SERVICE_URL}/maps/create", json=body, headers=headers)
        except httpx.RequestError:
            log_config.log(request, logging.ERROR, "map_create_map_service_unavailable", user_id=str(user_id))
            raise fastapi.HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        log_config.log(
            request,
            logging.WARNING,
            "map_create_failed",
            user_id=str(user_id),
            status_code=response.status_code,
            response_error=response.text,
        )
        return utils.forward_error(response)

    result = response.json()
    log_config.log(request, logging.INFO, "map_create_finished", user_id=str(user_id), map_id=result.get("id"))
    return result


@router.get("/owned", response_model=schemas.ListMapCardResponse)
async def get_owned_maps(
    request: fastapi.Request,
    page: int = fastapi.Query(1, alias="page", ge=1),
    size: int = fastapi.Query(10, alias="size", ge=1, le=100),
    user_id: uuid.UUID = security.require_user_id(),
):
    headers = utils.build_headers(request, user_id)

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{config.MAP_SERVICE_URL}/maps/owned",
                params={"page": page, "size": size},
                headers=headers,
            )
        except httpx.RequestError:
            log_config.log(request, logging.ERROR, "owned_maps_service_unavailable", user_id=str(user_id))
            raise fastapi.HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code == 404:
        return schemas.ListMapCardResponse(items=[], total=0)

    if response.status_code != 200:
        log_config.log(
            request,
            logging.WARNING,
            "owned_maps_failed",
            user_id=str(user_id),
            status_code=response.status_code,
            response_error=response.text,
        )
        return utils.forward_error(response)

    return response.json()


@router.get("/all", response_model=schemas.ListMapCardResponse)
async def get_all_maps(
    request: fastapi.Request,
    page: int = fastapi.Query(1, alias="page", ge=1),
    size: int = fastapi.Query(10, alias="size", ge=1, le=100),
    q: typing.Optional[str] = fastapi.Query(None, alias="q"),
    tags: typing.Optional[str] = fastapi.Query(None, alias="tags"),
    tags_mode: str = fastapi.Query("any", alias="tags_mode"),
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
                f"{config.MAP_SERVICE_URL}/maps/all",
                params=params,
                headers=utils.build_headers(request),
            )
        except httpx.RequestError:
            log_config.log(request, logging.ERROR, "maps_list_service_unavailable")
            raise fastapi.HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        log_config.log(
            request,
            logging.WARNING,
            "maps_list_failed",
            status_code=response.status_code,
            response_error=response.text,
        )
        return utils.forward_error(response)

    return response.json()


@router.get("/tags", response_model=typing.List[schemas.TagStatResponse])
async def list_tags(
    request: fastapi.Request,
    q: typing.Optional[str] = fastapi.Query(None, alias="q"),
    limit: int = fastapi.Query(50, alias="limit", ge=1, le=200),
):
    params: dict[str, object] = {"limit": limit}
    if q:
        params["q"] = q

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{config.MAP_SERVICE_URL}/maps/tags",
                params=params,
                headers=utils.build_headers(request),
            )
        except httpx.RequestError:
            log_config.log(request, logging.ERROR, "tags_list_service_unavailable")
            raise fastapi.HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        log_config.log(
            request,
            logging.WARNING,
            "tags_list_failed",
            status_code=response.status_code,
            response_error=response.text,
        )
        return utils.forward_error(response)

    return response.json()


@router.get("/share/{share_id}", response_model=schemas.MapResponse)
async def get_map_by_share_id(request: fastapi.Request, share_id: str):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{config.MAP_SERVICE_URL}/maps/share/{share_id}",
                headers=utils.build_headers(request),
            )
        except httpx.RequestError:
            log_config.log(request, logging.ERROR, "shared_map_service_unavailable", share_id=share_id)
            raise fastapi.HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        if response.status_code == 404:
            log_config.log(request, logging.INFO, "shared_map_not_found", share_id=share_id)
            raise fastapi.HTTPException(status_code=404, detail="Shared map not found or expired")

        log_config.log(
            request,
            logging.WARNING,
            "shared_map_failed",
            share_id=share_id,
            status_code=response.status_code,
            response_error=response.text,
        )
        return utils.forward_error(response)

    return response.json()


@router.get("/{map_id}", response_model=schemas.MapResponse)
async def get_map(
        request: fastapi.Request,
        map_id: uuid.UUID,
        user_id: typing.Optional[uuid.UUID] = security.optional_user_id()
):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{config.MAP_SERVICE_URL}/maps/{map_id}",
                headers=utils.build_headers(request, user_id),
            )
        except httpx.RequestError:
            log_config.log(request, logging.ERROR, "map_get_service_unavailable", map_id=str(map_id))
            raise fastapi.HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        log_config.log(
            request,
            logging.WARNING,
            "map_get_failed",
            map_id=str(map_id),
            status_code=response.status_code,
            response_error=response.text,
        )
        return utils.forward_error(response)

    return response.json()


@router.put("/{map_id}", response_model=schemas.MapResponse)
async def update_map(
    request: fastapi.Request,
    map_id: uuid.UUID,
    map_data: schemas.MapUpdateRequest,
    user_id: uuid.UUID = security.require_user_id(),
):
    body = map_data.model_dump(mode="json")
    headers = utils.build_headers(request, user_id)

    log_config.log(request, logging.INFO, "map_update_started", map_id=str(map_id), user_id=str(user_id))

    async with httpx.AsyncClient() as client:
        try:
            response = await client.put(
                f"{config.MAP_SERVICE_URL}/maps/{map_id}",
                json=body,
                headers=headers,
            )
        except httpx.RequestError:
            log_config.log(
                request,
                logging.ERROR,
                "map_update_service_unavailable",
                map_id=str(map_id),
                user_id=str(user_id)
            )
            raise fastapi.HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        log_config.log(
            request,
            logging.WARNING,
            "map_update_failed",
            map_id=str(map_id),
            user_id=str(user_id),
            status_code=response.status_code,
            response_error=response.text,
        )
        return utils.forward_error(response)

    log_config.log(request, logging.INFO, "map_update_finished", map_id=str(map_id), user_id=str(user_id))
    return response.json()


@router.delete("/{map_id}", status_code=fastapi.status.HTTP_204_NO_CONTENT)
async def delete_map(request: fastapi.Request, map_id: uuid.UUID, user_id: uuid.UUID = security.require_user_id()):
    headers = utils.build_headers(request, user_id)

    log_config.log(request, logging.INFO, "map_delete_started", map_id=str(map_id), user_id=str(user_id))

    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(f"{config.MAP_SERVICE_URL}/maps/{map_id}", headers=headers)
        except httpx.RequestError:
            log_config.log(
                request,
                logging.ERROR,
                "map_delete_service_unavailable",
                map_id=str(map_id),
                user_id=str(user_id)
            )
            raise fastapi.HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 204:
        log_config.log(
            request,
            logging.WARNING,
            "map_delete_failed",
            map_id=str(map_id),
            user_id=str(user_id),
            status_code=response.status_code,
            response_error=response.text,
        )
        return utils.forward_error(response)

    log_config.log(request, logging.INFO, "map_delete_finished", map_id=str(map_id), user_id=str(user_id))
    return


@router.post("/{map_id}/upload-image")
async def upload_image(
    request: fastapi.Request,
    map_id: uuid.UUID,
    file: fastapi.UploadFile = fastapi.File(...),
    user_id: uuid.UUID = security.require_user_id(),
):
    log_config.log(
        request,
        logging.INFO,
        "map_upload_started",
        map_id=str(map_id),
        user_id=str(user_id),
        filename=file.filename,
    )

    files = {"file": (file.filename, await file.read(), file.content_type)}
    headers = utils.build_headers(request, user_id)

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{config.MAP_SERVICE_URL}/maps/{map_id}/upload-image",
                files=files,
                headers=headers,
            )
        except httpx.RequestError:
            log_config.log(
                request,
                logging.ERROR,
                "map_upload_service_unavailable",
                map_id=str(map_id),
                user_id=str(user_id),
            )
            raise fastapi.HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        log_config.log(
            request,
            logging.WARNING,
            "map_upload_failed",
            map_id=str(map_id),
            user_id=str(user_id),
            status_code=response.status_code,
            response_error=response.text,
        )
        return utils.forward_error(response)

    log_config.log(request, logging.INFO, "map_upload_finished", map_id=str(map_id), user_id=str(user_id))
    return response.json()


@router.post("/{map_id}/share", response_model=schemas.ShareIdResponse)
async def create_share(request: fastapi.Request, map_id: uuid.UUID, user_id: uuid.UUID = security.require_user_id()):
    headers = utils.build_headers(request, user_id)

    log_config.log(request, logging.INFO, "share_create_started", map_id=str(map_id), user_id=str(user_id))

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{config.MAP_SERVICE_URL}/maps/{map_id}/share", headers=headers)
        except httpx.RequestError:
            log_config.log(
                request,
                logging.ERROR,
                "share_create_service_unavailable",
                map_id=str(map_id),
                user_id=str(user_id)
            )
            raise fastapi.HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        log_config.log(
            request,
            logging.WARNING,
            "share_create_failed",
            map_id=str(map_id),
            user_id=str(user_id),
            status_code=response.status_code,
            response_error=response.text,
        )
        return utils.forward_error(response)

    log_config.log(request, logging.INFO, "share_create_finished", map_id=str(map_id), user_id=str(user_id))
    return response.json()


@router.get("/{map_id}/share", response_model=schemas.ShareIdResponse)
async def get_share_id(request: fastapi.Request, map_id: uuid.UUID, user_id: uuid.UUID = security.require_user_id()):
    headers = utils.build_headers(request, user_id)

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{config.MAP_SERVICE_URL}/maps/{map_id}/share", headers=headers)
        except httpx.RequestError:
            log_config.log(
                request,
                logging.ERROR,
                "share_get_service_unavailable",
                map_id=str(map_id),
                user_id=str(user_id)
            )
            raise fastapi.HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 200:
        log_config.log(
            request,
            logging.WARNING,
            "share_get_failed",
            map_id=str(map_id),
            user_id=str(user_id),
            status_code=response.status_code,
            response_error=response.text,
        )
        return utils.forward_error(response)

    return response.json()


@router.delete("/{map_id}/share", status_code=fastapi.status.HTTP_204_NO_CONTENT)
async def delete_share(request: fastapi.Request, map_id: uuid.UUID, user_id: uuid.UUID = security.require_user_id()):
    headers = utils.build_headers(request, user_id)

    log_config.log(request, logging.INFO, "share_delete_started", map_id=str(map_id), user_id=str(user_id))

    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(f"{config.MAP_SERVICE_URL}/maps/{map_id}/share", headers=headers)
        except httpx.RequestError:
            log_config.log(
                request,
                logging.ERROR,
                "share_delete_service_unavailable",
                map_id=str(map_id),
                user_id=str(user_id)
            )
            raise fastapi.HTTPException(status_code=503, detail="Map Service unavailable")

    if response.status_code != 204:
        log_config.log(
            request,
            logging.WARNING,
            "share_delete_failed",
            map_id=str(map_id),
            user_id=str(user_id),
            status_code=response.status_code,
            response_error=response.text,
        )
        return utils.forward_error(response)

    log_config.log(request, logging.INFO, "share_delete_finished", map_id=str(map_id), user_id=str(user_id))
    return