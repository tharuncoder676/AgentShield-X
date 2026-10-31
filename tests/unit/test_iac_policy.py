"""
Unit tests for AgentShield-X Infrastructure-as-Code (IaC) Policy Definitions Engine
"""

import pytest
from shield_core.iac_policy import (
    IaCPolicyEngine,
    PolicyLintResult,
    SAMPLE_IAC_POLICY_YAML,
)


@pytest.fixture
def engine() -> IaCPolicyEngine:
    return IaCPolicyEngine()


def test_sample_policy_lint_valid(engine: IaCPolicyEngine):
    res = engine.lint_yaml(SAMPLE_IAC_POLICY_YAML)
    assert res.valid is True
    assert res.policy_name == "enterprise-support-guard"
    assert res.version == "1.4.0"
    assert res.rule_count == 4
    assert res.security_score >= 90
    assert len(res.errors) == 0
    assert len(res.checksum_sha256) == 64


def test_lint_critical_bash_allow_failure(engine: IaCPolicyEngine):
    unsafe_yaml = """apiVersion: agentshield.security/v1alpha1
kind: AgentSecurityPolicy
metadata:
  name: dangerous-developer-agent
  version: "1.0.0"

spec:
  enforcement_mode: enforce
  tool_rules:
    - tool_name: "bash_*"
      action: allow
"""
    res = engine.lint_yaml(unsafe_yaml)
    assert res.valid is False
    assert any("bash" in err.lower() for err in res.errors)
    assert res.security_score < 70


def test_lint_missing_kind_and_metadata(engine: IaCPolicyEngine):
    malformed_yaml = """foo: bar
unrelated_key: value
"""
    res = engine.lint_yaml(malformed_yaml)
    assert res.valid is False
    assert any("apiVersion" in err for err in res.errors)
    assert any("kind" in err.lower() for err in res.errors)


def test_terraform_and_helm_export(engine: IaCPolicyEngine):
    tf = engine.export_terraform("enterprise-support-guard")
    assert 'resource "agentshield_security_policy"' in tf
    assert "enterprise_support_guard" in tf

    helm = engine.export_helm_values("enterprise-support-guard")
    assert "agentshield:" in helm
    assert "enterprise-support-guard" in helm
    assert "mode: enforce" in helm


def test_apply_policy_lifecycle(engine: IaCPolicyEngine):
    valid_custom = """apiVersion: agentshield.security/v1alpha1
kind: AgentSecurityPolicy
metadata:
  name: finance-auditor-guard
  version: "2.1.0"
spec:
  enforcement_mode: enforce
  rate_limits:
    max_tool_calls_per_minute: 20
  egress_filters:
    blocked_cidrs:
      - "169.254.169.254/32"
  tool_rules:
    - tool_name: "transfer_funds"
      action: block
"""
    applied = engine.apply_policy(valid_custom)
    assert applied["success"] is True
    assert applied["policy_name"] == "finance-auditor-guard"
    assert applied["version"] == "2.1.0"

    all_policies = engine.list_policies()
    assert any(p["name"] == "finance-auditor-guard" for p in all_policies)

