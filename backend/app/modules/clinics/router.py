from fastapi import APIRouter, Depends
from app.modules.clinics.schemas import ClinicCreate, ClinicOut, ClinicUpdate, ClinicOnboardingPayload
from app.modules.clinics.service import ClinicService
from app.core.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/api/v1/clinics", tags=["Clinics"])

@router.post("", response_model=ClinicOut, status_code=201)
async def create_clinic(data: ClinicCreate, _=Depends(require_roles("super_admin"))):
    return await ClinicService().create_clinic(data)

@router.get("", response_model=list[ClinicOut])
async def list_clinics(_=Depends(require_roles("super_admin"))):
    return await ClinicService().list_clinics()

@router.get("/{clinic_id}", response_model=ClinicOut)
async def get_clinic(clinic_id: str, current_user=Depends(get_current_user)):
    return await ClinicService().get_clinic(clinic_id)

@router.patch("/{clinic_id}", response_model=ClinicOut)
async def update_clinic(clinic_id: str, data: ClinicUpdate, current_user=Depends(require_roles("super_admin", "clinic_admin"))):
    return await ClinicService().update_clinic(clinic_id, data)

@router.post("/{clinic_id}/onboarding")
async def complete_onboarding(
    clinic_id: str,
    payload: ClinicOnboardingPayload,
    current_user=Depends(require_roles("super_admin", "clinic_admin"))
):
    from app.core.database import get_database
    from app.modules.audit.service import log_event
    from datetime import datetime, timezone
    from bson import ObjectId

    db = get_database()

    # 1. Update clinic profile
    working_hours = {
        "monday": {"open": payload.shift_start, "close": payload.shift_end, "is_open": True},
        "tuesday": {"open": payload.shift_start, "close": payload.shift_end, "is_open": True},
        "wednesday": {"open": payload.shift_start, "close": payload.shift_end, "is_open": True},
        "thursday": {"open": payload.shift_start, "close": payload.shift_end, "is_open": True},
        "friday": {"open": payload.shift_start, "close": payload.shift_end, "is_open": True},
        "saturday": {"open": payload.shift_start, "close": payload.shift_end, "is_open": True},
        "sunday": {"open": payload.shift_start, "close": payload.shift_end, "is_open": False},
    }

    update_fields = {
        "name": payload.name,
        "address": payload.address,
        "contact_email": payload.contact_email,
        "timezone": payload.timezone,
        "working_hours": working_hours,
        "is_onboarded": True,
        "updated_at": datetime.now(timezone.utc),
    }

    await db["clinics"].update_one({"_id": ObjectId(clinic_id)}, {"$set": update_fields})

    # 2. Add / ensure departments
    if payload.departments:
        for d in payload.departments:
            existing = await db["departments"].find_one({"clinic_id": clinic_id, "name": d["name"]})
            if not existing:
                await db["departments"].insert_one({
                    "clinic_id": clinic_id,
                    "name": d["name"],
                    "code": d.get("code") or d["name"][:4].upper(),
                    "target_service_time": d.get("target_service_time", 15),
                    "capacity": d.get("capacity", 2),
                    "created_at": datetime.now(timezone.utc),
                })

    # 3. Add lead doctor if provided
    if payload.lead_doctor and payload.lead_doctor.get("name"):
        doc_data = payload.lead_doctor
        existing_doc = await db["doctors"].find_one({"clinic_id": clinic_id, "name": doc_data["name"]})
        if not existing_doc:
            await db["doctors"].insert_one({
                "clinic_id": clinic_id,
                "name": doc_data["name"],
                "specialization": doc_data.get("specialization") or "General Medicine",
                "degrees": doc_data.get("degrees") or "MBBS, MD",
                "license_number": doc_data.get("license_number") or "NMC-2024-REG",
                "room_number": doc_data.get("room_number") or "Cabin 101",
                "phone": doc_data.get("phone") or payload.contact_phone or "",
                "email": doc_data.get("email") or payload.contact_email,
                "schedule": doc_data.get("schedule") or f"Mon - Sat | {payload.shift_start} - {payload.shift_end}",
                "target_consultation_minutes": doc_data.get("target_consultation_minutes", 15),
                "is_active": True,
                "created_at": datetime.now(timezone.utc),
            })

    # 4. Seed demo visits if requested
    if payload.seed_demo_visits:
        from app.modules.visits.router import seed_demo_visits
        try:
            await seed_demo_visits(clinic_id, current_user)
        except Exception:
            pass

    # 5. Log audit event
    try:
        await log_event(
            clinic_id=clinic_id,
            event_type="clinic.onboarded",
            actor_user_id=current_user.id,
            actor_email=current_user.email,
            target_id=clinic_id,
            target_type="clinic",
            metadata={"clinic_name": payload.name, "seed_demo": payload.seed_demo_visits}
        )
    except Exception:
        pass

    return {
        "success": True,
        "message": "Hospital onboarding completed successfully",
        "clinic_id": clinic_id,
        "is_onboarded": True,
    }
