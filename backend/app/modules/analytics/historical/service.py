from datetime import datetime, timezone
from app.modules.analytics.historical.schemas import AnalyticsQuery, HeatmapQuery
from app.modules.visits.repository import VisitRepository
from app.domain.waiting_times import compute_waiting_times
from app.domain.analytics.waiting_times import compute_summary_stats, compute_distribution, extract_metric_values
from app.domain.analytics.aggregations import aggregate_by_department, aggregate_by_doctor, aggregate_by_day_of_week, aggregate_by_visit_type
from app.domain.analytics.time_slots import aggregate_by_time_slot, compute_heatmap_data, find_bottleneck_slots

class HistoricalAnalyticsService:
    def __init__(self):
        self.repo = VisitRepository()

    async def _load_visits(self, clinic_id: str, query: AnalyticsQuery) -> list:
        start = datetime.combine(query.start_date, datetime.min.time()).replace(tzinfo=timezone.utc)
        end = datetime.combine(query.end_date, datetime.max.time()).replace(tzinfo=timezone.utc)
        extra = {}
        if query.department_ids:
            extra["department_id"] = {"$in": query.department_ids}
        visits = await self.repo.find_by_date_range(clinic_id, start, end, extra)
        return [compute_waiting_times(v) for v in visits]

    async def compute_analytics(self, clinic_id: str, query: AnalyticsQuery) -> dict:
        visits = await self._load_visits(clinic_id, query)
        overall_values = extract_metric_values(visits, query.metric)

        agg_fn = {
            "department": aggregate_by_department,
            "doctor": aggregate_by_doctor,
            "day_of_week": aggregate_by_day_of_week,
            "visit_type": aggregate_by_visit_type,
            "time_slot": lambda v, m: aggregate_by_time_slot(v, m, query.slot_minutes),
        }[query.group_by]

        return {
            "source": "historical",
            "query": query.model_dump(),
            "summary": compute_summary_stats(overall_values),
            "breakdown": agg_fn(visits, query.metric),
            "distribution": compute_distribution(overall_values),
            "total_visits": len(visits),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }

    async def compute_heatmap(self, clinic_id: str, query: HeatmapQuery) -> dict:
        from app.modules.analytics.historical.schemas import AnalyticsQuery
        visits_query = AnalyticsQuery(start_date=query.start_date, end_date=query.end_date)
        visits = await self._load_visits(clinic_id, visits_query)
        heatmap = compute_heatmap_data(visits, query.metric, query.slot_minutes)
        bottlenecks = find_bottleneck_slots(heatmap)
        return {"source": "historical", "data": heatmap, "bottlenecks": bottlenecks[:10]}
