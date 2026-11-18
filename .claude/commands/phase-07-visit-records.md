# Phase 07 — Visit Records & Operational Events

You are implementing Phase 07 of CareQueue: **Patient Visit & Operational Event Records**.

## Project Context
Visits are the core data entity — pseudonymous patient operational events with timestamps. CareQueue computes all waiting-time analytics from these timestamps.

**Key timestamps in a visit**:
- `arrival_time` — patient arrives at clinic
- `registration_time` — checked in at reception
- `triage_time` — seen by triage nurse (optional)
- `called_time` — called into consultation
- `service_start_time` — doctor starts consultation
- `service_end_time` — consultation ends
- `departure_time` — patient leaves

**Derived waiting times** (computed, not stored):
- Registration wait = `registration_time - arrival_time`
- Queue wait = `called_time - registration_time`
- Service time = `service_end_time - service_start_time`
- Total visit time = `departure_time - arrival_time`

## Your Task

### 1. Visit Module Backend (`backend/app/modules/visits/`)

```
modules/visits/
├── __init__.py
├── schemas.py
├── repository.py
├── service.py
├── controller.py
└── router.py
```

**`schemas.py`**:
```python
class VisitCreate(BaseModel):
    clinic_id: str
    department_id: str
    doctor_id: Optional[str]
    patient_token: str  # pseudonymous identifier, NOT real patient ID
    visit_date: date    # local clinic date
    arrival_time: datetime      # UTC
    registration_time: Optional[datetime]
    triage_time: Optional[datetime]
    called_time: Optional[datetime]
    service_start_time: Optional[datetime]
    service_end_time: Optional[datetime]
    departure_time: Optional[datetime]
    visit_type: Literal["new", "follow_up", "emergency", "walk_in"]
    notes: Optional[str]

    @validator("arrival_time", "registration_time", ... )
    def must_be_chronological(cls, values):
        # arrival ≤ registration ≤ triage ≤ called ≤ service_start ≤ service_end ≤ departure
        # Raise ValueError if order violated

class VisitOut(VisitCreate):
    id: str
    created_at: datetime
    updated_at: datetime
    # Computed fields
    registration_wait_minutes: Optional[float]
    queue_wait_minutes: Optional[float]
    service_time_minutes: Optional[float]
    total_visit_minutes: Optional[float]
```

**`repository.py`**: `VisitRepository(TenantRepository)` with additional methods:
```python
async def find_by_date_range(clinic_id: str, start: datetime, end: datetime) -> list[dict]
async def find_by_department(clinic_id: str, department_id: str, start: datetime, end: datetime) -> list[dict]
async def find_by_doctor(clinic_id: str, doctor_id: str, start: datetime, end: datetime) -> list[dict]
async def bulk_insert(clinic_id: str, visits: list[dict]) -> int  # returns count inserted
```

**`service.py`**:
```python
class VisitService:
    async def create_visit(data: VisitCreate, clinic_id: str) -> VisitOut
    async def get_visit(visit_id: str, clinic_id: str) -> VisitOut
    async def list_visits(clinic_id: str, filters: VisitFilters) -> PaginatedVisits
    async def update_visit(visit_id: str, clinic_id: str, data: dict) -> VisitOut
    async def delete_visit(visit_id: str, clinic_id: str) -> bool
    async def compute_waiting_times(visit: dict) -> dict  # adds computed fields
```

**`router.py`**:
```
POST   /api/v1/clinics/{clinic_id}/visits                 → create visit
GET    /api/v1/clinics/{clinic_id}/visits                 → list visits (filtered)
GET    /api/v1/clinics/{clinic_id}/visits/{id}            → get visit
PATCH  /api/v1/clinics/{clinic_id}/visits/{id}            → update visit
DELETE /api/v1/clinics/{clinic_id}/visits/{id}            → delete visit (clinic_admin only)
```

Query params for list: `start_date`, `end_date`, `department_id`, `doctor_id`, `visit_type`, `page`, `page_size`

### 2. Computed Field Logic (`backend/app/domain/waiting_times.py`)
Pure function (no DB, no FastAPI):
```python
def compute_waiting_times(visit: dict) -> dict:
    """Adds computed waiting time fields to visit dict. Returns new dict."""
    # registration_wait_minutes: (registration_time - arrival_time).total_seconds() / 60
    # queue_wait_minutes: (called_time - registration_time).total_seconds() / 60 if both present
    # service_time_minutes: (service_end_time - service_start_time).total_seconds() / 60 if both present
    # total_visit_minutes: (departure_time - arrival_time).total_seconds() / 60 if both present
    # Return None for fields where either timestamp is missing
```

### 3. Chronological Validation (`backend/app/domain/visit_validation.py`)
```python
def validate_visit_chronology(visit_data: dict) -> list[str]:
    """Returns list of validation error strings. Empty list = valid."""
    # Check: arrival ≤ registration ≤ triage ≤ called ≤ service_start ≤ service_end ≤ departure
    # Only compare pairs where both timestamps are present
```

### 4. Frontend — Visit Records (`frontend/src/modules/visits/`)

**`VisitsPage.tsx`**:
- Date range picker (default: last 7 days)
- Filter by department, doctor, visit type
- Paginated table: Patient Token, Date, Dept, Doctor, Reg Wait, Queue Wait, Service Time, Total
- "Add Visit" button (manual entry)
- Export button (CSV)

**`VisitForm.tsx`**:
- All timestamp fields with datetime-local inputs
- Real-time chronology validation (show inline errors if times are out of order)
- Visit type selector
- Department + Doctor selectors (linked — doctor list filters by selected dept)

**`useVisits.ts`**: TanStack Query hooks

Route: `/data/visits` → VisitsPage

## Exit Gates
- [ ] `POST /api/v1/clinics/{clinic_id}/visits` creates and returns visit with computed waiting times
- [ ] Chronological validation rejects out-of-order timestamps with 422 error
- [ ] `compute_waiting_times()` pure function in `domain/` returns correct computed fields
- [ ] `validate_visit_chronology()` pure function returns errors correctly
- [ ] `bulk_insert()` repository method works for batch imports
- [ ] Frontend VisitsPage table shows computed wait times
- [ ] VisitForm validates timestamps in real time
