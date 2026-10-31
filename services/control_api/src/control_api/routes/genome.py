"""
AgentShield-X Agent Genome API Routes
Exposes endpoints for Agent Behavioral Biometrics, DNA Fingerprints, and Identity Theft Detection.
"""


from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from shield_core.agent_genome import default_agent_genome

router = APIRouter(prefix="/api/genome", tags=["genome"])


class InspectActionRequest(BaseModel):
    agent_id: str = Field(..., description="ID of the agent executing the action")
    tool_name: str = Field(..., description="Name of the tool invoked")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Tool invocation parameters")
    observed_latency_ms: float = Field(default=35.0, description="Measured execution time in milliseconds")


class RegisterGenomeRequest(BaseModel):
    agent_id: str
    agent_name: str
    role_description: str
    baseline_tools: List[str]
    mean_latency: float = 40.0
    arg_entropy: float = 3.5


@router.get("/list")
async def list_agent_genomes():
    """Lists all calibrated Agent Genome behavioral profiles."""
    return {
        "status": "success",
        "count": len(default_agent_genome.list_genomes()),
        "genomes": default_agent_genome.list_genomes(),
    }


@router.get("/history")
async def get_genome_history(limit: int = 50):
    """Retrieves recent biometric inspection results across all agents."""
    return {
        "status": "success",
        "history": default_agent_genome.get_inspection_history(limit=limit),
    }


@router.get("/{agent_id}")
async def get_agent_genome(agent_id: str):
    """Fetches the full 64-D behavioral DNA profile for a specific agent."""
    genome = default_agent_genome.get_genome(agent_id)
    if not genome:
        raise HTTPException(status_code=404, detail=f"Agent Genome '{agent_id}' not found.")
    return {
        "status": "success",
        "genome": genome,
    }


@router.post("/inspect")
async def inspect_agent_action(req: InspectActionRequest):
    """Evaluates an agent tool invocation against its behavioral baseline in real time."""
    result = default_agent_genome.inspect_agent_action(
        agent_id=req.agent_id,
        tool_name=req.tool_name,
        arguments=req.arguments,
        observed_latency_ms=req.observed_latency_ms,
    )
    return {
        "status": "success",
        "inspection": result.to_dict(),
    }


@router.post("/register")
async def register_agent_genome(req: RegisterGenomeRequest):
    """Registers and calibrates a new Agent Genome profile."""
    genome = default_agent_genome.register_agent(
        agent_id=req.agent_id,
        agent_name=req.agent_name,
        role=req.role_description,
        baseline_tools=req.baseline_tools,
        mean_latency=req.mean_latency,
        arg_entropy=req.arg_entropy,
    )
    return {
        "status": "success",
        "message": f"Agent Genome '{req.agent_id}' calibrated successfully.",
        "genome": genome.to_dict(),
    }

