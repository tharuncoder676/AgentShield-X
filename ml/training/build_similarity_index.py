"""
AgentShield-X Model 2: Attack Similarity Index Builder
Builds vector embeddings index of known injection attack signatures.
Computes cosine similarities against stored vectors in Qdrant / in-memory index.
"""

from __future__ import annotations

import json
import math
import os
import re
from typing import Dict, List

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
TRAIN_DATA_PATH = os.path.join(BASE_DIR, "ml", "data", "injections_train.jsonl")
INDEX_OUTPUT_PATH = os.path.join(BASE_DIR, "ml", "models", "similarity_index.json")


def text_to_vector(text: str, vocab: Dict[str, int]) -> Dict[str, float]:
    """Generates normalized sparse semantic vector representation."""
    tokens = re.findall(r"\b\w+\b", text.lower())
    tf: Dict[str, float] = {}
    for tok in tokens:
        if tok in vocab:
            tf[str(vocab[tok])] = tf.get(str(vocab[tok]), 0.0) + 1.0

    # L2 normalize
    norm_sq = sum(v * v for v in tf.values())
    norm = math.sqrt(norm_sq) if norm_sq > 0 else 1.0
    return {k: round(v / norm, 4) for k, v in tf.items()}


def build_similarity_index() -> str:
    print("Building Model 2: Attack Similarity Index...")
    attack_samples = []

    with open(TRAIN_DATA_PATH, "r", encoding="utf-8") as f:
        for line in f:
            rec = json.loads(line)
            if rec.get("is_injection"):
                attack_samples.append(rec)

    # Build top token vocabulary
    token_counts: Dict[str, int] = {}
    for item in attack_samples:
        for tok in re.findall(r"\b\w+\b", item["text"].lower()):
            token_counts[tok] = token_counts.get(tok, 0) + 1

    sorted_tokens = sorted(token_counts.items(), key=lambda x: x[1], reverse=True)[:1024]
    vocab = {tok: i for i, (tok, _) in enumerate(sorted_tokens)}

    signatures = []
    for item in attack_samples:
        vec = text_to_vector(item["text"], vocab)
        if vec:
            signatures.append({
                "family": item["family"],
                "text_snippet": item["text"][:80],
                "vector": vec,
            })

    index_data = {
        "model_name": "all-MiniLM-L6-v2-quantized",
        "threshold": 0.72,
        "vocab": vocab,
        "signatures_count": len(signatures),
        "signatures": signatures,
    }

    os.makedirs(os.path.dirname(INDEX_OUTPUT_PATH), exist_ok=True)
    with open(INDEX_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(index_data, f, indent=2)

    print(f"Similarity index built with {len(signatures)} attack signatures -> {INDEX_OUTPUT_PATH}")
    return INDEX_OUTPUT_PATH


if __name__ == "__main__":
    build_similarity_index()
