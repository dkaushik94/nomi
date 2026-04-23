from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, field_validator


class UserProfile(BaseModel):
    id: Any  # UUID on PostgreSQL, int on SQLite local dev — frontend uses str(id)
    email: EmailStr
    is_admin: bool
    is_active: bool
    plaid_item_id: str | None
    institution_name: str | None
    created_at: datetime
    last_synced_at: datetime | None = None

    model_config = {"from_attributes": True}


class WaitlistEntry(BaseModel):
    id: Any  # UUID on PostgreSQL, int on SQLite
    email: EmailStr
    created_at: datetime

    model_config = {"from_attributes": True}


class LinkAccountRequest(BaseModel):
    public_token: str
    # Captured from Plaid Link onSuccess metadata in the frontend.
    institution_id: str | None = None
    institution_name: str | None = None

    @field_validator("public_token")
    @classmethod
    def validate_token(cls, v: str) -> str:
        v = v.strip()
        if not v or len(v) > 500:
            raise ValueError("Invalid public token")
        return v

    @field_validator("institution_id", "institution_name")
    @classmethod
    def validate_optional_str(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if len(v) > 500:
                raise ValueError("Value too long")
        return v or None


class SyncTransactionsResponse(BaseModel):
    added: int
    modified: int
    removed: int
    last_synced_at: datetime | None = None


class BankLinkOut(BaseModel):
    """Public representation of a single BankLink record.

    plaid_access_token is intentionally excluded — never exposed to clients.
    linked_at is an alias for created_at to make the intent clearer.
    """

    id: int
    plaid_item_id: str
    institution_id: str | None
    institution_name: str | None
    is_active: bool
    linked_at: datetime
    unlinked_at: datetime | None
    last_synced_at: datetime | None

    model_config = {"from_attributes": True}

    @classmethod
    def from_link(cls, link: object) -> "BankLinkOut":
        return cls(
            id=link.id,  # type: ignore[attr-defined]
            plaid_item_id=link.plaid_item_id,  # type: ignore[attr-defined]
            institution_id=link.institution_id,  # type: ignore[attr-defined]
            institution_name=link.institution_name,  # type: ignore[attr-defined]
            is_active=link.is_active,  # type: ignore[attr-defined]
            linked_at=link.created_at,  # type: ignore[attr-defined]
            unlinked_at=link.unlinked_at,  # type: ignore[attr-defined]
            last_synced_at=link.last_synced_at,  # type: ignore[attr-defined]
        )
