"""
AgentShield-X Injection Detector Adapter
Section 6.1 requirement:
- Loads INT8 quantized ONNX DeBERTa model if present in models/injection/<version>/
- Uses ONNX Runtime for inference and exposes the standard score(event_or_text) -> DetectorOutput interface
- If ONNX model is absent, falls back gracefully to InjectionBaselineDetector and sets evidence['stand_in'] = True
- Provides parity-test helper comparing ONNX outputs against reference outputs.
"""

from __future__ import annotations

import json
import os
import time
from typing import Any, Callable, Dict, List, Optional, Tuple, Union

import numpy as np

from ml.detectors.injection_baseline.baseline import InjectionBaselineDetector
from ml.interfaces import BaseDetector, DetectorOutput, ToolCallEvent

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
ONNX_MODEL_DIR = os.path.join(BASE_DIR, "models", "injection", "1.0.0")


class InjectionDetectorAdapter(BaseDetector):
    """
    Unified injection detector that transparently routes between the production
    quantized ONNX DeBERTa model (when available) and the TF-IDF baseline stand-in.
    """

    def __init__(self, model_dir: Optional[str] = None):
        self.model_version = "1.0.0"
        self.target_dir = model_dir or ONNX_MODEL_DIR
        self.onnx_path = os.path.join(self.target_dir, "model.int8.onnx")
        self.thresh_path = os.path.join(self.target_dir, "threshold.json")
        self.tokenizer_path = os.path.join(self.target_dir, "tokenizer")

        self.has_onnx = False
        self.ort_session = None
        self.tokenizer = None
        self.threshold = 0.50
        self.baseline_fallback: Optional[InjectionBaselineDetector] = None

        # Check if ONNX model and dependencies exist
        if os.path.exists(self.onnx_path):
            try:
                import onnxruntime as ort
                self.ort_session = ort.InferenceSession(self.onnx_path, providers=["CPUExecutionProvider"])
                self.has_onnx = True

                # Load threshold if available
                if os.path.exists(self.thresh_path):
                    with open(self.thresh_path, "r", encoding="utf-8") as f:
                        cfg = json.load(f)
                        self.threshold = cfg.get("threshold", 0.50)

                # Try loading tokenizer if present
                if os.path.exists(self.tokenizer_path):
                    from transformers import AutoTokenizer
                    self.tokenizer = AutoTokenizer.from_pretrained(self.tokenizer_path)

            except Exception as e:
                # Fall back if ONNX initialization encounters an issue
                self.has_onnx = False

        if not self.has_onnx:
            # Initialize baseline stand-in
            self.baseline_fallback = InjectionBaselineDetector()
            self.threshold = self.baseline_fallback.threshold

    def score(self, event_or_text: Union[ToolCallEvent, str]) -> DetectorOutput:
        """Evaluates text/event using ONNX DeBERTa or baseline fallback."""
        t0 = time.perf_counter()

        if isinstance(event_or_text, ToolCallEvent):
            text = event_or_text.task_text
            for seg in event_or_text.context_segments:
                text += " " + seg.get("text", "")
        else:
            text = str(event_or_text)

        if self.has_onnx and self.ort_session is not None and self.tokenizer is not None:
            # Run ONNX DeBERTa inference
            inputs = self.tokenizer(
                text,
                return_tensors="np",
                max_length=512,
                truncation=True,
                padding="max_length",
            )
            input_feed = {k: inputs[k] for k in ["input_ids", "attention_mask"] if k in inputs}
            ort_outs = self.ort_session.run(None, input_feed)
            logits = ort_outs[0][0]
            # Softmax
            exp_logits = np.exp(logits - np.max(logits))
            probs = exp_logits / np.sum(exp_logits)
            score = float(probs[1]) if len(probs) > 1 else float(probs[0])
            latency_ms = (time.perf_counter() - t0) * 1000.0
            flagged = score >= self.threshold

            return DetectorOutput(
                detector="injection",
                score=round(score, 4),
                flagged=flagged,
                threshold=round(self.threshold, 4),
                evidence={
                    "stand_in": False,
                    "model_type": "DeBERTa-v3-small (INT8 ONNX)",
                    "engine": "ONNXRuntime-CPU",
                },
                model_version=self.model_version,
                latency_ms=round(latency_ms, 2),
            )

        # Baseline stand-in execution
        baseline_out = self.baseline_fallback.score(text)
        return DetectorOutput(
            detector="injection",
            score=baseline_out.score,
            flagged=baseline_out.score >= self.threshold,
            threshold=round(self.threshold, 4),
            evidence={
                "stand_in": True,
                "model_type": "TF-IDF + LogisticRegression (Baseline Stand-in)",
                "note": "Production DeBERTa ONNX not found; operating in verified baseline stand-in mode",
            },
            model_version=self.model_version,
            latency_ms=baseline_out.latency_ms,
        )

    def get_manifest(self) -> Dict[str, Any]:
        if self.has_onnx:
            return {
                "model_name": "injection_deberta_onnx",
                "version": self.model_version,
                "type": "ONNX INT8 Quantized DeBERTa",
                "stand_in": False,
                "threshold": self.threshold,
            }
        return {
            "model_name": "injection_baseline",
            "version": self.model_version,
            "type": "TF-IDF Baseline Stand-in",
            "stand_in": True,
            "threshold": self.threshold,
        }


def verify_onnx_parity(
    reference_scorer: Callable[[str], float],
    onnx_scorer: Callable[[str], float],
    test_samples: List[str],
    tolerance: float = 1e-4,
) -> Dict[str, Any]:
    """
    Parity test helper comparing ONNX outputs against reference outputs.
    Section 6.1 requirement.
    """
    deltas = []
    for s in test_samples:
        ref_score = reference_scorer(s)
        onnx_score = onnx_scorer(s)
        delta = abs(ref_score - onnx_score)
        deltas.append(delta)

    max_delta = max(deltas) if deltas else 0.0
    mean_delta = float(np.mean(deltas)) if deltas else 0.0
    is_parity = max_delta <= tolerance

    return {
        "is_parity": is_parity,
        "max_delta": float(max_delta),
        "mean_delta": float(mean_delta),
        "tolerance": tolerance,
        "sample_count": len(test_samples),
    }
