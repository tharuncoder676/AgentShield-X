"""AgentShield-X Drop-in Middleware for CrewAI Multi-Agent Teams.

Architect: Tharunkumar.S | AgentShield-X Security Labs
"""

from __future__ import annotations

from typing import Any, Callable, Dict, List, Optional
from shield_core.connectors.base import UniversalAgentShieldInterceptor, InterceptAction, ShieldInterceptResult


class AgentShieldCrewAIMiddleware:
    """CrewAI Task & Agent Interceptor protecting autonomous multi-agent crews."""

    def __init__(self, mode: str = "enforce", crew_name: str = "production-crew"):
        self.interceptor = UniversalAgentShieldInterceptor(mode=mode)
        self.crew_name = crew_name
        self.intercepted_events: List[Dict[str, Any]] = []

    def inspect_task_input(self, task_description: str, agent_name: str) -> ShieldInterceptResult:
        """Inspects task prompts dispatched to CrewAI worker agents."""
        result = self.interceptor.intercept_input(task_description, agent_id=agent_name)
        if result.is_blocked():
            self.intercepted_events.append({"stage": "crew_task", "agent": agent_name, "result": result.to_dict()})
        return result

    def inspect_agent_tool_execution(
        self, agent_name: str, tool_name: str, tool_args: Dict[str, Any]
    ) -> ShieldInterceptResult:
        """Inspects tools invoked during CrewAI agent task runs."""
        result = self.interceptor.intercept_tool_call(tool_name, tool_args, agent_id=agent_name)
        if result.is_blocked():
            self.intercepted_events.append({"stage": "crew_tool", "agent": agent_name, "tool": tool_name, "result": result.to_dict()})
        return result


def wrap_crewai_crew(crew: Any, mode: str = "enforce") -> Any:
    """Wraps CrewAI Crew instances with automatic task and tool interception."""
    middleware = AgentShieldCrewAIMiddleware(mode=mode)
    setattr(crew, "_agentshield_middleware", middleware)

    # Monkey patch or hook into kickoff if present
    if hasattr(crew, "kickoff"):
        original_kickoff = crew.kickoff

        def secured_kickoff(*args: Any, **kwargs: Any) -> Any:
            inputs = kwargs.get("inputs", {})
            if isinstance(inputs, dict):
                for k, v in inputs.items():
                    res = middleware.inspect_task_input(str(v), agent_name="crew-coordinator")
                    if res.is_blocked():
                        raise PermissionError(f"AgentShield Blocked CrewAI Input '{k}': {res.reason}")
            return original_kickoff(*args, **kwargs)

        setattr(crew, "kickoff", secured_kickoff)

    return crew

