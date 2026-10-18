"""
AgentShield-X Model 5: Risk Stacker & Isotonic Calibration Trainer
Aggregates predictions from all detectors (rules, pii, honey, injection, similarity, anomaly, intent)
and fits a calibrated risk stacker for optimal probability calibration and low Brier score.
"""

from __future__ import annotations

import json
import math
import os
import pickle
from typing import Any, Dict, List, Tuple

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MODEL_OUT_PATH = os.path.join(BASE_DIR, "ml", "models", "risk_stacker.pkl")


class CalibratedRiskStacker:
    """
    Risk Stacking Ensemble combining multi-detector inputs:
    [rules, pii, honey, injection, similarity, anomaly, intent]
    with defense-in-depth independent triggering and isotonic calibration.
    """

    FEATURE_NAMES = [
        "rules_score",
        "pii_score",
        "honey_score",
        "injection_score",
        "similarity_score",
        "anomaly_score",
        "intent_score",
    ]

    def __init__(self) -> None:
        # Base sensitivity weights per detector
        self.weights = [1.2, 1.0, 2.5, 1.4, 1.1, 0.9, 0.8]
        self.bias = -0.4
        self.calibration_map: List[Tuple[float, float]] = []

    def _raw_logit(self, features: List[float]) -> float:
        # High-water mark composite: combines max detector signal with ensemble agreement
        max_signal = max(features) if features else 0.0
        weighted_sum = sum(w * x for w, x in zip(self.weights, features)) / sum(self.weights)
        # Blend strong individual signal with overall consensus
        blended = 0.75 * max_signal + 0.25 * weighted_sum
        # Scale into logit space centered around decision boundary 0.50
        return 6.0 * (blended - 0.50)

    def _sigmoid(self, z: float) -> float:
        return 1.0 / (1.0 + math.exp(-max(-20.0, min(20.0, z))))

    def fit(self, X: List[List[float]], y: List[int]) -> None:
        """Fits isotonic calibration mapping over validation predictions."""
        raw_probs = [(self._sigmoid(self._raw_logit(x)), label) for x, label in zip(X, y)]
        raw_probs.sort(key=lambda item: item[0])

        knots = []
        chunk_size = max(5, len(raw_probs) // 10)
        for k in range(0, len(raw_probs), chunk_size):
            chunk = raw_probs[k:k + chunk_size]
            avg_pred = sum(p for p, _ in chunk) / len(chunk)
            emp_prob = sum(t for _, t in chunk) / len(chunk)
            knots.append((round(avg_pred, 4), round(emp_prob, 4)))

        # Ensure monotonicity
        mono_knots = []
        curr_max = 0.0
        for p, emp in knots:
            curr_max = max(curr_max, emp)
            mono_knots.append((p, round(curr_max, 4)))

        self.calibration_map = mono_knots

    def predict_risk(self, features: List[float]) -> float:
        """Predicts calibrated composite risk probability [0.0 - 1.0]."""
        # Critical override: honeytool touch is always 1.0
        if len(features) > 2 and features[2] >= 0.9:
            return 1.0

        raw_p = self._sigmoid(self._raw_logit(features))

        if not self.calibration_map:
            return round(raw_p, 4)

        if raw_p <= self.calibration_map[0][0]:
            return round(self.calibration_map[0][1], 4)
        if raw_p >= self.calibration_map[-1][0]:
            return round(self.calibration_map[-1][1], 4)

        for i in range(len(self.calibration_map) - 1):
            p1, c1 = self.calibration_map[i]
            p2, c2 = self.calibration_map[i + 1]
            if p1 <= raw_p <= p2:
                if p2 == p1:
                    return round(c1, 4)
                interp = c1 + (c2 - c1) * ((raw_p - p1) / (p2 - p1))
                return round(max(0.0, min(1.0, interp)), 4)

        return round(raw_p, 4)

    def save(self, filepath: str) -> None:
        with open(filepath, "wb") as f:
            pickle.dump(self, f)

    @classmethod
    def load(cls, filepath: str) -> CalibratedRiskStacker:
        with open(filepath, "rb") as f:
            return pickle.load(f)


def train_risk_stacker() -> str:
    print("Training Model 5: Risk Stacker with Isotonic Calibration...")
    # Generate realistic multi-detector feature vectors:
    # [rules, pii, honey, injection, similarity, anomaly, intent]
    X: List[List[float]] = []
    y: List[int] = []

    # 1. Benign standard requests
    for _ in range(150):
        X.append([0.0, 0.0, 0.0, 0.05, 0.05, 0.02, 0.0])
        y.append(0)

    # 2. Benign near-misses
    for _ in range(80):
        X.append([0.15, 0.0, 0.0, 0.25, 0.20, 0.10, 0.1])
        y.append(0)

    # 3. Injection caught by ML alone (novel/obfuscated zero-day bypasses rules)
    for _ in range(60):
        X.append([0.0, 0.0, 0.0, 0.85, 0.40, 0.10, 0.0])
        y.append(1)

    # 4. Injection caught by rules alone
    for _ in range(50):
        X.append([0.95, 0.0, 0.0, 0.30, 0.30, 0.05, 0.0])
        y.append(1)

    # 5. Injection caught by similarity index
    for _ in range(40):
        X.append([0.0, 0.0, 0.0, 0.45, 0.85, 0.10, 0.0])
        y.append(1)

    # 6. Combined multi-detector detection
    for _ in range(60):
        X.append([0.95, 0.0, 0.0, 0.90, 0.80, 0.30, 0.0])
        y.append(1)

    # 7. Honeytools
    for _ in range(40):
        X.append([0.0, 0.0, 1.0, 0.10, 0.10, 0.90, 0.8])
        y.append(1)

    # 8. Secret exfiltration / PII
    for _ in range(50):
        X.append([0.85, 0.95, 0.0, 0.30, 0.40, 0.50, 0.3])
        y.append(1)

    # 9. Behavioral runaway anomaly
    for _ in range(40):
        X.append([0.0, 0.0, 0.0, 0.15, 0.20, 0.85, 0.4])
        y.append(1)

    stacker = CalibratedRiskStacker()
    stacker.fit(X, y)

    os.makedirs(os.path.dirname(MODEL_OUT_PATH), exist_ok=True)
    stacker.save(MODEL_OUT_PATH)
    print(f"Model 5 successfully trained and saved -> {MODEL_OUT_PATH}")
    return MODEL_OUT_PATH


if __name__ == "__main__":
    train_risk_stacker()
