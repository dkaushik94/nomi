"""add last_synced_at to bank_links

Revision ID: 003
Revises: 002
Create Date: 2024-01-20 00:00:00.000000

Adds last_synced_at to track when a bank link was last successfully synced.
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "bank_links",
        sa.Column(
            "last_synced_at",
            sa.DateTime(timezone=True),
            nullable=True,
            comment="Timestamp of the most recent successful transaction sync.",
        ),
    )


def downgrade() -> None:
    op.drop_column("bank_links", "last_synced_at")
