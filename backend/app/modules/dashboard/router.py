from fastapi import APIRouter, Depends
from app.modules.dashboard.service import DashboardService
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/clinics/{clinic_id}/dashboard", tags=["Dashboard"])

@router.get("/summary")
async def get_dashboard_summary(clinic_id: str, days: int = 30, _=Depends(get_current_user)):
    return await DashboardService().get_summary(clinic_id, days)
