from fastapi import FastAPI

from map_service_app.database import engine
from map_service_app.models import Base
from map_service_app.routes import maps, locations

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Map Service",
    description="Сервис управления картами и локациями",
    version="1.0"
)

app.include_router(maps.router, prefix="/maps", tags=["maps"])
app.include_router(locations.router, prefix="/locations", tags=["locations"])