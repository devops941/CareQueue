"""
Seed Clinical Specializations & Doctors Roster for CareQueue
Populates primary hospital departments and active medical staff roster.
Usage: python backend/seed_clinic_master_data.py
"""
import asyncio
import os
from datetime import datetime, timezone
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL = os.getenv(
    "MONGODB_URL",
    "mongodb+srv://user_gokul:Lfg0bsxrzs3njKeA@cluster0.uurxkmz.mongodb.net/carequeue"
)
DB_NAME = os.getenv("DB_NAME", "carequeue")

async def seed_master_data():
    print(f"Connecting to MongoDB Atlas [{DB_NAME}]...")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]

    # Find the active clinic
    clinic = await db["clinics"].find_one({"is_active": True})
    if not clinic:
        print("Error: No active clinic found. Please run clear_db.py or create a clinic first.")
        client.close()
        return

    clinic_id = str(clinic["_id"])
    print(f"Active Clinic: {clinic.get('name')} ({clinic_id})")

    # 1. Seed Specializations (Clinical Departments)
    print("\n--- Seeding Specializations / Clinical Departments ---")
    departments_to_seed = [
        {
            "name": "General Medicine",
            "code": "GEN",
            "service_type": "consultation",
            "avg_service_time_minutes": 15.0,
            "max_concurrent_patients": 2,
            "description": "Primary healthcare, outpatient diagnosis, routine physicals, and preventative medicine",
        },
        {
            "name": "Pediatrics",
            "code": "PED",
            "service_type": "consultation",
            "avg_service_time_minutes": 20.0,
            "max_concurrent_patients": 2,
            "description": "Comprehensive child healthcare, neonatal monitoring, infant vaccinations, and growth assessment",
        },
        {
            "name": "Cardiology",
            "code": "CARD",
            "service_type": "consultation",
            "avg_service_time_minutes": 25.0,
            "max_concurrent_patients": 1,
            "description": "Cardiovascular wellness, ECG / echocardiogram evaluation, lipid profiles, and hypertension care",
        },
        {
            "name": "Orthopedics",
            "code": "ORTHO",
            "service_type": "consultation",
            "avg_service_time_minutes": 20.0,
            "max_concurrent_patients": 2,
            "description": "Musculoskeletal injury treatment, joint mobility rehabilitation, fracture stabilization, and arthritis care",
        },
    ]

    dept_id_map = {}
    for d in departments_to_seed:
        existing = await db["departments"].find_one({"clinic_id": clinic_id, "name": d["name"]})
        if not existing:
            d_doc = {
                **d,
                "clinic_id": clinic_id,
                "is_active": True,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
            res = await db["departments"].insert_one(d_doc)
            dept_id_map[d["name"]] = str(res.inserted_id)
            print(f"  ✓ Created Department : {d['name']} ({d['code']}) → ID: {res.inserted_id}")
        else:
            dept_id_map[d["name"]] = str(existing["_id"])
            print(f"  • Existing Department: {d['name']} ({d['code']}) → ID: {existing['_id']}")

    # 2. Seed Doctors Roster
    print("\n--- Seeding Doctors Staff Roster ---")
    doctors_to_seed = [
        {
            "full_name": "Dr. Rajesh Sharma, MD",
            "specialization": "General Medicine",
            "qualification": "MBBS, MD (General Medicine)",
            "employee_id": "MED-DOC-101",
            "license_number": "NMC-2016-89412",
            "room_number": "Cabin 101 (Ground Floor)",
            "phone": "+91 98401 23456",
            "email": "dr.rajesh@clinic.in",
            "shift_timing": "08:30 AM - 01:30 PM",
            "available_days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            "avg_consultation_minutes": 15.0,
            "max_patients_per_slot": 1,
        },
        {
            "full_name": "Dr. Priya Anbarasan, MD",
            "specialization": "Pediatrics",
            "qualification": "MBBS, MD (Pediatrics), DCH",
            "employee_id": "PED-DOC-102",
            "license_number": "NMC-2018-44210",
            "room_number": "Cabin 104 (1st Floor)",
            "phone": "+91 98402 34567",
            "email": "dr.priya@clinic.in",
            "shift_timing": "09:00 AM - 02:00 PM",
            "available_days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            "avg_consultation_minutes": 20.0,
            "max_patients_per_slot": 1,
        },
        {
            "full_name": "Dr. Arvind Swaminathan, DM",
            "specialization": "Cardiology",
            "qualification": "MBBS, MD, DM (Cardiology), FACC",
            "employee_id": "CARD-DOC-103",
            "license_number": "NMC-2012-73190",
            "room_number": "Cabin 202 (2nd Floor)",
            "phone": "+91 98403 45678",
            "email": "dr.arvind@clinic.in",
            "shift_timing": "10:00 AM - 03:00 PM",
            "available_days": ["Mon", "Tue", "Wed", "Thu", "Fri"],
            "avg_consultation_minutes": 25.0,
            "max_patients_per_slot": 1,
        },
        {
            "full_name": "Dr. Suresh Kumar, MS",
            "specialization": "Orthopedics",
            "qualification": "MBBS, MS (Orthopedics), MCh",
            "employee_id": "ORTH-DOC-104",
            "license_number": "NMC-2015-38291",
            "room_number": "Cabin 108 (Ground Floor)",
            "phone": "+91 98404 56789",
            "email": "dr.suresh@clinic.in",
            "shift_timing": "09:00 AM - 01:00 PM",
            "available_days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            "avg_consultation_minutes": 20.0,
            "max_patients_per_slot": 1,
        },
    ]

    for doc in doctors_to_seed:
        existing = await db["doctors"].find_one({"clinic_id": clinic_id, "full_name": doc["full_name"]})
        dept_id = dept_id_map.get(doc["specialization"]) or ""
        if not existing:
            doc_record = {
                **doc,
                "clinic_id": clinic_id,
                "department_id": dept_id,
                "is_active": True,
                "schedule": {
                    "monday": {"start": "09:00", "end": "17:00", "is_working": True},
                    "tuesday": {"start": "09:00", "end": "17:00", "is_working": True},
                    "wednesday": {"start": "09:00", "end": "17:00", "is_working": True},
                    "thursday": {"start": "09:00", "end": "17:00", "is_working": True},
                    "friday": {"start": "09:00", "end": "17:00", "is_working": True},
                    "saturday": {"start": "09:00", "end": "14:00", "is_working": True},
                    "sunday": {"start": "00:00", "end": "00:00", "is_working": False},
                },
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
            res = await db["doctors"].insert_one(doc_record)
            print(f"  ✓ Added Doctor : {doc['full_name']} ({doc['specialization']}) → Room: {doc['room_number']}")
        else:
            print(f"  • Existing Doctor: {doc['full_name']} ({doc['specialization']})")

    # Log audit event
    try:
        from app.modules.audit.service import log_event
        await log_event(
            clinic_id=clinic_id,
            event_type="clinic.configured",
            actor_user_id="user_admin",
            actor_email="admin@gmail.com",
            target_id=clinic_id,
            target_type="clinic",
            metadata={"departments_seeded": len(departments_to_seed), "doctors_seeded": len(doctors_to_seed)}
        )
    except Exception:
        pass

    print("\n=======================================================")
    print(" Specializations & Doctors Master Data Seeded Cleanly!")
    print("=======================================================")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_master_data())
