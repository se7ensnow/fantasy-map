from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

from user_service_app.schemas import UserCreate, UserOut, Token, TokenVerifyResponse, TokenVerifyRequest
from user_service_app.crud import create_user, authenticate_user, get_user_by_id, is_email_taken, is_username_taken
from user_service_app.database import get_db
from user_service_app.security import create_access_token, verify_jwt_token

router = APIRouter()

@router.post("/register", response_model=UserOut)
async def register_endpoint(user_in: UserCreate, db: Session = Depends(get_db)):
    if is_username_taken(db, user_in.username):
        raise HTTPException(status_code=400, detail="Username is already taken")
    if is_email_taken(db, str(user_in.email)):
        raise HTTPException(status_code=400, detail="Email is already taken")
    user = create_user(db, user_in)
    return user

@router.post("/login", response_model=Token)
async def login_endpoint(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=access_token, token_type="bearer")

@router.post("/verify-token", response_model=TokenVerifyResponse)
async def verify_token_endpoint(token_in: TokenVerifyRequest):
    user_id = verify_jwt_token(token_in.access_token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return TokenVerifyResponse(user_id=user_id)

