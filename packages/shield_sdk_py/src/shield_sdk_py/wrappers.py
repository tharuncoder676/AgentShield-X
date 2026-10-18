"""
AgentShield Agent Wrappers
Wraps LangGraph, LangChain, and generic agent executors to enforce Shield protection.
"""

from typing import Any
from shield_core.models import ToolSensitivity


def wrap_agent(agent: Any, shield: Any) -> Any:
    """
    Wraps an agent executor or runnable. Intercepts invocation and wraps attached tools.
    """
    # If agent exposes a tools attribute (e.g. LangChain AgentExecutor or LangGraph StateGraph)
    if hasattr(agent, "tools"):
        wrapped_tools = []
        for tool in agent.tools:
            tool_name = getattr(tool, "name", str(tool))
            sensitivity = ToolSensitivity.HIGH if any(s in tool_name for s in ["send", "write", "delete", "post", "sql"]) else ToolSensitivity.LOW
            # Wrap the tool run/call method
            if hasattr(tool, "_run"):
                orig_run = tool._run
                tool._run = shield.tool(name=tool_name, sensitivity=sensitivity)(orig_run)
            elif callable(tool):
                tool = shield.tool(name=tool_name, sensitivity=sensitivity)(tool)
            wrapped_tools.append(tool)
        agent.tools = wrapped_tools

    # If the agent is a direct callable class or function
    class ShieldProtectedAgent:
        def __init__(self, original_agent: Any, shield_instance: Any):
            self._agent = original_agent
            self._shield = shield_instance

        def __getattr__(self, name: str) -> Any:
            return getattr(self._agent, name)

        def run(self, *args, **kwargs) -> Any:
            return self._agent.run(*args, **kwargs)

        def invoke(self, *args, **kwargs) -> Any:
            return self._agent.invoke(*args, **kwargs)

        def __call__(self, *args, **kwargs) -> Any:
            return self._agent(*args, **kwargs)

    return ShieldProtectedAgent(agent, shield)
