"""FastAPI Routes for A/B Policy Testing & Canary Deployments Hub."""


import time
from typing import Any, Dict, List, Optional
from fastapi import APIRouter
from pydantic import BaseModel

from shield_core.canary import default_canary_engine

router = APIRouter(prefix="/v1/canary", tags=["canary"])


class SplitPercentageRequest(BaseModel):
    percentage: int


class RollbackRequest(BaseModel):
    reason: Optional[str] = "Manual operator initiated rollback"


class EvaluateRequest(BaseModel):
    tool_name: str = "execute_sql"
    arguments: Optional[Dict[str, Any]] = None
    is_tainted: Optional[bool] = False


@router.get("/status")
async def get_canary_status():
    """Returns the live A/B canary deployment status, comparative metrics, and health."""
    dep = default_canary_engine.active_deployment
    return {
        "deployment": dep.to_dict(),
        "recent_evaluations": default_canary_engine.recent_evaluations[:20],
    }


@router.post("/split")
async def set_split_percentage(payload: SplitPercentageRequest):
    """Adjusts the live Canary traffic split percentage (0-100%)."""
    updated = default_canary_engine.update_split_percentage(payload.percentage)
    return updated.to_dict()


@router.post("/promote")
async def promote_canary():
    """Promotes candidate canary policy to the 100% production baseline."""
    promoted = default_canary_engine.promote_canary()
    return {
        "status": "PROMOTED_SUCCESSFULLY",
        "deployment": promoted.to_dict(),
    }


@router.post("/rollback")
async def rollback_canary(payload: Optional[RollbackRequest] = None):
    """Aborts canary deployment and reverts 100% of traffic to the stable baseline."""
    reason = payload.reason if payload else "Operator initiated rollback"
    rolled = default_canary_engine.rollback(reason=reason)
    return {
        "status": "ROLLED_BACK_SUCCESSFULLY",
        "deployment": rolled.to_dict(),
    }


@router.post("/evaluate")
async def evaluate_traffic(payload: EvaluateRequest):
    """Routes an inline evaluation request through the A/B traffic splitter."""
    req_id = f"req-{int(time.time() * 1000)}"
    import time
    result = default_canary_engine.evaluate_request(
        request_id=req_id,
        tool_name=payload.tool_name,
        arguments=payload.arguments or {},
        is_tainted=payload.is_tainted or False,
    )
    return result
