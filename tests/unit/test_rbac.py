"""Unit tests for AgentShield Multi-Tenant RBAC & Enterprise SSO Engine.

Architect: Tharunkumar.S | AgentShield-X Security Labs
"""

import pytest
from shield_core.rbac import (
    MultiTenantRBACEngine,
    default_rbac_engine,
    RoleType,
    Permission,
    IdPProvider,
    SSOProtocol,
)


def test_rbac_role_permissions():
    engine = MultiTenantRBACEngine()

    # Super Admin has everything
    assert engine.check_permission(RoleType.SUPER_ADMIN, Permission.POLICIES_WRITE)
    assert engine.check_permission(RoleType.SUPER_ADMIN, Permission.KEYS_MANAGE)
    assert engine.check_permission(RoleType.SUPER_ADMIN, Permission.AUDIT_EXPORT)

    # Security Admin has write access to policies and keys
    assert engine.check_permission(RoleType.SECURITY_ADMIN, Permission.POLICIES_WRITE)
    assert engine.check_permission(RoleType.SECURITY_ADMIN, Permission.KEYS_MANAGE)
    assert engine.check_permission(RoleType.SECURITY_ADMIN, Permission.APPROVALS_DECIDE)

    # Security Analyst can triage and replay but cannot write policies or manage keys
    assert engine.check_permission(RoleType.SECURITY_ANALYST, Permission.INCIDENTS_TRIAGE)
    assert engine.check_permission(RoleType.SECURITY_ANALYST, Permission.FORENSICS_REPLAY)
    assert not engine.check_permission(RoleType.SECURITY_ANALYST, Permission.POLICIES_WRITE)
    assert not engine.check_permission(RoleType.SECURITY_ANALYST, Permission.KEYS_MANAGE)

    # Developer can write agents and execute scans but cannot export audit logs or configure SSO
    assert engine.check_permission(RoleType.DEVELOPER, Permission.AGENTS_WRITE)
    assert engine.check_permission(RoleType.DEVELOPER, Permission.SCANS_EXECUTE)
    assert not engine.check_permission(RoleType.DEVELOPER, Permission.AUDIT_EXPORT)
    assert not engine.check_permission(RoleType.DEVELOPER, Permission.SSO_CONFIG)

    # Auditor can read and export audits/compliance but cannot write policies or agents
    assert engine.check_permission(RoleType.AUDITOR, Permission.AUDIT_EXPORT)
    assert engine.check_permission(RoleType.AUDITOR, Permission.COMPLIANCE_CERTIFY)
    assert not engine.check_permission(RoleType.AUDITOR, Permission.POLICIES_WRITE)
    assert not engine.check_permission(RoleType.AUDITOR, Permission.AGENTS_WRITE)


def test_tenant_isolation_boundary():
    engine = MultiTenantRBACEngine()

    assert engine.verify_tenant_isolation("tenant-prod-us", "tenant-prod-us") is True
    assert engine.verify_tenant_isolation("tenant-fintech-eu", "tenant-fintech-eu") is True

    # Strict isolation: Cross-tenant access strictly forbidden
    assert engine.verify_tenant_isolation("tenant-prod-us", "tenant-fintech-eu") is False
    assert engine.verify_tenant_isolation("tenant-dev-sandbox", "tenant-prod-us") is False


def test_sso_jit_assertion_mapping():
    engine = MultiTenantRBACEngine()

    # User in SecOps_Engineers group should map to SECURITY_ANALYST
    session = engine.simulate_sso_assertion(
        email="devops@corp.internal",
        display_name="DevOps SecOps",
        idp_groups=["SecOps_Engineers", "All_Employees"],
        tenant_id="tenant-prod-us",
    )

    assert session["authenticated"] is True
    assert session["assigned_role"] == RoleType.SECURITY_ANALYST.value
    assert Permission.FORENSICS_REPLAY.value in session["authorized_permissions"]
    assert session["idp_provider"] == "Okta"
    assert session["tenant"]["tenant_id"] == "tenant-prod-us"


def test_sso_config_update():
    engine = MultiTenantRBACEngine()
    updated = engine.update_sso_config({
        "provider": IdPProvider.MICROSOFT_ENTRA.value,
        "protocol": SSOProtocol.OIDC.value,
        "idp_sso_url": "https://login.microsoftonline.com/tenant-id/oauth2/v2.0/token",
        "enforce_mfa": True,
    })

    assert updated.provider == IdPProvider.MICROSOFT_ENTRA
    assert updated.protocol == SSOProtocol.OIDC
    assert "login.microsoftonline.com" in updated.idp_sso_url
    assert updated.enforce_mfa is True


def test_role_matrix_completeness():
    engine = MultiTenantRBACEngine()
    matrix = engine.get_role_matrix()

    for role in RoleType:
        assert role.value in matrix
        assert len(matrix[role.value]) > 0

