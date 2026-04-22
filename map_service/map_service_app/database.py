import sqlalchemy
from sqlalchemy import orm

from map_service_app import config

engine = sqlalchemy.create_engine(config.DATABASE_URL)

SessionLocal = orm.sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()