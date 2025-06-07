from pydantic import EmailStr

from user_service_app import crud
from user_service_app.schemas import UserCreate

create_request = UserCreate(
    username="testuser",
    email="test@example.com",
    password="StrongPass123!"
)

def test_create_user(db):
    user = crud.create_user(db, create_request)
    assert user.username == "testuser"
    assert user.email == "test@example.com"
    assert user.password_hash != "StrongPass123!"

def test_is_username_taken(db):
    user = crud.create_user(db, create_request)
    assert crud.is_username_taken(db, user.username) is True
    assert crud.is_username_taken(db, "nonexistent") is False

def test_is_email_taken(db):
    user = crud.create_user(db, create_request)
    assert crud.is_email_taken(db, user.email) is True
    assert crud.is_email_taken(db, "nonexistent@example.com") is False

def test_authenticate_user(db):
    crud.create_user(db, create_request)

    user = crud.authenticate_user(db, create_request.username, create_request.password)
    assert user is not None
    assert user.username == create_request.username
    assert user.email == create_request.email

    user_fail = crud.authenticate_user(db, create_request.username, "wrongpassword")
    assert user_fail is None

def test_get_user_by_id(db):
    user = crud.create_user(db, create_request)

    fetched_user = crud.get_user_by_id(db, user.id)
    assert fetched_user is not None
    assert fetched_user.id == user.id
    assert fetched_user.username == create_request.username
    assert fetched_user.email == create_request.email
