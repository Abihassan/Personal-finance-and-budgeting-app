from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.models import User, Budget
from app.schemas import BudgetCreate, BudgetOut, BudgetsListOut

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("", response_model=BudgetsListOut)
async def list_budgets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = (await db.scalars(
        select(Budget)
        .where(Budget.user_id == current_user.id)
        .order_by(Budget.created_at.asc())
    )).all()
    return BudgetsListOut(budgets=list(rows))


@router.post("", response_model=BudgetOut, status_code=201)
async def create_budget(
    body: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Upsert: same category → update limit
    existing = await db.scalar(
        select(Budget).where(
            Budget.user_id == current_user.id,
            Budget.category == body.category,
        )
    )
    if existing:
        existing.monthly_limit = body.monthly_limit
        existing.period        = body.period
        await db.commit()
        await db.refresh(existing)
        return existing

    budget = Budget(user_id=current_user.id, **body.model_dump())
    db.add(budget)
    await db.commit()
    await db.refresh(budget)
    return budget


@router.delete("/{budget_id}", status_code=204)
async def delete_budget(
    budget_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    budget = await db.scalar(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == current_user.id)
    )
    if not budget:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Budget not found")
    await db.delete(budget)
    await db.commit()
