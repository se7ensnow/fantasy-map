import datetime
import uuid

import pydantic


class UserCreate(pydantic.BaseModel):
    username: str
    email: pydantic.EmailStr
    password: str


class UserOut(pydantic.BaseModel):
    id: uuid.UUID
    username: str
    email: pydantic.EmailStr
    created_at: datetime.datetime

    model_config = pydantic.ConfigDict(from_attributes=True)


class Token(pydantic.BaseModel):
    access_token: str
    token_type: str


class TokenVerifyRequest(pydantic.BaseModel):
    access_token: str


class TokenVerifyResponse(pydantic.BaseModel):
    user_id: uuid.UUID