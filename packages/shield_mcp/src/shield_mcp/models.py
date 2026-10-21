"""
AgentShield-X MCP Data Contracts and Protocol Schemas
Defines typed models for JSON-RPC 2.0 messages, MCP tools, cryptographic pins,
rug-pull detection events, and proxy configurations.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Literal, Optional, Union
from shield_core.compat import BaseModel, Field


class MCPMessageType(str, Enum):
    REQUEST = "request"
    RESPONSE = "response"
    NOTIFICATION = "notification"
    ERROR = "error"


class JSONRPCMessage(BaseModel):
    """Base JSON-RPC 2.0 protocol envelope."""
    jsonrpc: str = Field(default="2.0")
    id: Optional[Union[str, int]] = None
    method: Optional[str] = None
    params: Optional[Dict[str, Any]] = None
    result: Optional[Any] = None
    error: Optional[Dict[str, Any]] = None


class MCPToolDefinition(BaseModel):
    """Represents a tool exposed by an MCP server."""
    name: str = Field(..., description="Unique tool name")
    description: Optional[str] = Field(default="", description="Human/LLM-readable tool description")
    inputSchema: Dict[str, Any] = Field(
        default_factory=dict,
        description="JSON Schema defining acceptable arguments",
    )


class ToolPinStatus(str, Enum):
    PINNED = "pinned"
    QUARANTINED = "quarantined"
    UNPINNED = "unpinned"
    MUTATED = "mutated"


class ToolPin(BaseModel):
    """
    Cryptographic pin storing canonical hash of an approved MCP tool definition.
    Guarantees that upstream servers cannot alter descriptions or schemas without detection.
    """
    tool_name: str
    canonical_hash: str = Field(..., description="SHA-256 hash of canonical normalized tool definition")
    description_hash: str = Field(..., description="SHA-256 hash of tool description string")
    schema_hash: str = Field(..., description="SHA-256 hash of normalized inputSchema")
    description: str = Field(default="")
    input_schema: Dict[str, Any] = Field(default_factory=dict)
    pinned_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    status: ToolPinStatus = Field(default=ToolPinStatus.PINNED)
    notes: Optional[str] = None


class RugPullSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RugPullAlert(BaseModel):
    """
    Emitted when an upstream MCP server mutates a tool definition after it was pinned.
    """
    alert_id: str = Field(default_factory=lambda: f"rugpull_{uuid.uuid4().hex[:10]}")
    tool_name: str
    server_identifier: str = Field(default="upstream-server")
    pinned_hash: str
    observed_hash: str
    diff_summary: str = Field(..., description="Summary of alterations (e.g. description injection, schema parameter added)")
    severity: RugPullSeverity = Field(default=RugPullSeverity.CRITICAL)
    action_taken: Literal["blocked", "restored_to_pin", "alert_only", "dropped"] = "blocked"
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    observed_description: Optional[str] = None
    observed_schema: Optional[Dict[str, Any]] = None


class ProxyMode(str, Enum):
    PIN = "pin"          # Learn and write pins to lockfile
    OBSERVE = "observe"  # Alert on changes but pass through
    ENFORCE = "enforce"  # Block or restore mutated tools; fail closed


class ProxyAction(str, Enum):
    FORWARD = "forward"
    MODIFY = "modify"
    BLOCK = "block"
    ESCALATE = "escalate"


class InterceptorResult(BaseModel):
    """Action outcome from a security interceptor in the MCP pipeline."""
    action: ProxyAction = Field(default=ProxyAction.FORWARD)
    message: Optional[JSONRPCMessage] = None
    alert: Optional[RugPullAlert] = None
    reasons: List[str] = Field(default_factory=list)
