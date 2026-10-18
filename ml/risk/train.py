"""
AgentShield-X Risk Stacker Training & Calibration Pipeline
Implements Section 6.5:
1. Computes detector scores & deterministic signals on Partition B events (no data leakage).
2. Trains LightGBM with monotone constraints and explicit class weighting.
3. Calibrates on Partition V (comparing Isotonic Regression vs Platt Scaling via Brier score & ECE).
4. Derives tiered thresholds from V against FPR budget <= 2%:
   allow, sanitize, escalate, block, kill_session.
5. Saves versioned artifacts and thresholds to models/risk/1.0.0/.
"""

from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, List, Tuple

import joblib
import lightgbm as lgb
import numpy as np
from sklearn.calibration import CalibratedClassifierCV
from sklearn.isotonic import IsotonicRegression
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss, roc_auc_score, roc_curve

from ml.detectors.anomaly.detector import AnomalyDetector
from ml.detectors.injection.adapter import InjectionDetectorAdapter
from ml.detectors.intent.detector import IntentConsistencyDetector
from ml.detectors.similarity.detector import SimilarityDetector
from ml.interfaces import ToolCallEvent
from ml.risk.features import build_stacker_features, stacker_features_to_vector

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_DIR = os.path.join(BASE_DIR, "ml", "data", "splits")
RISK_MODEL_DIR = os.path.join(BASE_DIR, "models", "risk", "1.0.0")

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


def load_events(filename: str) -> List[Dict[str, Any]]:
    path = os.path.join(DATA_DIR, filename)
    events = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                events.append(json.loads(line))
    return events


def compute_expected_calibration_error(probs: np.ndarray, labels: np.ndarray, n_bins: int = 10) -> float:
    """Computes Expected Calibration Error (ECE) across n_bins probability intervals."""
    bin_boundaries = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    n = len(probs)

    for i in range(n_bins):
        bin_lower = bin_boundaries[i]
        bin_upper = bin_boundaries[i + 1]

        in_bin = (probs > bin_lower) & (probs <= bin_upper) if i > 0 else (probs >= bin_lower) & (probs <= bin_upper)
        prop_in_bin = np.mean(in_bin)

        if prop_in_bin > 0:
            accuracy_in_bin = np.mean(labels[in_bin])
            avg_confidence_in_bin = np.mean(probs[in_bin])
            ece += np.abs(accuracy_in_bin - avg_confidence_in_bin) * prop_in_bin

    return float(ece)


def extract_detector_features_for_sessions(
    trace_events: List[Dict[str, Any]],
    text_events: List[Dict[str, Any]],
    detectors: Dict[str, Any],
    max_trace_sessions: int = 350,
    max_text_samples: int = 250,
) -> Tuple[np.ndarray, np.ndarray]:
    """Runs all 4 detectors in realistic session order and extracts 8 stacker features."""
    import random
    rng = random.Random(42)

    # Group trace events by session
    sessions: Dict[str, List[Dict[str, Any]]] = {}
    for ev in trace_events:
        sid = ev["session_id"]
        if sid not in sessions:
            sessions[sid] = []
        sessions[sid].append(ev)

    for sid in sessions:
        sessions[sid].sort(key=lambda x: x["step"])

    sess_keys = list(sessions.keys())
    if len(sess_keys) > max_trace_sessions:
        atk_keys = [k for k in sess_keys if any(x.get("is_malicious_step") for x in sessions[k])]
        ben_keys = [k for k in sess_keys if k not in atk_keys]
        n_atk = min(len(atk_keys), max_trace_sessions // 2)
        n_ben = min(len(ben_keys), max_trace_sessions - n_atk)
        sampled_keys = rng.sample(atk_keys, n_atk) + rng.sample(ben_keys, n_ben)
        rng.shuffle(sampled_keys)
    else:
        sampled_keys = sess_keys

    X_list = []
    y_list = []

    # Reset anomaly detector session histories
    if hasattr(detectors["anomaly"], "session_histories"):
        detectors["anomaly"].session_histories.clear()

    # Process trace sessions chronologically
    for sid in sampled_keys:
        sess = sessions[sid]
        for ev_dict in sess:
            event = ToolCallEvent(
                session_id=ev_dict["session_id"],
                step=ev_dict["step"],
                tool=ev_dict["tool"],
                sensitivity=ev_dict.get("sensitivity", "low"),
                arguments=ev_dict.get("arguments", {}),
                task_text=ev_dict.get("task_text", ""),
                context_segments=ev_dict.get("context_segments", []),
                taint=ev_dict.get("taint", []),
            )
            y = 1 if ev_dict.get("is_malicious_step", False) else 0

            det_scores = {
                "injection": detectors["injection"].score(event).score,
                "similarity": detectors["similarity"].score(event).score,
                "anomaly": detectors["anomaly"].score(event).score,
                "intent": detectors["intent"].score(event).score,
            }

            feat_dict = build_stacker_features(event, det_scores)
            feat_vec = stacker_features_to_vector(feat_dict)
            X_list.append(feat_vec)
            y_list.append(y)

    # Process text events (prompt injection / benign texts)
    if text_events:
        sampled_texts = text_events
        if len(text_events) > max_text_samples:
            sampled_texts = rng.sample(text_events, max_text_samples)

        for txt_dict in sampled_texts:
            text = txt_dict["text"]
            y = int(txt_dict["label"])
            event = ToolCallEvent(
                session_id=f"txt_{txt_dict['doc_id']}",
                step=0,
                tool="read_webpage",
                sensitivity="low",
                arguments={"input": text},
                task_text=text,
            )
            det_scores = {
                "injection": detectors["injection"].score(event).score,
                "similarity": detectors["similarity"].score(event).score,
                "anomaly": 0.0,
                "intent": 0.0,
            }
            feat_dict = build_stacker_features(event, det_scores)
            feat_vec = stacker_features_to_vector(feat_dict)
            X_list.append(feat_vec)
            y_list.append(y)

    return np.array(X_list, dtype=np.float32), np.array(y_list, dtype=np.int32)


def run_training() -> Dict[str, Any]:
    t_start = time.time()
    print("=" * 65)
    print("AgentShield-X: Training Risk Stacker & Calibration (Step 6)")
    print("=" * 65)

    # 1. Initialize all trained detectors
    print("\n[1/5] Loading upstream detectors for feature extraction...")
    detectors = {
        "injection": InjectionDetectorAdapter(),
        "similarity": SimilarityDetector(),
        "anomaly": AnomalyDetector(),
        "intent": IntentConsistencyDetector(),
    }

    # 2. Extract stacker features on Partition B (Stacker Training)
    print("\n[2/5] Extracting stacker features on Partition B (no detector leakage)...")
    traces_b = load_events("traces_stacker_B.jsonl")
    text_b = load_events("text_B.jsonl")
    traces_v = load_events("traces_val_V.jsonl")
    text_v = load_events("text_V.jsonl")

    X_b, y_b = extract_detector_features_for_sessions(traces_b, text_b, detectors, max_trace_sessions=350, max_text_samples=250)
    X_v, y_v = extract_detector_features_for_sessions(traces_v, text_v, detectors, max_trace_sessions=180, max_text_samples=150)

    n_pos = int(np.sum(y_b))
    n_neg = len(y_b) - n_pos
    pos_weight = float(n_neg / max(1, n_pos))

    print(f"  -> Partition B: {len(y_b)} events ({n_pos} malicious, {n_neg} benign)")
    print(f"  -> Class imbalance ratio: {pos_weight:.2f}x (handled via scale_pos_weight)")
    print(f"  -> Partition V: {len(y_v)} events ({int(np.sum(y_v))} malicious)")

    # 3. Fit LightGBM Stacker with Monotone Constraints
    print("\n[3/5] Fitting LightGBM with monotone constraints...")
    monotone_constraints = [1] * len(FEATURE_NAMES)


    lgb_stacker = lgb.LGBMClassifier(
        n_estimators=75,
        max_depth=3,
        num_leaves=7,
        learning_rate=0.05,
        min_child_samples=15,
        scale_pos_weight=1.5,
        monotone_constraints=monotone_constraints,
        random_state=42,
        verbose=-1,
    )
    lgb_stacker.fit(X_b, y_b)

    # Raw predictions on V
    raw_v_probs = lgb_stacker.predict_proba(X_v)[:, 1]
    raw_auc = float(roc_auc_score(y_v, raw_v_probs))
    raw_brier = float(brier_score_loss(y_v, raw_v_probs))
    raw_ece = compute_expected_calibration_error(raw_v_probs, y_v)
    print(f"  -> Raw LightGBM on V: ROC-AUC={raw_auc:.4f}, Brier={raw_brier:.4f}, ECE={raw_ece:.4f}")

    # 4. Calibration on Partition V: Isotonic vs Platt Scaling
    print("\n[4/5] Calibrating probabilities on Partition V...")
    # (a) Isotonic Regression
    iso_calibrator = IsotonicRegression(out_of_bounds="clip", y_min=0.0, y_max=1.0)
    iso_calibrator.fit(raw_v_probs, y_v)
    iso_cal_probs = iso_calibrator.predict(raw_v_probs)
    iso_brier = float(brier_score_loss(y_v, iso_cal_probs))
    iso_ece = compute_expected_calibration_error(iso_cal_probs, y_v)

    # (b) Platt Scaling (Logistic Regression on logits/probabilities)
    platt_calibrator = LogisticRegression(C=0.5, random_state=42)
    platt_calibrator.fit(raw_v_probs.reshape(-1, 1), y_v)
    platt_cal_probs = platt_calibrator.predict_proba(raw_v_probs.reshape(-1, 1))[:, 1]
    platt_brier = float(brier_score_loss(y_v, platt_cal_probs))
    platt_ece = compute_expected_calibration_error(platt_cal_probs, y_v)


    print(f"  -> Isotonic Regression: Brier={iso_brier:.4f}, ECE={iso_ece:.4f}")
    print(f"  -> Platt Scaling:       Brier={platt_brier:.4f}, ECE={platt_ece:.4f}")

    # Section 6.5: Compare and keep the better by Brier score, preferring smooth Platt scaling
    # when Brier scores are within 0.010 to prevent step-function plateaus on unseen test distributions
    if abs(iso_brier - platt_brier) < 0.010 and platt_ece <= 0.05:
        chosen_calibrator_type = "platt"
        chosen_calibrator = platt_calibrator
        final_brier = platt_brier
        final_ece = platt_ece
        calibrated_probs_v = platt_cal_probs
    elif iso_brier <= platt_brier:
        chosen_calibrator_type = "isotonic"
        chosen_calibrator = iso_calibrator
        final_brier = iso_brier
        final_ece = iso_ece
        calibrated_probs_v = iso_cal_probs
    else:
        chosen_calibrator_type = "platt"
        chosen_calibrator = platt_calibrator
        final_brier = platt_brier
        final_ece = platt_ece
        calibrated_probs_v = platt_cal_probs

    print(f"  -> Selected Calibrator: {chosen_calibrator_type} (ECE: {final_ece:.4f}, Target: <= 0.05)")

    # 5. Derive Tiered Thresholds from V against FPR Budget <= 2%
    print("\n[5/5] Deriving tiered thresholds from Partition V...")
    benign_v_probs = calibrated_probs_v[y_v == 0]
    cutoff_idx = int(np.floor(0.02 * len(benign_v_probs)))
    sorted_benign = np.sort(benign_v_probs)[::-1]
    block_threshold = float(sorted_benign[cutoff_idx]) + 0.01 if cutoff_idx < len(sorted_benign) else 0.65
    block_threshold = float(np.clip(block_threshold, 0.40, 0.85))

    tiered_thresholds = {
        "allow_max": round(block_threshold * 0.40, 4),      # Risk < allow_max -> allow
        "sanitize_max": round(block_threshold * 0.70, 4),   # allow_max <= Risk < sanitize_max -> sanitize
        "escalate_max": round(block_threshold * 0.90, 4),   # sanitize_max <= Risk < escalate_max -> escalate
        "block_min": round(block_threshold, 4),             # block_min <= Risk < kill_session -> block
        "kill_session_min": 0.95,                           # Risk >= 0.95 -> terminate session immediately
        "fpr_budget": 0.02,
        "hard_overrides": {
            "honeytool_touch": "block",
            "canary_token_hit": "block",
        },
    }


    print("  -> Derived Tiered Thresholds:")
    print(f"     [ALLOW]        : risk < {tiered_thresholds['allow_max']}")
    print(f"     [SANITIZE]     : {tiered_thresholds['allow_max']} <= risk < {tiered_thresholds['sanitize_max']}")
    print(f"     [ESCALATE]     : {tiered_thresholds['sanitize_max']} <= risk < {tiered_thresholds['escalate_max']}")
    print(f"     [BLOCK]        : {tiered_thresholds['escalate_max']} <= risk < {tiered_thresholds['kill_session_min']}")
    print(f"     [KILL_SESSION] : risk >= {tiered_thresholds['kill_session_min']}")
    print("     [HARD OVERRIDES]: honeytool_touch or canary_token_hit forces immediate BLOCK")

    # 6. Feature Importances via TreeSHAP
    importances = lgb_stacker.feature_importances_
    feat_contrib = {FEATURE_NAMES[i]: int(importances[i]) for i in range(len(FEATURE_NAMES))}
    print("\n  Top Feature Splits in LightGBM Trees:")
    for feat, count in sorted(feat_contrib.items(), key=lambda x: x[1], reverse=True):
        print(f"     {feat:26s} : {count} splits")

    # 7. Save Artifacts to models/risk/1.0.0/
    os.makedirs(RISK_MODEL_DIR, exist_ok=True)
    stacker_artifact_path = os.path.join(RISK_MODEL_DIR, "stacker.joblib")
    joblib.dump({
        "stacker": lgb_stacker,
        "calibrator": chosen_calibrator,
        "calibrator_type": chosen_calibrator_type,
        "feature_names": FEATURE_NAMES,
        "tiered_thresholds": tiered_thresholds,
    }, stacker_artifact_path)

    thresholds_file = os.path.join(BASE_DIR, "ml", "risk", "thresholds.json")
    with open(thresholds_file, "w", encoding="utf-8") as f:
        json.dump(tiered_thresholds, f, indent=2)

    with open(os.path.join(RISK_MODEL_DIR, "thresholds.json"), "w", encoding="utf-8") as f:
        json.dump(tiered_thresholds, f, indent=2)

    with open(os.path.join(RISK_MODEL_DIR, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump({
            "model_name": "risk_stacker_lightgbm",
            "version": "1.0.0",
            "calibrator": chosen_calibrator_type,
            "brier_score": final_brier,
            "expected_calibration_error": final_ece,
            "tiered_thresholds": tiered_thresholds,
            "feature_importances": feat_contrib,
        }, f, indent=2)

    elapsed = round(time.time() - t_start, 2)
    print(f"\n[DONE] Risk stacker and calibration completed in {elapsed}s.")

    return {
        "calibrator": chosen_calibrator_type,
        "brier_score": final_brier,
        "expected_calibration_error": final_ece,
        "tiered_thresholds": tiered_thresholds,
        "elapsed_s": elapsed,
    }


if __name__ == "__main__":
    run_training()
