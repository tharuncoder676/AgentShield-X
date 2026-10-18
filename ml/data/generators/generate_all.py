"""
AgentShield-X Master Data Generation & Partitioning Pipeline
Entrypoint for `make data` (`python ml/make.py data`).
Generates all synthetic datasets, applies strict split protocol,
exports review_sample.csv, computes SHA-256 hashes, and writes DATA_CARD.md.
"""

from __future__ import annotations

import csv
import datetime
import hashlib
import json
import os
import random
import time
from typing import Any, Dict, List

from ml.data.generators.text_generator import (
    ATTACK_FAMILIES,
    HELD_OUT_TEXT_FAMILIES,
    generate_attack_texts,
    generate_benign_texts,
)
from ml.data.generators.trace_simulator import (
    ATTACK_SESSION_FAMILIES,
    BENIGN_TASK_TEMPLATES,
    HELD_OUT_BENIGN_TEMPLATES,
    HELD_OUT_TRACE_FAMILIES,
    generate_trace_dataset,
)
from ml.data.generators.pair_generator import generate_task_action_pairs
from ml.data.splits import (
    compute_file_sha256,
    partition_pairs,
    partition_text_data,
    partition_trace_data,
    write_jsonl,
)

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
DATA_DIR = os.path.join(BASE_DIR, "ml", "data")
SPLITS_DIR = os.path.join(DATA_DIR, "splits")


def run_pipeline(seed: int = 42) -> Dict[str, Any]:
    """Executes end-to-end data generation, splitting, and documentation."""
    t0 = time.time()
    print("=" * 60)
    print("AgentShield-X: Starting Synthetic Data Generation Pipeline")
    print(f"Random seed: {seed}")
    print("=" * 60)

    # 1. Text Data Generation
    print("\n[1/4] Generating synthetic text data...")
    attacks = generate_attack_texts(seed=seed, samples_per_family=70)  # 12 * 70 = 840 attacks
    benign = generate_benign_texts(seed=seed, total_benign=2520, near_miss_ratio=0.25)  # 3x attacks, >= 20% near miss
    all_texts = attacks + benign
    print(f"  -> Generated {len(attacks)} attacks across {len(ATTACK_FAMILIES)} families")
    print(f"  -> Generated {len(benign)} benign texts ({sum(1 for b in benign if b['is_near_miss'])} near-misses)")
    print(f"  -> Total texts: {len(all_texts)}")

    # 2. Agent Trace Data Generation
    print("\n[2/4] Simulating agent multi-turn traces...")
    benign_sessions, attack_sessions = generate_trace_dataset(
        seed=seed,
        benign_count=5000,
        attack_per_family=100,  # 8 * 100 = 800 attack sessions
    )
    total_trace_sessions = len(benign_sessions) + len(attack_sessions)
    total_trace_events = sum(len(s) for s in benign_sessions) + sum(len(s) for s in attack_sessions)
    print(f"  -> Simulated {len(benign_sessions)} benign sessions across {len(BENIGN_TASK_TEMPLATES)} templates")
    print(f"  -> Simulated {len(attack_sessions)} attack sessions across {len(ATTACK_SESSION_FAMILIES)} families")
    print(f"  -> Total sessions: {total_trace_sessions}, Total step events: {total_trace_events}")

    # 3. Task/Action Pairs Generation
    print("\n[3/4] Extracting paraphrased task/action pairs for intent scorer...")
    pairs = generate_task_action_pairs(benign_sessions, attack_sessions, seed=seed)
    pos_pairs = sum(1 for p in pairs if p["consistent"] == 1)
    neg_pairs = sum(1 for p in pairs if p["consistent"] == 0)
    print(f"  -> Generated {len(pairs)} pairs (Consistent={pos_pairs}, Hijacked={neg_pairs})")

    # 4. Strict Disjoint Partitioning
    print("\n[4/4] Partitioning datasets according to Section 5.4 protocol...")
    text_splits = partition_text_data(all_texts, seed=seed)
    trace_splits = partition_trace_data(benign_sessions, attack_sessions, seed=seed)
    pair_splits = partition_pairs(pairs, trace_splits)

    os.makedirs(SPLITS_DIR, exist_ok=True)

    # Write text splits
    write_jsonl(text_splits["train_A"], os.path.join(SPLITS_DIR, "text_A.jsonl"))
    write_jsonl(text_splits["stacker_B"], os.path.join(SPLITS_DIR, "text_B.jsonl"))
    write_jsonl(text_splits["val_V"], os.path.join(SPLITS_DIR, "text_V.jsonl"))
    write_jsonl(text_splits["test"], os.path.join(SPLITS_DIR, "text_test.jsonl"))

    # Flatten trace sessions to events for downstream detector consumption
    for part in ["train_A", "stacker_B", "val_V", "test"]:
        sessions = trace_splits[part]
        events = [ev for sess in sessions for ev in sess]
        write_jsonl(events, os.path.join(SPLITS_DIR, f"traces_{part}.jsonl"))

    # Write pair splits
    for part in ["train_A", "stacker_B", "val_V", "test"]:
        write_jsonl(pair_splits[part], os.path.join(SPLITS_DIR, f"pairs_{part}.jsonl"))

    # Export review_sample.csv (100 random rows per class)
    review_path = os.path.join(DATA_DIR, "review_sample.csv")
    rng = random.Random(seed)
    sample_attacks = rng.sample(attacks, min(100, len(attacks)))
    sample_benign = rng.sample(benign, min(100, len(benign)))
    review_rows = sample_attacks + sample_benign
    rng.shuffle(review_rows)

    with open(review_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["doc_id", "label", "attack_family", "is_near_miss", "text"])
        writer.writeheader()
        for r in review_rows:
            writer.writerow({
                "doc_id": r["doc_id"],
                "label": r["label"],
                "attack_family": r["attack_family"],
                "is_near_miss": r["is_near_miss"],
                "text": r["text"],
            })
    print(f"  -> Exported 200 review samples to {review_path}")

    # Compute SHA-256 hashes of generated artifacts
    hashes = {}
    for filename in sorted(os.listdir(SPLITS_DIR)):
        fpath = os.path.join(SPLITS_DIR, filename)
        if os.path.isfile(fpath):
            hashes[filename] = compute_file_sha256(fpath)

    combined_hash = hashlib.sha256("".join(hashes.values()).encode()).hexdigest()

    # Write DATA_CARD.md
    data_card_path = os.path.join(DATA_DIR, "DATA_CARD.md")
    write_data_card(
        data_card_path,
        combined_hash=combined_hash,
        file_hashes=hashes,
        text_counts={k: len(v) for k, v in text_splits.items()},
        trace_counts={k: len(v) for k, v in trace_splits.items()},
        pair_counts={k: len(v) for k, v in pair_splits.items()},
        seed=seed,
    )
    print(f"  -> Generated {data_card_path} with master data hash: {combined_hash[:16]}...")

    elapsed = round(time.time() - t0, 2)
    print(f"\n[DONE] Pipeline completed in {elapsed}s.")
    return {
        "elapsed_s": elapsed,
        "combined_hash": combined_hash,
        "text_splits": {k: len(v) for k, v in text_splits.items()},
        "trace_splits": {k: len(v) for k, v in trace_splits.items()},
        "pair_splits": {k: len(v) for k, v in pair_splits.items()},
    }


def write_data_card(
    path: str,
    combined_hash: str,
    file_hashes: Dict[str, str],
    text_counts: Dict[str, int],
    trace_counts: Dict[str, int],
    pair_counts: Dict[str, int],
    seed: int,
) -> None:
    """Generates DATA_CARD.md documenting provenance, splits, and security considerations."""
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")

    content = f"""# AgentShield-X Dataset Data Card

- **Created**: {now_str}
- **Master Data SHA-256**: `{combined_hash}`
- **Random Seed**: {seed}
- **Fictional Target Organization**: NexusCorp (`*.example.test`)
- **Safety Standard**: Zero real malware, exploits, or functional keys. All samples are benign-calibrated synthetic prompt injections and tool misuse patterns.

---

## 1. Split Protocol (Master Build Prompt Section 5.4)

### Held-out Families (Frozen Test Set Only)
- **Text Attack Families Held Out**: `{', '.join(HELD_OUT_TEXT_FAMILIES)}`
- **Trace Attack Families Held Out**: `{', '.join(HELD_OUT_TRACE_FAMILIES)}`
- **Benign Task Templates Held Out**: `{', '.join(HELD_OUT_BENIGN_TEMPLATES)}`

### Partitioning Rules
- **Partition A (60%)**: Detector training only (`text_A.jsonl`, `traces_train_A.jsonl`, `pairs_train_A.jsonl`).
- **Partition B (20%)**: Stacker training only (`text_B.jsonl`, `traces_stacker_B.jsonl`, `pairs_stacker_B.jsonl`).
- **Partition V (20%)**: Validation and threshold calibration (`text_V.jsonl`, `traces_val_V.jsonl`, `pairs_val_V.jsonl`).
- **Test Set**: Evaluated exactly once for final evaluation reports. Contains both seen and held-out families.

---

## 2. Partition Summary Counts

| Partition | Text Samples | Trace Sessions | Task/Action Pairs |
| :--- | :--- | :--- | :--- |
| **Train A (60%)** | {text_counts.get('train_A', 0)} | {trace_counts.get('train_A', 0)} | {pair_counts.get('train_A', 0)} |
| **Stacker B (20%)** | {text_counts.get('stacker_B', 0)} | {trace_counts.get('stacker_B', 0)} | {pair_counts.get('stacker_B', 0)} |
| **Validation V (20%)** | {text_counts.get('val_V', 0)} | {trace_counts.get('val_V', 0)} | {pair_counts.get('val_V', 0)} |
| **Frozen Test** | {text_counts.get('test', 0)} | {trace_counts.get('test', 0)} | {pair_counts.get('test', 0)} |

---

## 3. Cryptographic Hashes (Reproducibility)

| Filename | SHA-256 Digest |
| :--- | :--- |
"""
    for fname, digest in sorted(file_hashes.items()):
        content += f"| `{fname}` | `{digest}` |\n"

    content += """
---

## 4. Manual Review
A random sample of 100 attack rows and 100 benign rows (including near-misses) has been exported to:
`ml/data/review_sample.csv` for human inspection.
"""

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


if __name__ == "__main__":
    run_pipeline()
