from typing import Optional
from datetime import datetime, timezone
from app.modules.base_repository import BaseRepository


class UserRepository(BaseRepository):
    def __init__(self):
        super().__init__("users")

    async def find_by_email(self, email: str) -> Optional[dict]:
        return await self.find_one({"email": email.lower()})

    async def find_by_id(self, user_id: str) -> Optional[dict]:
        from bson import ObjectId
        try:
            return await self.find_one({"_id": ObjectId(user_id)})
        except Exception:
            return None

    async def create_user(self, data: dict) -> str:
        data["email"] = data["email"].lower()
        data["is_active"] = True
        data["created_at"] = datetime.now(timezone.utc)
        data["updated_at"] = datetime.now(timezone.utc)
        return await self.insert_one(data)

    async def find_by_clinic(self, clinic_id: str) -> list[dict]:
        return await self.find_many({"clinic_id": clinic_id})

    async def deactivate(self, user_id: str) -> bool:
        from bson import ObjectId
        return await self.update_one(
            {"_id": ObjectId(user_id)},
            {"is_active": False, "updated_at": datetime.now(timezone.utc)},
        )
