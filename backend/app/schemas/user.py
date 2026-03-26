from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


class UserProfile(BaseModel):
    id: int
    email: EmailStr
    is_admin: bool
    is_active: bool
    plaid_item_id: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class WaitlistEntry(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    model_config = {"from_attributes": True}


class LinkAccountRequest(BaseModel):
    public_token: str

    @field_validator("public_token")
    @classmethod
    def validate_token(cls, v: str) -> str:
        v = v.strip()
        if not v or len(v) > 500:
            raise ValueError("Invalid public token")
        return v


class SyncTransactionsResponse(BaseModel):
    added: int
    modified: int
    removed: int
