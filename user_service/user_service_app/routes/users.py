from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from uuid import UUID

from user_service_app.database import get_db
from user_service_app.schemas import UserOut
from user_service_app.crud import get_user_by_id

router = APIRouter()

@router.get("/me", response_model=UserOut)
def get_me(user_id: UUID = Header(..., alias="X-User-Id"), db: Session = Depends(get_db)):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/{user_id}", response_model=UserOut)
def get_user_endpoint(user_id: UUID, db: Session = Depends(get_db)):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user