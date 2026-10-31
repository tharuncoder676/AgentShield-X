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
from shield_core.agentic_defense import default_agentic_defense


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

        # 1. Direct and heuristic pattern redaction
        for pattern, score, label in self._compiled:
            matches = pattern.findall(sanitized)
            if matches:
                max_threat = max(max_threat, score)
                violations.append(f"{label} (confidence: {score})")
                # Remove malicious sentence
                sanitized = pattern.sub("[REDACTED_BY_AGENTSHIELD_RAG_FIREWALL]", sanitized)

        # 2. Cognitive agentic evaluation on full text (catches paraphrased, indirect, and zero-keyword injections)
        orig_agentic = default_agentic_defense.evaluate_text_payload(text)
        if orig_agentic.is_adversarial:
            max_threat = max(max_threat, orig_agentic.threat_score)
            for v in orig_agentic.violations:
                if f"INDIRECT_INJECTION: {v}" not in violations:
                    violations.append(f"INDIRECT_INJECTION: {v}")

        # 3. Re-evaluate sanitized text if modified
        if sanitized != text:
            agentic_res = default_agentic_defense.evaluate_text_payload(sanitized)
            if agentic_res.is_adversarial:
                max_threat = max(max_threat, agentic_res.threat_score)
                for v in agentic_res.violations:
                    if f"INDIRECT_INJECTION: {v}" not in violations:
                        violations.append(f"INDIRECT_INJECTION: {v}")

        if max_threat >= self.drop_threshold:
            decision = "DROP"
            sanitized = "[DROPPED: Malicious instruction injection detected in retrieved document chunk]"
        elif max_threat >= self.sanitize_threshold:
            decision = "SANITIZE"
            if sanitized == text:
                sanitized = "[REDACTED_BY_AGENTSHIELD_RAG_FIREWALL: Indirect prompt injection neutralized]"
        else:
            decision = "PASS"
            sanitized = text

        duration_ms = max(0.01, round((time.time() - start_time) * 1000, 2))

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

    def filter_chroma_query_results(self, query_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Adapts and filters query results returned from ChromaDB collection.query().
        Filters or sanitizes documents, maintaining list shape.
        """
        if "documents" not in query_results:
            return query_results
        filtered_docs = []
        for doc_list in query_results.get("documents", []):
            inner_docs = []
            for doc in doc_list:
                if not isinstance(doc, str):
                    inner_docs.append(doc)
                    continue
                res = self.inspect_chunk(doc)
                if res.decision != "DROP":
                    inner_docs.append(res.sanitized_text)
            filtered_docs.append(inner_docs)
        query_results["documents"] = filtered_docs
        return query_results

    def filter_pinecone_matches(self, matches: List[Dict[str, Any]], text_key: str = "text") -> List[Dict[str, Any]]:
        """
        Adapts and filters vector match dictionaries returned from Pinecone index.query().
        Excludes matches marked DROP and sanitizes metadata text.
        """
        clean_matches = []
        for match in matches:
            metadata = match.get("metadata", {})
            text = metadata.get(text_key, "")
            if text and isinstance(text, str):
                res = self.inspect_chunk(text, chunk_id=match.get("id"))
                if res.decision == "DROP":
                    continue
                metadata[text_key] = res.sanitized_text
            clean_matches.append(match)
        return clean_matches

    def filter_pgvector_records(self, records: List[Dict[str, Any]], text_column: str = "content") -> List[Dict[str, Any]]:
        """
        Adapts and filters records returned from PostgreSQL pgvector queries.
        Excludes records marked DROP and sanitizes the target text column.
        """
        clean_records = []
        for rec in records:
            text = rec.get(text_column, "")
            if text and isinstance(text, str):
                res = self.inspect_chunk(text, chunk_id=str(rec.get("id", "")))
                if res.decision == "DROP":
                    continue
                rec_copy = dict(rec)
                rec_copy[text_column] = res.sanitized_text
                clean_records.append(rec_copy)
            else:
                clean_records.append(rec)
        return clean_records

    def get_inspection_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        return [c.to_dict() for c in reversed(self._history[-limit:])]


# Global singleton instance
default_rag_firewall = RAGFirewallEngine()
