from fastapi import APIRouter, Depends
from typing import Optional
from datetime import datetime, timezone, timedelta
from app.modules.audit import service as audit_service
from app.core.dependencies import require_roles, get_current_user

router = APIRouter(prefix="/api/v1/clinics/{clinic_id}/audit", tags=["Audit"])

@router.get("")
async def list_audit_entries(clinic_id: str, event_type: Optional[str] = None, page: int = 1, page_size: int = 50, _=Depends(require_roles("super_admin","clinic_admin"))):
    event_types = [event_type] if event_type else None
    return await audit_service.list_entries(clinic_id, event_types, page, page_size)

@router.post("/seed-demo")
async def seed_demo_audit(clinic_id: str, current_user=Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    demo_events = [
        {
            "event_type": "user.login",
            "actor_user_id": current_user.id,
            "actor_email": current_user.email,
            "target_id": current_user.id,
            "target_type": "user",
            "metadata": {"ip": "127.0.0.1", "auth_mode": "jwt_bearer", "role": current_user.role},
            "created_at": now - timedelta(minutes=18),
        },
        {
            "event_type": "simulation.run",
            "actor_user_id": current_user.id,
            "actor_email": current_user.email,
            "target_id": "sim-cfg-01",
            "target_type": "simulation_config",
            "metadata": {"name": "Standard OPD Baseline", "replications": 10, "engine": "SimPy"},
            "created_at": now - timedelta(minutes=42),
        },
        {
            "event_type": "visit.created",
            "actor_user_id": current_user.id,
            "actor_email": current_user.email,
            "target_id": "CQ-339",
            "target_type": "visit",
            "metadata": {"category": "walk_in", "department": "General Medicine"},
            "created_at": now - timedelta(hours=1, minutes=15),
        },
        {
            "event_type": "doctor.created",
            "actor_user_id": current_user.id,
            "actor_email": current_user.email,
            "target_id": "doc-001",
            "target_type": "doctor",
            "metadata": {"name": "Dr. Kavitha Ramesh, MD", "specialization": "General Medicine"},
            "created_at": now - timedelta(hours=2, minutes=30),
        },
        {
            "event_type": "clinic.updated",
            "actor_user_id": current_user.id,
            "actor_email": current_user.email,
            "target_id": clinic_id,
            "target_type": "clinic",
            "metadata": {"field": "operating_hours", "schedule": "07:00 - 20:00"},
            "created_at": now - timedelta(hours=3, minutes=10),
        },
        {
            "event_type": "dataset.imported",
            "actor_user_id": current_user.id,
            "actor_email": current_user.email,
            "target_id": "import-batch-2026",
            "target_type": "dataset",
            "metadata": {"rows_processed": 35, "status": "validated_clean"},
            "created_at": now - timedelta(hours=4, minutes=50),
        },
        {
            "event_type": "visit.updated",
            "actor_user_id": current_user.id,
            "actor_email": current_user.email,
            "target_id": "CQ-527",
            "target_type": "visit",
            "metadata": {"action": "service_completed", "service_time_minutes": 22.0},
            "created_at": now - timedelta(hours=6, minutes=20),
        },
        {
            "event_type": "report.generated",
            "actor_user_id": current_user.id,
            "actor_email": current_user.email,
            "target_id": "rpt-p90-compliance",
            "target_type": "report",
            "metadata": {"type": "SLA Compliance P90 Waiting Time", "format": "PDF"},
            "created_at": now - timedelta(hours=8, minutes=5),
        },
        {
            "event_type": "user.login",
            "actor_user_id": current_user.id,
            "actor_email": current_user.email,
            "target_id": current_user.id,
            "target_type": "user",
            "metadata": {"ip": "192.168.1.45", "auth_mode": "jwt_bearer"},
            "created_at": now - timedelta(hours=12, minutes=0),
        },
    ]

    repo = audit_service.get_audit_repo()
    for ev in demo_events:
        ev["clinic_id"] = clinic_id
        await repo.insert_one(ev)

    return {"message": f"Successfully generated {len(demo_events)} compliance audit records for clinic {clinic_id}"}

