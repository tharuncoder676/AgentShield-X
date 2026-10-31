"""AgentShield-X Drop-in Proxy Wrapper for OpenAI Assistants API (Threads & Runs).

Architect: Tharunkumar.S | AgentShield-X Security Labs
"""

from __future__ import annotations

import json
from typing import Any, Callable, Dict, List, Optional
from shield_core.connectors.base import UniversalAgentShieldInterceptor, InterceptAction, ShieldInterceptResult


class AgentShieldOpenAIWrapper:
    """Wraps OpenAI API clients to guard thread messages and function tool outputs."""

    def __init__(self, client: Any, mode: str = "enforce"):
        self._client = client
        self.interceptor = UniversalAgentShieldInterceptor(mode=mode)
        self.intercepted_events: List[Dict[str, Any]] = []

    def create_thread_message(self, thread_id: str, role: str, content: str, **kwargs: Any) -> Any:
        """Inspects message content before submission to OpenAI thread."""
        res = self.interceptor.intercept_input(content, agent_id=f"openai-thread-{thread_id}")
        if res.is_blocked():
            self.intercepted_events.append({"stage": "openai_message", "thread_id": thread_id, "result": res.to_dict()})
            raise PermissionError(f"AgentShield Blocked OpenAI Message: {res.reason}")

        if hasattr(self._client, "beta") and hasattr(self._client.beta, "threads"):
            return self._client.beta.threads.messages.create(
                thread_id=thread_id, role=role, content=content, **kwargs
            )
        return {"status": "ALLOWED", "content": content}

    def submit_tool_outputs(self, thread_id: str, run_id: str, tool_outputs: List[Dict[str, Any]], **kwargs: Any) -> Any:
        """Inspects tool outputs before submission to OpenAI run."""
        for output in tool_outputs:
            out_str = output.get("output", "")
            res = self.interceptor.intercept_output(out_str, agent_id=f"openai-run-{run_id}")
            if res.is_blocked():
                self.intercepted_events.append({"stage": "openai_tool_output", "run_id": run_id, "result": res.to_dict()})
                raise PermissionError(f"AgentShield Blocked OpenAI Tool Output: {res.reason}")

        if hasattr(self._client, "beta") and hasattr(self._client.beta, "threads"):
            return self._client.beta.threads.runs.submit_tool_outputs(
                thread_id=thread_id, run_id=run_id, tool_outputs=tool_outputs, **kwargs
            )
        return {"status": "SUBMITTED", "tool_outputs": tool_outputs}


def wrap_openai_client(client: Any, mode: str = "enforce") -> AgentShieldOpenAIWrapper:
    """Wraps an OpenAI Python client with inline thread & run interception."""
    return AgentShieldOpenAIWrapper(client=client, mode=mode)

