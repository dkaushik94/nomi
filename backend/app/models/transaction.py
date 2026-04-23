from datetime import date, datetime
from uuid import UUID

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Transaction(Base):
    """Mirrors Plaid transaction fields plus our own metadata."""

    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    custom_category_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Plaid fields
    plaid_transaction_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    plaid_account_id: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(500))
    merchant_name: Mapped[str | None] = mapped_column(String(500), nullable=True)
    amount: Mapped[float] = mapped_column(Float)
    currency_code: Mapped[str] = mapped_column(String(10), default="USD")
    transaction_date: Mapped[date] = mapped_column(Date, index=True)
    authorized_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    plaid_category: Mapped[str | None] = mapped_column(String(255), nullable=True)
    plaid_category_detailed: Mapped[str | None] = mapped_column(String(255), nullable=True)
    pending: Mapped[bool] = mapped_column(Boolean, default=False)
    payment_channel: Mapped[str | None] = mapped_column(String(100), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Our metadata
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    delete_requested_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="transactions")
    custom_category: Mapped["Category | None"] = relationship(back_populates="transactions")
