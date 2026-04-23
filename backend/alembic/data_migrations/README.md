# Data Migrations

This directory contains standalone backfill scripts for large data migrations that shouldn't run inside an Alembic transaction (e.g. millions of rows, external API calls, batch processing).

## When to use each approach

### Pattern A — Inline with schema migration (small backfills)

Use when the backfill is fast and can safely run inside the same transaction as the schema change.

```python
# Inside an alembic/versions/NNN_your_migration.py upgrade()
def upgrade() -> None:
    op.add_column("transactions", sa.Column("foo", sa.String(50), nullable=True))

    conn = op.get_bind()
    conn.execute(sa.text("UPDATE transactions SET foo = 'default_value'"))

    op.alter_column("transactions", "foo", nullable=False)
```

### Pattern B — Standalone script (large backfills)

Use when the backfill is too large for a single transaction, needs batching, or must be run manually on production before or after a deploy.

Create a file here: `alembic/data_migrations/backfill_<description>.py`

```python
"""
Standalone backfill: <description>

Run against production:
    cd backend
    ENVIRONMENT=production python alembic/data_migrations/backfill_<description>.py

Always idempotent — safe to run multiple times.
"""
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import get_settings

BATCH_SIZE = 500

async def run() -> None:
    settings = get_settings()
    engine = create_async_engine(settings.active_database_url)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async with Session() as session:
        offset = 0
        while True:
            result = await session.execute(
                text("SELECT id FROM your_table WHERE condition LIMIT :limit OFFSET :offset"),
                {"limit": BATCH_SIZE, "offset": offset},
            )
            rows = result.fetchall()
            if not rows:
                break

            ids = [r[0] for r in rows]
            await session.execute(
                text("UPDATE your_table SET col = :val WHERE id = ANY(:ids)"),
                {"val": "new_value", "ids": ids},
            )
            await session.commit()
            offset += BATCH_SIZE
            print(f"Processed {offset} rows...")

    await engine.dispose()
    print("Done.")

if __name__ == "__main__":
    asyncio.run(run())
```

## Historical reference

`historical_uuid_migration.py` — the raw SQL INT4→UUID migration that was originally in `database.py`. Preserved for reference only. This is now represented as `alembic/versions/002_uuid_user_id.py`.
