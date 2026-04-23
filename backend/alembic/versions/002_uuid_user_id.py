"""convert user ids from integer to uuid

Revision ID: 002
Revises: 001
Create Date: 2024-01-15 00:00:00.000000

Converts users.id (and all FK references) from INTEGER to UUID.
Sets users.id = supabase_uid::uuid so that Supabase RLS policies using
auth.uid() work correctly.

PostgreSQL only — SQLite is a no-op (local dev, type enforcement is lax).
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    statements = [
        # 1. Add new UUID shadow columns
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS id_new UUID DEFAULT gen_random_uuid()",
        "ALTER TABLE bank_links ADD COLUMN IF NOT EXISTS user_id_new UUID",
        "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id_new UUID",
        "ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id_new UUID",
        "ALTER TABLE category_plaid_mappings ADD COLUMN IF NOT EXISTS user_id_new UUID",
        # 2. Populate users.id_new from supabase_uid (this IS the Supabase auth UUID)
        "UPDATE users SET id_new = supabase_uid::uuid",
        # 3. Backfill child table FK columns from the parent
        "UPDATE bank_links bl SET user_id_new = u.id_new FROM users u WHERE bl.user_id = u.id",
        "UPDATE transactions t SET user_id_new = u.id_new FROM users u WHERE t.user_id = u.id",
        "UPDATE categories c SET user_id_new = u.id_new FROM users u WHERE c.user_id = u.id",
        "UPDATE category_plaid_mappings m SET user_id_new = u.id_new FROM users u WHERE m.user_id = u.id",
        # 4. Drop FK constraints
        "ALTER TABLE bank_links DROP CONSTRAINT IF EXISTS bank_links_user_id_fkey",
        "ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey",
        "ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_user_id_fkey",
        "ALTER TABLE category_plaid_mappings DROP CONSTRAINT IF EXISTS category_plaid_mappings_user_id_fkey",
        # 5. Drop old primary key
        "ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey",
        # 6. Drop old integer columns
        "ALTER TABLE users DROP COLUMN IF EXISTS id",
        "ALTER TABLE bank_links DROP COLUMN IF EXISTS user_id",
        "ALTER TABLE transactions DROP COLUMN IF EXISTS user_id",
        "ALTER TABLE categories DROP COLUMN IF EXISTS user_id",
        "ALTER TABLE category_plaid_mappings DROP COLUMN IF EXISTS user_id",
        # 7. Rename UUID shadow columns into place
        "ALTER TABLE users RENAME COLUMN id_new TO id",
        "ALTER TABLE bank_links RENAME COLUMN user_id_new TO user_id",
        "ALTER TABLE transactions RENAME COLUMN user_id_new TO user_id",
        "ALTER TABLE categories RENAME COLUMN user_id_new TO user_id",
        "ALTER TABLE category_plaid_mappings RENAME COLUMN user_id_new TO user_id",
        # 8. Restore PK and FK constraints
        "ALTER TABLE users ADD PRIMARY KEY (id)",
        "ALTER TABLE bank_links ADD CONSTRAINT bank_links_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE",
        "ALTER TABLE transactions ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE",
        "ALTER TABLE categories ADD CONSTRAINT categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE",
        "ALTER TABLE category_plaid_mappings ADD CONSTRAINT category_plaid_mappings_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE",
    ]

    for stmt in statements:
        op.execute(sa.text(stmt))


def downgrade() -> None:
    # Reversing an INT4→UUID migration with live data is destructive.
    # Do not run downgrade on production — restore from a snapshot instead.
    raise NotImplementedError("Downgrade not supported for UUID migration. Restore from snapshot.")
