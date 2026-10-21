"""
AgentShield-X AutoPolicy & Self-Healing Router
Synthesizes deterministic OPA Rego policies and TaskContracts from scan findings or runtime incidents.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from shield_core.autopolicy import AutoPolicyEngine, PolicyProposal
from control_api.db import Database
from control_api.models import UserDTO
from control_api.routes.auth import get_current_user

router = APIRouter(prefix="/v1/autopolicy", tags=["autopolicy"])


class SynthesizeFromScanRequest(BaseModel):
    project_id: str = Field(default="default")
    scan_id: Optional[str] = None
    scan_report: Optional[Dict[str, Any]] = None


class SynthesizeFromIncidentRequest(BaseModel):
    project_id: str = Field(default="default")
    incident_id: str


class ApplyProposalRequest(BaseModel):
    project_id: str = Field(default="default")
    proposal_id: str


@router.post("/synthesize/scan")
def synthesize_from_scan(
    req: SynthesizeFromScanRequest,
    current_user: UserDTO = Depends(get_current_user),
) -> Dict[str, Any]:
    """Generates a self-healing OPA Rego policy proposal from AST scan results."""
    db = Database.get_instance()
    report = req.scan_report

    if not report and req.scan_id:
        scan_data = db.get_scan(req.scan_id)
        if scan_data:
            report = scan_data.get("report") or scan_data

    if not report:
        # Fallback to recent scan report or default demo structure
        recent_scans = db.list_scans(project_id=req.project_id, limit=1)
        if recent_scans:
            report = recent_scans[0]
        else:
            report = {
                "blast_radius": {
                    "entry_points": ["read_email", "read_webpage"],
                    "outbound_channels_reachable": ["send_email"],
                },
                "findings": [{"tool": "send_email", "severity": "high", "status": "open"}],
            }

    engine = AutoPolicyEngine()
    proposal = engine.synthesize_from_scan(report)
    prop_dict = proposal.model_dump() if hasattr(proposal, "model_dump") else proposal.dict()

    db.record_policy_proposal(project_id=req.project_id or "default", proposal_data=prop_dict)
    return prop_dict


@router.post("/synthesize/incident")
def synthesize_from_incident(
    req: SynthesizeFromIncidentRequest,
    current_user: UserDTO = Depends(get_current_user),
) -> Dict[str, Any]:
    """Generates a hotfix quarantine policy from a runtime incident."""
    db = Database.get_instance()
    # Fetch incident
    inc = db.get_incident(req.incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{req.incident_id}' not found")

    incident_dict = {
        "id": inc["id"],
        "tool_name": inc.get("event", {}).get("tool_name") or "sensitive_tool",
        "reasons": inc.get("event", {}).get("reasons") or [{"evidence": "Indirect prompt injection detected"}],
    }

    engine = AutoPolicyEngine()
    proposal = engine.synthesize_from_incident(incident_dict)
    prop_dict = proposal.model_dump() if hasattr(proposal, "model_dump") else proposal.dict()

    db.record_policy_proposal(project_id=req.project_id or "default", proposal_data=prop_dict)
    return prop_dict


@router.get("/proposals")
def list_proposals(
    project_id: str = Query(default="default"),
    status: Optional[str] = Query(default=None),
    current_user: UserDTO = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Lists generated policy proposals for human review and 1-click apply."""
    db = Database.get_instance()
    return db.list_policy_proposals(project_id=project_id, status=status)


@router.post("/apply")
def apply_proposal(
    req: ApplyProposalRequest,
    current_user: UserDTO = Depends(get_current_user),
) -> Dict[str, Any]:
    """Applies a proposed policy patch to the active project's policy set."""
    db = Database.get_instance()
    applied = db.apply_policy_proposal(proposal_id=req.proposal_id, project_id=req.project_id)
    if not applied:
        raise HTTPException(status_code=404, detail=f"Proposal '{req.proposal_id}' not found")
    return {"status": "applied", "proposal": applied}
