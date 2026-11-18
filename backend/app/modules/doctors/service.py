from fastapi import HTTPException
from bson import ObjectId
from datetime import datetime, timezone
from app.modules.doctors.schemas import DoctorCreate, DoctorOut, DoctorUpdate
from app.modules.doctors.repository import DoctorRepository

class DoctorService:
    def __init__(self):
        self.repo = DoctorRepository()

    def _to_out(self, doc: dict) -> DoctorOut:
        return DoctorOut(**doc)

    async def create_doctor(self, clinic_id: str, data: DoctorCreate) -> DoctorOut:
        doc = data.model_dump()
        doctor_id = await self.repo.create_doctor(clinic_id, doc)
        created = await self.repo.find_one({"_id": ObjectId(doctor_id)}, clinic_id)
        return self._to_out(created)

    async def list_doctors(self, clinic_id: str, department_id: str = None) -> list[DoctorOut]:
        f = {"is_active": True}
        if department_id:
            f["department_id"] = department_id
        docs = await self.repo.find_many(f, clinic_id=clinic_id)
        return [self._to_out(d) for d in docs]

    async def get_doctor(self, clinic_id: str, doctor_id: str) -> DoctorOut:
        doc = await self.repo.find_one({"_id": ObjectId(doctor_id)}, clinic_id)
        if not doc:
            raise HTTPException(404, "Doctor not found")
        return self._to_out(doc)

    async def update_doctor(self, clinic_id: str, doctor_id: str, data: DoctorUpdate) -> DoctorOut:
        update_data = data.model_dump(exclude_none=True)
        update_data["updated_at"] = datetime.now(timezone.utc)
        await self.repo.update_one({"_id": ObjectId(doctor_id)}, update_data, clinic_id)
        return await self.get_doctor(clinic_id, doctor_id)

    async def deactivate_doctor(self, clinic_id: str, doctor_id: str) -> bool:
        return await self.repo.update_one({"_id": ObjectId(doctor_id)}, {"is_active": False}, clinic_id)
