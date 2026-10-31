"""AgentShield-X Drop-in Connector for LangChain & LangGraph.

Architect: Tharunkumar.S | AgentShield-X Security Labs
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from shield_core.connectors.base import UniversalAgentShieldInterceptor, InterceptAction, ShieldInterceptResult


class AgentShieldLangChainCallbackHandler:
    """LangChain / LangGraph Callback Handler providing inline AI agent security."""

    def __init__(self, mode: str = "enforce", agent_id: str = "langchain-agent"):
        self.interceptor = UniversalAgentShieldInterceptor(mode=mode)
        self.agent_id = agent_id
        self.intercepted_events: List[Dict[str, Any]] = []

    def on_chain_start(
        self, serialized: Dict[str, Any], inputs: Dict[str, Any], **kwargs: Any
    ) -> None:
        """Inspects inputs entering the LangChain chain."""
        input_text = ""
        if isinstance(inputs, dict):
            input_text = str(inputs.get("input", inputs.get("query", inputs.get("question", ""))))
        elif isinstance(inputs, str):
            input_text = inputs

        if input_text:
            result = self.interceptor.intercept_input(input_text, agent_id=self.agent_id)
            if result.is_blocked():
                self.intercepted_events.append({"stage": "input", "result": result.to_dict()})
                raise SecurityError(f"AgentShield Blocked Chain Input: {result.reason}")

    def on_tool_start(
        self, serialized: Dict[str, Any], input_str: str, **kwargs: Any
    ) -> None:
        """Inspects tool invocation before execution in LangChain."""
        tool_name = serialized.get("name", "unknown_tool") if isinstance(serialized, dict) else str(serialized)
        result = self.interceptor.intercept_tool_call(tool_name=tool_name, arguments={"input": input_str}, agent_id=self.agent_id)
        if result.is_blocked():
            self.intercepted_events.append({"stage": "tool", "tool": tool_name, "result": result.to_dict()})
            raise SecurityError(f"AgentShield Blocked Tool Call '{tool_name}': {result.reason}")

    def on_llm_end(self, response: Any, **kwargs: Any) -> None:
        """Inspects LLM output before delivery."""
        pass


class SecurityError(Exception):
    """Raised when an AgentShield security policy blocks an agent execution."""
    pass


def wrap_langchain_agent(agent: Any, mode: str = "enforce", agent_id: str = "langchain-agent") -> Any:
    """Wraps any LangChain agent or executor with the AgentShield security callback handler."""
    handler = AgentShieldLangChainCallbackHandler(mode=mode, agent_id=agent_id)
    if hasattr(agent, "callbacks"):
        if agent.callbacks is None:
            agent.callbacks = [handler]
        elif isinstance(agent.callbacks, list):
            agent.callbacks.append(handler)
    elif hasattr(agent, "agent") and hasattr(agent.agent, "callbacks"):
        if agent.agent.callbacks is None:
            agent.agent.callbacks = [handler]
        elif isinstance(agent.agent.callbacks, list):
            agent.agent.callbacks.append(handler)

    setattr(agent, "_agentshield_handler", handler)
    return agent

