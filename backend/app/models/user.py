from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    supabase_uid: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # Soft delete
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    delete_requested_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Plaid integration
    plaid_access_token: Mapped[str | None] = mapped_column(Text, nullable=True)  # encrypted at app level
    plaid_item_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    plaid_cursor: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    transactions: Mapped[list["Transaction"]] = relationship(back_populates="user", lazy="select")
    categories: Mapped[list["Category"]] = relationship(back_populates="user", lazy="select")
