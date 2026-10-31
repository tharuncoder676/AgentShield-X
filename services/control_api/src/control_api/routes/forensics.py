"""FastAPI Routes for Live Agent Forensics & Attack Replay Theater."""


from typing import Any, Dict
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from shield_core.forensics import default_forensics_recorder

router = APIRouter(prefix="/v1/forensics", tags=["forensics"])


class WhatIfRequest(BaseModel):
    incident_id: str
    policy_mode: str  # PERMISSIVE, BALANCED, ZERO_TRUST, STRICT


@router.get("/traces")
async def list_incident_traces():
    """Returns all recorded agent incident flight logs."""
    return default_forensics_recorder.list_traces()


@router.get("/traces/{incident_id}")
async def get_incident_trace(incident_id: str):
    """Returns frame-by-frame forensic playback sequence for a specific incident."""
    trace = default_forensics_recorder.get_trace(incident_id)
    if not trace:
        raise HTTPException(status_code=404, detail=f"Incident trace '{incident_id}' not found")
    return trace.to_dict()


@router.post("/what-if")
async def simulate_what_if_policy(payload: WhatIfRequest):
    """Replays historic attack frames through an alternative defense sensitivity matrix."""
    result = default_forensics_recorder.simulate_what_if(
        incident_id=payload.incident_id,
        policy_mode=payload.policy_mode,
    )
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/traces/{incident_id}/certificate")
async def get_forensic_certificate(incident_id: str):
    """Exports tamper-evident cryptographic evidence certificate with Merkle root hash."""
    cert = default_forensics_recorder.generate_cryptographic_certificate(incident_id)
    if "error" in cert:
        raise HTTPException(status_code=404, detail=cert["error"])
    return cert

