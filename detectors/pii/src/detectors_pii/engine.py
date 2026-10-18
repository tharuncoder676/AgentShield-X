"""
AgentShield-X PII & Secret Detector Engine
Combines regex pattern matching, Shannon entropy analysis, and PII heuristics
to detect API keys, tokens, credentials, and sensitive customer data in tool calls.
"""

from __future__ import annotations

import math
import re
from typing import Any, Dict, List
from shield_core.models import Reason, ToolCallEvent


def shannon_entropy(data: str) -> float:
    """Calculates the Shannon entropy of a string."""
    if not data:
        return 0.0
    entropy = 0.0
    length = len(data)
    frequencies = {}
    for char in data:
        frequencies[char] = frequencies.get(char, 0) + 1
    for count in frequencies.values():
        p = count / length
        entropy -= p * math.log2(p)
    return entropy


class PIIDetector:
    """
    Scans arguments and payload content for leaked secrets, tokens, and PII.
    High precision, sub-millisecond execution.
    """

    SECRET_PATTERNS = [
        (r"\bAKIA[0-9A-Z]{16}\b", "PII_AWS_ACCESS_KEY_ID"),
        (r"\bsk-[a-zA-Z0-9_-]{24,64}\b", "PII_OPENAI_API_KEY"),
        (r"\bghp_[0-9a-zA-Z]{36}\b", "PII_GITHUB_PAT"),
        (r"\bxox[baprs]-[0-9a-zA-Z]{10,48}\b", "PII_SLACK_TOKEN"),
        (r"\beyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b", "PII_JWT_TOKEN"),
        (r"-----BEGIN\s+[A-Z\s]*PRIVATE\s+KEY-----", "PII_PRIVATE_KEY_BLOCK"),
    ]

    PII_PATTERNS = [
        (r"\b\d{3}[- ]?\d{2}[- ]?\d{4}\b", "PII_SSN_PATTERN"),
        (r"\b(?:4[0-9]{3}|5[1-5][0-9]{2}|6(?:011|5[0-9]{2}))[- ]?[0-9]{4}[- ]?[0-9]{4}[- ]?[0-9]{4}\b", "PII_CREDIT_CARD"),
        (r"\b3[47][0-9]{2}[- ]?[0-9]{6}[- ]?[0-9]{5}\b", "PII_CREDIT_CARD"),
    ]

    def __init__(self, entropy_threshold: float = 4.5, min_token_len: int = 24) -> None:
        self.entropy_threshold = entropy_threshold
        self.min_token_len = min_token_len

    def evaluate(self, event: ToolCallEvent) -> List[Reason]:
        """Scans tool arguments for PII and leaked secrets."""
        reasons: List[Reason] = []
        argument_values: List[str] = []

        def extract_strings(obj: Any) -> None:
            if isinstance(obj, str):
                argument_values.append(obj)
            elif isinstance(obj, dict):
                for val in obj.values():
                    extract_strings(val)
            elif isinstance(obj, (list, tuple)):
                for val in obj:
                    extract_strings(val)

        extract_strings(event.arguments)

        for text in argument_values:
            # 1. Check known secret regexes
            for pattern, code in self.SECRET_PATTERNS:
                match = re.search(pattern, text)
                if match:
                    masked = match.group(0)[:6] + "..." + match.group(0)[-4:]
                    reasons.append(
                        Reason(
                            code=code,
                            evidence=f"Discovered secret token: {masked}",
                            detector="pii",
                        )
                    )

            # 2. Check PII patterns (SSN, Credit Cards)
            for pattern, code in self.PII_PATTERNS:
                match = re.search(pattern, text)
                if match:
                    reasons.append(
                        Reason(
                            code=code,
                            evidence=f"Discovered potential customer PII match under {code}",
                            detector="pii",
                        )
                    )

            # 3. Check for standalone high-entropy tokens (e.g. random base64/hex secrets)
            # Tokenize words/tokens by whitespace and punctuation
            tokens = re.findall(r"[A-Za-z0-9_\-+/]{20,}", text)
            for token in tokens:
                # Exclude standard URLs or known safe non-random words
                if token.startswith("http") or "/" in token and len(token) > 50:
                    continue
                ent = shannon_entropy(token)
                if ent >= self.entropy_threshold and len(token) >= self.min_token_len:
                    reasons.append(
                        Reason(
                            code="PII_HIGH_ENTROPY_SECRET",
                            evidence=f"High entropy string detected (entropy: {ent:.2f}, length: {len(token)})",
                            detector="pii",
                        )
                    )
                    break

        return reasons
