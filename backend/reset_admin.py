"""
Run this script to reset/create the super admin user.
Usage: python reset_admin.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import bcrypt

MONGODB_URL = "mongodb+srv://user_gokul:Lfg0bsxrzs3njKeA@cluster0.uurxkmz.mongodb.net/carequeue"
DB_NAME = "carequeue"

EMAIL = "admin@gmail.com"
PASSWORD = "Admin@123"
FULL_NAME = "Super Admin"

async def reset():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]

    hashed = bcrypt.hashpw(PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    result = await db["users"].update_one(
        {"email": EMAIL},
        {"$set": {
            "email": EMAIL,
            "hashed_password": hashed,
            "full_name": FULL_NAME,
            "role": "super_admin",
            "clinic_id": None,
            "is_active": True,
            "updated_at": datetime.now(timezone.utc),
        }, "$setOnInsert": {
            "created_at": datetime.now(timezone.utc),
        }},
        upsert=True,
    )

    if result.upserted_id:
        print(f"✓ Super admin CREATED")
    else:
        print(f"✓ Super admin password RESET")

    print(f"  Email    : {EMAIL}")
    print(f"  Password : {PASSWORD}")
    print(f"  Role     : super_admin")
    client.close()

asyncio.run(reset())
