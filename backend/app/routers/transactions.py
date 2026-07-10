from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.models import User, Transaction
from app.schemas import TransactionCreate, TransactionOut, TransactionsListOut, ChartPoint

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


@router.get("", response_model=TransactionsListOut)
async def list_transactions(
    type: Optional[str] = Query(None, pattern="^(income|expense)$"),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    now = _utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    week_start  = now - timedelta(days=now.weekday())

    # Base filter
    filters = [Transaction.user_id == current_user.id]
    if type:
        filters.append(Transaction.type == type)

    rows = (await db.scalars(
        select(Transaction)
        .where(and_(*filters))
        .order_by(Transaction.date.desc())
        .limit(limit)
    )).all()

    # Monthly totals (last 6 months for chart)
    monthly_chart: list[ChartPoint] = []
    for i in range(5, -1, -1):
        # compute month boundary
        pivot = (now.replace(day=1) - timedelta(days=1)).replace(day=1) if i > 0 else month_start
        if i == 0:
            m_start = month_start
            m_end   = now
        else:
            # go back i months
            year  = now.year
            month = now.month - i
            while month <= 0:
                month += 12
                year  -= 1
            m_start = now.replace(year=year, month=month, day=1, hour=0, minute=0, second=0, microsecond=0)
            next_m  = m_start.replace(month=m_start.month % 12 + 1) if m_start.month < 12 \
                      else m_start.replace(year=m_start.year + 1, month=1)
            m_end = next_m

        q_filters = [
            Transaction.user_id == current_user.id,
            Transaction.date >= m_start,
            Transaction.date < m_end,
        ]
        if type:
            q_filters.append(Transaction.type == type)

        total = await db.scalar(
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .where(and_(*q_filters))
        ) or 0

        label = m_start.strftime("%b")
        monthly_chart.append(ChartPoint(label=label, value=int(total)))

    # Weekly total
    weekly_filters = [
        Transaction.user_id == current_user.id,
        Transaction.date >= week_start,
    ]
    if type:
        weekly_filters.append(Transaction.type == type)

    weekly_total = await db.scalar(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(and_(*weekly_filters))
    ) or 0

    # Month total
    month_filters = [
        Transaction.user_id == current_user.id,
        Transaction.date >= month_start,
    ]
    if type:
        month_filters.append(Transaction.type == type)

    month_total = await db.scalar(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(and_(*month_filters))
    ) or 0

    return TransactionsListOut(
        transactions=list(rows),
        monthly_chart=monthly_chart,
        weekly_total=int(weekly_total),
        month_total=int(month_total),
    )


@router.post("", response_model=TransactionOut, status_code=201)
async def create_transaction(
    body: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tx = Transaction(user_id=current_user.id, **body.model_dump())
    db.add(tx)
    await db.commit()
    await db.refresh(tx)
    return tx


@router.delete("/{tx_id}", status_code=204)
async def delete_transaction(
    tx_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tx = await db.scalar(
        select(Transaction).where(Transaction.id == tx_id, Transaction.user_id == current_user.id)
    )
    if not tx:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Transaction not found")
    await db.delete(tx)
    await db.commit()
