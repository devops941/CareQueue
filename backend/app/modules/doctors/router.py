from fastapi import APIRouter, Depends
from typing import Optional
from app.modules.doctors.schemas import DoctorCreate, DoctorOut, DoctorUpdate
from app.modules.doctors.service import DoctorService
from app.core.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/api/v1/clinics/{clinic_id}/doctors", tags=["Doctors"])

@router.post("", response_model=DoctorOut, status_code=201)
async def create_doctor(clinic_id: str, data: DoctorCreate, current_user=Depends(require_roles("super_admin", "clinic_admin"))):
    doc = await DoctorService().create_doctor(clinic_id, data)
    try:
        from app.modules.audit.service import log_event
        await log_event(
            clinic_id=clinic_id,
            event_type="doctor.created",
            actor_user_id=current_user.id,
            actor_email=current_user.email,
            target_id=doc.id,
            target_type="doctor",
            metadata={"name": doc.name, "specialization": doc.specialization}
        )
    except Exception:
        pass
    return doc

@router.get("", response_model=list[DoctorOut])
async def list_doctors(clinic_id: str, department_id: Optional[str] = None, _=Depends(get_current_user)):
    return await DoctorService().list_doctors(clinic_id, department_id)

@router.get("/{doctor_id}", response_model=DoctorOut)
async def get_doctor(clinic_id: str, doctor_id: str, _=Depends(get_current_user)):
    return await DoctorService().get_doctor(clinic_id, doctor_id)

@router.patch("/{doctor_id}", response_model=DoctorOut)
async def update_doctor(clinic_id: str, doctor_id: str, data: DoctorUpdate, current_user=Depends(require_roles("super_admin", "clinic_admin"))):
    updated = await DoctorService().update_doctor(clinic_id, doctor_id, data)
    try:
        from app.modules.audit.service import log_event
        await log_event(
            clinic_id=clinic_id,
            event_type="doctor.updated",
            actor_user_id=current_user.id,
            actor_email=current_user.email,
            target_id=doctor_id,
            target_type="doctor",
            metadata={"name": updated.name}
        )
    except Exception:
        pass
    return updated

@router.delete("/{doctor_id}")
async def deactivate_doctor(clinic_id: str, doctor_id: str, current_user=Depends(require_roles("super_admin", "clinic_admin"))):
    await DoctorService().deactivate_doctor(clinic_id, doctor_id)
    try:
        from app.modules.audit.service import log_event
        await log_event(
            clinic_id=clinic_id,
            event_type="doctor.deactivated",
            actor_user_id=current_user.id,
            actor_email=current_user.email,
            target_id=doctor_id,
            target_type="doctor"
        )
    except Exception:
        pass
    return {"message": "Doctor deactivated"}
