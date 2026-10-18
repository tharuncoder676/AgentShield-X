"""
AgentShield-X Master ML Pipeline Runner
Executes training for all five models in strict dependency order:
1. Injection classifier (DeBERTa / Calibrated n-gram)
2. Similarity index (MiniLM + vector index)
3. Anomaly models (Isolation Forest & sequence Markov)
4. Intent-consistency scorer
5. Risk stacker (with isotonic calibration)
"""

from __future__ import annotations

import sys
import os

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
for p in [
    os.path.join(BASE_DIR, "packages", "shield_core", "src"),
    os.path.join(BASE_DIR, "detectors", "rules", "src"),
    os.path.join(BASE_DIR, "detectors", "pii", "src"),
    os.path.join(BASE_DIR, "detectors", "honey", "src"),
    BASE_DIR,
]:
    if p not in sys.path:
        sys.path.insert(0, p)

from ml.data.synthetic_generator import generate_injection_datasets, generate_agent_traces, generate_intent_pairs
from ml.training.train_injection import train_model as train_injection_model
from ml.training.build_similarity_index import build_similarity_index
from ml.training.train_anomaly import train_anomaly_models
from ml.training.train_intent import train_intent_scorer
from ml.training.train_stacker import train_risk_stacker


def run_all_training():
    print("=" * 70)
    print("  AgentShield-X: Phase 2 ML Training Pipeline")
    print("=" * 70)

    print("\n>>> STEP 0: Generating Datasets...")
    generate_injection_datasets()
    generate_agent_traces(2000)
    generate_intent_pairs()

    print("\n>>> STEP 1: Model 1 - Injection Classifier (Supervised Deep Learning / N-gram)...")
    m1_path = train_injection_model()

    print("\n>>> STEP 2: Model 2 - Similarity Index (MiniLM + Signature Vectors)...")
    m2_path = build_similarity_index()

    print("\n>>> STEP 3: Model 3 - Anomaly Models (Sequence Transition & Isolation Forest)...")
    m3_path = train_anomaly_models()

    print("\n>>> STEP 4: Model 4 - Intent-Consistency Scorer...")
    m4_path = train_intent_scorer()

    print("\n>>> STEP 5: Model 5 - Risk Stacker (LightGBM / Calibrated Ensemble)...")
    m5_path = train_risk_stacker()

    print("\n" + "=" * 70)
    print("  ALL 5 MODELS TRAINED SUCCESSFULLY IN STRICT DEPENDENCY ORDER")
    print("=" * 70)
    return True


if __name__ == "__main__":
    success = run_all_training()
    sys.exit(0 if success else 1)
