import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from user_service_app.crud import (
    authenticate_user,
    create_user,
    is_email_taken,
    is_username_taken,
)
from user_service_app.database import get_db
from user_service_app.log_config import log
from user_service_app.schemas import (
    Token,
    TokenVerifyRequest,
    TokenVerifyResponse,
    UserCreate,
    UserOut,
)
from user_service_app.security import create_access_token, verify_jwt_token

router = APIRouter()


@router.post("/register", response_model=UserOut)
def register_endpoint(request: Request, user_in: UserCreate, db: Session = Depends(get_db)):
    log(request, logging.INFO, "register_started", username=user_in.username)

    if is_username_taken(db, user_in.username):
        log(request, logging.WARNING, "register_username_taken", username=user_in.username)
        raise HTTPException(status_code=400, detail="Username is already taken")

    if is_email_taken(db, str(user_in.email)):
        log(request, logging.WARNING, "register_email_taken", email=str(user_in.email))
        raise HTTPException(status_code=400, detail="Email is already taken")

    user = create_user(db, user_in)

    log(request, logging.INFO, "register_finished", user_id=str(user.id), username=user.username)
    return user


@router.post("/login", response_model=Token)
def login_endpoint(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    log(request, logging.INFO, "login_started", username=form_data.username)

    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        log(request, logging.WARNING, "login_failed", username=form_data.username)
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    access_token = create_access_token(data={"sub": str(user.id)})

    log(request, logging.INFO, "login_finished", user_id=str(user.id), username=user.username)
    return Token(access_token=access_token, token_type="bearer")


@router.post("/verify-token", response_model=TokenVerifyResponse)
def verify_token_endpoint(request: Request, token_in: TokenVerifyRequest):
    user_id = verify_jwt_token(token_in.access_token)
    if not user_id:
        log(request, logging.WARNING, "token_verify_failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    log(request, logging.INFO, "token_verify_finished", user_id=str(user_id))
    return TokenVerifyResponse(user_id=user_id)