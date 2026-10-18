"""
AgentShield-X Organizations, Projects, and Scoped API Keys Router
"""

from __future__ import annotations

import datetime
import hashlib
import secrets
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from control_api.db import Database
from control_api.models import (
    ApiKeyResponse,
    CreateApiKeyRequest,
    CreateProjectRequest,
    OrgDTO,
    ProjectDTO,
    UserDTO,
)
from control_api.routes.auth import get_current_user

router = APIRouter(prefix="/v1", tags=["orgs-projects"])
db = Database.get_instance()


def sha256_hex(val: str) -> str:
    return hashlib.sha256(val.encode("utf-8")).hexdigest()


@router.get("/orgs", response_model=List[OrgDTO])
def list_orgs(current_user: UserDTO = Depends(get_current_user)) -> List[OrgDTO]:
    orgs = db.get_orgs_for_user(current_user.id)
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    return [
        OrgDTO(
            id=o["id"],
            name=o["name"],
            slug=o["slug"],
            plan=o["plan"],
            user_role=o.get("user_role", "owner"),
            owner_id=o.get("owner_id") or current_user.id,
            created_at=o.get("created_at") or now,
        )
        for o in orgs
    ]


@router.get("/orgs/{org_id}", response_model=OrgDTO)
def get_org(org_id: str, current_user: UserDTO = Depends(get_current_user)) -> OrgDTO:
    org = db.get_org_by_id(org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    return OrgDTO(
        id=org["id"],
        name=org["name"],
        slug=org["slug"],
        plan=org["plan"],
        user_role=org.get("user_role", "owner"),
        owner_id=org.get("owner_id") or current_user.id,
        created_at=org.get("created_at") or now,
    )


@router.get("/orgs/{org_id}/projects", response_model=List[ProjectDTO])
def list_projects(org_id: str, current_user: UserDTO = Depends(get_current_user)) -> List[ProjectDTO]:
    projects = db.get_projects_for_org(org_id)
    return [
        ProjectDTO(
            id=p["id"],
            org_id=p["org_id"],
            name=p["name"],
            slug=p["slug"],
            privacy_mode=p["privacy_mode"],
            created_at=p["created_at"],
        )
        for p in projects
    ]


@router.post("/orgs/{org_id}/projects", response_model=ProjectDTO)
def create_project(
    org_id: str,
    req: CreateProjectRequest,
    current_user: UserDTO = Depends(get_current_user),
) -> ProjectDTO:
    org = db.get_org_by_id(org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    project_id = f"proj_{uuid.uuid4().hex[:12]}"
    slug = req.name.lower().replace(" ", "-") + f"-{secrets.token_hex(3)}"
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()

    db.create_project(project_id, org_id, req.name, slug, req.privacy_mode, now)

    # Automatically generate first API Key for the project
    key_id = f"key_{uuid.uuid4().hex[:12]}"
    raw_key = f"shield_live_{secrets.token_hex(24)}"
    key_hash = sha256_hex(raw_key)
    prefix = raw_key[:16] + "..." + raw_key[-4:]
    db.create_api_key(key_id, project_id, "Default SDK Key", key_hash, prefix, now)

    return ProjectDTO(
        id=project_id,
        org_id=org_id,
        name=req.name,
        slug=slug,
        privacy_mode=req.privacy_mode,
        created_at=now,
    )


@router.get("/projects/{project_id}/api-keys", response_model=List[ApiKeyResponse])
def list_api_keys(project_id: str, current_user: UserDTO = Depends(get_current_user)) -> List[ApiKeyResponse]:
    keys = db.get_api_keys_for_project(project_id)
    return [
        ApiKeyResponse(
            id=k["id"],
            project_id=project_id,
            name=k["name"],
            prefix=k["prefix"],
            created_at=k["created_at"],
            last_used_at=k.get("last_used_at"),
        )
        for k in keys
    ]


@router.post("/projects/{project_id}/api-keys", response_model=ApiKeyResponse)
def create_api_key(
    project_id: str,
    req: CreateApiKeyRequest,
    current_user: UserDTO = Depends(get_current_user),
) -> ApiKeyResponse:
    project = db.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    key_id = f"key_{uuid.uuid4().hex[:12]}"
    raw_key = f"shield_live_{secrets.token_hex(24)}"
    key_hash = sha256_hex(raw_key)
    prefix = raw_key[:16] + "..." + raw_key[-4:]
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()

    db.create_api_key(key_id, project_id, req.name, key_hash, prefix, now)

    return ApiKeyResponse(
        id=key_id,
        project_id=project_id,
        name=req.name,
        raw_key=raw_key,
        prefix=prefix,
        created_at=now,
    )
