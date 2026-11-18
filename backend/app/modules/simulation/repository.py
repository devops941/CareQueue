from datetime import datetime, timezone
from app.modules.tenant_repository import TenantRepository

class SimConfigRepository(TenantRepository):
    def __init__(self):
        super().__init__("simulation_configs")

    async def create(self, clinic_id: str, data: dict) -> str:
        data["clinic_id"] = clinic_id
        data["created_at"] = datetime.now(timezone.utc)
        return await self.insert_one(data)

class SimResultRepository(TenantRepository):
    def __init__(self):
        super().__init__("simulation_results")

    async def create(self, clinic_id: str, data: dict) -> str:
        data["clinic_id"] = clinic_id
        data["computed_at"] = datetime.now(timezone.utc)
        return await self.insert_one(data)
