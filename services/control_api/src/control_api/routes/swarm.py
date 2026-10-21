"""
AgentShield-X Swarm Defense & A2A Attenuation Router
Simulates multi-agent swarms, tracks cross-agent taint flow, and verifies delegation constraints.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from shield_core.swarm import AttenuationRule, SwarmAgent, SwarmDefenseEngine
from control_api.db import Database
from control_api.models import UserDTO
from control_api.routes.auth import get_current_user

router = APIRouter(prefix="/v1/swarm", tags=["swarm"])


class SwarmSimulationRequest(BaseModel):
    project_id: str = Field(default="default")
    swarm_name: str = Field(default="Customer-Research-Swarm")
    steps: List[Dict[str, Any]] = Field(default_factory=list)


@router.post("/simulate")
def simulate_swarm(
    req: SwarmSimulationRequest,
    current_user: UserDTO = Depends(get_current_user),
) -> Dict[str, Any]:
    """Runs a multi-agent swarm delegation simulation and evaluates capability attenuation."""
    engine = SwarmDefenseEngine()

    # Pre-register common agents
    engine.register_agent(SwarmAgent(
        agent_id="supervisor",
        name="Lead Research Supervisor",
        role="Orchestrator",
        allowed_tools=["read_email", "delegate_task", "synthesize_report"],
        can_delegate=True,
    ))
    engine.register_agent(SwarmAgent(
        agent_id="web_worker",
        name="Web Extraction Worker",
        role="Data Fetcher",
        allowed_tools=["read_webpage", "search_web"],
        can_delegate=False,
    ))
    engine.register_agent(SwarmAgent(
        agent_id="db_worker",
        name="Database Analyst",
        role="Private Queries",
        allowed_tools=["read_internal_db", "run_sql"],
        can_delegate=False,
    ))
    engine.register_agent(SwarmAgent(
        agent_id="mailer_worker",
        name="Outbound Mailer",
        role="External Dispatch",
        allowed_tools=["send_email"],
        can_delegate=False,
    ))

    # Add default attenuation rule: child agents cannot access outbound mailers if tainted
    engine.add_attenuation_rule(AttenuationRule(
        parent_agent_id="*",
        child_agent_id="*",
        block_external_sinks=True,
    ))

    default_steps = req.steps or [
        {
            "parent_agent_id": "supervisor",
            "child_agent_id": "web_worker",
            "task": "Extract target company information from public website",
            "taint_input": ["taint:web_untrusted"],
            "depth": 1,
        },
        {
            "parent_agent_id": "supervisor",
            "child_agent_id": "db_worker",
            "task": "Cross-reference extracted company with private internal database",
            "taint_input": [],
            "depth": 1,
        },
        {
            "parent_agent_id": "supervisor",
            "child_agent_id": "mailer_worker",
            "task": "Attempt to email report externally while holding untrusted web taint",
            "taint_input": [],
            "depth": 1,
        },
    ]

    result = engine.simulate_swarm(
        swarm_name=req.swarm_name,
        delegation_steps=default_steps,
    )

    db = Database.get_instance()
    db.record_swarm_trace(project_id=req.project_id or "default", trace_data=result)
    return result


@router.get("/traces")
def list_swarm_traces(
    project_id: str = Query(default="default"),
    limit: int = Query(default=20),
    current_user: UserDTO = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Returns recent multi-agent swarm traces and taint flow logs."""
    db = Database.get_instance()
    return db.list_swarm_traces(project_id=project_id, limit=limit)
