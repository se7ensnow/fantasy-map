from sqlalchemy import Column, String, DateTime, Float, ForeignKey, Integer, Table, UniqueConstraint, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
import uuid

Base = declarative_base()

map_tags = Table(
    "map_tags",
    Base.metadata,
    Column("map_id", UUID(as_uuid=True), ForeignKey("maps.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    UniqueConstraint("map_id", "tag_id", name="uq_map_tags_map_id_tag_id"),
)

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
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    locations = relationship("Location", back_populates="map", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary=map_tags, lazy="selectin", back_populates="maps")

class Location(Base):
    __tablename__ = 'locations'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True)
    map_id = Column(UUID(as_uuid=True), ForeignKey("maps.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String, nullable=False)
    name = Column(String, nullable=False)
    description_md = Column(Text, nullable=False, default='')
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    map = relationship("Map", back_populates="locations")

class Tag(Base):
    __tablename__ = 'tags'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    maps = relationship("Map", secondary=map_tags, back_populates="tags")

