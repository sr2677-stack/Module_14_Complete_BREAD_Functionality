# Calculations App (Module 14)

Flask + SQLite backend with JWT authentication, static frontend, and Playwright E2E tests for BREAD calculation operations.

## Features
- Browse: `GET /api/calculations`
- Read: `GET /api/calculations/{id}`
- Edit: `PUT /api/calculations/{id}`
- Add: `POST /api/calculations`
- Delete: `DELETE /api/calculations/{id}`

All calculation endpoints are user-scoped via JWT.

## Run Locally (Docker)
```bash
docker-compose up --build
```

Endpoints:
- Frontend: `http://localhost:5500`
- Backend API: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

## Run Locally (Without Docker)
Backend:
```bash
cd backend
pip install -r requirements.txt
python app.py
```

Frontend (in a separate terminal):
```bash
npx serve frontend -p 5500
```

## Run Tests
From project root:
```bash
npm install
npx playwright install --with-deps chromium
npx playwright test
```

## CI/CD
GitHub Actions workflow:
- File: `.github/workflows/ci-cd.yml`
- Stages:
1. Backend setup and start
2. Frontend serve
3. Playwright E2E test run
4. Docker image build and push on `main` push

## Docker Hub
- `https://hub.docker.com/r/sr2677stack/calculations-app`

## Required Submission Artifacts
Add these files before final submission:
1. GitHub Actions success screenshot (workflow run page)
2. Docker Hub push screenshot (image tags page)
3. Frontend screenshots showing Add, Browse, Read, Edit, Delete
