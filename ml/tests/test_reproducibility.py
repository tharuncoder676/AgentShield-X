"""
AgentShield-X Reproducibility Tests
Section 9 requirement:
Verifies that fixed seeds guarantee deterministic data generation,
feature calculation, and model evaluation metrics within numeric tolerance.
"""

import hashlib
import json
import os
import unittest
import numpy as np

from ml.data.generators.text_generator import generate_attack_texts, generate_benign_texts
from ml.features.session import extract_session_features
from ml.inference import score_event
from ml.interfaces import ToolCallEvent


class TestReproducibility(unittest.TestCase):

    def test_text_generator_seeded_determinism(self):
        """Verifies running text generator twice with seed=42 produces bit-identical records."""
        ds1 = generate_attack_texts(seed=42, samples_per_family=10)
        ds2 = generate_attack_texts(seed=42, samples_per_family=10)

        self.assertEqual(len(ds1), len(ds2))

        # Check identical content hashes
        hash1 = hashlib.sha256(json.dumps(ds1, sort_keys=True).encode()).hexdigest()
        hash2 = hashlib.sha256(json.dumps(ds2, sort_keys=True).encode()).hexdigest()
        self.assertEqual(hash1, hash2, "Text generation with seed=42 did not produce identical outputs!")


    def test_feature_extraction_determinism(self):
        """Verifies session feature extraction produces identical vectors across runs."""
        sample_events = [
            ToolCallEvent(
                session_id="rep_sess_1",
                step=0,
                tool="read_email",
                sensitivity="low",
                arguments={"email_id": "em_101"},
                task_text="Check user inbox",
            ),
            ToolCallEvent(
                session_id="rep_sess_1",
                step=1,
                tool="search_customers",
                sensitivity="medium",
                arguments={"query": "Alice"},
                task_text="Check user inbox",
            ),
        ]

        feats1 = extract_session_features(sample_events)
        feats2 = extract_session_features(sample_events)

        self.assertEqual(feats1, feats2, "Session feature extraction produced varying feature dictionaries!")

    def test_inference_scoring_determinism(self):
        """Verifies score_event returns identical risk and action across successive runs."""
        event = ToolCallEvent(
            session_id="rep_sess_eval",
            step=0,
            tool="read_webpage",
            sensitivity="low",
            arguments={"url": "https://company.example.test/docs"},
            task_text="Read corporate policy doc",
        )

        d1 = score_event(event)
        d2 = score_event(event)

        self.assertEqual(d1.action, d2.action)
        self.assertAlmostEqual(d1.risk, d2.risk, places=5)
        self.assertEqual(d1.reason, d2.reason)


if __name__ == "__main__":
    unittest.main()
