from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: str = "local"

    # Database
    database_url: str = "sqlite+aiosqlite:///./dobby.db"
    database_url_prod: str = ""

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

    @property
    def is_local(self) -> bool:
        return self.environment == "local"

    @property
    def active_database_url(self) -> str:
        return self.database_url if self.is_local else self.database_url_prod

    @property
    def admin_email_list(self) -> list[str]:
        return [e.strip() for e in self.admin_emails.split(",") if e.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
