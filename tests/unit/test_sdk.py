"""
Unit Tests for AgentShield-X Python Client SDK
"""

import asyncio
import unittest
from unittest.mock import patch

import httpx
from shield_core.models import Decision, ShieldAction, ToolSensitivity
from shield_sdk_py.client import AgentShield
from shield_sdk_py.exceptions import ShieldBlockedException


class TestAgentShieldSDK(unittest.TestCase):

    def test_disabled_shield_zero_overhead(self):
        shield = AgentShield(enabled=False)
        decision = shield.evaluate_sync("send_email", {"to": "test@example.com"})
        self.assertEqual(decision.action, ShieldAction.ALLOW)
        self.assertEqual(decision.risk, 0.0)

    def test_wrappers_recheck_and_withhold_non_allow_decisions(self):
        for is_async in (False, True):
            for verdict in (ShieldAction.ESCALATE, ShieldAction.SANITIZE, ShieldAction.BLOCK):
                with self.subTest(is_async=is_async, verdict=verdict):
                    shield = AgentShield(raise_on_block=False)
                    calls = []

                    def sync_tool():
                        calls.append("executed")
                        return "ok"

                    async def async_tool():
                        return sync_tool()

                    guarded = shield.tool()(async_tool if is_async else sync_tool)
                    decisions = [
                        Decision(event_id="first", action=ShieldAction.ALLOW, risk=0.0),
                        Decision(event_id="second", action=verdict, risk=0.8),
                    ]
                    responses = [
                        httpx.Response(200, json=decision.model_dump(mode="json"))
                        for decision in decisions
                    ]

                    def invoke():
                        return asyncio.run(guarded()) if is_async else guarded()

                    with patch.object(httpx.AsyncClient, "post", side_effect=responses):
                        self.assertEqual(invoke(), "ok")
                        with self.assertRaises(ShieldBlockedException) as raised:
                            invoke()
                    self.assertEqual(raised.exception.decision.action, verdict)
                    self.assertEqual(calls, ["executed"])

    def test_tool_decorator_syntax(self):
        shield = AgentShield(enabled=False)

        @shield.tool(name="custom_math", sensitivity=ToolSensitivity.LOW)
        def add(a: int, b: int) -> int:
            return a + b

        result = add(2, 3)
        self.assertEqual(result, 5)

    def test_gateway_rejection_blocks_even_in_open_mode(self):
        shield = AgentShield(fail_mode="open", raise_on_block=False)
        for status in (401, 403, 422):
            with self.subTest(status=status):
                with patch.object(httpx.AsyncClient, "post", return_value=httpx.Response(status)) as post:
                    decision = shield.evaluate_sync("read_record", {})
                    self.assertEqual(decision.action, ShieldAction.BLOCK)
                    self.assertEqual(decision.reasons[0].code, "SDK_GATEWAY_REJECTED")
                    post.assert_awaited_once()

    def test_gateway_server_error_returns_degraded_verdict_after_retry(self):
        shield = AgentShield(max_retries=1, raise_on_block=False)
        with patch.object(httpx.AsyncClient, "post", return_value=httpx.Response(503)) as post:
            decision = shield.evaluate_sync("update_record", {}, sensitivity=ToolSensitivity.HIGH)
            self.assertEqual(decision.action, ShieldAction.BLOCK)
            self.assertTrue(decision.degraded)
            self.assertEqual(post.await_count, 2)

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
