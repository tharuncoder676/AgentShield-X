"""
Control API routes for Shadow Agent Detection and Quarantine
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from shield_core.shadow_agent import (
    default_shadow_detector,
    ShadowAgentProfile,
    QuarantineStatus,
)

router = APIRouter(prefix="/v1/shadow-agents", tags=["shadow-agents"])


class TelemetryIngestRequest(BaseModel):
    agent_id: Optional[str] = None
    api_key: str = Field(..., description="API key used in request")
    source_ip: str = Field(..., description="Origin IP address")
    user_agent: str = Field(..., description="Client User-Agent")
    tool_name: Optional[str] = None
    payload_preview: Optional[str] = None


class OnboardRequest(BaseModel):
    assigned_name: str
    policy_id: str = "default-enterprise-guard"


class QuarantineRequest(BaseModel):
    reason: str = "Immediate SOC Zero-Trust Quarantine"


@router.get("", response_model=Dict[str, Any])
def list_shadow_agents(status: Optional[str] = None):
    """List all detected shadow and rogue agents with risk scores and anomalies."""
    agents = default_shadow_detector.get_shadow_agents(filter_status=status)
    return {
        "total": len(agents),
        "agents": [a.to_dict() for a in agents],
    }


@router.get("/stats", response_model=Dict[str, Any])
def get_shadow_stats():
    """Retrieve operational telemetry and financial impact of shadow agents."""
    return default_shadow_detector.get_shadow_stats()


@router.post("/{shadow_id}/quarantine", response_model=Dict[str, Any])
def quarantine_shadow_agent(shadow_id: str, body: Optional[QuarantineRequest] = None):
    """Enforce immediate quarantine dropping all inbound and outbound traffic."""
    reason = body.reason if body else "Immediate SOC Zero-Trust Quarantine"
    try:
        updated = default_shadow_detector.quarantine_agent(shadow_id, reason=reason)
        return {
            "success": True,
            "message": f"Shadow agent '{shadow_id}' quarantined successfully.",
            "agent": updated.to_dict(),
        }
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Shadow agent '{shadow_id}' not found")


@router.post("/{shadow_id}/allowlist", response_model=Dict[str, Any])
def allowlist_shadow_agent(shadow_id: str):
    """Mark a verified benign shadow agent as allowlisted."""
    try:
        updated = default_shadow_detector.allowlist_agent(shadow_id)
        return {
            "success": True,
            "message": f"Shadow agent '{shadow_id}' marked as allowlisted.",
            "agent": updated.to_dict(),
        }
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Shadow agent '{shadow_id}' not found")


@router.post("/{shadow_id}/onboard", response_model=Dict[str, Any])
def onboard_shadow_agent(shadow_id: str, body: OnboardRequest):
    """Onboard a shadow agent into managed AgentShield-X infrastructure."""
    try:
        res = default_shadow_detector.onboard_agent(
            shadow_id=shadow_id,
            assigned_name=body.assigned_name,
            policy_id=body.policy_id,
        )
        return {
            "success": True,
            "message": f"Agent '{shadow_id}' onboarded as '{body.assigned_name}'",
            "details": res,
        }
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Shadow agent '{shadow_id}' not found")


@router.post("/telemetry/ingest", response_model=Dict[str, Any])
def ingest_telemetry(payload: TelemetryIngestRequest):
    """Ingest API gateway traffic to actively detect and fingerprint shadow agents."""
    is_shadow, profile = default_shadow_detector.ingest_telemetry(
        agent_id=payload.agent_id,
        api_key=payload.api_key,
        source_ip=payload.source_ip,
        user_agent=payload.user_agent,
        tool_name=payload.tool_name,
        payload_preview=payload.payload_preview,
    )
    return {
        "is_shadow": is_shadow,
        "profile": profile.to_dict() if profile else None,
    }

