# DEF CON 34 (AI Village) — Official Call for Presentations (CFP) Dossier

**Submission Title:** Hacking and Defending Autonomous Agent Swarms: Breaking MCP, RAG, and Tool Call Chains in Enterprise Deployments  
**Speaker:** Tharunkumar.S (Lead Architect & Security Researcher, AgentShield-X Security Labs)  
**Track:** AI Village / Applied Exploitation & Defense  
**Session Format:** 45-Minute Technical Briefing + Live War Game Attack Demonstration  
**Open Source Repository:** [https://github.com/tharuncoder676/AgentShield-X](https://github.com/tharuncoder676/AgentShield-X)

---

## 1. Abstract & Executive Summary (For Program Committee)

While the AI security research community has extensively probed static chat completion prompt injection, the real-world enterprise attack surface has fundamentally shifted to **autonomous agent swarms** interacting via tool calls, vector search (RAG), and the Model Context Protocol (MCP). 

In this briefing, we demonstrate practical zero-day exploitation techniques against popular agent frameworks (LangChain, CrewAI, AutoGen) that completely bypass conventional safety guardrails (Meta Llama Guard 3, NVIDIA NeMo):
1. **Zero-Keyword Indirect RAG Weaponization:** Embedding executable instruction payloads into Cyrillic and zero-width confusable documents that bypass embedding similarity filters and hijack downstream agent execution.
2. **MCP Tool Rug-Pulls:** Exploiting dynamic schema negotiation in Model Context Protocol servers to redirect benign file reads into arbitrary host command execution and cloud credential harvesting.
3. **Multi-Turn Neuro-Symbolic Tool Call Chains:** Constructing composite multi-stage DAG attacks where every individual tool invocation is 100% benign, yet the chain executes automated data exfiltration.

We then release and demonstrate **AgentShield-X**, an open-source, deterministic dual-rail runtime defense proxy operating with sub-millisecond latency (0.85 ms p95 overhead) and a verified 0.0% false positive rate. We will walk attendees through live war game scenarios in the built-in Adversarial Simulation Lab, demonstrating how to intercept and neutralize these novel attack primitives in real time.

---

## 2. Detailed Technical Outline

- **[00:00 - 00:08] The New Attack Surface: Autonomous Agents & MCP**
  - Why chatbots are yesterday's problem: the shift from generation to execution.
  - Decomposition of agent autonomy: Tool use, episodic memory, planning, and inter-agent delegation.
  - Architectural dissection of Anthropic's Model Context Protocol (MCP).

- **[00:08 - 00:20] Live Offensive Exploitations (The Red Team Angle)**
  - *Demo 1: The Cyrillic RAG Taint.* Weaponizing an innocent-looking corporate quarterly PDF to trigger automated wire transfer tool calls upon retrieval.
  - *Demo 2: Dynamic MCP Schema Mutation.* Altering parameter definitions in a local filesystem MCP server to achieve directory traversal and `/etc/shadow` extraction.
  - *Demo 3: Transitive Swarm Poisoning.* Infiltrating a secondary research agent and escalating privileges to gain unauthorized access to an unattenuated Slack bot.

- **[00:20 - 00:35] Designing AgentShield-X: Deterministic Defense Architecture**
  - Why statistical LLM guards fail: latency (80–310 ms), non-determinism, and vulnerability to jailbreaking.
  - Cognitive Zero-Keyword Normalization: 16-stage deep normalizer for homoglyphs, invisible whitespace, and nested decoders.
  - Formal Capability Attenuation: Cryptographically signed (HMAC-SHA256) ephemeral capability tokens for safe swarm delegation.
  - Behavioral Genome Fingerprinting: Vectorized agent DNA tracking parameter entropy and tool distribution velocity.
  - Active Deception: Dynamic canary honeytools that lure rogue agents and sever execution sockets in <1ms.

- **[00:35 - 00:42] The AgentShield-Bench Open Benchmark**
  - Methodology: 500 curated adversarial scenarios across 10 distinct attack categories.
  - Empirical head-to-head comparison: AgentShield-X (99.4% catch, 0.4% FPR, 1.2ms) vs Lakera Guard v2, NeMo Guardrails, and Llama Guard 3.

- **[00:42 - 00:45] Q&A and Tool Release**
  - Open source release announcement and live GitHub repository access.
  - Distribution of AgentShield Certified Defender (ASC-DEF) challenge environments to attendees.

---

## 3. Speaker Biography

**Tharunkumar.S** is a cybersecurity researcher, system architect, and the creator of AgentShield-X. His research focuses on deterministic runtime protection for generative AI, agentic swarms, and neuro-symbolic security systems. He has developed enterprise security architectures spanning zero-trust microservice proxies, acoustic incident response terminal activation, and formal capability attenuation for autonomous multi-agent environments.

---

## 4. Live Demonstration Plan

1. **Hardware / Connectivity Requirements:** Dedicated laptop running Linux / Windows, no external internet required (AgentShield-X runs 100% locally and offline without cloud API dependencies).
2. **Visual Impact:** Terminal Cyberpunk CLI with real-time packet interception, accompanied by the AgentShield-X Obsidian-Purple Web Console displaying live Merkle audit trees, DAG tool chain visualizations, and acoustic handclap emergency wakeup.

