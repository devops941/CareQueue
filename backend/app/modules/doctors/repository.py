from datetime import datetime, timezone
from app.modules.tenant_repository import TenantRepository

class DoctorRepository(TenantRepository):
    def __init__(self):
        super().__init__("doctors")

    async def create_doctor(self, clinic_id: str, data: dict) -> str:
        data["clinic_id"] = clinic_id
        data["is_active"] = True
        data["created_at"] = datetime.now(timezone.utc)
        data["updated_at"] = datetime.now(timezone.utc)
        return await self.insert_one(data)
