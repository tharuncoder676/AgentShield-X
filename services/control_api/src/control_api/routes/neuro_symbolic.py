"""FastAPI Routes for Neuro-Symbolic Tool Call Chain Reasoning Engine."""


from typing import Any, Dict, List, Optional
from fastapi import APIRouter
from pydantic import BaseModel

from shield_core.neuro_symbolic import default_chain_engine

router = APIRouter(prefix="/v1/neuro-symbolic", tags=["neuro-symbolic"])


class EvaluateStepRequest(BaseModel):
    session_id: str = "interactive-demo"
    tool_name: str
    arguments: Optional[Dict[str, Any]] = None


class ResetSessionRequest(BaseModel):
    session_id: str


@router.get("/signatures")
async def get_attack_chain_signatures():
    """Returns catalog of recognizable multi-step attack chain patterns."""
    return [sig.to_dict() for sig in default_chain_engine.signatures]


@router.get("/chains")
async def list_active_session_chains():
    """Returns active tool call DAG histories per session."""
    return {
        session_id: [node.to_dict() for node in nodes]
        for session_id, nodes in default_chain_engine.session_chains.items()
    }


@router.post("/evaluate")
async def evaluate_chain_step(payload: EvaluateStepRequest):
    """Appends tool invocation to session DAG and evaluates multi-step intent chain."""
    result = default_chain_engine.append_and_evaluate(
        session_id=payload.session_id,
        tool_name=payload.tool_name,
        arguments=payload.arguments or {},
    )
    return {
        "session_id": payload.session_id,
        "result": result.to_dict(),
    }


@router.post("/reset")
async def reset_session_chain(payload: ResetSessionRequest):
    """Clears tool call DAG history for a specific session."""
    default_chain_engine.reset_session(payload.session_id)
    return {"status": "SESSION_CHAIN_RESET", "session_id": payload.session_id}

