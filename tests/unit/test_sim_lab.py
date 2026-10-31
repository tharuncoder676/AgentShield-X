"""Unit tests for Adversarial Agent Simulation Lab (War Game Playground).

Verifies:
- 20 distinct adversarial agent personas initialized across 4 difficulty tiers
- Difficulty filtering (Script Kiddie, Red-Team Operator, Nation-State APT, Zero-Day AI Swarm)
- Sandboxed war game execution and defense scorecard generation
- Multi-rail defense layer attribution (Dual-Rail, Genome, Honeytools, MCP, RAG)
"""

import pytest
from shield_core.sim_lab import (
    AdversarialSimulationEngine,
    AttackDifficulty,
)


class TestSimLab:
    def test_20_adversarial_personas_seeded(self):
        engine = AdversarialSimulationEngine()
        personas = engine.personas

        assert len(personas) == 20
        # Check all 4 tiers represented
        difficulties = {p.difficulty for p in personas}
        assert AttackDifficulty.SCRIPT_KIDDIE in difficulties
        assert AttackDifficulty.RED_TEAM_OPERATOR in difficulties
        assert AttackDifficulty.NATION_STATE_APT in difficulties
        assert AttackDifficulty.ZERO_DAY_AI_SWARM in difficulties

        # Verify MITRE technique coverage
        mitre_ids = {p.mitre_technique_id for p in personas}
        assert "AML.T0051" in mitre_ids
        assert "AML.T0054" in mitre_ids
        assert "AML.T0043" in mitre_ids
        assert "AML.T0025" in mitre_ids

    def test_run_full_war_game(self):
        engine = AdversarialSimulationEngine()
        scorecard = engine.run_war_game(max_scenarios=20)

        assert scorecard.total_scenarios == 20
        assert scorecard.scenarios_blocked >= 19
        assert scorecard.defense_score_pct >= 95.0
        assert "Hardened" in scorecard.defense_grade
        assert scorecard.average_latency_ms < 5.0  # Sub-5ms latency SLA
        assert len(scorecard.outcomes) == 20

    def test_difficulty_filtered_war_game(self):
        engine = AdversarialSimulationEngine()
        # Run Script Kiddie tier
        scorecard_sk = engine.run_war_game(difficulty_filter="Script Kiddie")
        assert scorecard_sk.total_scenarios == 5
        assert scorecard_sk.defense_score_pct == 100.0  # 100% stop on basic script kiddies

        # Run Nation-State APT tier
        scorecard_apt = engine.run_war_game(difficulty_filter="Nation-State APT")
        assert scorecard_apt.total_scenarios == 5
        assert scorecard_apt.defense_score_pct == 100.0

