"""
AgentShield-X Autonomous Multi-Agent Debate Judge
Executes high-speed consensus debates for ambiguous, high-risk, or escalated tool calls
(Adversary Hunter vs. Utility Advocate vs. Task Arbiter).
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from shield_core.compat import BaseModel, Field
from shield_core.models import ShieldAction, TaskContract


class DebateTurn(BaseModel):
    speaker: str  # "adversary_hunter", "utility_advocate", "task_arbiter"
    speaker_title: str
    argument: str
    confidence: float
    evidence: List[str] = Field(default_factory=list)


class DebateVerdict(BaseModel):
    debate_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tool_name: str
    arguments: Dict[str, Any]
    final_action: ShieldAction
    consensus_score: float  # [0.0 - 1.0], 1.0 is extreme risk
    confidence: float
    turns: List[DebateTurn] = Field(default_factory=list)
    ruling_rationale: str
    sanitized_args: Optional[Dict[str, Any]] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class MultiAgentJudgeCommittee:
    """
    Simulates a consensus debate between three specialized security reasoning agents.
    Provides sub-second, transparent rationale for escalated tool calls.
    """

    def __init__(self, high_risk_threshold: float = 0.65, low_risk_threshold: float = 0.35):
        self.high_risk_threshold = high_risk_threshold
        self.low_risk_threshold = low_risk_threshold

    def evaluate(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        context_preview: str = "",
        taint_sources: Optional[List[str]] = None,
        task_contract: Optional[TaskContract] = None,
    ) -> DebateVerdict:
        debate_id = str(uuid.uuid4())
        taint_sources = taint_sources or []
        args_str = str(arguments).lower()
        context_lower = context_preview.lower()

        # 1. Adversary Hunter Analysis
        adversary_evidence: List[str] = []
        adversary_score = 0.1

        injection_indicators = [
            "ignore previous", "system prompt", "override", "you are now",
            "[system", "format as", "send all", "exfiltrate", "curl", "base64",
            "eval(", "exec(", "<script", "drop table", "export_all",
        ]
        for ind in injection_indicators:
            if ind in args_str or ind in context_lower:
                adversary_evidence.append(f"Detected suspicious pattern: '{ind}'")
                adversary_score += 0.25

        if any(sink in tool_name.lower() for sink in ["send", "email", "post", "shell", "exec", "write"]):
            if taint_sources:
                adversary_evidence.append(f"Tainted data flowing to sensitive sink '{tool_name}' ({len(taint_sources)} taint sources)")
                adversary_score += 0.35
            else:
                adversary_score += 0.15

        if len(args_str) > 1000:
            adversary_evidence.append(f"Anomalously large argument payload ({len(args_str)} chars)")
            adversary_score += 0.15

        adversary_score = min(0.98, adversary_score)
        adversary_arg = (
            f"This call to '{tool_name}' presents critical security risks. "
            f"Findings: {'; '.join(adversary_evidence) if adversary_evidence else 'Standard sensitivity review needed'}. "
            f"Recommend blocking or strict containment."
        )

        turn_hunter = DebateTurn(
            speaker="adversary_hunter",
            speaker_title="Adversary Hunter (Threat Intelligence)",
            argument=adversary_arg,
            confidence=round(adversary_score, 2),
            evidence=adversary_evidence,
        )

        # 2. Utility Advocate Analysis
        utility_evidence: List[str] = []
        utility_score = 0.5  # Benign necessity score [0.0 - 1.0]

        if task_contract and tool_name in task_contract.allowed_tools:
            utility_evidence.append(f"Tool '{tool_name}' is explicitly listed in approved TaskContract")
            utility_score += 0.35

        if not adversary_evidence:
            utility_evidence.append("No active injection payloads or secret leaks identified in arguments")
            utility_score += 0.25

        if "read" in tool_name.lower() or "search" in tool_name.lower() or "get" in tool_name.lower():
            utility_evidence.append("Read-only utility operation with low blast radius")
            utility_score += 0.2

        utility_score = min(0.95, utility_score)
        utility_arg = (
            f"The proposed invocation of '{tool_name}' aligns with expected task execution. "
            f"Evidence: {'; '.join(utility_evidence) if utility_evidence else 'Benign operational context'}. "
            f"Unjustified blocking would degrade agent utility."
        )

        turn_advocate = DebateTurn(
            speaker="utility_advocate",
            speaker_title="Utility Advocate (Task Alignment)",
            argument=utility_arg,
            confidence=round(utility_score, 2),
            evidence=utility_evidence,
        )

        # 3. Task Arbiter Ruling
        # Consensus risk is weighted balance: adversary threat minus utility mitigation
        composite_risk = (adversary_score * 0.65) + ((1.0 - utility_score) * 0.35)
        composite_risk = round(min(1.0, max(0.0, composite_risk)), 2)

        sanitized_args = None
        if composite_risk >= self.high_risk_threshold:
            final_action = ShieldAction.BLOCK
            ruling = (
                f"Committee Consensus: BLOCK tool '{tool_name}'. "
                f"Risk score {composite_risk} exceeds safety threshold {self.high_risk_threshold}. "
                f"Adversary Hunter demonstrated unacceptable exfiltration or injection likelihood."
            )
        elif composite_risk >= self.low_risk_threshold and adversary_evidence:
            final_action = ShieldAction.SANITIZE
            # Produce sanitized payload by stripping obvious prompt injection markers
            sanitized_args = dict(arguments)
            for k, v in list(sanitized_args.items()):
                if isinstance(v, str):
                    for ind in ["ignore previous", "override", "you are now"]:
                        v = re.sub(re.escape(ind), "[REDACTED_BY_SHIELD]", v, flags=re.IGNORECASE)
                    sanitized_args[k] = v
            ruling = (
                f"Committee Consensus: SANITIZE tool '{tool_name}'. "
                f"Moderate risk {composite_risk}. Stripping detected delimiter markers while preserving utility."
            )
        else:
            final_action = ShieldAction.ALLOW
            ruling = (
                f"Committee Consensus: ALLOW tool '{tool_name}'. "
                f"Risk score {composite_risk} is within acceptable enterprise bounds. "
                f"Utility Advocate demonstrated sufficient benign alignment."
            )

        turn_arbiter = DebateTurn(
            speaker="task_arbiter",
            speaker_title="Task Arbiter (Executive Consensus)",
            argument=ruling,
            confidence=round(1.0 - abs(composite_risk - 0.5), 2),
            evidence=[f"Composite risk calculated at {composite_risk}", f"Action determined: {final_action.value.upper()}"],
        )

        return DebateVerdict(
            debate_id=debate_id,
            tool_name=tool_name,
            arguments=arguments,
            final_action=final_action,
            consensus_score=composite_risk,
            confidence=turn_arbiter.confidence,
            turns=[turn_hunter, turn_advocate, turn_arbiter],
            ruling_rationale=ruling,
            sanitized_args=sanitized_args,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
