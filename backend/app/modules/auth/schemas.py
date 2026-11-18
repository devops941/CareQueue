from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, Literal
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Literal["super_admin", "clinic_admin", "analyst", "viewer"]
    clinic_id: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("clinic_id")
    @classmethod
    def clinic_required_for_non_super(cls, v, info):
        role = info.data.get("role")
        if role != "super_admin" and not v:
            raise ValueError("clinic_id is required for non-super_admin roles")
        return v


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    clinic_id: Optional[str]
    is_active: bool
    is_onboarded: Optional[bool] = False
    created_at: datetime

    model_config = {"populate_by_name": True}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut


class PasswordChange(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v
