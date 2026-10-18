"""
AgentShield-X Human-in-the-Loop Approvals Queue Router
Enables security operators to inspect escalated actions, review payload context, and approve or deny execution.
"""

from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from control_api.db import Database
from control_api.models import ApprovalDTO, ResolveApprovalRequest, UserDTO
from control_api.routes.auth import get_current_user

router = APIRouter(prefix="/v1", tags=["approvals"])
db = Database.get_instance()


@router.get("/approvals", response_model=List[ApprovalDTO])
def list_approvals(
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=100),
    current_user: UserDTO = Depends(get_current_user),
) -> List[ApprovalDTO]:
    rows = db.get_approvals(project_id=project_id, status=status, limit=limit)
    return [ApprovalDTO(**r) for r in rows]


@router.get("/approvals/{approval_id}", response_model=ApprovalDTO)
def get_approval(
    approval_id: str,
    current_user: UserDTO = Depends(get_current_user),
) -> ApprovalDTO:
    a = db.get_approval_by_id(approval_id)
    if not a:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Approval request {approval_id} not found",
        )
    return ApprovalDTO(**a)


@router.post("/approvals/{approval_id}/resolve", response_model=ApprovalDTO)
def resolve_approval(
    approval_id: str,
    req: ResolveApprovalRequest,
    current_user: UserDTO = Depends(get_current_user),
) -> ApprovalDTO:
    a = db.get_approval_by_id(approval_id)
    if not a:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Approval request {approval_id} not found",
        )
    if req.status not in ("approved", "rejected"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'approved' or 'rejected'",
        )

    updated = db.resolve_approval(
        approval_id=approval_id,
        status=req.status,
        resolved_by=current_user.email,
        reason=req.reason,
    )
    assert updated is not None
    return ApprovalDTO(**updated)
