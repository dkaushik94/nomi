"""Admin router — no access to user financial data."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rate_limit import LIMITS, user_limiter as limiter
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.user import WaitlistEntry
from app.services.auth_service import require_admin

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.get("/waitlist", response_model=list[WaitlistEntry])
@limiter.limit(LIMITS["admin"])
async def get_waitlist(
    request: Request,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[WaitlistEntry]:
    """Return list of waitlisted (inactive, non-deleted) users."""
    result = await db.execute(
        select(User).where(User.is_active.is_(False), User.is_deleted.is_(False)).order_by(User.created_at)
    )
    return result.scalars().all()


@router.post("/approve/{user_id}", status_code=status.HTTP_200_OK)
@limiter.limit(LIMITS["admin"])
async def approve_user(
    request: Request,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict:
    """Activate a waitlisted user."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already active")

    user.is_active = True
    await db.commit()
    return {"message": f"User {user.email} approved"}


@router.delete("/purge/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(LIMITS["admin"])
async def purge_user(
    request: Request,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> None:
    """
    Hard delete all data for a user (admin only, on user request).
    Admin cannot see user financial data — only performs the purge.
    """
    if user_id == admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot purge your own account")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Hard delete in dependency order
    tx_result = await db.execute(select(Transaction).where(Transaction.user_id == user_id))
    for tx in tx_result.scalars().all():
        await db.delete(tx)

    cat_result = await db.execute(select(Category).where(Category.user_id == user_id))
    for cat in cat_result.scalars().all():
        await db.delete(cat)

    await db.delete(user)
    await db.commit()
