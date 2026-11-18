from datetime import datetime, timezone
from app.modules.base_repository import BaseRepository

class AuditRepository(BaseRepository):
    def __init__(self):
        super().__init__("audit_logs")

    async def append(self, entry: dict) -> str:
        entry["created_at"] = datetime.now(timezone.utc)
        return await self.insert_one(entry)

    async def find_by_clinic(self, clinic_id: str, filters: dict = None, skip: int = 0, limit: int = 50) -> list:
        f = {"clinic_id": clinic_id}
        if filters:
            if filters.get("event_types"):
                f["event_type"] = {"$in": filters["event_types"]}
        return await self.find_many(f, skip=skip, limit=limit, sort=[("created_at", -1)])

    async def update_one(self, *args, **kwargs):
        raise NotImplementedError("Audit log is append-only")

    async def delete_one(self, *args, **kwargs):
        raise NotImplementedError("Audit log is append-only")
