import sys
# Prevent Windows Application Control from blocking pyarrow DLL
sys.modules['pyarrow'] = None

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import connect_db, close_db, create_indexes
from app.core.seed import seed_super_admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    await create_indexes()
    await seed_super_admin()
    yield
    await close_db()

app = FastAPI(
    title="CareQueue API",
    description="Clinic Operations Intelligence Platform — ARRIVAL → QUEUE → SERVICE → INSIGHT",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:80"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth
from app.modules.auth.router import router as auth_router
app.include_router(auth_router)

# Clinics & Departments
from app.modules.clinics.router import router as clinics_router
from app.modules.departments.router import router as departments_router
app.include_router(clinics_router)
app.include_router(departments_router)

# Doctors
from app.modules.doctors.router import router as doctors_router
app.include_router(doctors_router)

# Visits
from app.modules.visits.router import router as visits_router
app.include_router(visits_router)

# Datasets & Data Quality
from app.modules.datasets.router import router as datasets_router
from app.modules.data_quality.router import router as quality_router
app.include_router(datasets_router)
app.include_router(quality_router)

# Analytics
from app.modules.analytics.historical.router import router as analytics_router
app.include_router(analytics_router)

# Simulation
from app.modules.simulation.router import router as simulation_router
app.include_router(simulation_router)

# Dashboard
from app.modules.dashboard.router import router as dashboard_router
app.include_router(dashboard_router)

# Reporting
from app.modules.reporting.router import router as reporting_router
app.include_router(reporting_router)

# Audit & Settings
from app.modules.audit.router import router as audit_router
from app.modules.settings.router import router as settings_router
app.include_router(audit_router)
app.include_router(settings_router)


@app.get("/api/v1/health")
async def health_check():
    from app.core.database import get_database
    try:
        db = get_database()
        await db.command("ping")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    return {"status": "ok", "version": "1.0.0", "db": db_status}
