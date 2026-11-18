from typing import Optional
from app.modules.base_repository import BaseRepository


class TenantRepository(BaseRepository):
    def _enforce_tenant(self, filter: dict, clinic_id: str) -> dict:
        return {**filter, "clinic_id": clinic_id}

    async def find_one(self, filter: dict, clinic_id: Optional[str] = None) -> Optional[dict]:
        if clinic_id:
            filter = self._enforce_tenant(filter, clinic_id)
        return await super().find_one(filter)

    async def find_many(
        self,
        filter: dict,
        clinic_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
        sort: Optional[list] = None,
    ) -> list[dict]:
        if clinic_id:
            filter = self._enforce_tenant(filter, clinic_id)
        return await super().find_many(filter, skip=skip, limit=limit, sort=sort)

    async def update_one(
        self, filter: dict, update: dict, clinic_id: Optional[str] = None
    ) -> bool:
        if clinic_id:
            filter = self._enforce_tenant(filter, clinic_id)
        return await super().update_one(filter, update)

    async def delete_one(
        self, filter: dict, clinic_id: Optional[str] = None
    ) -> bool:
        if clinic_id:
            filter = self._enforce_tenant(filter, clinic_id)
        return await super().delete_one(filter)

    async def count(self, filter: dict, clinic_id: Optional[str] = None) -> int:
        if clinic_id:
            filter = self._enforce_tenant(filter, clinic_id)
        return await super().count(filter)
