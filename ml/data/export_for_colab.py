"""
AgentShield-X: Export Local Synthetic Data for Kaggle/Colab Training
Converts local synthetic injection and near-miss datasets into a standalone CSV/JSON
that can be uploaded or directly bundled into the Colab/Kaggle notebook.
"""

from __future__ import annotations

import csv
import json
import os

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
TRAIN_JSONL = os.path.join(BASE_DIR, "ml", "data", "injections_train.jsonl")
TEST_JSONL = os.path.join(BASE_DIR, "ml", "data", "injections_test_held_out.jsonl")
OUT_CSV = os.path.join(BASE_DIR, "ml", "data", "agentshield_synthetic_corpus.csv")


def export_corpus() -> str:
    rows = []
    if os.path.exists(TRAIN_JSONL):
        with open(TRAIN_JSONL, "r", encoding="utf-8") as f:
            for line in f:
                rec = json.loads(line)
                rows.append({
                    "text": rec["text"],
                    "label": int(rec["label"]),
                    "source": "agentshield_synthetic",
                    "family": rec.get("family", "train_generic"),
                    "split_hint": "train",
                })

    if os.path.exists(TEST_JSONL):
        with open(TEST_JSONL, "r", encoding="utf-8") as f:
            for line in f:
                rec = json.loads(line)
                rows.append({
                    "text": rec["text"],
                    "label": int(rec["label"]),
                    "source": "agentshield_synthetic",
                    "family": rec.get("family", "held_out"),
                    "split_hint": "test",
                })

    with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["text", "label", "source", "family", "split_hint"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"Exported {len(rows)} rows to {OUT_CSV}")
    return OUT_CSV


if __name__ == "__main__":
    export_corpus()
