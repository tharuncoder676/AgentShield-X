# 🛡️ AgentShield-X: VS Code & Cursor Extension (Feature #22)

> **Official VS Code Extension for Autonomous AI Agent Security**  
> Architect: Tharunkumar.S | AgentShield-X Security Labs  
> Repository: [https://github.com/tharuncoder676/AgentShield-X](https://github.com/tharuncoder676/AgentShield-X)

---

## ⚡ Features

- **Inline Security Warnings:** Instant red squiggles and warnings for vulnerable agent code (e.g., raw `os.system` in tools, hardcoded API secrets, unpinned MCP servers).
- **1-Click Canary Honeytool Insertion:** Injects signed canary traps (`query_sql_database_admin`) into Python and TypeScript agent tools with a single click.
- **Model Context Protocol (MCP) Audit:** Scans `.cursor/mcp.json` and `mcp.json` to prevent dynamic tool schema mutations and path traversal rug-pulls.
- **Real-Time Defense Status:** Status bar widget showing daemon connection, latency, and active OPA policy count.
- **Sub-Millisecond Engine:** Interacts directly with the local AgentShield-X daemon on port 8002 with zero cloud data transmission.

---

## 🚀 Installation & Setup

1. Launch **AgentShield-X** local control plane:
   ```bash
   agentshield wakeup
   ```
2. Open VS Code Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):
   ```
   > AgentShield-X: Scan Workspace for Agentic Vulnerabilities
   ```
3. Insert Canary Honeytools:
   ```
   > AgentShield-X: Insert Active Canary Honeytool Trap
   ```

