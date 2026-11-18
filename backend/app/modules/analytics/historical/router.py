from fastapi import APIRouter, Depends
from app.modules.analytics.historical.schemas import AnalyticsQuery, HeatmapQuery
from app.modules.analytics.historical.service import HistoricalAnalyticsService
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/clinics/{clinic_id}/analytics/historical", tags=["Analytics"])

@router.post("/compute")
async def compute_analytics(clinic_id: str, query: AnalyticsQuery, _=Depends(get_current_user)):
    return await HistoricalAnalyticsService().compute_analytics(clinic_id, query)

@router.post("/heatmap")
async def compute_heatmap(clinic_id: str, query: HeatmapQuery, _=Depends(get_current_user)):
    return await HistoricalAnalyticsService().compute_heatmap(clinic_id, query)

@router.get("/summary")
async def get_summary(clinic_id: str, _=Depends(get_current_user)):
    from datetime import date, timedelta
    query = AnalyticsQuery(start_date=date.today()-timedelta(days=30), end_date=date.today())
    return await HistoricalAnalyticsService().compute_analytics(clinic_id, query)
