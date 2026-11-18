from fastapi import APIRouter, Depends
from datetime import date
from app.core.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/api/v1/clinics/{clinic_id}/data-quality", tags=["Data Quality"])

@router.post("/check")
async def run_quality_check(
    clinic_id: str,
    start_date: date = None,
    end_date: date = None,
    _=Depends(get_current_user),
):
    from app.modules.visits.repository import VisitRepository
    from app.domain.data_quality import run_full_quality_check
    from datetime import datetime, timezone

    repo = VisitRepository()
    start = datetime.combine(start_date or date.today().replace(day=1), datetime.min.time()).replace(tzinfo=timezone.utc) if start_date else datetime(2020, 1, 1, tzinfo=timezone.utc)
    end = datetime.combine(end_date or date.today(), datetime.max.time()).replace(tzinfo=timezone.utc)

    visits = await repo.find_by_date_range(clinic_id, start, end)
    return run_full_quality_check(visits)

@router.post("/exclude")
async def exclude_visits(clinic_id: str, payload: dict, _=Depends(require_roles("super_admin", "clinic_admin", "analyst"))):
    from app.modules.visits.repository import VisitRepository
    from bson import ObjectId
    from datetime import datetime, timezone
    repo = VisitRepository()
    visit_ids = payload.get("visit_ids", [])
    reason = payload.get("reason", "Manual exclusion")
    count = 0
    for vid in visit_ids:
        ok = await repo.update_one({"_id": ObjectId(vid)}, {"excluded": True, "exclusion_reason": reason, "updated_at": datetime.now(timezone.utc)}, clinic_id)
        if ok: count += 1
    return {"excluded": count}
