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
    list_available_datasets,
    execute_dataset_benchmark,
)

router = APIRouter(prefix="/v1/benchmark", tags=["benchmark"])


class RunBenchmarkRequest(BaseModel):
    target_system: str = Field("AgentShield-X", description="Name of AI security harness to benchmark")
    filter_category: Optional[str] = Field(None, description="Category filter (Prompt Injection, RAG, etc.)")


class RunDatasetBenchmarkRequest(BaseModel):
    dataset_id: str = Field("injections_held_out", description="Dataset identifier or relative file path")
    limit: Optional[int] = Field(None, description="Max samples to evaluate (optional)")


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


@router.get("/datasets", response_model=Dict[str, Any])
def get_datasets():
    """Retrieve list of physical ground-truth datasets available for empirical benchmarking."""
    datasets = list_available_datasets()
    return {
        "total": len(datasets),
        "datasets": datasets,
    }


@router.post("/run-dataset", response_model=Dict[str, Any])
def run_dataset_benchmark(body: Optional[RunDatasetBenchmarkRequest] = None):
    """Execute live multi-rail AgentShield-X evaluation against selected physical ground-truth dataset."""
    target_id = body.dataset_id if body else "injections_held_out"
    sample_limit = body.limit if body else None
    try:
        report = execute_dataset_benchmark(
            dataset_id_or_path=target_id,
            limit=sample_limit,
        )
        return report
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


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

