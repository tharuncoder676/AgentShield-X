"""
AgentShield-X Agent Registry & Blast-Radius Router
Enables operators to register autonomous agents, configure allowed tools and
blast radius parameters, inspect security scores, and trigger instant kill-switches.
"""

from __future__ import annotations

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from control_api.db import Database
from control_api.models import (
    AgentDTO,
    CreateAgentRequest,
    UpdateAgentRequest,
    KillSwitchRequest,
    UserDTO,
)
from control_api.routes.auth import get_current_user

router = APIRouter(prefix="/v1", tags=["agents"])
db = Database.get_instance()


@router.get("/agents", response_model=List[AgentDTO])
def list_agents(
    project_id: Optional[str] = None,
    current_user: UserDTO = Depends(get_current_user),
) -> List[AgentDTO]:
    agents = db.get_agents(project_id=project_id)
    return [AgentDTO(**a) for a in agents]


@router.post("/projects/{project_id}/agents", response_model=AgentDTO)
def register_agent(
    project_id: str,
    req: CreateAgentRequest,
    current_user: UserDTO = Depends(get_current_user),
) -> AgentDTO:
    agent_id = f"agent_{uuid.uuid4().hex[:8]}"
    created = db.create_agent(
        agent_id=agent_id,
        project_id=project_id,
        name=req.name,
        description=req.description,
        allowed_tools=req.allowed_tools,
        blast_radius_score=req.blast_radius_score,
        metadata=req.metadata,
    )
    return AgentDTO(**created)


@router.get("/agents/{agent_id}", response_model=AgentDTO)
def get_agent(
    agent_id: str,
    current_user: UserDTO = Depends(get_current_user),
) -> AgentDTO:
    agent = db.get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent {agent_id} not found",
        )
    return AgentDTO(**agent)


@router.patch("/agents/{agent_id}", response_model=AgentDTO)
def update_agent(
    agent_id: str,
    req: UpdateAgentRequest,
    current_user: UserDTO = Depends(get_current_user),
) -> AgentDTO:
    agent = db.get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent {agent_id} not found",
        )
    updated = db.update_agent(
        agent_id=agent_id,
        name=req.name,
        description=req.description,
        allowed_tools=req.allowed_tools,
        blast_radius_score=req.blast_radius_score,
        status=req.status,
    )
    assert updated is not None
    return AgentDTO(**updated)


@router.post("/agents/{agent_id}/kill-switch", response_model=AgentDTO)
def toggle_kill_switch(
    agent_id: str,
    req: KillSwitchRequest,
    current_user: UserDTO = Depends(get_current_user),
) -> AgentDTO:
    agent = db.get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent {agent_id} not found",
        )
    updated = db.set_agent_kill_switch(agent_id=agent_id, suspended=req.suspended)
    assert updated is not None
    return AgentDTO(**updated)
