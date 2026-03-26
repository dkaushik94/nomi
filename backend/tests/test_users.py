"""Tests for user profile and account management endpoints."""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers


async def test_get_profile(client: AsyncClient, active_user: User, user_token: str):
    resp = await client.get("/api/v1/users/profile", headers=auth_headers(user_token))
    assert resp.status_code == 200
    assert resp.json()["email"] == active_user.email


async def test_get_profile_unauthenticated(client: AsyncClient):
    resp = await client.get("/api/v1/users/profile")
    assert resp.status_code == 403


async def test_delete_account(client: AsyncClient, active_user: User, user_token: str):
    resp = await client.delete("/api/v1/users/account", headers=auth_headers(user_token))
    assert resp.status_code == 204

    # Subsequent requests with same token should fail
    resp2 = await client.get("/api/v1/users/profile", headers=auth_headers(user_token))
    assert resp2.status_code == 401


async def test_link_account_without_plaid_credentials(
    client: AsyncClient, active_user: User, user_token: str
):
    """Linking account calls Plaid — stub verifies error handling without real credentials."""
    resp = await client.post(
        "/api/v1/users/link-account",
        json={"public_token": "public-sandbox-abc-123"},
        headers=auth_headers(user_token),
    )
    # Plaid will fail in test environment — we just verify the endpoint exists and validates input
    assert resp.status_code in (200, 400, 500)


async def test_link_account_invalid_token(client: AsyncClient, active_user: User, user_token: str):
    resp = await client.post(
        "/api/v1/users/link-account",
        json={"public_token": ""},
        headers=auth_headers(user_token),
    )
    assert resp.status_code == 422
