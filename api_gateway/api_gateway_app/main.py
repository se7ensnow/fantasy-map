import logging
import time
import uuid

import fastapi
from fastapi.middleware import cors

from api_gateway_app.proxy_routes import users_proxy, maps_proxy, auth_proxy, locations_proxy, progress_proxy
from api_gateway_app import config
from api_gateway_app import log_config

log_config.setup_logging()

app = fastapi.FastAPI(
    title="Fantasy Map API Gateway",
    description="Прокси сервис для маршрутизации запросов в другие микросервисы",
    version="2.0"
)

app.add_middleware(
    cors.CORSMiddleware,
    allow_origins=[config.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging_middleware(request: fastapi.Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id

    start = time.perf_counter()

    log_config.log(
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
        log_config.logger.exception(
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

    log_config.log(
        request,
        logging.INFO,
        "request_finished",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration_ms=duration_ms,
    )

    return response


@app.get("/health")
def health():
    return {"status": "ok", "service": "api-gateway"}

api_router = fastapi.APIRouter(prefix="/api")

api_router.include_router(auth_proxy.router, prefix="/auth", tags=["auth"])
api_router.include_router(users_proxy.router, prefix="/users", tags=["users"])
api_router.include_router(maps_proxy.router, prefix="/maps", tags=["maps"])
api_router.include_router(locations_proxy.router, prefix="/locations", tags=["locations"])
api_router.include_router(progress_proxy.router, prefix="/jobs", tags=["progress"])

app.include_router(api_router)