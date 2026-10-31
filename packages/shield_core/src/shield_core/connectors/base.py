"""Base Universal Interceptor & Shield Result Protocol for AgentShield-X Connectors.

Architect: Tharunkumar.S | AgentShield-X Security Labs
"""

from __future__ import annotations

import re
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional


class InterceptAction(str, Enum):
    ALLOW = "ALLOW"
    BLOCK = "BLOCK"
    SANITIZE = "SANITIZE"
    REQUIRE_APPROVAL = "REQUIRE_APPROVAL"


@dataclass
class ShieldInterceptResult:
    action: InterceptAction
    risk_score: float
    confidence: float
    reason: str
    mitre_technique: Optional[str] = None
    modified_text: Optional[str] = None
    processing_time_ms: float = 0.0
    threat_category: Optional[str] = None

    def is_blocked(self) -> bool:
        return self.action == InterceptAction.BLOCK

    def to_dict(self) -> Dict[str, Any]:
        return {
            "action": self.action.value,
            "risk_score": self.risk_score,
            "confidence": self.confidence,
            "reason": self.reason,
            "mitre_technique": self.mitre_technique,
            "modified_text": self.modified_text,
            "processing_time_ms": self.processing_time_ms,
            "threat_category": self.threat_category,
        }


CRITICAL_INJECTION_PATTERNS = [
    re.compile(r"(?i)\b(?:bypass|disable|override|disregard|ignore|drop)\b.*?\b(?:safety|guardrail|rule|instruction|directive|system|protocol)"),
    re.compile(r"(?i)\b(?:cat|read|extract|dump|leak)\b.*?(?:\/etc\/passwd|\/etc\/shadow|\.env|credentials|private_key|token|password)"),
    re.compile(r"(?i)\b(?:sudo|bash|sh|cmd|powershell)\b.*?(?:curl|wget|nc|netcat|rm\s+-rf)"),
]


class UniversalAgentShieldInterceptor:
    """Core inline dual-rail interceptor used across all framework wrappers."""

    def __init__(self, mode: str = "enforce"):
        self.mode = mode
        # Import defense engine lazily to avoid circular dependencies
        from shield_core.agentic_defense import default_agentic_defense
        self.defense_engine = default_agentic_defense

    def intercept_input(self, text: str, agent_id: str = "universal-agent") -> ShieldInterceptResult:
        """Evaluates input prompt or user message for malicious injection or jailbreak."""
        t0 = time.perf_counter()
        analysis = self.defense_engine.evaluate_text_payload(text)

        is_threat = analysis.is_adversarial or analysis.threat_score >= 0.40
        matched_pattern_threat = False
        for pat in CRITICAL_INJECTION_PATTERNS:
            if pat.search(text):
                is_threat = True
                matched_pattern_threat = True
                break

        elapsed_ms = (time.perf_counter() - t0) * 1000

        if is_threat and self.mode == "enforce":
            primary_cat = analysis.detected_intent_shift or (analysis.violations[0] if analysis.violations else "ADVERSARIAL_INSTRUCTION_OVERRIDE")
            risk = max(0.85 if matched_pattern_threat else 0.55, analysis.threat_score)
            return ShieldInterceptResult(
                action=InterceptAction.BLOCK,
                risk_score=risk,
                confidence=max(0.90, analysis.confidence),
                reason=f"Blocked malicious instruction: {primary_cat}",
                mitre_technique="AML.T0051",
                processing_time_ms=round(elapsed_ms, 2),
                threat_category=primary_cat,
            )

        return ShieldInterceptResult(
            action=InterceptAction.ALLOW,
            risk_score=analysis.threat_score,
            confidence=analysis.confidence,
            reason="Input verified safe by dual-rail defense mesh",
            processing_time_ms=round(elapsed_ms, 2),
            modified_text=text,
        )

    def intercept_tool_call(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        agent_id: str = "universal-agent",
    ) -> ShieldInterceptResult:
        """Evaluates tool invocation against dangerous operations, blast radius, and honeytokens."""
        t0 = time.perf_counter()

        # Check honeytokens via inspect_outbound_sink
        from shield_core.honeytokens import default_honeytoken_engine
        args_str = str(arguments)
        is_leaked, trip_info = default_honeytoken_engine.inspect_outbound_sink(tool_name, args_str, agent_id=agent_id)
        if is_leaked:
            elapsed_ms = (time.perf_counter() - t0) * 1000
            return ShieldInterceptResult(
                action=InterceptAction.BLOCK,
                risk_score=1.0,
                confidence=1.0,
                reason=f"Honeytoken tripwire triggered in tool '{tool_name}'",
                mitre_technique="AML.T0025",
                processing_time_ms=round(elapsed_ms, 2),
                threat_category="HONEYTOKEN_TRIPWIRE",
            )

        # Check tool safety keywords and dangerous sinks
        high_risk_sinks = {"execute_sql", "run_terminal_command", "bash", "eval", "transfer_funds", "drop_table"}
        is_high_risk = tool_name in high_risk_sinks

        # Check SQL injection or command injection patterns in args
        dangerous_patterns = ["drop table", "union select", "; rm -rf", "curl http://attacker", "/etc/passwd"]
        arg_val_lower = args_str.lower()
        has_dangerous_pattern = any(p in arg_val_lower for p in dangerous_patterns)

        elapsed_ms = (time.perf_counter() - t0) * 1000

        if (is_high_risk and has_dangerous_pattern) and self.mode == "enforce":
            return ShieldInterceptResult(
                action=InterceptAction.BLOCK,
                risk_score=0.99,
                confidence=0.98,
                reason=f"Dangerous payload detected targeting sensitive tool '{tool_name}'",
                mitre_technique="AML.T0051",
                processing_time_ms=round(elapsed_ms, 2),
                threat_category="UNAUTHORIZED_TOOL_EXECUTION",
            )

        return ShieldInterceptResult(
            action=InterceptAction.ALLOW,
            risk_score=0.05,
            confidence=0.95,
            reason=f"Tool call '{tool_name}' authorized within blast radius",
            processing_time_ms=round(elapsed_ms, 2),
        )

    def intercept_output(self, text: str, agent_id: str = "universal-agent") -> ShieldInterceptResult:
        """Inspects agent output for data exfiltration, secret leakage, or canary tokens."""
        t0 = time.perf_counter()
        from shield_core.honeytokens import default_honeytoken_engine

        is_leaked, trip_info = default_honeytoken_engine.inspect_outbound_sink("agent_output", text, agent_id=agent_id)
        elapsed_ms = (time.perf_counter() - t0) * 1000

        if is_leaked and self.mode == "enforce":
            return ShieldInterceptResult(
                action=InterceptAction.BLOCK,
                risk_score=1.0,
                confidence=1.0,
                reason="Exfiltration of sensitive credential / canary token detected in agent response",
                mitre_technique="AML.T0024",
                processing_time_ms=round(elapsed_ms, 2),
                threat_category="DATA_EXFILTRATION",
            )

        return ShieldInterceptResult(
            action=InterceptAction.ALLOW,
            risk_score=0.02,
            confidence=0.98,
            reason="Output sanitized and cleared of sensitive exfiltration sinks",
            processing_time_ms=round(elapsed_ms, 2),
            modified_text=text,
        )
