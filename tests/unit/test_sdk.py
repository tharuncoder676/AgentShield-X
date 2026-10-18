"""
Unit Tests for AgentShield-X Python Client SDK
"""

import unittest
from shield_core.models import Decision, ShieldAction, ToolSensitivity
from shield_sdk_py.client import AgentShield
from shield_sdk_py.exceptions import ShieldBlockedException, ShieldSessionKilledException


class TestAgentShieldSDK(unittest.TestCase):

    def test_disabled_shield_zero_overhead(self):
        shield = AgentShield(enabled=False)
        decision = shield.evaluate_sync("send_email", {"to": "test@example.com"})
        self.assertEqual(decision.action, ShieldAction.ALLOW)
        self.assertEqual(decision.risk, 0.0)

    def test_local_cache_hit(self):
        shield = AgentShield(enabled=True)
        # Pre-seed cache
        k = shield._cache_key("test_tool", {"a": 1})
        shield._cache[k] = Decision(
            event_id="evt_cached",
            action=ShieldAction.ALLOW,
            risk=0.0,
        )

        dec = shield.evaluate_sync("test_tool", {"a": 1})
        self.assertEqual(dec.event_id, "evt_cached")

    def test_tool_decorator_syntax(self):
        shield = AgentShield(enabled=False)

        @shield.tool(name="custom_math", sensitivity=ToolSensitivity.LOW)
        def add(a: int, b: int) -> int:
            return a + b

        result = add(2, 3)
        self.assertEqual(result, 5)

    def test_fail_mode_closed_on_sensitive_tool(self):
        # Configure client pointing to an unreachable dummy port with 0 retries
        shield = AgentShield(
            endpoint="http://127.0.0.1:59999",
            fail_mode="closed",
            max_retries=0,
            timeout_seconds=0.01,
            raise_on_block=False,
        )
        dec = shield.evaluate_sync(
            "delete_database",
            {"target": "prod"},
            sensitivity=ToolSensitivity.CRITICAL,
        )
        self.assertEqual(dec.action, ShieldAction.BLOCK)
        self.assertTrue(dec.degraded)


if __name__ == "__main__":
    unittest.main()
