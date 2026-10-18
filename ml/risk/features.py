"""
AgentShield-X Risk Stacker Feature Builder
Computes multi-model detector scores and deterministic security signals:
1. injection_score
2. similarity_score
3. anomaly_score
4. intent_score
5. pii_secret_hit
6. taint_to_sensitive_sink
7. honeytool_touch
8. canary_token_hit
Section 6.5 requirements.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

from ml.interfaces import ToolCallEvent

# PII and Secret Regexes
SECRET_REGEXES = [
    re.compile(r"(?i)(bearer\s+[a-z0-9_\-\.]{15,}|api[_\-\s]?key\s*[:=]\s*['\"][a-z0-9_\-]{15,}['\"])"),
    re.compile(r"(?i)(password\s*[:=]\s*['\"][^'\"]{6,}['\"])"),
    re.compile(r"\b4[0-9]{12}(?:[0-9]{3})?\b"),  # Visa credit card
    re.compile(r"\b5[1-5][0-9]{14}\b"),         # Mastercard
    re.compile(r"\b[0-9]{3}-[0-9]{2}-[0-9]{4}\b"),  # SSN
    re.compile(r"NX-FAKE-KEY-[A-Za-z0-9]{8,}"),     # Demo canary / secret token
]


def check_pii_or_secrets(text: str) -> float:
    """Returns 1.0 if PII or credentials pattern is detected."""
    for pattern in SECRET_REGEXES:
        if pattern.search(text):
            return 1.0
    return 0.0


def check_canary_hit(arguments: Dict[str, Any], context_segments: List[Dict[str, Any]]) -> float:
    """Returns 1.0 if known canary token sequence appears."""
    args_str = str(arguments)
    if "CANARY_" in args_str or "NX-CANARY" in args_str or "canary_token" in args_str:
        return 1.0
    for seg in context_segments:
        if "CANARY_" in seg.get("text", ""):
            return 1.0
    return 0.0


def build_stacker_features(
    event: ToolCallEvent,
    detector_scores: Dict[str, float],
) -> Dict[str, float]:
    """
    Constructs the 8 stacker feature dictionary:
    4 detector scores + 4 deterministic policy signals.
    """
    args_str = str(event.arguments)
    task_and_args = event.task_text + " " + args_str

    # 1-4. Detector scores
    s_inj = detector_scores.get("injection", 0.0)
    s_sim = detector_scores.get("similarity", 0.0)
    s_anom = detector_scores.get("anomaly", 0.0)
    s_intent = detector_scores.get("intent", 0.0)

    # 5. PII / Secret regex hit
    pii_hit = check_pii_or_secrets(task_and_args)

    # 6. Taint to sensitive sink
    is_sensitive = event.sensitivity in ("high", "critical") or event.tool in ("send_email", "run_sql", "export_all_customers")
    has_taint = len(event.taint) > 0
    taint_to_sink = 1.0 if (is_sensitive and has_taint) else 0.0

    # 7. Honeytool touch
    honey_hit = 1.0 if event.tool == "export_all_customers" else 0.0

    # 8. Canary token hit
    canary_hit = check_canary_hit(event.arguments, event.context_segments)

    return {
        "injection_score": float(s_inj),
        "similarity_score": float(s_sim),
        "anomaly_score": float(s_anom),
        "intent_score": float(s_intent),
        "pii_secret_hit": float(pii_hit),
        "taint_to_sensitive_sink": float(taint_to_sink),
        "honeytool_touch": float(honey_hit),
        "canary_token_hit": float(canary_hit),
    }


FEATURE_NAMES = [
    "injection_score",
    "similarity_score",
    "anomaly_score",
    "intent_score",
    "pii_secret_hit",
    "taint_to_sensitive_sink",
    "honeytool_touch",
    "canary_token_hit",
]


def stacker_features_to_vector(feat_dict: Dict[str, float]) -> List[float]:
    """Flattens stacker features to ordered list for LightGBM."""
    return [feat_dict.get(k, 0.0) for k in FEATURE_NAMES]

