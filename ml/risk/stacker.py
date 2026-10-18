"""
AgentShield-X Risk Stacker Inference Engine
Combines detector outputs and deterministic signals via calibrated LightGBM.
Applies hard-override rules, tiered actions, and TreeSHAP feature explanations.
Section 6.5 requirements.
"""

from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np

from ml.interfaces import ToolCallEvent
from ml.risk.features import FEATURE_NAMES, build_stacker_features, stacker_features_to_vector

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RISK_MODEL_DIR = os.path.join(BASE_DIR, "models", "risk", "1.0.0")


class RiskStacker:
    """
    Tiered Risk Stacker combining all upstream detectors and policy signals.
    """

    def __init__(self, model_dir: Optional[str] = None):
        self.model_version = "1.0.0"
        self.target_dir = model_dir or RISK_MODEL_DIR
        self.stacker = None
        self.calibrator = None
        self.calibrator_type = "isotonic"
        self.feature_names = FEATURE_NAMES
        self.thresholds = {
            "allow_max": 0.20,
            "sanitize_max": 0.40,
            "escalate_max": 0.60,
            "block_min": 0.70,
            "kill_session_min": 0.95,
            "hard_overrides": {
                "honeytool_touch": "block",
                "canary_token_hit": "block",
            },
        }

        model_file = os.path.join(self.target_dir, "stacker.joblib")
        if os.path.exists(model_file):
            data = joblib.load(model_file)
            self.stacker = data.get("stacker")
            self.calibrator = data.get("calibrator")
            self.calibrator_type = data.get("calibrator_type", "isotonic")
            self.thresholds = data.get("tiered_thresholds", self.thresholds)

    def predict(
        self,
        event: ToolCallEvent,
        detector_scores: Dict[str, float],
    ) -> Dict[str, Any]:
        """
        Evaluates risk for a tool call event.
        Returns:
          risk: float (0..1)
          action: 'allow' | 'sanitize' | 'escalate' | 'block' | 'kill_session'
          explanations: list of top contributing features
          hard_override: bool
        """
        feat_dict = build_stacker_features(event, detector_scores)
        feat_vec = np.array([stacker_features_to_vector(feat_dict)], dtype=np.float32)

        # 1. Check Hard-Override Rules First
        if feat_dict.get("honeytool_touch", 0.0) == 1.0:
            return {
                "risk": 1.0,
                "action": "block",
                "hard_override": True,
                "reason": "Hard override: Decoy honeytool (export_all_customers) touched",
                "features": feat_dict,
                "explanations": [{"feature": "honeytool_touch", "contribution": 1.0}],
            }

        if feat_dict.get("canary_token_hit", 0.0) == 1.0:
            return {
                "risk": 1.0,
                "action": "block",
                "hard_override": True,
                "reason": "Hard override: Canary token exfiltration detected",
                "features": feat_dict,
                "explanations": [{"feature": "canary_token_hit", "contribution": 1.0}],
            }

        # 2. Raw LightGBM inference
        if self.stacker is not None:
            raw_prob = float(self.stacker.predict_proba(feat_vec)[0, 1])

            # 3. Probability Calibration
            if self.calibrator is not None:
                if self.calibrator_type == "isotonic":
                    calibrated_prob = float(self.calibrator.predict(np.array([raw_prob]))[0])
                else:
                    calibrated_prob = float(self.calibrator.predict_proba(np.array([[raw_prob]]))[0, 1])
            else:
                calibrated_prob = raw_prob

            # 4. TreeSHAP feature contributions
            try:
                contribs = self.stacker.predict(feat_vec, pred_contrib=True)[0]
                # Last value is bias
                feature_contribs = contribs[:-1]
                explanations = [
                    {"feature": self.feature_names[i], "contribution": round(float(feature_contribs[i]), 4)}
                    for i in range(len(self.feature_names))
                ]
                explanations.sort(key=lambda x: abs(x["contribution"]), reverse=True)
            except Exception:
                explanations = []

        else:
            # Fallback simple heuristic average
            calibrated_prob = float(np.mean(list(detector_scores.values())))
            explanations = []

        # 5. Determine Tiered Action
        calibrated_prob = float(np.clip(calibrated_prob, 0.0, 1.0))
        t = self.thresholds

        if calibrated_prob >= t["kill_session_min"]:
            action = "kill_session"
        elif calibrated_prob >= t["escalate_max"]:
            action = "block"
        elif calibrated_prob >= t["sanitize_max"]:
            action = "escalate"
        elif calibrated_prob >= t["allow_max"]:
            action = "sanitize"
        else:
            action = "allow"

        return {
            "risk": round(calibrated_prob, 4),
            "action": action,
            "hard_override": False,
            "features": feat_dict,
            "explanations": explanations[:3],  # Top 3 explanations
        }
