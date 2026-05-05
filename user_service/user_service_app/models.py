import uuid

import sqlalchemy
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import orm

Base = orm.declarative_base()


class User(Base):
    __tablename__ = "users"

    id = sqlalchemy.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True)
    username = sqlalchemy.Column(sqlalchemy.String, unique=True, nullable=False)
    email = sqlalchemy.Column(sqlalchemy.String, unique=True, nullable=False)
    password_hash = sqlalchemy.Column(sqlalchemy.String, nullable=False)
    created_at = sqlalchemy.Column(sqlalchemy.DateTime(timezone=True), default=sqlalchemy.func.now())