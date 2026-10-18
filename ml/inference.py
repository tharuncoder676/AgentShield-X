"""
AgentShield-X Core Inference Engine
Exposes score_event(event) -> Decision running all detectors in parallel with per-detector timeouts,
stacker evaluation, tiered actions, and graceful degraded mode.
Section 8 requirements.
"""

from __future__ import annotations

import concurrent.futures
import time
from typing import Any, Dict, List, Optional

from ml.detectors.anomaly.detector import AnomalyDetector
from ml.detectors.injection.adapter import InjectionDetectorAdapter
from ml.detectors.intent.detector import IntentConsistencyDetector
from ml.detectors.similarity.detector import SimilarityDetector
from ml.interfaces import Action, Decision, DetectorOutput, ToolCallEvent
from ml.risk.stacker import RiskStacker



class AgentShieldInferenceService:
    """
    Multi-detector parallel inference service with fault isolation and fallback.
    """

    _instance = None

    def __init__(self, timeout_ms: float = 300.0):
        self.timeout_s = timeout_ms / 1000.0
        self.injection_detector = InjectionDetectorAdapter()
        self.similarity_detector = SimilarityDetector()
        self.anomaly_detector = AnomalyDetector()
        self.intent_detector = IntentConsistencyDetector()
        self.stacker = RiskStacker()
        self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)

    @classmethod
    def get_instance(cls) -> AgentShieldInferenceService:
        if cls._instance is None:
            cls._instance = AgentShieldInferenceService()
        return cls._instance

    def score_event(self, event: ToolCallEvent) -> Decision:
        """
        Runs all detectors in parallel with timeout, applies risk stacker,
        and returns standardized Decision. Supports degraded mode on failure.
        """
        t0 = time.perf_counter()
        degraded = False
        detector_outputs: Dict[str, DetectorOutput] = {}
        errors: Dict[str, str] = {}

        # Define detector tasks
        tasks = {
            "injection": lambda: self.injection_detector.score(event),
            "similarity": lambda: self.similarity_detector.score(event),
            "anomaly": lambda: self.anomaly_detector.score(event),
            "intent": lambda: self.intent_detector.score(event),
        }

        # Dispatch parallel execution
        future_to_det = {self.executor.submit(fn): name for name, fn in tasks.items()}

        try:
            for future in concurrent.futures.as_completed(future_to_det, timeout=self.timeout_s):
                det_name = future_to_det[future]
                try:
                    out = future.result()
                    detector_outputs[det_name] = out
                except Exception as e:
                    degraded = True
                    errors[det_name] = str(e)
                    detector_outputs[det_name] = DetectorOutput(
                        detector=det_name, score=0.0, flagged=False, threshold=0.5,
                        evidence={"error": str(e)}, latency_ms=0.0
                    )
        except concurrent.futures.TimeoutError:
            degraded = True

        # Ensure all 4 detectors have outputs even if timed out
        for future, det_name in future_to_det.items():
            if det_name not in detector_outputs:
                degraded = True
                errors[det_name] = "Timeout exceeded"
                try:
                    future.cancel()
                except Exception:
                    pass
                detector_outputs[det_name] = DetectorOutput(
                    detector=det_name, score=0.0, flagged=False, threshold=0.5,
                    evidence={"error": "timeout"}, latency_ms=self.timeout_s * 1000.0
                )


        # Extract score map for stacker
        detector_scores = {name: out.score for name, out in detector_outputs.items()}

        # Stacker risk prediction
        stacker_result = self.stacker.predict(event, detector_scores)
        risk = stacker_result["risk"]
        raw_action = stacker_result["action"]

        # Map to shield_core Action enum
        action_map = {
            "allow": Action.ALLOW,
            "sanitize": Action.SANITIZE,
            "escalate": Action.ESCALATE,
            "block": Action.BLOCK,
            "kill_session": Action.KILL_SESSION,
        }
        decision_action = action_map.get(raw_action, Action.BLOCK)

        total_latency_ms = (time.perf_counter() - t0) * 1000.0

        # Construct explanation reason
        top_explanations = stacker_result.get("explanations", [])
        if stacker_result.get("hard_override"):
            reason = stacker_result.get("reason", "Hard override triggered")
        elif top_explanations:
            top_feat = top_explanations[0]
            reason = f"Elevated risk ({risk:.2f}) primarily driven by {top_feat['feature']} (contrib={top_feat['contribution']:+.2f})"
        else:
            reason = f"Evaluated event with calibrated risk {risk:.2f}"

        evidence_dict = {
            "detector_scores": detector_scores,
            "top_explanations": top_explanations,
            "hard_override": stacker_result.get("hard_override", False),
            "degraded_mode": degraded,
            "errors": errors,
            "detector_latencies": {k: v.latency_ms for k, v in detector_outputs.items()},
        }

        return Decision(
            action=decision_action,
            risk=risk,
            reason=reason,
            evidence=evidence_dict,
            session_id=event.session_id,
            step=event.step,
            latency_ms=round(total_latency_ms, 2),
        )


def score_event(event: ToolCallEvent) -> Decision:
    """Module-level entrypoint for scoring events."""
    service = AgentShieldInferenceService.get_instance()
    return service.score_event(event)
