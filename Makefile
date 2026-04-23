.PHONY: backend frontend install install-backend install-frontend

# ── Dev servers ──────────────────────────────────────────────────────────────

backend:
	cd backend && .venv/bin/alembic check && .venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend:
	cd frontend && npm run dev

# ── Install ───────────────────────────────────────────────────────────────────

install: install-backend install-frontend

install-backend:
	cd backend && python -m venv .venv && .venv/bin/pip install -e ".[dev]"

install-frontend:
	cd frontend && npm install

# ── Lint / test ───────────────────────────────────────────────────────────────

lint:
	cd backend && .venv/bin/ruff check app

test:
	cd backend && .venv/bin/pytest
