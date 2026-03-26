"""Categories router."""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rate_limit import LIMITS
from app.middleware.rate_limit import user_limiter as limiter
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryOut, CategoryUpdate
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/v1/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
@limiter.limit(LIMITS["categories"])
async def list_categories(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CategoryOut]:
    result = await db.execute(
        select(Category).where(Category.user_id == current_user.id).order_by(Category.label)
    )
    return result.scalars().all()


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
@limiter.limit(LIMITS["categories"])
async def create_category(
    request: Request,
    body: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CategoryOut:
    category = Category(
        user_id=current_user.id,
        label=body.label,
        value=body.value,
        color=body.color,
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.put("/{category_id}", response_model=CategoryOut)
@limiter.limit(LIMITS["categories"])
async def update_category(
    request: Request,
    category_id: int,
    body: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CategoryOut:
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.user_id == current_user.id)
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    if body.label is not None:
        category.label = body.label
    if body.value is not None:
        category.value = body.value
    if body.color is not None:
        category.color = body.color

    await db.commit()
    await db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(LIMITS["categories"])
async def delete_category(
    request: Request,
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a category and reassign its transactions to no category (default)."""
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.user_id == current_user.id)
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    # Reassign transactions to no category
    tx_result = await db.execute(
        select(Transaction).where(
            Transaction.custom_category_id == category_id,
            Transaction.user_id == current_user.id,
        )
    )
    for tx in tx_result.scalars().all():
        tx.custom_category_id = None

    await db.delete(category)
    await db.commit()
