from fastapi import HTTPException
from bson import ObjectId
from datetime import datetime, timezone
from app.modules.visits.schemas import VisitCreate, VisitOut, VisitUpdate
from app.modules.visits.repository import VisitRepository
from app.domain.waiting_times import compute_waiting_times

class VisitService:
    def __init__(self):
        self.repo = VisitRepository()

    def _to_out(self, doc: dict) -> VisitOut:
        enriched = compute_waiting_times(doc)
        return VisitOut(**enriched)

    async def create_visit(self, clinic_id: str, data: VisitCreate) -> VisitOut:
        doc = data.model_dump()
        visit_id = await self.repo.create_visit(clinic_id, doc)
        created = await self.repo.find_one({"_id": ObjectId(visit_id)}, clinic_id)
        return self._to_out(created)

    async def get_visit(self, clinic_id: str, visit_id: str) -> VisitOut:
        doc = await self.repo.find_one({"_id": ObjectId(visit_id)}, clinic_id)
        if not doc:
            raise HTTPException(404, "Visit not found")
        return self._to_out(doc)

    async def list_visits(self, clinic_id: str, page: int = 1, page_size: int = 50, **filters) -> dict:
        query_filter = {"excluded": {"$ne": True}}
        if filters.get("department_id"): query_filter["department_id"] = filters["department_id"]
        if filters.get("doctor_id"): query_filter["doctor_id"] = filters["doctor_id"]
        if filters.get("visit_type"): query_filter["visit_type"] = filters["visit_type"]

        skip = (page - 1) * page_size
        docs = await self.repo.find_many(query_filter, clinic_id=clinic_id, skip=skip, limit=page_size, sort=[("arrival_time", -1)])
        total = await self.repo.count(query_filter, clinic_id=clinic_id)
        return {
            "items": [self._to_out(d) for d in docs],
            "total": total, "page": page, "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }

    async def update_visit(self, clinic_id: str, visit_id: str, data: VisitUpdate) -> VisitOut:
        update_data = data.model_dump(exclude_none=True)
        update_data["updated_at"] = datetime.now(timezone.utc)
        await self.repo.update_one({"_id": ObjectId(visit_id)}, update_data, clinic_id)
        return await self.get_visit(clinic_id, visit_id)

    async def delete_visit(self, clinic_id: str, visit_id: str) -> bool:
        return await self.repo.delete_one({"_id": ObjectId(visit_id)}, clinic_id)
