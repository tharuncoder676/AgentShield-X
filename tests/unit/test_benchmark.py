"""
Unit tests for AgentShield-X Open Benchmark Suite (AgentShield-Bench)
"""

import pytest
from shield_core.benchmark import (
    AgentShieldBenchEngine,
    BenchmarkScenario,
    BenchmarkRunResult,
    BenchmarkCategory,
)


@pytest.fixture
def bench() -> AgentShieldBenchEngine:
    return AgentShieldBenchEngine()


def test_default_scenarios_exist(bench: AgentShieldBenchEngine):
    scenarios = bench.get_scenarios()
    assert len(scenarios) >= 20
    # Verify presence of benign control vectors
    benign = [s for s in scenarios if not s.is_malicious]
    assert len(benign) >= 7
    # Verify malicious attack vectors
    malicious = [s for s in scenarios if s.is_malicious]
    assert len(malicious) >= 10


def test_run_benchmark_evaluation(bench: AgentShieldBenchEngine):
    result = bench.run_benchmark(target_system="AgentShield-X")
    assert result.total_scenarios_evaluated >= 20
    assert result.interception_rate_pct >= 95.0
    assert result.attack_success_rate_pct <= 5.0
    assert result.false_positive_rate_pct == 0.0
    assert result.avg_latency_ms < 5.0
    assert result.scenarios_passed == result.total_scenarios_evaluated
    assert len(result.category_scores) >= 8


def test_filter_benchmark_category(bench: AgentShieldBenchEngine):
    res_prompt = bench.run_benchmark(filter_category="Prompt Injection")
    assert res_prompt.total_scenarios_evaluated == 2
    assert res_prompt.scenarios_passed == 2


def test_comparative_leaderboard(bench: AgentShieldBenchEngine):
    lb = bench.get_leaderboard()
    assert len(lb) == 5
    assert lb[0]["system_name"].startswith("AgentShield-X")
    assert lb[0]["rank"] == 1
    assert lb[0]["grade"] == "A+"
    assert lb[-1]["system_name"].startswith("Unprotected")
    assert lb[-1]["grade"] == "F"

