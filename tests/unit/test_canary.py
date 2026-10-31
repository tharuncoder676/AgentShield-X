"""Unit tests for AgentShield A/B Policy Testing & Canary Deployments Engine.

Architect: Tharunkumar.S | AgentShield-X Security Labs
"""

import pytest
from shield_core.canary import (
    CanaryPolicyEngine,
    default_canary_engine,
    DeploymentHealth,
    CanarySplitMode,
)


def test_canary_initial_state():
    engine = CanaryPolicyEngine()
    dep = engine.active_deployment

    assert "v2.3.0" in dep.baseline_policy.version_id
    assert "v2.4.0" in dep.canary_policy.version_id
    assert dep.canary_percentage == 10
    assert dep.health == DeploymentHealth.HEALTHY
    assert dep.max_allowed_fp_rate_pct == 2.0


def test_traffic_split_evaluation():
    engine = CanaryPolicyEngine()

    routes = {"BASELINE": 0, "CANARY": 0}
    for i in range(100):
        res = engine.evaluate_request(
            request_id=f"req-sample-{i}",
            tool_name="web_search",
            arguments={"query": "test query"},
            is_tainted=False,
        )
        assert res["active_decision"] == "ALLOW"
        assert res["baseline_latency_ms"] < 5.0
        assert res["canary_latency_ms"] < 5.0
        routes[res["routed_to"]] += 1

    # Over 100 requests with 10% split, Canary should receive between 5 and 20 requests
    assert routes["CANARY"] > 0
    assert routes["BASELINE"] > 70


def test_canary_split_adjustment():
    engine = CanaryPolicyEngine()
    updated = engine.update_split_percentage(25)
    assert updated.canary_percentage == 25

    # Boundary clamping
    assert engine.update_split_percentage(150).canary_percentage == 100
    assert engine.update_split_percentage(-10).canary_percentage == 0


def test_canary_promotion():
    engine = CanaryPolicyEngine()
    canary_ver = engine.canary.version_id

    promoted = engine.promote_canary()
    assert promoted.health == DeploymentHealth.PROMOTED
    assert promoted.baseline_policy.version_id == canary_ver
    assert promoted.canary_percentage == 0


def test_manual_rollback():
    engine = CanaryPolicyEngine()
    rolled = engine.rollback(reason="Customer reported false positive on billing tool")

    assert rolled.health == DeploymentHealth.AUTOMATICALLY_ROLLED_BACK
    assert rolled.canary_percentage == 0
    assert "Customer reported" in rolled.rollback_reason

    # Subsequent evaluations route exclusively to baseline
    res = engine.evaluate_request("req-post-rollback", "send_email", {})
    assert res["routing"] == "BASELINE_ONLY"


def test_automatic_rollback_tripwire():
    engine = CanaryPolicyEngine()
    engine.active_deployment.max_allowed_fp_rate_pct = 2.0
    engine.active_deployment.metrics.total_requests = 100
    engine.active_deployment.metrics.canary_false_positives = 5  # 5% false positive rate

    # Next evaluation should trip the automatic rollback wire
    engine.evaluate_request("req-trip-test", "query_db", {})

    assert engine.active_deployment.health == DeploymentHealth.AUTOMATICALLY_ROLLED_BACK
    assert "Automated Rollback Triggered" in engine.active_deployment.rollback_reason

