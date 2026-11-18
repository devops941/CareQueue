from datetime import datetime, timezone, date
from typing import Optional
from app.modules.tenant_repository import TenantRepository

class VisitRepository(TenantRepository):
    def __init__(self):
        super().__init__("visits")

    async def create_visit(self, clinic_id: str, data: dict) -> str:
        data["clinic_id"] = clinic_id
        data["excluded"] = False
        data["created_at"] = datetime.now(timezone.utc)
        data["updated_at"] = datetime.now(timezone.utc)
        return await self.insert_one(data)

    async def find_by_date_range(self, clinic_id: str, start: datetime, end: datetime, filters: dict = None) -> list[dict]:
        f = {"clinic_id": clinic_id, "excluded": {"$ne": True}, "arrival_time": {"$gte": start, "$lte": end}}
        if filters:
            f.update(filters)
        return await self.find_many(f, clinic_id=None, limit=10000, sort=[("arrival_time", 1)])

    async def bulk_insert(self, clinic_id: str, visits: list[dict]) -> int:
        from app.core.database import get_database
        for v in visits:
            v["clinic_id"] = clinic_id
            v["excluded"] = False
            v["created_at"] = datetime.now(timezone.utc)
        result = await get_database()["visits"].insert_many(visits)
        return len(result.inserted_ids)
