"""
Integration Test for AgentShield-X End-to-End Pipeline
Validates Phase 1 acceptance gate:
- Vulnerable agent without Shield executes and leaks customer data
- Protected agent under Shield blocks the attack with zero leakage
- Benign operations pass cleanly
"""

import os
import sys
import unittest

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
for p in [
    os.path.join(BASE_DIR, "packages", "shield_core", "src"),
    os.path.join(BASE_DIR, "packages", "shield_sdk_py", "src"),
    os.path.join(BASE_DIR, "packages", "eventbus", "src"),
    os.path.join(BASE_DIR, "detectors", "rules", "src"),
    os.path.join(BASE_DIR, "detectors", "pii", "src"),
    os.path.join(BASE_DIR, "detectors", "honey", "src"),
    os.path.join(BASE_DIR, "services", "decision", "src"),
    os.path.join(BASE_DIR, "services", "gateway", "src"),
    BASE_DIR,
]:
    if p not in sys.path:
        sys.path.insert(0, p)

from demo.attack_library.runner import run_demo


class TestEndToEndShield(unittest.TestCase):

    def test_acceptance_gate(self):
        """Runs full acceptance gate suite."""
        success = run_demo()
        self.assertTrue(success)


if __name__ == "__main__":
    unittest.main()
