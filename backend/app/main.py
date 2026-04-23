"""Dobby FastAPI application entry point."""

import logging
import time
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import admin, auth, categories, plaid_mappings, transactions, users

logger = logging.getLogger("dobby.access")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    yield


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
logging.getLogger("alembic").setLevel(logging.WARNING)

app = FastAPI(
    title="Dobby API",
    description="Expense tracking and visualization API",
    version="0.1.0",
    lifespan=lifespan,
    # Never expose internal errors in production
    openapi_url="/openapi.json",
)


@app.middleware("http")
async def log_requests(request: Request, call_next):  # type: ignore[no-untyped-def]
    start = time.perf_counter()
    response = await call_next(request)
    ms = (time.perf_counter() - start) * 1000
    logger.info("%s %s → %d  (%.0fms)", request.method, request.url.path, response.status_code, ms)
    return response


# CORS — origins controlled via ALLOWED_ORIGINS env var
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
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
