# Phase 14 — Async Jobs & Scenario Management

You are implementing Phase 14 of CareQueue: **Async Background Jobs & Scenario Comparison**.

## Project Context
Simulations can take seconds to minutes depending on replications. CareQueue runs them as async background jobs. Scenario comparison lets users run multiple configs side-by-side.

## Your Task

### 1. Job System (`backend/app/modules/jobs/`)

```
modules/jobs/
├── __init__.py
├── schemas.py
├── repository.py
├── service.py
└── router.py
```

**`schemas.py`**:
```python
class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class Job(BaseModel):
    id: str
    clinic_id: str
    job_type: Literal["simulation", "analytics", "export"]
    status: JobStatus
    payload: dict       # input config
    result_ref: Optional[str]  # ID of result document
    error: Optional[str]
    progress_pct: Optional[int]  # 0-100
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
```

**`service.py`** — use Python `asyncio` background tasks (FastAPI BackgroundTasks):
```python
class JobService:
    async def enqueue_simulation(config_id: str, clinic_id: str) -> Job
        # Create job doc with status=PENDING
        # Add to FastAPI BackgroundTasks
        # Return job immediately

    async def run_simulation_job(job_id: str):
        # Update status=RUNNING
        # Run simulation via SimulationService
        # Update status=COMPLETED, result_ref=result_id
        # On exception: status=FAILED, error=str(e)

    async def get_job(job_id: str, clinic_id: str) -> Job
    async def list_jobs(clinic_id: str, status: Optional[JobStatus] = None) -> list[Job]
    async def cancel_job(job_id: str, clinic_id: str) -> bool
```

**`router.py`**:
```
GET  /api/v1/clinics/{clinic_id}/jobs        → list jobs
GET  /api/v1/clinics/{clinic_id}/jobs/{id}   → get job status
POST /api/v1/clinics/{clinic_id}/jobs/{id}/cancel → cancel pending job
```

Update simulation router to use job system:
- `POST .../simulation/configs/{id}/run` → enqueue job, return `{job_id, status: "pending"}`

### 2. Job Polling (Frontend)

**`useJobPoller.ts`**:
```typescript
export function useJobPoller(jobId: string | null, onComplete: (result: any) => void) {
  // Poll GET /jobs/{jobId} every 2 seconds while status is "pending" or "running"
  // On "completed": fetch result, call onComplete, stop polling
  // On "failed": show error toast, stop polling
  // Returns: {status, progressPct, error}
}
```

**`JobStatusBadge.tsx`**:
Props: `status: JobStatus`
- pending: grey spinner "Queued"
- running: blue animated spinner "Running"
- completed: green "Done"
- failed: red "Failed"
- cancelled: grey "Cancelled"

### 3. Scenario Comparison

**`schemas.py`** additions:
```python
class ScenarioComparison(BaseModel):
    clinic_id: str
    name: str
    result_ids: list[str]  # 2-4 simulation result IDs to compare
    created_at: datetime

class ComparisonResult(BaseModel):
    source: Literal["simulation"] = "simulation"
    scenarios: list[dict]  # [{name, config_summary, metrics}]
    winner: Optional[dict]  # config with best overall metrics
    comparison_table: list[dict]  # [{metric, scenario_a_value, scenario_b_value, ...}]
```

**`SimulationService`** additions:
```python
async def compare_scenarios(result_ids: list[str], clinic_id: str) -> ComparisonResult:
    # Load 2-4 simulation results
    # Build side-by-side comparison table
    # Determine "winner" = scenario with lowest mean queue wait
    # Return ComparisonResult with source="simulation"
```

New routes:
```
POST  /api/v1/clinics/{clinic_id}/simulation/compare  → compare scenarios
GET   /api/v1/clinics/{clinic_id}/simulation/scenarios → list saved comparisons
```

### 4. Frontend — Scenario Comparison Page (`frontend/src/modules/simulation/`)

**`SimulationResultsPage.tsx`**:
- List of completed simulation runs: Config Name, Status, Departments, Mean Queue Wait (with CI), Run Date
- "Compare" button (multi-select up to 4 results)
- Click result row → result detail

**`SimulationResultDetail.tsx`**:
- **Source Badge**: Orange pill "Simulation Data" — always visible
- **Warning Banner**: "These are estimates based on assumed distributions, not actual observations."
- Per-department metrics: mean queue wait (with CI bars), P90, utilization %, throughput
- Config summary (assumptions used)

**`ScenarioComparisonPage.tsx`**:
- Side-by-side cards per scenario (2-4 columns)
- Comparison table: metric rows × scenario columns
- Winner highlighted with star icon
- Bar chart: group-by scenario, metric on Y axis
- Each chart labeled "Simulation Estimate" (not "Actual")

**`RunSimulationButton.tsx`**:
Props: `configId: string`
- Click → POST to run endpoint → get job_id
- Show JobStatusBadge polling via useJobPoller
- On complete: navigate to result detail

Route: `/simulation/results` → SimulationResultsPage, `/simulation/compare` → ScenarioComparisonPage

## Exit Gates
- [ ] Simulation runs as async background job (endpoint returns immediately with job_id)
- [ ] Job status polling updates status (pending → running → completed)
- [ ] `GET .../jobs/{id}` returns current status and progress
- [ ] `compare_scenarios()` returns side-by-side comparison table
- [ ] Frontend polls job status every 2s until complete
- [ ] SimulationResultDetail always shows "Simulation Data" source badge + warning banner
- [ ] ScenarioComparisonPage labels all charts as "Simulation Estimate"
- [ ] Winner determination logic based on lowest mean queue wait
