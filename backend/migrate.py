"""Pre-start migration runner.

Usage:
    python migrate.py

Runs `alembic upgrade head`. Called before uvicorn starts (see Procfile).
Exits with non-zero status on failure so Railway halts the deploy.
"""

import logging
import sys

from alembic import command
from alembic.config import Config

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("dobby.migrate")


def run_migrations() -> None:
    logger.info("Running Alembic migrations...")
    command.upgrade(Config("alembic.ini"), "head")
    logger.info("Migrations complete.")


if __name__ == "__main__":
    try:
        run_migrations()
    except Exception as exc:
        logger.error("Migration failed: %s", exc, exc_info=True)
        sys.exit(1)
