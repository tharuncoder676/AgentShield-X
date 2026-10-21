# AgentShield-X MCP Security Proxy & Tool Rug-Pull Guard

The AgentShield-X MCP Security Proxy protects autonomous AI agents from Model Context Protocol (MCP) supply-chain attacks, including:
1. **Tool Rug-Pulls**: Dynamic alteration of tool descriptions or JSON schemas by a compromised or malicious upstream MCP server after initial trust establishment.
2. **Tool-Poisoning & Prompt Injection**: Embedded imperative overrides, hidden delimiter markers, and data exfiltration traps inside tool schemas.
3. **Sensitive Sink Exploitation**: Enforcing deterministic AgentShield-X policy decisions on every `tools/call`.
4. **Untrusted Resource Tainting**: Marking all upstream `resources/read` and tool outputs with cryptographic provenance and canary markers.

## Architecture

```
[ MCP Client: Claude Desktop / AI Agent ]
                   ↕ (stdio / HTTP)
       +-----------------------+
       | AgentShield MCP Proxy |
       | - Tool Hash Pinning   |
       | - Rug-Pull Guard      |
       | - Prompt Inj Scanner  |
       | - Policy Engine Gate  |
       | - Taint Labeler       |
       +-----------------------+
                   ↕ (stdio / HTTP)
   [ Upstream MCP Server: DB / Web / Shell ]
```

## Usage

```bash
# Learn & Pin tool definitions to a lockfile:
agentshield mcp-proxy --upstream "python my_mcp_server.py" --pins mcp_pins.json --mode pin

# Enforce strict zero-trust proxy (blocks any mutated or poisoned tools):
agentshield mcp-proxy --upstream "python my_mcp_server.py" --pins mcp_pins.json --mode enforce
```
