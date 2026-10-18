"""
AgentShield-X Isolation Forest Anomaly Model
Trains on session aggregate feature vectors from benign Partition A sessions.
Thresholds selected on Partition V (not via internal contamination).
Section 6.3 Model 2.
"""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler


class IsolationForestAnomalyModel:
    """Isolation Forest anomaly estimator with standard scaling."""

    def __init__(self, n_estimators: int = 100, max_samples: int = 256, random_state: int = 42):
        self.n_estimators = n_estimators
        self.max_samples = max_samples
        self.random_state = random_state
        self.scaler = StandardScaler()
        self.clf = IsolationForest(
            n_estimators=n_estimators,
            max_samples=max_samples,
            contamination=0.01,  # Kept fixed as requested in Section 6.3
            random_state=random_state,
        )
        self.threshold = 0.50

    def fit(self, X: np.ndarray) -> IsolationForestAnomalyModel:
        """Fits scaler and Isolation Forest on benign feature vectors."""
        X_scaled = self.scaler.fit_transform(X)
        self.clf.fit(X_scaled)
        return self

    def score_samples(self, X: np.ndarray) -> np.ndarray:
        """
        Computes anomaly score: negative decision function (higher = more anomalous).
        Outputs normalized score in [0..1].
        """
        X_scaled = self.scaler.transform(X)
        # raw decision_function: positive for inliers, negative for outliers
        raw_scores = -self.clf.decision_function(X_scaled)
        # Shift and scale so typical benign is near 0.2, anomalies > 0.6
        norm_scores = 1.0 / (1.0 + np.exp(-4.0 * raw_scores))
        return norm_scores

    def tune_threshold(self, X_val: np.ndarray, y_val: np.ndarray, max_fpr: float = 0.01) -> float:
        """Tunes threshold on Partition V to meet target FPR on benign sessions."""
        scores = self.score_samples(X_val)
        benign_scores = scores[y_val == 0]

        sorted_benign = np.sort(benign_scores)[::-1]
        cutoff_idx = int(np.floor(max_fpr * len(benign_scores)))
        if cutoff_idx < len(sorted_benign):
            thresh = float(sorted_benign[cutoff_idx]) + 1e-4
        else:
            thresh = float(np.min(benign_scores))

        self.threshold = float(np.clip(thresh, 0.20, 0.95))
        return self.threshold

    def save(self, dest_dir: str) -> None:
        """Saves scaler, model, and threshold."""
        os.makedirs(dest_dir, exist_ok=True)
        joblib.dump({"clf": self.clf, "scaler": self.scaler, "threshold": self.threshold}, os.path.join(dest_dir, "isolation_forest.joblib"))

    def load(self, dest_dir: str) -> None:
        """Loads serialized model and threshold."""
        obj = joblib.load(os.path.join(dest_dir, "isolation_forest.joblib"))
        self.clf = obj["clf"]
        self.scaler = obj["scaler"]
        self.threshold = obj.get("threshold", 0.50)
