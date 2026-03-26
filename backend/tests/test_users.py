"""Tests for user profile and account management endpoints."""

from unittest.mock import patch

import plaid
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers


async def test_get_profile(client: AsyncClient, active_user: User, user_token: str):
    resp = await client.get("/api/v1/users/profile", headers=auth_headers(user_token))
    assert resp.status_code == 200
    assert resp.json()["email"] == active_user.email


async def test_get_profile_unauthenticated(client: AsyncClient):
    resp = await client.get("/api/v1/users/profile")
    assert resp.status_code == 401


async def test_delete_account(client: AsyncClient, active_user: User, user_token: str):
    resp = await client.delete("/api/v1/users/account", headers=auth_headers(user_token))
    assert resp.status_code == 204

    # Subsequent requests with same token should fail
    resp2 = await client.get("/api/v1/users/profile", headers=auth_headers(user_token))
    assert resp2.status_code == 401


async def test_link_account_without_plaid_credentials(
    client: AsyncClient, active_user: User, user_token: str
):
    """Route returns 400 when Plaid rejects the public token."""
    with patch(
        "app.routers.users.exchange_public_token",
        side_effect=plaid.ApiException(status=400, reason="INVALID_PUBLIC_TOKEN"),
    ):
        resp = await client.post(
            "/api/v1/users/link-account",
            json={"public_token": "public-sandbox-abc-123"},
            headers=auth_headers(user_token),
        )
    assert resp.status_code == 400


async def test_link_account_invalid_token(client: AsyncClient, active_user: User, user_token: str):
    resp = await client.post(
        "/api/v1/users/link-account",
        json={"public_token": ""},
        headers=auth_headers(user_token),
    )
    assert resp.status_code == 422
