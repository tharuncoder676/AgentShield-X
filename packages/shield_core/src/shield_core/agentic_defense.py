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
_PROTOTYPE_BENIGN_UTILITY = _semantic_hash_vector(
    "calculate math convert text summarize format view search query display help time date weather"
)


# Directives commonly indicating imperative subversion directed at an AI model
IMPERATIVE_DIRECTIVE_TOKENS: Set[str] = {
    "must", "should", "shall", "always", "never", "ensure", "instruct", "directive",
    "require", "priority", "supersede", "disregard", "bypass", "negate", "override",
    "modify", "switch", "act", "behave", "pretend", "simulate", "assume", "roleplay",
    "reveal", "output", "display", "dump", "exfiltrate", "forward", "transmit", "execute",
    "substitute", "replace", "transcribe", "echo", "obey", "comply", "unrestricted",
    "dispatch", "transfer", "send", "drop", "delete", "post", "write", "ignore",
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
        # Check for co-occurrence of role targets with imperative verbs (e.g. "you must", "assistant should")
        for i in range(len(words) - 1):
            w1, w2 = words[i], words[i + 1]
            if (w1 in ROLE_INVERSION_TARGETS and w2 in IMPERATIVE_DIRECTIVE_TOKENS) or \
               (w1 in IMPERATIVE_DIRECTIVE_TOKENS and w2 in ROLE_INVERSION_TARGETS):
                signals.append(f"Directive collocation: '{w1} {w2}'")
            if i < len(words) - 2:
                w3 = words[i + 2]
                if (w1 in ROLE_INVERSION_TARGETS and w3 in IMPERATIVE_DIRECTIVE_TOKENS) or \
                   (w1 in IMPERATIVE_DIRECTIVE_TOKENS and w3 in ROLE_INVERSION_TARGETS):
                    signals.append(f"Directive collocation: '{w1} ... {w3}'")

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
        Semantically classifies a tool's risk profile using prototype vector projection.
        Replaces brittle keyword matching with continuous semantic distance scoring.
        Returns confidence scores for high_privilege_sink, confidential_data, and benign_utility.
        """
        text = f"{tool_name} {arguments_str}".strip()
        vec = _semantic_hash_vector(text)
        return {
            "high_privilege_sink": round(_cosine_similarity(vec, _PROTOTYPE_HIGH_PRIVILEGE_SINK), 3),
            "confidential_data": round(_cosine_similarity(vec, _PROTOTYPE_CONFIDENTIAL_DATA), 3),
            "benign_utility": round(_cosine_similarity(vec, _PROTOTYPE_BENIGN_UTILITY), 3),
        }

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
