import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from app.config import get_settings

settings = get_settings()


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(user_id: str, token_version: int) -> str:
    expire = _utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": user_id,
        "ver": token_version,
        "exp": expire,
        "iat": _utcnow(),
        "type": "access",
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def create_refresh_token() -> tuple[str, str]:
    """Returns (raw_token, hashed_token). Store only the hash."""
    raw = secrets.token_urlsafe(64)
    hashed = hash_token(raw)
    return raw, hashed


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def verify_access_token(token: str) -> dict:
    """Raises JWTError on failure."""
    payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    if payload.get("type") != "access":
        raise JWTError("Not an access token")
    return payload


def get_refresh_expiry() -> datetime:
    return _utcnow() + timedelta(days=settings.refresh_token_expire_days)
