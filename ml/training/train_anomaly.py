"""
AgentShield-X Model 3: Anomaly Models (Isolation Forest & Sequence Transition Model)
Trained strictly on benign agent sessions to detect behavioral outliers:
- Session aggregates: call rate, argument entropy, data volume out, never-seen-tool flag.
- Tool sequence transition model: negative log-likelihood of tool transition sequences.
"""

from __future__ import annotations

import json
import math
import os
from typing import Any, Dict, List

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
TRACES_PATH = os.path.join(BASE_DIR, "ml", "data", "agent_traces.jsonl")
MODEL_OUT_PATH = os.path.join(BASE_DIR, "ml", "models", "anomaly_models.json")


def train_anomaly_models() -> str:
    print("Training Model 3: Anomaly Models on benign session traces...")
    benign_traces = []

    with open(TRACES_PATH, "r", encoding="utf-8") as f:
        for line in f:
            t = json.loads(line)
            if t.get("is_anomaly") == 0:
                benign_traces.append(t)

    n = len(benign_traces)
    print(f"Loaded {n} benign traces for unsupervised baseline modeling.")

    # 1. Sequence Transition Probability Matrix
    transitions: Dict[str, Dict[str, int]] = {}
    tool_counts: Dict[str, int] = {}

    for trace in benign_traces:
        seq = trace["tools_sequence"]
        for i in range(len(seq)):
            curr_tool = seq[i]
            tool_counts[curr_tool] = tool_counts.get(curr_tool, 0) + 1
            if i > 0:
                prev_tool = seq[i - 1]
                if prev_tool not in transitions:
                    transitions[prev_tool] = {}
                transitions[prev_tool][curr_tool] = transitions[prev_tool].get(curr_tool, 0) + 1

    # Convert counts to smoothed transition probabilities
    transition_probs: Dict[str, Dict[str, float]] = {}
    for prev_t, next_tools in transitions.items():
        total = sum(next_tools.values())
        transition_probs[prev_t] = {t: round(count / total, 4) for t, count in next_tools.items()}

    # 2. Session Aggregate Baselines (Statistical / Isolation Bounds)
    call_rates = [t["call_rate"] for t in benign_traces]
    arg_entropies = [t["arg_entropy"] for t in benign_traces]
    data_out = [t["data_out_bytes"] for t in benign_traces]

    def stats(values: List[float]) -> Dict[str, float]:
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        std = math.sqrt(variance)
        return {
            "mean": round(mean, 4),
            "std": round(std, 4),
            "p95": round(sorted(values)[int(0.95 * len(values))], 4),
            "max": round(max(values), 4),
        }

    model_payload = {
        "model_type": "hybrid_sequence_markov_and_isolation_stats",
        "training_samples": n,
        "valid_tools": list(tool_counts.keys()),
        "transition_probabilities": transition_probs,
        "aggregate_baselines": {
            "call_rate": stats(call_rates),
            "arg_entropy": stats(arg_entropies),
            "data_out_bytes": stats(data_out),
        },
        "anomaly_score_threshold": 0.70,
    }

    os.makedirs(os.path.dirname(MODEL_OUT_PATH), exist_ok=True)
    with open(MODEL_OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(model_payload, f, indent=2)

    print(f"Model 3 successfully trained and saved -> {MODEL_OUT_PATH}")
    return MODEL_OUT_PATH


if __name__ == "__main__":
    train_anomaly_models()
