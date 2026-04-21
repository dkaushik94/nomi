"""Rate limiting — disabled. Decorators kept in place for easy re-enable."""

from fastapi import Request
from slowapi.util import get_remote_address


def get_user_or_ip(request: Request) -> str:
    auth: str = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return get_remote_address(request)


class _NoopLimiter:
    """Drop-in replacement for slowapi.Limiter that does nothing."""

    def limit(self, *_args, **_kwargs):
        def decorator(func):
            return func

        return decorator


limiter = _NoopLimiter()
user_limiter = _NoopLimiter()

LIMITS = {
    "global": "1000/hour",
    "auth_login": "20/hour",
    "transactions": "200/hour",
    "categories": "200/hour",
    "sync_transactions": "10/hour",
    "admin": "50/hour",
}
