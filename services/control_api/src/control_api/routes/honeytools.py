"""
AgentShield-X Honeytools & Decoys Router
Provides active deception management, decoy tool registration, and trap trigger forensics.
"""

from __future__ import annotations

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from control_api.db import Database
from control_api.models import (
    HoneytoolDTO,
    CreateHoneytoolRequest,
    HoneyTriggerDTO,
    UserDTO,
)
from control_api.routes.auth import get_current_user

router = APIRouter(prefix="/v1", tags=["honeytools"])
db = Database.get_instance()


@router.get("/honeytools", response_model=List[HoneytoolDTO])
def list_honeytools(
    project_id: Optional[str] = "default",
    current_user: UserDTO = Depends(get_current_user),
) -> List[HoneytoolDTO]:
    rows = db.get_honeytools(project_id or "default")
    return [HoneytoolDTO(**r) for r in rows]


@router.post("/projects/{project_id}/honeytools", response_model=HoneytoolDTO)
def create_honeytool(
    project_id: str,
    req: CreateHoneytoolRequest,
    current_user: UserDTO = Depends(get_current_user),
) -> HoneytoolDTO:
    ht_id = f"honey_{uuid.uuid4().hex[:8]}"
    created = db.create_honeytool(
        honeytool_id=ht_id,
        project_id=project_id,
        name=req.name,
        type=req.type,
        description=req.description,
        sensitivity=req.sensitivity,
    )
    return HoneytoolDTO(**created)


@router.delete("/honeytools/{honeytool_id}")
def delete_honeytool(
    honeytool_id: str,
    current_user: UserDTO = Depends(get_current_user),
):
    success = db.delete_honeytool(honeytool_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Honeytool {honeytool_id} not found",
        )
    return {"success": True, "detail": f"Honeytool {honeytool_id} deleted"}


@router.get("/honeytools/triggers", response_model=List[HoneyTriggerDTO])
def list_honey_triggers(
    project_id: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=100),
    current_user: UserDTO = Depends(get_current_user),
) -> List[HoneyTriggerDTO]:
    rows = db.get_honey_triggers(project_id=project_id, limit=limit)
    return [HoneyTriggerDTO(**r) for r in rows]
