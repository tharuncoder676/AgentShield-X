"""AgentShield-X Drop-in Hook for Microsoft AutoGen Multi-Agent Conversations.

Architect: Tharunkumar.S | AgentShield-X Security Labs
"""

from __future__ import annotations

from typing import Any, Callable, Dict, List, Optional
from shield_core.connectors.base import UniversalAgentShieldInterceptor, InterceptAction, ShieldInterceptResult


class AgentShieldAutoGenHook:
    """AutoGen ConversableAgent hook preventing A2A lateral infection & prompt injection."""

    def __init__(self, mode: str = "enforce", agent_id: str = "autogen-agent"):
        self.interceptor = UniversalAgentShieldInterceptor(mode=mode)
        self.agent_id = agent_id
        self.intercepted_events: List[Dict[str, Any]] = []

    def reply_interceptor_hook(
        self,
        recipient: Any,
        messages: Optional[List[Dict[str, Any]]] = None,
        sender: Optional[Any] = None,
        config: Optional[Any] = None,
    ) -> tuple[bool, Optional[str]]:
        """Hook for register_reply in AutoGen ConversableAgent.
        Returns (True, message) to override reply with block message, or (False, None) to pass through.
        """
        if not messages:
            return False, None

        latest_msg = messages[-1] if messages else {}
        content = latest_msg.get("content", "")

        sender_name = getattr(sender, "name", "unknown_sender")
        res = self.interceptor.intercept_input(content, agent_id=sender_name)

        if res.is_blocked():
            self.intercepted_events.append({"stage": "autogen_reply", "sender": sender_name, "result": res.to_dict()})
            blocked_reply = (
                f"[AgentShield-X Security Intercept]: Message from '{sender_name}' was blocked "
                f"due to detected threat ({res.threat_category}): {res.reason}."
            )
            return True, blocked_reply

        return False, None


def wrap_autogen_agent(agent: Any, mode: str = "enforce") -> Any:
    """Registers the AgentShield security hook into an AutoGen ConversableAgent."""
    agent_id = getattr(agent, "name", "autogen-agent")
    hook = AgentShieldAutoGenHook(mode=mode, agent_id=agent_id)
    setattr(agent, "_agentshield_hook", hook)

    if hasattr(agent, "register_reply"):
        agent.register_reply(
            trigger=[object, list],
            reply_func=hook.reply_interceptor_hook,
            position=0,  # Run before standard LLM and human input replies
        )
    return agent

