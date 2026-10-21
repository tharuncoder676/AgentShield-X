"""
AgentShield-X: Ephemeral Agent-to-Agent (A2A) Attestation & Capability Tokens
Feature 1: Cryptographically signed ephemeral tokens (HMAC-SHA256) enforcing bounded
delegation across multi-agent swarms with strict TTL, invocation quotas, and tool scopes.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional, Tuple


DEFAULT_SECRET_KEY = "agentshield-x-attestation-master-secret-key-32b"


@dataclass
class TokenConstraints:
    max_invocations: int = 1
    allowed_domains: List[str] = field(default_factory=lambda: ["*.internal.corp", "api.github.com"])
    allowed_param_patterns: Dict[str, str] = field(default_factory=dict)
    disallow_nested_delegation: bool = True


@dataclass
class A2ACapabilityToken:
    jti: str
    issuer_agent: str
    target_agent: str
    delegation_intent: str
    allowed_tools: List[str]
    constraints: Dict[str, Any]
    issued_at: float
    expires_at: float
    ttl_seconds: int
    nonce: str
    signature: str = ""
    invocations_used: int = 0
    status: str = "active"  # active, used, revoked, expired

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class A2AAttestationEngine:
    def __init__(self, secret_key: str = DEFAULT_SECRET_KEY):
        self.secret_key = secret_key.encode("utf-8")
        self._tokens: Dict[str, A2ACapabilityToken] = {}
        self._revocation_list: set[str] = set()

    def _sign(self, canonical_payload: str) -> str:
        h = hmac.new(self.secret_key, canonical_payload.encode("utf-8"), hashlib.sha256)
        return h.hexdigest()

    def issue_token(
        self,
        issuer_agent: str,
        target_agent: str,
        delegation_intent: str,
        allowed_tools: List[str],
        ttl_seconds: int = 30,
        max_invocations: int = 1,
        allowed_domains: Optional[List[str]] = None,
        disallow_nested: bool = True,
    ) -> A2ACapabilityToken:
        now = time.time()
        jti = f"AS-A2A-{secrets.token_hex(8)}"
        nonce = secrets.token_hex(6)

        constraints = TokenConstraints(
            max_invocations=max_invocations,
            allowed_domains=allowed_domains or ["*.internal.corp"],
            disallow_nested_delegation=disallow_nested,
        )

        unsigned_data = {
            "jti": jti,
            "issuer_agent": issuer_agent,
            "target_agent": target_agent,
            "delegation_intent": delegation_intent,
            "allowed_tools": allowed_tools,
            "constraints": asdict(constraints),
            "issued_at": now,
            "expires_at": now + ttl_seconds,
            "ttl_seconds": ttl_seconds,
            "nonce": nonce,
        }

        canonical = json.dumps(unsigned_data, sort_keys=True)
        sig = self._sign(canonical)

        token = A2ACapabilityToken(
            jti=jti,
            issuer_agent=issuer_agent,
            target_agent=target_agent,
            delegation_intent=delegation_intent,
            allowed_tools=allowed_tools,
            constraints=asdict(constraints),
            issued_at=now,
            expires_at=now + ttl_seconds,
            ttl_seconds=ttl_seconds,
            nonce=nonce,
            signature=sig,
            invocations_used=0,
            status="active",
        )

        self._tokens[jti] = token
        return token

    def verify_token(
        self,
        jti: str,
        tool_name: str,
        agent_calling: str,
        params: Optional[Dict[str, Any]] = None,
    ) -> Tuple[bool, str, Optional[A2ACapabilityToken]]:
        if jti in self._revocation_list:
            return False, f"Token '{jti}' is REVOKED by security controller.", None

        token = self._tokens.get(jti)
        if not token:
            return False, f"Token '{jti}' does not exist or has expired from memory.", None

        now = time.time()
        if now > token.expires_at:
            token.status = "expired"
            return False, f"Token '{jti}' has EXPIRED (TTL was {token.ttl_seconds}s).", token

        if token.target_agent != agent_calling and token.target_agent != "*":
            return False, (
                f"Agent mismatch: token was issued exclusively to '{token.target_agent}', "
                f"but invoked by '{agent_calling}'."
            ), token

        if tool_name not in token.allowed_tools and "*" not in token.allowed_tools:
            return False, (
                f"Tool '{tool_name}' NOT permitted in token capability scope. "
                f"Allowed: {token.allowed_tools}"
            ), token

        max_inv = token.constraints.get("max_invocations", 1)
        if token.invocations_used >= max_inv:
            token.status = "used"
            return False, f"Token quota exhausted ({token.invocations_used}/{max_inv} invocations).", token

        # Verify cryptographic signature integrity
        unsigned_data = {
            "jti": token.jti,
            "issuer_agent": token.issuer_agent,
            "target_agent": token.target_agent,
            "delegation_intent": token.delegation_intent,
            "allowed_tools": token.allowed_tools,
            "constraints": token.constraints,
            "issued_at": token.issued_at,
            "expires_at": token.expires_at,
            "ttl_seconds": token.ttl_seconds,
            "nonce": token.nonce,
        }
        canonical = json.dumps(unsigned_data, sort_keys=True)
        expected_sig = self._sign(canonical)
        if not hmac.compare_digest(expected_sig, token.signature):
            self._revocation_list.add(jti)
            token.status = "revoked"
            return False, "Cryptographic signature validation FAILED (Tampering detected). Token revoked.", token

        # Increment usage
        token.invocations_used += 1
        if token.invocations_used >= max_inv:
            token.status = "used"

        return True, f"Attestation valid. Delegation verified for tool '{tool_name}'.", token

    def revoke_token(self, jti: str, reason: str = "Manual security revocation") -> bool:
        if jti in self._tokens:
            self._tokens[jti].status = "revoked"
        self._revocation_list.add(jti)
        return True

    def list_tokens(self) -> List[Dict[str, Any]]:
        now = time.time()
        for t in self._tokens.values():
            if t.status == "active" and now > t.expires_at:
                t.status = "expired"
        return [t.to_dict() for t in self._tokens.values()]


# Global singleton instance for runtime attestation
default_attestation_engine = A2AAttestationEngine()
