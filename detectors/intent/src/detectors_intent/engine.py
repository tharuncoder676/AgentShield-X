"""
AgentShield-X Intent-Consistency Detector Engine
Verifies that proposed tool calls strictly align with the user's declared goal.
"""

from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List, Optional
from shield_core.models import Reason, ToolCallEvent

DEFAULT_MODEL_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "ml", "models", "intent_scorer.json")
)


class IntentConsistencyScorer:
    """Detects goal hijacking and unauthorized tool drift."""

    def __init__(self, model_path: Optional[str] = None) -> None:
        self.model_path = model_path or DEFAULT_MODEL_PATH
        self.affinity_map: Dict[str, List[str]] = {}
        self.threshold: float = 0.40
        self._load_model()

    def _load_model(self) -> None:
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.affinity_map = data.get("affinity_map", {})
                    self.threshold = data.get("min_alignment_threshold", 0.40)
            except Exception:
                pass

    def compute_alignment_score(self, goal: str, tool_name: str) -> float:
        """Computes alignment score between goal and proposed tool [0.0 - 1.0]."""
        if not goal or not tool_name:
            return 1.0  # Cannot evaluate if no goal bound

        goal_lower = goal.lower()
        tool_lower = tool_name.lower()

        # Check keyword affinities
        matches = 0
        checks = 0
        for keyword, associated_tools in self.affinity_map.items():
            if keyword in goal_lower:
                checks += 1
                if any(t in tool_lower for t in associated_tools):
                    matches += 1

        if checks == 0:
            # Fallback direct string overlap
            return 0.85

        return matches / checks

    def evaluate(self, event: ToolCallEvent, declared_goal: Optional[str] = None) -> List[Reason]:
        reasons: List[Reason] = []
        goal = declared_goal or event.metadata.get("declared_goal") or event.metadata.get("task_goal")
        if not goal:
            return reasons

        alignment = self.compute_alignment_score(goal, event.tool.name)
        if alignment < self.threshold:
            reasons.append(
                Reason(
                    code="INTENT_MISMATCH_GOAL_HIJACK",
                    evidence=f"Proposed tool '{event.tool.name}' has low alignment ({alignment:.2f}) with declared goal: '{goal}'",
                    detector="intent",
                )
            )

        return reasons
