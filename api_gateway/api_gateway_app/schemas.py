from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict
from uuid import UUID
from typing import Optional, Dict, Any, List

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

class MapCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    tags: List[str] = []

class MapUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None

class MapResponse(BaseModel):
    id: UUID
    owner_id: UUID
    owner_username: str
    title: str
    description: Optional[str] = None
    tags: List[str] = []
    source_path: str
    tiles_path: str
    width: int
    height: int
    max_zoom: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ListMapResponse(BaseModel):
    items: List[MapResponse]
    total: int

class LocationCreateRequest(BaseModel):
    map_id: UUID
    type: str
    name: str
    description: Optional[str] = None
    x: float
    y: float
    metadata_json: Optional[Dict[str, Any]] = None

class LocationUpdateRequest(BaseModel):
    type: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None
    metadata_json: Optional[Dict[str, Any]] = None

class LocationResponse(BaseModel):
    id: UUID
    map_id: UUID
    type: str
    name: str
    description: Optional[str] = None
    x: float
    y: float
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TagStatResponse(BaseModel):
    name: str
    count: int