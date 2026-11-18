from datetime import datetime, timezone
from app.modules.base_repository import BaseRepository

class ClinicRepository(BaseRepository):
    def __init__(self):
        super().__init__("clinics")

    async def find_by_slug(self, slug: str):
        return await self.find_one({"slug": slug})

    async def create_clinic(self, data: dict) -> str:
        data["is_active"] = True
        data["created_at"] = datetime.now(timezone.utc)
        data["updated_at"] = datetime.now(timezone.utc)
        return await self.insert_one(data)

    async def update_clinic(self, clinic_id: str, data: dict) -> bool:
        from bson import ObjectId
        data["updated_at"] = datetime.now(timezone.utc)
        return await self.update_one({"_id": ObjectId(clinic_id)}, data)
