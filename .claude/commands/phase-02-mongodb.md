# Phase 02 — MongoDB & Repository Base

You are implementing Phase 02 of CareQueue: **MongoDB Collections & Repository Pattern**.

## Project Context
CareQueue backend uses: FastAPI + Motor (async MongoDB) + Pydantic v2.
Architecture: Router → Schema → Controller → Service → Repository → MongoDB
**Controllers never query MongoDB directly — always go through Repository layer.**

## Your Task

### 1. MongoDB Collection Definitions (`backend/app/core/database.py`)
Add collection constants and ensure indexes are created on startup:

Collections needed:
- `users` — authentication and roles
- `clinics` — tenant/clinic records
- `departments` — department config per clinic
- `doctors` — resource/doctor records
- `visits` — patient visit operational events
- `datasets` — uploaded dataset metadata
- `dataset_rows` — raw imported rows (staging)
- `analytics_results` — computed analytics cache
- `simulation_configs` — simulation scenario configs
- `simulation_results` — simulation run results
- `audit_logs` — append-only audit trail
- `jobs` — async background job status

### 2. Base Repository Class (`backend/app/modules/base_repository.py`)
Create a generic async repository base class:
```python
class BaseRepository:
    def __init__(self, collection_name: str)
    async def find_one(self, filter: dict) -> dict | None
    async def find_many(self, filter: dict, skip: int = 0, limit: int = 100) -> list[dict]
    async def insert_one(self, document: dict) -> str  # returns inserted_id as str
    async def update_one(self, filter: dict, update: dict) -> bool
    async def delete_one(self, filter: dict) -> bool
    async def count(self, filter: dict) -> int
```
All methods must be async. Use Motor's `AsyncIOMotorDatabase`.

### 3. Tenant-Scoped Repository (`backend/app/modules/tenant_repository.py`)
Extend BaseRepository with clinic_id enforcement:
```python
class TenantRepository(BaseRepository):
    def _enforce_tenant(self, filter: dict, clinic_id: str) -> dict
        # Always inject {"clinic_id": clinic_id} into every filter
    # Override find_one, find_many, update_one, delete_one to require clinic_id param
```
This is the **security core** — no cross-tenant data leaks possible.

### 4. Startup Index Creation (`backend/app/core/database.py`)
Add `create_indexes()` async function called on app startup:

Indexes to create:
- `users`: unique on `email`
- `clinics`: unique on `slug`
- `visits`: compound on `(clinic_id, arrival_time)`, compound on `(clinic_id, doctor_id)`
- `dataset_rows`: compound on `(dataset_id, row_number)`
- `audit_logs`: compound on `(clinic_id, created_at)` — no delete index (append-only)
- `jobs`: compound on `(clinic_id, status, created_at)`

### 5. Pydantic Base Schemas (`backend/app/modules/base_schemas.py`)
```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class PyObjectId(str): ...  # MongoDB ObjectId as string validator

class TimestampedModel(BaseModel):
    created_at: datetime
    updated_at: datetime

class APIResponse(BaseModel):
    success: bool
    data: Optional[dict | list] = None
    error: Optional[str] = None
    meta: Optional[dict] = None  # pagination info
```

### 6. Wire Startup in `main.py`
In `app/main.py`:
- On startup event: connect Motor client, call `create_indexes()`
- On shutdown event: close Motor client
- Add `/api/v1/health` to also check MongoDB ping and return `{"status": "ok", "db": "connected"}`

## Exit Gates
- [ ] All 12 collections defined
- [ ] `BaseRepository` has all 6 async methods
- [ ] `TenantRepository` enforces `clinic_id` in every query
- [ ] Indexes created on startup
- [ ] `PyObjectId`, `TimestampedModel`, `APIResponse` schemas exist
- [ ] `main.py` startup/shutdown hooks connect/disconnect MongoDB
