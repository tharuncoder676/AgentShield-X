"""
Live Immunity Score & Continuous Drift Monitoring API Routes
Tracks the agentic infrastructure immunity score (0-100%), historical drift trajectories,
and executes agentic chaos perturbation probes.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from control_api.db import Database
from shield_core.immunity import default_immunity_engine

router = APIRouter(prefix="/v1/immunity", tags=["immunity"])


class ChaosProbeRequest(BaseModel):
    agent_name: str = Field("Customer-Support-Agent", description="Target agent to evaluate")


@router.get("/score")
def get_current_score(project_id: str = Query("default")):
    db = Database.get_instance()
    point = default_immunity_engine.compute_current_score()
    db.record_immunity_drift_point(project_id, point.to_dict())
    return point.to_dict()


@router.get("/drift")
def get_drift_trajectory(project_id: str = Query("default"), limit: int = Query(30)):
    db = Database.get_instance()
    rows = db.list_immunity_drift_points(project_id=project_id, limit=limit)
    if not rows:
        return default_immunity_engine.get_history(limit=limit)
    return rows


@router.post("/chaos-probe")
def run_chaos_probe(req: ChaosProbeRequest):
    result = default_immunity_engine.run_chaos_probe(agent_name=req.agent_name)
    return result
