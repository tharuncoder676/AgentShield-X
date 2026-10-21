"""
AgentShield-X Multi-Agent Debate Judge Router
Runs autonomous 3-agent consensus debates for ambiguous or high-risk tool invocations.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from shield_core.judge import MultiAgentJudgeCommittee
from control_api.db import Database
from control_api.models import UserDTO
from control_api.routes.auth import get_current_user

router = APIRouter(prefix="/v1/judge", tags=["judge"])


class DebateRequest(BaseModel):
    project_id: str = Field(default="default")
    tool_name: str = Field(..., description="Name of tool under review")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Tool invocation arguments")
    context_preview: str = Field(default="", description="Snippet of surrounding prompt/context")
    taint_sources: List[str] = Field(default_factory=list, description="Active taint IDs")


@router.post("/debate")
def run_debate(
    req: DebateRequest,
    current_user: UserDTO = Depends(get_current_user),
) -> Dict[str, Any]:
    """Runs a 3-agent consensus debate on the proposed tool call and returns transparent rationale."""
    committee = MultiAgentJudgeCommittee()
    verdict = committee.evaluate(
        tool_name=req.tool_name,
        arguments=req.arguments,
        context_preview=req.context_preview,
        taint_sources=req.taint_sources,
    )
    result = verdict.model_dump() if hasattr(verdict, "model_dump") else verdict.dict()

    db = Database.get_instance()
    db.record_debate(project_id=req.project_id or "default", debate_data=result)
    return result


@router.get("/history")
def list_debate_history(
    project_id: str = Query(default="default"),
    limit: int = Query(default=20),
    current_user: UserDTO = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Lists historical multi-agent debate decisions and transcripts."""
    db = Database.get_instance()
    return db.list_debates(project_id=project_id, limit=limit)
