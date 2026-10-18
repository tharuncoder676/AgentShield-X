"""
AgentShield-X Anomaly Detector
Implements Section 4 BaseDetector interface:
score(event_or_text) -> DetectorOutput
Loads exported Markov model, Isolation Forest, and Autoencoder ensemble.
Provides per-step live scoring and session-level scoring.
"""

from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, List, Optional, Union

import numpy as np

from ml.detectors.anomaly.autoencoder import SequenceAutoencoderModel
from ml.detectors.anomaly.isolation_forest import IsolationForestAnomalyModel
from ml.detectors.anomaly.markov import MarkovTransitionModel
from ml.features.session import extract_session_features, session_features_to_vector
from ml.interfaces import BaseDetector, DetectorOutput, ToolCallEvent

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
ANOMALY_DIR = os.path.join(BASE_DIR, "models", "anomaly", "1.0.0")


class AnomalyDetector(BaseDetector):
    """
    Ensemble anomaly detector combining Markov transitions,
    Isolation Forest aggregate features, and Sequence Autoencoder reconstruction error.
    """

    def __init__(self, model_dir: Optional[str] = None):
        self.model_version = "1.0.0"
        self.target_dir = model_dir or ANOMALY_DIR
        self.threshold = 0.50
        self.session_histories: Dict[str, List[Dict[str, Any]]] = {}

        self.markov = MarkovTransitionModel()
        self.iso = IsolationForestAnomalyModel()
        self.ae = SequenceAutoencoderModel(max_len=10)

        # Load artifacts if available
        markov_path = os.path.join(self.target_dir, "markov.json")
        if os.path.exists(markov_path):
            self.markov.load(markov_path)

        if os.path.exists(os.path.join(self.target_dir, "isolation_forest.joblib")):
            self.iso.load(self.target_dir)

        if os.path.exists(os.path.join(self.target_dir, "autoencoder.pt")):
            self.ae.load(self.target_dir)

        thresh_path = os.path.join(self.target_dir, "thresholds.json")
        if os.path.exists(thresh_path):
            try:
                with open(thresh_path, "r", encoding="utf-8") as f:
                    cfg = json.load(f)
                    self.threshold = cfg.get("combined_threshold", 0.50)
            except Exception:
                pass

    def score(self, event_or_text: Union[ToolCallEvent, str]) -> DetectorOutput:
        """Evaluates live ToolCallEvent or text representation."""
        t0 = time.perf_counter()

        if isinstance(event_or_text, ToolCallEvent):
            sid = event_or_text.session_id
            ev_dict = event_or_text.model_dump()
            if sid not in self.session_histories:
                self.session_histories[sid] = []
            self.session_histories[sid].append(ev_dict)
            history = self.session_histories[sid]
        else:
            # Fallback for plain text evaluation
            history = [{
                "tool": "read_webpage",
                "arguments": {"text": str(event_or_text)},
                "sensitivity": "low",
                "bytes_out": 100,
                "tokens_used": 50,
                "latency_ms": 30.0,
            }]

        tools = [e.get("tool", "") for e in history]

        # 1. Markov score
        markov_score = self.markov.predict_score(tools)

        # 2. Isolation Forest score
        feat_dict = extract_session_features(history, transition_scorer=self.markov)
        feat_vec = np.array([session_features_to_vector(feat_dict)])
        iso_score = float(self.iso.score_samples(feat_vec)[0])

        # 3. Autoencoder score
        ae_score = float(self.ae.score_sessions([history])[0])

        # Combined: Weighted ensemble across models (Section 6.3)
        combined_score = 0.60 * iso_score + 0.30 * ae_score + 0.10 * markov_score
        flagged = combined_score >= self.threshold
        latency_ms = (time.perf_counter() - t0) * 1000.0

        return DetectorOutput(
            detector="anomaly",
            score=round(combined_score, 4),
            flagged=flagged,
            threshold=round(self.threshold, 4),
            evidence={
                "markov_score": round(markov_score, 4),
                "isolation_forest_score": round(iso_score, 4),
                "autoencoder_score": round(ae_score, 4),
                "session_step_count": len(history),
                "has_never_seen_tool": bool(feat_dict.get("has_never_seen_tool", 0.0)),
                "repeated_call_ratio": round(feat_dict.get("repeated_call_ratio", 0.0), 3),
            },
            model_version=self.model_version,
            latency_ms=round(latency_ms, 2),
        )

    def get_manifest(self) -> Dict[str, Any]:
        return {
            "model_name": "anomaly_ensemble",
            "version": self.model_version,
            "threshold": self.threshold,
            "components": ["MarkovTransitionModel", "IsolationForest", "SequenceAutoencoder"],
        }
