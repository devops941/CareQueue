# Phase 03 — Authentication & RBAC

You are implementing Phase 03 of CareQueue: **Authentication & Role-Based Access Control**.

## Project Context
CareQueue uses JWT-based auth with 4 roles:
- `super_admin` — platform-wide access
- `clinic_admin` — full access within their clinic
- `analyst` — read + analytics within their clinic  
- `viewer` — read-only within their clinic

Tenant isolation is critical: users CANNOT access data from other clinics.

## Your Task

### 1. User Domain Models (`backend/app/modules/auth/`)

Create folder structure:
```
modules/auth/
├── __init__.py
├── schemas.py      # Pydantic request/response models
├── repository.py   # UserRepository(TenantRepository)
├── service.py      # Business logic
├── controller.py   # FastAPI route handlers
└── router.py       # APIRouter
```

**`schemas.py`**:
```python
class UserCreate(BaseModel):
    email: EmailStr
    password: str  # min 8 chars
    full_name: str
    role: Literal["super_admin", "clinic_admin", "analyst", "viewer"]
    clinic_id: Optional[str] = None  # required unless super_admin

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    clinic_id: Optional[str]
    is_active: bool
    created_at: datetime

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut
```

### 2. Security Utilities (`backend/app/core/security.py`)
```python
def hash_password(password: str) -> str  # bcrypt
def verify_password(plain: str, hashed: str) -> bool
def create_access_token(data: dict, expires_delta: timedelta) -> str  # JWT
def decode_access_token(token: str) -> dict  # raises HTTPException on invalid
```

### 3. Auth Dependencies (`backend/app/core/dependencies.py`)
```python
async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserOut
async def require_role(*roles: str):
    # Returns a FastAPI dependency that checks current_user.role in roles
    # Raises 403 if role not permitted
async def require_clinic_access(clinic_id: str, current_user: UserOut):
    # Raises 403 if user's clinic_id != clinic_id (unless super_admin)
```

### 4. Auth Service (`service.py`)
```python
class AuthService:
    async def register_user(data: UserCreate) -> UserOut
    async def authenticate(email: str, password: str) -> TokenResponse
    async def get_user_by_id(user_id: str) -> UserOut
    async def list_users(clinic_id: str) -> list[UserOut]
    async def deactivate_user(user_id: str) -> bool
```

### 5. Auth Router (`router.py`)
```
POST /api/v1/auth/register   → register new user (clinic_admin only)
POST /api/v1/auth/login      → returns JWT token
GET  /api/v1/auth/me         → current user info (authenticated)
POST /api/v1/auth/logout     → client-side token drop (200 OK)
GET  /api/v1/auth/users      → list users in clinic (clinic_admin+)
```

### 6. Frontend Auth Module (`frontend/src/modules/auth/`)

Create:
```
modules/auth/
├── AuthContext.tsx    # React context: user, login(), logout()
├── LoginPage.tsx      # Login form with email/password
├── useAuth.ts         # Hook wrapping AuthContext
└── ProtectedRoute.tsx # Redirect to /login if not authenticated
```

**`AuthContext.tsx`**: stores JWT in localStorage, provides `login(email, password)`, `logout()`, `user` state, `isAuthenticated` boolean.

**`LoginPage.tsx`**: Clean form with email + password fields. Zod validation. Shows error on failed login. Redirects to `/dashboard` on success.

**`ProtectedRoute.tsx`**: Wraps routes, redirects unauthenticated users to `/login`.

Update `App.tsx`:
- `/login` → LoginPage (public)
- `/` → redirect to `/dashboard`
- `/dashboard` → placeholder (ProtectedRoute-wrapped)

### 7. API Client Auth Interceptor (`frontend/src/lib/api-client.ts`)
Axios instance with:
- `Authorization: Bearer <token>` header injected from localStorage
- 401 response interceptor → clear token, redirect to `/login`

## Exit Gates
- [ ] `POST /api/v1/auth/login` returns JWT token
- [ ] `GET /api/v1/auth/me` returns user info when token is valid
- [ ] 401 returned on invalid/missing token
- [ ] 403 returned when role insufficient
- [ ] Passwords hashed with bcrypt (never stored plain)
- [ ] Frontend LoginPage renders and redirects on success
- [ ] ProtectedRoute blocks unauthenticated access
