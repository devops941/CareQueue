from fastapi import HTTPException
from bson import ObjectId
from datetime import datetime, timezone
from app.modules.departments.schemas import DepartmentCreate, DepartmentOut, DepartmentUpdate
from app.modules.departments.repository import DepartmentRepository

class DepartmentService:
    def __init__(self):
        self.repo = DepartmentRepository()

    def _to_out(self, doc: dict) -> DepartmentOut:
        return DepartmentOut(**doc)

    async def create_department(self, clinic_id: str, data: DepartmentCreate) -> DepartmentOut:
        doc = data.model_dump()
        dept_id = await self.repo.create_department(clinic_id, doc)
        created = await self.repo.find_one({"_id": ObjectId(dept_id)}, clinic_id)
        return self._to_out(created)

    async def list_departments(self, clinic_id: str) -> list[DepartmentOut]:
        docs = await self.repo.find_many({"is_active": True}, clinic_id=clinic_id)
        return [self._to_out(d) for d in docs]

    async def get_department(self, clinic_id: str, dept_id: str) -> DepartmentOut:
        doc = await self.repo.find_one({"_id": ObjectId(dept_id)}, clinic_id)
        if not doc:
            raise HTTPException(404, "Department not found")
        return self._to_out(doc)

    async def update_department(self, clinic_id: str, dept_id: str, data: DepartmentUpdate) -> DepartmentOut:
        update_data = data.model_dump(exclude_none=True)
        update_data["updated_at"] = datetime.now(timezone.utc)
        await self.repo.update_one({"_id": ObjectId(dept_id)}, update_data, clinic_id)
        return await self.get_department(clinic_id, dept_id)

    async def deactivate_department(self, clinic_id: str, dept_id: str) -> bool:
        return await self.repo.update_one({"_id": ObjectId(dept_id)}, {"is_active": False}, clinic_id)
