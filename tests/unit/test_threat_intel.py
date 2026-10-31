"""
Unit tests for AgentShield-X Public Threat Intelligence Engine
"""

import pytest
from shield_core.threat_intel import (
    ThreatIntelligenceEngine,
    AgentAdvisory,
    MCPToolRiskRating,
    AdvisorySeverity,
)


@pytest.fixture
def intel() -> ThreatIntelligenceEngine:
    return ThreatIntelligenceEngine()


def test_default_advisories_exist(intel: ThreatIntelligenceEngine):
    advs = intel.get_advisories()
    assert len(advs) >= 4
    assert any(a.advisory_id == "ASA-2026-0041" for a in advs)
    assert any("MITRE ATLAS" in a.mitre_atlas_technique or "AML." in a.mitre_atlas_technique for a in advs)
    assert all(a.cvss_score >= 8.0 for a in advs)


def test_filter_advisories_by_severity(intel: ThreatIntelligenceEngine):
    crit = intel.get_advisories(severity="CRITICAL")
    assert len(crit) >= 2
    assert all(a.severity == AdvisorySeverity.CRITICAL for a in crit)


def test_mcp_risk_index(intel: ThreatIntelligenceEngine):
    ratings = intel.get_mcp_risk_index()
    assert len(ratings) >= 5
    # Risk scores should be sorted descending
    scores = [r.risk_score for r in ratings]
    assert scores == sorted(scores, reverse=True)
    # Bash executor should have highest risk (>0.9)
    assert ratings[0].risk_score > 0.90


def test_stix_taxii_bundle_generation(intel: ThreatIntelligenceEngine):
    bundle = intel.get_stix_taxii_bundle()
    assert bundle["type"] == "bundle"
    assert bundle["spec_version"] == "2.1"
    assert len(bundle["objects"]) >= 4
    for obj in bundle["objects"]:
        assert obj["type"] == "vulnerability"
        assert "x_cvss_score" in obj
        assert "external_references" in obj


def test_trending_leaderboard_and_summary(intel: ThreatIntelligenceEngine):
    trending = intel.get_trending_leaderboard()
    assert len(trending) >= 3
    assert trending[0].prevalence_pct > 80.0

    summary = intel.get_intel_summary()
    assert summary["total_advisories"] >= 4
    assert summary["critical_advisories"] >= 2
    assert summary["feed_protocol"] == "STIX 2.1 / TAXII 2.1 Compliant"

