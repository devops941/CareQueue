# Phase 15 — Dashboard & Insights

You are implementing Phase 15 of CareQueue: **Main Dashboard, KPI Summary & Insights Engine**.

## Project Context
The dashboard is the first thing users see after login. It provides:
- Clinic-at-a-glance KPI summary
- Recent activity feed
- Quick insights (automated observations about the data)
- Navigation shortcuts to detailed analytics

**Source labels are mandatory on every metric displayed**:
- Historical data → green badge "Historical"
- Simulation data → orange badge "Simulation"
- Mixed/derived → specify clearly

## Your Task

### 1. Dashboard API (`backend/app/modules/dashboard/`)

```
modules/dashboard/
├── __init__.py
├── schemas.py
├── service.py
└── router.py
```

**`schemas.py`**:
```python
class DashboardSummary(BaseModel):
    clinic_id: str
    period: str  # e.g. "Last 30 days"
    kpis: DashboardKPIs
    recent_insights: list[Insight]
    activity_feed: list[ActivityEvent]
    generated_at: datetime

class DashboardKPIs(BaseModel):
    # All from historical data — source: "historical"
    total_visits: int
    mean_queue_wait_minutes: float
    median_queue_wait_minutes: float
    p90_queue_wait_minutes: float
    mean_service_time_minutes: float
    busiest_hour: str  # e.g. "10:00"
    busiest_department: str
    data_quality_score: float  # % of visits with no quality issues

class Insight(BaseModel):
    source: Literal["historical", "simulation"]
    type: Literal["trend", "bottleneck", "outlier", "comparison", "recommendation"]
    title: str
    description: str
    severity: Literal["info", "warning", "alert"]
    metric_value: Optional[float]
    trend: Optional[Literal["improving", "worsening", "stable"]]

class ActivityEvent(BaseModel):
    event_type: Literal["import", "simulation_run", "user_action", "quality_check"]
    description: str
    user: str
    timestamp: datetime
```

**`service.py`**:
```python
class DashboardService:
    async def get_summary(clinic_id: str, days: int = 30) -> DashboardSummary:
        # 1. Compute KPIs from last N days of visits
        # 2. Generate insights (auto-generated observations)
        # 3. Fetch recent activity from audit_logs
        # 4. Return DashboardSummary

    async def generate_insights(clinic_id: str, visits: list[dict]) -> list[Insight]:
        # Auto-generate insights:
        # - "Queue wait up 15% vs prior 30 days" (trend insight)
        # - "Tuesday 10:00-11:00 is your busiest slot" (bottleneck insight)
        # - "23 visits have missing service end times" (quality insight)
        # - Comparison vs prior period
        # Each insight labeled with source="historical"
```

**`router.py`**:
```
GET  /api/v1/clinics/{clinic_id}/dashboard/summary  → dashboard summary
GET  /api/v1/clinics/{clinic_id}/dashboard/insights → insights list
```

### 2. Insights Engine (`backend/app/domain/insights.py`)
Pure functions:

```python
def generate_trend_insight(current_visits: list[dict], prior_visits: list[dict]) -> Optional[Insight]:
    """Compare current vs prior period. Generate insight if change > 10%."""

def generate_bottleneck_insight(heatmap_data: list[dict]) -> Optional[Insight]:
    """Find the single worst time slot and generate an insight about it."""

def generate_quality_insight(quality_report: QualityReport) -> Optional[Insight]:
    """Generate insight if data quality score < 95%."""

def generate_all_insights(
    current_visits: list[dict],
    prior_visits: list[dict],
    heatmap_data: list[dict],
    quality_report: QualityReport
) -> list[Insight]:
    """Run all insight generators. Return non-None results."""
```

### 3. Frontend — Dashboard (`frontend/src/modules/overview/`)

**`DashboardPage.tsx`** layout:
```
┌─────────────────────────────────────────────────┐
│  Clinic Name + Period Selector (Last 7/30/90d)   │
├──────────┬──────────┬──────────┬────────────────┤
│ KPI Card │ KPI Card │ KPI Card │ KPI Card       │
│ Total    │ Mean     │ P90      │ Quality Score  │
│ Visits   │ Wait     │ Wait     │                │
├──────────┴──────────┴──────────┴────────────────┤
│  Wait Time Trend (line chart, last 30 days)      │
│  Source: Historical ■                            │
├─────────────────────┬───────────────────────────┤
│  Insights Feed      │  Recent Activity           │
│  (auto-generated)   │  (audit log events)        │
└─────────────────────┴───────────────────────────┘
```

**KPI Cards** (using `KPICard` component from Phase 04):
- Total Visits: count with trend arrow vs prior period
- Mean Queue Wait: minutes with trend (↑ red = worsening)
- P90 Queue Wait: minutes
- Data Quality Score: percentage, green if >95%, amber if 85-95%, red if <85%

**Wait Time Trend Chart**:
- Recharts LineChart, daily data, last 30 days
- Mean wait time line + P90 line
- Source badge "Historical" in chart header

**Insights Feed**:
- Each insight: severity icon + title + description
- Color-coded: info (blue), warning (amber), alert (red)
- Newest first
- "View Full Analytics →" link on each insight

**Recent Activity Feed**:
- Each event: icon + description + user + relative time ("2 hours ago")
- Event types have distinct icons (lucide-react)

**`useDashboard.ts`**: TanStack Query with 5-minute refetch interval

Route: `/dashboard` → DashboardPage

### 4. Period Selector Component (`frontend/src/components/ui/PeriodSelector.tsx`)
Props: `value: 7 | 30 | 90`, `onChange: (days: number) => void`
Renders as tab group: "7 days | 30 days | 90 days"

## Exit Gates
- [ ] `GET .../dashboard/summary` returns all KPIs for last 30 days
- [ ] `generate_insights()` produces at least trend + bottleneck insights
- [ ] Dashboard KPI cards all have source badges
- [ ] Wait time trend line chart renders with 30 days of data
- [ ] Insights feed shows auto-generated observations
- [ ] Activity feed shows recent audit events
- [ ] Period selector changes dashboard data range
- [ ] Dashboard auto-refreshes every 5 minutes
