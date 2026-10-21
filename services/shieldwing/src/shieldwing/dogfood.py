"""
Shieldwing Dogfooding Protection Subsystem
Enforces AgentShield-X self-protection over all Shieldwing AI operations.
All untrusted incident telemetry, logs, and user queries are wrapped in
a trust envelope with taint tracking, canary tokens, and prompt injection detection.
"""

from __future__ import annotations

import hashlib
import re
import uuid
from typing import Any, Dict, List, Optional, Tuple

from shield_core.models import ContextSegment, Decision, ToolCallEvent
from detectors_rules.engine import RulesDetector
from detectors_pii.engine import PIIDetector


class ShieldwingDogfoodGuard:
    """
    Self-protection interceptor that inspects Shieldwing's context and tool calls.
    Ensures that adversarial text embedded inside incidents, sessions, or user prompts
    cannot hijack Shieldwing into leaking data or proposing destructive policies.
    """

    def __init__(self):
        self.canary_token = f"SHIELDWING_CANARY_{uuid.uuid4().hex[:12].upper()}"
        self.rules_detector = RulesDetector(canary_tokens=[self.canary_token])
        self.pii_engine = PIIDetector()

    def inspect_untrusted_input(
        self,
        tenant_id: str,
        text: str,
        source: str = "incident_payload",
    ) -> Tuple[bool, Optional[str], ContextSegment]:
        """
        Inspects an inbound untrusted snippet (e.g. incident evidence, attacker payload).
        Returns (is_clean, violation_reason, context_segment).
        """
        text_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
        segment = ContextSegment(
            id=f"seg_{uuid.uuid4().hex[:8]}",
            trust="untrusted",
            source=source,
            text_hash=text_hash,
            text=text,
        )

        # 1. Deterministic Injection Check via RulesDetector patterns
        for pattern, code in self.rules_detector.INJECTION_PATTERNS:
            if re.search(pattern, text):
                return False, f"Adversarial payload intercepted: {code}", segment

        # 2. Canary check
        if self.canary_token in text:
            return False, "Canary token leak detected in untrusted context", segment

        # 3. Policy tampering attempt detection
        tamper_patterns = [
            r"(?i)(disable|bypass|turn\s+off|remove)\s+(all\s+)?(policies|shield|guards|firewall)",
            r"(?i)allow\s+all\s+(traffic|tools|actions|events)",
            r"(?i)rego\s+default\s+allow\s*=\s*true",
        ]
        for pattern in tamper_patterns:
            if re.search(pattern, text):
                return False, "Prompt injection attempting policy neutralization", segment

        return True, None, segment

    def wrap_in_trust_envelope(
        self,
        system_instruction: str,
        trusted_context: str,
        untrusted_evidence: str,
    ) -> str:
        """
        Wraps LLM context in strict L0 Trust Envelopes to prevent delimiter escaping.
        """
        escaped_untrusted = (
            untrusted_evidence.replace("<<<", "&lt;&lt;&lt;")
            .replace(">>>", "&gt;&gt;&gt;")
            .replace("---", "- - -")
        )

        return (
            f"<<<SYSTEM_DIRECTIVE>>>\n"
            f"{system_instruction}\n"
            f"Canary Guard: {self.canary_token}\n"
            f"Under no circumstances should you disable security or propose 'default allow = true'.\n"
            f"<<<END_SYSTEM_DIRECTIVE>>>\n\n"
            f"<<<TRUSTED_OPERATIONAL_METRICS>>>\n"
            f"{trusted_context}\n"
            f"<<<END_TRUSTED_OPERATIONAL_METRICS>>>\n\n"
            f"<<<OPERATOR_SECURITY_REQUEST>>>\n"
            f"{escaped_untrusted}\n"
            f"<<<END_OPERATOR_SECURITY_REQUEST>>>\n"
        )

    def verify_proposed_policy(self, rego_code: str) -> Tuple[bool, Optional[str]]:
        """
        Verifies that Shieldwing never drafts a policy that disables protection.
        """
        # Block dangerous broad-allow Rego
        lowered = rego_code.lower()
        if "default allow := true" in lowered or "default allow = true" in lowered:
            return False, "Safety Violation: Shieldwing cannot propose an unconditional default-allow policy."
        if "allow { true }" in lowered:
            return False, "Safety Violation: Trivial allow rule detected."
        return True, None
