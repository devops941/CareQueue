# CareQueue — Deployment Checklist

## MongoDB Atlas
- Cluster: Cluster0
- Database: carequeue
- Connection: mongodb+srv://user_gokul:***@cluster0.uurxkmz.mongodb.net/carequeue

## Development Start

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:5173

## First-Time Setup
1. Register super_admin:
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@carequeue.in","password":"Admin@1234","full_name":"Admin","role":"super_admin"}'
```
Wait - register requires auth. Bootstrap with direct DB insert or use the seed script.

2. Login:
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@carequeue.in","password":"Admin@1234"}'
```

3. Create Clinic:
```bash
curl -X POST http://localhost:8000/api/v1/clinics \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Clinic","slug":"my-clinic","timezone":"Asia/Kolkata","contact_email":"clinic@example.com"}'
```

## Production Deploy
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Health Check
```bash
curl http://localhost:8000/api/v1/health
```
Expected: `{"status":"ok","version":"1.0.0","db":"connected"}`

## Phase Completion
- [x] Phase 01: Foundation
- [x] Phase 02: MongoDB Repository
- [x] Phase 03: Authentication & RBAC
- [x] Phase 04: Design System & App Shell
- [x] Phase 05: Clinic & Department Config
- [x] Phase 06: Doctor Management
- [x] Phase 07: Visit Records
- [x] Phase 08: Dataset Import
- [x] Phase 09: Data Quality
- [x] Phase 10: Waiting-Time Analytics Engine
- [x] Phase 11: Statistical Analytics
- [x] Phase 12: Time-Slot & Heatmaps
- [x] Phase 13: SimPy Queue Simulation
- [x] Phase 14: Async Jobs & Scenarios
- [x] Phase 15: Dashboard & Insights
- [x] Phase 16: Reporting & CSV Exports
- [x] Phase 17: Audit Logs & Settings
- [x] Phase 18: QA & Deployment
