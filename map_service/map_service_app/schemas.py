import datetime
import typing
import uuid

import pydantic

from map_service_app import config
from map_service_app import models


Visibility = typing.Literal["private", "public"]
MapStatus = typing.Literal["draft", "ready"]


class MapCreate(pydantic.BaseModel):
    title: str
    description: typing.Optional[str] = None
    owner_username: str
    tags: typing.List[str] = pydantic.Field(default_factory=list)
    visibility: Visibility = "private"


class MapUpdate(pydantic.BaseModel):
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

    model_config = pydantic.ConfigDict(from_attributes=True)

    @pydantic.field_validator("tags", mode="before")
    @classmethod
    def normalize_tags(cls, v: typing.List[models.Tag]) -> typing.List[str]:
        return [tag.name for tag in v]


class ListMapCardResponse(pydantic.BaseModel):
    items: typing.List[MapCardResponse]
    total: int

    model_config = pydantic.ConfigDict(from_attributes=True)


class MapResponse(pydantic.BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    owner_username: str
    title: str
    description: typing.Optional[str] = None
    tags: typing.List[str] = pydantic.Field(default_factory=list)
    status: MapStatus
    tiles_version: int
    width: typing.Optional[int] = None
    height: typing.Optional[int] = None
    max_zoom: typing.Optional[int] = None
    visibility: Visibility
    share_id: typing.Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = pydantic.ConfigDict(from_attributes=True)

    @pydantic.field_validator("tags", mode="before")
    @classmethod
    def normalize_tags(cls, v: typing.List[models.Tag]) -> typing.List[str]:
        return [tag.name for tag in v]


class TilesInfo(pydantic.BaseModel):
    width: int
    height: int
    max_zoom: int
    tiles_version: int


class LocationCreate(pydantic.BaseModel):
    map_id: uuid.UUID
    type: str
    name: str
    description_md: str = pydantic.Field(default="", max_length=config.DESCRIPTION_MAX_LENGTH)
    x: float
    y: float


class LocationUpdate(pydantic.BaseModel):
    type: typing.Optional[str] = None
    name: typing.Optional[str] = None
    description_md: typing.Optional[str] = pydantic.Field(default=None, max_length=config.DESCRIPTION_MAX_LENGTH)
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