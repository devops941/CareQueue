from datetime import datetime, timezone, date, timedelta
from collections import defaultdict
from app.modules.visits.repository import VisitRepository
from app.domain.waiting_times import compute_waiting_times
from app.domain.analytics.waiting_times import compute_summary_stats, extract_metric_values
from app.domain.analytics.time_slots import aggregate_by_time_slot, compute_heatmap_data, find_bottleneck_slots
from app.core.database import get_database

class DashboardService:
    def __init__(self):
        self.visit_repo = VisitRepository()

    async def get_summary(self, clinic_id: str, days: int = 30) -> dict:
        end = datetime.now(timezone.utc)
        start = end - timedelta(days=days)
        prior_start = start - timedelta(days=days)

        visits = await self.visit_repo.find_by_date_range(clinic_id, start, end)
        prior_visits = await self.visit_repo.find_by_date_range(clinic_id, prior_start, start)

        enriched = [compute_waiting_times(v) for v in visits]
        prior_enriched = [compute_waiting_times(v) for v in prior_visits]

        queue_values = extract_metric_values(enriched, "queue_wait")
        prior_queue_values = extract_metric_values(prior_enriched, "queue_wait")
        summary = compute_summary_stats(queue_values)
        prior_summary = compute_summary_stats(prior_queue_values)

        # Busiest hour
        slots = aggregate_by_time_slot(enriched, "count", 60)
        busiest_slot = max(slots, key=lambda s: s["count"], default=None)

        # Trend
        trend = "stable"
        change = 0
        if summary["mean"] and prior_summary["mean"] and prior_summary["mean"] > 0:
            change = (summary["mean"] - prior_summary["mean"]) / prior_summary["mean"] * 100
            trend = "worsening" if change > 10 else ("improving" if change < -10 else "stable")

        # Quality score
        total = len(enriched)
        missing = sum(1 for v in enriched if not v.get("service_start_time"))
        quality_score = round(100 * (1 - missing / max(total, 1)), 1)

        db = get_database()

        # 1. Real Hourly Flow Data (08:00 to 18:00)
        hourly_buckets = defaultdict(lambda: {"arrivals": 0, "waits": []})
        for v in enriched:
            arr = v.get("arrival_time")
            if arr:
                if isinstance(arr, str):
                    try: arr = datetime.fromisoformat(arr)
                    except: continue
                slot_hour = f"{arr.hour:02d}:00"
                hourly_buckets[slot_hour]["arrivals"] += 1
                if v.get("queue_wait_minutes") is not None:
                    hourly_buckets[slot_hour]["waits"].append(v["queue_wait_minutes"])

        standard_hours = [f"{h:02d}:00" for h in range(8, 19)]
        hourly_flow = []
        for h in standard_hours:
            bdata = hourly_buckets.get(h, {"arrivals": 0, "waits": []})
            mean_w = round(sum(bdata["waits"]) / len(bdata["waits"]), 1) if bdata["waits"] else 0
            hourly_flow.append({"time": h, "arrivals": bdata["arrivals"], "wait": mean_w})

        # 2. Departments Performance & SLAs
        raw_depts = await db["departments"].find({"clinic_id": clinic_id}).to_list(20)
        dept_map = {d.get("name"): d for d in raw_depts}

        dept_stats = defaultdict(lambda: {"count": 0, "waits": []})
        for v in enriched:
            dname = v.get("department_id") or "General Medicine"
            dept_stats[dname]["count"] += 1
            if v.get("queue_wait_minutes") is not None:
                dept_stats[dname]["waits"].append(v["queue_wait_minutes"])

        department_breakdown = []
        # Include registered departments even if 0 visits
        all_dept_names = set(dept_map.keys()) | set(dept_stats.keys())
        for dname in sorted(all_dept_names):
            info = dept_map.get(dname, {})
            st = dept_stats.get(dname, {"count": 0, "waits": []})
            avg_w = round(sum(st["waits"]) / len(st["waits"]), 1) if st["waits"] else 0
            sla = info.get("target_service_time", 15)
            compliance = max(15, min(100, round(100 * (1 - (avg_w / max(sla * 2.5, 1)))))) if avg_w > 0 else 100
            department_breakdown.append({
                "name": dname,
                "code": info.get("code") or dname[:4].upper(),
                "patient_count": st["count"],
                "mean_wait": avg_w,
                "target_sla": sla,
                "capacity": info.get("capacity", 2),
                "sla_compliance_pct": compliance,
            })

        # 3. Doctors on Duty
        doctors_cursor = db["doctors"].find({"clinic_id": clinic_id, "is_active": True})
        doctors_list = await doctors_cursor.to_list(10)
        doctors_on_duty = [
            {
                "id": str(doc["_id"]),
                "name": doc.get("name"),
                "specialization": doc.get("specialization") or "General Medicine",
                "room_number": doc.get("room_number") or "Cabin 101",
                "schedule": doc.get("schedule") or "Mon - Sat (09:00 - 13:00)",
                "target_sla": doc.get("target_consultation_minutes", 15),
            }
            for doc in doctors_list
        ]

        # 4. Latest SimPy Simulation
        latest_sim = await db["simulation_results"].find_one({"clinic_id": clinic_id}, sort=[("computed_at", -1)])
        sim_preview = None
        if latest_sim:
            sim_preview = {
                "name": latest_sim.get("assumptions", {}).get("name", "Standard Baseline OPD"),
                "mean_queue_wait": latest_sim.get("overall", {}).get("mean_queue_wait", 0),
                "ci_lower": latest_sim.get("overall", {}).get("ci_lower", 0),
                "ci_upper": latest_sim.get("overall", {}).get("ci_upper", 0),
                "replications": latest_sim.get("replications", 10),
                "total_patients": latest_sim.get("overall", {}).get("total_patients", 0),
            }

        # 5. Peak Bottleneck Window
        heatmap = compute_heatmap_data(enriched, "count", 60)
        bottlenecks = find_bottleneck_slots(heatmap)
        peak_bottleneck = bottlenecks[0] if bottlenecks else None

        # 6. Recent Patient Visits
        recent_visits = []
        for v in enriched[:5]:
            arr_str = v.get("arrival_time")
            if isinstance(arr_str, datetime):
                arr_str = arr_str.isoformat()
            recent_visits.append({
                "patient_token": v.get("patient_token", "CQ-000"),
                "visit_date": v.get("visit_date"),
                "arrival_time": arr_str,
                "queue_wait_minutes": v.get("queue_wait_minutes"),
                "visit_type": v.get("visit_type", "walk_in"),
                "status": "Completed" if v.get("departure_time") else ("In Consultation" if v.get("service_start_time") else "Waiting in Queue"),
            })

        # 7. Visit Type Category Distribution (For Pie Chart)
        type_counts = defaultdict(int)
        for v in enriched:
            t = v.get("visit_type") or "walk_in"
            type_counts[t] += 1

        visit_type_distribution = [
            {"name": "Walk-in Consult", "type": "walk_in", "value": type_counts["walk_in"], "color": "#0ea5e9"},
            {"name": "Follow-up", "type": "follow_up", "value": type_counts["follow_up"], "color": "#6366f1"},
            {"name": "New Registration", "type": "new", "value": type_counts["new"], "color": "#10b981"},
            {"name": "Emergency", "type": "emergency", "value": type_counts["emergency"], "color": "#f43f5e"},
        ]

        kpis = {
            "total_visits": total,
            "mean_queue_wait_minutes": summary.get("mean"),
            "median_queue_wait_minutes": summary.get("median"),
            "p90_queue_wait_minutes": summary.get("p90"),
            "mean_service_time_minutes": compute_summary_stats(extract_metric_values(enriched, "service_time")).get("mean"),
            "busiest_hour": busiest_slot["time_slot"] if busiest_slot else "11:00 AM",
            "data_quality_score": quality_score,
            "trend": trend,
            "trend_change_pct": round(change, 1) if summary["mean"] and prior_summary["mean"] and prior_summary["mean"] > 0 else 0,
            "active_doctors_count": len(doctors_on_duty),
            "active_departments_count": len(department_breakdown),
        }

        insights = self._generate_insights(enriched, kpis, trend)

        return {
            "clinic_id": clinic_id,
            "period": f"Last {days} days",
            "kpis": kpis,
            "hourly_flow": hourly_flow,
            "department_breakdown": department_breakdown,
            "visit_type_distribution": visit_type_distribution,
            "doctors_on_duty": doctors_on_duty,
            "sim_preview": sim_preview,
            "peak_bottleneck": peak_bottleneck,
            "recent_visits": recent_visits,
            "insights": insights,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }

    def _generate_insights(self, visits: list, kpis: dict, trend: str) -> list:
        insights = []

        if trend == "worsening":
            insights.append({
                "source": "historical",
                "type": "trend",
                "title": "Queue wait times increasing",
                "description": f"Mean queue wait has increased by {kpis.get('trend_change_pct', 0):.1f}% vs prior period",
                "severity": "alert"
            })
        elif trend == "improving":
            insights.append({
                "source": "historical",
                "type": "trend",
                "title": "Queue times improving",
                "description": f"Mean wait improved by {abs(kpis.get('trend_change_pct', 0)):.1f}% vs prior period",
                "severity": "info"
            })

        if kpis.get("busiest_hour"):
            insights.append({
                "source": "historical",
                "type": "bottleneck",
                "title": f"Peak load at {kpis['busiest_hour']}",
                "description": "This is your busiest arrival hour — consider extra staffing.",
                "severity": "warning"
            })

        if kpis.get("data_quality_score", 100) < 90:
            insights.append({
                "source": "historical",
                "type": "outlier",
                "title": "Data quality below 90%",
                "description": "Some visits are missing important timestamps. Check the Data Quality page.",
                "severity": "warning"
            })

        return insights
