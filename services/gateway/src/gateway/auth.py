"""
AgentShield-X Gateway Authentication & Tenant Resolution
Authenticates inbound SDK requests via API Key or JWT, resolving tenant and agent boundaries.
"""

from typing import Dict, Optional
from shield_core.crypto import sha256_hex


class TenantAuthContext:
    def __init__(
        self,
        tenant_id: str,
        project_id: Optional[str] = None,
        plan: str = "enterprise",
        is_active: bool = True,
    ) -> None:
        self.tenant_id = tenant_id
        self.project_id = project_id
        self.plan = plan
        self.is_active = is_active

    def matches(self, candidate_id: Optional[str]) -> bool:
        if not candidate_id:
            return True
        return candidate_id in (self.tenant_id, self.project_id)


class Authenticator:
    """
    Resolves API keys to tenant contexts using hashed key lookup.
    """

    def __init__(self) -> None:
        # Pre-seed default development/test tenant key: "shield_test_key_phase1"
        self._key_store: Dict[str, TenantAuthContext] = {
            sha256_hex("shield_test_key_phase1"): TenantAuthContext(tenant_id="tenant_default_001"),
            sha256_hex("shield_demo_key"): TenantAuthContext(tenant_id="tenant_demo_enterprise"),
        }

    def register_key(self, raw_key: str, tenant_id: str, project_id: Optional[str] = None, plan: str = "enterprise") -> None:
        hashed = sha256_hex(raw_key)
        self._key_store[hashed] = TenantAuthContext(tenant_id=tenant_id, project_id=project_id, plan=plan)

    def authenticate_key(self, raw_key: Optional[str]) -> Optional[TenantAuthContext]:
        if not raw_key:
            return None
        hashed = sha256_hex(raw_key)
        context = self._key_store.get(hashed)
        if context and context.is_active:
            return context

        # Dynamic lookup from Control API DB
        try:
            from control_api.db import Database
            import datetime
            db = Database.get_instance()
            record = db.get_key_by_hash(hashed)
            if record:
                now = datetime.datetime.now(datetime.timezone.utc).isoformat()
                db.update_key_last_used(hashed, now)
                return TenantAuthContext(
                    tenant_id=record["org_id"],
                    project_id=record.get("project_id"),
                    plan="enterprise",
                    is_active=True,
                )
        except Exception:
            pass

        return None

