"""Unit tests for AgentShield Executive SOC Dashboard & Enterprise SIEM Integration Engine.

Architect: Tharunkumar.S | AgentShield-X Security Labs
"""

import pytest
from shield_core.executive import ExecutiveSOCEngine, default_executive_soc, AVERAGE_BREACH_COST_USD


def test_executive_summary_metrics():
    engine = ExecutiveSOCEngine()
    summary = engine.get_executive_summary()

    assert summary.threats_blocked_24h == 1420
    assert summary.threats_blocked_7d == 8940
    assert summary.threats_blocked_30d == 34200
    assert summary.critical_breaches_averted == 3
    assert summary.estimated_cost_savings_usd == 3 * AVERAGE_BREACH_COST_USD
    assert summary.estimated_cost_savings_usd == 13_350_000.0
    assert "AAA" in summary.enterprise_security_rating

    data_dict = summary.to_dict()
    assert "estimated_cost_savings_usd" in data_dict
    assert len(data_dict["compliance_scores"]) == 4
    assert len(data_dict["risk_trend_30d"]) == 30


def test_compliance_framework_scores():
    summary = default_executive_soc.get_executive_summary()
    framework_names = [f.framework_name for f in summary.compliance_scores]

    assert "NIST AI RMF 1.0" in framework_names
    assert "EU AI Act (High-Risk AI)" in framework_names
    assert "SOC 2 Type II" in framework_names
    assert "ISO/IEC 42001:2023" in framework_names

    for framework in summary.compliance_scores:
        assert framework.compliance_score_pct >= 95.0
        assert framework.verified_controls_count > 0
        assert framework.verified_controls_count <= framework.total_controls_count
        assert framework.status in ("Compliant", "Exceeds Mandate")


def test_risk_trend_30d():
    summary = default_executive_soc.get_executive_summary()
    trend = summary.risk_trend_30d
    assert len(trend) == 30

    for day_stat in trend:
        assert "day" in day_stat
        assert day_stat["deflected_threats"] > 400
        assert day_stat["avg_interception_ms"] < 5.0  # Ultra-low latency guarantee


def test_siem_export_splunk():
    engine = ExecutiveSOCEngine()
    result = engine.export_siem_events(format_type="splunk")

    assert result["format"] == "Splunk HEC"
    assert result["content_type"] == "application/json"
    assert len(result["events"]) >= 3

    first_evt = result["events"][0]
    assert "time" in first_evt
    assert first_evt["host"] == "agentshield-primary"
    assert first_evt["source"] == "agentshield:dual-rail:interceptor"
    assert "event" in first_evt
    assert first_evt["event"]["action"] in ("BLOCK", "QUARANTINE", "BLOCK_REVOKE")


def test_siem_export_datadog():
    engine = ExecutiveSOCEngine()
    result = engine.export_siem_events(format_type="datadog")

    assert result["format"] == "Datadog"
    assert result["content_type"] == "application/json"
    assert len(result["events"]) >= 3

    first_evt = result["events"][0]
    assert first_evt["ddsource"] == "agentshield-x"
    assert first_evt["service"] == "ai-agent-security-mesh"
    assert first_evt["status"] in ("error", "warn")
    assert "attributes" in first_evt


def test_siem_export_cef():
    engine = ExecutiveSOCEngine()
    result = engine.export_siem_events(format_type="cef")

    assert result["format"] == "CEF"
    assert result["content_type"] == "text/plain"
    assert len(result["events"]) >= 3

    for cef_line in result["events"]:
        assert cef_line.startswith("CEF:0|AgentShield-X|DefenseEngine|2.4.0|")
        assert "Agent Attack Intercepted" in cef_line
        assert "src=" in cef_line

