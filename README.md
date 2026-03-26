# Dobby

A personal expense tracking web app that connects to your bank accounts via Plaid, lets you create custom categories, and visualizes your spending over time.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Material UI |
| Backend | FastAPI, Python 3.12, SQLAlchemy 2.0 |
| Database (local) | SQLite |
| Database (prod) | PostgreSQL via Supabase |
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

Fill in `backend/.env`:

| Variable | Description |
|---|---|
| `ENVIRONMENT` | `local` (SQLite) or `production` (PostgreSQL) |
| `DATABASE_URL` | SQLite path — default works for local dev |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |
| `SUPABASE_SECRET_KEY` | Supabase service role key |
| `DATABASE_URL_PROD` | PostgreSQL URL from Supabase (production only) |
| `JWT_SECRET` | Long random string — used to sign tokens |
| `PLAID_CLIENT_ID` | From Plaid dashboard |
| `PLAID_SECRET` | From Plaid dashboard (use sandbox secret for dev) |
| `PLAID_ENV` | `sandbox`, `development`, or `production` |
| `MAX_USERS` | Max active users allowed (default: 15) |
| `ADMIN_EMAILS` | Comma-separated list of admin email addresses |

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
