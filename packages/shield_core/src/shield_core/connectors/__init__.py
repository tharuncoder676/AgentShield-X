"""AgentShield-X Universal Agent Connector SDK.

Zero-config wrappers for:
- LangChain & LangGraph
- CrewAI Multi-Agent Teams
- Microsoft AutoGen
- OpenAI Assistants API (Threads & Runs)
- Google Agent Development Kit (ADK) & Gemini
- AWS Bedrock Agents & Converse API
- NVIDIA NeMo Guardrails, NeMo Relay & NVIDIA NIM

Architect: Tharunkumar.S | AgentShield-X Security Labs
"""

from __future__ import annotations

from typing import Any, Callable, Optional

from shield_core.connectors.base import (
    UniversalAgentShieldInterceptor,
    InterceptAction,
    ShieldInterceptResult,
)
from shield_core.connectors.langchain_connector import (
    AgentShieldLangChainCallbackHandler,
    wrap_langchain_agent,
)
from shield_core.connectors.crewai_connector import (
    AgentShieldCrewAIMiddleware,
    wrap_crewai_crew,
)
from shield_core.connectors.autogen_connector import (
    AgentShieldAutoGenHook,
    wrap_autogen_agent,
)
from shield_core.connectors.openai_assistants_connector import (
    AgentShieldOpenAIWrapper,
    wrap_openai_client,
)
from shield_core.connectors.google_adk_connector import (
    AgentShieldGoogleADKWrapper,
    wrap_google_adk_agent,
)
from shield_core.connectors.bedrock_connector import (
    AgentShieldBedrockWrapper,
    wrap_bedrock_client,
)
from shield_core.connectors.nvidia_nemo_connector import (
    AgentShieldNemoWrapper,
    wrap_nemo_guardrails,
    wrap_nemo_relay,
)
from shield_core.connectors.nvidia_nemotron_voice import (
    NemotronVoicePipeline,
    NemotronVoiceConfig,
    VoiceBenchmarkMetrics,
    get_nemotron_voice_pipeline,
    SUPPORTED_LANGUAGES,
)


def wrap(target: Any, framework: Optional[str] = None, mode: str = "enforce") -> Any:
    """Universal 2-line drop-in wrapper for AI agents and LLM clients.

    Usage:
        import agentshield
        secured_agent = agentshield.wrap(my_agent)
    """
    fw = framework.lower() if framework else None

    # Explicit framework routing
    if fw in ("langchain", "langgraph"):
        return wrap_langchain_agent(target, mode=mode)
    elif fw == "crewai":
        return wrap_crewai_crew(target, mode=mode)
    elif fw == "autogen":
        return wrap_autogen_agent(target, mode=mode)
    elif fw in ("openai", "openai_assistants"):
        return wrap_openai_client(target, mode=mode)
    elif fw in ("google", "adk", "gemini"):
        return wrap_google_adk_agent(target, mode=mode)
    elif fw == "bedrock":
        return wrap_bedrock_client(target, mode=mode)
    elif fw in ("nvidia", "nemo", "nemo_guardrails", "nemoguardrails", "relay"):
        return wrap_nemo_guardrails(target, mode=mode)

    # Automatic duck-typing detection
    if hasattr(target, "register_reply"):
        return wrap_autogen_agent(target, mode=mode)
    elif hasattr(target, "kickoff") or hasattr(target, "crew"):
        return wrap_crewai_crew(target, mode=mode)
    elif hasattr(target, "callbacks") or (hasattr(target, "agent") and hasattr(target.agent, "callbacks")):
        return wrap_langchain_agent(target, mode=mode)
    elif hasattr(target, "beta") and hasattr(target.beta, "threads"):
        return wrap_openai_client(target, mode=mode)
    elif hasattr(target, "generate_content"):
        return wrap_google_adk_agent(target, mode=mode)
    elif hasattr(target, "converse"):
        return wrap_bedrock_client(target, mode=mode)
    elif hasattr(target, "rails") or hasattr(target, "app") and "nemo" in str(type(target)).lower():
        return wrap_nemo_guardrails(target, mode=mode)

    # If it's a generic callable / function, wrap it inline
    if callable(target):
        interceptor = UniversalAgentShieldInterceptor(mode=mode)

        def secured_callable(*args: Any, **kwargs: Any) -> Any:
            for a in args:
                if isinstance(a, str):
                    res = interceptor.intercept_input(a)
                    if res.is_blocked():
                        raise PermissionError(f"AgentShield Blocked Input: {res.reason}")
            result = target(*args, **kwargs)
            if isinstance(result, str):
                out_res = interceptor.intercept_output(result)
                if out_res.is_blocked():
                    raise PermissionError(f"AgentShield Blocked Output: {out_res.reason}")
            return result

        return secured_callable

    return target


__all__ = [
    "wrap",
    "UniversalAgentShieldInterceptor",
    "InterceptAction",
    "ShieldInterceptResult",
    "AgentShieldLangChainCallbackHandler",
    "wrap_langchain_agent",
    "AgentShieldCrewAIMiddleware",
    "wrap_crewai_crew",
    "AgentShieldAutoGenHook",
    "wrap_autogen_agent",
    "AgentShieldOpenAIWrapper",
    "wrap_openai_client",
    "AgentShieldGoogleADKWrapper",
    "wrap_google_adk_agent",
    "AgentShieldBedrockWrapper",
    "wrap_bedrock_client",
    "AgentShieldNemoWrapper",
    "wrap_nemo_guardrails",
    "wrap_nemo_relay",
    "NemotronVoicePipeline",
    "NemotronVoiceConfig",
    "VoiceBenchmarkMetrics",
    "get_nemotron_voice_pipeline",
    "SUPPORTED_LANGUAGES",
]
