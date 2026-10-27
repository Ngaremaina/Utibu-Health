"""Application configuration.

All runtime settings come from environment variables so the same image can run
locally, in CI and in production against Neon Postgres.
"""

from __future__ import annotations

import os
from datetime import timedelta


def _bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _list(name: str, default: str = "") -> list[str]:
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


def normalize_database_url(url: str | None) -> str | None:
    """Force the psycopg 3 driver for Postgres URLs.

    Neon hands out ``postgresql://`` (and some tools still emit ``postgres://``)
    URLs; SQLAlchemy would otherwise try to load psycopg2.
    """
    if not url:
        return url
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix) :]
    return url


def engine_options(url: str | None) -> dict:
    if not url or not url.startswith("postgresql"):
        return {}
    return {
        # Neon scales compute to zero and drops idle connections; validate
        # connections before use and recycle them before Neon closes them.
        "pool_pre_ping": True,
        "pool_recycle": int(os.getenv("DB_POOL_RECYCLE", "300")),
        "pool_size": int(os.getenv("DB_POOL_SIZE", "5")),
        "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "5")),
        # Server-side prepared statements do not survive PgBouncer transaction
        # pooling (Neon's "-pooler" endpoint), so disable them.
        "connect_args": {"prepare_threshold": None},
    }


class Config:
    ENV_NAME = "base"
    TESTING = False
    DEBUG = False

    SECRET_KEY = os.getenv("SECRET_KEY")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=int(os.getenv("JWT_ACCESS_MINUTES", "15")))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=int(os.getenv("JWT_REFRESH_DAYS", "30")))

    SQLALCHEMY_DATABASE_URI = normalize_database_url(os.getenv("DATABASE_URL"))
    SQLALCHEMY_ENGINE_OPTIONS = engine_options(SQLALCHEMY_DATABASE_URI)
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Hosted web frontends are always allowed, on top of anything in CORS_ORIGINS.
    WEB_ORIGINS = ("https://utibu-health.expo.app", "https://utibu-health.vercel.app")
    CORS_ORIGINS = [*WEB_ORIGINS, *_list("CORS_ORIGINS", "*")]
    TRUST_PROXY = _bool("TRUST_PROXY", True)

    RATELIMIT_STORAGE_URI = os.getenv("RATELIMIT_STORAGE_URI", "memory://")
    RATELIMIT_DEFAULT = os.getenv("RATELIMIT_DEFAULT", "300 per minute")
    RATELIMIT_AUTH = os.getenv("RATELIMIT_AUTH", "10 per minute")
    RATELIMIT_ENABLED = _bool("RATELIMIT_ENABLED", True)
    RATELIMIT_HEADERS_ENABLED = True

    DELIVERY_FEE = int(os.getenv("DELIVERY_FEE", "250"))
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

    MPESA_ENVIRONMENT = os.getenv("MPESA_ENVIRONMENT", "sandbox")
    MPESA_CONSUMER_KEY = os.getenv("MPESA_CONSUMER_KEY")
    MPESA_CONSUMER_SECRET = os.getenv("MPESA_CONSUMER_SECRET")
    MPESA_SHORTCODE = os.getenv("MPESA_SHORTCODE", "174379")
    MPESA_PASSKEY = os.getenv("MPESA_PASSKEY")
    MPESA_CALLBACK_URL = os.getenv("MPESA_CALLBACK_URL")
    MPESA_CALLBACK_TOKEN = os.getenv("MPESA_CALLBACK_TOKEN")
    MPESA_TIMEOUT_SECONDS = int(os.getenv("MPESA_TIMEOUT_SECONDS", "15"))


class DevelopmentConfig(Config):
    ENV_NAME = "development"
    DEBUG = True
    SECRET_KEY = Config.SECRET_KEY or "dev-secret-key"
    JWT_SECRET_KEY = Config.JWT_SECRET_KEY or "dev-jwt-secret-key-change-me-32bytes"
    SQLALCHEMY_DATABASE_URI = Config.SQLALCHEMY_DATABASE_URI or "sqlite:///utibu-dev.db"
    SQLALCHEMY_ENGINE_OPTIONS = engine_options(SQLALCHEMY_DATABASE_URI)


class TestingConfig(Config):
    ENV_NAME = "testing"
    TESTING = True
    SECRET_KEY = "test-secret-key"
    JWT_SECRET_KEY = "test-jwt-secret-key-that-is-long-enough"
    SQLALCHEMY_DATABASE_URI = normalize_database_url(os.getenv("TEST_DATABASE_URL")) or "sqlite://"
    SQLALCHEMY_ENGINE_OPTIONS = engine_options(SQLALCHEMY_DATABASE_URI)
    RATELIMIT_ENABLED = False
    CORS_ORIGINS = ["*"]
    MPESA_CONSUMER_KEY = "test-key"
    MPESA_CONSUMER_SECRET = "test-secret"
    MPESA_PASSKEY = "test-passkey"
    MPESA_CALLBACK_URL = "https://example.test/api/v1/payments/mpesa/callback"
    MPESA_CALLBACK_TOKEN = "test-callback-token"


class ProductionConfig(Config):
    ENV_NAME = "production"

    REQUIRED = ("SECRET_KEY", "JWT_SECRET_KEY", "SQLALCHEMY_DATABASE_URI")

    @classmethod
    def validate(cls) -> None:
        missing = [name for name in cls.REQUIRED if not getattr(cls, name)]
        if missing:
            raise RuntimeError(f"Missing required configuration: {', '.join(missing)}")
        if len(cls.JWT_SECRET_KEY) < 32:
            raise RuntimeError("JWT_SECRET_KEY must be at least 32 characters")


CONFIGS: dict[str, type[Config]] = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}


def get_config(name: str | None = None) -> type[Config]:
    name = name or os.getenv("APP_ENV", "development")
    try:
        return CONFIGS[name]
    except KeyError as exc:
        raise RuntimeError(f"Unknown APP_ENV '{name}'") from exc
