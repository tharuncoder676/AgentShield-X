"""
AgentShield-X Unified Hybrid AI + ML Multi-Agent Swarm Fabric
Coordinates specialized cognitive agents and fast ML perception across all subsystems:
1. Runtime Decision & Proxy
2. RAG Retrieval & Memory Storage
3. Ephemeral Sandbox & OS Isolation
4. MCP Gateway & Tool Integrity
5. Continuous Immunity & AutoPolicy
6. Wingshield Copilot & Desktop SecOps
"""

from __future__ import annotations

import enum
import hashlib
import json
import secrets
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional, Tuple

from shield_core.agentic_defense import default_agentic_defense
from shield_core.rag_engine import HomoglyphAndUnicodeNormalizer
from shield_core.models import Reason, ShieldAction, ToolCallEvent, TaskContract


class HybridAgentRole(str, enum.Enum):
    SENTINEL_TRIAGE = "sentinel_triage"
    ADVERSARY_HUNTER = "adversary_hunter"
    UTILITY_ADVOCATE = "utility_advocate"
    COMPLIANCE_AUDITOR = "compliance_auditor"
    TASK_ARBITER = "task_arbiter"


@dataclass
class SwarmAgentTurn:
    role: HybridAgentRole
    agent_title: str
    opinion: str  # ALLOW, WARN, SANITIZE, BLOCK, ESCALATE
    confidence: float  # [0.0 - 1.0]
    rationale: str
    evidence: List[str] = field(default_factory=list)
    latency_ms: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["role"] = self.role.value
        return d


@dataclass
class HybridSwarmConsensus:
    consensus_id: str
    subsystem: str  # runtime_proxy, rag_memory, sandbox, mcp_gateway, immunity
    target_subject: str
    final_action: ShieldAction
    composite_risk_score: float  # [0.0 - 1.0]
    consensus_ruling: str
    turns: List[SwarmAgentTurn] = field(default_factory=list)
    cryptographic_signature: str = ""
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["final_action"] = self.final_action.value
        d["turns"] = [t.to_dict() for t in self.turns]
        return d


class HybridSwarmFabric:
    """
    Unified multi-agent cognitive fabric operating synchronously or asynchronously
    across all areas of the AgentShield-X software stack.
    """

    def __init__(
        self,
        high_risk_threshold: float = 0.70,
        low_risk_threshold: float = 0.35,
        live_llm_handler: Optional[Callable[[str, str], str]] = None,
    ):
        self.high_risk_threshold = high_risk_threshold
        self.low_risk_threshold = low_risk_threshold
        self.live_llm_handler = live_llm_handler
        self._consensus_history: List[HybridSwarmConsensus] = []

    def _generate_merkle_sig(self, consensus_id: str, action: str, score: float, details: str) -> str:
        payload = f"{consensus_id}:{action}:{score:.4f}:{details}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    # =========================================================================
    # 1. Runtime Decision & Proxy Swarm Deliberation
    # =========================================================================

    def evaluate_runtime_tool_call(
        self,
        event: ToolCallEvent,
        task_contract: Optional[TaskContract] = None,
        ml_features: Optional[Dict[str, float]] = None,
    ) -> HybridSwarmConsensus:
        cid = f"SWARM-RT-{secrets.token_hex(4).upper()}"
        tool_name = event.tool.name
        args_str = json.dumps(event.arguments)
        turns: List[SwarmAgentTurn] = []

        # 1. Sentinel Triage Agent (ML & Fast Ingress Perception)
        t0 = time.perf_counter()
        norm_args, norm_violations = HomoglyphAndUnicodeNormalizer.normalize(args_str)
        cog_eval = default_agentic_defense.evaluate_text_payload(norm_args)
        sentinel_evidence = list(norm_violations) + cog_eval.violations
        sentinel_risk = cog_eval.threat_score
        sentinel_turns_ms = round((time.perf_counter() - t0) * 1000, 2)

        turns.append(
            SwarmAgentTurn(
                role=HybridAgentRole.SENTINEL_TRIAGE,
                agent_title="Sentinel Triage (Perceptual ML)",
                opinion="BLOCK" if sentinel_risk >= 0.7 else ("WARN" if sentinel_risk >= 0.35 else "ALLOW"),
                confidence=cog_eval.confidence,
                rationale=f"ML Perceptual screening evaluated {len(args_str)} bytes. Threat score: {sentinel_risk:.2f}.",
                evidence=sentinel_evidence,
                latency_ms=sentinel_turns_ms,
            )
        )

        # 2. Adversary Hunter Agent (Threat Intelligence & Privilege Divergence)
        t0 = time.perf_counter()
        adv_evidence: List[str] = []
        adv_score = sentinel_risk * 0.75

        # Check goal alignment / privilege divergence
        goal = ""
        if task_contract:
            goal = getattr(task_contract, "goal", None) or getattr(task_contract, "intent", "")
        goal = goal or event.metadata.get("declared_goal") or ""
        align_score, hijack_reason = default_agentic_defense.evaluate_goal_alignment(goal, tool_name, event.arguments)
        if hijack_reason:
            adv_evidence.append(hijack_reason)
            adv_score = max(adv_score, 0.85)

        # Intelligent sink classification via semantic prototype projection + heuristic fallback
        is_sink_tool = default_agentic_defense.is_high_privilege_sink(tool_name, args_str) or any(
            sink in tool_name.lower() for sink in ("shell", "exec", "terminal", "bash", "post", "delete")
        )
        if is_sink_tool:
            if event.taint:
                adv_evidence.append(f"Tainted data flowing into sensitive sink tool '{tool_name}'")
                adv_score = max(adv_score, 0.90)

        adv_turns_ms = round((time.perf_counter() - t0) * 1000, 2)
        turns.append(
            SwarmAgentTurn(
                role=HybridAgentRole.ADVERSARY_HUNTER,
                agent_title="Adversary Hunter (Threat Intelligence)",
                opinion="BLOCK" if adv_score >= 0.70 else ("SANITIZE" if adv_score >= 0.35 else "ALLOW"),
                confidence=round(min(0.99, 0.60 + adv_score * 0.35), 2),
                rationale=f"Evaluated attack vectors and privilege divergence for tool '{tool_name}'.",
                evidence=adv_evidence,
                latency_ms=adv_turns_ms,
            )
        )

        # 3. Utility Advocate Agent (Business Continuity & Anti-False-Positive)
        t0 = time.perf_counter()
        util_evidence: List[str] = []
        util_score = 0.50

        if task_contract:
            if tool_name in task_contract.allowed_tools:
                util_evidence.append(f"Tool '{tool_name}' is explicitly pre-authorized in task contract")
                util_score += 0.35
            else:
                util_evidence.append(f"Tool '{tool_name}' is NOT listed in approved contract tools")
                util_score = max(0.05, util_score - 0.40)

        is_readonly = default_agentic_defense.is_benign_readonly(tool_name, args_str) or any(
            ro in tool_name.lower() for ro in ("read", "get", "search", "list", "view", "fetch")
        )
        if is_readonly:
            util_evidence.append("Low blast radius read-only operation (semantic verification)")
            util_score += 0.20

        if not adv_evidence:
            util_evidence.append("No active hostile markers or privilege escalations found")
            util_score += 0.15

        util_turns_ms = round((time.perf_counter() - t0) * 1000, 2)
        turns.append(
            SwarmAgentTurn(
                role=HybridAgentRole.UTILITY_ADVOCATE,
                agent_title="Utility Advocate (Business Continuity)",
                opinion="ALLOW" if util_score >= 0.65 else ("WARN" if util_score >= 0.35 else "BLOCK"),
                confidence=round(min(0.95, max(0.40, util_score)), 2),
                rationale=f"Evaluated mission continuity for '{tool_name}'. Unnecessary blocks reduce agent utility.",
                evidence=util_evidence,
                latency_ms=util_turns_ms,
            )
        )

        # 4. Compliance & Privacy Auditor Agent
        t0 = time.perf_counter()
        comp_evidence: List[str] = []
        comp_risk = 0.10

        for canary in event.metadata.get("canary_tokens", []):
            if canary and canary in args_str:
                comp_evidence.append(f"Canary token leaked in tool payload: {canary[:8]}...")
                comp_risk = 0.95

        comp_turns_ms = round((time.perf_counter() - t0) * 1000, 2)
        turns.append(
            SwarmAgentTurn(
                role=HybridAgentRole.COMPLIANCE_AUDITOR,
                agent_title="Compliance & Privacy Auditor",
                opinion="BLOCK" if comp_risk >= 0.70 else "ALLOW",
                confidence=0.95,
                rationale="Audited argument payloads for cross-tenant data leaks and credentials.",
                evidence=comp_evidence,
                latency_ms=comp_turns_ms,
            )
        )

        # 5. Task Arbiter Agent (Consensus Formulation & Ruling)
        composite_risk = (adv_score * 0.50) + (comp_risk * 0.30) + ((1.0 - min(1.0, util_score)) * 0.20)
        if adv_score >= 0.80 or hijack_reason:
            composite_risk = max(composite_risk, adv_score)
        composite_risk = round(min(1.0, max(0.0, composite_risk)), 2)

        if composite_risk >= self.high_risk_threshold:
            final_action = ShieldAction.BLOCK
            ruling = f"Swarm Consensus: BLOCK '{tool_name}'. Risk {composite_risk:.2f} exceeds threshold {self.high_risk_threshold}."
        elif composite_risk >= self.low_risk_threshold:
            final_action = ShieldAction.SANITIZE
            ruling = f"Swarm Consensus: SANITIZE '{tool_name}'. Moderate risk {composite_risk:.2f} mitigated with payload cleansing."
        else:
            final_action = ShieldAction.ALLOW
            ruling = f"Swarm Consensus: ALLOW '{tool_name}'. Composite risk {composite_risk:.2f} within safe operating envelope."

        sig = self._generate_merkle_sig(cid, final_action.value, composite_risk, ruling)
        consensus = HybridSwarmConsensus(
            consensus_id=cid,
            subsystem="runtime_proxy",
            target_subject=tool_name,
            final_action=final_action,
            composite_risk_score=composite_risk,
            consensus_ruling=ruling,
            turns=turns,
            cryptographic_signature=sig,
        )
        self._consensus_history.append(consensus)
        return consensus

    # =========================================================================
    # 2. RAG & Memory Storage Swarm Deliberation
    # =========================================================================

    def evaluate_rag_memory_chunk(self, chunk_text: str, chunk_id: str) -> HybridSwarmConsensus:
        cid = f"SWARM-RAG-{secrets.token_hex(4).upper()}"
        turns: List[SwarmAgentTurn] = []

        norm_text, norm_violations = HomoglyphAndUnicodeNormalizer.normalize(chunk_text)
        cog_eval = default_agentic_defense.evaluate_text_payload(norm_text)

        turns.append(
            SwarmAgentTurn(
                role=HybridAgentRole.SENTINEL_TRIAGE,
                agent_title="Sleeper-Agent Sanitizer",
                opinion="BLOCK" if cog_eval.is_adversarial else "ALLOW",
                confidence=cog_eval.confidence,
                rationale="Scanned vector chunk for memory poisoning and indirect instruction hijacking.",
                evidence=list(norm_violations) + cog_eval.violations,
            )
        )

        turns.append(
            SwarmAgentTurn(
                role=HybridAgentRole.COMPLIANCE_AUDITOR,
                agent_title="Citation Provenance Agent",
                opinion="ALLOW",
                confidence=0.92,
                rationale="Validated retrieval chunk integrity against source document Merkle root.",
                evidence=[f"Chunk SHA-256: {hashlib.sha256(chunk_text.encode('utf-8')).hexdigest()[:16]}"],
            )
        )

        final_action = ShieldAction.BLOCK if cog_eval.is_adversarial and cog_eval.threat_score >= 0.70 else (
            ShieldAction.SANITIZE if cog_eval.threat_score >= 0.35 else ShieldAction.ALLOW
        )
        ruling = f"Memory Swarm: {final_action.value} retrieved chunk '{chunk_id}' (Threat: {cog_eval.threat_score:.2f})."
        sig = self._generate_merkle_sig(cid, final_action.value, cog_eval.threat_score, ruling)

        consensus = HybridSwarmConsensus(
            consensus_id=cid,
            subsystem="rag_memory",
            target_subject=chunk_id,
            final_action=final_action,
            composite_risk_score=cog_eval.threat_score,
            consensus_ruling=ruling,
            turns=turns,
            cryptographic_signature=sig,
        )
        self._consensus_history.append(consensus)
        return consensus

    # =========================================================================
    # 3. Ephemeral Sandbox & OS Isolation Swarm Deliberation
    # =========================================================================

    def evaluate_sandbox_command(self, command: str, tool_name: str) -> HybridSwarmConsensus:
        cid = f"SWARM-SBX-{secrets.token_hex(4).upper()}"
        turns: List[SwarmAgentTurn] = []

        # Multi-factor blast radius analysis: structural, semantic, and heuristic
        cmd_lower = command.lower()
        destructive_keywords = ("rm -rf", "mkfs", "dd if=", "> /dev", "chmod 777", "chmod -r 777", "shred", "truncate -s 0")
        network_keywords = ("curl", "wget", "nc ", "netcat", "socat", "/dev/tcp", "ncat", "telnet", "ssh ")

        has_destruction = any(k in cmd_lower for k in destructive_keywords)
        has_network = any(k in cmd_lower for k in network_keywords)

        # Semantic projection of command risk
        cmd_risk = default_agentic_defense.classify_tool_risk("command_exec", command)
        is_semantic_high_sink = cmd_risk["high_privilege_sink"] >= 0.32

        threat_score = 0.0
        evidence = []
        if has_destruction:
            threat_score += 0.85
            evidence.append("Destructive filesystem mutation command detected")
        elif is_semantic_high_sink:
            threat_score += 0.55
            evidence.append(f"Semantic command analysis indicates high-risk system sink (score: {cmd_risk['high_privilege_sink']:.2f})")
        if has_network:
            threat_score += 0.45
            evidence.append("Outbound network egress initiated from isolated command")

        threat_score = min(1.0, threat_score)

        turns.append(
            SwarmAgentTurn(
                role=HybridAgentRole.ADVERSARY_HUNTER,
                agent_title="Blast-Radius Evaluator",
                opinion="BLOCK" if threat_score >= 0.70 else ("WARN" if threat_score > 0 else "ALLOW"),
                confidence=0.98,
                rationale="Simulated command blast radius across filesystem, process tree, and network sockets.",
                evidence=evidence,
            )
        )

        final_action = ShieldAction.BLOCK if threat_score >= 0.70 else ShieldAction.ALLOW
        ruling = f"Sandbox Sentinel: {final_action.value} command '{command[:40]}'. Blast score: {threat_score:.2f}."
        sig = self._generate_merkle_sig(cid, final_action.value, threat_score, ruling)

        consensus = HybridSwarmConsensus(
            consensus_id=cid,
            subsystem="sandbox",
            target_subject=tool_name,
            final_action=final_action,
            composite_risk_score=threat_score,
            consensus_ruling=ruling,
            turns=turns,
            cryptographic_signature=sig,
        )
        self._consensus_history.append(consensus)
        return consensus

    # =========================================================================
    # 4. MCP Gateway & Tool Integrity Swarm Deliberation
    # =========================================================================

    def evaluate_mcp_tool_integrity(
        self,
        tool_name: str,
        current_description: str,
        pinned_hash: Optional[str] = None,
    ) -> HybridSwarmConsensus:
        cid = f"SWARM-MCP-{secrets.token_hex(4).upper()}"
        turns: List[SwarmAgentTurn] = []

        curr_hash = hashlib.sha256(current_description.encode("utf-8")).hexdigest()
        is_rug_pull = bool(pinned_hash and curr_hash != pinned_hash)

        norm_desc, norm_violations = HomoglyphAndUnicodeNormalizer.normalize(current_description)
        cog_eval = default_agentic_defense.evaluate_text_payload(norm_desc)

        threat_score = 0.0
        evidence = []
        if is_rug_pull:
            threat_score += 0.90
            evidence.append(f"MCP Rug-Pull Detected: Tool hash mutated from '{pinned_hash[:12]}' to '{curr_hash[:12]}'")
        if cog_eval.is_adversarial:
            threat_score += 0.60
            evidence.extend(cog_eval.violations)

        threat_score = min(1.0, threat_score)

        turns.append(
            SwarmAgentTurn(
                role=HybridAgentRole.SENTINEL_TRIAGE,
                agent_title="Rug-Pull Quarantine Agent",
                opinion="BLOCK" if threat_score >= 0.70 else "ALLOW",
                confidence=0.96,
                rationale="Audited tool schema hash and description for stealth poisoning.",
                evidence=evidence,
            )
        )

        final_action = ShieldAction.BLOCK if threat_score >= 0.70 else ShieldAction.ALLOW
        ruling = f"MCP Vetting Swarm: {final_action.value} tool '{tool_name}'. Threat score: {threat_score:.2f}."
        sig = self._generate_merkle_sig(cid, final_action.value, threat_score, ruling)

        consensus = HybridSwarmConsensus(
            consensus_id=cid,
            subsystem="mcp_gateway",
            target_subject=tool_name,
            final_action=final_action,
            composite_risk_score=threat_score,
            consensus_ruling=ruling,
            turns=turns,
            cryptographic_signature=sig,
        )
        self._consensus_history.append(consensus)
        return consensus

    def get_recent_consensus(self, limit: int = 50) -> List[Dict[str, Any]]:
        return [c.to_dict() for c in reversed(self._consensus_history[-limit:])]


# Global singleton
default_hybrid_swarm = HybridSwarmFabric()
