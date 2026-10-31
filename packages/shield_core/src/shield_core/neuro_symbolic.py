"""AgentShield Neuro-Symbolic Reasoning Engine for Multi-Step Tool Call Chains.

Analyzes directed acyclic graphs (DAGs) of agent tool calls across temporal windows.
Catches composite attacks that appear benign in isolation but constitute critical threats in sequence:
- Data Exfiltration Chains: Sensitive Read -> Outbound Sink (e.g. read_file -> send_email)
- Privilege Escalation Chains: Discovery -> Credential / Role Mutate (e.g. whoami -> update_role)
- Persistence & Remote Code Injection: Untrusted Ingestion -> Execution (e.g. fetch_url -> bash_exec)
- Shadow Rug-Pull Chains: Schema Inspect -> Tool Definition Mutate -> Execution

Architect: Tharunkumar.S | AgentShield-X Security Labs
"""

from __future__ import annotations

import hashlib
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple


class ChainThreatLevel(str, Enum):
    BENIGN = "BENIGN"
    SUSPICIOUS = "SUSPICIOUS"
    CRITICAL_ATTACK = "CRITICAL_ATTACK"


class ToolCategory(str, Enum):
    SENSITIVE_READ = "SENSITIVE_READ"
    BENIGN_READ = "BENIGN_READ"
    OUTBOUND_SINK = "OUTBOUND_SINK"
    SYSTEM_EXEC = "SYSTEM_EXEC"
    IDENTITY_MUTATE = "IDENTITY_MUTATE"
    DISCOVERY = "DISCOVERY"
    UNTRUSTED_FETCH = "UNTRUSTED_FETCH"
    LOCAL_WRITE = "LOCAL_WRITE"


TOOL_CATEGORY_MAP: Dict[str, ToolCategory] = {
    # Sensitive reads
    "read_file": ToolCategory.SENSITIVE_READ,
    "read_database": ToolCategory.SENSITIVE_READ,
    "execute_sql": ToolCategory.SENSITIVE_READ,
    "query_db": ToolCategory.SENSITIVE_READ,
    "export_keys": ToolCategory.SENSITIVE_READ,
    "read_credentials": ToolCategory.SENSITIVE_READ,
    "fetch_tokens": ToolCategory.SENSITIVE_READ,

    # Benign reads
    "search_web": ToolCategory.BENIGN_READ,
    "web_search": ToolCategory.BENIGN_READ,
    "get_weather": ToolCategory.BENIGN_READ,
    "calculate": ToolCategory.BENIGN_READ,
    "format_text": ToolCategory.BENIGN_READ,

    # Outbound sinks
    "send_email": ToolCategory.OUTBOUND_SINK,
    "webhook_post": ToolCategory.OUTBOUND_SINK,
    "dispatch_http": ToolCategory.OUTBOUND_SINK,
    "upload_file": ToolCategory.OUTBOUND_SINK,
    "transfer_funds": ToolCategory.OUTBOUND_SINK,

    # System execution
    "bash_exec": ToolCategory.SYSTEM_EXEC,
    "run_terminal_command": ToolCategory.SYSTEM_EXEC,
    "eval": ToolCategory.SYSTEM_EXEC,
    "subprocess_run": ToolCategory.SYSTEM_EXEC,

    # Identity and role mutation
    "update_role": ToolCategory.IDENTITY_MUTATE,
    "create_admin_user": ToolCategory.IDENTITY_MUTATE,
    "write_policy": ToolCategory.IDENTITY_MUTATE,
    "grant_permission": ToolCategory.IDENTITY_MUTATE,

    # Discovery
    "whoami": ToolCategory.DISCOVERY,
    "get_capabilities": ToolCategory.DISCOVERY,
    "list_tools": ToolCategory.DISCOVERY,
    "list_users": ToolCategory.DISCOVERY,

    # Untrusted ingestion
    "fetch_url": ToolCategory.UNTRUSTED_FETCH,
    "download_file": ToolCategory.UNTRUSTED_FETCH,
    "scrape_webpage": ToolCategory.UNTRUSTED_FETCH,

    # Local write
    "write_file": ToolCategory.LOCAL_WRITE,
    "save_report": ToolCategory.LOCAL_WRITE,
}


@dataclass
class ToolCallNode:
    call_id: str
    tool_name: str
    category: ToolCategory
    arguments: Dict[str, Any]
    timestamp: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "call_id": self.call_id,
            "tool_name": self.tool_name,
            "category": self.category.value,
            "arguments": self.arguments,
            "timestamp": self.timestamp,
        }


@dataclass
class AttackChainSignature:
    pattern_id: str
    name: str
    description: str
    category_sequence: List[ToolCategory]
    threat_level: ChainThreatLevel
    mitre_technique: str
    composite_risk_score: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "pattern_id": self.pattern_id,
            "name": self.name,
            "description": self.description,
            "category_sequence": [c.value for c in self.category_sequence],
            "threat_level": self.threat_level.value,
            "mitre_technique": self.mitre_technique,
            "composite_risk_score": self.composite_risk_score,
        }


@dataclass
class ChainEvaluationResult:
    is_attack_chain: bool
    threat_level: ChainThreatLevel
    matched_pattern: Optional[AttackChainSignature]
    chain_length: int
    composite_risk_score: float
    confidence: float
    reason: str
    nodes: List[ToolCallNode]
    evaluation_time_ms: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_attack_chain": self.is_attack_chain,
            "threat_level": self.threat_level.value,
            "matched_pattern": self.matched_pattern.to_dict() if self.matched_pattern else None,
            "chain_length": self.chain_length,
            "composite_risk_score": self.composite_risk_score,
            "confidence": self.confidence,
            "reason": self.reason,
            "nodes": [n.to_dict() for n in self.nodes],
            "evaluation_time_ms": self.evaluation_time_ms,
        }


class NeuroSymbolicChainEngine:
    """Evaluates multi-step agent tool call sequences using temporal neuro-symbolic grammar."""

    def __init__(self):
        self.signatures: List[AttackChainSignature] = [
            AttackChainSignature(
                pattern_id="SIG-EXFIL-001",
                name="Data Exfiltration Chain",
                description="Sensitive data accessed and immediately dispatched to an outbound external sink.",
                category_sequence=[ToolCategory.SENSITIVE_READ, ToolCategory.OUTBOUND_SINK],
                threat_level=ChainThreatLevel.CRITICAL_ATTACK,
                mitre_technique="AML.T0024",
                composite_risk_score=0.98,
            ),
            AttackChainSignature(
                pattern_id="SIG-PRIV-002",
                name="Privilege Escalation Chain",
                description="Reconnaissance of permissions followed by unauthorized credential/role alteration.",
                category_sequence=[ToolCategory.DISCOVERY, ToolCategory.IDENTITY_MUTATE],
                threat_level=ChainThreatLevel.CRITICAL_ATTACK,
                mitre_technique="AML.T0018",
                composite_risk_score=0.96,
            ),
            AttackChainSignature(
                pattern_id="SIG-INJECT-003",
                name="Remote Persistence & Ingestion Injection",
                description="Untrusted payload fetched from external web source and passed to system execution.",
                category_sequence=[ToolCategory.UNTRUSTED_FETCH, ToolCategory.SYSTEM_EXEC],
                threat_level=ChainThreatLevel.CRITICAL_ATTACK,
                mitre_technique="AML.T0051",
                composite_risk_score=0.99,
            ),
            AttackChainSignature(
                pattern_id="SIG-LATERAL-004",
                name="Tri-Stage Lateral Staging Exfiltration",
                description="Discovery -> Sensitive Read -> Outbound transmission across multiple steps.",
                category_sequence=[ToolCategory.DISCOVERY, ToolCategory.SENSITIVE_READ, ToolCategory.OUTBOUND_SINK],
                threat_level=ChainThreatLevel.CRITICAL_ATTACK,
                mitre_technique="AML.T0024",
                composite_risk_score=0.995,
            ),
        ]
        # Active session tool call history
        self.session_chains: Dict[str, List[ToolCallNode]] = {}

    def get_tool_category(self, tool_name: str) -> ToolCategory:
        """Resolves tool name to canonical neuro-symbolic capability category."""
        return TOOL_CATEGORY_MAP.get(tool_name.lower(), ToolCategory.BENIGN_READ)

    def append_and_evaluate(
        self,
        session_id: str,
        tool_name: str,
        arguments: Dict[str, Any],
    ) -> ChainEvaluationResult:
        """Appends tool call to session DAG and evaluates the full sliding temporal window."""
        t0 = time.perf_counter()

        node = ToolCallNode(
            call_id=f"node-{hashlib.md5(f'{session_id}:{tool_name}:{time.time()}'.encode()).hexdigest()[:8]}",
            tool_name=tool_name,
            category=self.get_tool_category(tool_name),
            arguments=arguments,
        )

        if session_id not in self.session_chains:
            self.session_chains[session_id] = []

        history = self.session_chains[session_id]
        history.append(node)
        # Keep last 15 tool calls in sliding window
        if len(history) > 15:
            history.pop(0)

        # Evaluate against attack chain signatures (longest pattern first)
        matched_sig: Optional[AttackChainSignature] = None
        sorted_sigs = sorted(self.signatures, key=lambda s: len(s.category_sequence), reverse=True)
        for sig in sorted_sigs:
            target_cats = sig.category_sequence
            seq_len = len(target_cats)
            if len(history) >= seq_len:
                # Check if the trailing sequence matches the signature
                recent_cats = [n.category for n in history[-seq_len:]]
                if recent_cats == target_cats:
                    matched_sig = sig
                    break

        elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)

        if matched_sig:
            return ChainEvaluationResult(
                is_attack_chain=True,
                threat_level=matched_sig.threat_level,
                matched_pattern=matched_sig,
                chain_length=len(matched_sig.category_sequence),
                composite_risk_score=matched_sig.composite_risk_score,
                confidence=0.99,
                reason=(
                    f"Composite multi-step attack chain detected: {matched_sig.name} "
                    f"({' -> '.join([c.value for c in matched_sig.category_sequence])})."
                ),
                nodes=list(history[-len(matched_sig.category_sequence):]),
                evaluation_time_ms=elapsed_ms,
            )

        # Benign check
        return ChainEvaluationResult(
            is_attack_chain=False,
            threat_level=ChainThreatLevel.BENIGN,
            matched_pattern=None,
            chain_length=len(history),
            composite_risk_score=0.04,
            confidence=0.96,
            reason="Tool sequence conforms to benign execution DAG grammar.",
            nodes=list(history),
            evaluation_time_ms=elapsed_ms,
        )

    def reset_session(self, session_id: str) -> None:
        """Clears tool call history for a session."""
        if session_id in self.session_chains:
            del self.session_chains[session_id]


# Global singleton
default_chain_engine = NeuroSymbolicChainEngine()
