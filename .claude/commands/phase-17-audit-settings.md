# Phase 17 — Audit Logs & Settings

You are implementing Phase 17 of CareQueue: **Audit Trail, System Settings & Notifications**.

## Project Context
- Audit logs are **append-only** — never edited or deleted
- Every significant action must create an audit entry
- Settings include per-clinic configuration and per-user notification preferences

## Your Task

### 1. Audit Log System (`backend/app/modules/audit/`)

```
modules/audit/
├── __init__.py
├── schemas.py
├── repository.py    # AuditRepository — append-only (no update/delete methods)
├── service.py
└── router.py
```

**`schemas.py`**:
```python
class AuditEventType(str, Enum):
    # Auth events
    USER_LOGIN = "user.login"
    USER_LOGOUT = "user.logout"
    USER_CREATED = "user.created"
    USER_DEACTIVATED = "user.deactivated"
    # Data events
    VISIT_CREATED = "visit.created"
    VISIT_UPDATED = "visit.updated"
    VISIT_DELETED = "visit.deleted"
    DATASET_IMPORTED = "dataset.imported"
    VISITS_EXCLUDED = "visits.excluded"
    # Analytics events
    ANALYTICS_COMPUTED = "analytics.computed"
    SIMULATION_RUN = "simulation.run"
    REPORT_GENERATED = "report.generated"
    # Config events
    CLINIC_UPDATED = "clinic.updated"
    DOCTOR_CREATED = "doctor.created"

class AuditEntry(BaseModel):
    id: str
    clinic_id: str
    event_type: AuditEventType
    actor_user_id: str
    actor_email: str
    target_id: Optional[str]   # ID of affected resource
    target_type: Optional[str]  # e.g. "visit", "dataset"
    metadata: dict  # event-specific details (never store PII/passwords)
    ip_address: Optional[str]
    created_at: datetime  # immutable
```

**`repository.py`**: `AuditRepository(BaseRepository)` — override to disable `update_one` and `delete_one` (raise `NotImplementedError`).

```python
class AuditRepository(BaseRepository):
    async def append(self, entry: dict) -> str:
        """Insert audit entry. Only valid write operation."""

    async def find_by_clinic(self, clinic_id: str, filters: dict, skip: int, limit: int) -> list[dict]:
        """Find audit entries scoped to clinic, sorted by created_at DESC."""

    async def update_one(self, *args, **kwargs):
        raise NotImplementedError("Audit log is append-only")

    async def delete_one(self, *args, **kwargs):
        raise NotImplementedError("Audit log is append-only")
```

**`service.py`**:
```python
class AuditService:
    async def log(
        clinic_id: str,
        event_type: AuditEventType,
        actor: UserOut,
        target_id: Optional[str] = None,
        target_type: Optional[str] = None,
        metadata: dict = {}
    ) -> None:
        """Create and append audit entry. Never raises (fire-and-forget)."""

    async def list_entries(
        clinic_id: str,
        event_types: Optional[list[str]] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        page_size: int = 50
    ) -> PaginatedAuditEntries
```

**Instrument all existing endpoints**: add `audit_service.log(...)` calls:
- After every `create`, `update`, `delete` operation
- After every login/logout
- After every dataset import, simulation run, report generation

**`router.py`**:
```
GET  /api/v1/clinics/{clinic_id}/audit             → list audit entries
GET  /api/v1/clinics/{clinic_id}/audit/export      → export audit as CSV
```
Minimum role: `clinic_admin`

### 2. Settings Module (`backend/app/modules/settings/`)

**`schemas.py`**:
```python
class ClinicSettings(BaseModel):
    # Analytics defaults
    default_slot_minutes: int = 60
    default_analytics_days: int = 30
    outlier_method: Literal["iqr", "zscore"] = "iqr"
    # Simulation defaults
    default_replications: int = 10
    default_simulation_hours: float = 8.0
    # UI/Display
    timezone_display: str  # mirrors clinic timezone
    date_format: str = "DD/MM/YYYY"

class NotificationSettings(BaseModel):
    email_on_import_complete: bool = True
    email_on_simulation_complete: bool = True
    email_on_quality_issues: bool = True
    quality_threshold_pct: float = 95.0
```

Routes:
```
GET   /api/v1/clinics/{clinic_id}/settings         → get settings
PATCH /api/v1/clinics/{clinic_id}/settings         → update settings
GET   /api/v1/clinics/{clinic_id}/settings/notifications  → get notification settings
PATCH /api/v1/clinics/{clinic_id}/settings/notifications  → update notification settings
```

### 3. Frontend — Audit Log Page (`frontend/src/modules/audit/`)

**`AuditLogPage.tsx`**:
- Filter: event type multi-select, date range, actor (user) search
- Paginated table: Timestamp, Event Type (badge), Actor, Target, Details (expandable)
- "Export CSV" button
- Each row expandable to show full metadata

**Event Type Badge Colors**:
- auth events: blue
- data events: green
- analytics/simulation: purple
- config changes: amber

### 4. Frontend — Settings Page (`frontend/src/modules/settings/`)

**`ClinicSettingsPage.tsx`** (extend from Phase 05):
Add sections:
- Analytics Defaults (slot size, days, outlier method)
- Simulation Defaults (replications, hours)
- Display (date format)

**`NotificationSettingsPage.tsx`**:
- Toggle switches for each notification type
- Threshold input for quality alerts

Routes: `/settings/audit` → AuditLogPage, `/settings/notifications` → NotificationSettingsPage

## Exit Gates
- [ ] `AuditRepository` raises `NotImplementedError` on update/delete
- [ ] All major operations (create/update/delete visits, imports, simulations) create audit entries
- [ ] `GET .../audit` returns paginated, filterable audit log
- [ ] Audit log export returns CSV
- [ ] `ClinicSettings` and `NotificationSettings` PATCH endpoints update correctly
- [ ] Frontend AuditLogPage shows paginated log with event type badges
- [ ] AuditRepository.append() is the only write method available
