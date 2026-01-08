from fastapi import FastAPI
from sqlalchemy import text
import logging

from map_service_app.database import engine
from map_service_app.models import Base
from map_service_app.routes import maps, locations

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("map_service")

app = FastAPI(
    title="Map Service",
    description="Сервис управления картами и локациями",
    version="1.0"
)

@app.on_event("startup")
def on_startup() -> None:
    print(">>> map-service startup called", flush=True)

    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))

        Base.metadata.create_all(bind=conn)

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_maps_title_trgm 
            ON maps
            USING GIN (title gin_trgm_ops)
        """))

        sim = conn.execute(text("SELECT similarity('wizard tower','wziard towr')")).scalar_one()
        logger.info("pg_trgm OK, similarity=%s", sim)

app.include_router(maps.router, prefix="/maps", tags=["maps"])
app.include_router(locations.router, prefix="/locations", tags=["locations"])