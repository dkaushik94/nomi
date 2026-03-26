# Dobby

A personal expense tracking web app that connects to your bank accounts via Plaid, lets you create custom categories, and visualizes your spending over time.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Material UI |
| Backend | FastAPI, Python 3.12, SQLAlchemy 2.0 |
| Database (local) | SQLite |
| Database (development/production) | PostgreSQL via Supabase |
| Auth | Google OAuth via Supabase + JWT |
| Bank data | Plaid API |

## Prerequisites

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) (`pip install uv`)
- Node.js 20+
- A [Supabase](https://supabase.com) project with Google OAuth enabled
- A [Plaid](https://plaid.com) account (sandbox is free)

## Backend Setup

```bash
cd backend
cp .env.example .env
```

The app has two environments controlled by `ENVIRONMENT`:

| `ENVIRONMENT` value | Database | Where it runs |
|---|---|---|
| `local` | SQLite (no setup needed) | Your machine |
| `development` | Supabase PostgreSQL | Railway |

Fill in `backend/.env`:

| Variable | Description |
|---|---|
| `ENVIRONMENT` | `local` for local dev, `development` for Railway |
| `DATABASE_URL` | SQLite path — default works as-is for local |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |
| `SUPABASE_SECRET_KEY` | Supabase service role key |
| `DATABASE_URL_PROD` | Supabase PostgreSQL connection string — required when `ENVIRONMENT=development` |
| `JWT_SECRET` | Long random string — used to sign tokens |
| `PLAID_CLIENT_ID` | From Plaid dashboard |
| `PLAID_SECRET` | From Plaid dashboard (sandbox secret for now) |
| `PLAID_ENV` | `sandbox` |
| `MAX_USERS` | Max active users allowed (default: 15) |
| `ADMIN_EMAILS` | Comma-separated list of admin email addresses |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins — add your Railway frontend URL when deploying |

Install dependencies and run:

```bash
uv pip install -e ".[dev]"
uv run uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

## Frontend Setup

```bash
cd frontend
cp .env.example .env
```

Fill in `frontend/.env`:

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |
| `VITE_API_URL` | Leave unset locally (Vite proxies `/api` to `localhost:8000`). Set to your Railway backend URL when deploying. |

Install dependencies and run:

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Running Tests

```bash
cd backend
pytest
```

## CI

GitHub Actions runs on every push and pull request to `main`:
- Backend: lint with `ruff`, run `pytest`
- Frontend: lint with ESLint, build with Vite
