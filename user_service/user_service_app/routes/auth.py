import logging

import fastapi
from fastapi import security
from sqlalchemy import orm

from user_service_app import crud
from user_service_app import database
from user_service_app import log_config
from user_service_app import schemas
from user_service_app import security as app_security

router = fastapi.APIRouter()


@router.post("/register", response_model=schemas.UserOut)
def register_endpoint(
    request: fastapi.Request,
    user_in: schemas.UserCreate,
    db: orm.Session = fastapi.Depends(database.get_db),
):
    log_config.log(request, logging.INFO, "register_started", username=user_in.username)

    if crud.is_username_taken(db, user_in.username):
        log_config.log(request, logging.WARNING, "register_username_taken", username=user_in.username)
        raise fastapi.HTTPException(status_code=400, detail="Username is already taken")

    if crud.is_email_taken(db, str(user_in.email)):
        log_config.log(request, logging.WARNING, "register_email_taken", email=str(user_in.email))
        raise fastapi.HTTPException(status_code=400, detail="Email is already taken")

    user = crud.create_user(db, user_in)

    log_config.log(request, logging.INFO, "register_finished", user_id=str(user.id), username=user.username)
    return user


@router.post("/login", response_model=schemas.Token)
def login_endpoint(
    request: fastapi.Request,
    form_data: security.OAuth2PasswordRequestForm = fastapi.Depends(),
    db: orm.Session = fastapi.Depends(database.get_db),
):
    log_config.log(request, logging.INFO, "login_started", username=form_data.username)

    user = crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        log_config.log(request, logging.WARNING, "login_failed", username=form_data.username)
        raise fastapi.HTTPException(status_code=400, detail="Incorrect username or password")

    access_token = app_security.create_access_token(data={"sub": str(user.id)})

    log_config.log(request, logging.INFO, "login_finished", user_id=str(user.id), username=user.username)
    return schemas.Token(access_token=access_token, token_type="bearer")


@router.post("/verify-token", response_model=schemas.TokenVerifyResponse)
def verify_token_endpoint(request: fastapi.Request, token_in: schemas.TokenVerifyRequest):
    user_id = app_security.verify_jwt_token(token_in.access_token)
    if not user_id:
        log_config.log(request, logging.WARNING, "token_verify_failed")
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    log_config.log(request, logging.INFO, "token_verify_finished", user_id=str(user_id))
    return schemas.TokenVerifyResponse(user_id=user_id)