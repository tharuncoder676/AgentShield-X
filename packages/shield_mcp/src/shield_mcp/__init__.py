"""
AgentShield-X MCP Security Package
Next-generation security proxy and tool rug-pull guard for Model Context Protocol agents.
"""

from shield_mcp.hasher import canonical_json, compute_tool_pin, diff_tool_definitions
from shield_mcp.interceptors import (
    BaseMCPInterceptor,
    ResourceTaintInterceptor,
    RugPullGuardInterceptor,
    ToolCallPolicyInterceptor,
    ToolPoisoningInterceptor,
)
from shield_mcp.models import (
    InterceptorResult,
    JSONRPCMessage,
    MCPToolDefinition,
    ProxyAction,
    ProxyMode,
    RugPullAlert,
    RugPullSeverity,
    ToolPin,
    ToolPinStatus,
)
from shield_mcp.pin_store import BasePinStore, FilePinStore, InMemoryPinStore
from shield_mcp.pipeline import MCPSecurityPipeline
from shield_mcp.proxy import MCPSecurityProxy
from shield_mcp.scanner import ToolPoisoningScanner

__all__ = [
    "JSONRPCMessage",
    "MCPToolDefinition",
    "ToolPin",
    "ToolPinStatus",
    "RugPullAlert",
    "RugPullSeverity",
    "ProxyMode",
    "ProxyAction",
    "InterceptorResult",
    "canonical_json",
    "compute_tool_pin",
    "diff_tool_definitions",
    "BasePinStore",
    "InMemoryPinStore",
    "FilePinStore",
    "ToolPoisoningScanner",
    "BaseMCPInterceptor",
    "RugPullGuardInterceptor",
    "ToolPoisoningInterceptor",
    "ToolCallPolicyInterceptor",
    "ResourceTaintInterceptor",
    "MCPSecurityPipeline",
    "MCPSecurityProxy",
]
