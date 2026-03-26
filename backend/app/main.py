"""Dobby FastAPI application entry point."""

from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.database import create_tables
from app.middleware.rate_limit import limiter
from app.models import plaid_mapping  # noqa: F401 — imported for table creation
from app.routers import admin, auth, categories, plaid_mappings, transactions, users


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    await create_tables()
    yield


app = FastAPI(
    title="Dobby API",
    description="Expense tracking and visualization API",
    version="0.1.0",
    lifespan=lifespan,
    # Never expose internal errors in production
    openapi_url="/openapi.json",
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS — tighten origins in production via env var
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(categories.router)
app.include_router(plaid_mappings.router)
app.include_router(users.router)
app.include_router(admin.router)


@app.get("/health", tags=["health"])
async def health() -> dict:
    return {"status": "ok"}


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Never expose internal details to the client."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred"},
    )
