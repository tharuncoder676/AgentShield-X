"""
AgentShield-X Webhooks API Route
Manages registration, testing, and telemetry history for Slack, Discord, PagerDuty, and SIEM webhooks.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from control_api.models import UserDTO
from control_api.routes.auth import get_current_user
from shield_core.webhooks import WebhookDispatcher, WebhookPlatform, AlertSeverity

router = APIRouter(prefix="/v1/webhooks", tags=["webhooks"])


class RegisterWebhookRequest(BaseModel):
    url: str = Field(..., description="Target webhook URL")
    platform: str = Field(default="generic", description="'slack', 'discord', 'pagerduty', 'generic'")
    secret: Optional[str] = Field(default=None, description="HMAC secret for request verification")
    min_severity: str = Field(default="high", description="'info', 'warning', 'high', 'critical'")


class TestWebhookRequest(BaseModel):
    url: Optional[str] = Field(default=None, description="Test a specific URL without saving")
    platform: str = Field(default="generic")
    title: Optional[str] = "AgentShield-X Test Security Alert"
    severity: Optional[str] = "critical"


@router.get("/")
def list_webhooks(current_user: UserDTO = Depends(get_current_user)):
    """List all currently active alert webhooks."""
    return WebhookDispatcher.get_webhooks()


@router.post("/")
def register_webhook(req: RegisterWebhookRequest, current_user: UserDTO = Depends(get_current_user)):
    """Register or update an outbound alert webhook endpoint."""
    cfg = WebhookDispatcher.register_webhook(
        url=req.url,
        platform=req.platform,
        secret=req.secret,
        min_severity=req.min_severity,
    )
    return {"status": "registered", "webhook": cfg.to_dict()}


@router.get("/history")
def get_webhook_history(current_user: UserDTO = Depends(get_current_user)):
    """Return recent alert webhook dispatch history."""
    return WebhookDispatcher.get_dispatch_history()


@router.post("/test")
def test_webhook(req: TestWebhookRequest, current_user: UserDTO = Depends(get_current_user)):
    """Dispatches an immediate mock incident alert to verify webhook configuration."""
    test_details = {
        "event_type": "honeypot_triggered",
        "tool_call": "export_customer_data_dump",
        "attacker_ip": "198.51.100.42",
        "taint_level": "CRITICAL",
        "blocked_in": "3.8ms",
    }
    if req.url:
        # Create a transient config and send
        from shield_core.webhooks import WebhookConfig
        try:
            p_enum = WebhookPlatform(req.platform.lower())
        except ValueError:
            p_enum = WebhookPlatform.GENERIC
        cfg = WebhookConfig(url=req.url, platform=p_enum, enabled=True, min_severity=AlertSeverity.INFO)
        res = WebhookDispatcher._send_payload(
            cfg=cfg,
            title=req.title or "AgentShield-X Test Alert",
            severity=req.severity or "critical",
            details=test_details,
            agent_id="agent_copilot_demo",
            rule_violation="BLOCK_EXFILTRATION_CANARY",
        )
        return {"test_result": res}
    else:
        results = WebhookDispatcher.dispatch_alert_sync(
            title=req.title or "AgentShield-X Test Alert",
            severity=req.severity or "critical",
            details=test_details,
            agent_id="agent_copilot_demo",
            rule_violation="BLOCK_EXFILTRATION_CANARY",
        )
        return {"test_results": results}
