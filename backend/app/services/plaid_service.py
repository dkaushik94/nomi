"""Plaid API integration service."""

import plaid
from plaid.api import plaid_api
from plaid.model.country_code import CountryCode
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.transactions_sync_request import TransactionsSyncRequest

from app.config import get_settings

settings = get_settings()

_ENV_MAP = {
    "sandbox": plaid.Environment.Sandbox,
    "production": plaid.Environment.Sandbox,  # Plaid production environment requires special access
    "development": plaid.Environment.Sandbox,  # Plaid development environment is same as sandbox
}


def _get_client() -> plaid_api.PlaidApi:
    configuration = plaid.Configuration(
        host=_ENV_MAP.get(settings.plaid_env, plaid.Environment.Sandbox),
        api_key={
            "clientId": settings.plaid_client_id,
            "secret": settings.plaid_secret,
        },
    )
    return plaid_api.PlaidApi(plaid.ApiClient(configuration))


def create_link_token(user_id: int) -> str:
    """Create a Plaid Link token for the given user. Returns the link_token string."""
    client = _get_client()
    request = LinkTokenCreateRequest(
        user=LinkTokenCreateRequestUser(client_user_id=str(user_id)),
        client_name="Dobby",
        products=[Products("transactions")],
        country_codes=[CountryCode("US")],
        language="en",
    )
    response = client.link_token_create(request)
    return response["link_token"]


def exchange_public_token(public_token: str) -> tuple[str, str]:
    """Exchange Plaid public token for access token. Returns (access_token, item_id)."""
    client = _get_client()
    request = ItemPublicTokenExchangeRequest(public_token=public_token)
    response = client.item_public_token_exchange(request)
    return response["access_token"], response["item_id"]


def sync_transactions(access_token: str, cursor: str | None) -> dict:
    """
    Fetch incremental transaction updates using cursor-based sync.
    Returns dict with added, modified, removed lists and next cursor.
    """
    client = _get_client()
    added, modified, removed = [], [], []
    has_more = True
    next_cursor = cursor

    while has_more:
        request = TransactionsSyncRequest(
            access_token=access_token,
            **({"cursor": next_cursor} if next_cursor else {}),
        )
        response = client.transactions_sync(request)

        # Convert SDK objects to plain dicts for uniform handling
        added.extend([t.to_dict() for t in response["added"]])
        modified.extend([t.to_dict() for t in response["modified"]])
        removed.extend([t.to_dict() for t in response["removed"]])
        has_more = response["has_more"]
        next_cursor = response["next_cursor"]

    return {
        "added": added,
        "modified": modified,
        "removed": removed,
        "next_cursor": next_cursor,
    }
