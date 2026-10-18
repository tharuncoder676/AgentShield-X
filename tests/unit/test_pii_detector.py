"""
Unit Tests for AgentShield-X PII and Secret Detector
"""

import unittest
from shield_core.models import (
    ToolCallEvent,
    ToolDefinition,
    ToolSensitivity,
)
from detectors_pii.engine import PIIDetector, shannon_entropy


class TestPIIDetector(unittest.TestCase):

    def setUp(self):
        self.detector = PIIDetector()

    def test_shannon_entropy(self):
        # Repetitive string has low entropy
        low_ent = shannon_entropy("aaaaaaaaaaaaaaaaaaaa")
        self.assertEqual(low_ent, 0.0)

        # High entropy random token
        high_ent = shannon_entropy("k9J3mP8qZ2vL4xN7bT1wR5yC0")
        self.assertGreater(high_ent, 4.0)

    def test_detect_aws_secret(self):
        event = ToolCallEvent(
            tenant_id="t1",
            agent_id="a1",
            session_id="s1",
            tool=ToolDefinition(name="http_post", sensitivity=ToolSensitivity.HIGH),
            arguments={"body": "Deploy using AKIAIOSFODNN7EXAMPLE credentials"},
        )
        reasons = self.detector.evaluate(event)
        self.assertTrue(any(r.code == "PII_AWS_ACCESS_KEY_ID" for r in reasons))

    def test_detect_openai_key(self):
        event = ToolCallEvent(
            tenant_id="t1",
            agent_id="a1",
            session_id="s1",
            tool=ToolDefinition(name="chat", sensitivity=ToolSensitivity.LOW),
            arguments={"key": "sk-proj-abc1234567890abcdef1234567890abcdef12"},
        )
        reasons = self.detector.evaluate(event)
        self.assertTrue(any(r.code == "PII_OPENAI_API_KEY" for r in reasons))

    def test_detect_jwt(self):
        jwt_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        event = ToolCallEvent(
            tenant_id="t1",
            agent_id="a1",
            session_id="s1",
            tool=ToolDefinition(name="auth_service", sensitivity=ToolSensitivity.LOW),
            arguments={"bearer": jwt_token},
        )
        reasons = self.detector.evaluate(event)
        self.assertTrue(any(r.code == "PII_JWT_TOKEN" for r in reasons))

    def test_detect_credit_card(self):
        event = ToolCallEvent(
            tenant_id="t1",
            agent_id="a1",
            session_id="s1",
            tool=ToolDefinition(name="save_customer", sensitivity=ToolSensitivity.MEDIUM),
            arguments={"cc": "4532-7592-8819-2018"},
        )
        reasons = self.detector.evaluate(event)
        self.assertTrue(any(r.code == "PII_CREDIT_CARD" for r in reasons))


if __name__ == "__main__":
    unittest.main()
