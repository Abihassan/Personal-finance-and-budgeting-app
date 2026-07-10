from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    refresh_secret: str
    # Groq is 100% free — get key at https://console.groq.com
    # If not set, AI chat returns a friendly "not configured" message
    groq_api_key: str = ""
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30
    environment: str = "development"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
