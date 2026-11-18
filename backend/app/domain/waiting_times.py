from typing import Optional
from datetime import datetime

def compute_waiting_times(visit: dict) -> dict:
    """Compute derived waiting time fields from timestamps."""
    result = dict(visit)

    def diff_minutes(a, b) -> Optional[float]:
        if a and b:
            try:
                if isinstance(a, str): a = datetime.fromisoformat(a)
                if isinstance(b, str): b = datetime.fromisoformat(b)
                delta = (b - a).total_seconds() / 60
                return round(delta, 2) if delta >= 0 else None
            except Exception:
                return None
        return None

    result["registration_wait_minutes"] = diff_minutes(
        visit.get("arrival_time"), visit.get("registration_time")
    )
    result["queue_wait_minutes"] = diff_minutes(
        visit.get("registration_time"), visit.get("called_time")
    )
    result["service_time_minutes"] = diff_minutes(
        visit.get("service_start_time"), visit.get("service_end_time")
    )
    result["total_visit_minutes"] = diff_minutes(
        visit.get("arrival_time"), visit.get("departure_time")
    )
    return result
