from datetime import datetime, timezone
from app.modules.tenant_repository import TenantRepository

class DatasetRepository(TenantRepository):
    def __init__(self):
        super().__init__("datasets")

    async def create_dataset(self, clinic_id: str, data: dict) -> str:
        data["clinic_id"] = clinic_id
        data["created_at"] = datetime.now(timezone.utc)
        return await self.insert_one(data)

class DatasetRowRepository(TenantRepository):
    def __init__(self):
        super().__init__("dataset_rows")

    async def insert_rows(self, rows: list[dict]) -> int:
        from app.core.database import get_database
        if not rows:
            return 0
        result = await get_database()["dataset_rows"].insert_many(rows)
        return len(result.inserted_ids)

    async def find_by_dataset(self, dataset_id: str, limit: int = 10000) -> list[dict]:
        from app.core.database import get_database
        cursor = get_database()["dataset_rows"].find({"dataset_id": dataset_id}).limit(limit)
        docs = await cursor.to_list(length=limit)
        for d in docs:
            if "_id" in d:
                d["id"] = str(d.pop("_id"))
        return docs
