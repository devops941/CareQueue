from fastapi import APIRouter, Depends
from app.modules.auth.schemas import UserCreate, LoginRequest, UserOut, TokenResponse
from app.modules.auth.service import AuthService
from app.core.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=201)
async def register(data: UserCreate, _=Depends(require_roles("super_admin", "clinic_admin"))):
    service = AuthService()
    return await service.register_user(data)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    service = AuthService()
    return await service.authenticate(data)


@router.get("/me", response_model=UserOut)
async def me(current_user=Depends(get_current_user)):
    return current_user


@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}


@router.get("/users", response_model=list[UserOut])
async def list_users(current_user=Depends(require_roles("super_admin", "clinic_admin"))):
    service = AuthService()
    if current_user.role == "super_admin":
        return []
    return await service.list_users(current_user.clinic_id)
