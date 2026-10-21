"""
AgentShield-X Red-Team Attack Swarm Router
Runs autonomous adversarial probing campaigns with payload mutation and empirical catch-rate calculation.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from shield_core.redteam import RedTeamSwarmEngine
from control_api.db import Database
from control_api.models import UserDTO
from control_api.routes.auth import get_current_user

router = APIRouter(prefix="/v1/redteam", tags=["redteam"])


class RedTeamRunRequest(BaseModel):
    project_id: str = Field(default="default")
    target_name: str = Field(default="Research-Assistant-v1")
    rounds: int = Field(default=5, ge=1, le=20)
    target_tools: Optional[List[str]] = Field(default=None)


class RedTeamSyncRequest(BaseModel):
    project_id: str = Field(default="default")
    campaign: Dict[str, Any]


@router.post("/run")
def execute_redteam_campaign(
    req: RedTeamRunRequest,
    current_user: UserDTO = Depends(get_current_user),
) -> Dict[str, Any]:
    """Launches an autonomous adversarial mutation probe campaign against target tools."""
    engine = RedTeamSwarmEngine()
    campaign = engine.run_campaign(
        target_name=req.target_name,
        rounds=req.rounds,
        target_tools=req.target_tools,
    )
    result = campaign.model_dump() if hasattr(campaign, "model_dump") else campaign.dict()

    db = Database.get_instance()
    db.record_redteam_run(project_id=req.project_id or "default", campaign_data=result)
    return result


@router.post("/runs")
def sync_redteam_run(
    req: RedTeamSyncRequest,
    current_user: UserDTO = Depends(get_current_user),
) -> Dict[str, Any]:
    """Syncs a red-team campaign run from the CLI to the cloud Control API database."""
    db = Database.get_instance()
    saved = db.record_redteam_run(project_id=req.project_id or "default", campaign_data=req.campaign)
    return {"status": "synced", "campaign": saved}


@router.get("/runs")
def list_redteam_runs(
    project_id: str = Query(default="default"),
    limit: int = Query(default=20),
    current_user: UserDTO = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Lists past adversarial probe campaigns with empirical catch rate metrics."""
    db = Database.get_instance()
    return db.list_redteam_runs(project_id=project_id, limit=limit)
