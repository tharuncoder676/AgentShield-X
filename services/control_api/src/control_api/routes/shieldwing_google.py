"""User-authorized, read-only Google Workspace connector."""

import base64
import asyncio
import hashlib
import json
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Literal
from urllib.parse import urlencode, urlsplit

import httpx
from fastapi import APIRouter, Cookie, HTTPException, Query, Response
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field

from control_api.connectors.dependencies import Owner
from control_api.connectors.storage import connection_store

router = APIRouter(tags=["shieldwing", "connectors"])

GOOGLE_SCOPES = {
    "gmail": "https://www.googleapis.com/auth/gmail.metadata",
    "calendar": "https://www.googleapis.com/auth/calendar.events.owned.readonly",
}
GoogleService = Literal["gmail", "calendar"]


class GoogleAuthorizationRequest(BaseModel):
    services: list[GoogleService] = Field(min_length=1, max_length=2)


google_store = connection_store


def google_config() -> tuple[str, str, str]:
    client_id = os.getenv("GOOGLE_CLIENT_ID", "").strip()
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "").strip()
    if not client_id or not client_secret or not redirect_uri:
        raise HTTPException(503, "Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.")
    parsed_redirect = urlsplit(redirect_uri)
    local_http = parsed_redirect.scheme == "http" and parsed_redirect.hostname in {"localhost", "127.0.0.1", "::1"}
    if parsed_redirect.scheme != "https" and not local_http:
        raise HTTPException(503, "Google OAuth redirect URI must use HTTPS, except for localhost development.")
    if parsed_redirect.path != "/v1/shieldwing/google/callback" or parsed_redirect.query or parsed_redirect.fragment:
        raise HTTPException(503, "Google OAuth redirect URI must exactly match the registered callback endpoint.")
    return client_id, client_secret, redirect_uri


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _frontend_redirect(status: str) -> RedirectResponse:
    base = os.getenv("CONSOLE_BASE_URL", "http://localhost:3000").rstrip("/")
    parsed = urlsplit(base)
    local_http = parsed.scheme == "http" and parsed.hostname in {"localhost", "127.0.0.1", "::1"}
    if parsed.scheme != "https" and not local_http:
        raise HTTPException(500, "CONSOLE_BASE_URL must use HTTPS, except for localhost development.")
    response = RedirectResponse(f"{base}/connected-tools?google={status}", status_code=303)
    response.delete_cookie("agentshield_google_oauth_state", path="/v1/shieldwing/google/callback")
    return response


async def verify_google_grant(access_token: str, scopes: set[str]) -> bool:
    """Run a metadata-only provider check for each newly authorized service."""
    checks = []
    if GOOGLE_SCOPES["gmail"] in scopes:
        checks.append(("https://gmail.googleapis.com/gmail/v1/users/me/profile", {}))
    if GOOGLE_SCOPES["calendar"] in scopes:
        checks.append((
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            {"timeMin": _utc_now().isoformat().replace("+00:00", "Z"), "maxResults": 1,
             "singleEvents": "true", "orderBy": "startTime"},
        ))
    try:
        async with httpx.AsyncClient(timeout=12, follow_redirects=False) as client:
            for url, params in checks:
                response = await client.get(url, headers={"Authorization": f"Bearer {access_token}"}, params=params)
                if response.status_code != 200:
                    return False
        return bool(checks)
    except httpx.RequestError:
        return False


@router.get("/v1/shieldwing/workspaces/{workspace_id}/google")
def get_google_connection(owner: Owner):
    with google_store() as (conn, _):
        row = conn.execute(
            "SELECT scopes, authorized_at, status FROM google_connections WHERE workspace_id = ? AND user_id = ?",
            owner,
        ).fetchone()
    scopes = json.loads(row[0]) if row else []
    status = row[2] if row else "disconnected"
    return {
        "connected": status == "connected",
        "services": [name for name, scope in GOOGLE_SCOPES.items() if scope in scopes] if status == "connected" else [],
        "scopes": scopes,
        "authorized_at": row[1] if row else None,
        "status": status,
    }


@router.post("/v1/shieldwing/workspaces/{workspace_id}/google/authorize")
def start_google_authorization(body: GoogleAuthorizationRequest, owner: Owner, response: Response):
    client_id, _, redirect_uri = google_config()
    if len(set(body.services)) != len(body.services):
        raise HTTPException(422, "Choose each Google service only once.")

    selected = {GOOGLE_SCOPES[service] for service in body.services}
    with google_store() as (conn, cipher):
        existing = conn.execute(
            "SELECT credential, scopes FROM google_connections WHERE workspace_id = ? AND user_id = ?", owner
        ).fetchone()
        if existing:
            selected.update(json.loads(existing[1]))
        state = secrets.token_urlsafe(32)
        verifier = secrets.token_urlsafe(64)
        challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
        now = _utc_now()
        conn.execute("DELETE FROM google_oauth_pending WHERE expires_at <= ?", (now.isoformat(),))
        conn.execute(
            """INSERT INTO google_oauth_pending
               (state_hash, workspace_id, user_id, verifier, requested_scopes, expires_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (hashlib.sha256(state.encode()).hexdigest(), *owner,
             cipher.encrypt(verifier.encode()), json.dumps(sorted(selected)),
             (now + timedelta(minutes=10)).isoformat()),
        )

    query = urlencode({
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(sorted(selected)),
        "state": state,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
        "access_type": "offline",
        "prompt": "select_account consent",
        "include_granted_scopes": "true",
    })
    response.set_cookie(
        "agentshield_google_oauth_state", hashlib.sha256(state.encode()).hexdigest(),
        max_age=600, httponly=True, secure=redirect_uri.startswith("https://"),
        samesite="lax", path="/v1/shieldwing/google/callback",
    )
    return {"authorization_url": f"https://accounts.google.com/o/oauth2/v2/auth?{query}"}


@router.get("/v1/shieldwing/google/callback")
async def google_oauth_callback(
    state: str = Query(min_length=20, max_length=256),
    code: str | None = Query(default=None, max_length=4096),
    error: str | None = Query(default=None, max_length=128),
    state_cookie: str | None = Cookie(default=None, alias="agentshield_google_oauth_state"),
):
    expected_state_cookie = hashlib.sha256(state.encode()).hexdigest()
    if not state_cookie or not secrets.compare_digest(state_cookie, expected_state_cookie):
        return _frontend_redirect("invalid")
    if error or not code:
        if state:
            with google_store() as (conn, _):
                conn.execute(
                    "UPDATE google_oauth_pending SET status = 'denied' WHERE state_hash = ? AND status = 'pending'",
                    (hashlib.sha256(state.encode()).hexdigest(),),
                )
        return _frontend_redirect("denied")

    state_hash = hashlib.sha256(state.encode()).hexdigest()
    with google_store() as (conn, cipher):
        pending = conn.execute(
            """SELECT workspace_id, user_id, verifier, requested_scopes, expires_at
               FROM google_oauth_pending WHERE state_hash = ? AND status = 'pending'""",
            (state_hash,),
        ).fetchone()
        if not pending:
            return _frontend_redirect("invalid")
        workspace_id, user_id, encrypted_verifier, requested_json, expires_at = pending
        if expires_at <= _utc_now().isoformat():
            conn.execute("UPDATE google_oauth_pending SET status = 'expired' WHERE state_hash = ?", (state_hash,))
            return _frontend_redirect("expired")
        claimed = conn.execute(
            "UPDATE google_oauth_pending SET status = 'exchanging' WHERE state_hash = ? AND status = 'pending' AND expires_at > ?",
            (state_hash, _utc_now().isoformat()),
        )
        if claimed.rowcount != 1:
            return _frontend_redirect("invalid")
        verifier = cipher.decrypt(encrypted_verifier).decode("ascii")
        requested_scopes = set(json.loads(requested_json))
        previous = conn.execute(
            "SELECT credential FROM google_connections WHERE workspace_id = ? AND user_id = ?",
            (workspace_id, user_id),
        ).fetchone()
        previous_credential = json.loads(cipher.decrypt(previous[0]).decode("utf-8")) if previous else {}

    try:
        client_id, client_secret, redirect_uri = google_config()
        async with httpx.AsyncClient(timeout=15, follow_redirects=False) as client:
            response = await client.post("https://oauth2.googleapis.com/token", data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "code_verifier": verifier,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            })
            response.raise_for_status()
            token_data = response.json()
        granted_scopes = set(str(token_data.get("scope", "")).split())
        if not requested_scopes.issubset(granted_scopes):
            with google_store() as (conn, _):
                conn.execute("UPDATE google_oauth_pending SET status = 'insufficient_scopes' WHERE state_hash = ?", (state_hash,))
            return _frontend_redirect("insufficient-permissions")
        if not await verify_google_grant(token_data["access_token"], requested_scopes):
            with google_store() as (conn, _):
                conn.execute("UPDATE google_oauth_pending SET status = 'provider_check_failed' WHERE state_hash = ?", (state_hash,))
            return _frontend_redirect("provider-check-failed")
        refresh_token = token_data.get("refresh_token") or previous_credential.get("refresh_token")
        credential = {
            "access_token": token_data["access_token"],
            "refresh_token": refresh_token,
            "expires_at": (_utc_now() + timedelta(seconds=int(token_data.get("expires_in", 3600)))).isoformat(),
        }
    except (httpx.HTTPError, KeyError, ValueError, TypeError):
        return _frontend_redirect("failed")

    authorized_at = _utc_now().isoformat()
    with google_store() as (conn, cipher):
        current = conn.execute(
            "SELECT status FROM google_oauth_pending WHERE state_hash = ?",
            (state_hash,),
        ).fetchone()
        if not current or current[0] != "exchanging":
            return _frontend_redirect("cancelled")
        conn.execute(
            """INSERT INTO google_connections
               (workspace_id, user_id, credential, scopes, authorized_at, status)
               VALUES (?, ?, ?, ?, ?, 'connected')
               ON CONFLICT(workspace_id, user_id) DO UPDATE SET
                   credential = excluded.credential, scopes = excluded.scopes,
                   authorized_at = excluded.authorized_at, status = 'connected'""",
            (workspace_id, user_id, cipher.encrypt(json.dumps(credential).encode()),
             json.dumps(sorted(granted_scopes)), authorized_at),
        )
        conn.execute("UPDATE google_oauth_pending SET status = 'completed' WHERE state_hash = ?", (state_hash,))
    return _frontend_redirect("connected")


async def get_google_access_token(owner: tuple[str, str], required_scope: str) -> str:
    with google_store() as (conn, cipher):
        row = conn.execute(
            "SELECT credential, scopes FROM google_connections WHERE workspace_id = ? AND user_id = ? AND status = 'connected'",
            owner,
        ).fetchone()
        if not row:
            raise HTTPException(409, "Connect a Google account first.")
        credential = json.loads(cipher.decrypt(row[0]).decode("utf-8"))
        scopes = set(json.loads(row[1]))
        if required_scope not in scopes:
            raise HTTPException(403, "This Google service was not authorized for this connection.")
    if datetime.fromisoformat(credential["expires_at"]) > _utc_now() + timedelta(seconds=60):
        return credential["access_token"]
    refresh_token = credential.get("refresh_token")
    if not refresh_token:
        raise HTTPException(424, "Google authorization expired. Reconnect the account.")
    client_id, client_secret, _ = google_config()
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=False) as client:
            response = await client.post("https://oauth2.googleapis.com/token", data={
                "client_id": client_id, "client_secret": client_secret,
                "refresh_token": refresh_token, "grant_type": "refresh_token",
            })
            response.raise_for_status()
            refreshed = response.json()
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code in (400, 401):
            with google_store() as (conn, _):
                conn.execute("UPDATE google_connections SET status = 'reauthorization_required' WHERE workspace_id = ? AND user_id = ?", owner)
            raise HTTPException(424, "Google authorization was revoked or expired. Reconnect the account.") from exc
        raise HTTPException(502, "Google token refresh failed.") from exc
    except httpx.RequestError as exc:
        raise HTTPException(502, "Google token service could not be reached.") from exc
    credential["access_token"] = refreshed["access_token"]
    credential["expires_at"] = (_utc_now() + timedelta(seconds=int(refreshed.get("expires_in", 3600)))).isoformat()
    with google_store() as (conn, cipher):
        conn.execute(
            "UPDATE google_connections SET credential = ? WHERE workspace_id = ? AND user_id = ?",
            (cipher.encrypt(json.dumps(credential).encode()), *owner),
        )
    return credential["access_token"]


async def google_get(path: str, token: str, params: dict, owner: tuple[str, str]) -> dict:
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=False) as client:
            response = await client.get(
                f"https://www.googleapis.com/{path}",
                headers={"Authorization": f"Bearer {token}"}, params=params,
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 401:
            with google_store() as (conn, _):
                conn.execute("UPDATE google_connections SET status = 'reauthorization_required' WHERE workspace_id = ? AND user_id = ?", owner)
            raise HTTPException(424, "Google authorization was revoked. Reconnect the account.") from exc
        if exc.response.status_code == 403:
            raise HTTPException(424, "Google denied this request. Reconnect or review the granted permissions.") from exc
        if exc.response.status_code == 429:
            raise HTTPException(503, "Google API rate limit reached. Try again later.") from exc
        raise HTTPException(502, "Google API request failed.") from exc
    except (httpx.RequestError, ValueError) as exc:
        raise HTTPException(502, "Google API could not be reached or returned invalid data.") from exc


@router.get("/v1/shieldwing/workspaces/{workspace_id}/google/gmail/messages")
async def list_gmail_messages(owner: Owner, max_results: int = Query(default=10, ge=1, le=20)):
    token = await get_google_access_token(owner, GOOGLE_SCOPES["gmail"])
    page = await google_get("gmail/v1/users/me/messages", token, {
        "labelIds": ["UNREAD"], "maxResults": max_results,
    }, owner)
    semaphore = asyncio.Semaphore(5)

    async def fetch_message(item: dict) -> dict:
        async with semaphore:
            detail = await google_get(f"gmail/v1/users/me/messages/{item['id']}", token, {
                "format": "metadata", "metadataHeaders": ["From", "Subject", "Date"],
            }, owner)
        headers = {header["name"].lower(): header["value"] for header in detail.get("payload", {}).get("headers", [])}
        return {
            "id": detail.get("id"), "thread_id": detail.get("threadId"),
            "from": headers.get("from", "")[:512], "subject": headers.get("subject", "")[:512],
            "date": headers.get("date", "")[:128],
        }
    messages = await asyncio.gather(*(fetch_message(item) for item in page.get("messages", [])[:max_results]))
    return {"messages": messages, "count": len(messages), "data_access": "gmail.metadata"}


@router.get("/v1/shieldwing/workspaces/{workspace_id}/google/calendar/events")
async def list_calendar_events(owner: Owner, max_results: int = Query(default=10, ge=1, le=20)):
    token = await get_google_access_token(owner, GOOGLE_SCOPES["calendar"])
    now = _utc_now().isoformat().replace("+00:00", "Z")
    result = await google_get("calendar/v3/calendars/primary/events", token, {
        "timeMin": now, "maxResults": max_results, "singleEvents": "true", "orderBy": "startTime",
    }, owner)
    return {
        "events": [{
            "id": event.get("id"), "summary": event.get("summary", "(untitled event)"),
            "start": event.get("start", {}).get("dateTime", event.get("start", {}).get("date")),
            "end": event.get("end", {}).get("dateTime", event.get("end", {}).get("date")),
            "url": event.get("htmlLink"),
        } for event in result.get("items", [])],
        "data_access": "calendar.events.readonly",
    }


@router.delete("/v1/shieldwing/workspaces/{workspace_id}/google")
async def disconnect_google(owner: Owner):
    with google_store() as (conn, cipher):
        row = conn.execute(
            "SELECT credential FROM google_connections WHERE workspace_id = ? AND user_id = ?", owner
        ).fetchone()
        if not row:
            conn.execute(
                "UPDATE google_oauth_pending SET status = 'cancelled' WHERE workspace_id = ? AND user_id = ? AND status IN ('pending', 'exchanging')",
                owner,
            )
            return {"disconnected": True, "provider_revoked": False}
        credential = json.loads(cipher.decrypt(row[0]).decode("utf-8"))
        conn.execute("DELETE FROM google_connections WHERE workspace_id = ? AND user_id = ?", owner)
        conn.execute(
            "UPDATE google_oauth_pending SET status = 'cancelled' WHERE workspace_id = ? AND user_id = ? AND status IN ('pending', 'exchanging')",
            owner,
        )
    token = credential.get("refresh_token") or credential.get("access_token")
    revoked = False
    if token:
        try:
            async with httpx.AsyncClient(timeout=10, follow_redirects=False) as client:
                response = await client.post("https://oauth2.googleapis.com/revoke", data={"token": token})
                revoked = response.status_code in (200, 400)
        except httpx.RequestError:
            revoked = False
    return {"disconnected": True, "provider_revoked": revoked}
