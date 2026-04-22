import uuid

from passlib import context
from sqlalchemy import orm

from user_service_app import models
from user_service_app import schemas

pwd_context = context.CryptContext(schemes=["argon2"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_user(db: orm.Session, user_data: schemas.UserCreate) -> models.User:
    hashed_password = get_password_hash(user_data.password)
    db_user = models.User(
        username=user_data.username,
        email=str(user_data.email),
        password_hash=hashed_password,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: orm.Session, username: str, password: str) -> models.User | None:
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def is_username_taken(db: orm.Session, username: str) -> bool:
    return db.query(models.User).filter(models.User.username == username).first() is not None


def is_email_taken(db: orm.Session, email: str) -> bool:
    return db.query(models.User).filter(models.User.email == email).first() is not None


def get_user_by_id(db: orm.Session, user_id: uuid.UUID) -> models.User | None:
    return db.query(models.User).filter(models.User.id == user_id).first()