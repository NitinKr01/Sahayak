import urllib.parse
from typing import Optional
from uuid import uuid4

import requests
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from pydantic import BaseModel

from ..auth import (
    STATE_COOKIE,
    STATE_MAX_AGE,
    clear_session_cookie,
    create_session_token,
    get_current_user,
    set_session_cookie,
)
from ..config import get_settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/login-url")
def login_url(response: Response):
    """Build the Cognito Hosted UI URL and pin the CSRF state in a cookie."""
    s = get_settings()
    state = str(uuid4())
    url = f"https://{s.COGNITO_DOMAIN}/oauth2/authorize?" + urllib.parse.urlencode(
        {
            "response_type": "code",
            "client_id": s.CLIENT_ID,
            "redirect_uri": s.REDIRECT_URI,
            "state": state,
            "scope": "openid email phone",
        }
    )
    response.set_cookie(
        STATE_COOKIE,
        state,
        max_age=STATE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=s.COOKIE_SECURE,
        path="/",
    )
    return {"url": url}


class CallbackBody(BaseModel):
    code: str
    state: str


@router.post("/callback")
def callback(
    body: CallbackBody,
    response: Response,
    oauth_state: Optional[str] = Cookie(default=None, alias=STATE_COOKIE),
):
    """Exchange the authorization code for tokens and set the session cookie."""
    s = get_settings()
    if not oauth_state or oauth_state != body.state:
        raise HTTPException(status_code=400, detail="CSRF token mismatch. Please try login again.")

    token_resp = requests.post(
        s.TOKEN_URL,
        data={
            "grant_type": "authorization_code",
            "client_id": s.CLIENT_ID,
            "code": body.code,
            "redirect_uri": s.REDIRECT_URI,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=20,
    )
    if not token_resp.ok:
        raise HTTPException(status_code=401, detail=f"Login failed (HTTP): {token_resp.text}")

    access_token = token_resp.json().get("access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="Login failed: No access token received.")

    uinfo = requests.get(
        s.USERINFO_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=20,
    ).json()

    user = {
        "email": uinfo.get("email") or uinfo.get("username") or "user@bandhanlife.com",
    }
    set_session_cookie(response, create_session_token(user))
    response.delete_cookie(STATE_COOKIE, path="/")
    return {"user": user}


@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    return {"user": user}


@router.post("/logout")
def logout(response: Response):
    clear_session_cookie(response)
    return {"ok": True}
