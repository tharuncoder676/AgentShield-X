"""
AgentShield-X Policy Management & Simulation Router
Provides Rego/YAML policy authoring, validation, dry-run simulation against recent traffic, and rollback.
"""

from __future__ import annotations

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from control_api.db import Database
from control_api.models import (
    PolicyDTO,
    CreatePolicyRequest,
    UpdatePolicyRequest,
    ValidatePolicyRequest,
    ValidatePolicyResponse,
    SimulatePolicyRequest,
    SimulatePolicyResponse,
    UserDTO,
)
from control_api.routes.auth import get_current_user

router = APIRouter(prefix="/v1", tags=["policies"])
db = Database.get_instance()


@router.get("/policies", response_model=List[PolicyDTO])
def list_policies(
    project_id: Optional[str] = None,
    current_user: UserDTO = Depends(get_current_user),
) -> List[PolicyDTO]:
    rows = db.get_policies(project_id=project_id)
    return [PolicyDTO(**r) for r in rows]


@router.post("/projects/{project_id}/policies", response_model=PolicyDTO)
def create_policy(
    project_id: str,
    req: CreatePolicyRequest,
    current_user: UserDTO = Depends(get_current_user),
) -> PolicyDTO:
    policy_id = f"policy_{uuid.uuid4().hex[:8]}"
    created = db.create_policy(
        policy_id=policy_id,
        project_id=project_id,
        name=req.name,
        rules_rego=req.rules_rego,
        description=req.description,
        version=req.version,
        is_active=1 if req.is_active else 0,
    )
    return PolicyDTO(**created)


@router.get("/policies/{policy_id}", response_model=PolicyDTO)
def get_policy(
    policy_id: str,
    current_user: UserDTO = Depends(get_current_user),
) -> PolicyDTO:
    p = db.get_policy_by_id(policy_id)
    if not p:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy {policy_id} not found",
        )
    return PolicyDTO(**p)


@router.put("/policies/{policy_id}", response_model=PolicyDTO)
def update_policy(
    policy_id: str,
    req: UpdatePolicyRequest,
    current_user: UserDTO = Depends(get_current_user),
) -> PolicyDTO:
    p = db.get_policy_by_id(policy_id)
    if not p:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy {policy_id} not found",
        )
    updated = db.update_policy(
        policy_id=policy_id,
        name=req.name,
        description=req.description,
        rules_rego=req.rules_rego,
        version=req.version,
        is_active=1 if req.is_active else (0 if req.is_active is False else None),
    )
    assert updated is not None
    return PolicyDTO(**updated)


@router.delete("/policies/{policy_id}")
def delete_policy(
    policy_id: str,
    current_user: UserDTO = Depends(get_current_user),
):
    success = db.delete_policy(policy_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy {policy_id} not found",
        )
    return {"success": True, "detail": f"Policy {policy_id} deleted"}


@router.post("/policies/validate", response_model=ValidatePolicyResponse)
def validate_policy(req: ValidatePolicyRequest) -> ValidatePolicyResponse:
    code = req.rules_rego.strip()
    errors = []
    warnings = []

    if not code:
        errors.append("Policy code cannot be empty")
    elif "package " not in code and "package" not in code:
        warnings.append("Missing 'package' declaration at beginning of Rego module")

    # Syntax sanity checks
    open_brackets = code.count("{") - code.count("}")
    if open_brackets != 0:
        errors.append(f"Mismatched curly braces: {abs(open_brackets)} unbalanced")

    return ValidatePolicyResponse(
        valid=len(errors) == 0,
        errors=errors,
        warnings=warnings,
    )


@router.post("/policies/simulate", response_model=SimulatePolicyResponse)
def simulate_policy(
    req: SimulatePolicyRequest,
    project_id: Optional[str] = None,
    current_user: UserDTO = Depends(get_current_user),
) -> SimulatePolicyResponse:
    result = db.simulate_policy_dry_run(
        rules_rego=req.rules_rego,
        project_id=project_id,
        sample_size=req.sample_size,
    )
    return SimulatePolicyResponse(**result)
