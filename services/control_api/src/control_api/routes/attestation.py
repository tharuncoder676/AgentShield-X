"""
A2A Ephemeral Attestation API Routes
Provides cryptographically signed capability tokens for inter-agent delegation.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from control_api.db import Database
from shield_core.attestation import default_attestation_engine

router = APIRouter(prefix="/v1/attestation", tags=["attestation"])


class IssueTokenRequest(BaseModel):
    project_id: str = "default"
    issuer_agent: str = Field(..., description="Agent delegating the task")
    target_agent: str = Field(..., description="Specialist sub-agent receiving delegation")
    delegation_intent: str = Field(..., description="High-level description of delegated task")
    allowed_tools: List[str] = Field(..., description="Bounded list of permitted tools")
    ttl_seconds: int = Field(30, ge=5, le=300, description="Token validity lifetime")
    max_invocations: int = Field(1, ge=1, le=10, description="Maximum permitted invocations")
    allowed_domains: Optional[List[str]] = None


class VerifyTokenRequest(BaseModel):
    token_id: str
    tool_name: str
    calling_agent: str
    params: Optional[Dict[str, Any]] = None


class RevokeTokenRequest(BaseModel):
    token_id: str
    reason: str = "Manual security revocation"


@router.post("/tokens")
def issue_token(req: IssueTokenRequest):
    token = default_attestation_engine.issue_token(
        issuer_agent=req.issuer_agent,
        target_agent=req.target_agent,
        delegation_intent=req.delegation_intent,
        allowed_tools=req.allowed_tools,
        ttl_seconds=req.ttl_seconds,
        max_invocations=req.max_invocations,
        allowed_domains=req.allowed_domains,
    )
    # Persist in DB
    db = Database.get_instance()
    db.record_a2a_token(req.project_id, token.to_dict())
    return token.to_dict()


@router.post("/verify")
def verify_token(req: VerifyTokenRequest):
    valid, message, token = default_attestation_engine.verify_token(
        jti=req.token_id,
        tool_name=req.tool_name,
        agent_calling=req.calling_agent,
        params=req.params,
    )
    if token:
        db = Database.get_instance()
        db.update_a2a_token_status(token.jti, token.status)

    return {
        "valid": valid,
        "message": message,
        "token": token.to_dict() if token else None,
    }


@router.post("/revoke")
def revoke_token(req: RevokeTokenRequest):
    default_attestation_engine.revoke_token(req.token_id, req.reason)
    db = Database.get_instance()
    db.update_a2a_token_status(req.token_id, "revoked")
    return {"status": "ok", "message": f"Token '{req.token_id}' revoked."}


@router.get("/tokens")
def list_tokens(project_id: str = Query("default"), limit: int = Query(50)):
    db = Database.get_instance()
    # Merge live engine state with db
    db_tokens = db.list_a2a_tokens(project_id=project_id, limit=limit)
    if not db_tokens:
        live = default_attestation_engine.list_tokens()
        return live
    return db_tokens
