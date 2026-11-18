from datetime import datetime
from typing import Optional

TIMESTAMP_ORDER = [
    ("arrival_time", "registration_time"),
    ("registration_time", "called_time"),
    ("called_time", "service_start_time"),
    ("service_start_time", "service_end_time"),
    ("service_end_time", "departure_time"),
]

def validate_visit_chronology(visit_data: dict) -> list[str]:
    errors = []
    for earlier_field, later_field in TIMESTAMP_ORDER:
        earlier = visit_data.get(earlier_field)
        later = visit_data.get(later_field)
        if earlier and later:
            try:
                if isinstance(earlier, str): earlier = datetime.fromisoformat(earlier)
                if isinstance(later, str): later = datetime.fromisoformat(later)
                if later < earlier:
                    errors.append(f"{later_field} must be after {earlier_field}")
            except Exception:
                pass
    return errors
