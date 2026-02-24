from pydantic import BaseModel, ConfigDict, field_validator, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Dict, Any, Literal

from map_service_app.models import Tag
from map_service_app.config import DESCRIPTION_MAX_LENGTH


Visibility = Literal["private", "public"]


class MapCreate(BaseModel):
    title: str
    description: Optional[str] = None
    owner_username: str
    tags: List[str] = Field(default_factory=list)
    visibility: Visibility = "private"


class MapUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    visibility: Optional[Visibility] = None


class MapCardResponse(BaseModel):
    id: UUID
    owner_username: str
    title: str
    tags: List[str] = Field(default_factory=list)
    visibility: Visibility
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator("tags", mode="before")
    @classmethod
    def normalize_tags(cls, v: List[Tag]) -> List[str]:
        return [tag.name for tag in v]


class ListMapCardResponse(BaseModel):
    items: List[MapCardResponse]
    total: int

    model_config = ConfigDict(from_attributes=True)


class MapResponse(BaseModel):
    id: UUID
    owner_id: UUID
    owner_username: str
    title: str
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    source_path: str
    tiles_path: str
    width: int
    height: int
    max_zoom: int
    visibility: Visibility
    share_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator("tags", mode="before")
    @classmethod
    def normalize_tags(cls, v: List[Tag]) -> List[str]:
        return [tag.name for tag in v]


class TilesInfo(BaseModel):
    width: int
    height: int
    max_zoom: int
    tiles_path: str


class LocationCreate(BaseModel):
    map_id: UUID
    type: str
    name: str
    description_md: str = Field(default="", max_length=DESCRIPTION_MAX_LENGTH)
    x: float
    y: float


class LocationUpdate(BaseModel):
    type: Optional[str] = None
    name: Optional[str] = None
    description_md: Optional[str] = Field(default=None, max_length=DESCRIPTION_MAX_LENGTH)
    x: Optional[float] = None
    y: Optional[float] = None


class LocationResponse(BaseModel):
    id: UUID
    map_id: UUID
    type: str
    name: str
    description_md: str = ""
    x: float
    y: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TagStatResponse(BaseModel):
    name: str
    count: int


class ShareIdResponse(BaseModel):
    share_id: Optional[str] = None
