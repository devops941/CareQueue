import numpy as np
from typing import Optional

def find_duplicates(visits: list[dict]) -> list[dict]:
    seen = {}
    issues = []
    for v in visits:
        key = (v.get("patient_token"), str(v.get("visit_date")), v.get("department_id"))
        if key in seen:
            issues.append({
                "visit_id": v.get("id"),
                "issue_type": "duplicate",
                "field": None,
                "description": f"Duplicate visit: same patient_token + date + department",
                "severity": "warning",
                "suggested_action": "review"
            })
        else:
            seen[key] = v.get("id")
    return issues

def find_outliers(visits: list[dict], field: str) -> list[dict]:
    values = [v.get(field) for v in visits if v.get(field) is not None]
    if len(values) < 4:
        return []
    arr = np.array(values, dtype=float)
    q1, q3 = np.percentile(arr, 25), np.percentile(arr, 75)
    iqr = q3 - q1
    lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    issues = []
    for v in visits:
        val = v.get(field)
        if val is not None and (val < lower or val > upper):
            issues.append({
                "visit_id": v.get("id"),
                "issue_type": "outlier",
                "field": field,
                "description": f"{field}={val:.1f} is outside IQR bounds [{lower:.1f}, {upper:.1f}]",
                "severity": "warning",
                "suggested_action": "review"
            })
    return issues

def find_missing_timestamps(visits: list[dict]) -> list[dict]:
    critical = ["arrival_time"]
    important = ["service_start_time", "service_end_time"]
    issues = []
    for v in visits:
        for f in critical:
            if not v.get(f):
                issues.append({"visit_id": v.get("id"), "issue_type": "missing_timestamp", "field": f, "description": f"Missing required field: {f}", "severity": "error", "suggested_action": "review"})
        for f in important:
            if not v.get(f):
                issues.append({"visit_id": v.get("id"), "issue_type": "missing_timestamp", "field": f, "description": f"Missing field: {f}", "severity": "warning", "suggested_action": "review"})
    return issues

def run_full_quality_check(visits: list[dict]) -> dict:
    from app.domain.waiting_times import compute_waiting_times
    enriched = [compute_waiting_times(v) for v in visits]

    all_issues = []
    all_issues.extend(find_duplicates(enriched))
    for field in ["queue_wait_minutes", "service_time_minutes", "total_visit_minutes"]:
        all_issues.extend(find_outliers(enriched, field))
    all_issues.extend(find_missing_timestamps(enriched))

    summary = {}
    for issue in all_issues:
        t = issue["issue_type"]
        summary[t] = summary.get(t, 0) + 1

    quality_score = max(0.0, 100.0 * (1 - len([i for i in all_issues if i["severity"] == "error"]) / max(len(visits), 1)))

    return {
        "total_visits": len(visits),
        "issues": all_issues,
        "summary": summary,
        "quality_score": round(quality_score, 1),
    }
