import simpy
import numpy as np
from app.domain.simulation.distributions import sample_interarrival_time, sample_service_time
from app.domain.simulation.metrics import SimulationMetrics, aggregate_replications

class ClinicSimulation:
    def __init__(self, config: dict, seed: int):
        self.config = config
        self.seed = seed
        self.rng = np.random.default_rng(seed)
        self.env = simpy.Environment()
        self.metrics = SimulationMetrics()
        self.servers = {}

    def setup(self):
        for dept in self.config.get("departments", []):
            self.servers[dept["department_id"]] = simpy.Resource(
                self.env, capacity=dept.get("num_servers", 1)
            )

    def _patient_service(self, dept: dict):
        arrival = self.env.now
        with self.servers[dept["department_id"]].request() as req:
            yield req
            service_start = self.env.now
            queue_wait = service_start - arrival
            service_time = sample_service_time(
                dept.get("service_distribution", "exponential"),
                dept.get("service_params", {}),
                self.rng
            )
            yield self.env.timeout(service_time)
            total_time = self.env.now - arrival
            self.metrics.record_visit(dept["department_id"], queue_wait, service_time, total_time)

    def _arrival_process(self, dept: dict):
        warm_up = self.config.get("warm_up_minutes", 30)
        while True:
            iat = sample_interarrival_time(
                dept.get("arrival_distribution", "exponential"),
                dept.get("arrival_params", {"rate": 0.5}),
                self.rng
            )
            yield self.env.timeout(iat)
            if self.env.now > warm_up:
                self.env.process(self._patient_service(dept))

    def run(self, duration_minutes: float) -> dict:
        self.setup()
        for dept in self.config.get("departments", []):
            self.env.process(self._arrival_process(dept))
        self.env.run(until=duration_minutes)
        return self.metrics.summarize()

def run_replications(config: dict, num_replications: int = 10) -> dict:
    base_seed = config.get("base_seed", 42)
    duration = config.get("simulation_hours", 8) * 60
    results = []
    for i in range(num_replications):
        sim = ClinicSimulation(config, seed=base_seed + i)
        result = sim.run(duration)
        results.append(result)
    return aggregate_replications(results)
