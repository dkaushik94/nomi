"""Tests for admin endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from tests.conftest import auth_headers


@pytest.fixture
async def waitlisted_user(db: AsyncSession) -> User:
    user = User(supabase_uid="waitlist-uid", email="waitlisted@example.com", is_active=False)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def test_get_waitlist(
    client: AsyncClient, admin_user: User, admin_token: str, waitlisted_user: User
):
    resp = await client.get("/api/v1/admin/waitlist", headers=auth_headers(admin_token))
    assert resp.status_code == 200
    emails = [u["email"] for u in resp.json()]
    assert waitlisted_user.email in emails


async def test_get_waitlist_non_admin(client: AsyncClient, active_user: User, user_token: str):
    resp = await client.get("/api/v1/admin/waitlist", headers=auth_headers(user_token))
    assert resp.status_code == 403


async def test_approve_user(
    client: AsyncClient, admin_user: User, admin_token: str, waitlisted_user: User
):
    resp = await client.post(
        f"/api/v1/admin/approve/{waitlisted_user.id}", headers=auth_headers(admin_token)
    )
    assert resp.status_code == 200


async def test_approve_already_active_user(
    client: AsyncClient, admin_user: User, admin_token: str, active_user: User
):
    resp = await client.post(
        f"/api/v1/admin/approve/{active_user.id}", headers=auth_headers(admin_token)
    )
    assert resp.status_code == 400


async def test_purge_user(
    client: AsyncClient, admin_user: User, admin_token: str, waitlisted_user: User
):
    resp = await client.delete(
        f"/api/v1/admin/purge/{waitlisted_user.id}", headers=auth_headers(admin_token)
    )
    assert resp.status_code == 204


async def test_purge_own_account_blocked(client: AsyncClient, admin_user: User, admin_token: str):
    resp = await client.delete(
        f"/api/v1/admin/purge/{admin_user.id}", headers=auth_headers(admin_token)
    )
    assert resp.status_code == 400
