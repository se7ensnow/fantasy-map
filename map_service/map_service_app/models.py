from sqlalchemy import Column, String, DateTime, Float, ForeignKey, JSON, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
import uuid

Base = declarative_base()

class Map(Base):
    __tablename__ = 'maps'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True)
    owner_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    visibility = Column(String, nullable=False, index=True)
    share_id = Column(String, nullable=True, unique=True, index=True)
    owner_username = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    source_path = Column(String, nullable=False)
    tiles_path = Column(String, nullable=False)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    max_zoom = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.now(), onupdate=datetime.now())

    locations = relationship("Location", back_populates="map", cascade="all, delete-orphan")

class Location(Base):
    __tablename__ = 'locations'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True)
    map_id = Column(UUID(as_uuid=True), ForeignKey("maps.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.now(), onupdate=datetime.now())

    map = relationship("Map", back_populates="locations")