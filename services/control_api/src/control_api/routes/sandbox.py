"""
Ephemeral Sandbox Isolation API Routes
Executes high-risk tools in sub-second isolated containers with strict seccomp & egress filtering.
"""

from typing import Any, Dict, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

from shield_core.sandbox import default_sandbox_guard

router = APIRouter(prefix="/v1/sandbox", tags=["sandbox"])


class SandboxExecuteRequest(BaseModel):
    tool_name: str = Field(..., description="High-risk tool being executed: execute_shell, python_eval")
    command_or_code: str = Field(..., description="Script or command string")
    params: Optional[Dict[str, Any]] = None


@router.post("/execute")
def execute_in_sandbox(req: SandboxExecuteRequest):
    result = default_sandbox_guard.execute_in_sandbox(
        tool_name=req.tool_name,
        command_or_code=req.command_or_code,
        params=req.params,
    )
    return {
        "execution_id": result.execution_id,
        "tool_name": result.tool_name,
        "status": result.status,
        "exit_code": result.exit_code,
        "stdout": result.stdout,
        "stderr": result.stderr,
        "duration_ms": result.duration_ms,
        "violations": result.violations,
        "sanitized_envs_count": result.isolated_env_sanitized_count,
    }
