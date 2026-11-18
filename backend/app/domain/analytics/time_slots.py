from collections import defaultdict
from datetime import datetime
from app.domain.analytics.waiting_times import compute_summary_stats, extract_metric_values

def get_time_slot(dt, slot_minutes: int = 60) -> str:
    if isinstance(dt, str):
        try: dt = datetime.fromisoformat(dt)
        except: return "00:00"
    if dt:
        total_minutes = dt.hour * 60 + dt.minute
        slot_start = (total_minutes // slot_minutes) * slot_minutes
        h, m = divmod(slot_start, 60)
        return f"{h:02d}:{m:02d}"
    return "00:00"

def bucket_into_slots(visits: list, slot_minutes: int = 60) -> list:
    result = []
    for v in visits:
        dt = v.get("arrival_time")
        result.append({**v, "time_slot": get_time_slot(dt, slot_minutes)})
    return result

def aggregate_by_time_slot(visits: list, metric: str, slot_minutes: int = 60) -> list:
    groups = defaultdict(list)
    for v in visits:
        slot = get_time_slot(v.get("arrival_time"), slot_minutes)
        groups[slot].append(v)
    result = []
    for slot in sorted(groups.keys()):
        group_visits = groups[slot]
        if metric == "count":
            result.append({"time_slot": slot, "stats": {"mean": len(group_visits), "count": len(group_visits)}, "count": len(group_visits)})
        else:
            values = extract_metric_values(group_visits, metric)
            result.append({"time_slot": slot, "stats": compute_summary_stats(values), "count": len(group_visits)})
    return result

def compute_heatmap_data(visits: list, metric: str = "count", slot_minutes: int = 60) -> list:
    DAY_NAMES = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
    groups = defaultdict(list)
    for v in visits:
        try:
            dt = v.get("arrival_time")
            if isinstance(dt, str): dt = datetime.fromisoformat(dt)
            if dt:
                slot = get_time_slot(dt, slot_minutes)
                day = DAY_NAMES[dt.weekday()]
                groups[(slot, day)].append(v)
        except: pass
    result = []
    for (slot, day), group_visits in groups.items():
        if metric == "count":
            value = len(group_visits)
        else:
            from app.domain.analytics.waiting_times import extract_metric_values
            vals = extract_metric_values(group_visits, metric)
            value = round(sum(vals)/len(vals), 2) if vals else 0
        result.append({"x": slot, "y": day, "value": value, "count": len(group_visits)})
    return result

def find_bottleneck_slots(heatmap_data: list, threshold_percentile: int = 75) -> list:
    import numpy as np
    if not heatmap_data: return []
    values = [d["value"] for d in heatmap_data]
    threshold = np.percentile(values, threshold_percentile)
    result = []
    for d in heatmap_data:
        if d["value"] >= threshold:
            severity = "high" if d["value"] >= np.percentile(values, 90) else "medium"
            result.append({**d, "is_bottleneck": True, "severity": severity})
    return sorted(result, key=lambda x: x["value"], reverse=True)
