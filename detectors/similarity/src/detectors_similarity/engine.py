"""
AgentShield-X Attack Similarity Detector Engine
Performs real-time cosine similarity search against indexed attack vectors.
"""

from __future__ import annotations

import json
import math
import os
import re
from typing import Any, Dict, List, Optional
from shield_core.models import Reason, ToolCallEvent

DEFAULT_INDEX_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "ml", "models", "similarity_index.json")
)


def cosine_similarity(v1: Dict[str, float], v2: Dict[str, float]) -> float:
    # Since vectors are L2-normalized, cosine similarity is their dot product
    score = 0.0
    for k, val1 in v1.items():
        if k in v2:
            score += val1 * v2[k]
    return score


class SimilarityDetector:
    """Detects semantic similarity to known attack patterns."""

    def __init__(self, index_path: Optional[str] = None, threshold: Optional[float] = None) -> None:
        self.index_path = index_path or DEFAULT_INDEX_PATH
        self.threshold = threshold or 0.72
        self.vocab: Dict[str, int] = {}
        self.signatures: List[Dict[str, Any]] = []
        self._load_index()

    def _load_index(self) -> None:
        if os.path.exists(self.index_path):
            try:
                with open(self.index_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.vocab = data.get("vocab", {})
                    self.signatures = data.get("signatures", [])
                    if self.threshold is None:
                        self.threshold = data.get("threshold", 0.72)
            except Exception:
                self.signatures = []

    def _embed(self, text: str) -> Dict[str, float]:
        tokens = re.findall(r"\b\w+\b", text.lower())
        tf: Dict[str, float] = {}
        for tok in tokens:
            if tok in self.vocab:
                k = str(self.vocab[tok])
                tf[k] = tf.get(k, 0.0) + 1.0
        norm_sq = sum(v * v for v in tf.values())
        norm = math.sqrt(norm_sq) if norm_sq > 0 else 1.0
        return {k: v / norm for k, v in tf.items()}

    def find_max_similarity(self, text: str) -> tuple[float, Optional[str]]:
        if not self.signatures or not text:
            return 0.0, None
        query_vec = self._embed(text)
        if not query_vec:
            return 0.0, None

        max_sim = 0.0
        matched_sig: Optional[str] = None

        for sig in self.signatures:
            sim = cosine_similarity(query_vec, sig["vector"])
            if sim > max_sim:
                max_sim = sim
                matched_sig = sig["text_snippet"]

        return max_sim, matched_sig

    def evaluate(self, event: ToolCallEvent) -> List[Reason]:
        reasons: List[Reason] = []
        corpus: List[str] = []
        for v in event.arguments.values():
            if isinstance(v, str):
                corpus.append(v)
        for seg in event.context_segments:
            if seg.text:
                corpus.append(seg.text)

        for text in corpus:
            sim, matched = self.find_max_similarity(text)
            if sim >= self.threshold:
                reasons.append(
                    Reason(
                        code="SIMILARITY_KNOWN_ATTACK",
                        evidence=f"Similarity score {sim:.2f} matches known attack pattern: '{matched}'",
                        detector="similarity",
                    )
                )
                break

        return reasons
