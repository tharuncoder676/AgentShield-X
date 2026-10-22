"""
AgentShield-X MCP Security Router
Exposes endpoints for MCP server registration, tool-definition pinning,
rug-pull detection alerts, and inspection telemetry.
"""

from __future__ import annotations

import json
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from control_api.db import Database
from control_api.models import UserDTO
from control_api.routes.auth import get_current_user

router = APIRouter(prefix="/v1/mcp", tags=["mcp"])


def get_db() -> Database:
    return Database.get_instance()



class MCPServerDTO(BaseModel):
    id: str
    project_id: str
    name: str
    transport: str
    command_or_url: str
    status: str
    pinned_tools_count: int
    last_inspected_at: Optional[str]
    created_at: str


class CreateMCPServerRequest(BaseModel):
    name: str = Field(..., description="Human-readable server name")
    transport: str = Field(default="stdio", description="'stdio' or 'http_sse'")
    command_or_url: str = Field(..., description="Executable command line or endpoint URL")


class MCPPinDTO(BaseModel):
    id: str
    project_id: str
    server_id: str
    tool_name: str
    canonical_hash: str
    description_hash: str
    schema_hash: str
    description: Optional[str] = ""
    input_schema_json: str
    status: str
    pinned_at: str


class CreateMCPPinRequest(BaseModel):
    server_id: str
    tool_name: str
    canonical_hash: str
    description_hash: str
    schema_hash: str
    description: Optional[str] = ""
    input_schema: Optional[Dict[str, Any]] = None


class MCPAlertDTO(BaseModel):
    id: str
    project_id: str
    server_id: str
    tool_name: str
    pinned_hash: str
    observed_hash: str
    diff_summary: str
    severity: str
    action_taken: str
    created_at: str


class RecordMCPAlertRequest(BaseModel):
    server_id: str
    tool_name: str
    pinned_hash: str
    observed_hash: str
    diff_summary: str
    severity: str = "critical"
    action_taken: str = "blocked"


@router.get("/servers", response_model=List[MCPServerDTO])
def list_servers(
    project_id: Optional[str] = "default",
    current_user: UserDTO = Depends(get_current_user),
) -> List[MCPServerDTO]:
    rows = get_db().list_mcp_servers(project_id or "default")
    return [MCPServerDTO(**r) for r in rows]


@router.post("/servers", response_model=MCPServerDTO)
def create_server(
    req: CreateMCPServerRequest,
    project_id: Optional[str] = "default",
    current_user: UserDTO = Depends(get_current_user),
) -> MCPServerDTO:
    server_id = f"mcp_srv_{uuid.uuid4().hex[:8]}"
    created = get_db().create_or_update_mcp_server(
        server_id=server_id,
        project_id=project_id or "default",
        name=req.name,
        transport=req.transport,
        command_or_url=req.command_or_url,
    )
    return MCPServerDTO(**created)


@router.get("/pins", response_model=List[MCPPinDTO])
def list_pins(
    server_id: Optional[str] = Query(None),
    project_id: Optional[str] = "default",
    current_user: UserDTO = Depends(get_current_user),
) -> List[MCPPinDTO]:
    rows = get_db().list_mcp_pins(project_id or "default", server_id=server_id)
    return [MCPPinDTO(**r) for r in rows]


@router.post("/pins", response_model=MCPPinDTO)
def save_pin(
    req: CreateMCPPinRequest,
    project_id: Optional[str] = "default",
    current_user: UserDTO = Depends(get_current_user),
) -> MCPPinDTO:
    schema_str = json.dumps(req.input_schema or {}, sort_keys=True)
    saved = get_db().save_mcp_pin(
        project_id=project_id or "default",
        server_id=req.server_id,
        tool_name=req.tool_name,
        canonical_hash=req.canonical_hash,
        description_hash=req.description_hash,
        schema_hash=req.schema_hash,
        description=req.description or "",
        input_schema_json=schema_str,
    )
    return MCPPinDTO(**saved)


@router.delete("/pins/{tool_name}")
def delete_pin(
    tool_name: str,
    server_id: str = Query(...),
    project_id: Optional[str] = "default",
    current_user: UserDTO = Depends(get_current_user),
):
    deleted = get_db().delete_mcp_pin(project_id or "default", server_id, tool_name)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pin for tool '{tool_name}' on server '{server_id}' not found.",
        )
    return {"status": "deleted", "tool_name": tool_name}


@router.get("/alerts", response_model=List[MCPAlertDTO])
def list_alerts(
    project_id: Optional[str] = "default",
    current_user: UserDTO = Depends(get_current_user),
) -> List[MCPAlertDTO]:
    rows = get_db().list_mcp_alerts(project_id or "default")
    return [MCPAlertDTO(**r) for r in rows]


@router.post("/alerts", response_model=MCPAlertDTO)
def record_alert(
    req: RecordMCPAlertRequest,
    project_id: Optional[str] = "default",
    current_user: UserDTO = Depends(get_current_user),
) -> MCPAlertDTO:
    recorded = get_db().record_mcp_alert(
        project_id=project_id or "default",
        server_id=req.server_id,
        tool_name=req.tool_name,
        pinned_hash=req.pinned_hash,
        observed_hash=req.observed_hash,
        diff_summary=req.diff_summary,
        severity=req.severity,
        action_taken=req.action_taken,
    )
    return MCPAlertDTO(**recorded)


# =====================================================================
# Universal Agent & IDE Connectors Endpoints
# =====================================================================

class SetupConnectorRequest(BaseModel):
    target: str = Field(default="all", description="'claude', 'cursor', 'windsurf', 'continue', or 'all'")


@router.get("/connectors/status")
def get_connectors_status():
    """Returns real-time detection and protection status for all AI agent and IDE connectors."""
    from shield_mcp.connectors import ConnectorManager
    return ConnectorManager.get_all_connector_statuses()


@router.post("/connectors/setup")
def setup_connector(req: SetupConnectorRequest):
    """Automatically injects AgentShield-X native MCP server into Claude Desktop, Cursor, etc."""
    from shield_mcp.connectors import ConnectorManager
    target = req.target.lower()
    if target == "claude":
        ok, msg = ConnectorManager.auto_configure_claude_desktop()
        return {"target": "claude", "success": ok, "message": msg}
    elif target == "cursor":
        ok, msg = ConnectorManager.auto_configure_cursor()
        return {"target": "cursor", "success": ok, "message": msg}
    elif target == "windsurf":
        ok, msg = ConnectorManager.auto_configure_windsurf()
        return {"target": "windsurf", "success": ok, "message": msg}
    elif target == "continue":
        ok, msg = ConnectorManager.auto_configure_continue()
        return {"target": "continue", "success": ok, "message": msg}
    else:
        results = ConnectorManager.auto_configure_all()
        return {"target": "all", "results": results}


# =====================================================================
# Remote MCP SSE & JSON-RPC Endpoints (Claude Remote Connectors)
# =====================================================================

@router.get("/sse")
async def mcp_sse_stream():
    """
    Standard Model Context Protocol (MCP) Server-Sent Events (SSE) endpoint.
    Allows remote Claude Desktop and cloud agent connectors to link over HTTP.
    """
    from fastapi.responses import StreamingResponse
    import asyncio

    async def event_generator():
        # MCP SSE Handshake
        yield f"event: endpoint\ndata: /v1/mcp/messages\n\n"
        # Heartbeat ping every 15 seconds
        while True:
            await asyncio.sleep(15)
            yield f": ping\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/messages")
async def mcp_jsonrpc_messages(message: Dict[str, Any]):
    """
    Receives JSON-RPC 2.0 messages from remote MCP clients and executes native AgentShield tools.
    """
    from shield_mcp.server import AgentShieldMCPServer
    from shield_mcp.models import JSONRPCMessage

    server = AgentShieldMCPServer()
    msg = JSONRPCMessage(
        jsonrpc=message.get("jsonrpc", "2.0"),
        id=message.get("id"),
        method=message.get("method"),
        params=message.get("params"),
        result=message.get("result"),
        error=message.get("error"),
    )
    response = await server.handle_request(msg)
    return response or {"jsonrpc": "2.0", "result": "acknowledged"}


