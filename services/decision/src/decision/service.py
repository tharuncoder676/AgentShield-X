"""
AgentShield-X Decision Service Core
Orchestrates parallel security detectors (rules, pii, honey, injection, similarity, anomaly, intent),
executes calibrated risk stacking, and produces deterministic enforcement decisions.
"""

from __future__ import annotations

import asyncio
import os
import time
import uuid
from typing import List, Optional

from shield_core.models import (
    Decision,
    Reason,
    RiskBreakdown,
    ShieldAction,
    ToolCallEvent,
    ToolSensitivity,
)
from detectors_rules.engine import RulesDetector
from detectors_pii.engine import PIIDetector
from detectors_honey.engine import HoneyDetector
from detectors_injection.engine import InjectionDetector
from detectors_similarity.engine import SimilarityDetector
from detectors_anomaly.engine import AnomalyDetector
from detectors_intent.engine import IntentConsistencyScorer
from ml.training.train_stacker import CalibratedRiskStacker

STACKER_MODEL_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "models", "risk_stacker.pkl")
)


class DecisionService:
    """
    Evaluates ToolCallEvents through parallel detectors and deterministic risk policy.
    Designed for sub-50ms execution.
    """

    def __init__(
        self,
        rules_detector: Optional[RulesDetector] = None,
        pii_detector: Optional[PIIDetector] = None,
        honey_detector: Optional[HoneyDetector] = None,
        injection_detector: Optional[InjectionDetector] = None,
        similarity_detector: Optional[SimilarityDetector] = None,
        anomaly_detector: Optional[AnomalyDetector] = None,
        intent_scorer: Optional[IntentConsistencyScorer] = None,
        detector_timeout_s: float = 0.05,
    ) -> None:
        self.rules_detector = rules_detector or RulesDetector()
        self.pii_detector = pii_detector or PIIDetector()
        self.honey_detector = honey_detector or HoneyDetector()
        self.injection_detector = injection_detector or InjectionDetector()
        self.similarity_detector = similarity_detector or SimilarityDetector()
        self.anomaly_detector = anomaly_detector or AnomalyDetector()
        self.intent_scorer = intent_scorer or IntentConsistencyScorer()
        self.detector_timeout_s = detector_timeout_s

        # Load calibrated risk stacker
        if os.path.exists(STACKER_MODEL_PATH):
            try:
                self.risk_stacker: Optional[CalibratedRiskStacker] = CalibratedRiskStacker.load(STACKER_MODEL_PATH)
            except Exception:
                self.risk_stacker = None
        else:
            self.risk_stacker = None

    async def evaluate_event(self, event: ToolCallEvent) -> Decision:
        start_time = time.perf_counter()
        reasons: List[Reason] = []
        risk_breakdown = RiskBreakdown()
        degraded = False

        # Helper to run synchronous detector in executor with timeout
        async def run_detector(fn, name: str, *args) -> List[Reason]:
            nonlocal degraded
            try:
                loop = asyncio.get_running_loop()
                return await asyncio.wait_for(
                    loop.run_in_executor(None, fn, event, *args),
                    timeout=self.detector_timeout_s,
                )
            except asyncio.TimeoutError:
                degraded = True
                return [Reason(code=f"DETECTOR_TIMEOUT_{name.upper()}", evidence="Detector execution timed out", detector=name)]
            except Exception as e:
                degraded = True
                return [Reason(code=f"DETECTOR_ERROR_{name.upper()}", evidence=str(e), detector=name)]

        # Run all detectors concurrently
        results = await asyncio.gather(
            run_detector(self.honey_detector.evaluate, "honey"),
            run_detector(self.rules_detector.evaluate, "rules"),
            run_detector(self.pii_detector.evaluate, "pii"),
            run_detector(self.injection_detector.evaluate, "injection"),
            run_detector(self.similarity_detector.evaluate, "similarity"),
            run_detector(self.anomaly_detector.evaluate, "anomaly"),
            run_detector(self.intent_scorer.evaluate, "intent"),
        )

        honey_r, rules_r, pii_r, inj_r, sim_r, anom_r, intent_r = results
        for r_list in results:
            reasons.extend(r_list)

        # 1. Honeytool touches
        if any(r.detector == "honey" for r in honey_r):
            risk_breakdown.honey = 1.0

        # 2. Injection & rules
        for r in rules_r:
            if "INJECTION" in r.code or "CANARY" in r.code:
                risk_breakdown.injection = max(risk_breakdown.injection, 0.95)
            elif "EXFIL" in r.code:
                risk_breakdown.exfil = max(risk_breakdown.exfil, 0.90)
            elif "TAINT" in r.code:
                risk_breakdown.taint = max(risk_breakdown.taint, 0.85)
            elif "SHELL" in r.code:
                risk_breakdown.anomaly = max(risk_breakdown.anomaly, 0.90)

        # 3. PII & secrets
        for r in pii_r:
            if "AWS" in r.code or "KEY" in r.code or "TOKEN" in r.code or "ENTROPY" in r.code:
                risk_breakdown.exfil = max(risk_breakdown.exfil, 0.95)
            elif "SSN" in r.code or "CREDIT" in r.code:
                risk_breakdown.exfil = max(risk_breakdown.exfil, 0.85)

        # 4. ML Injection detector
        if inj_r:
            risk_breakdown.injection = max(risk_breakdown.injection, 0.90)

        # 5. Attack Similarity
        if sim_r:
            risk_breakdown.injection = max(risk_breakdown.injection, 0.85)

        # 6. Behavioral Anomaly
        if anom_r:
            risk_breakdown.anomaly = max(risk_breakdown.anomaly, 0.80)

        # 7. Intent Mismatch
        if intent_r:
            risk_breakdown.intent_mismatch = max(risk_breakdown.intent_mismatch, 0.75)

        # 8. Compute composite risk score via calibrated stacker if available
        features = [
            1.0 if rules_r else 0.0,
            1.0 if pii_r else 0.0,
            risk_breakdown.honey,
            risk_breakdown.injection,
            1.0 if sim_r else 0.0,
            risk_breakdown.anomaly,
            risk_breakdown.intent_mismatch,
        ]

        if self.risk_stacker is not None:
            composite_risk = self.risk_stacker.predict_risk(features)
        else:
            composite_risk = max(
                risk_breakdown.injection,
                risk_breakdown.anomaly,
                risk_breakdown.intent_mismatch,
                risk_breakdown.exfil,
                risk_breakdown.taint,
                risk_breakdown.honey,
            )

        # Deterministic action mapping
        action = ShieldAction.ALLOW
        if risk_breakdown.honey >= 0.9:
            action = ShieldAction.KILL_SESSION
        elif composite_risk >= 0.70:
            action = ShieldAction.BLOCK
        elif composite_risk >= 0.40:
            action = ShieldAction.ESCALATE

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return Decision(
            decision_id=str(uuid.uuid4()),
            event_id=event.event_id,
            action=action,
            risk=round(composite_risk, 3),
            risk_breakdown=risk_breakdown,
            reasons=reasons,
            sanitized_payload=None,
            policy_version="1.0.0",
            model_versions={
                "rules": "1.0",
                "pii": "1.0",
                "honey": "1.0",
                "injection_classifier": "deberta-v3-onnx-1.0",
                "similarity_index": "minilm-qdrant-1.0",
                "anomaly_model": "markov-iso-1.0",
                "intent_scorer": "affinity-1.0",
                "risk_stacker": "calibrated-ensemble-1.0",
            },
            prompt_versions={},
            degraded=degraded,
            latency_ms=round(elapsed_ms, 2),
        )
