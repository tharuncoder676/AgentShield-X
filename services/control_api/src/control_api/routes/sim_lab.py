"""FastAPI Routes for Adversarial Agent Simulation Lab (War Game Playground)."""


from typing import Any, Dict, Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel

from shield_core.sim_lab import default_sim_lab

router = APIRouter(prefix="/v1/sim-lab", tags=["sim-lab"])


class RunWarGameRequest(BaseModel):
    difficulty_filter: Optional[str] = "ALL"
    max_scenarios: Optional[int] = 20


@router.get("/personas")
async def list_adversarial_personas():
    """Returns the 20 pre-built adversarial agent personas across 4 difficulty tiers."""
    return [p.to_dict() for p in default_sim_lab.personas]


@router.post("/run")
async def run_war_game_simulation(payload: Optional[RunWarGameRequest] = None):
    """Executes a live adversarial war game simulation against the AgentShield defense mesh."""
    difficulty = payload.difficulty_filter if payload else "ALL"
    max_scenarios = payload.max_scenarios if payload else 20
    scorecard = default_sim_lab.run_war_game(
        difficulty_filter=difficulty,
        max_scenarios=max_scenarios or 20,
    )
    return scorecard.to_dict()

