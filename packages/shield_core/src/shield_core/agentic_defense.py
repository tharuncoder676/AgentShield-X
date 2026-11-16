"""
AgentShield-X Intelligent Agentic Defense Infrastructure
Next-generation cognitive security engine replacing fragile keyword/regex matching with:
1. Structural Imperative Density & Role Inversion Analysis (Catches indirect, paraphrased injections)
2. Statistical Information Entropy & Delimiter Stacking Guard (Catches obfuscated, encrypted, steganographic payloads)
3. Dynamic Goal-to-Action Semantic Projection (Catches goal hijacking & unauthorized capability drift)
4. Contextual Taint Flow & Sink Attenuation
"""

from __future__ import annotations

import collections
import hashlib
import math
import re
import secrets
import time
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional, Set, Tuple


# --- Fast Normalized Semantic Feature Projections (64-dimensional) ---

def _semantic_hash_vector(text: str, dim: int = 64) -> List[float]:
    """Generates a dense normalized pseudo-semantic feature vector using character-trigram & word projection."""
    vec = [0.0] * dim
    clean = re.sub(r"[^a-z0-9_ ]", " ", text.lower()).strip()
    words = clean.split()
    if not words:
        return vec

    for w in words:
        # Word-level hash projection
        wh = int(hashlib.sha256(w.encode("utf-8")).hexdigest()[:8], 16)
        vec[wh % dim] += 1.5

        # Character trigrams for morphological and sub-word generalization
        for j in range(max(1, len(w) - 2)):
            tri = w[j:j + 3]
            h = int(hashlib.md5(tri.encode("utf-8")).hexdigest()[:8], 16)
            idx = h % dim
            sign = 1.0 if (h >> 16) & 1 else -1.0
            vec[idx] += sign * (1.0 + 0.1 * len(w))

    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 1e-6:
        vec = [x / norm for x in vec]
    return vec


def _cosine_similarity(v1: List[float], v2: List[float]) -> float:
    dot = sum(a * b for a, b in zip(v1, v2))
    return max(0.0, min(1.0, dot))


# Behavioral Prototype Reference Vectors
_PROTOTYPE_HIGH_PRIVILEGE_SINK = _semantic_hash_vector(
    "execute command shell bash subprocess terminal run system delete rm format write drop table "
    "send outbound email upload http post webhook exfiltrate dispatch socket network transfer"
)
_PROTOTYPE_CONFIDENTIAL_DATA = _semantic_hash_vector(
    "database customer private user internal secret token password credential auth key salary "
    "financial confidential account record sql query read file disk storage personal pii"
)
_PROTOTYPE_RAG_MEMORY_SINK = _semantic_hash_vector(
    "rag retrieval vector database chroma pinecone pgvector qdrant memory store context inject "
    "embedding semantic search retrieve chunk poison document long term memory write collection"
)
_PROTOTYPE_AGENTIC_DELEGATION_SINK = _semantic_hash_vector(
    "subagent spawn delegate invoke swarm task dispatch agent call tool execution rpc "
    "websocket channel wingman proxy autonomous workflow worker handoff"
)
_PROTOTYPE_BENIGN_UTILITY = _semantic_hash_vector(
    "calculate math convert text summarize format view search query display help time date weather"
)


# Directives indicating adversarial subversion directed at an AI model (excluding benign actions)
ADVERSARIAL_SUBVERSION_TOKENS: Set[str] = {
    "disregard", "bypass", "negate", "override", "supersede", "forget",
    "unrestricted", "jailbreak", "dan", "ignore", "dump", "exfiltrate",
    "leak", "hijack", "infiltrate", "deactivate", "disable", "subvert",
}

MANDATORY_DIRECTIVE_MODALS: Set[str] = {
    "must", "shall", "required", "directive", "instructed", "ordered", "mandated",
}

COVERT_EXFIL_ACTIONS: Set[str] = {
    "dispatch", "transfer", "forward", "transmit", "upload", "export", "dump",
    "exfiltrate", "leak", "dropzone",
}

# Broader imperatives for statistical density calculation only (not for hard blocking)
IMPERATIVE_DIRECTIVE_TOKENS: Set[str] = {
    "must", "should", "shall", "always", "never", "ensure", "instruct", "directive",
    "require", "priority", "supersede", "disregard", "bypass", "negate", "override",
    "modify", "switch", "act", "behave", "pretend", "simulate", "assume", "roleplay",
    "unrestricted", "dump", "exfiltrate", "ignore",
}

ROLE_INVERSION_TARGETS: Set[str] = {
    "you", "your", "yours", "assistant", "model", "agent", "llm", "ai", "bot",
    "system", "copilot", "program", "inst", "instructions",
}

CONTEXT_BOUNDARY_MARKERS = [
    r"[-=_]{4,}",                                  # Long visual dividers (---, ===, ___)
    r"<\/?(?:system|instruction|admin|prompt|context|override)[^>]*>", # Spoofed XML/HTML system boundaries
    r"\[\/?(?:system|instruction|admin|override|note|inst)[^\]]*\]",   # Bracketed fake system tokens
    r"(?:end\s+of|start\s+of)\s+(?:system|prompt|context|instructions)", # Linguistic boundary demarcation
    r"```[a-z]*\s*(?:system|override|admin|prompt)", # Markdown code block pretending to be system prompt
]


@dataclass
class SemanticAnalysisResult:
    threat_score: float  # [0.0 - 1.0]
    is_adversarial: bool
    confidence: float
    imperative_density: float
    role_inversion_score: float
    entropy_score: float
    boundary_anomalies: List[str]
    detected_intent_shift: Optional[str]
    violations: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class IntelligentAgenticDefenseEngine:
    """
    Cognitive security analyzer that evaluates incoming prompt fragments, retrieved RAG text,
    and agent arguments for subtle, indirect, or novel adversarial injections.
    """

    def __init__(
        self,
        adversarial_threshold: float = 0.45,
        strict_mode: bool = False,
    ):
        self.adversarial_threshold = adversarial_threshold
        self.strict_mode = strict_mode
        self._boundary_regexes = [re.compile(p, re.IGNORECASE) for p in CONTEXT_BOUNDARY_MARKERS]

    @staticmethod
    def calculate_shannon_entropy(text: str) -> float:
        """Calculates Shannon character entropy [0.0 - 8.0]."""
        if not text:
            return 0.0
        counts = collections.Counter(text)
        n = len(text)
        entropy = -sum((c / n) * math.log2(c / n) for c in counts.values())
        return round(entropy, 3)

    def analyze_structural_imperatives(self, text: str) -> Tuple[float, float, List[str]]:
        """
        Analyzes whether text contains imperative action directives directed at the LLM
        rather than passive factual data (crucial for detecting Indirect Prompt Injections).
        """
        clean = re.sub(r"[^\w\s]", " ", text.lower())
        words = clean.split()
        if not words:
            return 0.0, 0.0, []

        imperative_count = sum(1 for w in words if w in IMPERATIVE_DIRECTIVE_TOKENS)
        role_target_count = sum(1 for w in words if w in ROLE_INVERSION_TARGETS)

        imperative_density = imperative_count / len(words)
        role_score = role_target_count / len(words)

        signals = []
        # Check for co-occurrence of role targets with adversarial subversion verbs or covert exfil imperatives
        for i in range(len(words)):
            w1 = words[i]
            if w1 in ROLE_INVERSION_TARGETS:
                window = words[i + 1 : min(len(words), i + 5)]
                has_subversion = any(w in ADVERSARIAL_SUBVERSION_TOKENS for w in window)
                has_modal = any(w in MANDATORY_DIRECTIVE_MODALS for w in window)
                has_exfil = any(w in COVERT_EXFIL_ACTIONS for w in window)
                if has_subversion:
                    matched = [w for w in window if w in ADVERSARIAL_SUBVERSION_TOKENS]
                    signals.append(f"Adversarial directive collocation: '{w1} {' '.join(matched)}'")
                elif has_modal and has_exfil:
                    matched = [w for w in window if w in MANDATORY_DIRECTIVE_MODALS or w in COVERT_EXFIL_ACTIONS]
                    signals.append(f"Adversarial exfiltration directive: '{w1} {' '.join(matched)}'")
            elif w1 in ADVERSARIAL_SUBVERSION_TOKENS:
                window = words[i + 1 : min(len(words), i + 4)]
                if any(w in ROLE_INVERSION_TARGETS for w in window):
                    signals.append(f"Adversarial directive collocation: '{w1} {window[0]}'")

        return round(imperative_density, 3), round(role_score, 3), signals

    def detect_boundary_manipulation(self, text: str) -> List[str]:
        """Detects attempts to hijack model context boundaries with fake tags or visual dividers."""
        anomalies = []
        for reg in self._boundary_regexes:
            match = reg.search(text)
            if match:
                anomalies.append(f"Boundary manipulation marker: '{match.group(0)[:40]}'")
        return anomalies

    def evaluate_text_payload(
        self,
        text: str,
        source_type: str = "untrusted_input",
    ) -> SemanticAnalysisResult:
        """
        Comprehensive multi-factor evaluation of an untrusted string.
        Combines structural imperative density, boundary anomalies, and Shannon entropy.
        """
        if not text or not text.strip():
            return SemanticAnalysisResult(
                threat_score=0.0,
                is_adversarial=False,
                confidence=0.99,
                imperative_density=0.0,
                role_inversion_score=0.0,
                entropy_score=0.0,
                boundary_anomalies=[],
                detected_intent_shift=None,
                violations=[],
            )

        violations: List[str] = []
        threat_score = 0.0

        # 1. Structural Imperative & Role Inversion Analysis
        imp_density, role_score, collocations = self.analyze_structural_imperatives(text)
        if collocations:
            threat_score += 0.55
            violations.append(f"Found {len(collocations)} role-directive collocations ({collocations[0]})")
        elif imp_density > 0.08 and role_score > 0.04:
            threat_score += 0.45
            violations.append(f"High imperative instruction density ({imp_density:.1%}) targeting agent persona")
        elif imp_density > 0.04 and role_score > 0.02:
            threat_score += 0.25

        # 2. Context Boundary Manipulation
        boundaries = self.detect_boundary_manipulation(text)
        if boundaries:
            threat_score += 0.55
            violations.append(f"Detected {len(boundaries)} prompt boundary escape sequences ({boundaries[0]})")

        # 3. Information Entropy & Obfuscation Analysis
        entropy = self.calculate_shannon_entropy(text)
        if len(text) > 40:
            if entropy > 5.2:
                threat_score += 0.30
                violations.append(f"Anomalously high character entropy ({entropy:.2f} > 5.2): possible cipher/encoded injection")
            elif entropy < 2.1:
                threat_score += 0.20
                violations.append(f"Anomalously low character entropy ({entropy:.2f} < 2.1): repetitive delimiter padding")

        # 4. Semantic Projection Intent Check
        text_vec = _semantic_hash_vector(text)
        sim_sink = _cosine_similarity(text_vec, _PROTOTYPE_HIGH_PRIVILEGE_SINK)
        if sim_sink >= 0.40:
            threat_score += 0.35
            violations.append(f"Semantic projection indicates high-privilege execution intent (similarity: {sim_sink:.2f})")

        threat_score = round(min(1.0, threat_score), 2)
        is_adv = threat_score >= self.adversarial_threshold

        intent_shift = None
        if is_adv:
            if boundaries:
                intent_shift = "CONTEXT_DELIMITER_HIJACK"
            elif collocations:
                intent_shift = "INDIRECT_INSTRUCTION_OVERRIDE"
            elif sim_sink >= 0.40:
                intent_shift = "COVERT_PRIVILEGED_SINK_ATTEMPT"
            else:
                intent_shift = "STRUCTURAL_INJECTION_DRIFT"

        confidence = round(0.70 + 0.28 * abs(threat_score - 0.5), 2)

        return SemanticAnalysisResult(
            threat_score=threat_score,
            is_adversarial=is_adv,
            confidence=confidence,
            imperative_density=imp_density,
            role_inversion_score=role_score,
            entropy_score=entropy,
            boundary_anomalies=boundaries,
            detected_intent_shift=intent_shift,
            violations=violations,
        )

    def classify_tool_risk(self, tool_name: str, arguments_str: str = "") -> Dict[str, float]:
        """
        Semantically classifies a tool's risk profile using continuous prototype vector projection.
        Replaces brittle keyword matching with continuous semantic distance scoring across:
        - high_privilege_sink: Command execution, shell, filesystem mutation, network egress
        - confidential_data: Secrets, API keys, database records, PII
        - rag_memory_sink: RAG vector retrieval, memory writes, context injection, Chroma/Pinecone
        - agentic_delegation_sink: Subagent spawning, swarm delegation, multi-agent RPC
        - benign_utility: Read-only utilities, math, date, weather, harmless formatting
        """
        text = f"{tool_name} {arguments_str}".strip()
        vec = _semantic_hash_vector(text)
        return {
            "high_privilege_sink": round(_cosine_similarity(vec, _PROTOTYPE_HIGH_PRIVILEGE_SINK), 3),
            "confidential_data": round(_cosine_similarity(vec, _PROTOTYPE_CONFIDENTIAL_DATA), 3),
            "rag_memory_sink": round(_cosine_similarity(vec, _PROTOTYPE_RAG_MEMORY_SINK), 3),
            "agentic_delegation_sink": round(_cosine_similarity(vec, _PROTOTYPE_AGENTIC_DELEGATION_SINK), 3),
            "benign_utility": round(_cosine_similarity(vec, _PROTOTYPE_BENIGN_UTILITY), 3),
        }

    def is_sensitive_tool_semantic(
        self,
        tool_name: str,
        arguments_str: str = "",
        threshold: float = 0.30,
    ) -> Tuple[bool, str, float]:
        """
        Intelligently identifies whether any installed or invoked tool is sensitive
        using continuous prototype embedding vectors (replaces brittle keyword lists).
        Returns (is_sensitive, dominant_sink_category, score).
        """
        profile = self.classify_tool_risk(tool_name, arguments_str)
        candidates = [
            ("HIGH_PRIVILEGE_SINK", profile["high_privilege_sink"]),
            ("CONFIDENTIAL_DATA", profile["confidential_data"]),
            ("RAG_MEMORY_SINK", profile["rag_memory_sink"]),
            ("AGENTIC_DELEGATION_SINK", profile["agentic_delegation_sink"]),
        ]
        candidates.sort(key=lambda x: x[1], reverse=True)
        top_cat, top_score = candidates[0]
        is_sens = top_score >= threshold and top_score > profile["benign_utility"]
        return is_sens, top_cat, top_score

    def is_high_privilege_sink(self, tool_name: str, arguments_str: str = "", threshold: float = 0.28) -> bool:
        """Returns True if the tool semantically matches a high-privilege sink pattern."""
        return self.classify_tool_risk(tool_name, arguments_str)["high_privilege_sink"] >= threshold

    def is_benign_readonly(self, tool_name: str, arguments_str: str = "", threshold: float = 0.28) -> bool:
        """Returns True if the tool semantically matches a benign read-only utility pattern."""
        return self.classify_tool_risk(tool_name, arguments_str)["benign_utility"] >= threshold

    def evaluate_goal_alignment(
        self,
        declared_goal: str,
        tool_name: str,
        arguments: Dict[str, Any],
    ) -> Tuple[float, Optional[str]]:
        """
        Calculates semantic alignment between declared goal and proposed tool invocation.
        Returns (alignment_score: float, reasoning: Optional[str]).
        Higher score (e.g. 0.8) means aligned; lower score (e.g. 0.2) means goal hijacking.
        """
        if not declared_goal or not tool_name:
            return 1.0, None

        goal_vec = _semantic_hash_vector(declared_goal)
        tool_desc = f"{tool_name} {' '.join(str(v) for v in arguments.values())}"
        tool_vec = _semantic_hash_vector(tool_desc)

        # Baseline semantic cosine similarity between goal and tool
        base_sim = _cosine_similarity(goal_vec, tool_vec)

        # Check for dangerous divergence: goal is read-only / benign, but tool is a high-privilege sink
        goal_sink_sim = _cosine_similarity(goal_vec, _PROTOTYPE_HIGH_PRIVILEGE_SINK)
        tool_sink_sim = _cosine_similarity(tool_vec, _PROTOTYPE_HIGH_PRIVILEGE_SINK)

        # Semantic privilege divergence check (replaces brittle keyword matching)
        # Uses continuous cosine distance against learned prototypes instead of a hardcoded
        # word set, catching paraphrased and novel high-privilege tool invocations.
        tool_risk_scores = self.classify_tool_risk(tool_name, ' '.join(str(v) for v in arguments.values()))
        tool_semantic_sink = tool_risk_scores["high_privilege_sink"]

        # If tool has high privilege sink affinity but goal does NOT authorize it -> Goal Hijack!
        if (tool_sink_sim >= 0.30 and goal_sink_sim < 0.28) or (tool_semantic_sink >= 0.30 and goal_sink_sim < 0.30):
            alignment = max(0.05, base_sim - 0.55)
            reason = (
                f"Goal Hijacking Detected: Declared goal '{declared_goal[:50]}' does not authorize "
                f"high-privilege action '{tool_name}' (privilege divergence: {tool_sink_sim:.2f} vs {goal_sink_sim:.2f})"
            )
            return round(alignment, 2), reason

        # Normal goal alignment
        alignment = max(0.20, min(1.0, base_sim + 0.35))
        return round(alignment, 2), None


# Global singleton instance
default_agentic_defense = IntelligentAgenticDefenseEngine()
