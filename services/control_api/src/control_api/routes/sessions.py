"""
AgentShield-X Sessions & Replay Simulator Router
Provides multi-turn session inspection, state replay, and policy dry-run simulation.
"""

from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from control_api.db import Database
from control_api.models import (
    SessionSummaryDTO,
    SessionDetailDTO,
    SessionReplayRequest,
    SessionReplayResponse,
    UserDTO,
)
from control_api.routes.auth import get_current_user

router = APIRouter(prefix="/v1", tags=["sessions"])
db = Database.get_instance()


@router.get("/sessions", response_model=List[SessionSummaryDTO])
def list_sessions(
    project_id: Optional[str] = None,
    agent_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=100),
    current_user: UserDTO = Depends(get_current_user),
) -> List[SessionSummaryDTO]:
    sessions = db.get_sessions(
        project_id=project_id,
        agent_id=agent_id,
        status=status,
        limit=limit,
    )
    return [SessionSummaryDTO(**s) for s in sessions]


@router.get("/sessions/{session_id}", response_model=SessionDetailDTO)
def get_session(
    session_id: str,
    current_user: UserDTO = Depends(get_current_user),
) -> SessionDetailDTO:
    session = db.get_session_by_id(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found",
        )
    return SessionDetailDTO(**session)


@router.post("/sessions/{session_id}/replay", response_model=SessionReplayResponse)
def replay_session(
    session_id: str,
    req: SessionReplayRequest,
    current_user: UserDTO = Depends(get_current_user),
) -> SessionReplayResponse:
    session = db.get_session_by_id(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found",
        )
    result = db.replay_session(
        session_id=session_id,
        override_policy=req.override_policy,
        sensitivity_overrides=req.sensitivity_overrides,
        strict_mode=req.strict_mode,
    )
    return SessionReplayResponse(**result)

