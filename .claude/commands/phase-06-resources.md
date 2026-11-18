# Phase 06 — Resource & Doctor Management

You are implementing Phase 06 of CareQueue: **Doctor & Staff Resource Management**.

## Project Context
Doctors/staff are resources assigned to departments within a clinic. Their capacity (how many patients they can see, their schedule) feeds into both analytics and simulation.

## Your Task

### 1. Doctors Module Backend (`backend/app/modules/doctors/`)

Create the full module structure:
```
modules/doctors/
├── __init__.py
├── schemas.py
├── repository.py
├── service.py
├── controller.py
└── router.py
```

**`schemas.py`**:
```python
class DoctorCreate(BaseModel):
    clinic_id: str
    department_id: str
    full_name: str
    specialization: str
    employee_id: Optional[str]
    schedule: WeeklySchedule
    max_patients_per_slot: int = 1
    avg_consultation_minutes: float

class WeeklySchedule(BaseModel):
    monday: DaySchedule | None
    tuesday: DaySchedule | None
    wednesday: DaySchedule | None
    thursday: DaySchedule | None
    friday: DaySchedule | None
    saturday: DaySchedule | None
    sunday: DaySchedule | None

class DaySchedule(BaseModel):
    start: str    # "09:00"
    end: str      # "17:00"
    break_start: Optional[str]  # "13:00"
    break_end: Optional[str]    # "14:00"
    is_working: bool

class DoctorOut(DoctorCreate):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
```

**`repository.py`**: `DoctorRepository(TenantRepository)` — all queries scoped to `clinic_id`

**`service.py`**:
```python
class DoctorService:
    async def create_doctor(data: DoctorCreate, clinic_id: str) -> DoctorOut
    async def get_doctor(doctor_id: str, clinic_id: str) -> DoctorOut
    async def list_doctors(clinic_id: str, department_id: Optional[str] = None) -> list[DoctorOut]
    async def update_doctor(doctor_id: str, clinic_id: str, data: dict) -> DoctorOut
    async def deactivate_doctor(doctor_id: str, clinic_id: str) -> bool
    async def get_doctor_capacity(doctor_id: str, clinic_id: str) -> dict
        # Returns: {available_days: [...], weekly_hours: float, avg_patients_per_day: float}
```

**`router.py`**:
```
POST   /api/v1/clinics/{clinic_id}/doctors           → create doctor
GET    /api/v1/clinics/{clinic_id}/doctors           → list doctors
GET    /api/v1/clinics/{clinic_id}/doctors/{id}      → get doctor
PATCH  /api/v1/clinics/{clinic_id}/doctors/{id}      → update doctor
DELETE /api/v1/clinics/{clinic_id}/doctors/{id}      → deactivate doctor
GET    /api/v1/clinics/{clinic_id}/doctors/{id}/capacity → doctor capacity summary
```

All endpoints: verify `current_user.clinic_id == clinic_id`. Minimum role: `clinic_admin` for write, `analyst` for read.

### 2. Schedule Validation
In `DoctorService`: validate `break_start < break_end`, `start < end`, `break_start > start`, `break_end < end`. Raise `HTTPException(422, detail={field: message})` on violations.

### 3. Frontend — Doctor Management (`frontend/src/modules/doctors/`)

**`DoctorsPage.tsx`**:
- Filter by department (dropdown)
- Table columns: Name, Specialization, Department, Weekly Hours, Avg Consultation (min), Status
- "Add Doctor" → modal form
- Click row → doctor detail view

**`DoctorForm.tsx`**:
Form fields:
- Full name, Specialization, Employee ID (optional)
- Department selector (fetched from `/departments`)
- Avg consultation minutes (number input)
- Max patients per slot (number input)
- Weekly schedule: 7-day grid with start/end/break times and working toggle

**`DoctorDetailPage.tsx`**:
- Doctor info card
- Capacity summary: available days, weekly hours, estimated daily patient load
- Edit button (clinic_admin only)

**`useDoctors.ts`**: TanStack Query hooks for all doctor operations

Route: `/settings/doctors` → DoctorsPage, `/settings/doctors/:id` → DoctorDetailPage

### 4. Capacity Calculator (Frontend Utility)
`frontend/src/utils/capacity.ts`:
```typescript
export function calcDailyCapacity(schedule: DaySchedule, avgMinutes: number): number
  // (working_minutes - break_minutes) / avgMinutes

export function calcWeeklyCapacity(weeklySchedule: WeeklySchedule, avgMinutes: number): number
  // sum of daily capacities for working days
```

## Exit Gates
- [ ] `POST /api/v1/clinics/{clinic_id}/doctors` creates doctor with weekly schedule
- [ ] Schedule time validation works (break within shift hours)
- [ ] `GET /api/v1/clinics/{clinic_id}/doctors/{id}/capacity` returns capacity data
- [ ] Cross-clinic doctor access returns 403
- [ ] Frontend DoctorsPage table renders with department filter
- [ ] DoctorForm has 7-day schedule grid
- [ ] `calcDailyCapacity` and `calcWeeklyCapacity` utility functions exist
