"""Rate limiting configuration using slowapi."""

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address


def get_user_or_ip(request: Request) -> str:
    """
    Rate-limit key: use the Bearer token (unique per user) for authenticated
    requests, fall back to IP for unauthenticated ones.
    This prevents all users behind the same IP (or all dev traffic from
    localhost) from sharing a single bucket.
    """
    auth: str = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]  # raw token is unique per user session
    return get_remote_address(request)


# Global limiter uses IP (pre-auth, DDoS protection)
limiter = Limiter(key_func=get_remote_address)

# User-scoped limiter for authenticated endpoints
user_limiter = Limiter(key_func=get_user_or_ip)

# Per-endpoint limits
LIMITS = {
    "global": "1000/hour",
    "auth_login": "20/hour",
    "transactions": "200/hour",
    "categories": "200/hour",
    "sync_transactions": "10/hour",
    "admin": "50/hour",
}
