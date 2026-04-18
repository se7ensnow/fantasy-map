import logging
import time
from uuid import uuid4

from fastapi import FastAPI, Request

from user_service_app.log_config import log, logger, setup_logging
from user_service_app.routes import auth, users

setup_logging()

app = FastAPI(
    title="User Service",
    description="Сервис управления пользователями",
    version="1.0"
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


app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])