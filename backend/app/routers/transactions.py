"""Transactions router."""

from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rate_limit import LIMITS
from app.middleware.rate_limit import user_limiter as limiter
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import TransactionCategoryUpdate, TransactionOut
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/v1/transactions", tags=["transactions"])


@router.get("", response_model=list[TransactionOut])
@limiter.limit(LIMITS["transactions"])
async def list_transactions(
    request: Request,
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    limit: int | None = Query(default=None, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TransactionOut]:
    """Return transactions filtered by date range. Supports optional limit/offset pagination."""
    today = date.today()
    effective_start = start_date or today.replace(day=1)
    effective_end = end_date or today

    if effective_end < effective_start:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="end_date must be >= start_date"
        )
    if (effective_end - effective_start).days > 366:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Date range cannot exceed 366 days"
        )

    q = (
        select(Transaction)
        .where(
            Transaction.user_id == current_user.id,
            Transaction.is_deleted.is_(False),
            Transaction.transaction_date >= effective_start,
            Transaction.transaction_date <= effective_end,
        )
        .order_by(Transaction.transaction_date.desc(), Transaction.id.desc())
        .offset(offset)
    )
    if limit is not None:
        q = q.limit(limit)

    result = await db.execute(q)
    return result.scalars().all()


@router.post("/{transaction_id}/category", response_model=TransactionOut)
@limiter.limit(LIMITS["transactions"])
async def tag_transaction_category(
    request: Request,
    transaction_id: int,
    body: TransactionCategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TransactionOut:
    """Tag a transaction with a custom category."""
    tx_result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id,
            Transaction.is_deleted.is_(False),
        )
    )
    tx = tx_result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    cat_result = await db.execute(
        select(Category).where(
            Category.id == body.category_id,
            Category.user_id == current_user.id,
        )
    )
    category = cat_result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    tx.custom_category_id = body.category_id
    await db.commit()
    await db.refresh(tx)
    return tx


@router.delete("/{transaction_id}/category", status_code=status.HTTP_200_OK)
@limiter.limit(LIMITS["transactions"])
async def clear_transaction_category(
    request: Request,
    transaction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Remove the custom category tag from a transaction."""
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id,
            Transaction.is_deleted.is_(False),
        )
    )
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    tx.custom_category_id = None
    await db.commit()
    return {"message": "Category cleared"}


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(LIMITS["transactions"])
async def soft_delete_transaction(
    request: Request,
    transaction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Soft delete a transaction (marked for 45-day retention)."""
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id,
            Transaction.is_deleted.is_(False),
        )
    )
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    tx.is_deleted = True
    tx.delete_requested_at = datetime.now(UTC)
    await db.commit()
