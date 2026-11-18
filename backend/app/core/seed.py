from datetime import datetime, timezone
from app.core.security import hash_password
from app.core.database import get_database

SUPER_ADMIN = {
    "email": "admin@gmail.com",
    "password": "Admin@123",
    "full_name": "Super Admin",
    "role": "super_admin",
}

async def seed_super_admin():
    db = get_database()

    # 1. Seed or find default clinic
    clinic = await db["clinics"].find_one({"slug": "city-general"})
    clinic_id = None
    if not clinic:
        res = await db["clinics"].insert_one({
            "name": "CareQueue City General Clinic",
            "slug": "city-general",
            "timezone": "Asia/Kolkata",
            "working_hours": {
                "monday": {"open": "08:00", "close": "18:00", "is_open": True},
                "tuesday": {"open": "08:00", "close": "18:00", "is_open": True},
                "wednesday": {"open": "08:00", "close": "18:00", "is_open": True},
                "thursday": {"open": "08:00", "close": "18:00", "is_open": True},
                "friday": {"open": "08:00", "close": "18:00", "is_open": True},
                "saturday": {"open": "08:00", "close": "14:00", "is_open": True},
                "sunday": {"open": "00:00", "close": "00:00", "is_open": False},
            },
            "contact_email": "admin@gmail.com",
            "address": "124 Healthcare Boulevard, Chennai",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })
        clinic_id = str(res.inserted_id)
        print(f"[SEED] ✓ Default demo clinic created: CareQueue City General Clinic ({clinic_id})")

        # Seed sample departments
        dept_ids = []
        for d_name, d_code, d_time in [
            ("General Medicine", "GEN", 15),
            ("Pediatrics", "PED", 20),
            ("Cardiology", "CARD", 25),
        ]:
            d_res = await db["departments"].insert_one({
                "clinic_id": clinic_id,
                "name": d_name,
                "code": d_code,
                "service_type": "consultation",
                "avg_service_time_minutes": d_time,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            })
            dept_ids.append((str(d_res.inserted_id), d_name))

        # Seed sample doctors
        for doc_name, spec, d_idx in [
            ("Dr. Rajesh Sharma, MD", "General Medicine", 0),
            ("Dr. Priya Anbarasan, MD", "Pediatrics", 1),
            ("Dr. Arvind Swaminathan, DM", "Cardiology", 2),
        ]:
            await db["doctors"].insert_one({
                "clinic_id": clinic_id,
                "department_id": dept_ids[d_idx][0],
                "full_name": doc_name,
                "specialization": spec,
                "avg_consultation_minutes": 15,
                "is_active": True,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            })
    else:
        clinic_id = str(clinic["_id"])

    # 2. Seed or update super admin
    existing = await db["users"].find_one({"email": SUPER_ADMIN["email"]})
    hashed = hash_password(SUPER_ADMIN["password"])

    if existing:
        await db["users"].update_one(
            {"email": SUPER_ADMIN["email"]},
            {"$set": {
                "hashed_password": hashed,
                "clinic_id": clinic_id,
                "is_active": True,
                "updated_at": datetime.now(timezone.utc),
            }}
        )
        print(f"[SEED] ✓ Super admin refreshed → {SUPER_ADMIN['email']} (Clinic: {clinic_id})")
        return

    await db["users"].insert_one({
        "email": SUPER_ADMIN["email"],
        "hashed_password": hashed,
        "full_name": SUPER_ADMIN["full_name"],
        "role": SUPER_ADMIN["role"],
        "clinic_id": clinic_id,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    })
    print(f"[SEED] ✓ Super admin created → email: {SUPER_ADMIN['email']} | password: {SUPER_ADMIN['password']} (Clinic: {clinic_id})")
