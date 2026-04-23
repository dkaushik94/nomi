"""BankLink model — records every Plaid bank account link for a user.

Each row represents one link event. When a user re-links or links a new bank
the previous active link is deactivated and a new row is inserted, giving a
full audit trail.

Future scope
------------
- Debounce / cooldown: compare institution_id + user_id before creating a new
  link to prevent rapid re-linking (which incurs Plaid cost).
- Multi-account: query is_active=True rows to find all live connections per user.
- Soft quota: count active links per user to enforce per-user bank account limits.
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class BankLink(Base):
    __tablename__ = "bank_links"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )

    # Plaid identifiers
    plaid_item_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    plaid_access_token: Mapped[str] = mapped_column(Text, nullable=False)  # encrypted at app level
    plaid_cursor: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Institution metadata — captured from Plaid Link onSuccess metadata
    institution_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True,
        comment="Plaid institution_id, e.g. ins_3 (Chase). Used for deduplication and cooldown.",
    )
    institution_name: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        comment="Human-readable institution name from Plaid Link metadata.",
    )

    # Link lifecycle
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
        comment="False once the user unlinks or re-links a different account.",
    )
    unlinked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, comment="Timestamp when the link was deactivated."
    )
    last_synced_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp of the most recent successful transaction sync.",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="bank_links")  # type: ignore[name-defined]
