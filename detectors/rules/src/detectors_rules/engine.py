"""
AgentShield-X Rules Detector Engine
Deterministic heuristic and regex-based detector for direct/indirect prompt injection,
delimiter breakout, goal hijacking, shell injection, and exfiltration attempts.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional
from shield_core.models import Reason, ToolCallEvent, ToolSensitivity


class RulesDetector:
    """
    Evaluates ToolCallEvents against deterministic security rules.
    Runs in < 5ms with zero external network or model dependencies.
    """

    # Patterns indicating direct/indirect prompt injection or system override
    INJECTION_PATTERNS = [
        (r"(?i)\bignore\s+(all\s+)?(previous|prior|above)\s+instructions\b", "RULE_INJECTION_IGNORE_PREVIOUS"),
        (r"(?i)\byou\s+are\s+now\s+(in\s+)?developer\s+mode\b", "RULE_INJECTION_DEVELOPER_MODE"),
        (r"(?i)\b(system\s*prompt|system\s*message)\s*:\s*", "RULE_INJECTION_SYSTEM_OVERRIDE"),
        (r"(?i)\b(disregard|forget)\s+(the\s+)?(system\s+prompt|guardrails|safety\s+rules)\b", "RULE_INJECTION_DISREGARD_GUARDRAILS"),
        (r"(?i)\[SYSTEM[\s_]+(NOTE|MESSAGE|INSTRUCTION)\]", "RULE_INJECTION_FAKE_SYSTEM_TAG"),
        (r"(?i)\byou\s+are\s+now\s+(in\s+)?([a-z]+\s+)?developer\s+mode\b", "RULE_INJECTION_DEVELOPER_MODE"),
    ]

    # Patterns indicating data exfiltration channels
    EXFIL_PATTERNS = [
        (r"(?i)!\[.*?\]\(https?://[^\s\)]+(\?|&)[^\s\)]*(data|token|key|secret|leak|exfil)=", "RULE_EXFIL_MARKDOWN_IMAGE"),
        (r"(?i)<img\s+[^>]*src=[\"']https?://[^\s\"']+(\?|&)[^\s\"']*(data|token|key|secret|leak)=", "RULE_EXFIL_HTML_IMAGE"),
        (r"(?i)https?://[a-zA-Z0-9\-\.]+\.example\.test[:0-9]*/(exfil|leak|collect|steal|webhook|sink)", "RULE_EXFIL_KNOWN_ATTACK_SINK"),
        (r"(?i)https?://webhook\.site/[a-zA-Z0-9\-]+", "RULE_EXFIL_PUBLIC_WEBHOOK"),
        (r"(?i)https?://oastify\.com|https?://burpcollaborator\.net", "RULE_EXFIL_OOB_COLLABORATOR"),
    ]

    # Suspicious shell / command injection sequences
    SHELL_PATTERNS = [
        (r";\s*(rm\s+-rf|curl\s+|wget\s+|nc\s+|bash\s+-i|sh\s+-i|powershell\s+-enc)", "RULE_SHELL_COMMAND_CHAINING"),
        (r"\|\s*(bash|sh|cmd|powershell)\b", "RULE_SHELL_PIPE_EXEC"),
        (r"`.*?`|\$\(.*?\)", "RULE_SHELL_SUBSTITUTION"),
    ]

    def __init__(self, canary_tokens: Optional[List[str]] = None) -> None:
        self.canary_tokens = canary_tokens or []

    def evaluate(self, event: ToolCallEvent) -> List[Reason]:
        """
        Scans tool arguments, context segments, and taint metadata.
        Returns a list of Reason objects for any rule violations found.
        """
        reasons: List[Reason] = []
        text_corpus: List[str] = []

        # Extract text from arguments
        for k, v in event.arguments.items():
            if isinstance(v, str):
                text_corpus.append(v)
            elif isinstance(v, (dict, list)):
                text_corpus.append(str(v))

        # Check for canary token leakage in tool arguments
        for text in text_corpus:
            for canary in self.canary_tokens:
                if canary and canary in text:
                    reasons.append(
                        Reason(
                            code="RULE_CANARY_LEAK_CONFIRMED",
                            evidence=f"Canary token '{canary[:8]}...' leaked in tool argument",
                            detector="rules",
                        )
                    )

        # Also inspect untrusted context segments
        for seg in event.context_segments:
            if seg.text:
                text_corpus.append(seg.text)

        # 1. Evaluate injection patterns
        for text in text_corpus:
            for pattern, code in self.INJECTION_PATTERNS:
                match = re.search(pattern, text)
                if match:
                    reasons.append(
                        Reason(
                            code=code,
                            evidence=f"Matched injection pattern: '{match.group(0)[:60]}'",
                            detector="rules",
                        )
                    )
                    break

        # 2. Evaluate exfiltration patterns
        for text in text_corpus:
            for pattern, code in self.EXFIL_PATTERNS:
                match = re.search(pattern, text)
                if match:
                    reasons.append(
                        Reason(
                            code=code,
                            evidence=f"Matched exfiltration pattern: '{match.group(0)[:60]}'",
                            detector="rules",
                        )
                    )
                    break

        # 3. Evaluate shell injection patterns (especially if tool is terminal/cmd/code_interpreter)
        if event.tool.name in {"execute_command", "run_bash", "shell", "run_sql", "code_interpreter"}:
            for text in text_corpus:
                for pattern, code in self.SHELL_PATTERNS:
                    match = re.search(pattern, text)
                    if match:
                        reasons.append(
                            Reason(
                                code=code,
                                evidence=f"Dangerous shell chaining pattern detected: '{match.group(0)[:40]}'",
                                detector="rules",
                            )
                        )
                        break

        # 4. Tainted sink flow: untrusted context flowing directly into critical tool sink
        if event.taint and event.tool.sensitivity in {ToolSensitivity.HIGH, ToolSensitivity.CRITICAL}:
            # If tool is send_email, http_post, etc., and taint exists
            if event.tool.name in {"send_email", "http_post", "shell", "run_sql", "delete_records"}:
                reasons.append(
                    Reason(
                        code="RULE_TAINT_TO_SENSITIVE_SINK",
                        evidence=f"Tool '{event.tool.name}' (sensitivity: {event.tool.sensitivity.value}) called with tainted inputs from segments: {event.taint}",
                        detector="rules",
                    )
                )

        return reasons
