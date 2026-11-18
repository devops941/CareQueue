# Phase 05 — Clinic & Department Configuration

You are implementing Phase 05 of CareQueue: **Clinic & Department Configuration (Multi-Tenant Setup)**.

## Project Context
CareQueue is multi-tenant. Each clinic is a tenant. All data is scoped by `clinic_id`.
- `super_admin` can create/manage clinics
- `clinic_admin` can configure their own clinic's departments

## Your Task

### 1. Clinic Module Backend (`backend/app/modules/clinics/`)

Create:
```
modules/clinics/
├── __init__.py
├── schemas.py
├── repository.py
├── service.py
├── controller.py
└── router.py
```

**`schemas.py`**:
```python
class ClinicCreate(BaseModel):
    name: str
    slug: str  # URL-safe unique identifier, lowercase, hyphens only
    timezone: str  # e.g. "Asia/Kolkata" — validated against pytz
    working_hours: WorkingHours
    contact_email: EmailStr
    address: Optional[str]

class WorkingHours(BaseModel):
    monday: DaySchedule | None
    tuesday: DaySchedule | None
    # ... all 7 days

class DaySchedule(BaseModel):
    open: str    # "08:00" HH:MM
    close: str   # "18:00" HH:MM
    is_open: bool

class ClinicOut(ClinicCreate):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
```

**`repository.py`**: `ClinicRepository(BaseRepository)` — not tenant-scoped (clinics are top-level)

**`service.py`**:
```python
class ClinicService:
    async def create_clinic(data: ClinicCreate) -> ClinicOut
    async def get_clinic(clinic_id: str) -> ClinicOut
    async def get_clinic_by_slug(slug: str) -> ClinicOut
    async def update_clinic(clinic_id: str, data: dict) -> ClinicOut
    async def list_clinics() -> list[ClinicOut]  # super_admin only
```

**`router.py`**:
```
POST   /api/v1/clinics           → create clinic (super_admin)
GET    /api/v1/clinics           → list all clinics (super_admin)
GET    /api/v1/clinics/{id}      → get clinic (clinic_admin of that clinic)
PATCH  /api/v1/clinics/{id}      → update clinic (clinic_admin)
```

### 2. Department Module Backend (`backend/app/modules/departments/`)

Same structure as clinics module.

**`schemas.py`**:
```python
class DepartmentCreate(BaseModel):
    clinic_id: str
    name: str
    code: str  # short code e.g. "OPD", "CARDIO"
    service_type: Literal["consultation", "diagnostic", "procedure", "pharmacy"]
    avg_service_time_minutes: float  # for simulation defaults
    max_concurrent_patients: int

class DepartmentOut(DepartmentCreate):
    id: str
    is_active: bool
    created_at: datetime
```

**`router.py`**:
```
POST   /api/v1/clinics/{clinic_id}/departments       → create department
GET    /api/v1/clinics/{clinic_id}/departments       → list departments
PATCH  /api/v1/clinics/{clinic_id}/departments/{id} → update department
DELETE /api/v1/clinics/{clinic_id}/departments/{id} → deactivate (soft delete)
```

**Security**: Every endpoint verifies `current_user.clinic_id == clinic_id` (or super_admin).

### 3. Frontend — Clinic Settings Page (`frontend/src/modules/clinics/`)

**`ClinicSettingsPage.tsx`**:
- Display current clinic info (name, timezone, working hours)
- Edit form for clinic_admin role
- Working hours grid: 7 rows (Mon-Sun), each with open/close time pickers and toggle
- Save button with success toast

**`DepartmentsPage.tsx`**:
- Table of departments with columns: Name, Code, Service Type, Avg Service Time, Status
- "Add Department" button → modal form
- Edit/deactivate actions per row

**`useClinics.ts`**: TanStack Query hooks for `useClinic()`, `useUpdateClinic()`, `useDepartments()`, `useCreateDepartment()`

Route: `/settings/clinic` → ClinicSettingsPage, `/settings/departments` → DepartmentsPage

### 4. Slug Validation
In `ClinicService.create_clinic()`: validate slug is unique before insert. Raise `HTTPException(400, "slug already taken")`.

## Exit Gates
- [ ] `POST /api/v1/clinics` creates clinic with working hours
- [ ] `GET /api/v1/clinics/{id}` returns clinic by id
- [ ] `POST /api/v1/clinics/{clinic_id}/departments` creates department
- [ ] Cross-clinic access returns 403
- [ ] Frontend ClinicSettingsPage renders clinic info
- [ ] DepartmentsPage shows table with add/edit actions
- [ ] Slug uniqueness validated
