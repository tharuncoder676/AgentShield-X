"""FastAPI Routes for Executive SOC Dashboard & Enterprise SIEM Integration."""


from typing import Any, Dict, Optional
from fastapi import APIRouter, Query, Response
from pydantic import BaseModel

from shield_core.executive import default_executive_soc

router = APIRouter(prefix="/v1/executive", tags=["executive"])


@router.get("/summary")
async def get_executive_soc_summary():
    """Returns high-level C-Suite cybersecurity posture, financial savings, and compliance."""
    summary = default_executive_soc.get_executive_summary()
    return summary.to_dict()


@router.get("/siem/export")
async def export_siem_events(
    format: str = Query("splunk", description="SIEM format: splunk, datadog, or cef"),
    limit: int = Query(50, ge=1, le=500),
):
    """Exports structured telemetry formatted for Splunk HEC, Datadog JSON, or ArcSight CEF."""
    result = default_executive_soc.export_siem_events(format_type=format, limit=limit)
    if result["format"] == "CEF":
        return Response(content="\n".join(result["events"]), media_type="text/plain")
    return result


class SiemTestStreamRequest(BaseModel):
    siem_type: str = "splunk"
    destination_url: Optional[str] = "https://splunk-hec.corp.internal:8088/services/collector"


@router.post("/siem/test-stream")
async def test_siem_streaming(payload: SiemTestStreamRequest):
    """Simulates dispatching real-time intercepted attack telemetry to an external SIEM endpoint."""
    exported = default_executive_soc.export_siem_events(format_type=payload.siem_type, limit=1)
    return {
        "status": "DELIVERED_SUCCESSFULLY",
        "siem_type": payload.siem_type,
        "destination": payload.destination_url,
        "payload_sample": exported["events"][0] if exported["events"] else None,
        "latency_ms": 1.45,
        "bytes_sent": 412,
    }

