from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.models import User, Account, Transaction
from app.schemas import (
    BreakdownOut, CategoryTotal,
    TransferReportOut, MonthTransfer,
    NetWorthOut, NetWorthHistoryPoint,
)

router = APIRouter(prefix="/reports", tags=["reports"])


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _month_bounds(year: int, month: int):
    """Return (start, end) datetimes for the given year/month."""
    start = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end = datetime(year, month + 1, 1, tzinfo=timezone.utc)
    return start, end


@router.get("/breakdown", response_model=BreakdownOut)
async def breakdown(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    now         = _utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    async def get_totals(tx_type: str) -> list[CategoryTotal]:
        rows = await db.execute(
            select(Transaction.category, func.sum(Transaction.amount).label("total"))
            .where(
                Transaction.user_id == current_user.id,
                Transaction.type    == tx_type,
                Transaction.date    >= month_start,
            )
            .group_by(Transaction.category)
            .order_by(func.sum(Transaction.amount).desc())
        )
        return [CategoryTotal(category=r.category, total=int(r.total)) for r in rows]

    return BreakdownOut(
        spend_by_category  = await get_totals("expense"),
        income_by_category = await get_totals("income"),
    )


@router.get("/transfers", response_model=TransferReportOut)
async def transfers(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    now     = _utcnow()
    monthly = []

    for i in range(5, -1, -1):
        # compute correct year/month by going back i months from now
        month = now.month - i
        year  = now.year
        while month <= 0:
            month += 12
            year  -= 1

        m_start, m_end = _month_bounds(year, month)   # no closure bug — values are local

        income_total = int(await db.scalar(
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .where(and_(
                Transaction.user_id == current_user.id,
                Transaction.type    == "income",
                Transaction.date    >= m_start,
                Transaction.date    <  m_end,
            ))
        ) or 0)

        expense_total = int(await db.scalar(
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .where(and_(
                Transaction.user_id == current_user.id,
                Transaction.type    == "expense",
                Transaction.date    >= m_start,
                Transaction.date    <  m_end,
            ))
        ) or 0)

        monthly.append(MonthTransfer(
            month   = m_start.strftime("%b"),
            income  = income_total,
            expense = expense_total,
        ))

    return TransferReportOut(
        monthly       = monthly,
        total_income  = sum(m.income  for m in monthly),
        total_expense = sum(m.expense for m in monthly),
    )


@router.get("/net-worth", response_model=NetWorthOut)
async def net_worth(
    period: str = Query("1M", pattern="^(1W|1M|3M|1Y)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    accounts   = (await db.scalars(
        select(Account).where(Account.user_id == current_user.id)
    )).all()
    current_nw = int(sum(a.balance if a.is_asset else -a.balance for a in accounts))

    period_days = {"1W": 7, "1M": 30, "3M": 90, "1Y": 365}
    days        = period_days[period]
    num_points  = 7 if period in ("1W", "1M") else 6
    now         = _utcnow()
    start_date  = now - timedelta(days=days)

    history: list[NetWorthHistoryPoint] = []
    for i in range(num_points + 1):
        point_date = start_date + timedelta(days=i * (days / num_points))
        if   period == "1W": label = point_date.strftime("%a")
        elif period == "1M": label = point_date.strftime("%d")
        elif period == "3M": label = point_date.strftime("%b %d")
        else:                label = point_date.strftime("%b")
        history.append(NetWorthHistoryPoint(label=label, value=current_nw))

    return NetWorthOut(
        net_worth  = current_nw,
        change     = 0,
        change_pct = 0.0,
        history    = history,
    )
