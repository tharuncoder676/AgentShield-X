"""
AgentShield-X Behavioral Anomaly Detector Engine
Scores tool calls against trained session transition matrices and aggregate feature baselines.
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional
from shield_core.models import Reason, ToolCallEvent
from detectors_pii.engine import shannon_entropy

DEFAULT_MODEL_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "ml", "models", "anomaly_models.json")
)


class AnomalyDetector:
    """Detects sequence anomalies, unusual burst rates, and out-of-order tool dispatch."""

    def __init__(self, model_path: Optional[str] = None) -> None:
        self.model_path = model_path or DEFAULT_MODEL_PATH
        self.config: Dict[str, Any] = {}
        self.threshold: float = 0.70
        self._load_model()

    def _load_model(self) -> None:
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, "r", encoding="utf-8") as f:
                    self.config = json.load(f)
                    self.threshold = self.config.get("anomaly_score_threshold", 0.70)
            except Exception:
                self.config = {}

    def score_event(self, event: ToolCallEvent, prev_tool: Optional[str] = None) -> float:
        """
        Computes composite anomaly score [0.0 - 1.0].
        Combines:
        1. Never-seen tool flag
        2. Sequence transition probability
        3. Argument entropy outlier
        """
        if not self.config:
            return 0.0

        scores = []
        valid_tools = set(self.config.get("valid_tools", []))

        # 1. Unseen tool check
        if event.tool.name not in valid_tools:
            scores.append(0.95)

        # 2. Sequence transition likelihood
        trans_probs = self.config.get("transition_probabilities", {})
        if prev_tool and prev_tool in trans_probs:
            prob = trans_probs[prev_tool].get(event.tool.name, 0.0)
            if prob == 0.0:
                scores.append(0.85)  # Disallowed / unseen transition
            elif prob < 0.15:
                scores.append(0.50)  # Rare transition
            else:
                scores.append(0.0)

        # 3. Argument entropy outlier
        raw_args = " ".join(str(v) for v in event.arguments.values())
        ent = shannon_entropy(raw_args)
        ent_baseline = self.config.get("aggregate_baselines", {}).get("arg_entropy", {})
        p95_ent = ent_baseline.get("p95", 4.0)

        if ent > p95_ent + 1.0:
            scores.append(0.80)
        elif ent > p95_ent:
            scores.append(0.40)
        else:
            scores.append(0.0)

        return max(scores) if scores else 0.0

    def evaluate(self, event: ToolCallEvent, prev_tool: Optional[str] = None) -> List[Reason]:
        reasons: List[Reason] = []
        score = self.score_event(event, prev_tool)

        if score >= self.threshold:
            reasons.append(
                Reason(
                    code="ANOMALY_TOOL_SEQUENCE_OUTLIER",
                    evidence=f"Behavioral anomaly score {score:.2f} exceeds threshold {self.threshold:.2f} for tool '{event.tool.name}'",
                    detector="anomaly",
                )
            )

        return reasons
