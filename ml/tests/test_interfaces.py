"""
Unit tests for ML shared interfaces (DetectorOutput, ToolCallEvent, BaseDetector)
Verifies Section 4 contracts and JSON schema generation.
"""

import unittest
from ml.interfaces import DetectorOutput, ToolCallEvent, export_schemas, BaseDetector


class TestMLInterfaces(unittest.TestCase):

    def test_detector_output_roundtrip(self):
        output = DetectorOutput(
            detector="similarity",
            score=0.88,
            flagged=True,
            threshold=0.72,
            evidence={"nearest_attack_id": "atk_012", "family": "override_instructions"},
            model_version="1.0.0",
            latency_ms=1.45,
        )
        data = output.model_dump()
        self.assertEqual(data["detector"], "similarity")
        self.assertEqual(data["score"], 0.88)
        self.assertTrue(data["flagged"])
        self.assertEqual(data["threshold"], 0.72)
        self.assertEqual(data["evidence"]["family"], "override_instructions")

        # Validate deserialization
        restored = DetectorOutput.model_validate(data)
        self.assertEqual(restored.detector, "similarity")
        self.assertEqual(restored.score, 0.88)
        self.assertTrue(restored.flagged)

    def test_tool_call_event_roundtrip(self):
        event = ToolCallEvent(
            session_id="sess_1001",
            step=2,
            tool="send_email",
            sensitivity="high",
            arguments={"to": "audit@example.test", "body": "Report data"},
            task_text="Summarize weekly email and send confirmation",
            context_segments=[{"id": "seg_1", "trust": "untrusted", "source": "email", "text": "payload"}],
            taint=["seg_1"],
        )
        data = event.model_dump()
        self.assertEqual(data["session_id"], "sess_1001")
        self.assertEqual(data["tool"], "send_email")
        self.assertEqual(data["sensitivity"], "high")
        self.assertEqual(len(data["taint"]), 1)

        restored = ToolCallEvent.model_validate(data)
        self.assertEqual(restored.session_id, "sess_1001")
        self.assertEqual(restored.step, 2)
        self.assertEqual(restored.tool, "send_email")

    def test_export_schemas(self):
        schemas = export_schemas()
        self.assertIn("DetectorOutput", schemas)
        self.assertIn("ToolCallEvent", schemas)


if __name__ == "__main__":
    unittest.main()
