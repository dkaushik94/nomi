import re
from datetime import datetime

from pydantic import BaseModel, field_validator

COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")
LABEL_MAX = 100


def _clean_str(v: str, max_len: int = LABEL_MAX) -> str:
    v = v.strip()
    if not v or len(v) > max_len:
        raise ValueError(f"Value must be 1–{max_len} characters")
    # Whitelist: alphanumeric + spaces + basic punctuation
    if not re.match(r"^[\w\s\-&'\.]+$", v):
        raise ValueError("Invalid characters in value")
    return v


class CategoryCreate(BaseModel):
    label: str
    value: str
    color: str = "#6366f1"

    @field_validator("label", "value")
    @classmethod
    def validate_text(cls, v: str) -> str:
        return _clean_str(v)

    @field_validator("color")
    @classmethod
    def validate_color(cls, v: str) -> str:
        if not COLOR_RE.match(v):
            raise ValueError("Color must be a valid hex color (#rrggbb)")
        return v


class CategoryUpdate(BaseModel):
    label: str | None = None
    value: str | None = None
    color: str | None = None

    @field_validator("label", "value")
    @classmethod
    def validate_text(cls, v: str | None) -> str | None:
        return _clean_str(v) if v is not None else None

    @field_validator("color")
    @classmethod
    def validate_color(cls, v: str | None) -> str | None:
        if v is not None and not COLOR_RE.match(v):
            raise ValueError("Color must be a valid hex color (#rrggbb)")
        return v


class CategoryOut(BaseModel):
    id: int
    label: str
    value: str
    color: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
