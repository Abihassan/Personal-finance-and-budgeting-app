from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.models import User, Investment
from app.schemas import InvestmentCreate, InvestmentOut, InvestmentsListOut, ChartPoint

router = APIRouter(prefix="/investments", tags=["investments"])


@router.get("", response_model=InvestmentsListOut)
async def list_investments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = (await db.scalars(
        select(Investment)
        .where(Investment.user_id == current_user.id)
        .order_by(Investment.created_at.desc())
    )).all()

    from datetime import datetime, timezone
    now    = datetime.now(timezone.utc)
    months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

    monthly_earnings: list[ChartPoint] = []
    for i in range(5, -1, -1):
        month_idx = (now.month - 1 - i) % 12
        total_pl  = sum(
            int((inv.current_price - inv.avg_price) * inv.quantity)
            for inv in rows
        )
        factor = max(0.0, 1.0 - i * 0.08)
        monthly_earnings.append(ChartPoint(label=months[month_idx], value=max(0, int(total_pl * factor))))

    return InvestmentsListOut(investments=list(rows), monthly_earnings=monthly_earnings)


@router.post("", response_model=InvestmentOut, status_code=201)
async def create_investment(
    body: InvestmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    inv = Investment(user_id=current_user.id, **body.model_dump())
    db.add(inv)
    await db.commit()
    await db.refresh(inv)
    return inv


@router.delete("/{inv_id}", status_code=204)
async def delete_investment(
    inv_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    inv = await db.scalar(
        select(Investment).where(Investment.id == inv_id, Investment.user_id == current_user.id)
    )
    if not inv:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Investment not found")
    await db.delete(inv)
    await db.commit()
