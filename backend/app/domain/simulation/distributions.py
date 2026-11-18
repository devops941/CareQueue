import numpy as np
from scipy import stats as scipy_stats

def sample_interarrival_time(distribution: str, params: dict, rng: np.random.Generator) -> float:
    if distribution == "exponential":
        rate = params.get("rate", 0.5)
        return rng.exponential(1.0 / rate) if rate > 0 else 2.0
    elif distribution == "lognormal":
        mean = params.get("mean", 10.0)
        std = params.get("std", 3.0)
        sigma = np.sqrt(np.log(1 + (std/mean)**2))
        mu = np.log(mean) - sigma**2 / 2
        return float(rng.lognormal(mu, sigma))
    elif distribution == "uniform":
        low = params.get("min", 1.0)
        high = params.get("max", 10.0)
        return float(rng.uniform(low, high))
    return 2.0

def sample_service_time(distribution: str, params: dict, rng: np.random.Generator) -> float:
    if distribution == "deterministic":
        return float(params.get("value", 15.0))
    elif distribution == "exponential":
        mean = params.get("mean", 15.0)
        return float(rng.exponential(mean))
    elif distribution == "lognormal":
        mean = params.get("mean", 15.0)
        std = params.get("std", 5.0)
        sigma = np.sqrt(np.log(1 + (std/mean)**2))
        mu = np.log(mean) - sigma**2 / 2
        return max(1.0, float(rng.lognormal(mu, sigma)))
    elif distribution == "triangular":
        low = params.get("min", 5.0)
        high = params.get("max", 30.0)
        mode = params.get("mode", 15.0)
        c = (mode - low) / (high - low) if high > low else 0.5
        return float(scipy_stats.triang(c, loc=low, scale=high-low).rvs(random_state=int(rng.integers(0, 999999))))
    return max(1.0, float(rng.normal(15.0, 5.0)))
