import datetime
import pydantic
import uuid
import typing


# ---------- AUTH ----------

class RegisterRequest(pydantic.BaseModel):
    username: str
    email: pydantic.EmailStr
    password: str

    model_config = pydantic.ConfigDict(from_attributes=True)


class TokenResponse(pydantic.BaseModel):
    access_token: str
    token_type: str


# ---------- USERS ----------

class UserResponse(pydantic.BaseModel):
    id: uuid.UUID
    username: str
    email: pydantic.EmailStr
    created_at: datetime.datetime


# ---------- MAPS ----------

Visibility = typing.Literal["private", "public"]
MapStatus = typing.Literal['draft', 'ready']


class MapCreateRequest(pydantic.BaseModel):
    title: str
    description: typing.Optional[str] = None
    tags: typing.List[str] = pydantic.Field(default_factory=list)
    visibility: Visibility


class MapUpdateRequest(pydantic.BaseModel):
    title: typing.Optional[str] = None
    description: typing.Optional[str] = None
    tags: typing.Optional[typing.List[str]] = None
    visibility: typing.Optional[Visibility] = None


class MapCardResponse(pydantic.BaseModel):
    id: uuid.UUID
    owner_username: str
    title: str
    tags: typing.List[str] = pydantic.Field(default_factory=list)
    visibility: Visibility
    status: MapStatus
    updated_at: datetime.datetime


class ListMapCardResponse(pydantic.BaseModel):
    items: typing.List[MapCardResponse]
    total: int


class MapResponse(pydantic.BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    owner_username: str
    title: str
    description: typing.Optional[str] = None
    tags: typing.List[str] = pydantic.Field(default_factory=list)
    visibility: Visibility
    status: MapStatus
    tiles_version: int
    width: typing.Optional[int] = None
    height: typing.Optional[int] = None
    max_zoom: typing.Optional[int] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    share_id: typing.Optional[str] = None

    model_config = pydantic.ConfigDict(from_attributes=True)


class LocationCreateRequest(pydantic.BaseModel):
    map_id: uuid.UUID
    type: str
    name: str
    description_md: str = ""
    x: float
    y: float


class LocationUpdateRequest(pydantic.BaseModel):
    type: typing.Optional[str] = None
    name: typing.Optional[str] = None
    description_md: typing.Optional[str] = None
    x: typing.Optional[float] = None
    y: typing.Optional[float] = None


class LocationResponse(pydantic.BaseModel):
    id: uuid.UUID
    map_id: uuid.UUID
    type: str
    name: str
    description_md: str = ""
    x: float
    y: float
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = pydantic.ConfigDict(from_attributes=True)


class TagStatResponse(pydantic.BaseModel):
    name: str
    count: int


class ShareIdResponse(pydantic.BaseModel):
    share_id: typing.Optional[str] = None