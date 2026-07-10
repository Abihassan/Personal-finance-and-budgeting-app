from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User
from app.services.jwt_service import verify_access_token

bearer = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = verify_access_token(token)
    except JWTError:
        raise credentials_error

    user_id: str = payload.get("sub", "")
    token_version: int = payload.get("ver", -1)

    user = await db.get(User, user_id)
    if not user:
        raise credentials_error

    # token_version check — catches revoked sessions without scanning refresh_token table
    if user.token_version != token_version:
        raise credentials_error

    return user
