"""
GitOps Hot-Reload & Automated PR/Patch Generator API Routes
Synthesizes automated GitHub PRs and unified diff patches from AutoPolicy OPA Rego rules,
with zero-downtime hot-reload capability into active policy memory.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from control_api.db import Database
from shield_core.gitops import default_gitops_engine

router = APIRouter(prefix="/v1/gitops", tags=["gitops"])


class GeneratePRRequest(BaseModel):
    project_id: str = "default"
    rule_name: str = Field(..., description="Descriptive identifier for policy rule")
    rego_code: str = Field(..., description="OPA Rego policy string")
    test_code: str = Field(..., description="OPA test suite string")
    target_tool: str = Field(..., description="Tool protected by this policy")
    mitigated_cve: str = "CWE-94/Prompt-Injection"
    author: str = "Tharunkumar.S (AgentShield AutoPolicy)"


class HotReloadRequest(BaseModel):
    proposal_id: str


@router.post("/proposals")
def generate_proposal(req: GeneratePRRequest):
    bundle = default_gitops_engine.generate_pr_bundle(
        rule_name=req.rule_name,
        rego_code=req.rego_code,
        test_code=req.test_code,
        target_tool=req.target_tool,
        mitigated_cve=req.mitigated_cve,
        author=req.author,
    )
    db = Database.get_instance()
    db.record_gitops_proposal(req.project_id, bundle.to_dict())
    return bundle.to_dict()


@router.post("/proposals/{proposal_id}/apply")
def apply_hotfix(proposal_id: str, req: Optional[HotReloadRequest] = None):
    success, msg = default_gitops_engine.hot_reload_rule(proposal_id)
    if not success:
        raise HTTPException(status_code=404, detail=msg)

    db = Database.get_instance()
    db.update_gitops_proposal_status(proposal_id, "HOT_APPLIED")
    return {"status": "ok", "message": msg, "proposal_id": proposal_id}


@router.get("/proposals")
def list_proposals(project_id: str = Query("default")):
    db = Database.get_instance()
    rows = db.list_gitops_proposals(project_id=project_id)
    if not rows:
        return default_gitops_engine.list_proposals()
    return rows


@router.get("/active-rules")
def get_active_hot_rules():
    return default_gitops_engine.get_active_hot_rules()
