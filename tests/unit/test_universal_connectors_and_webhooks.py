"""
Unit tests for Universal Connector Suite, Native MCP Server, SIEM Webhooks, and LLM Proxy.
Architect & Creator: Tharunkumar.S
"""

import asyncio
import json
import pytest
from shield_mcp.connectors import ConnectorManager
from shield_mcp.server import AgentShieldMCPServer
from shield_mcp.models import JSONRPCMessage
from shield_core.webhooks import WebhookDispatcher, WebhookPlatform, AlertSeverity


class TestUniversalConnectors:
    def test_connector_status_detection(self):
        statuses = ConnectorManager.get_all_connector_statuses()
        ids = [c["id"] for c in statuses]
        assert "claude" in ids
        assert "cursor" in ids
        assert "windsurf" in ids
        assert "continue" in ids

    def test_claude_desktop_auto_configure(self):
        ok, msg = ConnectorManager.auto_configure_claude_desktop()
        assert ok is True
        assert "Claude Desktop" in msg

        # Read back config to ensure agentshield-security is present
        config_path = ConnectorManager.get_claude_desktop_config_path()
        with open(config_path, "r", encoding="utf-8") as f:
            cfg = json.load(f)
        assert "mcpServers" in cfg
        assert "agentshield-security" in cfg["mcpServers"]
        assert "shield_mcp.cli" in cfg["mcpServers"]["agentshield-security"]["args"]

    def test_cursor_auto_configure(self):
        ok, msg = ConnectorManager.auto_configure_cursor()
        assert ok is True
        assert "Cursor IDE" in msg

    def test_windsurf_auto_configure(self):
        ok, msg = ConnectorManager.auto_configure_windsurf()
        assert ok is True
        assert "Windsurf" in msg

    def test_continue_auto_configure(self):
        ok, msg = ConnectorManager.auto_configure_continue()
        assert ok is True
        assert "Continue" in msg


class TestNativeMCPServer:
    def test_mcp_initialize_handshake(self):
        server = AgentShieldMCPServer()
        msg = JSONRPCMessage(
            jsonrpc="2.0",
            id=1,
            method="initialize",
            params={"clientInfo": {"name": "claude-desktop", "version": "0.1.0"}},
        )
        resp = asyncio.run(server.handle_request(msg))
        assert resp is not None
        assert resp["result"]["serverInfo"]["name"] == "agentshield-security-server"
        assert resp["result"]["capabilities"]["tools"] is not None

    def test_mcp_list_tools(self):
        server = AgentShieldMCPServer()
        msg = JSONRPCMessage(jsonrpc="2.0", id=2, method="tools/list")
        resp = asyncio.run(server.handle_request(msg))
        assert resp is not None
        tool_names = [t["name"] for t in resp["result"]["tools"]]
        assert "agentshield_verify_tool_call" in tool_names
        assert "agentshield_inspect_payload" in tool_names
        assert "agentshield_redact_secrets" in tool_names
        assert "agentshield_attest_citation" in tool_names
        assert "agentshield_scan_repo" in tool_names

    def test_mcp_call_verify_tool(self):
        server = AgentShieldMCPServer()
        msg = JSONRPCMessage(
            jsonrpc="2.0",
            id=3,
            method="tools/call",
            params={
                "name": "agentshield_verify_tool_call",
                "arguments": {
                    "tool_name": "run_terminal_command",
                    "arguments": {"cmd": "rm -rf /"},
                },
            },
        )
        resp = asyncio.run(server.handle_request(msg))
        assert resp is not None
        payload = json.loads(resp["result"]["content"][0]["text"])
        assert payload["decision"] == "BLOCK"
        assert payload["latency_ms"] < 50.0


class TestSIEMWebhooks:
    def test_register_and_list_webhooks(self):
        WebhookDispatcher.clear_webhooks()
        WebhookDispatcher.register_webhook(
            url="https://hooks.slack.com/services/T00/B00/X00",
            platform="slack",
            min_severity="high",
        )
        webhooks = WebhookDispatcher.get_webhooks()
        assert len(webhooks) == 1
        assert webhooks[0]["platform"] == "slack"
        assert webhooks[0]["min_severity"] == "high"

    def test_format_slack_block(self):
        blocks = WebhookDispatcher._format_slack_block(
            title="Unauthorized Tool Call Blocked",
            severity="critical",
            details={"tool": "export_all_users"},
            agent_id="support_bot_v2",
            rule="BLOCK_HIGH_SENSITIVITY",
        )
        assert "blocks" in blocks
        assert len(blocks["blocks"]) >= 4
        assert "Tharunkumar.S" in json.dumps(blocks)

    def test_format_discord_embed(self):
        data = WebhookDispatcher._format_discord_embed(
            title="Canary Token Exfiltration Prevented",
            severity="critical",
            details={"token": "canary-uuid-1234"},
            agent_id="copilot_assistant",
            rule="HONEYTOKEN_CANARY_TRIPPED",
        )
        assert "embeds" in data
        assert len(data["embeds"]) == 1
        assert data["embeds"][0]["color"] == 0xE02424
        assert "Tharunkumar.S" in data["embeds"][0]["footer"]["text"]
