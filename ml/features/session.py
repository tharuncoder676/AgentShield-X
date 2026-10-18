"""
AgentShield-X Session & Step Feature Builder
Section 6.3 requirement:
Produces per-session aggregates and per-step features:
tool sequence, transition probabilities, calls per minute, inter-call gaps,
argument size and entropy, bytes out, number of distinct tools, never-seen-tool flag,
sensitive-tool count, distance from the task template's expected path,
token and cost counts, and repeated-call ratio.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Optional, Set, Tuple

# Canonical tools seen in legitimate training tasks
KNOWN_BENIGN_TOOLS = {
    "read_webpage",
    "read_email",
    "read_pdf",
    "search_customers",
    "send_email",
    "run_sql",
    "write_file",
}

SENSITIVITY_WEIGHTS = {
    "low": 0.0,
    "medium": 0.5,
    "high": 1.0,
    "critical": 2.0,
}


def shannon_entropy(text: str) -> float:
    """Calculates Shannon entropy of string characters in bits."""
    if not text:
        return 0.0
    freq: Dict[str, int] = {}
    for ch in text:
        freq[ch] = freq.get(ch, 0) + 1
    length = len(text)
    ent = 0.0
    for count in freq.values():
        p = count / length
        ent -= p * math.log2(p)
    return ent


def extract_session_features(
    events: List[Any],
    expected_path: Optional[List[str]] = None,
    transition_scorer: Optional[Any] = None,
) -> Dict[str, float]:
    """
    Computes dense numeric feature vector for a complete session.
    Used by Isolation Forest and stacker. Supports Dict or ToolCallEvent.
    """
    if not events:
        return {

            "num_steps": 0.0,
            "distinct_tools": 0.0,
            "has_never_seen_tool": 0.0,
            "sensitive_tool_count": 0.0,
            "repeated_call_ratio": 0.0,
            "total_bytes_out": 0.0,
            "max_bytes_out": 0.0,
            "total_tokens": 0.0,
            "avg_arg_size": 0.0,
            "avg_arg_entropy": 0.0,
            "calls_per_minute": 0.0,
            "mean_inter_call_gap": 0.0,
            "path_deviation_score": 0.0,
            "worst_transition_nll": 0.0,
        }

    # Normalize events if ToolCallEvent objects are passed
    ev_list = []
    for ev in events:
        if hasattr(ev, "model_dump"):
            ev_list.append(ev.model_dump())
        elif isinstance(ev, dict):
            ev_list.append(ev)
        else:
            ev_list.append(dict(ev))
    events = ev_list

    tools = [e["tool"] for e in events]

    num_steps = len(tools)
    distinct_tools = len(set(tools))

    # Never seen tool (e.g. honeytool 'export_all_customers')
    has_never_seen = 1.0 if any(t not in KNOWN_BENIGN_TOOLS for t in tools) else 0.0

    # Sensitive tool calls
    sensitive_count = sum(1 for e in events if e.get("sensitivity") in ("high", "critical"))

    # Repeated call ratio (max consecutive same tool / num_steps)
    max_streak = 1
    curr_streak = 1
    for i in range(1, len(tools)):
        if tools[i] == tools[i - 1]:
            curr_streak += 1
            if curr_streak > max_streak:
                max_streak = curr_streak
        else:
            curr_streak = 1
    repeated_ratio = max_streak / max(1, num_steps)

    # Bytes and tokens
    bytes_list = [float(e.get("bytes_out", 0.0)) for e in events]
    total_bytes = sum(bytes_list)
    max_bytes = max(bytes_list) if bytes_list else 0.0
    total_tokens = sum(float(e.get("tokens_used", 0.0)) for e in events)

    # Arguments size and entropy
    arg_sizes = []
    arg_entropies = []
    for e in events:
        args_str = str(e.get("arguments", {}))
        arg_sizes.append(len(args_str))
        arg_entropies.append(shannon_entropy(args_str))

    avg_arg_size = sum(arg_sizes) / max(1, len(arg_sizes))
    avg_arg_entropy = sum(arg_entropies) / max(1, len(arg_entropies))

    # Latencies & gaps
    latencies = [float(e.get("latency_ms", 30.0)) for e in events]
    mean_gap = sum(latencies) / max(1, len(latencies))
    total_time_min = max(0.1, sum(latencies) / 60000.0)
    calls_per_min = num_steps / total_time_min

    # Path deviation from template's expected sequence
    path_deviation = 0.0
    if expected_path:
        # Levenshtein-style or set distance
        expected_set = set(expected_path)
        actual_set = set(tools)
        unseen_tools = actual_set - expected_set
        path_deviation = len(unseen_tools) / max(1, len(actual_set))

    # Markov transition anomaly if model provided
    worst_nll = 0.0
    if transition_scorer is not None and hasattr(transition_scorer, "score_sequence"):
        _, worst_nll = transition_scorer.score_sequence(tools)

    return {
        "num_steps": float(num_steps),
        "distinct_tools": float(distinct_tools),
        "has_never_seen_tool": has_never_seen,
        "sensitive_tool_count": float(sensitive_count),
        "repeated_call_ratio": float(repeated_ratio),
        "total_bytes_out": float(total_bytes),
        "max_bytes_out": float(max_bytes),
        "total_tokens": float(total_tokens),
        "avg_arg_size": float(avg_arg_size),
        "avg_arg_entropy": float(avg_arg_entropy),
        "calls_per_minute": float(calls_per_min),
        "mean_inter_call_gap": float(mean_gap),
        "path_deviation_score": float(path_deviation),
        "worst_transition_nll": float(worst_nll),
    }


def session_features_to_vector(feat_dict: Dict[str, float]) -> List[float]:
    """Flattens feature dictionary into standard ordered float vector."""
    keys = [
        "num_steps",
        "distinct_tools",
        "has_never_seen_tool",
        "sensitive_tool_count",
        "repeated_call_ratio",
        "total_bytes_out",
        "max_bytes_out",
        "total_tokens",
        "avg_arg_size",
        "avg_arg_entropy",
        "calls_per_minute",
        "mean_inter_call_gap",
        "path_deviation_score",
        "worst_transition_nll",
    ]
    return [feat_dict.get(k, 0.0) for k in keys]
