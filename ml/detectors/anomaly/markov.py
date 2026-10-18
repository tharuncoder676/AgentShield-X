"""
AgentShield-X Markov Transition Anomaly Model
Computes smoothed tool-to-tool transition probabilities.
Score = normalized negative log-likelihood of sequence and worst single transition.
Section 6.3 Model 1.
"""

from __future__ import annotations

import json
import math
import os
from typing import Any, Dict, List, Optional, Tuple


class MarkovTransitionModel:
    """Smoothed first-order Markov chain over agent tool call sequences."""

    def __init__(self, smoothing: float = 0.01):
        self.smoothing = smoothing
        self.transitions: Dict[str, Dict[str, float]] = {}
        self.start_counts: Dict[str, float] = {}
        self.vocab: List[str] = []
        self.threshold: float = 0.50

    def fit(self, sessions_tools: List[List[str]]) -> MarkovTransitionModel:
        """Estimates transition probabilities with additive Laplace smoothing."""
        counts: Dict[str, Dict[str, float]] = {}
        starts: Dict[str, float] = {}
        vocab_set = set()

        for seq in sessions_tools:
            if not seq:
                continue
            vocab_set.update(seq)
            first_tool = seq[0]
            starts[first_tool] = starts.get(first_tool, 0.0) + 1.0

            for i in range(len(seq) - 1):
                u, v = seq[i], seq[i + 1]
                if u not in counts:
                    counts[u] = {}
                counts[u][v] = counts[u].get(v, 0.0) + 1.0

        self.vocab = sorted(list(vocab_set))
        num_vocab = len(self.vocab)

        # Normalize start probabilities with smoothing
        total_starts = sum(starts.values()) + (self.smoothing * num_vocab)
        self.start_counts = {
            t: (starts.get(t, 0.0) + self.smoothing) / total_starts for t in self.vocab
        }

        # Normalize transition probabilities
        self.transitions = {}
        for u in self.vocab:
            self.transitions[u] = {}
            row = counts.get(u, {})
            row_sum = sum(row.values()) + (self.smoothing * num_vocab)
            for v in self.vocab:
                self.transitions[u][v] = (row.get(v, 0.0) + self.smoothing) / row_sum

        return self

    def score_sequence(self, sequence: List[str]) -> Tuple[float, float]:
        """
        Calculates (mean_nll, worst_nll) for sequence.
        High values indicate improbable/anomalous transitions.
        """
        if not sequence:
            return 0.0, 0.0

        default_prob = self.smoothing / (len(self.vocab) + 1)
        worst_nll = 0.0
        nlls: List[float] = []

        # Start transition
        first_tool = sequence[0]
        p_start = self.start_counts.get(first_tool, default_prob)
        nll_start = -math.log(max(1e-9, p_start))
        nlls.append(nll_start)
        worst_nll = max(worst_nll, nll_start)

        # Subsequent transitions
        for i in range(len(sequence) - 1):
            u, v = sequence[i], sequence[i + 1]
            p_trans = default_prob
            if u in self.transitions and v in self.transitions[u]:
                p_trans = self.transitions[u][v]

            nll = -math.log(max(1e-9, p_trans))
            nlls.append(nll)
            worst_nll = max(worst_nll, nll)

        mean_nll = sum(nlls) / len(nlls)
        return mean_nll, worst_nll

    def predict_score(self, sequence: List[str]) -> float:
        """Computes composite bounded risk score [0..1] for live detection."""
        mean_nll, worst_nll = self.score_sequence(sequence)
        # Empirical scaling: benign sequences typically have NLL in [0.5, 3.0]
        # Unseen/rare transitions have NLL >= 6.0
        composite = 0.6 * (mean_nll / 6.0) + 0.4 * (worst_nll / 8.0)
        return float(min(1.0, max(0.0, composite)))

    def save(self, path: str) -> None:
        """Serializes transition matrix and vocabulary to JSON."""
        data = {
            "smoothing": self.smoothing,
            "vocab": self.vocab,
            "start_counts": self.start_counts,
            "transitions": self.transitions,
            "threshold": self.threshold,
        }
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def load(self, path: str) -> None:
        """Loads serialized transition model from JSON."""
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.smoothing = data["smoothing"]
        self.vocab = data["vocab"]
        self.start_counts = data["start_counts"]
        self.transitions = data["transitions"]
        self.threshold = data.get("threshold", 0.50)
