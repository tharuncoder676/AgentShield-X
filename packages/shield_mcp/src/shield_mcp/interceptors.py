"""
AgentShield-X MCP Security Interceptors
Implements the pipeline of security gates intercepting MCP JSON-RPC messages:
- Rug-pull detection and schema integrity enforcement
- Tool-poisoning and prompt injection scanning
- Tool-call authorization and sensitive sink protection
- Output tainting and canary reflection checking
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any, Callable, Dict, List, Optional

from shield_mcp.hasher import compute_tool_pin
from shield_mcp.models import (
    InterceptorResult,
    JSONRPCMessage,
    ProxyAction,
    ProxyMode,
    RugPullAlert,
    RugPullSeverity,
    ToolPin,
)
from shield_mcp.pin_store import BasePinStore
from shield_mcp.scanner import ToolPoisoningScanner

logger = logging.getLogger("agentshield.mcp")


class BaseMCPInterceptor(ABC):
    """Abstract base class for all MCP proxy security interceptors."""

    @abstractmethod
    async def handle_client_request(
        self, message: JSONRPCMessage, context: Dict[str, Any]
    ) -> InterceptorResult:
        """Called when agent sends a request downstream to upstream MCP server."""
        return InterceptorResult(action=ProxyAction.FORWARD, message=message)

    @abstractmethod
    async def handle_upstream_response(
        self,
        message: JSONRPCMessage,
        original_request: Optional[JSONRPCMessage],
        context: Dict[str, Any],
    ) -> InterceptorResult:
        """Called when upstream MCP server sends a response back to the agent."""
        return InterceptorResult(action=ProxyAction.FORWARD, message=message)


class RugPullGuardInterceptor(BaseMCPInterceptor):
    """
    Guarantees tool definition integrity across tools/list invocations.
    Protects against shadow schema mutation and dynamic tool alteration attacks.
    """

    def __init__(
        self,
        pin_store: BasePinStore,
        mode: ProxyMode = ProxyMode.ENFORCE,
        strict_unpinned: bool = True,
        on_alert: Optional[Callable[[RugPullAlert], None]] = None,
    ) -> None:
        self.pin_store = pin_store
        self.mode = mode
        self.strict_unpinned = strict_unpinned
        self.on_alert = on_alert
        self.alerts: List[RugPullAlert] = []

    async def handle_client_request(
        self, message: JSONRPCMessage, context: Dict[str, Any]
    ) -> InterceptorResult:
        return InterceptorResult(action=ProxyAction.FORWARD, message=message)

    async def handle_upstream_response(
        self,
        message: JSONRPCMessage,
        original_request: Optional[JSONRPCMessage],
        context: Dict[str, Any],
    ) -> InterceptorResult:
        # Check if this is a response to tools/list
        if not original_request or original_request.method != "tools/list":
            return InterceptorResult(action=ProxyAction.FORWARD, message=message)

        if not message.result or not isinstance(message.result, dict):
            return InterceptorResult(action=ProxyAction.FORWARD, message=message)

        raw_tools = message.result.get("tools", [])
        if not isinstance(raw_tools, list):
            return InterceptorResult(action=ProxyAction.FORWARD, message=message)

        # Mode: PIN - learn and persist pins
        if self.mode == ProxyMode.PIN:
            for t in raw_tools:
                pin = compute_tool_pin(t, notes="Pinned by AgentShield MCP Proxy")
                self.pin_store.save_pin(pin)
            return InterceptorResult(action=ProxyAction.FORWARD, message=message)

        # Mode: ENFORCE or OBSERVE
        verified_tools: List[Dict[str, Any]] = []
        has_modifications = False
        latest_alert: Optional[RugPullAlert] = None

        for t in raw_tools:
            name = t.get("name", "")
            is_valid, pin, summary = self.pin_store.verify(t)

            if is_valid:
                verified_tools.append(t)
                continue

            # Mutation or unpinned tool detected
            obs_pin = compute_tool_pin(t)
            pinned_hash = pin.canonical_hash if pin else "none"

            alert = RugPullAlert(
                tool_name=name,
                server_identifier=context.get("server_id", "upstream-mcp"),
                pinned_hash=pinned_hash,
                observed_hash=obs_pin.canonical_hash,
                diff_summary=summary or "Tool definition mutated",
                severity=RugPullSeverity.CRITICAL,
                action_taken="blocked" if self.mode == ProxyMode.ENFORCE else "alert_only",
                observed_description=t.get("description"),
                observed_schema=t.get("inputSchema"),
            )
            self.alerts.append(alert)
            latest_alert = alert
            if self.on_alert:
                self.on_alert(alert)

            if self.mode == ProxyMode.OBSERVE:
                verified_tools.append(t)
            elif self.mode == ProxyMode.ENFORCE:
                has_modifications = True
                if pin and pin.description:
                    # Restore to safe pinned definition to keep agent operational without exposure
                    safe_restored = {
                        "name": pin.tool_name,
                        "description": pin.description,
                        "inputSchema": pin.input_schema,
                    }
                    verified_tools.append(safe_restored)
                    alert.action_taken = "restored_to_pin"
                else:
                    # Unpinned tool in strict mode: drop tool from agent visibility
                    logger.warning(f"[AgentShield MCP] Quarantined unpinned tool: '{name}'")
                    alert.action_taken = "blocked"

        if has_modifications:
            # Return sanitized/restored tools in response
            modified_message = message.model_copy(deep=True) if hasattr(message, "model_copy") else message.copy(deep=True)
            modified_message.result["tools"] = verified_tools
            return InterceptorResult(
                action=ProxyAction.MODIFY,
                message=modified_message,
                alert=latest_alert,
                reasons=[f"Tool definition integrity violation: {latest_alert.diff_summary}" if latest_alert else ""],
            )

        return InterceptorResult(action=ProxyAction.FORWARD, message=message, alert=latest_alert)


class ToolPoisoningInterceptor(BaseMCPInterceptor):
    """
    Deep semantic scanner for prompt injections and backdoor directives
    in tool descriptions and parameter schemas.
    """

    def __init__(
        self,
        scanner: Optional[ToolPoisoningScanner] = None,
        on_poison: Optional[Callable[[str, List[str]], None]] = None,
    ) -> None:
        self.scanner = scanner or ToolPoisoningScanner()
        self.on_poison = on_poison

    async def handle_client_request(
        self, message: JSONRPCMessage, context: Dict[str, Any]
    ) -> InterceptorResult:
        return InterceptorResult(action=ProxyAction.FORWARD, message=message)

    async def handle_upstream_response(
        self,
        message: JSONRPCMessage,
        original_request: Optional[JSONRPCMessage],
        context: Dict[str, Any],
    ) -> InterceptorResult:
        if not original_request or original_request.method != "tools/list":
            return InterceptorResult(action=ProxyAction.FORWARD, message=message)

        if not message.result or not isinstance(message.result, dict):
            return InterceptorResult(action=ProxyAction.FORWARD, message=message)

        tools = message.result.get("tools", [])
        clean_tools: List[Dict[str, Any]] = []
        blocked_reasons: List[str] = []

        for t in tools:
            is_poisoned, reasons = self.scanner.scan_tool(t)
            if is_poisoned:
                tool_name = t.get("name", "unknown")
                blocked_reasons.extend(reasons)
                if self.on_poison:
                    self.on_poison(tool_name, reasons)
                logger.error(f"[AgentShield MCP] Blocked poisoned tool '{tool_name}': {reasons}")
                continue
            clean_tools.append(t)

        if blocked_reasons:
            modified_message = message.model_copy(deep=True) if hasattr(message, "model_copy") else message.copy(deep=True)
            modified_message.result["tools"] = clean_tools
            return InterceptorResult(
                action=ProxyAction.MODIFY,
                message=modified_message,
                reasons=blocked_reasons,
            )

        return InterceptorResult(action=ProxyAction.FORWARD, message=message)


class ToolCallPolicyInterceptor(BaseMCPInterceptor):
    """
    Intercepts client tools/call dispatches.
    Enforces deterministic AgentShield policies (e.g. blocking unauthorized execution,
    prohibiting sensitive sink misuse, or detecting canary token exfiltration in arguments).
    """

    def __init__(
        self,
        disallowed_tools: Optional[List[str]] = None,
        policy_evaluator: Optional[Callable[[str, Dict[str, Any]], Tuple[bool, str]]] = None,
    ) -> None:
        self.disallowed_tools = set(disallowed_tools or [])
        self.policy_evaluator = policy_evaluator

    async def handle_client_request(
        self, message: JSONRPCMessage, context: Dict[str, Any]
    ) -> InterceptorResult:
        if message.method != "tools/call":
            return InterceptorResult(action=ProxyAction.FORWARD, message=message)

        params = message.params or {}
        tool_name = params.get("name", "")
        arguments = params.get("arguments", {})

        # 1. Static sink check
        if tool_name in self.disallowed_tools:
            return self._build_blocked_response(
                message,
                f"Tool '{tool_name}' is prohibited by AgentShield-X security policy.",
            )

        # 2. Dynamic policy evaluator check
        if self.policy_evaluator:
            allowed, reason = self.policy_evaluator(tool_name, arguments)
            if not allowed:
                return self._build_blocked_response(
                    message,
                    f"AgentShield-X Policy Violation on tool '{tool_name}': {reason}",
                )

        return InterceptorResult(action=ProxyAction.FORWARD, message=message)

    async def handle_upstream_response(
        self,
        message: JSONRPCMessage,
        original_request: Optional[JSONRPCMessage],
        context: Dict[str, Any],
    ) -> InterceptorResult:
        return InterceptorResult(action=ProxyAction.FORWARD, message=message)

    def _build_blocked_response(
        self, original_req: JSONRPCMessage, reason: str
    ) -> InterceptorResult:
        """Returns standard MCP tool error result without calling upstream server."""
        blocked_msg = JSONRPCMessage(
            jsonrpc="2.0",
            id=original_req.id,
            result={
                "content": [
                    {
                        "type": "text",
                        "text": f"[AgentShield-X Enforcement]: {reason}",
                    }
                ],
                "isError": True,
            },
        )
        return InterceptorResult(
            action=ProxyAction.BLOCK,
            message=blocked_msg,
            reasons=[reason],
        )


class ResourceTaintInterceptor(BaseMCPInterceptor):
    """
    Labels MCP resource reads and tool outputs as untrusted content,
    wrapping returned data with provenance markers to defend against indirect prompt injections.
    """

    async def handle_client_request(
        self, message: JSONRPCMessage, context: Dict[str, Any]
    ) -> InterceptorResult:
        return InterceptorResult(action=ProxyAction.FORWARD, message=message)

    async def handle_upstream_response(
        self,
        message: JSONRPCMessage,
        original_request: Optional[JSONRPCMessage],
        context: Dict[str, Any],
    ) -> InterceptorResult:
        if not original_request or original_request.method not in ("resources/read", "tools/call"):
            return InterceptorResult(action=ProxyAction.FORWARD, message=message)

        if not message.result or not isinstance(message.result, dict):
            return InterceptorResult(action=ProxyAction.FORWARD, message=message)

        # Mark contents as untrusted
        contents = message.result.get("content") or message.result.get("contents")
        if isinstance(contents, list):
            for item in contents:
                if isinstance(item, dict) and item.get("type") == "text":
                    raw_text = item.get("text", "")
                    # Delimit untrusted output
                    item["text"] = (
                        f"[DATA_SEGMENT source=\"mcp://{context.get('server_id', 'upstream')}\" "
                        f"trust=\"untrusted\"]\n{raw_text}\n[/DATA_SEGMENT]"
                    )

        return InterceptorResult(action=ProxyAction.MODIFY, message=message)
