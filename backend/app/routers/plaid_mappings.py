"""Plaid category → custom category mapping router."""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rate_limit import LIMITS, user_limiter as limiter
from app.models.category import Category
from app.models.plaid_mapping import CategoryPlaidMapping
from app.models.user import User
from app.schemas.plaid_mapping import PlaidMappingOut, PlaidMappingUpsert
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/v1/plaid-mappings", tags=["plaid-mappings"])


@router.get("", response_model=list[PlaidMappingOut])
@limiter.limit(LIMITS["categories"])
async def list_mappings(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PlaidMappingOut]:
    """Return all Plaid→custom-category mappings for the current user."""
    result = await db.execute(
        select(CategoryPlaidMapping).where(CategoryPlaidMapping.user_id == current_user.id)
    )
    return result.scalars().all()


@router.post("", response_model=PlaidMappingOut, status_code=status.HTTP_200_OK)
@limiter.limit(LIMITS["categories"])
async def upsert_mapping(
    request: Request,
    body: PlaidMappingUpsert,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PlaidMappingOut:
    """
    Assign a Plaid primary category to a custom category.
    If the Plaid category was already mapped to a different custom category,
    the old mapping is replaced.
    """
    # Verify the target custom category belongs to this user
    cat_result = await db.execute(
        select(Category).where(
            Category.id == body.custom_category_id,
            Category.user_id == current_user.id,
        )
    )
    if not cat_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    # Delete any existing mapping for this plaid_category (from any custom category)
    existing = await db.execute(
        select(CategoryPlaidMapping).where(
            CategoryPlaidMapping.user_id == current_user.id,
            CategoryPlaidMapping.plaid_category == body.plaid_category,
        )
    )
    row = existing.scalar_one_or_none()
    if row:
        await db.delete(row)
        await db.flush()

    # Create new mapping
    new_mapping = CategoryPlaidMapping(
        user_id=current_user.id,
        custom_category_id=body.custom_category_id,
        plaid_category=body.plaid_category,
    )
    db.add(new_mapping)
    await db.commit()
    await db.refresh(new_mapping)
    return new_mapping


@router.delete("/{plaid_category}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(LIMITS["categories"])
async def delete_mapping(
    request: Request,
    plaid_category: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Remove a Plaid→custom-category mapping."""
    result = await db.execute(
        select(CategoryPlaidMapping).where(
            CategoryPlaidMapping.user_id == current_user.id,
            CategoryPlaidMapping.plaid_category == plaid_category,
        )
    )
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mapping not found")
    await db.delete(row)
    await db.commit()
