from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.active_database_url,
    echo=settings.is_local,
    connect_args={"check_same_thread": False} if settings.is_local else {},
)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def _run_column_migrations(conn: object) -> None:
    """ADD COLUMN migrations for columns added to existing tables after initial deploy.

    create_all() only creates NEW tables — it never alters existing ones.  Any
    column added to an already-deployed table must be backfilled here so that
    production databases pick up the change on next restart.
    """
    from sqlalchemy import text  # local import to avoid circular issues

    is_postgres = "postgresql" in settings.active_database_url

    migrations: list[str] = []
    if is_postgres:
        migrations = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS institution_name VARCHAR(500)",
        ]
    else:
        # SQLite < 3.37 has no IF NOT EXISTS on ADD COLUMN — use try/except per statement.
        migrations = [
            "ALTER TABLE users ADD COLUMN institution_name VARCHAR(500)",
        ]

    for stmt in migrations:
        try:
            await conn.execute(text(stmt))  # type: ignore[attr-defined]
        except Exception:
            # Column already exists (SQLite raises OperationalError); safe to ignore.
            pass


async def create_tables() -> None:
    async with engine.begin() as conn:
        await _run_column_migrations(conn)
        await conn.run_sync(Base.metadata.create_all)
