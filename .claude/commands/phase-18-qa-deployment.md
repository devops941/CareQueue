# Phase 18 — QA, Hardening & Deployment

You are implementing Phase 18 of CareQueue: **Quality Assurance, Security Hardening & Production Deployment**.

## Project Context
This is the final phase. It covers:
- Comprehensive test suite
- Security hardening
- Performance optimizations
- Docker production build
- Deployment checklist

## Your Task

### 1. Backend Test Suite (`backend/tests/`)

Create comprehensive tests:

**`tests/conftest.py`**:
```python
# Pytest fixtures:
# - test_client: TestClient with real MongoDB (not mocked)
# - test_db: Motor test database (teardown after each test)
# - auth_headers: JWT headers for each role (admin, analyst, viewer)
# - sample_clinic: pre-created test clinic
# - sample_visits: 100 synthetic visit records
```

**`tests/test_auth.py`**:
- Test login with valid/invalid credentials
- Test JWT token expiry
- Test role-based access (analyst cannot access clinic_admin routes)
- Test cross-clinic access returns 403

**`tests/test_visits.py`**:
- Test chronological validation rejects out-of-order timestamps
- Test waiting time computation accuracy
- Test pagination on list endpoint
- Test filters (date range, department, doctor)

**`tests/test_analytics.py`**:
- Test percentile calculations against known values
- Test source="historical" on all analytics responses
- Test excluded visits are not counted
- Test time-slot bucketing (60-min slots)

**`tests/test_simulation.py`**:
- Test determinism: same seed = same result
- Test source="simulation" on all simulation responses
- Test replications produce CI bounds
- Test simulation never modifies visits collection

**`tests/test_data_import.py`**:
- Test CSV import end-to-end
- Test idempotency (re-import same file returns error)
- Test invalid rows are rejected, valid rows committed
- Test timezone conversion

**`tests/test_tenant_isolation.py`**:
Critical security tests:
- Create two clinics (A and B) with separate admin users
- Verify Clinic A admin CANNOT read Clinic B's visits
- Verify Clinic A admin CANNOT run analytics on Clinic B's data
- Verify URL manipulation (changing clinic_id in URL) returns 403

### 2. Security Hardening

**Rate Limiting** (`backend/app/core/middleware.py`):
- Add `slowapi` rate limiter:
  - Auth endpoints: 10 req/min per IP
  - Analytics endpoints: 30 req/min per user
  - Import endpoints: 5 req/min per user

Add `slowapi` to `requirements.txt`.

**Security Headers** (`backend/app/main.py`):
Add middleware to set:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

**Input Validation**:
- Verify all Pydantic models use `max_length` constraints on string fields
- Verify file upload validates MIME type (only CSV/XLSX)
- Verify no raw SQL or MongoDB injection possible (Motor parameterizes by default)

**Secrets Check**: Verify `.env.example` has no real secrets. Verify `SECRET_KEY` is never hardcoded.

### 3. Performance Optimizations

**Backend Optimizations**:
- Add response caching for dashboard summary (5-minute TTL using simple in-memory dict cache)
- Add `asyncio.gather()` for parallel MongoDB queries where independent
- Verify all MongoDB queries use indexes (run `explain()` on slow paths in development)

**Frontend Optimizations**:
- Add `React.lazy()` and `Suspense` for all page components
- Add `useMemo` for expensive chart data transformations
- Verify TanStack Query `staleTime` is set appropriately (dashboard: 5min, analytics: 10min)

**`frontend/src/app/App.tsx`** — wrap routes with Suspense:
```tsx
const DashboardPage = React.lazy(() => import('../modules/overview/DashboardPage'))
// ... all pages lazy loaded
<Suspense fallback={<LoadingSpinner />}>
  <Routes>...</Routes>
</Suspense>
```

### 4. Production Docker Build

**`backend/Dockerfile`** (production):
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app/ app/
ENV PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

**`frontend/Dockerfile`** (production — multi-stage):
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**`frontend/nginx.conf`**:
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
    # Proxy API
    location /api {
        proxy_pass http://backend:8000;
    }
}
```

**`docker-compose.prod.yml`**:
- Remove volume mounts (use built images)
- Add `restart: unless-stopped`
- Add MongoDB authentication (`MONGO_INITDB_ROOT_USERNAME`, `MONGO_INITDB_ROOT_PASSWORD`)
- Add `healthcheck` for each service

### 5. Final Deployment Checklist File

Create `DEPLOYMENT.md` at project root:
```markdown
# CareQueue Deployment Checklist

## Pre-Deploy
- [ ] All 18 phases implemented
- [ ] All tests passing: `pytest backend/tests/ -v`
- [ ] No hardcoded secrets (grep for "password", "secret", "key" in source)
- [ ] `.env` created from `.env.example` with real values
- [ ] MongoDB authentication configured
- [ ] SECRET_KEY is at least 32 random characters

## Security
- [ ] RBAC tests passing (all 4 roles tested)
- [ ] Tenant isolation tests passing (cross-clinic access blocked)
- [ ] Rate limiting configured
- [ ] Security headers configured
- [ ] File upload MIME type validation active

## Deploy Steps
1. `docker-compose -f docker-compose.prod.yml build`
2. `docker-compose -f docker-compose.prod.yml up -d`
3. Verify: `curl http://localhost/api/v1/health`
4. Create super_admin user via POST /api/v1/auth/register
5. Create first clinic via POST /api/v1/clinics

## Post-Deploy Verification
- [ ] Login works
- [ ] Dashboard loads with no errors
- [ ] Data import accepts a test CSV
- [ ] Analytics compute returns source="historical"
- [ ] Simulation runs and returns source="simulation"
- [ ] Audit log captures all test actions
- [ ] PDF export downloads correctly
```

### 6. README.md (Final)

Update root `README.md`:
```markdown
# CareQueue — Clinic Operations Intelligence Platform

ARRIVAL → QUEUE → SERVICE → INSIGHT

## Quick Start (Development)
1. `cp backend/.env.example backend/.env`
2. `docker-compose up -d mongodb`
3. `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload`
4. `cd frontend && npm install && npm run dev`
5. Open http://localhost:5173

## Production Deploy
See DEPLOYMENT.md

## Tech Stack
- Backend: FastAPI + Motor + MongoDB
- Frontend: React + TypeScript + Vite
- Simulation: SimPy
- Analytics: Pandas + NumPy + SciPy
```

## Exit Gates (Final Release)
- [ ] `pytest backend/tests/ -v` — all tests pass, 0 failures
- [ ] Tenant isolation tests: cross-clinic access returns 403
- [ ] `docker-compose -f docker-compose.prod.yml build` completes without errors
- [ ] Health check: `GET /api/v1/health` returns `{"status": "ok", "db": "connected"}`
- [ ] All 18 phases implemented and exit gates met
- [ ] Rate limiting active on auth and analytics endpoints
- [ ] Security headers present in all responses
- [ ] `DEPLOYMENT.md` exists with complete checklist
- [ ] No hardcoded secrets in source code
