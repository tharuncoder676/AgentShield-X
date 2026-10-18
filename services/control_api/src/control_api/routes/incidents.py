"""
AgentShield-X Incidents & Threat Triage Router
Enables security operators to view, assign, investigate, resolve incidents,
and extract interactive taint-path graphs.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from control_api.db import Database
from control_api.models import IncidentDTO, TaintGraphResponse, UpdateIncidentRequest, UserDTO
from control_api.routes.auth import get_current_user

router = APIRouter(prefix="/v1", tags=["incidents"])
db = Database.get_instance()


@router.get("/incidents", response_model=List[IncidentDTO])
def list_incidents(
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=100),
    current_user: UserDTO = Depends(get_current_user),
) -> List[IncidentDTO]:
    rows = db.get_incidents(
        project_id=project_id,
        status=status,
        severity=severity,
        limit=limit,
    )
    return [IncidentDTO(**r) for r in rows]


@router.get("/incidents/{incident_id}", response_model=IncidentDTO)
def get_incident(
    incident_id: str,
    current_user: UserDTO = Depends(get_current_user),
) -> IncidentDTO:
    inc = db.get_incident_by_id(incident_id)
    if not inc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident {incident_id} not found",
        )
    return IncidentDTO(**inc)


@router.patch("/incidents/{incident_id}", response_model=IncidentDTO)
def update_incident(
    incident_id: str,
    req: UpdateIncidentRequest,
    current_user: UserDTO = Depends(get_current_user),
) -> IncidentDTO:
    inc = db.get_incident_by_id(incident_id)
    if not inc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident {incident_id} not found",
        )
    updated = db.update_incident(
        incident_id=incident_id,
        status=req.status,
        assigned_to=req.assigned_to,
        resolution_notes=req.resolution_notes,
    )
    assert updated is not None
    return IncidentDTO(**updated)


@router.get("/incidents/{incident_id}/taint-graph", response_model=TaintGraphResponse)
def get_taint_graph(
    incident_id: str,
    current_user: UserDTO = Depends(get_current_user),
) -> TaintGraphResponse:
    inc = db.get_incident_by_id(incident_id)
    if not inc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident {incident_id} not found",
        )
    data = db.get_incident_taint_graph(incident_id)
    return TaintGraphResponse(**data)
