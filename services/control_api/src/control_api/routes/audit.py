"""
AgentShield-X Cryptographic Audit Log Router
Provides append-only, SHA-256 hash-chained decision audit inspection and chain validation.
"""

from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status

from control_api.db import Database
from control_api.models import AuditRecordDTO, VerifyAuditLogResponse, UserDTO
from control_api.routes.auth import get_current_user

router = APIRouter(prefix="/v1/audit", tags=["audit"])
db = Database.get_instance()


@router.get("", response_model=List[AuditRecordDTO])
def list_audit_records(
    project_id: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: UserDTO = Depends(get_current_user),
) -> List[AuditRecordDTO]:
    rows = db.get_audit_records(project_id=project_id, limit=limit, offset=offset)
    return [AuditRecordDTO(**r) for r in rows]


@router.post("/verify", response_model=VerifyAuditLogResponse)
def verify_audit_log(
    project_id: Optional[str] = None,
    current_user: UserDTO = Depends(get_current_user),
) -> VerifyAuditLogResponse:
    res = db.verify_audit_log(project_id=project_id)
    return VerifyAuditLogResponse(**res)
