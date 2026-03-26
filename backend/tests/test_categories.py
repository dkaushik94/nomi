"""Tests for categories endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.user import User
from tests.conftest import auth_headers


@pytest.fixture
async def category(db: AsyncSession, active_user: User) -> Category:
    cat = Category(user_id=active_user.id, label="Food", value="food", color="#ff0000")
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat


async def test_list_categories_empty(client: AsyncClient, active_user: User, user_token: str):
    resp = await client.get("/api/v1/categories", headers=auth_headers(user_token))
    assert resp.status_code == 200
    assert resp.json() == []


async def test_create_category(client: AsyncClient, active_user: User, user_token: str):
    resp = await client.post(
        "/api/v1/categories",
        json={"label": "Groceries", "value": "groceries", "color": "#22c55e"},
        headers=auth_headers(user_token),
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["label"] == "Groceries"
    assert data["color"] == "#22c55e"


async def test_create_category_invalid_color(
    client: AsyncClient, active_user: User, user_token: str
):
    resp = await client.post(
        "/api/v1/categories",
        json={"label": "X", "value": "x", "color": "red"},
        headers=auth_headers(user_token),
    )
    assert resp.status_code == 422


async def test_create_category_invalid_label(
    client: AsyncClient, active_user: User, user_token: str
):
    resp = await client.post(
        "/api/v1/categories",
        json={"label": "<script>alert(1)</script>", "value": "x", "color": "#aabbcc"},
        headers=auth_headers(user_token),
    )
    assert resp.status_code == 422


async def test_update_category(
    client: AsyncClient, active_user: User, user_token: str, category: Category
):
    resp = await client.put(
        f"/api/v1/categories/{category.id}",
        json={"label": "Updated"},
        headers=auth_headers(user_token),
    )
    assert resp.status_code == 200
    assert resp.json()["label"] == "Updated"


async def test_delete_category(
    client: AsyncClient, active_user: User, user_token: str, category: Category
):
    resp = await client.delete(
        f"/api/v1/categories/{category.id}", headers=auth_headers(user_token)
    )
    assert resp.status_code == 204


async def test_delete_category_not_found(client: AsyncClient, active_user: User, user_token: str):
    resp = await client.delete("/api/v1/categories/99999", headers=auth_headers(user_token))
    assert resp.status_code == 404


async def test_unauthenticated_access(client: AsyncClient):
    resp = await client.get("/api/v1/categories")
    assert resp.status_code == 401
