# Phase 11 — Statistical Analytics & Distribution Fitting

You are implementing Phase 11 of CareQueue: **Advanced Statistical Analytics**.

## Project Context
Phase 11 extends the analytics engine with:
- Distribution fitting (what probability distribution best describes waiting times?)
- Confidence intervals
- Day-over-day and week-over-week trend analysis
- Comparative analytics (compare two date ranges or departments)

**All results must carry `source: "historical"` label.**

## Your Task

### 1. Distribution Fitting (`backend/app/domain/analytics/distributions.py`)
Using SciPy:

```python
CANDIDATE_DISTRIBUTIONS = ["exponential", "lognormal", "gamma", "weibull_min", "norm"]

def fit_distribution(values: list[float]) -> FitResult:
    """
    Try fitting each candidate distribution using scipy.stats.
    Select best fit by lowest AIC (Akaike Information Criterion).
    Returns: {best_fit: str, params: dict, aic: float, ks_statistic: float, ks_pvalue: float}
    """

def compute_confidence_interval(values: list[float], confidence: float = 0.95) -> tuple[float, float]:
    """
    Bootstrap confidence interval for the mean.
    Returns (lower, upper) bounds.
    """

def test_normality(values: list[float]) -> dict:
    """
    Shapiro-Wilk test (n < 5000) or D'Agostino-Pearson (n >= 5000).
    Returns {test: str, statistic: float, pvalue: float, is_normal: bool}
    """
```

### 2. Trend Analysis (`backend/app/domain/analytics/trends.py`)
```python
def compute_period_comparison(
    current_visits: list[dict],
    previous_visits: list[dict],
    metric: str
) -> dict:
    """
    Compare two periods.
    Returns: {
        current: {mean, median, p90, count},
        previous: {mean, median, p90, count},
        change_pct: {mean: float, median: float, p90: float},
        trend: Literal["improving", "worsening", "stable"],
        significance: {is_significant: bool, pvalue: float, test: str}
    }
    Use scipy.stats.mannwhitneyu for significance testing.
    """

def compute_weekly_trend(
    visits: list[dict],
    metric: str,
    weeks: int = 8
) -> list[dict]:
    """
    Group visits by ISO week. Compute weekly stats.
    Returns [{week: "2024-W01", mean: float, median: float, p90: float, count: int}]
    """

def compute_daily_trend(visits: list[dict], metric: str) -> list[dict]:
    """
    Group visits by date. Compute daily stats.
    Returns [{date: "2024-01-15", mean: float, median: float, p90: float, count: int}]
    """
```

### 3. Comparative Analytics API
Add to `HistoricalAnalyticsService`:
```python
async def compare_periods(
    clinic_id: str,
    period_a: DateRange,
    period_b: DateRange,
    filters: dict
) -> ComparisonResult

async def compute_trends(
    clinic_id: str,
    start_date: date,
    end_date: date,
    metric: str,
    granularity: Literal["daily", "weekly"]
) -> TrendResult
```

New routes:
```
POST  /api/v1/clinics/{clinic_id}/analytics/historical/compare  → period comparison
POST  /api/v1/clinics/{clinic_id}/analytics/historical/trends   → trend over time
POST  /api/v1/clinics/{clinic_id}/analytics/historical/distribution → distribution fitting
```

### 4. Frontend — Statistical Analytics Extensions

**Add to `HistoricalAnalyticsPage.tsx`**:

**Distribution Tab**:
- Run distribution fitting on current query
- Shows: best-fit distribution name, parameters, fit quality (KS test)
- Overlay fitted distribution curve on histogram (using recharts ComposedChart)
- Confidence interval shown as error bars on mean value

**Trends Tab**:
- Line chart (Recharts LineChart) of daily/weekly trend
- Toggle: daily vs weekly
- Shows mean + P90 as two lines
- Y-axis: wait time in minutes, X-axis: dates/weeks

**Compare Tab**:
- Two date range pickers (Period A vs Period B)
- Side-by-side KPI cards for both periods
- Change percentage with arrow indicators (↑ red = worsening, ↓ green = improving)
- Statistical significance badge ("Significant difference (p < 0.05)" or "No significant difference")

### 5. Significance Interpretation Helper (`frontend/src/utils/stats.ts`)
```typescript
export function interpretTrend(changePct: number, metric: string): {label: string, color: string}
  // For wait times: positive change = worsening (red), negative = improving (green)
  // Returns {label: "12% worse", color: "danger"} etc.

export function formatPValue(pvalue: number): string
  // Returns "p < 0.001", "p = 0.034", "p > 0.05" etc.
```

## Exit Gates
- [ ] `fit_distribution()` tries all 5 candidate distributions and picks by AIC
- [ ] `compute_confidence_interval()` uses bootstrap method with scipy
- [ ] `compute_period_comparison()` uses Mann-Whitney U test for significance
- [ ] `compute_weekly_trend()` correctly groups by ISO week number
- [ ] Distribution fitting API endpoint returns fit result with KS test stats
- [ ] Trends endpoint returns daily/weekly aggregated data
- [ ] Frontend Distribution tab shows best-fit name + histogram overlay
- [ ] Frontend Trends tab shows line chart with mean + P90
- [ ] Frontend Compare tab shows period-over-period change percentages
