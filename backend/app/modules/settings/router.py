from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user, require_roles
from app.core.database import get_database

router = APIRouter(prefix="/api/v1/clinics/{clinic_id}/settings", tags=["Settings"])

DEFAULT_SETTINGS = {
    "default_slot_minutes": 60,
    "default_analytics_days": 30,
    "outlier_method": "iqr",
    "default_replications": 10,
    "default_simulation_hours": 8.0,
    "date_format": "DD/MM/YYYY",
}

@router.get("")
async def get_settings(clinic_id: str, _=Depends(get_current_user)):
    db = get_database()
    doc = await db["clinic_settings"].find_one({"clinic_id": clinic_id})
    if doc:
        doc.pop("_id", None)
        return doc
    return {**DEFAULT_SETTINGS, "clinic_id": clinic_id}

@router.patch("")
async def update_settings(clinic_id: str, payload: dict, _=Depends(require_roles("super_admin","clinic_admin"))):
    db = get_database()
    from datetime import datetime, timezone
    payload["clinic_id"] = clinic_id
    payload["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db["clinic_settings"].update_one({"clinic_id": clinic_id}, {"$set": payload}, upsert=True)
    return payload
