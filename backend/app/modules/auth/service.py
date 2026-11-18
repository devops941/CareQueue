from typing import Optional
from datetime import timedelta, datetime, timezone
from fastapi import HTTPException, status
from app.modules.auth.schemas import UserCreate, UserOut, LoginRequest, TokenResponse
from app.modules.auth.repository import UserRepository
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import settings


class AuthService:
    def __init__(self):
        self.repo = UserRepository()

    def _to_user_out(self, doc: dict) -> UserOut:
        return UserOut(
            id=doc["id"],
            email=doc["email"],
            full_name=doc["full_name"],
            role=doc["role"],
            clinic_id=doc.get("clinic_id"),
            is_active=doc.get("is_active", True),
            is_onboarded=doc.get("is_onboarded", False),
            created_at=doc["created_at"],
        )

    async def register_user(self, data: UserCreate) -> UserOut:
        existing = await self.repo.find_by_email(data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        user_dict = data.model_dump()
        user_dict["hashed_password"] = hash_password(user_dict.pop("password"))
        user_id = await self.repo.create_user(user_dict)
        created = await self.repo.find_by_id(user_id)
        return self._to_user_out(created)

    async def authenticate(self, data: LoginRequest) -> TokenResponse:
        user = await self.repo.find_by_email(data.email)
        if not user or not verify_password(data.password, user.get("hashed_password", "")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account deactivated",
            )
        expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        token = create_access_token(
            data={"sub": user["id"], "role": user["role"], "clinic_id": user.get("clinic_id")},
            expires_delta=expires,
        )
        user_out = self._to_user_out(user)

        if user.get("clinic_id"):
            try:
                from app.modules.audit.service import log_event
                await log_event(
                    clinic_id=user["clinic_id"],
                    event_type="user.login",
                    actor_user_id=user["id"],
                    actor_email=user["email"],
                    target_id=user["id"],
                    target_type="user",
                    metadata={"role": user["role"], "auth_type": "bearer_jwt"},
                )
            except Exception:
                pass

        return TokenResponse(
            access_token=token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user_out,
        )

    async def get_user_by_id(self, user_id: str) -> UserOut:
        user = await self.repo.find_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return self._to_user_out(user)

    async def list_users(self, clinic_id: str) -> list[UserOut]:
        docs = await self.repo.find_by_clinic(clinic_id)
        return [self._to_user_out(d) for d in docs]

    async def deactivate_user(self, user_id: str) -> bool:
        return await self.repo.deactivate(user_id)
