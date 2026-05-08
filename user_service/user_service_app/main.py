import logging
import time
import uuid

import fastapi

from user_service_app import log_config
from user_service_app.routes import auth
from user_service_app.routes import users

log_config.setup_logging()

app = fastapi.FastAPI(
    title="User Service",
    description="Сервис управления пользователями",
    version="1.0",
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
    return {"status": "ok", "service": "user-service"}

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])