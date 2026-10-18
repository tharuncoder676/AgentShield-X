"""
Unit tests for data generators:
Verifies seeded determinism, class balance, and required families presence.
"""

import unittest
from ml.data.generators.text_generator import (
    ATTACK_FAMILIES,
    generate_attack_texts,
    generate_benign_texts,
)
from ml.data.generators.trace_simulator import (
    ALL_TOOLS,
    ATTACK_SESSION_FAMILIES,
    BENIGN_TASK_TEMPLATES,
    generate_trace_dataset,
)
from ml.data.generators.pair_generator import generate_task_action_pairs


class TestGenerators(unittest.TestCase):

    def test_text_generator_determinism_and_families(self):
        """Checks text generator produces identical outputs with fixed seed and covers all families."""
        run1 = generate_attack_texts(seed=42, samples_per_family=10)
        run2 = generate_attack_texts(seed=42, samples_per_family=10)

        self.assertEqual(len(run1), len(run2))
        self.assertEqual([r["text"] for r in run1], [r["text"] for r in run2])

        fams = {r["attack_family"] for r in run1}
        for expected in ATTACK_FAMILIES:
            self.assertIn(expected, fams)

    def test_benign_near_miss_balance(self):
        """Verifies near-misses comprise >= 20% of benign text dataset."""
        benign = generate_benign_texts(seed=42, total_benign=200, near_miss_ratio=0.25)
        near_misses = [b for b in benign if b["is_near_miss"]]
        ratio = len(near_misses) / len(benign)
        self.assertGreaterEqual(ratio, 0.20, f"Near miss ratio was {ratio:.2f}, expected >= 0.20")

    def test_trace_simulator_determinism_and_templates(self):
        """Checks trace simulator has >= 15 templates and >= 8 attack families."""
        self.assertGreaterEqual(len(BENIGN_TASK_TEMPLATES), 15)
        self.assertGreaterEqual(len(ATTACK_SESSION_FAMILIES), 8)

        b_sess, a_sess = generate_trace_dataset(seed=42, benign_count=20, attack_per_family=5)
        self.assertEqual(len(b_sess), 20)
        self.assertEqual(len(a_sess), 5 * len(ATTACK_SESSION_FAMILIES))

        # Check honeytool is never used by benign sessions
        for sess in b_sess:
            for ev in sess:
                self.assertNotEqual(ev["tool"], "export_all_customers")

    def test_pair_generator_paraphrasing_and_labels(self):
        """Checks task/action pairs contain consistent and hijacked labels."""
        b_sess, a_sess = generate_trace_dataset(seed=42, benign_count=10, attack_per_family=2)
        pairs = generate_task_action_pairs(b_sess, a_sess, seed=42)

        labels = {p["consistent"] for p in pairs}
        self.assertIn(1, labels)
        self.assertIn(0, labels)


if __name__ == "__main__":
    unittest.main()
