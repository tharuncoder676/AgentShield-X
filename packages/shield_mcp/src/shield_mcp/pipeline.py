"""
AgentShield-X MCP Security Pipeline
Orchestrates requests and responses through the security interceptor chain.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from shield_mcp.interceptors import BaseMCPInterceptor
from shield_mcp.models import InterceptorResult, JSONRPCMessage, ProxyAction

logger = logging.getLogger("agentshield.mcp.pipeline")


class MCPSecurityPipeline:
    """Chain of Responsibility engine for MCP JSON-RPC security inspection."""

    def __init__(self, interceptors: Optional[List[BaseMCPInterceptor]] = None) -> None:
        self.interceptors: List[BaseMCPInterceptor] = interceptors or []

    def add_interceptor(self, interceptor: BaseMCPInterceptor) -> None:
        self.interceptors.append(interceptor)

    async def process_client_request(
        self, message: JSONRPCMessage, context: Dict[str, Any]
    ) -> InterceptorResult:
        """
        Executes client request through all interceptors.
        Short-circuits immediately if an interceptor blocks the request.
        """
        current_msg = message
        collected_reasons: List[str] = []

        for interceptor in self.interceptors:
            try:
                result = await interceptor.handle_client_request(current_msg, context)
            except Exception as e:
                logger.error(f"Error in request interceptor {interceptor.__class__.__name__}: {e}")
                continue

            if result.action == ProxyAction.BLOCK:
                return result

            if result.action == ProxyAction.MODIFY and result.message:
                current_msg = result.message

            if result.reasons:
                collected_reasons.extend(result.reasons)

        return InterceptorResult(
            action=ProxyAction.FORWARD if current_msg == message else ProxyAction.MODIFY,
            message=current_msg,
            reasons=collected_reasons,
        )

    async def process_upstream_response(
        self,
        message: JSONRPCMessage,
        original_request: Optional[JSONRPCMessage],
        context: Dict[str, Any],
    ) -> InterceptorResult:
        """
        Executes upstream response through all interceptors.
        Enforces schema integrity, strips poison, and applies taint markers.
        """
        current_msg = message
        collected_reasons: List[str] = []
        last_alert = None

        for interceptor in self.interceptors:
            try:
                result = await interceptor.handle_upstream_response(
                    current_msg, original_request, context
                )
            except Exception as e:
                logger.error(f"Error in response interceptor {interceptor.__class__.__name__}: {e}")
                continue

            if result.alert:
                last_alert = result.alert

            if result.action == ProxyAction.BLOCK:
                return result

            if result.action == ProxyAction.MODIFY and result.message:
                current_msg = result.message

            if result.reasons:
                collected_reasons.extend(result.reasons)

        return InterceptorResult(
            action=ProxyAction.FORWARD if current_msg == message else ProxyAction.MODIFY,
            message=current_msg,
            alert=last_alert,
            reasons=collected_reasons,
        )
