from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: str = "local"

    # Database
    database_url: str = "sqlite+aiosqlite:///./dobby.db"
    database_url_prod: str = ""

    @field_validator("database_url_prod")
    @classmethod
    def fix_asyncpg_driver(cls, v: str) -> str:
        """Supabase connection strings use postgresql://, asyncpg requires postgresql+asyncpg://."""
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    # Supabase
    supabase_url: str = ""
    supabase_publishable_key: str = ""
    supabase_secret_key: str = ""

    # JWT
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    # Plaid
    plaid_client_id: str = ""
    plaid_secret: str = ""
    plaid_env: str = "sandbox"

    # App constraints
    max_users: int = 15
    admin_emails: str = ""

    # CORS — comma-separated list of allowed origins
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    @property
    def is_local(self) -> bool:
        return self.environment == "local"

    @property
    def active_database_url(self) -> str:
        return self.database_url if self.is_local else self.database_url_prod

    @property
    def admin_email_list(self) -> list[str]:
        return [e.strip() for e in self.admin_emails.split(",") if e.strip()]

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
