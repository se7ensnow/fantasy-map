import logging
import time
from uuid import uuid4

from fastapi import FastAPI, Request
from sqlalchemy import text

from map_service_app.database import engine
from map_service_app.log_config import log, logger, setup_logging
from map_service_app.models import Base
from map_service_app.routes import locations, maps

setup_logging()

app = FastAPI(
    title="Map Service",
    description="Сервис управления картами и локациями",
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


@app.on_event("startup")
def on_startup() -> None:
    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
        Base.metadata.create_all(bind=conn)

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_maps_title_trgm
            ON maps
            USING GIN (title gin_trgm_ops)
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_tags_name_trgm
            ON tags
            USING GIN (name gin_trgm_ops)
        """))

        sim = conn.execute(text("SELECT similarity('wizard tower','wziard towr')")).scalar_one()
        logger.info(
            "startup_pg_trgm_ready",
            extra={"extra_fields": {"event": "startup_pg_trgm_ready", "similarity": sim}},
        )


app.include_router(maps.router, prefix="/maps", tags=["maps"])
app.include_router(locations.router, prefix="/locations", tags=["locations"])