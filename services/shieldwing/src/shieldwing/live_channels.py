"""
ShieldWing Real Channel Integrations Service
Provides actual live connectivity for Telegram Bot API, WhatsApp Business Cloud API,
and Google Workspace (Gmail + Google Calendar API).
"""

from __future__ import annotations

import os
import json
import base64
import urllib.parse
from email.mime.text import MIMEText
from typing import Any, Dict, List, Optional
import httpx


class TelegramLiveChannel:
    """Real Telegram Bot API Client."""

    BASE_URL = "https://api.telegram.org"

    @classmethod
    async def test_token(cls, token: str) -> Dict[str, Any]:
        """Verify bot token by calling getMe."""
        url = f"{cls.BASE_URL}/bot{token}/getMe"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            data = resp.json()
            if data.get("ok"):
                result = data.get("result", {})
                return {
                    "connected": True,
                    "bot_id": result.get("id"),
                    "bot_username": result.get("username"),
                    "bot_name": result.get("first_name"),
                    "can_join_groups": result.get("can_join_groups", False),
                }
            else:
                return {
                    "connected": False,
                    "error": data.get("description", "Invalid Telegram Bot Token"),
                }

    @classmethod
    async def send_message(
        cls,
        token: str,
        chat_id: str | int,
        text: str,
        inline_buttons: Optional[List[List[Dict[str, str]]]] = None,
    ) -> Dict[str, Any]:
        """Send a real message to a Telegram chat, optionally with inline keyboard buttons."""
        url = f"{cls.BASE_URL}/bot{token}/sendMessage"
        payload: Dict[str, Any] = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "Markdown",
        }
        if inline_buttons:
            payload["reply_markup"] = {"inline_keyboard": inline_buttons}

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            return resp.json()

    @classmethod
    async def set_webhook(cls, token: str, webhook_url: str) -> Dict[str, Any]:
        """Register public webhook URL with Telegram."""
        url = f"{cls.BASE_URL}/bot{token}/setWebhook"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json={"url": webhook_url})
            return resp.json()


class WhatsAppLiveChannel:
    """Real WhatsApp Business Cloud API Client (Meta Graph API)."""

    GRAPH_URL = "https://graph.facebook.com/v18.0"

    @classmethod
    def verify_webhook_token(
        cls,
        hub_mode: Optional[str],
        hub_verify_token: Optional[str],
        expected_token: str,
        challenge: Optional[str],
    ) -> Optional[str]:
        """Verify webhook handshake from Meta."""
        if hub_mode == "subscribe" and hub_verify_token == expected_token:
            return challenge
        return None

    @classmethod
    async def send_text_message(
        cls,
        phone_number_id: str,
        access_token: str,
        to_phone: str,
        text: str,
    ) -> Dict[str, Any]:
        """Send real text message via Meta Graph API."""
        url = f"{cls.GRAPH_URL}/{phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        # Clean phone number (e.g. +1415... to 1415...)
        clean_phone = to_phone.replace("+", "").replace("-", "").replace(" ", "")
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": clean_phone,
            "type": "text",
            "text": {"body": text},
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            try:
                return resp.json()
            except Exception:
                return {"status_code": resp.status_code, "text": resp.text}

    @classmethod
    async def send_interactive_confirmation(
        cls,
        phone_number_id: str,
        access_token: str,
        to_phone: str,
        header_text: str,
        body_text: str,
        action_id: str,
    ) -> Dict[str, Any]:
        """Send interactive WhatsApp buttons for Trust Boundary 1-click human confirmation."""
        url = f"{cls.GRAPH_URL}/{phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        clean_phone = to_phone.replace("+", "").replace("-", "").replace(" ", "")
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": clean_phone,
            "type": "interactive",
            "interactive": {
                "type": "button",
                "header": {"type": "text", "text": header_text},
                "body": {"text": body_text},
                "action": {
                    "buttons": [
                        {
                            "type": "reply",
                            "reply": {
                                "id": f"approve_{action_id}",
                                "title": "✅ Approve Action",
                            },
                        },
                        {
                            "type": "reply",
                            "reply": {
                                "id": f"reject_{action_id}",
                                "title": "❌ Abort / Quash",
                            },
                        },
                    ]
                },
            },
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            try:
                return resp.json()
            except Exception:
                return {"status_code": resp.status_code, "text": resp.text}


class GoogleWorkspaceLiveChannel:
    """Real Google Workspace API Client (Gmail & Google Calendar)."""

    SCOPES = [
        "https://www.googleapis.com/auth/gmail.modify",
        "https://www.googleapis.com/auth/gmail.compose",
        "https://www.googleapis.com/auth/calendar.events",
    ]

    @classmethod
    def get_oauth_authorization_url(
        cls, client_id: str, redirect_uri: str, state: str = "shieldwing_auth"
    ) -> str:
        """Constructs Google OAuth 2.0 authorization URL."""
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": " ".join(cls.SCOPES),
            "access_type": "offline",
            "prompt": "consent",
            "state": state,
        }
        return f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"

    @classmethod
    async def exchange_code_for_tokens(
        cls, client_id: str, client_secret: str, code: str, redirect_uri: str
    ) -> Dict[str, Any]:
        """Exchanges authorization code for Google access token and refresh token."""
        url = "https://oauth2.googleapis.com/token"
        payload = {
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, data=payload)
            return resp.json()

    @classmethod
    async def fetch_unread_emails(
        cls, access_token: str, max_results: int = 5
    ) -> List[Dict[str, Any]]:
        """Queries user's unread emails from Gmail API."""
        url = f"https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults={max_results}"
        headers = {"Authorization": f"Bearer {access_token}"}

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code != 200:
                return []
            data = resp.json()
            messages = data.get("messages", [])

            email_details = []
            for m in messages:
                detail_url = f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{m['id']}?format=full"
                d_resp = await client.get(detail_url, headers=headers)
                if d_resp.status_code == 200:
                    d_json = d_resp.json()
                    headers_list = d_json.get("payload", {}).get("headers", [])
                    subject = next((h["value"] for h in headers_list if h["name"].lower() == "subject"), "(No Subject)")
                    sender = next((h["value"] for h in headers_list if h["name"].lower() == "from"), "Unknown")
                    snippet = d_json.get("snippet", "")
                    email_details.append({
                        "id": m["id"],
                        "from": sender,
                        "subject": subject,
                        "snippet": snippet,
                    })

            return email_details

    @classmethod
    async def create_gmail_draft(
        cls, access_token: str, to: str, subject: str, body: str
    ) -> Dict[str, Any]:
        """Creates a real email draft in user's Gmail with safety buffer."""
        message = MIMEText(body)
        message["to"] = to
        message["subject"] = subject
        raw_b64 = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")

        url = "https://gmail.googleapis.com/gmail/v1/users/me/drafts"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        payload = {"message": {"raw": raw_b64}}

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            return resp.json()

    @classmethod
    async def create_calendar_focus_block(
        cls, access_token: str, summary: str, start_iso: str, end_iso: str
    ) -> Dict[str, Any]:
        """Creates a focus time event in primary Google Calendar."""
        url = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "summary": summary,
            "description": "🛡️ Created autonomously by ShieldWing with AgentShield-X Calendar Optimizer.",
            "start": {"dateTime": start_iso},
            "end": {"dateTime": end_iso},
            "colorId": "11", # bold purple in Google Calendar
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            return resp.json()

