"""AgentShield-X Drop-in Connector for Google Agent Development Kit (ADK) & Gemini.

Architect: Tharunkumar.S | AgentShield-X Security Labs
"""

from __future__ import annotations

from typing import Any, Callable, Dict, List, Optional
from shield_core.connectors.base import UniversalAgentShieldInterceptor, InterceptAction, ShieldInterceptResult


class AgentShieldGoogleADKWrapper:
    """Wraps Google ADK agents and Gemini models to prevent prompt injections & unauthorized tool calls."""

    def __init__(self, agent_or_model: Any, mode: str = "enforce"):
        self._target = agent_or_model
        self.interceptor = UniversalAgentShieldInterceptor(mode=mode)
        self.intercepted_events: List[Dict[str, Any]] = []

    def generate_content(self, contents: Any, **kwargs: Any) -> Any:
        """Inspects prompts dispatched to Google Gemini / ADK agents."""
        text = str(contents)
        res = self.interceptor.intercept_input(text, agent_id="google-adk-agent")
        if res.is_blocked():
            self.intercepted_events.append({"stage": "adk_generate", "result": res.to_dict()})
            raise PermissionError(f"AgentShield Blocked Google ADK Prompt: {res.reason}")

        if hasattr(self._target, "generate_content"):
            return self._target.generate_content(contents, **kwargs)
        return {"status": "SUCCESS", "response": f"Safe simulated response to: {text[:30]}"}


def wrap_google_adk_agent(agent_or_model: Any, mode: str = "enforce") -> AgentShieldGoogleADKWrapper:
    """Wraps a Google ADK agent or Gemini model with AgentShield-X interception."""
    return AgentShieldGoogleADKWrapper(agent_or_model=agent_or_model, mode=mode)

