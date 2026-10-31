"""FastAPI Routes for Multi-Tenant RBAC & Enterprise SSO Federation."""


from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, EmailStr

from shield_core.rbac import default_rbac_engine, RoleType, IdPProvider, SSOProtocol

router = APIRouter(prefix="/v1/rbac", tags=["rbac"])


class UpdateSSOConfigRequest(BaseModel):
    provider: Optional[str] = None
    protocol: Optional[str] = None
    idp_sso_url: Optional[str] = None
    enforce_mfa: Optional[bool] = None
    entity_id: Optional[str] = None


class SimulateSSORequest(BaseModel):
    email: str = "security.lead@corp.internal"
    display_name: str = "SecOps Lead"
    idp_groups: List[str] = ["AgentShield_Admins", "SecOps_Engineers"]
    tenant_id: str = "tenant-prod-us"


@router.get("/roles")
async def get_roles_and_permissions():
    """Returns the comprehensive RBAC permissions matrix by role."""
    return {
        "roles": [r.value for r in RoleType],
        "matrix": default_rbac_engine.get_role_matrix(),
    }


@router.get("/tenants")
async def list_tenants():
    """Returns active multi-tenant enterprise pods."""
    return [t.to_dict() for t in default_rbac_engine.tenants.values()]


@router.get("/users")
async def list_users():
    """Returns active enterprise users and their assigned roles."""
    return [u.to_dict() for u in default_rbac_engine.users.values()]


@router.get("/sso/config")
async def get_sso_config():
    """Returns active enterprise SAML 2.0 / OIDC configuration."""
    return default_rbac_engine.sso_config.to_dict()


@router.post("/sso/config")
async def update_sso_config(payload: UpdateSSOConfigRequest):
    """Updates enterprise SAML 2.0 / OIDC configuration."""
    data = {k: v for k, v in payload.dict().items() if v is not None}
    updated = default_rbac_engine.update_sso_config(data)
    return updated.to_dict()


@router.post("/sso/test-auth")
async def test_sso_handshake(payload: SimulateSSORequest):
    """Simulates SAML 2.0 / OIDC assertion exchange and JIT user provisioning."""
    result = default_rbac_engine.simulate_sso_assertion(
        email=payload.email,
        display_name=payload.display_name,
        idp_groups=payload.idp_groups,
        tenant_id=payload.tenant_id,
    )
    return result

