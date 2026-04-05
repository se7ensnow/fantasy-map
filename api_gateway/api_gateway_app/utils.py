from fastapi import Request, Response
import httpx
from typing import Optional
from uuid import UUID


def forward_error(response: httpx.Response) -> Response:
    return Response(
        content=response.content,
        status_code=response.status_code,
        media_type=response.headers.get("content-type", "application/json"),
    )


def build_headers(request: Request, user_id: Optional[UUID] = None) -> dict[str, str]:
    headers = {"X-Request-ID": request.state.request_id}
    if user_id is not None:
        headers["X-User-Id"] = str(user_id)
    return headers