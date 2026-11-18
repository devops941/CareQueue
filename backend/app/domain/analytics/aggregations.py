from collections import defaultdict
from app.domain.analytics.waiting_times import compute_summary_stats, extract_metric_values

DAY_NAMES = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]

def aggregate_by_department(visits: list, metric: str) -> list:
    groups = defaultdict(list)
    for v in visits:
        groups[v.get("department_id","unknown")].append(v)
    result = []
    for dept_id, group_visits in groups.items():
        values = extract_metric_values(group_visits, metric)
        result.append({"group": dept_id, "group_label": dept_id, "stats": compute_summary_stats(values), "count": len(group_visits)})
    return sorted(result, key=lambda x: x["stats"].get("mean") or 0, reverse=True)

def aggregate_by_doctor(visits: list, metric: str) -> list:
    groups = defaultdict(list)
    for v in visits:
        groups[v.get("doctor_id","unknown")].append(v)
    result = []
    for doc_id, group_visits in groups.items():
        values = extract_metric_values(group_visits, metric)
        result.append({"group": doc_id, "group_label": doc_id, "stats": compute_summary_stats(values), "count": len(group_visits)})
    return result

def aggregate_by_day_of_week(visits: list, metric: str) -> list:
    from datetime import datetime
    groups = defaultdict(list)
    for v in visits:
        try:
            dt = v.get("arrival_time")
            if isinstance(dt, str): dt = datetime.fromisoformat(dt)
            if dt: groups[dt.weekday()].append(v)
        except Exception:
            pass
    result = []
    for day_num in range(7):
        group_visits = groups.get(day_num, [])
        values = extract_metric_values(group_visits, metric)
        result.append({"group": str(day_num), "group_label": DAY_NAMES[day_num], "stats": compute_summary_stats(values), "count": len(group_visits)})
    return result

def aggregate_by_visit_type(visits: list, metric: str) -> list:
    groups = defaultdict(list)
    for v in visits:
        groups[v.get("visit_type","unknown")].append(v)
    result = []
    for vtype, group_visits in groups.items():
        values = extract_metric_values(group_visits, metric)
        result.append({"group": vtype, "group_label": vtype, "stats": compute_summary_stats(values), "count": len(group_visits)})
    return result
