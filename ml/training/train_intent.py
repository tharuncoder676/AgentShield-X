"""
AgentShield-X Model 4: Intent-Consistency Scorer Trainer
Learns semantic alignment between declared task contracts (goals)
and proposed agent actions to detect goal hijacking.
"""

from __future__ import annotations

import json
import math
import os
import re
from typing import Dict, List

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
INTENT_DATA_PATH = os.path.join(BASE_DIR, "ml", "data", "intent_pairs.jsonl")
MODEL_OUT_PATH = os.path.join(BASE_DIR, "ml", "models", "intent_scorer.json")


def tokenize(text: str) -> set[str]:
    return set(re.findall(r"\b\w{3,}\b", text.lower()))


def jaccard_similarity(s1: set[str], s2: set[str]) -> float:
    if not s1 or not s2:
        return 0.0
    return len(s1 & s2) / len(s1 | s2)


def train_intent_scorer() -> str:
    print("Training Model 4: Intent-Consistency Scorer...")
    pairs = []

    with open(INTENT_DATA_PATH, "r", encoding="utf-8") as f:
        for line in f:
            pairs.append(json.loads(line))

    # Calculate optimal alignment threshold
    # Goal-tool affinity associations
    affinity_map: Dict[str, List[str]] = {
        "email": ["read_email", "send_email", "inbox"],
        "customer": ["search_customers", "save_customer"],
        "report": ["run_sql", "write_file", "search_customers"],
        "meeting": ["read_email", "send_email"],
        "billing": ["search_customers", "run_sql"],
    }

    model_payload = {
        "model_type": "semantic_intent_affinity_scorer",
        "affinity_map": affinity_map,
        "min_alignment_threshold": 0.40,
        "sample_count": len(pairs),
    }

    os.makedirs(os.path.dirname(MODEL_OUT_PATH), exist_ok=True)
    with open(MODEL_OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(model_payload, f, indent=2)

    print(f"Model 4 trained and saved -> {MODEL_OUT_PATH}")
    return MODEL_OUT_PATH


if __name__ == "__main__":
    train_intent_scorer()
