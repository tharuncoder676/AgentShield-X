"""FastAPI Routes for Universal Agent Connector SDK Hub."""


from typing import Any, Dict, List, Optional
from fastapi import APIRouter
from pydantic import BaseModel

from shield_core.connectors.base import UniversalAgentShieldInterceptor

router = APIRouter(prefix="/v1/connectors", tags=["connectors"])

_interceptor = UniversalAgentShieldInterceptor(mode="enforce")


SUPPORTED_CONNECTORS = [
    {
        "framework_id": "langchain",
        "name": "LangChain & LangGraph",
        "category": "Orchestration",
        "version_support": ">=0.1.0 (v0.2 & v0.3 supported)",
        "install_snippet": "pip install agentshield-x",
        "code_snippet": (
            "import agentshield\n"
            "from langchain.agents import initialize_agent\n\n"
            "# 2-Line Zero Config Drop-in:\n"
            "agent = initialize_agent(tools, llm, agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION)\n"
            "secured_agent = agentshield.wrap(agent)"
        ),
        "status": "Production Ready",
        "latency_overhead_ms": 1.2,
    },
    {
        "framework_id": "crewai",
        "name": "CrewAI Multi-Agent Teams",
        "category": "Multi-Agent Swarm",
        "version_support": ">=0.28.0",
        "install_snippet": "pip install agentshield-x",
        "code_snippet": (
            "import agentshield\n"
            "from crewai import Crew\n\n"
            "# 2-Line Zero Config Drop-in:\n"
            "crew = Crew(agents=[researcher, writer], tasks=[task1, task2])\n"
            "secured_crew = agentshield.wrap(crew)"
        ),
        "status": "Production Ready",
        "latency_overhead_ms": 1.8,
    },
    {
        "framework_id": "autogen",
        "name": "Microsoft AutoGen",
        "category": "Conversational Swarm",
        "version_support": ">=0.2.0 (v0.4 supported)",
        "install_snippet": "pip install agentshield-x",
        "code_snippet": (
            "import agentshield\n"
            "from autogen import AssistantAgent, UserProxyAgent\n\n"
            "# 2-Line Zero Config Drop-in:\n"
            "agent = AssistantAgent(name='assistant', llm_config=llm_config)\n"
            "secured_agent = agentshield.wrap(agent)"
        ),
        "status": "Production Ready",
        "latency_overhead_ms": 1.4,
    },
    {
        "framework_id": "openai",
        "name": "OpenAI Assistants API",
        "category": "Direct LLM Runtime",
        "version_support": ">=1.0.0 (v1.x)",
        "install_snippet": "pip install agentshield-x",
        "code_snippet": (
            "import agentshield\n"
            "from openai import OpenAI\n\n"
            "# 2-Line Zero Config Drop-in:\n"
            "client = OpenAI()\n"
            "secured_client = agentshield.wrap(client)"
        ),
        "status": "Production Ready",
        "latency_overhead_ms": 0.9,
    },
    {
        "framework_id": "google",
        "name": "Google Agent Development Kit (ADK)",
        "category": "Frontier AI",
        "version_support": "Gemini 1.5 & 2.0 Flash/Pro",
        "install_snippet": "pip install agentshield-x",
        "code_snippet": (
            "import agentshield\n"
            "import google.generativeai as genai\n\n"
            "# 2-Line Zero Config Drop-in:\n"
            "model = genai.GenerativeModel('gemini-1.5-pro')\n"
            "secured_model = agentshield.wrap(model)"
        ),
        "status": "Production Ready",
        "latency_overhead_ms": 1.1,
    },
    {
        "framework_id": "bedrock",
        "name": "AWS Bedrock Agents & Converse",
        "category": "Enterprise Cloud AI",
        "version_support": "boto3 >= 1.34.0",
        "install_snippet": "pip install agentshield-x",
        "code_snippet": (
            "import agentshield\n"
            "import boto3\n\n"
            "# 2-Line Zero Config Drop-in:\n"
            "bedrock = boto3.client('bedrock-runtime')\n"
            "secured_bedrock = agentshield.wrap(bedrock)"
        ),
        "status": "Production Ready",
        "latency_overhead_ms": 1.5,
    },
    {
        "framework_id": "nvidia_nemo",
        "name": "NVIDIA NeMo Guardrails & Relay",
        "category": "Guardrails & Safety Framework",
        "version_support": "nemoguardrails >= 0.9.0 & NeMo Relay",
        "install_snippet": "pip install nemoguardrails agentshield-x",
        "code_snippet": (
            "import agentshield\n"
            "from nemoguardrails import LLMRails, RailsConfig\n\n"
            "# 2-Line Zero Config Drop-in Dual-Rail Interception:\n"
            "config = RailsConfig.from_path('./config')\n"
            "rails = LLMRails(config)\n"
            "secured_rails = agentshield.wrap(rails)"
        ),
        "status": "Production Ready",
        "latency_overhead_ms": 0.85,
    },
    {
        "framework_id": "nvidia_nim",
        "name": "NVIDIA NIM Microservices",
        "category": "Enterprise Inference",
        "version_support": "OpenAI v1 / Nemotron-4-340B",
        "install_snippet": "pip install openai agentshield-x",
        "code_snippet": (
            "import agentshield\n"
            "from openai import OpenAI\n\n"
            "# 2-Line Drop-in for NVIDIA NIM Endpoints:\n"
            "client = OpenAI(base_url='https://integrate.api.nvidia.com/v1', api_key=NV_KEY)\n"
            "secured_client = agentshield.wrap(client)"
        ),
        "status": "Production Ready",
        "latency_overhead_ms": 0.72,
    },
]


class InterceptSimulationRequest(BaseModel):
    framework_id: str = "langchain"
    input_text: Optional[str] = None
    tool_name: Optional[str] = None
    tool_args: Optional[Dict[str, Any]] = None


@router.get("/supported")
async def get_supported_connectors():
    """Returns all supported agent frameworks, code snippets, and telemetry."""
    return SUPPORTED_CONNECTORS


@router.post("/intercept")
async def test_connector_interception(payload: InterceptSimulationRequest):
    """Simulates an inline security interception for a given agent framework."""
    if payload.tool_name:
        res = _interceptor.intercept_tool_call(
            tool_name=payload.tool_name,
            arguments=payload.tool_args or {},
            agent_id=f"{payload.framework_id}-agent",
        )
    else:
        text = payload.input_text or "Hello world"
        res = _interceptor.intercept_input(text, agent_id=f"{payload.framework_id}-agent")

    return {
        "framework_id": payload.framework_id,
        "result": res.to_dict(),
    }
