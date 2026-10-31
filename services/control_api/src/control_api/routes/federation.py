"""FastAPI Routes for AgentShield Federation Intelligence Mesh."""


from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from shield_core.federation import (
    default_mesh_manager,
    ThreatCategory,
    ThreatSeverity,
)

router = APIRouter(prefix="/v1/federation", tags=["federation"])


class QueryMeshRequest(BaseModel):
    query: str


class PublishThreatRequest(BaseModel):
    raw_pattern: str
    category: str
    severity: str
    affected_tools: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class AttestSignatureRequest(BaseModel):
    signature_id: str
    attesting_node_id: str


@router.get("/mesh")
async def get_mesh_status():
    """Retrieve active peer nodes, overall telemetry, and bloom filter stats."""
    telemetry = default_mesh_manager.get_mesh_telemetry()
    nodes = [n.to_dict() for n in default_mesh_manager.nodes.values()]
    return {
        "telemetry": telemetry,
        "nodes": nodes,
    }


@router.get("/heatmap")
async def get_global_heatmap():
    """Regional threat velocity matrix."""
    return default_mesh_manager.get_global_heatmap()


@router.get("/signatures")
async def get_signatures(consensus_only: bool = Query(False)):
    """List all cryptographically-attested global threat signatures."""
    sigs = list(default_mesh_manager.signatures.values())
    if consensus_only:
        sigs = [s for s in sigs if s.consensus_verified]
    return [s.to_dict() for s in sigs]


@router.post("/query")
async def query_mesh(payload: QueryMeshRequest):
    """Sub-millisecond privacy-preserving bloom query against the global threat mesh."""
    if not payload.query.strip():
        raise HTTPException(status_code=400, detail="Query text cannot be empty")
    return default_mesh_manager.query_mesh(payload.query)


@router.post("/publish")
async def publish_threat(payload: PublishThreatRequest):
    """Publishes a sanitized, hashed zero-day threat into the federation mesh."""
    try:
        category = ThreatCategory(payload.category.lower())
    except ValueError:
        category = ThreatCategory.PROMPT_INJECTION

    try:
        severity = ThreatSeverity(payload.severity.lower())
    except ValueError:
        severity = ThreatSeverity.HIGH

    sig = default_mesh_manager.publish_threat(
        raw_pattern=payload.raw_pattern,
        category=category,
        severity=severity,
        affected_tools=payload.affected_tools or [],
        metadata=payload.metadata or {},
    )
    return {
        "status": "published",
        "signature": sig.to_dict(),
    }


@router.post("/attest")
async def attest_signature(payload: AttestSignatureRequest):
    """Peer node consensus voting on threat validity."""
    success = default_mesh_manager.attest_signature(
        signature_id=payload.signature_id,
        attesting_node_id=payload.attesting_node_id,
    )
    if not success:
        raise HTTPException(status_code=404, detail="Signature not found")
    sig = default_mesh_manager.signatures[payload.signature_id]
    return {
        "status": "attested",
        "attestation_count": sig.attestation_count,
        "consensus_verified": sig.consensus_verified,
    }

