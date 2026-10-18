"""
AgentShield-X Python Client SDK
Provides thread-safe, low-latency agent defense client with local caching,
retries, offline mode, and per-tool fail-closed / fail-open semantics.
"""

from __future__ import annotations

import asyncio
import functools
import hashlib
import json
import os
import time
import uuid
from typing import Any, Callable, Dict, List, Optional

import httpx

from shield_core.models import (
    ContextSegment,
    Decision,
    Reason,
    ShieldAction,
    ToolCallEvent,
    ToolDefinition,
    ToolSensitivity,
)
from shield_sdk_py.exceptions import ShieldBlockedException, ShieldSessionKilledException


class AgentShield:
    """
    Client for AgentShield-X security gateway.
    Interception overhead < 10 ms; zero-overhead when disabled.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        endpoint: Optional[str] = None,
        tenant_id: str = "tenant_default_001",
        agent_id: str = "agent_default_001",
        session_id: Optional[str] = None,
        enabled: bool = True,
        fail_mode: str = "closed",  # "closed" or "open"
        timeout_seconds: float = 0.5,
        max_retries: int = 1,
        raise_on_block: bool = True,
    ) -> None:
        self.api_key = api_key or os.getenv("SHIELD_API_KEY", "shield_test_key_phase1")
        self.endpoint = (endpoint or os.getenv("SHIELD_ENDPOINT", "http://localhost:8000")).rstrip("/")
        self.tenant_id = tenant_id
        self.agent_id = agent_id
        self.session_id = session_id or str(uuid.uuid4())
        self.enabled = enabled
        self.fail_mode = fail_mode
        self.timeout_seconds = timeout_seconds
        self.max_retries = max_retries
        self.raise_on_block = raise_on_block
        self._cache: Dict[str, Decision] = {}

    def _cache_key(self, tool_name: str, arguments: Dict[str, Any]) -> str:
        canonical = json.dumps({"tool": tool_name, "args": arguments}, sort_keys=True)
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    async def evaluate_async(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        sensitivity: ToolSensitivity = ToolSensitivity.LOW,
        context_segments: Optional[List[ContextSegment]] = None,
        taint: Optional[List[str]] = None,
    ) -> Decision:
        """Asynchronously submits tool evaluation request to Gateway."""
        if not self.enabled:
            return Decision(
                decision_id=str(uuid.uuid4()),
                event_id=str(uuid.uuid4()),
                action=ShieldAction.ALLOW,
                risk=0.0,
                latency_ms=0.0,
            )

        cache_k = self._cache_key(tool_name, arguments)
        if cache_k in self._cache:
            decision = self._cache[cache_k]
            self._handle_action(decision, tool_name)
            return decision

        event = ToolCallEvent(
            tenant_id=self.tenant_id,
            agent_id=self.agent_id,
            session_id=self.session_id,
            tool=ToolDefinition(name=tool_name, sensitivity=sensitivity),
            arguments=arguments,
            context_segments=context_segments or [],
            taint=taint or [],
        )

        headers = {
            "Content-Type": "application/json",
            "X-Shield-API-Key": self.api_key,
        }

        start_time = time.perf_counter()
        decision: Optional[Decision] = None

        for attempt in range(self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                    resp = await client.post(
                        f"{self.endpoint}/v1/events/tool-call",
                        json=event.model_dump(),
                        headers=headers,
                    )
                    if resp.status_code == 200:
                        decision = Decision.model_validate(resp.json())
                        break
            except Exception:
                if attempt == self.max_retries:
                    # Apply fail_mode
                    is_sensitive = sensitivity in {ToolSensitivity.HIGH, ToolSensitivity.CRITICAL}
                    action = (
                        ShieldAction.BLOCK
                        if (is_sensitive and self.fail_mode == "closed")
                        else ShieldAction.ALLOW
                    )
                    decision = Decision(
                        decision_id=str(uuid.uuid4()),
                        event_id=event.event_id,
                        action=action,
                        risk=0.5 if action == ShieldAction.BLOCK else 0.0,
                        reasons=[Reason(code="SDK_GATEWAY_TIMEOUT_DEGRADED", evidence="Gateway failed", detector="sdk")],
                        degraded=True,
                        latency_ms=(time.perf_counter() - start_time) * 1000.0,
                    )

        assert decision is not None

        # Cache safe allows
        if decision.action == ShieldAction.ALLOW and not decision.degraded:
            self._cache[cache_k] = decision

        self._handle_action(decision, tool_name)
        return decision

    def evaluate_sync(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        sensitivity: ToolSensitivity = ToolSensitivity.LOW,
        context_segments: Optional[List[ContextSegment]] = None,
        taint: Optional[List[str]] = None,
    ) -> Decision:
        """Synchronous wrapper for evaluate_async."""
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop is not None and loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                future = pool.submit(
                    asyncio.run,
                    self.evaluate_async(tool_name, arguments, sensitivity, context_segments, taint),
                )
                return future.result()
        else:
            return asyncio.run(
                self.evaluate_async(tool_name, arguments, sensitivity, context_segments, taint)
            )

    def _handle_action(self, decision: Decision, tool_name: str) -> None:
        if decision.action == ShieldAction.KILL_SESSION:
            reasons_summary = ", ".join(r.code for r in decision.reasons)
            msg = f"AgentShield terminated session '{self.session_id}': threat detected calling '{tool_name}' ({reasons_summary})"
            raise ShieldSessionKilledException(msg, decision=decision)

        if decision.action == ShieldAction.BLOCK and self.raise_on_block:
            reasons_summary = ", ".join(r.code for r in decision.reasons)
            msg = f"AgentShield blocked tool '{tool_name}': {reasons_summary} (Risk: {decision.risk})"
            raise ShieldBlockedException(msg, decision=decision)

    def tool(
        self,
        name: Optional[str] = None,
        sensitivity: ToolSensitivity = ToolSensitivity.LOW,
    ) -> Callable:
        """
        Decorator for individual tool functions:
        @shield.tool(name="send_email", sensitivity=ToolSensitivity.HIGH)
        def send_email(to: str, body: str):
            ...
        """
        def decorator(fn: Callable) -> Callable:
            tool_name = name or fn.__name__

            @functools.wraps(fn)
            def sync_wrapper(*args, **kwargs):
                bound_args = kwargs.copy()
                if args:
                    bound_args["_positional_args"] = list(args)
                self.evaluate_sync(tool_name, bound_args, sensitivity=sensitivity)
                return fn(*args, **kwargs)

            @functools.wraps(fn)
            async def async_wrapper(*args, **kwargs):
                bound_args = kwargs.copy()
                if args:
                    bound_args["_positional_args"] = list(args)
                await self.evaluate_async(tool_name, bound_args, sensitivity=sensitivity)
                return await fn(*args, **kwargs)

            if asyncio.iscoroutinefunction(fn):
                return async_wrapper
            return sync_wrapper

        return decorator

    def wrap(self, agent: Any) -> Any:
        """
        Wraps an agent (e.g. LangGraph, LangChain, or custom callable agent),
        attaching AgentShield protection to all tool executions.
        """
        from shield_sdk_py.wrappers import wrap_agent
        return wrap_agent(agent, self)
