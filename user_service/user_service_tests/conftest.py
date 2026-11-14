import os

# The service refuses to start without SECRET_KEY, so tests provide their own.
# This must happen before any user_service_app module imports its config.
os.environ.setdefault("SECRET_KEY", "test-only-secret-key")

import pytest
import sqlalchemy
from sqlalchemy import orm

from user_service_app import models

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = sqlalchemy.create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = orm.sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    models.Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        models.Base.metadata.drop_all(bind=engine)