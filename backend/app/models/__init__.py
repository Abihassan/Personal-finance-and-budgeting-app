"""
All SQLAlchemy ORM models in one file.
Imports Base from app.base (NOT app.database) to avoid circular imports.
"""
import uuid
from datetime import datetime
from sqlalchemy import Boolean, BigInteger, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.base import Base   # ← app.base, NOT app.database


def new_uuid() -> str:
    return str(uuid.uuid4())


# ─── User ─────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id: Mapped[str]              = mapped_column(String(36), primary_key=True, default=new_uuid)
    name: Mapped[str]            = mapped_column(String(120))
    email: Mapped[str]           = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str]   = mapped_column(String(256))
    token_version: Mapped[int]   = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    accounts: Mapped[list["Account"]] = relationship(
        "Account",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    transactions: Mapped[list["Transaction"]] = relationship(
        "Transaction",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    budgets: Mapped[list["Budget"]] = relationship(
        "Budget",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    investments: Mapped[list["Investment"]] = relationship(
        "Investment",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )

# ─── Account ──────────────────────────────────────────────────────────────────
class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[str]                = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[str]           = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    bank_name: Mapped[str]         = mapped_column(String(120))
    card_number_last4: Mapped[str] = mapped_column(String(4))
    balance: Mapped[int]           = mapped_column(BigInteger)   # paise
    expiry: Mapped[str]            = mapped_column(String(5))    # MM/YY
    is_asset: Mapped[bool]         = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime]   = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="accounts")


# ─── Transaction ──────────────────────────────────────────────────────────────
class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str]                  = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[str]             = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    account_id: Mapped[str | None]   = mapped_column(String(36), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str]               = mapped_column(String(200))
    amount: Mapped[int]              = mapped_column(BigInteger)  # paise — always positive
    category: Mapped[str]            = mapped_column(String(50))
    type: Mapped[str]                = mapped_column(String(10))  # "income" | "expense"
    merchant: Mapped[str | None]     = mapped_column(String(150), nullable=True)
    is_recurring: Mapped[bool]       = mapped_column(Boolean, default=False)
    date: Mapped[datetime]           = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime]     = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="transactions")


# ─── Budget ───────────────────────────────────────────────────────────────────
class Budget(Base):
    __tablename__ = "budgets"

    id: Mapped[str]              = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[str]         = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    category: Mapped[str]        = mapped_column(String(50))
    monthly_limit: Mapped[int]   = mapped_column(BigInteger)     # paise
    period: Mapped[str]          = mapped_column(String(20), default="monthly")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="budgets")


# ─── Investment ───────────────────────────────────────────────────────────────
class Investment(Base):
    __tablename__ = "investments"

    id: Mapped[str]                   = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[str]              = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    ticker: Mapped[str]               = mapped_column(String(20))
    type: Mapped[str]                 = mapped_column(String(30))
    quantity: Mapped[float]           = mapped_column(Float)
    avg_price: Mapped[int]            = mapped_column(BigInteger)  # paise per unit
    current_price: Mapped[int]        = mapped_column(BigInteger)  # paise per unit
    price_updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_at: Mapped[datetime]      = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="investments")


# ─── RefreshToken ─────────────────────────────────────────────────────────────
class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[str]              = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[str]         = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str]      = mapped_column(String(64), unique=True, index=True)  # SHA-256 of raw token
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked: Mapped[bool]        = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")
