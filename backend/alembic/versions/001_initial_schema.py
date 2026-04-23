"""initial schema

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000

Represents the production baseline: all tables with INTEGER user IDs.
New environments run this migration from scratch; existing production is
stamped at 001 so that migrations 002+ run on the next deploy.
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("supabase_uid", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("is_admin", sa.Boolean(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("delete_requested_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("plaid_access_token", sa.Text(), nullable=True),
        sa.Column("plaid_item_id", sa.String(255), nullable=True),
        sa.Column("plaid_cursor", sa.Text(), nullable=True),
        sa.Column(
            "institution_name",
            sa.String(500),
            nullable=True,
            comment="Denormalised from the active BankLink for quick profile display.",
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_supabase_uid", "users", ["supabase_uid"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("label", sa.String(100), nullable=False),
        sa.Column("value", sa.String(100), nullable=False),
        sa.Column("color", sa.String(20), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_categories_id", "categories", ["id"])
    op.create_index("ix_categories_user_id", "categories", ["user_id"])

    op.create_table(
        "bank_links",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("plaid_item_id", sa.String(255), nullable=False),
        sa.Column("plaid_access_token", sa.Text(), nullable=False),
        sa.Column("plaid_cursor", sa.Text(), nullable=True),
        sa.Column(
            "institution_id",
            sa.String(255),
            nullable=True,
            comment="Plaid institution_id, e.g. ins_3 (Chase). Used for deduplication and cooldown.",
        ),
        sa.Column(
            "institution_name",
            sa.String(500),
            nullable=True,
            comment="Human-readable institution name from Plaid Link metadata.",
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            comment="False once the user unlinks or re-links a different account.",
        ),
        sa.Column(
            "unlinked_at",
            sa.DateTime(timezone=True),
            nullable=True,
            comment="Timestamp when the link was deactivated.",
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_bank_links_id", "bank_links", ["id"])
    op.create_index("ix_bank_links_user_id", "bank_links", ["user_id"])
    op.create_index("ix_bank_links_plaid_item_id", "bank_links", ["plaid_item_id"])
    op.create_index("ix_bank_links_institution_id", "bank_links", ["institution_id"])
    op.create_index("ix_bank_links_is_active", "bank_links", ["is_active"])

    op.create_table(
        "transactions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("custom_category_id", sa.Integer(), nullable=True),
        sa.Column("plaid_transaction_id", sa.String(255), nullable=False),
        sa.Column("plaid_account_id", sa.String(255), nullable=False),
        sa.Column("name", sa.String(500), nullable=False),
        sa.Column("merchant_name", sa.String(500), nullable=True),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("currency_code", sa.String(10), nullable=False),
        sa.Column("transaction_date", sa.Date(), nullable=False),
        sa.Column("authorized_date", sa.Date(), nullable=True),
        sa.Column("plaid_category", sa.String(255), nullable=True),
        sa.Column("plaid_category_detailed", sa.String(255), nullable=True),
        sa.Column("pending", sa.Boolean(), nullable=False),
        sa.Column("payment_channel", sa.String(100), nullable=True),
        sa.Column("logo_url", sa.String(1000), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("delete_requested_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["custom_category_id"], ["categories.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_transactions_id", "transactions", ["id"])
    op.create_index("ix_transactions_user_id", "transactions", ["user_id"])
    op.create_index(
        "ix_transactions_plaid_transaction_id",
        "transactions",
        ["plaid_transaction_id"],
        unique=True,
    )
    op.create_index("ix_transactions_transaction_date", "transactions", ["transaction_date"])
    op.create_index("ix_transactions_custom_category_id", "transactions", ["custom_category_id"])

    op.create_table(
        "category_plaid_mappings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("custom_category_id", sa.Integer(), nullable=False),
        sa.Column("plaid_category", sa.String(100), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["custom_category_id"], ["categories.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "plaid_category", name="uq_user_plaid_category"),
    )
    op.create_index("ix_category_plaid_mappings_id", "category_plaid_mappings", ["id"])
    op.create_index("ix_category_plaid_mappings_user_id", "category_plaid_mappings", ["user_id"])
    op.create_index(
        "ix_category_plaid_mappings_custom_category_id",
        "category_plaid_mappings",
        ["custom_category_id"],
    )


def downgrade() -> None:
    op.drop_table("category_plaid_mappings")
    op.drop_table("transactions")
    op.drop_table("bank_links")
    op.drop_table("categories")
    op.drop_table("users")
