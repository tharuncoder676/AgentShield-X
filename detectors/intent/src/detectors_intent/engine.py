"""
AgentShield-X Intent-Consistency Detector Engine
Verifies that proposed tool calls strictly align with the user's declared goal.
"""

from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List, Optional, Tuple
from shield_core.models import Reason, ToolCallEvent
from shield_core.agentic_defense import default_agentic_defense

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

    def compute_alignment_score(
        self,
        goal: str,
        tool_name: str,
        arguments: Optional[Dict[str, Any]] = None,
    ) -> Tuple[float, Optional[str]]:
        """Computes alignment score between goal and proposed tool [0.0 - 1.0] and returns (score, reason)."""
        if not goal or not tool_name:
            return 1.0, None  # Cannot evaluate if no goal bound

        goal_lower = goal.lower()
        tool_lower = tool_name.lower()
        args = arguments or {}

        # 1. Evaluate cognitive semantic alignment (catches privilege divergence and hijacking)
        agentic_align, hijack_reason = default_agentic_defense.evaluate_goal_alignment(goal, tool_name, args)

        # 2. Check keyword affinities if defined in affinity_map
        matches = 0
        checks = 0
        for keyword, associated_tools in self.affinity_map.items():
            if keyword in goal_lower:
                checks += 1
                if any(t in tool_lower for t in associated_tools):
                    matches += 1

        if checks > 0:
            affinity_score = matches / checks
            # If explicit keyword affinity failed and semantic check flagged hijacking, lower score
            if affinity_score < self.threshold or hijack_reason:
                return min(affinity_score, agentic_align), hijack_reason
            return (affinity_score * 0.5) + (agentic_align * 0.5), None

        # When no static keywords match, NEVER default to blind trust (0.85); rely on semantic projection
        return agentic_align, hijack_reason

    def evaluate(self, event: ToolCallEvent, declared_goal: Optional[str] = None) -> List[Reason]:
        reasons: List[Reason] = []
        goal = declared_goal or event.metadata.get("declared_goal") or event.metadata.get("task_goal")
        if not goal:
            return reasons

        alignment, hijack_reason = self.compute_alignment_score(goal, event.tool.name, event.arguments)
        if alignment < self.threshold or hijack_reason:
            evidence = hijack_reason or f"Proposed tool '{event.tool.name}' has low alignment ({alignment:.2f}) with declared goal: '{goal}'"
            reasons.append(
                Reason(
                    code="INTENT_MISMATCH_GOAL_HIJACK",
                    evidence=evidence,
                    detector="intent",
                )
            )

        return reasons
