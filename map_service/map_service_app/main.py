import logging
import time
import uuid

import fastapi
import sqlalchemy

from map_service_app import database
from map_service_app import log_config
from map_service_app.routes import locations
from map_service_app.routes import maps

log_config.setup_logging()

app = fastapi.FastAPI(
    title="Map Service",
    description="Сервис управления картами и локациями",
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


@app.on_event("startup")
def on_startup() -> None:
    with database.engine.begin() as conn:
        conn.execute(sqlalchemy.text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))

        conn.execute(
            sqlalchemy.text(
                """
            CREATE INDEX IF NOT EXISTS ix_maps_title_trgm
            ON maps
            USING GIN (title gin_trgm_ops)
        """
            )
        )

        conn.execute(
            sqlalchemy.text(
                """
            CREATE INDEX IF NOT EXISTS ix_tags_name_trgm
            ON tags
            USING GIN (name gin_trgm_ops)
        """
            )
        )

        sim = conn.execute(sqlalchemy.text("SELECT similarity('wizard tower','wziard towr')")).scalar_one()
        log_config.logger.info(
            "startup_pg_trgm_ready",
            extra={"extra_fields": {"event": "startup_pg_trgm_ready", "similarity": sim}},
        )


app.include_router(maps.router, prefix="/maps", tags=["maps"])
app.include_router(locations.router, prefix="/locations", tags=["locations"])