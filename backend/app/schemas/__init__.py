"""All schemas — auth, accounts, transactions, budgets, investments, reports, AI."""
from __future__ import annotations
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, Field


# ─── Auth ─────────────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    name:     str      = Field(min_length=1, max_length=120)
    email:    EmailStr
    password: str      = Field(min_length=8)


class LoginRequest(BaseModel):
    email:    EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id:    str
    name:  str
    email: str


class TokenResponse(BaseModel):
    access_token:  str
    refresh_token: str
    token_type:    str = "bearer"
    user:          UserOut


# ─── Accounts ─────────────────────────────────────────────────────────────────
class AccountCreate(BaseModel):
    bank_name:         str  = Field(min_length=1, max_length=120)
    card_number_last4: str  = Field(min_length=4, max_length=4)
    balance:           int                         # paise
    expiry:            str  = Field(pattern=r"^\d{2}/\d{2}$")
    is_asset:          bool = True


class AccountOut(BaseModel):
    id:                str
    bank_name:         str
    card_number_last4: str
    balance:           int
    expiry:            str
    is_asset:          bool
    created_at:        datetime

    model_config = {"from_attributes": True}


# ─── Transactions ─────────────────────────────────────────────────────────────
class TransactionCreate(BaseModel):
    title:        str      = Field(min_length=1, max_length=200)
    amount:       int      = Field(gt=0)          # paise
    category:     str
    type:         Literal["income", "expense"]
    merchant:     Optional[str] = None
    is_recurring: bool          = False
    date:         datetime
    account_id:   Optional[str] = None


class TransactionOut(BaseModel):
    id:           str
    title:        str
    amount:       int
    category:     str
    type:         str
    merchant:     Optional[str]
    is_recurring: bool
    date:         datetime
    created_at:   datetime

    model_config = {"from_attributes": True}


class ChartPoint(BaseModel):
    label: str
    value: int


class TransactionsListOut(BaseModel):
    transactions:  list[TransactionOut]
    monthly_chart: list[ChartPoint]
    weekly_total:  int
    month_total:   int


# ─── Budgets ──────────────────────────────────────────────────────────────────
class BudgetCreate(BaseModel):
    category:      str
    monthly_limit: int = Field(gt=0)              # paise
    period:        str = "monthly"


class BudgetOut(BaseModel):
    id:            str
    category:      str
    monthly_limit: int
    period:        str
    created_at:    datetime

    model_config = {"from_attributes": True}


class BudgetsListOut(BaseModel):
    budgets: list[BudgetOut]


# ─── Investments ──────────────────────────────────────────────────────────────
class InvestmentCreate(BaseModel):
    ticker:        str   = Field(min_length=1, max_length=20)
    type:          str
    quantity:      float = Field(gt=0)
    avg_price:     int   = Field(gt=0)            # paise
    current_price: int   = Field(gt=0)            # paise


class InvestmentOut(BaseModel):
    id:               str
    ticker:           str
    type:             str
    quantity:         float
    avg_price:        int
    current_price:    int
    price_updated_at: datetime
    created_at:       datetime

    model_config = {"from_attributes": True}


class InvestmentsListOut(BaseModel):
    investments:      list[InvestmentOut]
    monthly_earnings: list[ChartPoint]


# ─── Reports ──────────────────────────────────────────────────────────────────
class CategoryTotal(BaseModel):
    category: str
    total:    int


class BreakdownOut(BaseModel):
    spend_by_category:  list[CategoryTotal]
    income_by_category: list[CategoryTotal]


class MonthTransfer(BaseModel):
    month:   str
    income:  int
    expense: int


class TransferReportOut(BaseModel):
    monthly:       list[MonthTransfer]
    total_income:  int
    total_expense: int


class NetWorthHistoryPoint(BaseModel):
    label: str
    value: int


class NetWorthOut(BaseModel):
    net_worth:  int
    change:     int
    change_pct: float
    history:    list[NetWorthHistoryPoint]


# ─── AI Chat ──────────────────────────────────────────────────────────────────
class ChatMessageIn(BaseModel):
    role:    Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessageIn]
