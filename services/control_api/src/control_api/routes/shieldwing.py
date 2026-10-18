"""
AgentShield-X Shieldwing AI Security Copilot API Router
Exposes streaming SSE and structured endpoints for plain-language decision explanations,
incident triage, and Rego policy proposals with dogfooding protection and NVIDIA NIM support.
"""

from __future__ import annotations

import sys
import os
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from pathlib import Path
REPO_ROOT = Path(__file__).resolve().parents[5]
for extra_p in [
    REPO_ROOT / "services" / "shieldwing" / "src",
    REPO_ROOT / "detectors" / "rules" / "src",
    REPO_ROOT / "detectors" / "pii" / "src",
]:
    p_str = str(extra_p)
    if p_str not in sys.path:
        sys.path.insert(0, p_str)

from control_api.models import UserDTO
from control_api.routes.auth import get_current_user
from shieldwing.service import ShieldwingService

router = APIRouter(prefix="/v1/shieldwing", tags=["shieldwing"])
shieldwing_service = ShieldwingService()


def _save_env_var(key: str, value: str) -> None:
    """Helper to persist or update key-value in .env file in REPO_ROOT."""
    env_file = REPO_ROOT / ".env"
    lines = []
    found = False
    if env_file.exists():
        try:
            with open(env_file, "r", encoding="utf-8") as f:
                lines = f.readlines()
            new_lines = []
            for line in lines:
                if line.startswith(f"{key}=") or line.startswith(f"export {key}="):
                    new_lines.append(f"{key}={value}\n")
                    found = True
                else:
                    new_lines.append(line)
            lines = new_lines
        except Exception:
            lines = []

    if not found:
        lines.append(f"{key}={value}\n")

    try:
        with open(env_file, "w", encoding="utf-8") as f:
            f.writelines(lines)
    except Exception:
        pass


class ShieldwingChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ShieldwingExplainRequest(BaseModel):
    decision_id: Optional[str] = None
    event_id: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None


class ShieldwingTriageRequest(BaseModel):
    incident_id: str
    severity: Optional[str] = None


class ShieldwingDraftPolicyRequest(BaseModel):
    instruction: str = Field(..., min_length=3)
    target_tool: Optional[str] = None


class ShieldwingConfigRequest(BaseModel):
    api_key: Optional[str] = None
    model: Optional[str] = None
    provider: Optional[str] = None


@router.get("/config")
async def get_shieldwing_config(
    current_user: UserDTO = Depends(get_current_user),
):
    """Returns current Shieldwing LLM provider and available models."""
    return shieldwing_service.get_config()


@router.post("/config")
async def update_shieldwing_config(
    req: ShieldwingConfigRequest,
    current_user: UserDTO = Depends(get_current_user),
):
    """Updates Shieldwing provider credentials (e.g. NVIDIA API Key) and model."""
    if req.api_key:
        os.environ["NVIDIA_API_KEY"] = req.api_key
        _save_env_var("NVIDIA_API_KEY", req.api_key)
    if req.model:
        os.environ["NVIDIA_MODEL"] = req.model
        _save_env_var("NVIDIA_MODEL", req.model)
    if req.provider:
        os.environ["SHIELDWING_PROVIDER"] = req.provider
        _save_env_var("SHIELDWING_PROVIDER", req.provider)

    return shieldwing_service.configure_provider(
        provider_name=req.provider or "nvidia",
        api_key=req.api_key,
        model=req.model,
    )


@router.post("/test-connection")
async def test_shieldwing_connection(
    req: ShieldwingConfigRequest,
    current_user: UserDTO = Depends(get_current_user),
):
    """Verifies that the configured NVIDIA NIM endpoint and API key work properly."""
    api_key = req.api_key or os.getenv("NVIDIA_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="NVIDIA API Key is missing. Please provide a key.")

    model = req.model or os.getenv("NVIDIA_MODEL", "meta/llama-3.3-70b-instruct")

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=api_key,
            timeout=20.0,
        )
        completion = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "Ping: Verify connection. Reply with 'READY'."}],
            max_tokens=20,
            temperature=0.0,
        )
        reply = completion.choices[0].message.content if completion.choices else ""
        return {
            "status": "connected",
            "provider": "NVIDIA NIM",
            "model": model,
            "sample_response": (reply or "").strip(),
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"NVIDIA NIM Connection Failed: {str(e)}",
        )


@router.post("/chat")
async def chat_with_shieldwing(
    req: ShieldwingChatRequest,
    request: Request,
    current_user: UserDTO = Depends(get_current_user),
):
    """
    Interacts with Shieldwing Security Copilot.
    If 'Accept: text/event-stream' header is present, returns a real-time SSE stream.
    Otherwise returns a structured JSON payload with proposals and evidence citations.
    """
    tenant_id = getattr(current_user, "org_id", getattr(current_user, "id", "tenant_default"))
    accept_header = request.headers.get("accept", "")

    user_context = {
        "user_id": current_user.id,
        "user_email": current_user.email,
        "user_role": current_user.role,
        "org_id": getattr(current_user, "org_id", "default"),
    }
    enriched_context = {**(req.context or {}), **user_context}

    if "text/event-stream" in accept_header:
        generator = shieldwing_service.stream_chat(
            tenant_id=tenant_id,
            message=req.message,
            context=enriched_context,
        )
        return StreamingResponse(generator, media_type="text/event-stream")

    result = await shieldwing_service.chat(
        tenant_id=tenant_id,
        message=req.message,
        context=enriched_context,
    )
    return result



@router.post("/explain")
async def explain_decision(
    req: ShieldwingExplainRequest,
    current_user: UserDTO = Depends(get_current_user),
):
    """Explains a security decision citing real detector evidence and taint provenance."""
    tenant_id = getattr(current_user, "org_id", getattr(current_user, "id", "tenant_default"))
    prompt = f"Explain decision {req.decision_id or 'latest'} and why the security boundary blocked this action."
    return await shieldwing_service.chat(
        tenant_id=tenant_id,
        message=prompt,
        context={"view": "incident", "decision_id": req.decision_id},
    )


@router.post("/triage")
async def triage_incident(
    req: ShieldwingTriageRequest,
    current_user: UserDTO = Depends(get_current_user),
):
    """Diagnoses incident root cause, severity classification, and blast containment."""
    tenant_id = getattr(current_user, "org_id", getattr(current_user, "id", "tenant_default"))
    prompt = f"Triage incident {req.incident_id} with severity {req.severity or 'unknown'}."
    return await shieldwing_service.chat(
        tenant_id=tenant_id,
        message=prompt,
        context={"view": "incident", "incident_id": req.incident_id},
    )


@router.post("/draft-policy")
async def draft_policy(
    req: ShieldwingDraftPolicyRequest,
    current_user: UserDTO = Depends(get_current_user),
):
    """Drafts an OPA Rego policy proposal from natural language instructions."""
    tenant_id = getattr(current_user, "org_id", getattr(current_user, "id", "tenant_default"))
    prompt = f"Draft a policy rule to: {req.instruction} (Target tool: {req.target_tool or 'any'})"
    return await shieldwing_service.chat(
        tenant_id=tenant_id,
        message=prompt,
        context={"view": "policy"},
    )
