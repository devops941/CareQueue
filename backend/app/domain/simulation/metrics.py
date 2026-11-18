import numpy as np
from collections import defaultdict

class SimulationMetrics:
    def __init__(self):
        self._data = defaultdict(lambda: {"queue_waits": [], "service_times": [], "total_times": []})
        self._overall = {"queue_waits": [], "service_times": []}

    def record_visit(self, dept_id: str, queue_wait: float, service_time: float, total_time: float):
        self._data[dept_id]["queue_waits"].append(queue_wait)
        self._data[dept_id]["service_times"].append(service_time)
        self._data[dept_id]["total_times"].append(total_time)
        self._overall["queue_waits"].append(queue_wait)
        self._overall["service_times"].append(service_time)

    def _stats(self, values: list) -> dict:
        if not values:
            return {"mean": 0, "p50": 0, "p90": 0, "p95": 0, "count": 0}
        arr = np.array(values)
        return {
            "mean": round(float(np.mean(arr)), 2),
            "p50": round(float(np.percentile(arr, 50)), 2),
            "p90": round(float(np.percentile(arr, 90)), 2),
            "p95": round(float(np.percentile(arr, 95)), 2),
            "count": len(arr),
        }

    def summarize(self) -> dict:
        by_dept = {}
        for dept_id, data in self._data.items():
            by_dept[dept_id] = {
                "queue_wait": self._stats(data["queue_waits"]),
                "service_time": self._stats(data["service_times"]),
                "throughput": len(data["queue_waits"]),
            }
        return {
            "by_department": by_dept,
            "overall": {
                "queue_wait": self._stats(self._overall["queue_waits"]),
                "service_time": self._stats(self._overall["service_times"]),
                "total_patients": len(self._overall["queue_waits"]),
            }
        }

def aggregate_replications(results: list) -> dict:
    if not results:
        return {}
    overall_qw = [r["overall"]["queue_wait"]["mean"] for r in results if r.get("overall")]
    arr = np.array(overall_qw)
    ci = np.percentile(arr, [2.5, 97.5]) if len(arr) > 1 else [arr[0], arr[0]]
    return {
        "replications": len(results),
        "overall": {
            "mean_queue_wait": round(float(np.mean(arr)), 2),
            "ci_lower": round(float(ci[0]), 2),
            "ci_upper": round(float(ci[1]), 2),
            "total_patients": int(np.mean([r["overall"]["total_patients"] for r in results])),
        },
        "by_department": results[0].get("by_department", {}) if results else {},
        "raw_replications": results,
    }
