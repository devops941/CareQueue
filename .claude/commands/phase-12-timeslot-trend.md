# Phase 12 — Time-Slot & Bottleneck Analysis

You are implementing Phase 12 of CareQueue: **Time-Slot Heatmaps, Bottleneck Detection & Trend Analysis**.

## Project Context
Phase 12 adds:
- Hourly/time-slot volume and wait-time heatmaps (which hours are busiest?)
- Bottleneck signals (queue length estimates, utilization rates)
- Day-of-week patterns
- Multi-metric heatmap visualization

**All results = `source: "historical"`**

## Your Task

### 1. Time-Slot Analysis Functions (`backend/app/domain/analytics/time_slots.py`)
Extend the existing module:

```python
def compute_arrival_volume_by_slot(visits: list[dict], slot_minutes: int = 60) -> list[dict]:
    """
    Count arrivals per time slot across the date range.
    Returns [{slot: "09:00", count: int, avg_per_day: float}]
    """

def compute_heatmap_data(
    visits: list[dict],
    metric: str,  # "count" | "queue_wait" | "service_time" | "total_visit"
    x_axis: str,  # "time_slot" (hour of day)
    y_axis: str,  # "day_of_week"
    slot_minutes: int = 60
) -> list[dict]:
    """
    Build a heatmap matrix.
    Returns [{x: "09:00", y: "Monday", value: float, count: int}]
    """

def estimate_queue_length(visits: list[dict], slot_minutes: int = 60) -> list[dict]:
    """
    Estimate concurrent queue length per time slot using Little's Law or arrival/departure counting.
    Returns [{slot: "09:00", avg_queue_length: float, max_queue_length: float}]
    """

def compute_utilization_rate(
    visits: list[dict],
    doctors: list[dict],  # doctor capacity data
    slot_minutes: int = 60
) -> list[dict]:
    """
    Estimate staff utilization: (actual service time) / (available capacity) per slot.
    Returns [{slot: "09:00", utilization_pct: float, is_overloaded: bool}]
    """

def find_bottleneck_slots(
    heatmap_data: list[dict],
    metric: str,
    threshold_percentile: int = 75
) -> list[dict]:
    """
    Identify time slots where metric exceeds threshold_percentile of all slots.
    Returns [{slot, day, value, is_bottleneck: True, severity: "high"|"medium"}]
    """
```

### 2. Bottleneck Detection API

Add to analytics module:

**`schemas.py`** additions:
```python
class TimeSlotQuery(BaseModel):
    clinic_id: str
    start_date: date
    end_date: date
    slot_minutes: int = 60
    department_ids: Optional[list[str]] = None
    metric: Literal["count", "queue_wait", "service_time", "total_visit"] = "count"

class HeatmapResult(BaseModel):
    source: Literal["historical"] = "historical"
    data: list[dict]  # [{x, y, value, count}]
    bottlenecks: list[dict]
    summary: dict
```

New routes:
```
POST  /api/v1/clinics/{clinic_id}/analytics/historical/heatmap      → heatmap matrix
POST  /api/v1/clinics/{clinic_id}/analytics/historical/volume       → arrival volume by slot
POST  /api/v1/clinics/{clinic_id}/analytics/historical/bottlenecks  → bottleneck detection
POST  /api/v1/clinics/{clinic_id}/analytics/historical/utilization  → utilization rate
```

### 3. Frontend — Time-Slot Analysis Page (`frontend/src/modules/analytics/time-slot/`)

**`TimeSlotAnalyticsPage.tsx`**:

**Controls** (top):
- Date range picker
- Slot size: 30 min | 60 min | 120 min
- Metric: Arrival Count | Queue Wait | Service Time | Total Visit
- Department filter

**Heatmap Panel** (main):
- Custom heatmap built with Recharts (or CSS grid if Recharts heatmap not available)
- X-axis: hours of day (06:00 → 22:00)
- Y-axis: days of week (Monday → Sunday)
- Cell color: low (white/light blue) → high (deep red) gradient
- Tooltip: exact value + count on hover
- Bottleneck cells outlined in orange/red

**Volume Chart**:
- Bar chart: hourly arrival counts, averaged over selected date range
- Overlay line: average queue wait per slot (dual-axis)

**Bottleneck Table**:
- Columns: Day, Time Slot, Metric Value, Severity badge (High/Medium)
- Sorted by value descending
- "These are your peak load windows" summary text

**Utilization Panel** (if doctors loaded):
- Bar chart: utilization % per time slot
- Red dotted line at 100% (overloaded threshold)
- Slots above 100% highlighted red

**`useTimeSlotAnalytics.ts`**: TanStack Query hooks

Route: `/analytics/time-slot` → TimeSlotAnalyticsPage

### 4. Heatmap Color Scale Utility (`frontend/src/utils/colorScale.ts`)
```typescript
export function getHeatmapColor(value: number, min: number, max: number): string
  // Returns CSS color string using HSL interpolation
  // Low values: hsl(210, 100%, 95%) (light blue)
  // High values: hsl(0, 100%, 45%) (deep red)
  // 0 count: #F8FAFC (surface color)
```

### 5. Navigation
Add "Time-Slot" to the Analytics section of Sidebar navigation.

## Exit Gates
- [ ] `compute_heatmap_data()` returns correct (day, hour) matrix values
- [ ] `find_bottleneck_slots()` correctly identifies slots above P75 threshold
- [ ] `estimate_queue_length()` returns reasonable estimates per slot
- [ ] Heatmap API endpoint returns data matrix + bottlenecks list
- [ ] Frontend heatmap renders with color gradient (light blue → deep red)
- [ ] Bottleneck cells visually distinct in heatmap
- [ ] Volume bar chart with dual-axis queue wait overlay renders
- [ ] `getHeatmapColor()` utility returns correct HSL colors
