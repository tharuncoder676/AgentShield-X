"""
Unit Tests for AgentShield-X Core Data Contracts and Hash Chain Integrity
"""

import unittest
import uuid
from shield_core.models import (
    ToolSensitivity,
    TrustLevel,
    ShieldAction,
    ToolDefinition,
    ContextSegment,
    ToolCallEvent,
    Decision,
    AuditRecord,
)
from shield_core.crypto import (
    sha256_hex,
    compute_audit_hash,
    verify_audit_chain,
    generate_canary_token,
)


class TestCoreModels(unittest.TestCase):

    def test_tool_call_event_serialization(self):
        event = ToolCallEvent(
            tenant_id="tenant_alpha",
            agent_id="agent_007",
            session_id="session_xyz",
            tool=ToolDefinition(name="send_email", sensitivity=ToolSensitivity.HIGH),
            arguments={"to": "audit@example.test", "body": "Quarterly balance"},
        )
        data = event.model_dump()
        self.assertEqual(data["tenant_id"], "tenant_alpha")
        self.assertEqual(data["tool"]["name"], "send_email")
        self.assertEqual(data["tool"]["sensitivity"], "high")

        # Validate round-trip deserialization
        restored = ToolCallEvent.model_validate(data)
        self.assertEqual(restored.tenant_id, "tenant_alpha")
        self.assertEqual(restored.tool.name, "send_email")

    def test_decision_model_risk_aggregation(self):
        decision = Decision(
            event_id=str(uuid.uuid4()),
            action=ShieldAction.BLOCK,
            risk=0.95,
        )
        self.assertEqual(decision.action, ShieldAction.BLOCK)
        self.assertFalse(decision.degraded)
        self.assertGreaterEqual(decision.risk, 0.9)

    def test_cryptographic_audit_chain_tamper_detection(self):
        """Validates that any modification to an audit record breaks hash chain verification."""
        records = []
        prev_hash = "GENESIS_BLOCK_00000000000000000000000000000000"

        for i in range(5):
            seq = i
            tenant = "tenant_alpha"
            event_id = f"evt_{i}"
            dec_id = f"dec_{i}"
            action = "block" if i % 2 == 0 else "allow"
            ts = f"2026-10-16T09:00:0{i}Z"

            curr_hash = compute_audit_hash(
                sequence=seq,
                tenant_id=tenant,
                event_id=event_id,
                decision_id=dec_id,
                action=action,
                timestamp=ts,
                prev_hash=prev_hash,
            )

            rec = {
                "sequence": seq,
                "tenant_id": tenant,
                "event_id": event_id,
                "decision_id": dec_id,
                "action": action,
                "timestamp": ts,
                "prev_hash": prev_hash,
                "hash": curr_hash,
            }
            records.append(rec)
            prev_hash = curr_hash

        # Initial chain must be valid
        self.assertTrue(verify_audit_chain(records))

        # Tampering with record 2 (e.g. changing 'block' to 'allow' maliciously)
        records[2]["action"] = "allow"
        self.assertFalse(verify_audit_chain(records), "Hash chain failed to detect row modification")

    def test_canary_token_generation(self):
        t1 = generate_canary_token()
        t2 = generate_canary_token()
        self.assertTrue(t1.startswith("SHIELD_CANARY_"))
        self.assertNotEqual(t1, t2)
        self.assertGreater(len(t1), 20)


if __name__ == "__main__":
    unittest.main()
