# Show HN: AgentShield-X – Open-Source Runtime Security Proxy for AI Agents (<1ms latency)

**Title:** Show HN: AgentShield-X – Deterministic runtime security proxy for AI agents (<1ms latency)  
**URL:** [https://github.com/tharuncoder676/AgentShield-X](https://github.com/tharuncoder676/AgentShield-X)  
**Author:** Tharunkumar.S (Lead Architect)

---

Hey HN,

I’m Tharun. Over the past year, like many of you, I watched the AI ecosystem shift rapidly from conversational chatbots to autonomous agents (LangChain, CrewAI, AutoGen, and now Anthropic's Model Context Protocol). 

Once you give an LLM operational agency—allowing it to execute bash scripts, run SQL queries, scrape endpoints, and delegate sub-tasks to other agents—you cross a security boundary that traditional AppSec cannot handle.

When I looked at existing AI guardrail solutions, I noticed two fatal flaws:
1. **They are too slow for real-time tool loops.** LLM-as-a-judge and neural guardrails like Meta's Llama Guard 3 or NVIDIA NeMo add between 80ms and 310ms of latency per tool call. In high-frequency multi-step agent workflows, that destroys user experience.
2. **They are non-deterministic and easily bypassed.** A single Cyrillic homoglyph, zero-width space, or nested Base64 layer bypasses statistical token classifiers ~20% of the time. Worse, they have no concept of multi-step tool call graphs—so an agent that reads a private file in step 1 and posts it to a webhook in step 2 looks completely benign to single-turn guards.

To solve this, I built **AgentShield-X** ([https://github.com/tharuncoder676/AgentShield-X](https://github.com/tharuncoder676/AgentShield-X)), an open-source, deterministic dual-rail runtime defense proxy engineered specifically for autonomous agent swarms and MCP servers.

### How It Works:
Instead of relying purely on heavy neural classifiers, AgentShield-X runs a **Dual-Rail Pipeline**:
- **Rail 1 (Fast Deterministic AST + OPA/Rego):** Inspects tool schemas, arguments, and ingress tokens in `<0.1ms`. Includes a 16-stage cognitive zero-keyword normalizer that strips homoglyphs and hidden Unicode before any processing.
- **Rail 2 (Neuro-Symbolic DAG Reasoning):** Evaluates multi-step tool execution graphs (DAGs) using deterministic state machines to detect lateral staging and exfiltration patterns (e.g., FileRead -> MemoryUpdate -> WebhookPost).
- **Streaming sliding-window interceptor:** Evaluates streaming LLM tokens in **64.2 microseconds** with mid-stream abort capabilities.
- **Cryptographic A2A Attestation:** When an orchestrator agent delegates a task to a sub-agent, it issues an ephemeral HMAC-SHA256 capability token that strictly bounds which tools can be called and limits execution lifetime.
- **Active Canary Honeytools:** Dynamically injects synthetic decoy tools (e.g., `query_sql_admin`) with canary tokens. If an injected agent calls a canary tool, the execution socket is severed in `<1ms`.
- **NVIDIA Nemotron Voice Agent Blueprint:** Full-duplex conversational voice security with streaming ASR (0.6B), Nemotron 3.5 LLM (30B), Magpie multilingual TTS (12 languages), and Silero VAD barge-in.
- **Cross-Platform Native Apps:** Pre-built distribution packages for Windows (.exe), macOS (.dmg), and Linux (.AppImage).

### Benchmark Results (AgentShield-Bench):
We ran 500 standardized adversarial attack scenarios across 10 categories:
- **AgentShield-X:** 99.4% catch rate, 0.4% FPR, **1.2ms latency**
- **Lakera Guard v2:** 88.2% catch rate, 2.8% FPR, 84.5ms latency
- **NVIDIA NeMo Guardrails:** 82.5% catch rate, 4.1% FPR, 120.0ms latency
- **Meta Llama Guard 3 (8B):** 79.1% catch rate, 5.6% FPR, 310.0ms latency

Everything runs 100% locally and offline without cloud dependencies. It comes with a Claude-style cyberpunk CLI, a React/Tailwind console, a VS Code extension, and drop-in SDK wrappers for LangChain, CrewAI, AutoGen, and OpenAI Assistants:

```python
from shield_core.connectors import agentshield

# 1-line protection for any agent tool
@agentshield.wrap
def execute_database_query(query: str):
    ...
```

The project is MIT-licensed, completely free, and available on GitHub:
👉 **[https://github.com/tharuncoder676/AgentShield-X](https://github.com/tharuncoder676/AgentShield-X)**

I'd love to hear your thoughts, critique of the dual-rail approach, and edge-case attacks you’ve encountered with agentic systems!

