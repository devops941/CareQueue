from fastapi import HTTPException
from app.modules.clinics.schemas import ClinicCreate, ClinicOut, ClinicUpdate
from app.modules.clinics.repository import ClinicRepository
from bson import ObjectId

class ClinicService:
    def __init__(self):
        self.repo = ClinicRepository()

    def _to_out(self, doc: dict) -> ClinicOut:
        return ClinicOut(**doc)

    async def create_clinic(self, data: ClinicCreate) -> ClinicOut:
        existing = await self.repo.find_by_slug(data.slug)
        if existing:
            raise HTTPException(400, "Slug already taken")
        doc = data.model_dump()
        clinic_id = await self.repo.create_clinic(doc)
        created = await self.repo.find_one({"_id": ObjectId(clinic_id)})
        return self._to_out(created)

    async def get_clinic(self, clinic_id: str) -> ClinicOut:
        from bson import ObjectId
        doc = await self.repo.find_one({"_id": ObjectId(clinic_id)})
        if not doc:
            raise HTTPException(404, "Clinic not found")
        return self._to_out(doc)

    async def update_clinic(self, clinic_id: str, data: ClinicUpdate) -> ClinicOut:
        await self.repo.update_clinic(clinic_id, data.model_dump(exclude_none=True))
        return await self.get_clinic(clinic_id)

    async def list_clinics(self) -> list[ClinicOut]:
        docs = await self.repo.find_many({})
        return [self._to_out(d) for d in docs]
