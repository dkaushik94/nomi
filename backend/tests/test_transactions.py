"""Tests for transactions endpoints."""

from datetime import date, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.transaction import Transaction
from app.models.user import User
from tests.conftest import auth_headers


@pytest.fixture
async def transaction(db: AsyncSession, active_user: User) -> Transaction:
    tx = Transaction(
        user_id=active_user.id,
        plaid_transaction_id="plaid-tx-001",
        plaid_account_id="plaid-acc-001",
        name="Whole Foods",
        amount=42.50,
        transaction_date=date.today(),
    )
    db.add(tx)
    await db.commit()
    await db.refresh(tx)
    return tx


@pytest.fixture
async def category(db: AsyncSession, active_user: User) -> Category:
    cat = Category(user_id=active_user.id, label="Food", value="food", color="#22c55e")
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat


async def test_list_transactions_empty(client: AsyncClient, active_user: User, user_token: str):
    resp = await client.get("/api/v1/transactions", headers=auth_headers(user_token))
    assert resp.status_code == 200
    assert resp.json() == []


async def test_list_transactions(
    client: AsyncClient, active_user: User, user_token: str, transaction: Transaction
):
    resp = await client.get("/api/v1/transactions", headers=auth_headers(user_token))
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["name"] == "Whole Foods"


async def test_date_range_validation(client: AsyncClient, active_user: User, user_token: str):
    today = date.today()
    future = today + timedelta(days=1)
    resp = await client.get(
        f"/api/v1/transactions?start_date={future}&end_date={today}",
        headers=auth_headers(user_token),
    )
    assert resp.status_code == 400


async def test_tag_category(
    client: AsyncClient,
    active_user: User,
    user_token: str,
    transaction: Transaction,
    category: Category,
):
    resp = await client.post(
        f"/api/v1/transactions/{transaction.id}/category",
        json={"category_id": category.id},
        headers=auth_headers(user_token),
    )
    assert resp.status_code == 200
    assert resp.json()["custom_category_id"] == category.id


async def test_tag_invalid_category(
    client: AsyncClient, active_user: User, user_token: str, transaction: Transaction
):
    resp = await client.post(
        f"/api/v1/transactions/{transaction.id}/category",
        json={"category_id": 99999},
        headers=auth_headers(user_token),
    )
    assert resp.status_code == 404


async def test_soft_delete_transaction(
    client: AsyncClient, active_user: User, user_token: str, transaction: Transaction
):
    resp = await client.delete(
        f"/api/v1/transactions/{transaction.id}", headers=auth_headers(user_token)
    )
    assert resp.status_code == 204

    # Should no longer appear in listing
    list_resp = await client.get("/api/v1/transactions", headers=auth_headers(user_token))
    assert list_resp.status_code == 200
    assert list_resp.json() == []
