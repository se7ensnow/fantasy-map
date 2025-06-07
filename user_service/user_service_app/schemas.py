from pydantic import BaseModel, EmailStr
from datetime import datetime
from uuid import UUID

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: UUID
    username: str
    email: EmailStr
    created_at: datetime

    class ConfigDict:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenVerifyRequest(BaseModel):
    access_token: str

class TokenVerifyResponse(BaseModel):
    user_id: UUID