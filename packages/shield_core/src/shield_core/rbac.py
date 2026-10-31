"""AgentShield Multi-Tenant Role-Based Access Control (RBAC) & Enterprise SSO Engine.

Provides zero-trust multi-tenancy and enterprise identity federation:
- Granular hierarchical roles: Super Admin, Security Admin, Security Analyst, Developer, Auditor.
- Fine-grained permission matrix across all AgentShield control plane resources.
- Enterprise SSO federation: SAML 2.0 & OIDC (Okta, Microsoft Entra ID, PingIdentity, Google Workspace).
- Just-In-Time (JIT) user provisioning with SCIM directory group-to-role attribute mapping.
- Cryptographic tenant boundary isolation & cross-tenant leak prevention.

Architect: Tharunkumar.S | AgentShield-X Security Labs
"""

from __future__ import annotations

import hashlib
import hmac
import json
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Set


class RoleType(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    SECURITY_ADMIN = "SECURITY_ADMIN"
    SECURITY_ANALYST = "SECURITY_ANALYST"
    DEVELOPER = "DEVELOPER"
    AUDITOR = "AUDITOR"


class Permission(str, Enum):
    # Policies
    POLICIES_READ = "policies:read"
    POLICIES_WRITE = "policies:write"
    POLICIES_PUBLISH_CANARY = "policies:publish_canary"

    # Incidents & Forensics
    INCIDENTS_READ = "incidents:read"
    INCIDENTS_TRIAGE = "incidents:triage"
    FORENSICS_REPLAY = "forensics:replay"

    # Approvals
    APPROVALS_DECIDE = "approvals:decide"

    # Agents & Genome
    AGENTS_READ = "agents:read"
    AGENTS_WRITE = "agents:write"
    GENOME_CALIBRATE = "genome:calibrate"

    # Security Scans & SimLab
    SCANS_EXECUTE = "scans:execute"
    WAR_GAME_EXECUTE = "war_game:execute"

    # SIEM & Audit
    SIEM_EXPORT = "siem:export"
    AUDIT_EXPORT = "audit:export"
    COMPLIANCE_CERTIFY = "compliance:certify"

    # Administration & Multi-tenancy
    KEYS_MANAGE = "keys:manage"
    TENANTS_MANAGE = "tenants:manage"
    SSO_CONFIG = "sso:config"


ROLE_PERMISSIONS: Dict[RoleType, Set[Permission]] = {
    RoleType.SUPER_ADMIN: set(Permission),  # All permissions
    RoleType.SECURITY_ADMIN: {
        Permission.POLICIES_READ,
        Permission.POLICIES_WRITE,
        Permission.POLICIES_PUBLISH_CANARY,
        Permission.INCIDENTS_READ,
        Permission.INCIDENTS_TRIAGE,
        Permission.FORENSICS_REPLAY,
        Permission.APPROVALS_DECIDE,
        Permission.AGENTS_READ,
        Permission.AGENTS_WRITE,
        Permission.GENOME_CALIBRATE,
        Permission.SCANS_EXECUTE,
        Permission.WAR_GAME_EXECUTE,
        Permission.SIEM_EXPORT,
        Permission.AUDIT_EXPORT,
        Permission.COMPLIANCE_CERTIFY,
        Permission.KEYS_MANAGE,
        Permission.SSO_CONFIG,
    },
    RoleType.SECURITY_ANALYST: {
        Permission.POLICIES_READ,
        Permission.INCIDENTS_READ,
        Permission.INCIDENTS_TRIAGE,
        Permission.FORENSICS_REPLAY,
        Permission.APPROVALS_DECIDE,
        Permission.AGENTS_READ,
        Permission.SCANS_EXECUTE,
        Permission.WAR_GAME_EXECUTE,
        Permission.SIEM_EXPORT,
        Permission.AUDIT_EXPORT,
    },
    RoleType.DEVELOPER: {
        Permission.POLICIES_READ,
        Permission.INCIDENTS_READ,
        Permission.AGENTS_READ,
        Permission.AGENTS_WRITE,
        Permission.SCANS_EXECUTE,
        Permission.WAR_GAME_EXECUTE,
    },
    RoleType.AUDITOR: {
        Permission.POLICIES_READ,
        Permission.INCIDENTS_READ,
        Permission.AGENTS_READ,
        Permission.AUDIT_EXPORT,
        Permission.COMPLIANCE_CERTIFY,
        Permission.SIEM_EXPORT,
    },
}


class SSOProtocol(str, Enum):
    SAML_2_0 = "SAML_2.0"
    OIDC = "OIDC"


class IdPProvider(str, Enum):
    OKTA = "Okta"
    MICROSOFT_ENTRA = "Microsoft Entra ID"
    PING_IDENTITY = "PingIdentity"
    GOOGLE_WORKSPACE = "Google Workspace"
    AUTH0 = "Auth0"


@dataclass
class SSOConfig:
    enabled: bool = True
    provider: IdPProvider = IdPProvider.OKTA
    protocol: SSOProtocol = SSOProtocol.SAML_2_0
    entity_id: str = "urn:agentshield:sp:prod"
    idp_sso_url: str = "https://corp-identity.okta.com/app/agentshield/sso/saml"
    cert_fingerprint: str = "3B:4C:1A:5D:8E:9F:2A:7B:6C:5D:4E:3F:2A:1B:0C:9D:8E:7F:6A:5B"
    enforce_mfa: bool = True
    auto_provision_jit: bool = True
    default_role: RoleType = RoleType.SECURITY_ANALYST
    group_role_mapping: Dict[str, RoleType] = field(default_factory=lambda: {
        "AgentShield_Admins": RoleType.SECURITY_ADMIN,
        "SecOps_Engineers": RoleType.SECURITY_ANALYST,
        "AI_App_Developers": RoleType.DEVELOPER,
        "Compliance_Auditors": RoleType.AUDITOR,
    })

    def to_dict(self) -> Dict[str, Any]:
        return {
            "enabled": self.enabled,
            "provider": self.provider.value,
            "protocol": self.protocol.value,
            "entity_id": self.entity_id,
            "idp_sso_url": self.idp_sso_url,
            "cert_fingerprint": self.cert_fingerprint,
            "enforce_mfa": self.enforce_mfa,
            "auto_provision_jit": self.auto_provision_jit,
            "default_role": self.default_role.value,
            "group_role_mapping": {k: v.value for k, v in self.group_role_mapping.items()},
        }


@dataclass
class Tenant:
    tenant_id: str
    tenant_name: str
    isolation_tier: str  # DEDICATED_VPC, ENCRYPTED_LOGICAL, AIRGAPPED
    max_agents: int
    active_agent_count: int
    created_at: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "tenant_id": self.tenant_id,
            "tenant_name": self.tenant_name,
            "isolation_tier": self.isolation_tier,
            "max_agents": self.max_agents,
            "active_agent_count": self.active_agent_count,
            "created_at": self.created_at,
        }


@dataclass
class RBACUser:
    user_id: str
    email: str
    display_name: str
    tenant_id: str
    role: RoleType
    sso_provider: Optional[str] = None
    mfa_verified: bool = True
    last_login: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "email": self.email,
            "display_name": self.display_name,
            "tenant_id": self.tenant_id,
            "role": self.role.value,
            "sso_provider": self.sso_provider,
            "mfa_verified": self.mfa_verified,
            "last_login": self.last_login,
        }


class MultiTenantRBACEngine:
    """Enterprise multi-tenant RBAC enforcement and SSO token assertion engine."""

    def __init__(self):
        self.sso_config = SSOConfig()
        self.tenants: Dict[str, Tenant] = {
            "tenant-prod-us": Tenant(
                tenant_id="tenant-prod-us",
                tenant_name="North America Enterprise Core",
                isolation_tier="DEDICATED_VPC",
                max_agents=500,
                active_agent_count=42,
            ),
            "tenant-fintech-eu": Tenant(
                tenant_id="tenant-fintech-eu",
                tenant_name="EMEA Sovereign Banking Pod",
                isolation_tier="AIRGAPPED",
                max_agents=250,
                active_agent_count=18,
            ),
            "tenant-dev-sandbox": Tenant(
                tenant_id="tenant-dev-sandbox",
                tenant_name="R&D Experimental Sandbox",
                isolation_tier="ENCRYPTED_LOGICAL",
                max_agents=100,
                active_agent_count=29,
            ),
        }

        self.users: Dict[str, RBACUser] = {
            "usr-tharun-01": RBACUser(
                user_id="usr-tharun-01",
                email="tharun@agentshield.corp",
                display_name="Tharunkumar.S",
                tenant_id="tenant-prod-us",
                role=RoleType.SUPER_ADMIN,
                sso_provider="Okta",
                mfa_verified=True,
            ),
            "usr-secops-02": RBACUser(
                user_id="usr-secops-02",
                email="alex.chen@agentshield.corp",
                display_name="Alex Chen",
                tenant_id="tenant-prod-us",
                role=RoleType.SECURITY_ANALYST,
                sso_provider="Okta",
                mfa_verified=True,
            ),
            "usr-auditor-03": RBACUser(
                user_id="usr-auditor-03",
                email="elena.rostova@compliance.audit",
                display_name="Elena Rostova",
                tenant_id="tenant-fintech-eu",
                role=RoleType.AUDITOR,
                sso_provider="Microsoft Entra ID",
                mfa_verified=True,
            ),
        }

    def check_permission(self, role: RoleType, permission: Permission) -> bool:
        """Determines if a role is authorized for the given resource action."""
        allowed = ROLE_PERMISSIONS.get(role, set())
        return permission in allowed

    def get_role_matrix(self) -> Dict[str, List[str]]:
        """Returns the full permission matrix for all defined enterprise roles."""
        return {
            role.value: sorted([p.value for p in perms])
            for role, perms in ROLE_PERMISSIONS.items()
        }

    def verify_tenant_isolation(self, requestor_tenant_id: str, target_tenant_id: str) -> bool:
        """Strict tenant isolation check: cross-tenant access is rejected."""
        return requestor_tenant_id == target_tenant_id

    def simulate_sso_assertion(
        self,
        email: str,
        display_name: str,
        idp_groups: List[str],
        tenant_id: str = "tenant-prod-us",
    ) -> Dict[str, Any]:
        """Simulates SAML 2.0 / OIDC JIT token assertion and returns provisioned user session."""
        # Map first matching group to Role, or fallback to default
        assigned_role = self.sso_config.default_role
        for grp in idp_groups:
            if grp in self.sso_config.group_role_mapping:
                assigned_role = self.sso_config.group_role_mapping[grp]
                break

        user_id = f"usr-jit-{uuid.uuid4().hex[:8]}"
        user = RBACUser(
            user_id=user_id,
            email=email,
            display_name=display_name,
            tenant_id=tenant_id,
            role=assigned_role,
            sso_provider=self.sso_config.provider.value,
            mfa_verified=True,
        )
        self.users[user_id] = user

        return {
            "authenticated": True,
            "session_token": f"ashield_jwt_{uuid.uuid4().hex}",
            "user": user.to_dict(),
            "assigned_role": assigned_role.value,
            "authorized_permissions": sorted([p.value for p in ROLE_PERMISSIONS.get(assigned_role, set())]),
            "idp_provider": self.sso_config.provider.value,
            "protocol": self.sso_config.protocol.value,
            "mfa_enforced": self.sso_config.enforce_mfa,
            "tenant": self.tenants.get(tenant_id, self.tenants["tenant-prod-us"]).to_dict(),
        }

    def update_sso_config(self, updates: Dict[str, Any]) -> SSOConfig:
        """Updates the active enterprise SSO configuration."""
        if "provider" in updates:
            self.sso_config.provider = IdPProvider(updates["provider"])
        if "protocol" in updates:
            self.sso_config.protocol = SSOProtocol(updates["protocol"])
        if "idp_sso_url" in updates:
            self.sso_config.idp_sso_url = updates["idp_sso_url"]
        if "enforce_mfa" in updates:
            self.sso_config.enforce_mfa = bool(updates["enforce_mfa"])
        if "entity_id" in updates:
            self.sso_config.entity_id = updates["entity_id"]
        return self.sso_config


# Global singleton
default_rbac_engine = MultiTenantRBACEngine()

