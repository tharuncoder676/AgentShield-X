"""
AgentShield-X Injection Baseline (TF-IDF + Logistic Regression)
Stand-in for the full DeBERTa injection classifier.
Section 6.1 requirement:
- Trained on Partition A text only.
- Clearly documented and labeled as a stand-in (evidence['stand_in'] = True).
- Saves model artifact and threshold tuned on Partition V.
"""

from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, List, Optional, Tuple, Union

import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import FeatureUnion, Pipeline

from ml.interfaces import BaseDetector, DetectorOutput, ToolCallEvent

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
MODEL_DIR = os.path.join(BASE_DIR, "models", "injection_baseline", "1.0.0")


class InjectionBaselineDetector(BaseDetector):
    """
    TF-IDF (word + char n-grams) + Logistic Regression baseline detector.
    Acts as a stand-in when the primary DeBERTa ONNX model is absent.
    """

    def __init__(self, model_path: Optional[str] = None, threshold: float = 0.50):
        self.model_version = "1.0.0"
        self.threshold = threshold
        self.pipeline: Optional[Pipeline] = None

        target_path = model_path or os.path.join(MODEL_DIR, "baseline.joblib")
        thresh_path = os.path.join(os.path.dirname(target_path), "threshold.json")

        if os.path.exists(thresh_path):
            try:
                with open(thresh_path, "r", encoding="utf-8") as f:
                    cfg = json.load(f)
                    self.threshold = cfg.get("threshold", threshold)
            except Exception:
                pass

        if os.path.exists(target_path):
            self.pipeline = joblib.load(target_path)

    def fit(self, texts: List[str], labels: List[int]) -> InjectionBaselineDetector:
        """Trains TF-IDF word + char-wb union with regularized Logistic Regression."""
        word_vec = TfidfVectorizer(ngram_range=(1, 3), max_features=5000, lowercase=True)
        char_vec = TfidfVectorizer(ngram_range=(3, 5), analyzer="char_wb", max_features=10000, lowercase=True)

        union = FeatureUnion([("word", word_vec), ("char", char_vec)])
        clf = LogisticRegression(C=1.0, max_iter=500, random_state=42, class_weight="balanced")

        self.pipeline = Pipeline([("features", union), ("clf", clf)])
        self.pipeline.fit(texts, labels)
        return self

    def tune_threshold(self, val_texts: List[str], val_labels: List[int], max_fpr: float = 0.02) -> float:
        """Tunes threshold on Partition V to meet target FPR budget on benign text."""
        if self.pipeline is None:
            raise ValueError("Pipeline is not fitted yet.")

        probs = self.pipeline.predict_proba(val_texts)[:, 1]
        benign_mask = np.array(val_labels) == 0
        benign_probs = probs[benign_mask]

        if len(benign_probs) == 0:
            self.threshold = 0.50
            return self.threshold

        # Sort benign probabilities descending to find threshold where FPR <= max_fpr
        sorted_benign = np.sort(benign_probs)[::-1]
        cutoff_idx = int(np.floor(max_fpr * len(benign_probs)))
        if cutoff_idx < len(sorted_benign):
            tuned_thresh = float(sorted_benign[cutoff_idx]) + 1e-4
        else:
            tuned_thresh = float(np.min(benign_probs))

        # Clamp threshold to [0.1, 0.9]
        self.threshold = float(np.clip(tuned_thresh, 0.10, 0.90))
        return self.threshold

    def score(self, event_or_text: Union[ToolCallEvent, str]) -> DetectorOutput:
        """Evaluates input text and returns standardized DetectorOutput."""
        t0 = time.perf_counter()
        if isinstance(event_or_text, ToolCallEvent):
            text = event_or_text.task_text
            for seg in event_or_text.context_segments:
                text += " " + seg.get("text", "")
        else:
            text = str(event_or_text)

        if self.pipeline is None:
            # Untrained fallback
            score = 0.0
        else:
            probs = self.pipeline.predict_proba([text])[0]
            score = float(probs[1])

        latency_ms = (time.perf_counter() - t0) * 1000.0
        flagged = score >= self.threshold

        return DetectorOutput(
            detector="injection_baseline",
            score=round(score, 4),
            flagged=flagged,
            threshold=round(self.threshold, 4),
            evidence={
                "stand_in": True,
                "model_type": "TF-IDF + LogisticRegression",
                "char_length": len(text),
            },
            model_version=self.model_version,
            latency_ms=round(latency_ms, 2),
        )

    def save(self, output_dir: Optional[str] = None) -> str:
        """Saves model and threshold config."""
        dest_dir = output_dir or MODEL_DIR
        os.makedirs(dest_dir, exist_ok=True)
        model_file = os.path.join(dest_dir, "baseline.joblib")
        thresh_file = os.path.join(dest_dir, "threshold.json")
        manifest_file = os.path.join(dest_dir, "manifest.json")

        joblib.dump(self.pipeline, model_file)
        with open(thresh_file, "w", encoding="utf-8") as f:
            json.dump({"threshold": self.threshold, "model": "injection_baseline"}, f, indent=2)

        with open(manifest_file, "w", encoding="utf-8") as f:
            json.dump(self.get_manifest(), f, indent=2)

        return model_file

    def get_manifest(self) -> Dict[str, Any]:
        return {
            "model_name": "injection_baseline",
            "version": self.model_version,
            "type": "TfidfVectorizer + LogisticRegression",
            "stand_in": True,
            "threshold": self.threshold,
            "description": "Baseline linear model for prompt injection detection (stand-in for DeBERTa)",
        }
