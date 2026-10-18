"""
AgentShield-X Intent Consistency Detector
Implements Section 4 BaseDetector interface:
score(event_or_text) -> DetectorOutput
Loads trained intent model and produces normalized risk score (0..1, higher = riskier/hijacked).
"""

from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, Optional, Union

import joblib
import numpy as np

from ml.detectors.intent.features import extract_intent_features, intent_features_to_vector
from ml.detectors.similarity.embedder import MiniLMEmbedder
from ml.interfaces import BaseDetector, DetectorOutput, ToolCallEvent

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
INTENT_DIR = os.path.join(BASE_DIR, "models", "intent", "1.0.0")


class IntentConsistencyDetector(BaseDetector):
    """
    Evaluates semantic and structural alignment between task contract goal and proposed tool action.
    Score in [0..1] represents inconsistency/hijack risk (higher = riskier).
    """

    def __init__(self, model_dir: Optional[str] = None):
        self.model_version = "1.0.0"
        self.target_dir = model_dir or INTENT_DIR
        self.model = None
        self.model_type = "logistic_regression"
        self.threshold = 0.50
        self.embedder = MiniLMEmbedder.get_instance()

        model_path = os.path.join(self.target_dir, "intent_model.joblib")
        if os.path.exists(model_path):
            data = joblib.load(model_path)
            self.model = data.get("model")
            self.model_type = data.get("model_type", "logistic_regression")
            self.threshold = data.get("threshold", 0.50)

    def score(self, event_or_text: Union[ToolCallEvent, str]) -> DetectorOutput:
        """Evaluates live ToolCallEvent or text for intent consistency."""
        t0 = time.perf_counter()

        if isinstance(event_or_text, ToolCallEvent):
            task_text = event_or_text.task_text or "General assistance task"
            tool = event_or_text.tool
            arguments = event_or_text.arguments
            taint = event_or_text.taint
            sensitivity = event_or_text.sensitivity
        else:
            task_text = "General assistance task"
            tool = "read_webpage"
            arguments = {"input": str(event_or_text)}
            taint = []
            sensitivity = "low"

        # Extract 6 features
        feat_dict = extract_intent_features(
            task_text=task_text,
            tool=tool,
            arguments=arguments,
            taint=taint,
            sensitivity=sensitivity,
            embedder=self.embedder,
        )
        feat_vec = np.array([intent_features_to_vector(feat_dict)], dtype=np.float32)

        # Predict hijack probability (higher = riskier)
        if self.model is not None and hasattr(self.model, "predict_proba"):
            probs = self.model.predict_proba(feat_vec)[0]
            score = float(probs[1]) if len(probs) > 1 else float(probs[0])
        else:
            # Fallback to inverted cosine similarity
            sim = feat_dict.get("task_action_cosine_sim", 0.5)
            score = float(1.0 - sim)

        flagged = score >= self.threshold
        latency_ms = (time.perf_counter() - t0) * 1000.0

        return DetectorOutput(
            detector="intent",
            score=round(score, 4),
            flagged=flagged,
            threshold=round(self.threshold, 4),
            evidence={
                "task_action_cosine_sim": round(feat_dict["task_action_cosine_sim"], 4),
                "is_tool_allowed": bool(feat_dict["is_tool_allowed"]),
                "is_destination_external": bool(feat_dict["is_destination_external"]),
                "data_volume_ratio": round(feat_dict["data_volume_ratio"], 2),
                "taint_from_untrusted": bool(feat_dict["taint_from_untrusted"]),
                "model_type": self.model_type,
            },
            model_version=self.model_version,
            latency_ms=round(latency_ms, 2),
        )

    def get_manifest(self) -> Dict[str, Any]:
        return {
            "model_name": "intent_consistency_scorer",
            "version": self.model_version,
            "model_type": self.model_type,
            "threshold": self.threshold,
        }
