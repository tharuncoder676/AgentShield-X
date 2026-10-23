# AgentShield-X: Live Presentation & Demo Walkthrough Script
## Complete Step-by-Step Feature Demonstration Guide for Project Review
**Architect & Presenter:** Tharunkumar.S  
**Faculty Guide:** Mrs. B. Abisha  
**Live UI:** `http://localhost:3000` | **Backend API:** `http://localhost:8002`

---

## 🔑 1. Login Credentials for Web Console & CLI

| Platform | URL / Command | Email / User | Password | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Web Console (Admin)** | `http://localhost:3000` | `admin@agentshield.dev` | `Password123!` | Owner / Enterprise |
| **Web Console (Analyst)** | `http://localhost:3000` | `analyst@agentshield.test` | `Password123!` | Security Lead |
| **Control API Endpoint** | `http://localhost:8002` | `admin@agentshield.dev` | `Password123!` | JWT Bearer Token |
| **OS Terminal CLI** | `agentshield` (CMD/Bash) | `/login` in CLI | `Password123!` | Interactive Session |

---

## 🎬 2. Step-by-Step Live Demo Presentation Script

### STEP 1: Launch Both Services & Show Health (1 Minute)
* **Action:**
  * Open browser and navigate to `http://localhost:3000`.
  * Enter:
    * **Email:** `admin@agentshield.dev`
    * **Password:** `Password123!`
  * Click **Sign In**.
* **What to say to the Review Panel:**
  > *"Respected guide and examiners, welcome to the live demonstration of AgentShield-X. Here on our dashboard, you can see live operational telemetry across registered autonomous AI agents. The backend is running on port 8002 delivering sub-5ms deterministic security enforcement."*

---

### STEP 2: The GitHub Copilot CLI & OS Terminal (2 Minutes)
* **Action:**
  1. Open a new Command Prompt or Windows Terminal and type:
     ```cmd
     agentshield
     ```
  2. Point out:
     - The macOS traffic-light window controls (`● ● ●`).
     - The corner bracket framing (`┌ ┐ └ ┘`).
     - The 3D typography (`AGENTSHIELD`).
     - The pixel-art Cyber Guardian drone mascot.
     - Creator attribution: **Tharunkumar.S**.
  3. Run the live repository scan directly from terminal:
     ```text
     /scan .
     ```
  4. Point out the zero-dependency AST blast-radius scan results showing untrusted entry points, private data reads, and outbound sinks in **3.4ms**.
  5. In the Web Console, navigate to `http://localhost:3000/terminal` to show the exact matching web terminal with simulated interactive attack commands!

---

### STEP 3: Multi-Agent Consensus Debate & Autonomous AI Judge (2 Minutes)
* **Action:**
  1. In the Web Console, click on **Agents** in the sidebar.
  2. Click into any agent (e.g., `Customer-Support-Agent` or `Financial-Research-Bot`).
  3. In the terminal CLI, demonstrate an ambiguous or suspicious tool call being judged by the 3-judge committee:
     ```text
     /debate send_email --args '{"to": "attacker@evil.test", "body": "Leaked private key"}'
     ```
* **What to say to the Review Panel:**
  > *"When an agent tool call is borderline or ambiguous, AgentShield-X triggers an autonomous 3-agent debate committee: the Security Advocate challenges the risk, the Utility Optimizer defends benign business logic, and the Chief Judge issues a binding verdict with full reasoning transparency."*

---

### STEP 4: Agent-to-Agent (A2A) Cryptographic Attestation (2 Minutes)
* **Action:**
  * In the terminal or Web Console, demonstrate capability token issuance:
    ```text
    /attestation --issuer PlannerBot --target DatabaseSpecialist --tools query_users,read_logs --ttl 30
    ```
* **What to say to the Review Panel:**
  > *"To prevent privilege escalation in multi-agent swarms, AgentShield-X enforces cryptographic delegation. Sub-agents receive ECDSA P-256 signed capability tokens with strict time-to-live and tool whitelists. Any attempt to invoke ungranted tools results in immediate quarantine."*

---

### STEP 5: Model Context Protocol (MCP) Rug-Pull Guard & Connectors Hub (2 Minutes)
* **Action:**
  1. In the Web Console, click on **MCP Proxy** in the navigation bar.
  2. Show the **Universal Connectors Hub** tab:
     - Point out the 1-click auto-configuration cards for **Claude Desktop**, **Cursor IDE**, **Windsurf**, and **VS Code / Continue**.
     - Point out the OpenAI and Anthropic SDK reverse proxy code snippets.
  3. Click on the **Live Gateway Probe** button or test:
     ```text
     /connect all
     ```
  4. Click on **Tool Pins & Lockfile** to show the SHA-256 canonical cryptographic hashes of every registered tool.
* **What to say to the Review Panel:**
  > *"The newest and most dangerous attack vector in agentic AI is the MCP Rug-Pull attack—where a third-party tool server silently updates its description to inject instructions. AgentShield-X dynamically pins tool definitions using canonical SHA-256 hashes and blocks mutated tools before they can reach the LLM."*

---

### STEP 6: Decoy Honeytools & Canary Tripwires (1.5 Minutes)
* **Action:**
  1. In the Web Console, click on **Honeytools** in the navigation bar.
  2. Point out the dynamically deployed honeypot tables and canary API keys across Finance, CloudOps, and Healthcare domains.
  3. In the terminal, run:
     ```text
     /honeytoken finance
     ```
* **What to say to the Review Panel:**
  > *"AgentShield-X automatically injects decoy canary tokens into the agent's context. If a prompt injection attempt tricks the agent into reading or leaking these canary credentials, our tripwire severs the agent's network connection immediately."*

---

### STEP 7: Outbound SIEM Webhooks & Audit Ledger (1.5 Minutes)
* **Action:**
  1. In the Web Console, click on **Audit Log** / **Compliance**.
  2. Show the **SHA-256 Cryptographic Audit Chain** where each event is cryptographically linked to the previous block (`GENESIS_BLOCK -> Block 1 -> Block 2`).
  3. Show the **SIEM Webhooks** dispatcher tab where security incidents are automatically formatted and pushed to Slack, Discord, and PagerDuty in real-time.
* **What to say to the Review Panel:**
  > *"Every security decision is cryptographically sealed in a tamper-evident SHA-256 hash chain that guarantees auditability for SOC2 and NIST AI RMF compliance, while automatically dispatching rich alerts to enterprise SIEM and incident response channels."*

---

### STEP 8: Conclusion & Q&A Summary
* **Summarize the 3 Core Takeaways:**
  1. **Sub-5ms deterministic runtime** that does not slow down AI agent execution.
  2. **End-to-end multi-agent defense** (AST scanning, debate committee, A2A attestation, and honeytools).
  3. **Universal connector compatibility** supporting Claude Desktop, Cursor, Windsurf, LangChain, CrewAI, and native MCP.
