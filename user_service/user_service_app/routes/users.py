import logging
import uuid

import fastapi
from sqlalchemy import orm

from user_service_app import crud
from user_service_app import database
from user_service_app import log_config
from user_service_app import schemas

router = fastapi.APIRouter()


@router.get("/me", response_model=schemas.UserOut)
def get_me(
    request: fastapi.Request,
    user_id: uuid.UUID = fastapi.Header(..., alias="X-User-Id"),
    db: orm.Session = fastapi.Depends(database.get_db),
):
    user = crud.get_user_by_id(db, user_id)
    if not user:
        log_config.log(request, logging.WARNING, "user_me_not_found", user_id=str(user_id))
        raise fastapi.HTTPException(status_code=404, detail="User not found")

    return user


@router.get("/{user_id}", response_model=schemas.UserOut)
def get_user_endpoint(
    request: fastapi.Request,
    user_id: uuid.UUID,
    db: orm.Session = fastapi.Depends(database.get_db),
):
    user = crud.get_user_by_id(db, user_id)
    if not user:
        log_config.log(request, logging.WARNING, "user_get_not_found", user_id=str(user_id))
        raise fastapi.HTTPException(status_code=404, detail="User not found")

    return user