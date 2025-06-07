from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api_gateway_app.proxy_routes import users_proxy, maps_proxy, auth_proxy, locations_proxy
from api_gateway_app.config import FRONTEND_URL

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

app.include_router(auth_proxy.router, prefix="/auth", tags=["auth"])
app.include_router(users_proxy.router, prefix="/users", tags=["users"])
app.include_router(maps_proxy.router, prefix="/maps", tags=["maps"])
app.include_router(locations_proxy.router, prefix="/locations", tags=["locations"])