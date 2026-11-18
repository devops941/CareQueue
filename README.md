# CareQueue — Clinic Operations Intelligence Platform

> ARRIVAL → QUEUE → SERVICE → INSIGHT

CareQueue converts operational timestamps into trustworthy waiting-time measures, reveals where queues form, and lets clinic managers test alternative staffing and arrival scenarios in a controlled simulation environment.

## Tech Stack
- **Backend**: FastAPI + Motor (async MongoDB) + Pydantic v2
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Database**: MongoDB (Atlas or local)
- **Analytics**: Pandas + NumPy + SciPy
- **Simulation**: SimPy (discrete-event)
- **Deployment**: Docker + Docker Compose

## Quick Start (Development)

```bash
# 1. Backend
cd backend
cp .env.example .env   # edit MONGODB_URL, SECRET_KEY
pip install -r requirements.txt
uvicorn app.main:app --reload

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Production Deploy
```bash
docker-compose up -d
```

## Implementation Phases
18 phases — use slash commands `/phase-01-foundation` through `/phase-18-qa-deployment` to implement each phase.



cd backend
python -m uvicorn app.main:app --reload --port 8000



cd frontend
npm run dev