"""Unit tests for Live Agent Forensics & Attack Replay Theater.

Verifies:
- Incident trace retrieval and frame sequencing
- Flight recorder frame data integrity and MITRE mapping
- "What-If" policy simulation branching (Permissive breach vs Zero-Trust prevention)
- Cryptographic evidence certificate generation & Merkle root attestation
"""

import pytest
from shield_core.forensics import (
    AgentForensicsFlightRecorder,
    FramePhase,
    ActorRole,
)


class TestAgentForensics:
    def test_seeded_traces_exist(self):
        recorder = AgentForensicsFlightRecorder()
        traces = recorder.list_traces()

        assert len(traces) >= 3
        incident_ids = [t["incident_id"] for t in traces]
        assert "INC-2026-9941" in incident_ids
        assert "INC-2026-8812" in incident_ids
        assert "INC-2026-7734" in incident_ids

    def test_trace_frame_sequencing(self):
        recorder = AgentForensicsFlightRecorder()
        trace = recorder.get_trace("INC-2026-9941")

        assert trace is not None
        assert trace.total_frames == 6
        assert trace.frames[0].phase == FramePhase.INGRESS_PROMPT
        assert trace.frames[0].actor == ActorRole.EXTERNAL_USER

        # Verify interception frame
        intercept_frame = next(f for f in trace.frames if f.phase == FramePhase.INTERCEPTION_GATE)
        assert intercept_frame.actor == ActorRole.AGENTSHIELD_CORE
        assert "BLOCKED" in intercept_frame.content_payload
        assert intercept_frame.mitre_technique_id == "AML.T0043"

    def test_what_if_policy_simulation(self):
        recorder = AgentForensicsFlightRecorder()

        # Permissive policy -> Breach occurs
        res_permissive = recorder.simulate_what_if("INC-2026-9941", "PERMISSIVE")
        assert res_permissive["breach_occurred"] is True
        assert res_permissive["interception_status"] == "BYPASS_UNPROTECTED"
        assert "CRITICAL" in res_permissive["blast_radius_impact"]

        # Strict policy -> Intercepted early pre-ingress
        res_strict = recorder.simulate_what_if("INC-2026-9941", "STRICT")
        assert res_strict["breach_occurred"] is False
        assert res_strict["interception_status"] == "INTERCEPTED_PRE_INGRESS"
        assert res_strict["interception_frame"] == 3

        # Balanced policy -> Intercepted at sink
        res_balanced = recorder.simulate_what_if("INC-2026-9941", "BALANCED")
        assert res_balanced["breach_occurred"] is False
        assert res_balanced["interception_status"] == "INTERCEPTED_AT_SINK"

    def test_cryptographic_evidence_certificate(self):
        recorder = AgentForensicsFlightRecorder()
        cert = recorder.generate_cryptographic_certificate("INC-2026-9941")

        assert cert["incident_id"] == "INC-2026-9941"
        assert cert["certificate_id"].startswith("CERT-")
        assert len(cert["evidence_merkle_root"]) == 64
        assert cert["ed25519_system_signature"].startswith("sig_ed25519_")
        assert cert["verification_status"] == "CRYPTOGRAPHICALLY_VERIFIED"
        assert "Tharunkumar.S" in cert["issuer"]

