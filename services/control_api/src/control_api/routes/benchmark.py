"""
Control API routes for AgentShield-X Open Benchmark Suite (AgentShield-Bench)
"""


from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from shield_core.benchmark import (
    default_benchmark_engine,
    BenchmarkScenario,
    BenchmarkRunResult,
)

router = APIRouter(prefix="/v1/benchmark", tags=["benchmark"])


class RunBenchmarkRequest(BaseModel):
    target_system: str = Field("AgentShield-X", description="Name of AI security harness to benchmark")
    filter_category: Optional[str] = Field(None, description="Category filter (Prompt Injection, RAG, etc.)")


@router.get("/scenarios", response_model=Dict[str, Any])
def list_scenarios():
    """Retrieve all curated benchmark attack vectors and benign control baselines."""
    scenarios = default_benchmark_engine.get_scenarios()
    return {
        "total": len(scenarios),
        "scenarios": [s.to_dict() for s in scenarios],
    }


@router.get("/leaderboard", response_model=Dict[str, Any])
def get_leaderboard():
    """Retrieve head-to-head empirical comparative industry rankings."""
    leaderboard = default_benchmark_engine.get_leaderboard()
    return {
        "benchmark": "AgentShield-Bench v1.0",
        "rankings": leaderboard,
    }


@router.post("/run", response_model=Dict[str, Any])
def run_benchmark(body: Optional[RunBenchmarkRequest] = None):
    """Execute standardized benchmark evaluation suite and compute empirical metrics."""
    target = body.target_system if body else "AgentShield-X"
    cat = body.filter_category if body else None
    result = default_benchmark_engine.run_benchmark(
        target_system=target,
        filter_category=cat,
    )
    return result.to_dict()

