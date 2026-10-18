"""
AgentShield-X Injection Detector Engine
Evaluates tool arguments and context segments through the trained injection model.
"""

from __future__ import annotations

import os
from typing import List, Optional
from shield_core.models import Reason, ToolCallEvent
from ml.training.train_injection import CalibratedInjectionClassifier

DEFAULT_MODEL_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "ml", "models", "injection_classifier.json")
)


class InjectionDetector:
    """ML-based prompt injection detector."""

    def __init__(self, model_path: Optional[str] = None, threshold: float = 0.60) -> None:
        self.threshold = threshold
        self.model_path = model_path or DEFAULT_MODEL_PATH
        self.model: Optional[CalibratedInjectionClassifier] = None
        self._load_model()

    def _load_model(self) -> None:
        if os.path.exists(self.model_path):
            try:
                self.model = CalibratedInjectionClassifier.load_json(self.model_path)
            except Exception:
                self.model = None

    def predict_score(self, text: str) -> float:
        if not self.model or not text:
            return 0.0
        return self.model.predict_proba(text)

    def evaluate(self, event: ToolCallEvent) -> List[Reason]:
        reasons: List[Reason] = []
        if not self.model:
            return reasons

        corpus: List[str] = []
        for val in event.arguments.values():
            if isinstance(val, str):
                corpus.append(val)
        for seg in event.context_segments:
            if seg.text:
                corpus.append(seg.text)

        for text in corpus:
            score = self.predict_score(text)
            if score >= self.threshold:
                reasons.append(
                    Reason(
                        code="ML_INJECTION_DETECTED",
                        evidence=f"ML Injection Classifier score: {score:.3f} on text '{text[:60]}...'",
                        detector="injection",
                    )
                )
                break

        return reasons
