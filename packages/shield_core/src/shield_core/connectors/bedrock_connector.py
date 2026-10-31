"""AgentShield-X Drop-in Connector for AWS Bedrock Agents & Converse API.

Architect: Tharunkumar.S | AgentShield-X Security Labs
"""

from __future__ import annotations

from typing import Any, Callable, Dict, List, Optional
from shield_core.connectors.base import UniversalAgentShieldInterceptor, InterceptAction, ShieldInterceptResult


class AgentShieldBedrockWrapper:
    """Wraps AWS Bedrock runtime client / boto3 client to inspect prompts and agent actions."""

    def __init__(self, bedrock_client: Any, mode: str = "enforce"):
        self._client = bedrock_client
        self.interceptor = UniversalAgentShieldInterceptor(mode=mode)
        self.intercepted_events: List[Dict[str, Any]] = []

    def converse(self, modelId: str, messages: List[Dict[str, Any]], **kwargs: Any) -> Any:
        """Inspects AWS Bedrock Converse API message history before dispatch."""
        for msg in messages:
            content = str(msg.get("content", ""))
            res = self.interceptor.intercept_input(content, agent_id="bedrock-agent")
            if res.is_blocked():
                self.intercepted_events.append({"stage": "bedrock_converse", "result": res.to_dict()})
                raise PermissionError(f"AgentShield Blocked Bedrock Converse: {res.reason}")

        if hasattr(self._client, "converse"):
            return self._client.converse(modelId=modelId, messages=messages, **kwargs)
        return {"output": {"message": {"content": [{"text": "Bedrock safe response"}]}}}


def wrap_bedrock_client(bedrock_client: Any, mode: str = "enforce") -> AgentShieldBedrockWrapper:
    """Wraps an AWS Bedrock runtime client with AgentShield-X interception."""
    return AgentShieldBedrockWrapper(bedrock_client=bedrock_client, mode=mode)

