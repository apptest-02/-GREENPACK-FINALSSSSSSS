"""Greenpack Pro — Auth Router"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.models.base import User, AuditLog
from app.services.auth_service import (
    verify_password, create_access_token, create_refresh_token,
    decode_token, get_current_user
)
from datetime import datetime

router = APIRouter()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    role: str
    full_name: str

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email, User.active == True))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user.last_login = datetime.utcnow()
    db.add(AuditLog(
        company_id=user.company_id, user_id=user.id,
        action="LOGIN", resource_type="user", resource_id=user.id,
    ))
    await db.commit()
    return TokenResponse(
        access_token=create_access_token(user.id, user.email, user.role),
        refresh_token=create_refresh_token(user.id),
        user_id=user.id, email=user.email,
        role=user.role, full_name=user.full_name or "",
    )

@router.post("/refresh")
async def refresh(refresh_token: str, db: AsyncSession = Depends(get_db)):
    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    result = await db.execute(select(User).where(User.id == payload["sub"], User.active == True))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return {
        "access_token": create_access_token(user.id, user.email, user.role),
        "token_type": "bearer",
    }

@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id, "email": current_user.email,
        "full_name": current_user.full_name, "role": current_user.role,
        "company_id": current_user.company_id,
    }
