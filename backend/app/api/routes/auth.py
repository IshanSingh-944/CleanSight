import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
import uuid

from app.services.db import get_db_connection

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "cleansight_super_secret_jwt_key_2026_secure")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

router = APIRouter(prefix="/auth", tags=["auth"])

class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    full_name: Optional[str] = None
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_optional_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[dict]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            return None
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT user_id, email, full_name, created_at FROM users WHERE user_id = ?", (user_id,))
        user = cursor.fetchone()
        conn.close()
        if user:
            return dict(user)
    except JWTError:
        pass
    return None

def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> dict:
    user = get_optional_current_user(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

@router.post("/register", response_model=TokenResponse)
async def register_user(body: UserRegisterRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT user_id FROM users WHERE email = ?", (body.email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered.")
        
    user_id = f"usr_{uuid.uuid4().hex[:10]}"
    hashed_pwd = hash_password(body.password)
    
    cursor.execute(
        "INSERT INTO users (user_id, email, hashed_password, full_name) VALUES (?, ?, ?, ?)",
        (user_id, body.email, hashed_pwd, body.full_name)
    )
    conn.commit()
    
    cursor.execute("SELECT user_id, email, full_name, created_at FROM users WHERE user_id = ?", (user_id,))
    user_row = cursor.fetchone()
    conn.close()
    
    user_dict = dict(user_row)
    token = create_access_token({"sub": user_id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_dict
    }

@router.post("/login", response_model=TokenResponse)
async def login_user(body: UserLoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (body.email,))
    user = cursor.fetchone()
    conn.close()
    
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password.")
        
    user_dict = {
        "user_id": user["user_id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "created_at": user["created_at"]
    }
    token = create_access_token({"sub": user["user_id"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_dict
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    return current_user
