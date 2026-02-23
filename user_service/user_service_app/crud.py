from sqlalchemy.orm import Session
from passlib.context import CryptContext
from uuid import UUID

from user_service_app.models import User
from user_service_app.schemas import UserCreate

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_user(db: Session, user_data: UserCreate) -> User:
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        email=str(user_data.email),
        password_hash=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, username: str, password: str) -> User | None:
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

def is_username_taken(db: Session, username: str) -> bool:
    return db.query(User).filter(User.username == username).first() is not None

def is_email_taken(db: Session, email: str) -> bool:
    return db.query(User).filter(User.email == email).first() is not None

def get_user_by_id(db: Session, user_id: UUID) -> User | None:
    return db.query(User).filter(User.id == user_id).first()