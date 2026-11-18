# Phase 13 — SimPy Queue Simulation Engine

You are implementing Phase 13 of CareQueue: **Discrete-Event Queue Simulation Engine using SimPy**.

## Project Context
CareQueue uses SimPy for queue simulation. Simulation results are ESTIMATES based on assumptions — they must NEVER be presented as actual outcomes.

**Critical Rules**:
- Simulated results are stored separately from historical data
- Every simulated result carries `source: "simulation"` label
- Simulations are deterministic: same seed + config = same results
- Each run records its assumptions, model version, seed, and replications

## Your Task

### 1. SimPy Engine (`backend/app/domain/simulation/`)

Create:
```
domain/simulation/
├── __init__.py
├── engine.py        # Core SimPy simulation logic
├── distributions.py # Arrival/service time distributions
└── metrics.py       # Collect and aggregate simulation metrics
```

**`distributions.py`**:
```python
import simpy
import numpy as np
from scipy import stats

DISTRIBUTION_MAP = {
    "exponential": stats.expon,
    "lognormal": stats.lognorm,
    "gamma": stats.gamma,
    "uniform": stats.uniform,
    "triangular": stats.triang,
    "deterministic": None,  # fixed value
}

def sample_interarrival_time(distribution: str, params: dict, rng: np.random.Generator) -> float:
    """Sample time between patient arrivals (minutes)."""

def sample_service_time(distribution: str, params: dict, rng: np.random.Generator) -> float:
    """Sample consultation/service duration (minutes)."""
```

**`engine.py`**:
```python
import simpy
import numpy as np

class ClinicSimulation:
    def __init__(self, config: SimulationConfig, seed: int):
        self.config = config
        self.rng = np.random.default_rng(seed)
        self.env = simpy.Environment()
        self.metrics = SimulationMetrics()

    def setup(self):
        """Create SimPy resources for each doctor/server."""
        self.servers = {}
        for dept in self.config.departments:
            self.servers[dept.id] = simpy.Resource(
                self.env, capacity=dept.num_servers
            )

    def patient_arrival_process(self, dept_config):
        """Generator: patients arrive, wait in queue, receive service."""
        patient_id = 0
        while True:
            # Inter-arrival time
            iat = sample_interarrival_time(
                dept_config.arrival_distribution,
                dept_config.arrival_params,
                self.rng
            )
            yield self.env.timeout(iat)
            patient_id += 1
            self.env.process(self.patient_service(patient_id, dept_config))

    def patient_service(self, patient_id: int, dept_config):
        """Generator: single patient flow through queue and service."""
        arrival_time = self.env.now
        with self.servers[dept_config.id].request() as req:
            yield req
            service_start = self.env.now
            queue_wait = service_start - arrival_time

            service_time = sample_service_time(
                dept_config.service_distribution,
                dept_config.service_params,
                self.rng
            )
            yield self.env.timeout(service_time)
            departure_time = self.env.now

            self.metrics.record_visit(
                dept_id=dept_config.id,
                arrival_time=arrival_time,
                queue_wait=queue_wait,
                service_time=service_time,
                departure_time=departure_time
            )

    def run(self, duration_minutes: float) -> SimulationResult:
        """Run simulation for given duration. Returns aggregated metrics."""
        self.setup()
        for dept in self.config.departments:
            self.env.process(self.patient_arrival_process(dept))
        self.env.run(until=duration_minutes)
        return self.metrics.summarize()

def run_replications(config: SimulationConfig, num_replications: int = 10) -> ReplicatedResult:
    """
    Run N independent replications with different seeds.
    Average metrics across replications for stable estimates.
    Returns mean + 95% CI for each metric.
    """
    results = []
    for rep in range(num_replications):
        sim = ClinicSimulation(config, seed=config.base_seed + rep)
        result = sim.run(duration_minutes=config.simulation_hours * 60)
        results.append(result)
    return aggregate_replications(results)
```

**`metrics.py`**:
```python
class SimulationMetrics:
    def record_visit(self, dept_id, arrival_time, queue_wait, service_time, departure_time):
        """Store per-visit metrics for a department."""

    def summarize(self) -> dict:
        """
        Aggregate per-department and overall:
        {
            by_department: {dept_id: {count, mean_queue_wait, p90_queue_wait, mean_service_time,
                                       avg_queue_length, utilization_pct}},
            overall: {total_patients, mean_queue_wait, p90_queue_wait}
        }
        """

def aggregate_replications(results: list[dict]) -> dict:
    """
    Average results across replications. Add 95% CI using scipy.stats.t.interval.
    Returns {metric: {mean: float, ci_lower: float, ci_upper: float}}
    """
```

### 2. Simulation Config Schemas (`backend/app/modules/simulation/schemas.py`)

```python
class DepartmentSimConfig(BaseModel):
    department_id: str
    num_servers: int  # number of doctors/servers
    arrival_distribution: Literal["exponential", "lognormal", "gamma", "uniform", "triangular"]
    arrival_params: dict  # e.g. {"rate": 0.5} for exponential (patients/min)
    service_distribution: Literal["exponential", "lognormal", "gamma", "uniform", "deterministic"]
    service_params: dict  # e.g. {"mean": 15, "std": 5} for lognormal

class SimulationConfig(BaseModel):
    clinic_id: str
    name: str
    description: Optional[str]
    simulation_hours: float = 8.0  # duration of simulated clinic day
    num_replications: int = 10     # for confidence intervals
    base_seed: int = 42
    warm_up_minutes: float = 30.0  # discard warm-up period from metrics
    departments: list[DepartmentSimConfig]

class SimulationResult(BaseModel):
    source: Literal["simulation"] = "simulation"  # ALWAYS "simulation"
    config_id: str
    run_id: str
    seed: int
    num_replications: int
    model_version: str = "1.0"
    assumptions: dict  # copy of config params for audit trail
    by_department: dict  # {dept_id: metrics with CI}
    overall: dict
    computed_at: datetime
```

### 3. Simulation Module Backend (`backend/app/modules/simulation/`)

```
modules/simulation/
├── __init__.py
├── schemas.py
├── repository.py    # SimConfigRepository, SimResultRepository
├── service.py
└── router.py
```

**`service.py`**:
```python
class SimulationService:
    async def create_config(data: SimulationConfig, clinic_id: str) -> SimConfigOut
    async def run_simulation(config_id: str, clinic_id: str) -> SimulationResult
        # 1. Load config
        # 2. Call domain/simulation/engine.run_replications()
        # 3. Store result with source="simulation"
        # 4. Return SimulationResult
    async def get_result(result_id: str, clinic_id: str) -> SimulationResult
    async def list_configs(clinic_id: str) -> list[SimConfigOut]
    async def list_results(clinic_id: str, config_id: Optional[str] = None) -> list[SimulationResult]
```

**`router.py`**:
```
POST  /api/v1/clinics/{clinic_id}/simulation/configs         → create config
GET   /api/v1/clinics/{clinic_id}/simulation/configs         → list configs
POST  /api/v1/clinics/{clinic_id}/simulation/configs/{id}/run → run simulation
GET   /api/v1/clinics/{clinic_id}/simulation/results         → list results
GET   /api/v1/clinics/{clinic_id}/simulation/results/{id}    → get result
```

### 4. Frontend — Simulation Engine Page (`frontend/src/modules/simulation/`)

**`SimulationConfigPage.tsx`**:
- List of saved simulation configs
- "New Configuration" button → config form
- Each config row: name, departments configured, last run date, "Run" button

**`SimulationConfigForm.tsx`**:
- Config name + description
- Simulation hours (default 8)
- Number of replications (default 10)
- Base seed
- Per-department section (expandable):
  - Number of servers
  - Arrival distribution + params (dynamic form based on distribution type)
  - Service distribution + params

**Distribution Parameter Forms** (dynamic sub-forms):
- Exponential: `rate` (patients/min)
- Lognormal: `mean`, `std` (minutes)
- Triangular: `min`, `mode`, `max` (minutes)
- Deterministic: `value` (fixed minutes)

Route: `/simulation` → SimulationConfigPage

## Exit Gates
- [ ] `ClinicSimulation.run()` produces deterministic results (same seed = same output)
- [ ] `run_replications()` returns mean + 95% CI for each metric
- [ ] SimulationResult always has `source: "simulation"`
- [ ] `assumptions` field in result captures full config for audit
- [ ] `POST .../simulation/configs/{id}/run` runs and returns result
- [ ] Frontend SimulationConfigForm has distribution parameter inputs
- [ ] Simulation results stored in separate collection from visits
