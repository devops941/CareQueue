from fastapi import APIRouter, Depends
from typing import Optional
from app.modules.visits.schemas import VisitCreate, VisitOut, VisitUpdate
from app.modules.visits.service import VisitService
from app.core.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/api/v1/clinics/{clinic_id}/visits", tags=["Visits"])

@router.post("", response_model=VisitOut, status_code=201)
async def create_visit(clinic_id: str, data: VisitCreate, current_user=Depends(require_roles("super_admin", "clinic_admin", "analyst"))):
    created = await VisitService().create_visit(clinic_id, data)
    try:
        from app.modules.audit.service import log_event
        await log_event(
            clinic_id=clinic_id,
            event_type="visit.created",
            actor_user_id=current_user.id,
            actor_email=current_user.email,
            target_id=created.patient_token,
            target_type="visit",
            metadata={"category": created.visit_type, "department": created.department_id}
        )
    except Exception:
        pass
    return created

@router.get("")
async def list_visits(clinic_id: str, page: int = 1, page_size: int = 50, department_id: Optional[str] = None, doctor_id: Optional[str] = None, visit_type: Optional[str] = None, _=Depends(get_current_user)):
    return await VisitService().list_visits(clinic_id, page, page_size, department_id=department_id, doctor_id=doctor_id, visit_type=visit_type)

@router.get("/{visit_id}", response_model=VisitOut)
async def get_visit(clinic_id: str, visit_id: str, _=Depends(get_current_user)):
    return await VisitService().get_visit(clinic_id, visit_id)

@router.patch("/{visit_id}", response_model=VisitOut)
async def update_visit(clinic_id: str, visit_id: str, data: VisitUpdate, current_user=Depends(require_roles("super_admin", "clinic_admin", "analyst"))):
    updated = await VisitService().update_visit(clinic_id, visit_id, data)
    try:
        from app.modules.audit.service import log_event
        await log_event(
            clinic_id=clinic_id,
            event_type="visit.updated",
            actor_user_id=current_user.id,
            actor_email=current_user.email,
            target_id=updated.patient_token,
            target_type="visit",
            metadata={"updates": list(data.model_dump(exclude_none=True).keys())}
        )
    except Exception:
        pass
    return updated

@router.delete("/{visit_id}")
async def delete_visit(clinic_id: str, visit_id: str, current_user=Depends(require_roles("super_admin", "clinic_admin"))):
    await VisitService().delete_visit(clinic_id, visit_id)
    try:
        from app.modules.audit.service import log_event
        await log_event(
            clinic_id=clinic_id,
            event_type="visit.deleted",
            actor_user_id=current_user.id,
            actor_email=current_user.email,
            target_id=visit_id,
            target_type="visit"
        )
    except Exception:
        pass
    return {"message": "Visit deleted"}

@router.post("/seed-demo")
async def seed_demo_visits(clinic_id: str, current_user=Depends(get_current_user)):
    from datetime import datetime, timezone, timedelta
    import random
    from app.core.database import get_database

    db = get_database()
    departments = await db["departments"].find({"clinic_id": clinic_id}).to_list(10)
    dept_ids = [str(d["_id"]) for d in departments] or ["dept-opd"]

    sample_visits = []
    base_now = datetime.now(timezone.utc)
    visit_types = ["walk_in", "walk_in", "follow_up", "new", "emergency"]

    for i in range(1, 36):
        days_ago = random.randint(0, 14)
        hour = random.choice([8, 9, 9, 10, 10, 11, 11, 12, 14, 15, 16, 17])
        minute = random.randint(0, 50)
        arrival = base_now - timedelta(days=days_ago)
        arrival = arrival.replace(hour=hour, minute=minute, second=0, microsecond=0)

        reg_wait = random.randint(2, 8)
        reg_time = arrival + timedelta(minutes=reg_wait)

        queue_wait = random.randint(5, 45)
        called_time = reg_time + timedelta(minutes=queue_wait)

        service_duration = random.randint(8, 25)
        service_start = called_time + timedelta(minutes=1)
        service_end = service_start + timedelta(minutes=service_duration)

        dep_wait = random.randint(2, 6)
        departure_time = service_end + timedelta(minutes=dep_wait)

        sample_visits.append({
            "clinic_id": clinic_id,
            "patient_token": f"CQ-{random.randint(100, 999)}",
            "visit_date": arrival.date().isoformat(),
            "department_id": random.choice(dept_ids),
            "doctor_id": None,
            "arrival_time": arrival,
            "registration_time": reg_time,
            "triage_time": None,
            "called_time": called_time,
            "service_start_time": service_start,
            "service_end_time": service_end,
            "departure_time": departure_time,
            "visit_type": random.choice(visit_types),
            "excluded": False,
            "notes": "Generated sample visit for analytics and queue intelligence demonstration",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })

    inserted = await db["visits"].insert_many(sample_visits)
    try:
        from app.modules.audit.service import log_event
        await log_event(
            clinic_id=clinic_id,
            event_type="dataset.imported",
            actor_user_id=current_user.id,
            actor_email=current_user.email,
            target_id=f"batch-{len(inserted.inserted_ids)}",
            target_type="dataset",
            metadata={"records_created": len(inserted.inserted_ids)}
        )
    except Exception:
        pass
    return {"message": f"Successfully created {len(inserted.inserted_ids)} sample visits for clinic {clinic_id}"}

