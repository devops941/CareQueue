"""
Database Reset & Clean Utility for CareQueue
Clears all collections in MongoDB Atlas, resets clinic to initial un-onboarded state,
and ensures Super Admin is ready for fresh login and hospital onboarding wizard.
Usage: python backend/clear_db.py
"""
import asyncio
import os
from datetime import datetime, timezone
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL = os.getenv(
    "MONGODB_URL",
    "mongodb+srv://user_gokul:Lfg0bsxrzs3njKeA@cluster0.uurxkmz.mongodb.net/carequeue"
)
DB_NAME = os.getenv("DB_NAME", "carequeue")

SUPER_ADMIN_EMAIL = "admin@gmail.com"
SUPER_ADMIN_PASSWORD = "Admin@123"

async def clear_database():
    print(f"Connecting to MongoDB Atlas [{DB_NAME}]...")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]

    # List of operational collections to wipe completely
    collections_to_wipe = [
        "visits",
        "datasets",
        "dataset_rows",
        "simulation_configs",
        "simulation_results",
        "analytics_results",
        "audit_logs",
        "jobs",
        "clinic_settings",
        "doctors",
        "departments",
    ]

    print("\n--- Clearing Operational Data Collections ---")
    for col in collections_to_wipe:
        try:
            res = await db[col].delete_many({})
            print(f"  ✓ {col.ljust(20)}: {res.deleted_count} records deleted")
        except Exception as e:
            print(f"  ✗ {col.ljust(20)}: Error {e}")

    # Reset clinics: create single un-onboarded baseline facility
    print("\n--- Resetting Facility Profile ---")
    await db["clinics"].delete_many({})
    clinic_doc = {
        "name": "CareQueue City General Clinic",
        "slug": "city-general",
        "timezone": "Asia/Kolkata",
        "contact_email": SUPER_ADMIN_EMAIL,
        "address": "124 Healthcare Boulevard, Chennai",
        "is_active": True,
        "is_onboarded": False,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    clinic_res = await db["clinics"].insert_one(clinic_doc)
    clinic_id = str(clinic_res.inserted_id)
    print(f"  ✓ Baseline Clinic Created: {clinic_id} (is_onboarded = False)")

    # Reset users: Super admin with is_onboarded = False
    print("\n--- Resetting Super Admin Credentials ---")
    await db["users"].delete_many({})
    hashed = bcrypt.hashpw(SUPER_ADMIN_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user_doc = {
        "email": SUPER_ADMIN_EMAIL,
        "hashed_password": hashed,
        "full_name": "Super Admin",
        "role": "super_admin",
        "clinic_id": clinic_id,
        "is_active": True,
        "is_onboarded": False,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    await db["users"].insert_one(user_doc)
    print(f"  ✓ Super Admin Initialized : {SUPER_ADMIN_EMAIL}")
    print(f"  ✓ Password                 : {SUPER_ADMIN_PASSWORD}")
    print(f"  ✓ Status                   : is_onboarded = False (Direct to Onboarding Wizard)")

    print("\n=======================================================")
    print(" CareQueue Database Cleared & Initialized Successfully!")
    print("=======================================================")
    client.close()

if __name__ == "__main__":
    asyncio.run(clear_database())
