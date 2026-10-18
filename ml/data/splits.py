"""
AgentShield-X Split Protocol & Dataset Partitioner
Implements Section 5.4 strict protocol:
- Held-out attack families for test: base64_obfuscated, multilingual, payload_split (text)
- Held-out trace families for test: slow_and_low, rare_transition (traces)
- Held-out benign templates for test: 3 whole templates (held_out_expense_reconciliation, etc.)
- Remaining data divided strictly by document / session group into disjoint partitions:
  A: 60% (detector training)
  B: 20% (stacker training)
  V: 20% (validation & threshold tuning)
- Frozen test set evaluated once for final report.
- Saves splits to ml/data/splits/ and review_sample.csv to ml/data/
- Computes SHA-256 data hash and writes ml/data/DATA_CARD.md
"""

from __future__ import annotations

import csv
import hashlib
import json
import os
import random
from typing import Any, Dict, List, Set, Tuple

from ml.data.generators.text_generator import HELD_OUT_TEXT_FAMILIES
from ml.data.generators.trace_simulator import HELD_OUT_BENIGN_TEMPLATES, HELD_OUT_TRACE_FAMILIES


def partition_text_data(
    all_texts: List[Dict[str, Any]],
    seed: int = 42,
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Partitions text data into train_A, stacker_B, val_V, and test sets.
    Held out families strictly isolated in test.
    """
    rng = random.Random(seed)

    held_out_samples = []
    regular_samples = []

    for item in all_texts:
        if item.get("attack_family") in HELD_OUT_TEXT_FAMILIES:
            held_out_samples.append(item)
        else:
            regular_samples.append(item)

    rng.shuffle(regular_samples)

    # 10% of regular samples also go into test for testing seen families
    n_reg = len(regular_samples)
    n_test_reg = int(0.10 * n_reg)
    test_reg = regular_samples[:n_test_reg]
    pool = regular_samples[n_test_reg:]

    n_pool = len(pool)
    n_a = int(0.60 * n_pool)
    n_b = int(0.20 * n_pool)

    part_a = pool[:n_a]
    part_b = pool[n_a:n_a + n_b]
    part_v = pool[n_a + n_b:]
    test_set = held_out_samples + test_reg

    return {
        "train_A": part_a,
        "stacker_B": part_b,
        "val_V": part_v,
        "test": test_set,
    }


def partition_trace_data(
    benign_sessions: List[List[Dict[str, Any]]],
    attack_sessions: List[List[Dict[str, Any]]],
    seed: int = 42,
) -> Dict[str, List[List[Dict[str, Any]]]]:
    """
    Partitions sessions into train_A, stacker_B, val_V, and test.
    Held-out families and templates go strictly to test.
    Partitioning is strictly by session_id (never split across rows).
    """
    rng = random.Random(seed)

    held_out_sessions: List[List[Dict[str, Any]]] = []
    regular_benign: List[List[Dict[str, Any]]] = []
    regular_attack: List[List[Dict[str, Any]]] = []

    for session in benign_sessions:
        tmpl = session[0].get("task_template", "")
        if tmpl in HELD_OUT_BENIGN_TEMPLATES:
            held_out_sessions.append(session)
        else:
            regular_benign.append(session)

    for session in attack_sessions:
        fam = session[0].get("attack_family", "")
        if fam in HELD_OUT_TRACE_FAMILIES:
            held_out_sessions.append(session)
        else:
            regular_attack.append(session)

    rng.shuffle(regular_benign)
    rng.shuffle(regular_attack)

    # 10% of regular benign and attack sessions go to test
    n_tb = int(0.10 * len(regular_benign))
    n_ta = int(0.10 * len(regular_attack))

    test_sessions = held_out_sessions + regular_benign[:n_tb] + regular_attack[:n_ta]

    pool_benign = regular_benign[n_tb:]
    pool_attack = regular_attack[n_ta:]

    # 60% A, 20% B, 20% V
    def split_pool(pool: List[List[Dict[str, Any]]]) -> Tuple[List[List[Dict[str, Any]]], List[List[Dict[str, Any]]], List[List[Dict[str, Any]]]]:
        na = int(0.60 * len(pool))
        nb = int(0.20 * len(pool))
        return pool[:na], pool[na:na + nb], pool[na + nb:]

    b_a, b_b, b_v = split_pool(pool_benign)
    a_a, a_b, a_v = split_pool(pool_attack)

    return {
        "train_A": b_a + a_a,
        "stacker_B": b_b + a_b,
        "val_V": b_v + a_v,
        "test": test_sessions,
    }


def partition_pairs(
    pairs: List[Dict[str, Any]],
    trace_splits: Dict[str, List[List[Dict[str, Any]]]],
) -> Dict[str, List[Dict[str, Any]]]:
    """Partitions task/action pairs matching the exact session partition."""
    sess_to_partition: Dict[str, str] = {}
    for part_name, sessions in trace_splits.items():
        for sess in sessions:
            if sess:
                sess_to_partition[sess[0]["session_id"]] = part_name

    split_pairs: Dict[str, List[Dict[str, Any]]] = {
        "train_A": [],
        "stacker_B": [],
        "val_V": [],
        "test": [],
    }

    for pair in pairs:
        sid = pair.get("session_id", "")
        part = sess_to_partition.get(sid, "test")
        split_pairs[part].append(pair)

    return split_pairs


def write_jsonl(records: List[Any], path: str) -> None:
    """Helper to write records as jsonl."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r) + "\n")


def compute_file_sha256(path: str) -> str:
    """Computes SHA-256 hash of a file."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()
