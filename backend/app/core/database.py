from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

_client: AsyncIOMotorClient | None = None
_database: AsyncIOMotorDatabase | None = None

async def connect_db():
    global _client, _database
    _client = AsyncIOMotorClient(settings.MONGODB_URL)
    _database = _client[settings.DB_NAME]

async def close_db():
    global _client
    if _client:
        _client.close()

def get_database() -> AsyncIOMotorDatabase:
    if _database is None:
        raise RuntimeError("Database not connected. Call connect_db() first.")
    return _database

async def create_indexes():
    db = get_database()
    # Users
    await db["users"].create_index("email", unique=True)
    # Clinics
    await db["clinics"].create_index("slug", unique=True)
    # Visits
    await db["visits"].create_index([("clinic_id", 1), ("arrival_time", -1)])
    await db["visits"].create_index([("clinic_id", 1), ("doctor_id", 1)])
    await db["visits"].create_index([("clinic_id", 1), ("department_id", 1)])
    await db["visits"].create_index([("clinic_id", 1), ("visit_date", -1)])
    # Datasets
    await db["dataset_rows"].create_index([("dataset_id", 1), ("row_number", 1)])
    await db["datasets"].create_index([("clinic_id", 1), ("file_hash", 1)])
    # Analytics
    await db["analytics_results"].create_index([("clinic_id", 1), ("created_at", -1)])
    # Simulation
    await db["simulation_configs"].create_index([("clinic_id", 1)])
    await db["simulation_results"].create_index([("clinic_id", 1), ("config_id", 1)])
    # Audit
    await db["audit_logs"].create_index([("clinic_id", 1), ("created_at", -1)])
    # Jobs
    await db["jobs"].create_index([("clinic_id", 1), ("status", 1), ("created_at", -1)])
    # Departments & Doctors
    await db["departments"].create_index([("clinic_id", 1)])
    await db["doctors"].create_index([("clinic_id", 1), ("department_id", 1)])

COLLECTIONS = [
    "users", "clinics", "departments", "doctors",
    "visits", "datasets", "dataset_rows",
    "analytics_results", "simulation_configs", "simulation_results",
    "audit_logs", "jobs",
]
