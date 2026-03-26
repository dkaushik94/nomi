"""Authentication router — Google OAuth via Supabase."""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.middleware.rate_limit import LIMITS, limiter
from app.models.user import User
from app.services.auth_service import create_access_token

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
settings = get_settings()


class GoogleCallbackPayload(BaseModel):
    supabase_uid: str
    email: EmailStr
    access_token: str  # Supabase JWT we verify


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/google", response_model=TokenResponse)
@limiter.limit(LIMITS["auth_login"])
async def google_callback(
    request: Request,
    payload: GoogleCallbackPayload,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """
    Called by the frontend after successful Supabase Google OAuth.
    Creates or retrieves the user, enforces the user cap, issues our JWT.
    """
    # Check if user already exists
    result = await db.execute(select(User).where(User.supabase_uid == payload.supabase_uid))
    user = result.scalar_one_or_none()

    if user and user.is_deleted:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is pending deletion")

    if not user:
        # Enforce user cap
        active_count_result = await db.execute(
            select(func.count()).select_from(User).where(User.is_deleted.is_(False))
        )
        active_count = active_count_result.scalar_one()

        if active_count >= settings.max_users:
            # Waitlist: create inactive user
            user = User(
                supabase_uid=payload.supabase_uid,
                email=payload.email,
                is_active=False,
            )
            db.add(user)
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="System at capacity. You have been added to the waitlist.",
            )

        is_admin = payload.email in settings.admin_email_list
        user = User(
            supabase_uid=payload.supabase_uid,
            email=payload.email,
            is_admin=is_admin,
            is_active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is on the waitlist. Please wait for admin approval.",
        )

    token = create_access_token({"sub": user.supabase_uid, "email": user.email})
    return TokenResponse(access_token=token)
