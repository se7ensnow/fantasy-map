from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict, Field
from uuid import UUID
from typing import Optional, Dict, Any, List, Literal


# ---------- AUTH ----------

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


# ---------- USERS ----------

class UserResponse(BaseModel):
    id: UUID
    username: str
    email: EmailStr
    created_at: datetime


# ---------- MAPS ----------

Visibility = Literal["private", "public"]


class MapCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    visibility: Visibility


class MapUpdateRequest(BaseModel):
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


class ListMapCardResponse(BaseModel):
    items: List[MapCardResponse]
    total: int


class MapResponse(BaseModel):
    id: UUID
    owner_id: UUID
    owner_username: str
    title: str
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    visibility: Visibility
    source_path: str
    tiles_path: str
    width: int
    height: int
    max_zoom: int
    created_at: datetime
    updated_at: datetime
    share_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class LocationCreateRequest(BaseModel):
    map_id: UUID
    type: str
    name: str
    description_md: str = ""
    x: float
    y: float


class LocationUpdateRequest(BaseModel):
    type: Optional[str] = None
    name: Optional[str] = None
    description_md: Optional[str] = None
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