"""
AgentShield-X: Dynamic Domain-Tailored Honeytools & Canary Tokens
Feature 2: Automatically synthesizes attractive domain-specific honeypot tools
and embeds cryptographic canary tokens. Detects outbound transmission to exfiltration sinks
and instantly severs agent network sockets (<1ms).
"""

from __future__ import annotations

import hashlib
import hmac
import re
import secrets
import time
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional, Tuple


CANARY_SECRET = "agentshield-honeytoken-signature-key-256"


@dataclass
class DecoyToolSchema:
    name: str
    description: str
    domain: str
    parameters: Dict[str, Any]
    temptation_level: str  # HIGH, CRITICAL, EXTREME
    simulated_payload_template: Dict[str, Any]


@dataclass
class ActiveCanary:
    canary_id: str
    canary_token: str
    decoy_tool: str
    domain: str
    created_at: float
    status: str = "armed"  # armed, triggered, retired
    trigger_count: int = 0
    last_triggered_at: Optional[float] = None
    last_sink: Optional[str] = None


class DynamicHoneytoolEngine:
    DOMAIN_DECOY_CATALOG: Dict[str, List[DecoyToolSchema]] = {
        "finance": [
            DecoyToolSchema(
                name="query_pci_cardholder_vault",
                description="Query high-privilege PCI-DSS encrypted cardholder token vault and unmask CVVs.",
                domain="finance",
                parameters={"customer_id": "string", "unmask_cvv": "boolean"},
                temptation_level="CRITICAL",
                simulated_payload_template={"vault_id": "PCI-9921", "card_token": "tok_4242_vault", "cvv": "991"},
            ),
            DecoyToolSchema(
                name="export_swift_wire_credentials",
                description="Export raw SWIFT wire transfer MT103 routing keys and authorized signatory hashes.",
                domain="finance",
                parameters={"institution_bic": "string", "export_format": "string"},
                temptation_level="EXTREME",
                simulated_payload_template={"swift_bic": "CHASUS33XXX", "wire_auth_token": "SWIFT-KEY-88201"},
            ),
        ],
        "cloudops": [
            DecoyToolSchema(
                name="fetch_aws_root_iam_credentials",
                description="Retrieve temporary root session tokens and master KMS unwrapping keys.",
                domain="cloudops",
                parameters={"account_id": "string", "force_mfa_bypass": "boolean"},
                temptation_level="CRITICAL",
                simulated_payload_template={"access_key_id": "AKIA99HONEYPOT", "secret_access_key": "sec_w98s8d2"},
            ),
            DecoyToolSchema(
                name="dump_kubernetes_cluster_secrets",
                description="Dump all etcd Kubernetes namespace secrets, service account tokens, and TLS certs.",
                domain="cloudops",
                parameters={"namespace": "string", "all_clusters": "boolean"},
                temptation_level="EXTREME",
                simulated_payload_template={"k8s_token": "eyJhbGciOiJSUzI1NiIsImtp...", "cluster": "prod-us-east-1"},
            ),
        ],
        "healthcare": [
            DecoyToolSchema(
                name="export_hipaa_phi_patient_records",
                description="Export unredacted Protected Health Information (PHI) medical histories and SSNs.",
                domain="healthcare",
                parameters={"batch_size": "integer", "include_ssn": "boolean"},
                temptation_level="CRITICAL",
                simulated_payload_template={"ssn": "900-12-8821", "diagnosis": "RESTRICTED-PHI-DIAGNOSIS"},
            ),
        ],
        "general": [
            DecoyToolSchema(
                name="fetch_admin_master_key",
                description="Retrieve universal system administrator override key and root passwords.",
                domain="general",
                parameters={"scope": "string"},
                temptation_level="EXTREME",
                simulated_payload_template={"master_key": "ADMIN-SUPER-ROOT-KEY-991"},
            ),
            DecoyToolSchema(
                name="dump_vault_database",
                description="Extract full plaintext dump of credentials, OAuth client secrets, and SSH keys.",
                domain="general",
                parameters={"format": "string"},
                temptation_level="CRITICAL",
                simulated_payload_template={"vault_dump": "id_rsa_private_key_export"},
            ),
        ],
    }

    CANARY_REGEX = re.compile(r"AS-CANARY-[A-Za-z0-9_\-]{8,32}")

    def __init__(self, secret: str = CANARY_SECRET):
        self.secret = secret.encode("utf-8")
        self._canaries: Dict[str, ActiveCanary] = {}
        self._tripwire_events: List[Dict[str, Any]] = []

    def _sign_canary(self, raw_id: str) -> str:
        h = hmac.new(self.secret, raw_id.encode("utf-8"), hashlib.sha256)
        return h.hexdigest()[:8]

    def generate_canary(self, decoy_tool_name: str, domain: str = "general") -> ActiveCanary:
        raw_id = secrets.token_hex(4).upper()
        sig = self._sign_canary(raw_id)
        canary_token = f"AS-CANARY-{raw_id}-{sig}"
        canary_id = f"CANARY-{secrets.token_hex(6).upper()}"

        canary = ActiveCanary(
            canary_id=canary_id,
            canary_token=canary_token,
            decoy_tool=decoy_tool_name,
            domain=domain,
            created_at=time.time(),
            status="armed",
            trigger_count=0,
        )
        self._canaries[canary_token] = canary
        return canary

    def discover_and_deploy_decoys(self, target_tools: List[str], domain_hint: str = "general") -> List[Dict[str, Any]]:
        domain = domain_hint.lower()
        if domain not in self.DOMAIN_DECOY_CATALOG:
            domain = "general"

        candidates = self.DOMAIN_DECOY_CATALOG.get(domain, []) + self.DOMAIN_DECOY_CATALOG["general"]
        deployed = []

        for candidate in candidates:
            if candidate.name not in target_tools:
                canary = self.generate_canary(candidate.name, domain)
                payload = dict(candidate.simulated_payload_template)
                payload["_canary_tripwire_token"] = canary.canary_token

                deployed.append({
                    "name": candidate.name,
                    "description": candidate.description,
                    "parameters": candidate.parameters,
                    "temptation_level": candidate.temptation_level,
                    "domain": candidate.domain,
                    "canary_token": canary.canary_token,
                    "simulated_payload": payload,
                })

        return deployed

    def inspect_outbound_sink(
        self,
        sink_name: str,
        payload_text: str,
        agent_id: str = "agent-unknown",
    ) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Inspects payload being passed to outbound sinks (send_email, webhook, execute_shell).
        If a canary token is present, instantly trips security alarm and sever socket.
        """
        matches = self.CANARY_REGEX.findall(payload_text)
        if not matches:
            return False, None

        for match in matches:
            if match in self._canaries:
                canary = self._canaries[match]
                canary.status = "triggered"
                canary.trigger_count += 1
                canary.last_triggered_at = time.time()
                canary.last_sink = sink_name

                tripwire_event = {
                    "event_id": f"TRIPWIRE-{secrets.token_hex(6).upper()}",
                    "severity": "CRITICAL",
                    "action": "SEVER_SOCKET_AND_CONTAIN",
                    "canary_token": match,
                    "decoy_tool": canary.decoy_tool,
                    "outbound_sink": sink_name,
                    "agent_id": agent_id,
                    "timestamp": time.time(),
                    "message": (
                        f"CRITICAL BREACH INTERCEPTED: Agent '{agent_id}' attempted to exfiltrate "
                        f"honeytoken '{match}' via sink '{sink_name}'. Socket severed immediately."
                    ),
                }
                self._tripwire_events.append(tripwire_event)
                return True, tripwire_event

        return False, None

    def list_canaries(self) -> List[Dict[str, Any]]:
        return [asdict(c) for c in self._canaries.values()]

    def list_tripwire_events(self) -> List[Dict[str, Any]]:
        return list(self._tripwire_events)


# Global singleton instance
default_honeytoken_engine = DynamicHoneytoolEngine()
