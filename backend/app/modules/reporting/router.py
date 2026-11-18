from fastapi import APIRouter, Depends
from fastapi.responses import Response
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/clinics/{clinic_id}/reports", tags=["Reports"])

@router.post("/analytics/csv")
async def export_analytics_csv(clinic_id: str, payload: dict, _=Depends(get_current_user)):
    from app.modules.analytics.historical.service import HistoricalAnalyticsService
    from app.modules.analytics.historical.schemas import AnalyticsQuery
    from app.modules.reporting.csv_exporter import analytics_to_csv
    from datetime import date, timedelta

    start_date = payload.get("start_date", (date.today()-timedelta(days=30)).isoformat())
    end_date = payload.get("end_date", date.today().isoformat())

    query = AnalyticsQuery(
        start_date=date.fromisoformat(start_date),
        end_date=date.fromisoformat(end_date),
        metric=payload.get("metric","queue_wait"),
        group_by=payload.get("group_by","department"),
    )
    result = await HistoricalAnalyticsService().compute_analytics(clinic_id, query)
    csv_content = analytics_to_csv(result)
    return Response(content=csv_content, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=carequeue_analytics_{start_date}_{end_date}.csv"})

@router.post("/visits/csv")
async def export_visits_csv(clinic_id: str, payload: dict, _=Depends(get_current_user)):
    from app.modules.visits.repository import VisitRepository
    from app.domain.waiting_times import compute_waiting_times
    from app.modules.reporting.csv_exporter import visits_to_csv
    from datetime import datetime, timezone, date, timedelta

    start_date = payload.get("start_date", (date.today()-timedelta(days=30)).isoformat())
    end_date = payload.get("end_date", date.today().isoformat())
    start = datetime.combine(date.fromisoformat(start_date), datetime.min.time()).replace(tzinfo=timezone.utc)
    end = datetime.combine(date.fromisoformat(end_date), datetime.max.time()).replace(tzinfo=timezone.utc)

    visits = await VisitRepository().find_by_date_range(clinic_id, start, end)
    enriched = [compute_waiting_times(v) for v in visits]
    csv_content = visits_to_csv(enriched)
    return Response(content=csv_content, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=carequeue_visits_{start_date}_{end_date}.csv"})
