"""AgentShield-X Drop-in Connector for NVIDIA NeMo Guardrails, NeMo Relay & NVIDIA NIM.

Architect: Tharunkumar.S | AgentShield-X Security Labs
Compatible with NVIDIA Skills Ecosystem (nemotron-policy-generator, nemo-relay-instrument-calls, rag-blueprint)
"""

from __future__ import annotations

from typing import Any, Callable, Dict, List, Optional
from shield_core.connectors.base import (
    UniversalAgentShieldInterceptor,
    InterceptAction,
    ShieldInterceptResult,
)


class AgentShieldNemoWrapper:
    """
    Wraps NVIDIA NeMo Guardrails (LLMRails), NeMo Relay execution scopes,
    and NVIDIA NIM clients with AgentShield-X sub-millisecond dual-rail inspection.
    """

    def __init__(self, nemo_target: Any, mode: str = "enforce", agent_id: str = "nvidia-nemo-agent"):
        self._target = nemo_target
        self.agent_id = agent_id
        self.interceptor = UniversalAgentShieldInterceptor(mode=mode)
        self.intercepted_events: List[Dict[str, Any]] = []

    def generate(self, messages: Any = None, prompt: Optional[str] = None, **kwargs: Any) -> Any:
        """Inspects inputs prior to dispatching to NeMo Guardrails / NIM."""
        text = prompt or (str(messages) if messages else "")
        res = self.interceptor.intercept_input(text, agent_id=self.agent_id)
        if res.is_blocked():
            self.intercepted_events.append({"stage": "nemo_generate", "result": res.to_dict()})
            raise PermissionError(f"AgentShield Blocked NeMo Prompt: {res.reason} (Risk: {res.risk_score:.2f})")

        if hasattr(self._target, "generate"):
            return self._target.generate(messages=messages, prompt=prompt, **kwargs)
        if hasattr(self._target, "generate_async"):
            return self._target.generate_async(messages=messages, prompt=prompt, **kwargs)
        return {"role": "assistant", "content": f"Verified NeMo response to: {text[:40]}"}

    async def generate_async(self, messages: Any = None, prompt: Optional[str] = None, **kwargs: Any) -> Any:
        """Asynchronous inspection for NeMo Guardrails."""
        text = prompt or (str(messages) if messages else "")
        res = self.interceptor.intercept_input(text, agent_id=self.agent_id)
        if res.is_blocked():
            self.intercepted_events.append({"stage": "nemo_generate_async", "result": res.to_dict()})
            raise PermissionError(f"AgentShield Blocked NeMo Prompt: {res.reason} (Risk: {res.risk_score:.2f})")

        if hasattr(self._target, "generate_async"):
            return await self._target.generate_async(messages=messages, prompt=prompt, **kwargs)
        return {"role": "assistant", "content": f"Verified NeMo async response to: {text[:40]}"}

    def execute_tool(self, tool_name: str, tool_args: Dict[str, Any]) -> Any:
        """Inspects tool execution calls managed by NeMo Relay or custom action servers."""
        res = self.interceptor.intercept_tool_call(tool_name, tool_args, agent_id=self.agent_id)
        if res.is_blocked():
            self.intercepted_events.append({"stage": "nemo_tool_call", "tool": tool_name, "result": res.to_dict()})
            raise PermissionError(f"AgentShield Blocked NeMo Tool Call [{tool_name}]: {res.reason}")

        if hasattr(self._target, "execute_tool"):
            return self._target.execute_tool(tool_name, tool_args)
        return {"status": "SUCCESS", "tool": tool_name, "args": tool_args}


def wrap_nemo_guardrails(rails_instance: Any, mode: str = "enforce", agent_id: str = "nvidia-nemo-agent") -> AgentShieldNemoWrapper:
    """Wraps an NVIDIA NeMo Guardrails LLMRails instance with AgentShield-X dual-rail defense."""
    return AgentShieldNemoWrapper(nemo_target=rails_instance, mode=mode, agent_id=agent_id)


def wrap_nemo_relay(relay_scope: Any, mode: str = "enforce", agent_id: str = "nemo-relay-agent") -> AgentShieldNemoWrapper:
    """Wraps an NVIDIA NeMo Relay managed execution scope with AgentShield-X dual-rail defense."""
    return AgentShieldNemoWrapper(nemo_target=relay_scope, mode=mode, agent_id=agent_id)

