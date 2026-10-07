"""Session-cookie auth: signed httpOnly cookie set after the Cognito code
exchange. Tokens themselves are never sent to the browser."""
from typing import Optional

from fastapi import Cookie, HTTPException
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from .config import get_settings

SESSION_COOKIE = "sahayak_session"
STATE_COOKIE = "sahayak_oauth_state"
SESSION_MAX_AGE = 60 * 60 * 24  # 24 hours
STATE_MAX_AGE = 60 * 10  # 10 minutes to complete the login redirect


def _serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(get_settings().SESSION_SECRET, salt="sahayak-session")


def create_session_token(user: dict) -> str:
    return _serializer().dumps(user)


def read_session_token(token: str) -> Optional[dict]:
    try:
        return _serializer().loads(token, max_age=SESSION_MAX_AGE)
    except (BadSignature, SignatureExpired):
        return None


def get_current_user(
    session: Optional[str] = Cookie(default=None, alias=SESSION_COOKIE),
) -> dict:
    """FastAPI dependency guarding all authenticated routes."""
    user = read_session_token(session) if session else None
    if not user or not user.get("email"):
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def set_session_cookie(response, token: str):
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=SESSION_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=get_settings().COOKIE_SECURE,
        path="/",
    )


def clear_session_cookie(response):
    response.delete_cookie(SESSION_COOKIE, path="/")
