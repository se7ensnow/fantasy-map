import logging
import time
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from api_gateway_app.proxy_routes import users_proxy, maps_proxy, auth_proxy, locations_proxy, progress_proxy
from api_gateway_app.config import FRONTEND_URL
from api_gateway_app.log_config import setup_logging, logger, log

setup_logging()

app = FastAPI(
    title="Fantasy Map API Gateway",
    description="Прокси сервис для маршрутизации запросов в другие микросервисы",
    version="2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid4()))
    request.state.request_id = request_id

    start = time.perf_counter()

    log(
        request,
        logging.INFO,
        "request_started",
        method=request.method,
        path=request.url.path,
    )

    try:
        response = await call_next(request)
    except Exception:
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.exception(
            "request_unhandled_error",
            extra={
                "extra_fields": {
                    "event": "request_unhandled_error",
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": duration_ms,
                }
            },
        )
        raise

    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    response.headers["X-Request-ID"] = request_id

    log(
        request,
        logging.INFO,
        "request_finished",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration_ms=duration_ms,
    )

    return response


app.include_router(auth_proxy.router, prefix="/auth", tags=["auth"])
app.include_router(users_proxy.router, prefix="/users", tags=["users"])
app.include_router(maps_proxy.router, prefix="/maps", tags=["maps"])
app.include_router(locations_proxy.router, prefix="/locations", tags=["locations"])
app.include_router(progress_proxy.router, prefix="/jobs", tags=["progress"])