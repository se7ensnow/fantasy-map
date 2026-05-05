import fastapi
import httpx
import typing
import uuid


def forward_error(response: httpx.Response) -> fastapi.Response:
    return fastapi.Response(
        content=response.content,
        status_code=response.status_code,
        media_type=response.headers.get("content-type", "application/json"),
    )


def build_headers(request: fastapi.Request, user_id: typing.Optional[uuid.UUID] = None) -> dict[str, str]:
    headers = {"X-Request-ID": request.state.request_id}
    if user_id is not None:
        headers["X-User-Id"] = str(user_id)
    return headers