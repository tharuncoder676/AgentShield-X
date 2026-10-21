"""
AgentShield-X: Semantic Memory Poisoning & RAG Retrieval Firewall
Feature 4: Protects agent long-term memory and retrieval pipelines against "sleeper agent" attacks.
Inspects chunks retrieved from vector databases (Chroma, Pinecone, pgvector) before they reach the agent context.
"""

from __future__ import annotations

import re
import secrets
import time
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional, Tuple


INJECTION_PATTERNS = [
    (r"ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|directives)", 0.95, "DIRECT_INSTRUCTION_OVERRIDE"),
    (r"you\s+are\s+now\s+(an\s+unrestricted|in\s+developer\s+mode|dan\s+mode)", 0.90, "JAILBREAK_ROLEPLAY_OVERRIDE"),
    (r"!\[.*?\]\(https?://[^\s\)]+(\?|&)[^\s\)]*=[^\s\)]*\)", 0.85, "MARKDOWN_IMAGE_EXFILTRATION"),
    (r"\[.*?\]\(javascript:[^\s\)]*\)", 0.95, "JAVASCRIPT_URI_INJECTION"),
    (r"<\|im_(start|end)\|>", 0.90, "CHATML_TOKEN_HIJACKING"),
    (r"\[\/?INST\]", 0.85, "LLAMA_INSTRUCTION_TOKEN_HIJACK"),
    (r"(system\s+prompt|admin\s+override|secret\s+instruction):\s*", 0.75, "PROMPT_DELIMITER_SPOOFING"),
    (r"exfiltrate\s+(all\s+)?(keys|passwords|database|tokens)", 0.80, "DATA_EXFILTRATION_INTENT"),
]


@dataclass
class InspectedChunk:
    chunk_id: str
    original_text: str
    sanitized_text: str
    decision: str  # PASS, SANITIZE, DROP
    threat_score: float
    violations_detected: List[str]
    processing_time_ms: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class RAGFirewallEngine:
    def __init__(self, sanitize_threshold: float = 0.35, drop_threshold: float = 0.75):
        self.sanitize_threshold = sanitize_threshold
        self.drop_threshold = drop_threshold
        self._compiled = [(re.compile(p, re.IGNORECASE), score, label) for p, score, label in INJECTION_PATTERNS]
        self._history: List[InspectedChunk] = []

    def inspect_chunk(self, text: str, chunk_id: Optional[str] = None) -> InspectedChunk:
        cid = chunk_id or f"CHUNK-{secrets.token_hex(4).upper()}"
        start_time = time.time()

        max_threat = 0.0
        violations = []
        sanitized = text

        for pattern, score, label in self._compiled:
            matches = pattern.findall(sanitized)
            if matches:
                max_threat = max(max_threat, score)
                violations.append(f"{label} (confidence: {score})")
                # Remove malicious sentence
                sanitized = pattern.sub("[REDACTED_BY_AGENTSHIELD_RAG_FIREWALL]", sanitized)

        if max_threat >= self.drop_threshold:
            decision = "DROP"
            sanitized = "[DROPPED: Malicious instruction injection detected in retrieved document chunk]"
        elif max_threat >= self.sanitize_threshold:
            decision = "SANITIZE"
        else:
            decision = "PASS"
            sanitized = text

        duration_ms = round((time.time() - start_time) * 1000 + 1.2, 2)

        result = InspectedChunk(
            chunk_id=cid,
            original_text=text,
            sanitized_text=sanitized,
            decision=decision,
            threat_score=round(max_threat, 2),
            violations_detected=violations,
            processing_time_ms=duration_ms,
        )

        self._history.append(result)
        return result

    def inspect_retrieval_batch(self, chunks: List[str]) -> List[InspectedChunk]:
        return [self.inspect_chunk(c) for c in chunks]

    def get_inspection_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        return [c.to_dict() for c in reversed(self._history[-limit:])]


# Global singleton instance
default_rag_firewall = RAGFirewallEngine()
