"""Users router."""

from datetime import UTC, datetime

import plaid
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.middleware.rate_limit import LIMITS
from app.middleware.rate_limit import user_limiter as limiter
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.user import LinkAccountRequest, SyncTransactionsResponse, UserProfile
from app.services.auth_service import get_current_user
from app.services.plaid_service import create_link_token, exchange_public_token, sync_transactions

router = APIRouter(prefix="/api/v1/users", tags=["users"])
settings = get_settings()


@router.get("/profile", response_model=UserProfile)
async def get_profile(current_user: User = Depends(get_current_user)) -> UserProfile:
    return current_user


@router.post("/link-token", response_model=dict)
async def get_link_token(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Generate a Plaid Link token for the frontend to initialise Plaid Link."""
    token = create_link_token(current_user.id)
    return {"link_token": token}


@router.post("/link-account", response_model=UserProfile)
async def link_account(
    body: LinkAccountRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserProfile:
    """Exchange Plaid public token and store access token."""
    try:
        access_token, item_id = exchange_public_token(body.public_token)
    except plaid.ApiException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Plaid token"
        ) from e
    current_user.plaid_access_token = access_token
    current_user.plaid_item_id = item_id
    current_user.plaid_cursor = None  # Reset cursor on new link
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/sync-transactions", response_model=SyncTransactionsResponse)
@limiter.limit(LIMITS["sync_transactions"])
async def trigger_sync(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SyncTransactionsResponse:
    """Sync latest transactions from Plaid using cursor-based incremental fetch."""
    if not current_user.plaid_access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No bank account linked. Link an account first.",
        )

    result = sync_transactions(current_user.plaid_access_token, current_user.plaid_cursor)

    added_count = 0
    for tx in result["added"]:
        existing = await db.execute(
            select(Transaction).where(Transaction.plaid_transaction_id == tx["transaction_id"])
        )
        if existing.scalar_one_or_none():
            continue

        pfc = tx.get("personal_finance_category") or {}
        db.add(
            Transaction(
                user_id=current_user.id,
                plaid_transaction_id=tx["transaction_id"],
                plaid_account_id=tx["account_id"],
                name=tx.get("name") or "",
                merchant_name=tx.get("merchant_name"),
                amount=tx["amount"],
                currency_code=tx.get("iso_currency_code") or "USD",
                transaction_date=tx["date"],
                authorized_date=tx.get("authorized_date"),
                plaid_category=pfc.get("primary"),
                plaid_category_detailed=pfc.get("detailed"),
                pending=tx.get("pending", False),
                payment_channel=tx.get("payment_channel"),
                logo_url=tx.get("logo_url"),
            )
        )
        added_count += 1

    modified_count = 0
    for tx in result["modified"]:
        row = (
            await db.execute(
                select(Transaction).where(
                    Transaction.plaid_transaction_id == tx["transaction_id"],
                    Transaction.user_id == current_user.id,
                )
            )
        ).scalar_one_or_none()
        if row:
            row.name = tx.get("name") or row.name
            row.amount = tx["amount"]
            row.pending = tx.get("pending", row.pending)
            modified_count += 1

    removed_count = 0
    for tx in result["removed"]:
        row = (
            await db.execute(
                select(Transaction).where(
                    Transaction.plaid_transaction_id == tx["transaction_id"],
                    Transaction.user_id == current_user.id,
                )
            )
        ).scalar_one_or_none()
        if row:
            row.is_deleted = True
            row.delete_requested_at = datetime.now(UTC)
            removed_count += 1

    current_user.plaid_cursor = result["next_cursor"]
    await db.commit()

    return SyncTransactionsResponse(
        added=added_count, modified=modified_count, removed=removed_count
    )


@router.delete("/account", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Soft delete all user data. Slated for hard deletion after 45 days."""
    now = datetime.now(UTC)
    current_user.is_deleted = True
    current_user.delete_requested_at = now

    rows = (
        (
            await db.execute(
                select(Transaction).where(
                    Transaction.user_id == current_user.id,
                    Transaction.is_deleted.is_(False),
                )
            )
        )
        .scalars()
        .all()
    )
    for row in rows:
        row.is_deleted = True
        row.delete_requested_at = now

    await db.commit()
