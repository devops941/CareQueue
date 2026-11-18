import numpy as np
from typing import Optional

def compute_percentiles(values: list, percentiles: list = [50, 75, 90, 95]) -> dict:
    arr = np.array([v for v in values if v is not None], dtype=float)
    if len(arr) == 0:
        return {f"p{p}": None for p in percentiles}
    return {f"p{p}": round(float(np.percentile(arr, p)), 2) for p in percentiles}

def compute_summary_stats(values: list) -> dict:
    arr = np.array([v for v in values if v is not None], dtype=float)
    if len(arr) == 0:
        return {"mean": None, "median": None, "std": None, "min": None, "max": None, "p75": None, "p90": None, "p95": None, "count": 0, "missing_count": len(values)}
    return {
        "mean": round(float(np.mean(arr)), 2),
        "median": round(float(np.median(arr)), 2),
        "std": round(float(np.std(arr)), 2),
        "min": round(float(np.min(arr)), 2),
        "max": round(float(np.max(arr)), 2),
        "p75": round(float(np.percentile(arr, 75)), 2),
        "p90": round(float(np.percentile(arr, 90)), 2),
        "p95": round(float(np.percentile(arr, 95)), 2),
        "count": int(len(arr)),
        "missing_count": int(len(values) - len(arr)),
    }

def compute_distribution(values: list, bins: int = 20) -> dict:
    arr = np.array([v for v in values if v is not None], dtype=float)
    if len(arr) < 2:
        return {"bins": [], "counts": []}
    counts, edges = np.histogram(arr, bins=bins)
    return {
        "bins": [round(float(e), 2) for e in edges[:-1]],
        "counts": [int(c) for c in counts],
    }

def extract_metric_values(visits: list, metric: str) -> list:
    field_map = {
        "queue_wait": "queue_wait_minutes",
        "registration_wait": "registration_wait_minutes",
        "service_time": "service_time_minutes",
        "total_visit": "total_visit_minutes",
    }
    field = field_map.get(metric, metric)
    return [v.get(field) for v in visits if v.get(field) is not None]
