"""
Control API routes for Streaming Real-Time Defense
"""


from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from shield_core.streaming import (
    default_streaming_guard,
    StreamAction,
    StreamingChunkVerdict,
)

router = APIRouter(prefix="/v1/streaming", tags=["streaming"])


class InspectBatchRequest(BaseModel):
    tokens: List[str] = Field(..., description="Ordered list of generated tokens")
    session_id: str = "sess-stream-001"
    agent_id: str = "agent-stream-worker"


class SimulateRequest(BaseModel):
    attack_type: str = Field(
        "destructive_exec",
        description="Type of attack stream: 'destructive_exec', 'injection', 'credential_leak', or 'benign'"
    )


@router.get("/metrics", response_model=Dict[str, Any])
def get_streaming_metrics():
    """Retrieve live performance metrics for real-time streaming defense."""
    return default_streaming_guard.get_streaming_metrics()


@router.get("/signatures", response_model=Dict[str, Any])
def list_kill_signatures():
    """List all registered zero-latency mid-stream abort patterns."""
    return {
        "signatures": [
            {"pattern": sig, "reason": reason}
            for sig, reason in default_streaming_guard.kill_signatures
        ],
        "redactions": [
            {"pattern": pat, "mask": rep}
            for pat, rep in default_streaming_guard.redact_patterns
        ],
    }


@router.post("/simulate", response_model=Dict[str, Any])
def simulate_stream(req: Optional[SimulateRequest] = None):
    """Simulate a token-by-token stream with real-time defense evaluation."""
    attack_type = req.attack_type if req else "destructive_exec"
    chunks = default_streaming_guard.simulate_attack_stream(attack_type=attack_type)
    aborted = any(c["action"] == "ABORT" for c in chunks)
    return {
        "scenario": attack_type,
        "total_chunks_streamed": len(chunks),
        "aborted_mid_stream": aborted,
        "chunks": chunks,
    }


@router.post("/inspect-batch", response_model=Dict[str, Any])
def inspect_batch(req: InspectBatchRequest):
    """Progressively inspect an incoming stream of tokens."""
    verdicts = list(
        default_streaming_guard.process_stream(
            req.tokens,
            session_id=req.session_id,
            agent_id=req.agent_id,
        )
    )
    return {
        "total_tokens": len(req.tokens),
        "tokens_evaluated": len(verdicts),
        "aborted": any(v.action == StreamAction.ABORT for v in verdicts),
        "verdicts": [v.to_dict() for v in verdicts],
    }

