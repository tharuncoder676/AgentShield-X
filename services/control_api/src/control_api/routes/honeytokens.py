"""
Honeytokens and Dynamic Honeypot API Routes
Provides domain-tailored honeypots, canary token issuance, and outbound exfiltration detection.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from control_api.db import Database
from shield_core.honeytokens import default_honeytoken_engine

router = APIRouter(prefix="/v1/honeytokens", tags=["honeytokens"])


class GenerateDecoysRequest(BaseModel):
    project_id: str = "default"
    domain: str = Field("general", description="Target domain: finance, healthcare, cloudops, general")
    existing_tools: List[str] = Field(default_factory=list, description="Currently installed tools")


class InspectSinkRequest(BaseModel):
    project_id: str = "default"
    sink_name: str = Field(..., description="Outbound sink name: send_email, webhook_post, execute_shell")
    payload_text: str = Field(..., description="Payload content being transmitted")
    agent_id: str = Field("agent-unknown", description="Agent ID performing the transmission")


@router.post("/generate")
def generate_decoys(req: GenerateDecoysRequest):
    decoys = default_honeytoken_engine.discover_and_deploy_decoys(
        target_tools=req.existing_tools,
        domain_hint=req.domain,
    )
    db = Database.get_instance()
    for d in decoys:
        db.record_honeytoken_canary(
            project_id=req.project_id,
            canary_data={
                "canary_token": d["canary_token"],
                "decoy_tool": d["name"],
                "domain": d["domain"],
                "status": "armed",
            },
        )
    return {"domain": req.domain, "count": len(decoys), "deployed_decoys": decoys}


@router.post("/inspect")
def inspect_sink(req: InspectSinkRequest):
    triggered, tripwire_event = default_honeytoken_engine.inspect_outbound_sink(
        sink_name=req.sink_name,
        payload_text=req.payload_text,
        agent_id=req.agent_id,
    )
    if triggered and tripwire_event:
        db = Database.get_instance()
        db.trigger_honeytoken_canary(tripwire_event["canary_token"], req.sink_name)

    return {
        "canary_detected": triggered,
        "action": "SEVER_SOCKET_AND_CONTAIN" if triggered else "ALLOW",
        "tripwire_event": tripwire_event,
    }


@router.get("/canaries")
def list_canaries(project_id: str = Query("default")):
    db = Database.get_instance()
    rows = db.list_honeytoken_canaries(project_id=project_id)
    if not rows:
        return default_honeytoken_engine.list_canaries()
    return rows


@router.get("/tripwires")
def list_tripwires():
    return default_honeytoken_engine.list_tripwire_events()
