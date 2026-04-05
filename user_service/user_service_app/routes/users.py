import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session

from user_service_app.crud import get_user_by_id
from user_service_app.database import get_db
from user_service_app.log_config import log
from user_service_app.schemas import UserOut

router = APIRouter()


@router.get("/me", response_model=UserOut)
def get_me(
    request: Request,
    user_id: UUID = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    user = get_user_by_id(db, user_id)
    if not user:
        log(request, logging.WARNING, "user_me_not_found", user_id=str(user_id))
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.get("/{user_id}", response_model=UserOut)
def get_user_endpoint(request: Request, user_id: UUID, db: Session = Depends(get_db)):
    user = get_user_by_id(db, user_id)
    if not user:
        log(request, logging.WARNING, "user_get_not_found", user_id=str(user_id))
        raise HTTPException(status_code=404, detail="User not found")

    return user