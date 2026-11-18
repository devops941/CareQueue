# Phase 01 — Foundation & Repository

You are implementing Phase 01 of CareQueue: **Foundation & Repository Setup**.

## Project Context
CareQueue is a full-stack clinic operations intelligence platform (ARRIVAL → QUEUE → SERVICE → INSIGHT).
- Frontend: React.js + TypeScript + Vite
- Backend: Python 3 + FastAPI
- Database: MongoDB
- Design System: CareQueue Flowline Design System
- Deployment: Docker + Docker Compose

## Your Task
Set up the complete monorepo skeleton for CareQueue from scratch.

### Backend Setup (`backend/`)
1. Create `backend/` folder with this structure:
   ```
   backend/
   ├── app/
   │   ├── main.py              # FastAPI app entry point
   │   ├── core/
   │   │   ├── config.py        # Settings (pydantic-settings BaseSettings)
   │   │   ├── database.py      # MongoDB Motor async client
   │   │   └── security.py      # JWT helpers (placeholder)
   │   ├── api/
   │   │   └── v1/
   │   │       └── __init__.py
   │   ├── modules/             # Feature modules (empty __init__.py files)
   │   │   ├── auth/
   │   │   ├── clinics/
   │   │   ├── analytics/
   │   │   └── simulation/
   │   └── domain/              # Pure functions (no DB, no FastAPI)
   │       └── __init__.py
   ├── tests/
   │   └── __init__.py
   ├── requirements.txt
   ├── .env.example
   └── Dockerfile
   ```

2. `requirements.txt` must include:
   - fastapi>=0.111
   - uvicorn[standard]
   - motor>=3.4
   - pydantic>=2.7
   - pydantic-settings>=2.3
   - python-jose[cryptography]
   - passlib[bcrypt]
   - python-multipart
   - pandas>=2.2
   - numpy>=1.26
   - scipy>=1.13
   - simpy>=4.1
   - openpyxl
   - python-dotenv
   - pytest
   - pytest-asyncio
   - httpx

3. `app/main.py`: FastAPI app with health check endpoint `GET /api/v1/health` returning `{"status": "ok", "version": "1.0.0"}`

4. `app/core/config.py`: Settings class with MONGODB_URL, DB_NAME, SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES, ENVIRONMENT

5. `app/core/database.py`: Motor async client, `get_database()` async function

6. `.env.example`:
   ```
   MONGODB_URL=mongodb://localhost:27017
   DB_NAME=carequeue
   SECRET_KEY=change-me-in-production
   ACCESS_TOKEN_EXPIRE_MINUTES=480
   ENVIRONMENT=development
   ```

7. `Dockerfile`: Python 3.12-slim, install requirements, run with uvicorn on port 8000

### Frontend Setup (`frontend/`)
1. Create `frontend/` folder with this structure:
   ```
   frontend/
   ├── src/
   │   ├── app/
   │   │   ├── App.tsx
   │   │   └── main.tsx
   │   ├── design-system/
   │   │   ├── tokens.ts        # Color, spacing, typography tokens
   │   │   └── typography.ts
   │   ├── components/
   │   │   ├── layout/
   │   │   └── forms/
   │   ├── modules/
   │   │   ├── auth/
   │   │   ├── overview/
   │   │   ├── analytics/
   │   │   └── simulation/
   │   ├── lib/
   │   │   ├── api-client.ts    # Axios/fetch wrapper
   │   │   └── query-client.ts  # TanStack Query client
   │   ├── stores/
   │   ├── hooks/
   │   ├── types/
   │   └── utils/
   ├── package.json
   ├── tsconfig.json
   ├── vite.config.ts
   └── Dockerfile
   ```

2. `package.json` dependencies:
   - react, react-dom (@18)
   - typescript
   - vite + @vitejs/plugin-react
   - react-router-dom v6
   - @tanstack/react-query v5
   - axios
   - zod
   - recharts
   - tailwindcss + postcss + autoprefixer
   - lucide-react
   - @radix-ui/react-* (dialog, dropdown-menu, toast)

3. `vite.config.ts`: proxy `/api` to `http://localhost:8000`

4. `src/design-system/tokens.ts`: CareQueue brand palette
   - Primary: `#0EA5E9` (CareQueue Blue)
   - Accent: `#10B981` (Healthy Green)
   - Warning: `#F59E0B`
   - Danger: `#EF4444`
   - Surface light: `#F8FAFC`
   - Text primary: `#0F172A`

5. Minimal `App.tsx` with React Router and a placeholder `/` route showing "CareQueue — Loading..."

### Docker Compose (`docker-compose.yml`)
At root level, create `docker-compose.yml` with services:
- `mongodb`: mongo:7, port 27017, volume `carequeue-data`
- `backend`: build from `./backend`, port 8000, depends on mongodb, env_file `.env`
- `frontend`: build from `./frontend`, port 5173, depends on backend

### Root Files
- `.gitignore` (node_modules, __pycache__, .env, dist, .pytest_cache, *.pyc)
- `README.md` with single-line project description

## Exit Gates
Before finishing, verify:
- [ ] `backend/requirements.txt` exists with all dependencies
- [ ] `backend/app/main.py` has health check endpoint
- [ ] `backend/app/core/config.py` has Settings class
- [ ] `backend/app/core/database.py` has Motor client
- [ ] `frontend/package.json` has all dependencies listed
- [ ] `frontend/src/design-system/tokens.ts` has brand colors
- [ ] `docker-compose.yml` has mongodb, backend, frontend services
- [ ] `.gitignore` exists at root
