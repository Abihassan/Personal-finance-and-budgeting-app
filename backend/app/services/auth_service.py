from datetime import datetime, timezone
import hashlib

from fastapi import HTTPException, status
from passlib.context import CryptContext
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, RefreshToken
from app.schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserOut,
    RefreshRequest,
)
from app.services.jwt_service import (
    create_access_token,
    create_refresh_token,
    hash_token,
    get_refresh_expiry,
)

# ─── Password hashing ────────────────────────────────────────────────
pwd_ctx = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,
)


def _normalize_password(password: str) -> str:
    """
    bcrypt has a 72-byte limit → we pre-hash with SHA256
    so we NEVER exceed bcrypt limits.
    """
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def _hash_pw(password: str) -> str:
    return pwd_ctx.hash(_normalize_password(password))


def _verify_pw(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(_normalize_password(plain), hashed)


# ─── Core Auth ───────────────────────────────────────────────────────
async def register_user(db: AsyncSession, req: RegisterRequest) -> TokenResponse:
    existing = await db.scalar(select(User).where(User.email == req.email))
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    user = User(
        name=req.name,
        email=req.email,
        password_hash=_hash_pw(req.password),
        token_version=0,
    )

    db.add(user)
    await db.flush()

    return await _issue_tokens(db, user)


async def login_user(db: AsyncSession, req: LoginRequest) -> TokenResponse:
    user = await db.scalar(select(User).where(User.email == req.email))

    if not user or not _verify_pw(req.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")

    return await _issue_tokens(db, user)


# ─── Refresh rotation ────────────────────────────────────────────────
async def refresh_tokens(db: AsyncSession, raw_refresh: str) -> TokenResponse:
    token_hash = hash_token(raw_refresh)

    rt = await db.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked.is_(False),
        )
    )

    if not rt:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")

    now = datetime.now(timezone.utc)
    if rt.expires_at < now:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh token expired")

    # rotate token
    rt.revoked = True
    await db.flush()

    user = await db.get(User, rt.user_id)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")

    return await _issue_tokens(db, user)


# ─── Logout ───────────────────────────────────────────────────────────
async def revoke_user_tokens(db: AsyncSession, user_id: str):
    await db.execute(
        update(RefreshToken)
        .where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked.is_(False),
        )
        .values(revoked=True)
    )

    user = await db.get(User, user_id)
    if user:
        user.token_version += 1

    await db.commit()


# ─── Token issuing ───────────────────────────────────────────────────
async def _issue_tokens(db: AsyncSession, user: User) -> TokenResponse:
    access = create_access_token(user.id, user.token_version)
    raw_refresh, hashed = create_refresh_token()

    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hashed,
            expires_at=get_refresh_expiry(),
        )
    )

    await db.commit()

    return TokenResponse(
        access_token=access,
        refresh_token=raw_refresh,
        user=UserOut(
            id=user.id,
            name=user.name,
            email=user.email,
        ),
    )