"""Unit tests for AgentShield Compliance Certification Engine.

Architect: Tharunkumar.S | AgentShield-X Security Labs
"""

import pytest
from shield_core.compliance import (
    ComplianceEngine,
    default_compliance_engine,
    ControlStatus,
    FrameworkAuditReport,
)


def test_compliance_catalog_loading():
    engine = ComplianceEngine()
    controls = engine.get_all_controls()

    assert len(controls) >= 12
    frameworks = {c.framework for c in controls}
    assert "NIST AI RMF" in frameworks
    assert "EU AI Act" in frameworks
    assert "SOC 2 Type II" in frameworks
    assert "ISO/IEC 42001" in frameworks

    for c in controls:
        assert c.control_id
        assert c.requirement
        assert c.defense_mechanism
        assert c.evidence_proof
        assert c.status in (ControlStatus.VERIFIED_PASS, ControlStatus.EXCEEDS_MANDATE)


def test_framework_evaluation():
    engine = ComplianceEngine()
    report = engine.evaluate_framework("EU AI Act")

    assert isinstance(report, FrameworkAuditReport)
    assert report.framework_name == "EU AI Act"
    assert report.total_controls >= 3
    assert report.verified_controls == report.total_controls
    assert report.compliance_score_pct == 100.0
    assert report.status == "Certified Compliant"
    assert report.certificate_id.startswith("CERT-ASHIELD-")
    assert len(report.certificate_hash) == 64

    data = report.to_dict()
    assert "controls" in data
    assert len(data["controls"]) >= 3


def test_all_frameworks_passing():
    engine = ComplianceEngine()
    for fw in ["NIST AI RMF", "EU AI Act", "SOC 2", "ISO/IEC 42001"]:
        report = engine.evaluate_framework(fw)
        assert report.compliance_score_pct >= 95.0
        assert report.status == "Certified Compliant"


def test_executive_memorandum_generation():
    engine = ComplianceEngine()
    memo = engine.generate_executive_memorandum()

    assert "# AGENTSHIELD-X ENTERPRISE COMPLIANCE & TRUST CERTIFICATE" in memo
    assert "NIST AI RMF" in memo
    assert "EU AI Act" in memo
    assert "SOC 2" in memo
    assert "ISO/IEC 42001" in memo
    assert "Tharunkumar.S" in memo
    assert "Verification Seal:" in memo
    assert "SHA-256:" in memo
