# Phase 10 — Waiting-Time Analytics Engine

You are implementing Phase 10 of CareQueue: **Waiting-Time Calculation Engine**.

## Project Context
This is the core analytics module. CareQueue computes statistical measures from observed (historical) visit data.

**Data Source Labels**:
- ALL metrics from this module must be labeled as `source: "historical"` in API responses
- Historical data must NEVER be mixed with or presented as simulation data

**Key Metrics**:
- Mean, median, P75, P90, P95 waiting times
- By: department, doctor, time slot, visit type, day of week

## Your Task

### 1. Analytics Domain Functions (`backend/app/domain/analytics/`)

Create:
```
domain/analytics/
├── __init__.py
├── waiting_times.py    # Core statistical calculations
├── aggregations.py     # Group-by and roll-up functions
└── time_slots.py       # Time-slot bucketing logic
```

**`waiting_times.py`** — pure functions using NumPy/Pandas:
```python
def compute_percentiles(values: list[float], percentiles: list[int] = [50, 75, 90, 95]) -> dict:
    """
    Returns {p50: float, p75: float, p90: float, p95: float}.
    Uses numpy.nanpercentile (ignores None/NaN).
    """

def compute_summary_stats(values: list[float]) -> dict:
    """
    Returns {mean, median, std, min, max, p75, p90, p95, count, missing_count}.
    """

def compute_waiting_time_distribution(values: list[float], bins: int = 20) -> dict:
    """
    Returns {bins: list[float], counts: list[int]} for histogram.
    """

def compute_waiting_times_for_visits(visits: list[dict]) -> list[dict]:
    """
    For each visit, compute all waiting time fields.
    Returns visits with added fields: registration_wait_minutes, queue_wait_minutes,
    service_time_minutes, total_visit_minutes.
    Uses domain/waiting_times.compute_waiting_times() per visit.
    """
```

**`aggregations.py`**:
```python
def aggregate_by_department(visits: list[dict], metric: str) -> list[dict]:
    """
    Group visits by department_id. For each group, compute summary stats for metric.
    Returns [{department_id, department_name, stats: {...}, count: N}]
    """

def aggregate_by_doctor(visits: list[dict], metric: str) -> list[dict]:
    """Group by doctor_id, compute stats per doctor."""

def aggregate_by_day_of_week(visits: list[dict], metric: str) -> list[dict]:
    """Group by day of week (0=Mon, 6=Sun), compute stats."""

def aggregate_by_visit_type(visits: list[dict], metric: str) -> list[dict]:
    """Group by visit_type field."""
```

**`time_slots.py`**:
```python
def bucket_into_slots(visits: list[dict], slot_minutes: int = 60) -> list[dict]:
    """
    Assign each visit to a time slot based on arrival_time.
    Returns visits with added field: time_slot (e.g. "09:00", "10:00")
    """

def aggregate_by_time_slot(visits: list[dict], metric: str, slot_minutes: int = 60) -> list[dict]:
    """
    Group visits by time slot, compute stats per slot.
    Returns [{time_slot: "09:00", stats: {...}, count: N}]
    """
```

### 2. Analytics Module Backend (`backend/app/modules/analytics/historical/`)

```
modules/analytics/historical/
├── __init__.py
├── schemas.py
├── service.py
└── router.py
```

**`schemas.py`**:
```python
class AnalyticsQuery(BaseModel):
    clinic_id: str
    start_date: date
    end_date: date
    department_ids: Optional[list[str]] = None  # None = all departments
    doctor_ids: Optional[list[str]] = None
    visit_types: Optional[list[str]] = None
    metric: Literal["queue_wait", "registration_wait", "service_time", "total_visit"] = "queue_wait"
    group_by: Literal["department", "doctor", "day_of_week", "time_slot", "visit_type"] = "department"
    slot_minutes: int = 60  # for time_slot grouping

class AnalyticsResult(BaseModel):
    source: Literal["historical"] = "historical"  # ALWAYS set to "historical"
    query: AnalyticsQuery
    summary: dict  # overall stats for the filtered dataset
    breakdown: list[dict]  # per-group stats
    distribution: dict  # histogram data for overall metric
    generated_at: datetime
```

**`service.py`**:
```python
class HistoricalAnalyticsService:
    async def compute_analytics(query: AnalyticsQuery) -> AnalyticsResult:
        # 1. Load visits from repository (filtered by date range, dept, doctor, visit_type)
        # 2. Exclude excluded visits (excluded != True)
        # 3. Compute waiting times for all visits
        # 4. Compute overall summary stats
        # 5. Apply group_by aggregation
        # 6. Compute distribution
        # 7. Return AnalyticsResult with source="historical"
```

**`router.py`**:
```
POST  /api/v1/clinics/{clinic_id}/analytics/historical/compute  → compute analytics
GET   /api/v1/clinics/{clinic_id}/analytics/historical/summary  → quick summary (last 30 days)
```

### 3. Frontend — Historical Analytics Page (`frontend/src/modules/analytics/historical/`)

**`HistoricalAnalyticsPage.tsx`**:

**Filter Panel** (top):
- Date range picker
- Metric selector: Queue Wait | Registration Wait | Service Time | Total Visit
- Group By: Department | Doctor | Day of Week | Time Slot | Visit Type
- Department multi-select (optional filter)
- "Compute" button

**Results Panel** (below):
- **Source Badge**: Green pill "Historical Data" — always visible

- **Summary Cards** (4 KPI cards):
  - Mean Wait Time
  - Median Wait Time
  - P90 Wait Time
  - Total Visits Analyzed

- **Bar Chart** (Recharts): group-by dimension on X axis, mean wait time on Y axis. Tooltip shows full stats.

- **Distribution Histogram** (Recharts BarChart): wait time buckets on X, count on Y

- **Breakdown Table**: group name, count, mean, median, p75, p90, p95

**`useHistoricalAnalytics.ts`**: TanStack Query with `enabled: false` (compute on button click)

Route: `/analytics/historical` → HistoricalAnalyticsPage

## Exit Gates
- [ ] `compute_percentiles()` returns correct P50/P75/P90/P95 using numpy
- [ ] `aggregate_by_department()` groups visits correctly
- [ ] `aggregate_by_time_slot()` with 60-min slots buckets correctly
- [ ] `POST .../analytics/historical/compute` returns AnalyticsResult with `source: "historical"`
- [ ] Excluded visits are NOT included in analytics
- [ ] Frontend shows source badge "Historical Data"
- [ ] Bar chart and histogram render with Recharts
- [ ] All 4 KPI summary cards populate
