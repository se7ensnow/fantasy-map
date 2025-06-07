from fastapi import FastAPI

from user_service_app.models import Base
from user_service_app.database import engine
from user_service_app.routes import auth, users

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="User Service",
    description="Сервис управления пользователями",
    version="1.0"
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])