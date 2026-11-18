# Phase 09 — Data Cleaning & Quality

You are implementing Phase 09 of CareQueue: **Data Quality, Preprocessing & Outlier Detection**.

## Project Context
Before analytics can be computed, visit data must be cleaned and validated. Quality issues include:
- Duplicate visits (same patient_token + date + department)
- Extreme outlier waiting times (data entry errors)
- Missing critical timestamps
- Impossible values (negative wait times, service longer than shift)

**Important**: CareQueue flags quality issues but lets the user decide what to do — it does NOT auto-delete data.

## Your Task

### 1. Data Quality Module (`backend/app/modules/data_quality/`)

```
modules/data_quality/
├── __init__.py
├── schemas.py
├── service.py
└── router.py
```

**`schemas.py`**:
```python
class QualityIssue(BaseModel):
    visit_id: str
    issue_type: Literal["duplicate", "outlier", "missing_timestamp", "impossible_value", "chronology_violation"]
    field: Optional[str]
    description: str
    severity: Literal["warning", "error"]
    suggested_action: Literal["review", "exclude", "delete"]

class QualityReport(BaseModel):
    clinic_id: str
    date_range: DateRange
    total_visits: int
    issues: list[QualityIssue]
    summary: dict  # counts by issue_type and severity

class QualityFilter(BaseModel):
    exclude_visit_ids: list[str]  # visits to exclude from analytics
    reason: str
```

### 2. Quality Analysis Functions (`backend/app/domain/data_quality.py`)
Pure functions — no DB access:

```python
def find_duplicates(visits: list[dict]) -> list[QualityIssue]:
    """
    Find duplicate visits: same patient_token + visit_date + department_id.
    Returns QualityIssue for each duplicate (keep first occurrence, flag rest).
    """

def find_outliers(visits: list[dict], field: str, method: str = "iqr") -> list[QualityIssue]:
    """
    Detect outliers in numeric fields (queue_wait_minutes, service_time_minutes, etc.)
    IQR method: flag values beyond Q1 - 1.5*IQR and Q3 + 1.5*IQR
    Z-score method: flag |z| > 3
    Returns QualityIssue for each outlier.
    """

def find_missing_timestamps(visits: list[dict]) -> list[QualityIssue]:
    """
    Flag visits missing any of: arrival_time, registration_time, service_start_time, service_end_time.
    Severity: 'error' for arrival_time missing, 'warning' for others.
    """

def find_impossible_values(visits: list[dict]) -> list[QualityIssue]:
    """
    Flag: negative wait times, service > 8 hours, total visit > 24 hours.
    """

def run_full_quality_check(visits: list[dict]) -> QualityReport:
    """
    Run all checks. Aggregate into QualityReport.
    """
```

### 3. Quality Service (`service.py`)
```python
class DataQualityService:
    async def run_quality_check(clinic_id: str, start: date, end: date) -> QualityReport
        # 1. Load visits from repository for date range
        # 2. Compute waiting times on each visit (call domain/waiting_times.py)
        # 3. Run all quality checks
        # 4. Return QualityReport

    async def mark_visits_excluded(clinic_id: str, visit_ids: list[str], reason: str) -> int
        # Set excluded=True + exclusion_reason on visit documents
        # Returns count updated

    async def get_exclusion_list(clinic_id: str) -> list[dict]
        # Return all visits with excluded=True
```

**`router.py`**:
```
POST   /api/v1/clinics/{clinic_id}/data-quality/check    → run quality check
POST   /api/v1/clinics/{clinic_id}/data-quality/exclude  → mark visits as excluded
GET    /api/v1/clinics/{clinic_id}/data-quality/excluded → list excluded visits
```

### 4. Add `excluded` Field to Visits
In `VisitRepository`: add `excluded: bool = False` and `exclusion_reason: str = None` to visit schema. All analytics queries must filter `excluded != True` by default.

Update `VisitRepository.find_by_date_range()` to add `{"excluded": {"$ne": True}}` to filter.

### 5. Frontend — Data Quality Page (`frontend/src/modules/data-quality/`)

**`DataQualityPage.tsx`**:
- Date range picker
- "Run Quality Check" button → loading state
- **Quality Summary Cards**:
  - Total visits analyzed
  - Duplicates found
  - Outliers detected
  - Missing timestamps
  - Impossible values
- **Issues Table**: Visit ID, Issue Type, Field, Description, Severity badge, Action buttons
- Bulk "Exclude Selected" action with reason input
- "View Excluded" toggle to see excluded visits

**`useDataQuality.ts`**: TanStack Query hooks

Route: `/data/quality` → DataQualityPage

### 6. Outlier Visualization
In DataQualityPage, add a simple box plot using Recharts showing queue_wait_minutes distribution with outlier markers (dots beyond whiskers).

## Exit Gates
- [ ] `find_duplicates()` correctly identifies same-patient same-date same-dept visits
- [ ] `find_outliers()` IQR method flags values beyond Q1-1.5IQR and Q3+1.5IQR
- [ ] `run_full_quality_check()` aggregates all issues into QualityReport
- [ ] `POST .../data-quality/check` runs check and returns report
- [ ] Excluded visits are filtered out of all analytics queries
- [ ] Frontend shows quality summary cards + issues table
- [ ] Bulk exclude action marks visits with exclusion reason
