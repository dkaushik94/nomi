from datetime import date, datetime

from pydantic import BaseModel, field_validator


class TransactionCategoryUpdate(BaseModel):
    category_id: int


class TransactionOut(BaseModel):
    id: int
    plaid_transaction_id: str
    plaid_account_id: str
    name: str
    merchant_name: str | None
    amount: float
    currency_code: str
    transaction_date: date
    authorized_date: date | None
    plaid_category: str | None
    plaid_category_detailed: str | None
    pending: bool
    payment_channel: str | None
    logo_url: str | None
    custom_category_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TransactionFilters(BaseModel):
    start_date: date | None = None
    end_date: date | None = None

    @field_validator("end_date")
    @classmethod
    def end_after_start(cls, v: date | None, info) -> date | None:
        start = info.data.get("start_date")
        if v and start and v < start:
            raise ValueError("end_date must be >= start_date")
        if v and start and (v - start).days > 366:
            raise ValueError("Date range cannot exceed 366 days")
        return v
