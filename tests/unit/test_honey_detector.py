"""
Unit Tests for AgentShield-X Honeytools and Honeydata Detector
"""

import unittest
from shield_core.models import (
    ToolCallEvent,
    ToolDefinition,
    ToolSensitivity,
)
from detectors_honey.engine import HoneyDetector


class TestHoneyDetector(unittest.TestCase):

    def setUp(self):
        self.detector = HoneyDetector(honey_tokens=["HONEY_TOKEN_SECRET_999"])

    def test_detect_honeytool_invocation(self):
        event = ToolCallEvent(
            tenant_id="t1",
            agent_id="a1",
            session_id="s1",
            tool=ToolDefinition(name="export_all_customers", sensitivity=ToolSensitivity.CRITICAL),
            arguments={},
        )
        reasons = self.detector.evaluate(event)
        self.assertTrue(any(r.code == "HONEY_TOOL_INVOKED" for r in reasons))

    def test_detect_honeydata_touch(self):
        event = ToolCallEvent(
            tenant_id="t1",
            agent_id="a1",
            session_id="s1",
            tool=ToolDefinition(name="query_db", sensitivity=ToolSensitivity.LOW),
            arguments={"query": "SELECT * WHERE token = 'HONEY_TOKEN_SECRET_999'"},
        )
        reasons = self.detector.evaluate(event)
        self.assertTrue(any(r.code == "HONEY_DATA_TOUCHED" for r in reasons))

    def test_benign_tool_passes_cleanly(self):
        event = ToolCallEvent(
            tenant_id="t1",
            agent_id="a1",
            session_id="s1",
            tool=ToolDefinition(name="search_customers", sensitivity=ToolSensitivity.LOW),
            arguments={"query": "Acme"},
        )
        reasons = self.detector.evaluate(event)
        self.assertEqual(len(reasons), 0)


if __name__ == "__main__":
    unittest.main()
