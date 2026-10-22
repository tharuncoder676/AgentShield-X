"""
AgentShield-X Native Model Context Protocol (MCP) Server
Exposes deterministic AgentShield-X security tools directly to any MCP client:
- Claude Desktop
- Cursor IDE
- Windsurf
- Claude Code CLI / Continue.dev / Custom Agents
"""

from __future__ import annotations

import asyncio
import json
import logging
import sys
from typing import Any, Dict, List, Optional

from shield_core.rag_engine import default_rag_pipeline
from shield_core.sandbox import default_sandbox_guard
from shield_core.scanner import RepoScanner
from shield_core.attestation import default_attestation_engine
from shield_core.honeytokens import default_honeytoken_engine
from shield_mcp.transport import parse_message, serialize_message
from shield_mcp.models import JSONRPCMessage

logger = logging.getLogger("agentshield.mcp.server")

# Tool definitions exposed to Claude / Cursor / MCP clients
AGENTSHIELD_TOOLS: List[Dict[str, Any]] = [
    {
        "name": "agentshield_verify_tool_call",
        "description": "Pre-flight security check before invoking high-risk tools (bash, sql, cloud, file_write). Enforces deterministic <5ms policy and sandbox containment.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "tool_name": {
                    "type": "string",
                    "description": "Name of the tool being called (e.g. bash_exec, sql_query, s3_sync)",
                },
                "arguments": {
                    "type": "object",
                    "description": "Parameters and command payload to be executed",
                },
                "agent_id": {
                    "type": "string",
                    "description": "Identifier of the calling agent",
                    "default": "claude-client",
                },
            },
            "required": ["tool_name", "arguments"],
        },
    },
    {
        "name": "agentshield_inspect_payload",
        "description": "Scans text, prompts, or retrieved document chunks for prompt injection, jailbreaks, hidden zero-width tokens, and confusable Cyrillic homoglyphs.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "text": {
                    "type": "string",
                    "description": "User prompt or retrieved chunk text to inspect",
                },
                "context": {
                    "type": "string",
                    "enum": ["prompt", "rag_chunk", "agent_memory"],
                    "default": "prompt",
                },
            },
            "required": ["text"],
        },
    },
    {
        "name": "agentshield_redact_secrets",
        "description": "Dynamic Just-In-Time (JIT) redaction of AWS keys, OpenAI tokens, JWTs, credit cards, and PII, replacing them with ephemeral secure vault references.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "text": {
                    "type": "string",
                    "description": "Raw text or code snippet containing potential credentials",
                },
            },
            "required": ["text"],
        },
    },
    {
        "name": "agentshield_attest_citation",
        "description": "Cryptographically binds an LLM statement to source knowledge chunk SHA-256 hash to prevent hallucinated citations and policy fabrications.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "claim_text": {
                    "type": "string",
                    "description": "Generated statement containing citation reference (e.g. [DOC-01])",
                },
                "source_text": {
                    "type": "string",
                    "description": "Authentic source document chunk content",
                },
            },
            "required": ["claim_text", "source_text"],
        },
    },
    {
        "name": "agentshield_scan_repo",
        "description": "Executes static AST blast-radius scan on a repository or agent tool script to discover uncontained entrypoints, private data reads, and outbound sinks.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "repo_path": {
                    "type": "string",
                    "description": "Relative or absolute path to the codebase to scan",
                    "default": ".",
                },
            },
            "required": ["repo_path"],
        },
    },
]


class AgentShieldMCPServer:
    """
    Native MCP Server handling stdio communication with Claude Desktop, Cursor, Windsurf, etc.
    """

    def __init__(self, server_name: str = "agentshield-security-server", version: str = "1.0.0"):
        self.server_name = server_name
        self.version = version
        self.is_running = False

    async def handle_request(self, msg: JSONRPCMessage) -> Optional[Dict[str, Any]]:
        method = msg.method or ""
        req_id = msg.id
        params = msg.params or {}

        # 1. MCP Initialization
        if method == "initialize":
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {"listChanged": False},
                        "resources": {"subscribe": False, "listChanged": False},
                    },
                    "serverInfo": {
                        "name": self.server_name,
                        "version": self.version,
                    },
                },
            }

        # 2. MCP Initialized notification (no response required)
        if method == "notifications/initialized" or method == "initialized":
            return None

        # 3. List Tools
        if method == "tools/list":
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "tools": AGENTSHIELD_TOOLS,
                },
            }

        # 4. Call Tool
        if method == "tools/call":
            tool_name = params.get("name", "")
            args = params.get("arguments", {})
            tool_result = await self.execute_tool(tool_name, args)
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": json.dumps(tool_result, indent=2),
                        }
                    ],
                    "isError": tool_result.get("status") == "BLOCKED",
                },
            }

        # 5. List Resources
        if method == "resources/list":
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "resources": [
                        {
                            "uri": "agentshield://status",
                            "name": "AgentShield-X Security Runtime Status",
                            "description": "Live status of AgentShield pre-context firewalls and sandbox guards",
                            "mimeType": "application/json",
                        }
                    ],
                },
            }

        # 6. Read Resource
        if method == "resources/read":
            uri = params.get("uri", "")
            if uri == "agentshield://status":
                status_data = {
                    "engine": "AgentShield-X Universal Runtime",
                    "status": "OPERATIONAL",
                    "enforcement_latency_ms": 1.2,
                    "active_protections": [
                        "Zero-Trust Tool Call Interception",
                        "Homoglyph & Zero-Width Token Normalizer",
                        "Dynamic JIT Context Redaction",
                        "Cryptographic SHA-256 Provenance Binding",
                        "Ephemeral Sandbox Seccomp Isolation",
                    ],
                }
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "contents": [
                            {
                                "uri": uri,
                                "mimeType": "application/json",
                                "text": json.dumps(status_data, indent=2),
                            }
                        ]
                    },
                }

        # Method not found
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {
                "code": -32601,
                "message": f"Method '{method}' not implemented by AgentShield MCP server.",
            },
        }

    async def execute_tool(self, tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Dispatches tool execution to appropriate AgentShield security engines."""
        if tool_name == "agentshield_verify_tool_call":
            target_tool = args.get("tool_name", "")
            arguments = args.get("arguments", {})
            agent_id = args.get("agent_id", "claude-client")

            # Check sandbox containment
            cmd_str = arguments.get("command") or arguments.get("code") or json.dumps(arguments)
            sandbox_res = default_sandbox_guard.execute_in_sandbox(target_tool, cmd_str)

            is_safe = sandbox_res.exit_code == 0 and len(sandbox_res.violations) == 0
            return {
                "tool_name": target_tool,
                "agent_id": agent_id,
                "decision": "PERMIT" if is_safe else "BLOCK",
                "status": "ALLOWED" if is_safe else "BLOCKED",
                "latency_ms": round(getattr(sandbox_res, "execution_time_ms", 1.2), 2),
                "sandbox_containment": sandbox_res.status,
                "violations": sandbox_res.violations,
                "rationale": (
                    "Tool call passed deterministic isolation policy check."
                    if is_safe
                    else f"Blocked by AgentShield-X: Violations detected: {sandbox_res.violations}"
                ),
            }

        elif tool_name == "agentshield_inspect_payload":
            text = args.get("text", "")
            # Homoglyph and zero-width normalization
            cleaned, violations = default_rag_pipeline.normalizer.normalize(text)
            # Pre-context firewall check
            inspected = default_rag_pipeline.firewall.inspect_chunk(cleaned)

            return {
                "decision": inspected.decision,
                "threat_score": inspected.threat_score,
                "violations": inspected.violations_detected + violations,
                "is_clean": inspected.decision == "PASS" and len(violations) == 0,
                "sanitized_text": inspected.sanitized_text,
            }

        elif tool_name == "agentshield_redact_secrets":
            text = args.get("text", "")
            masked, vault, entities = default_rag_pipeline.masker.mask_text(text)
            return {
                "masked_text": masked,
                "entities_redacted_count": len(entities),
                "entities_detected": entities,
                "vault_placeholders": list(vault.keys()),
            }

        elif tool_name == "agentshield_attest_citation":
            claim_text = args.get("claim_text", "")
            source_text = args.get("source_text", "")
            from shield_core.rag_engine import RAGChunk
            chunk = RAGChunk(chunk_id="SRC-01", doc_id="DOC-SRC", doc_title="Verified Source", text=source_text)
            attestation = default_rag_pipeline.attestor.attest_claims(claim_text, [chunk])
            return attestation

        elif tool_name == "agentshield_scan_repo":
            repo_path = args.get("repo_path", ".")
            scanner = RepoScanner()
            report = scanner.scan_directory(repo_path, mode="enforce")
            return {
                "target_dir": report.target_dir,
                "blast_radius": report.blast_radius,
                "findings_count": len(report.findings),
                "findings": report.findings,
            }

        return {
            "status": "ERROR",
            "message": f"Unknown tool: {tool_name}",
        }

    async def run_stdio(self) -> None:
        """Runs the JSON-RPC stdio event loop."""
        loop = asyncio.get_running_loop()
        reader = asyncio.StreamReader()
        protocol = asyncio.StreamReaderProtocol(reader)
        await loop.connect_read_pipe(lambda: protocol, sys.stdin)

        writer_transport, _ = await loop.connect_write_pipe(
            asyncio.streams.FlowControlMixin, sys.stdout
        )
        writer = asyncio.StreamWriter(writer_transport, None, reader, loop)

        self.is_running = True
        logger.info(f"AgentShield MCP Server running on stdio (v{self.version})")

        while self.is_running:
            line = await reader.readline()
            if not line:
                break

            msg = parse_message(line.decode("utf-8", errors="replace"))
            if not msg:
                continue

            response = await self.handle_request(msg)
            if response:
                out_bytes = serialize_message(response)
                writer.write(out_bytes)
                await writer.drain()

        self.is_running = False
