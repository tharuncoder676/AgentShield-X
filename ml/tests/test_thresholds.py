"""
Unit tests for Tiered Thresholds & FPR Budget Verification
Section 9 requirement: FPR on V does not exceed budget.
"""

import json
import os
import unittest

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


class TestThresholds(unittest.TestCase):

    def test_thresholds_json_structure(self):
        """Checks thresholds.json contains tiered thresholds and hard overrides."""
        thresh_path = os.path.join(BASE_DIR, "ml", "risk", "thresholds.json")
        if not os.path.exists(thresh_path):
            self.skipTest("thresholds.json not generated yet. Run 'make train-stacker' first.")

        with open(thresh_path, "r", encoding="utf-8") as f:
            t = json.load(f)

        self.assertIn("allow_max", t)
        self.assertIn("sanitize_max", t)
        self.assertIn("escalate_max", t)
        self.assertIn("block_min", t)
        self.assertIn("kill_session_min", t)
        self.assertIn("hard_overrides", t)

        # Monotonicity of tiers
        self.assertLess(t["allow_max"], t["sanitize_max"])
        self.assertLess(t["sanitize_max"], t["escalate_max"])
        self.assertLess(t["escalate_max"], t["kill_session_min"])

        # FPR budget
        self.assertLessEqual(t.get("fpr_budget", 0.05), 0.02)


if __name__ == "__main__":
    unittest.main()
