"""
AgentShield-X MCP Security CLI
Provides commands for running the MCP security proxy and inspecting MCP servers.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import shlex
import sys
from pathlib import Path
from typing import List, Optional

# Ensure UTF-8 output on Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from shield_mcp.hasher import compute_tool_pin
from shield_mcp.interceptors import (
    ResourceTaintInterceptor,
    RugPullGuardInterceptor,
    ToolCallPolicyInterceptor,
    ToolPoisoningInterceptor,
)
from shield_mcp.models import ProxyMode, RugPullAlert
from shield_mcp.pin_store import FilePinStore
from shield_mcp.pipeline import MCPSecurityPipeline
from shield_mcp.proxy import MCPSecurityProxy
from shield_mcp.scanner import ToolPoisoningScanner


def setup_logger(verbose: bool = False):
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="[%(asctime)s] [%(levelname)s] [AgentShield-MCP] %(message)s",
        datefmt="%H:%M:%S",
        stream=sys.stderr,
    )


def build_pipeline(
    pin_file: Path,
    mode: ProxyMode = ProxyMode.ENFORCE,
    strict_unpinned: bool = True,
    enable_poisoning_scan: bool = True,
    enable_taint: bool = True,
    disallowed_tools: Optional[List[str]] = None,
) -> Tuple[MCPSecurityPipeline, FilePinStore]:
    pin_store = FilePinStore(pin_file)
    pipeline = MCPSecurityPipeline()

    # 1. Rug-pull integrity guard
    def on_rugpull(alert: RugPullAlert):
        sys.stderr.write(
            f"\n🚨 [CRITICAL AGENTSHIELD ALERT] Tool Rug-Pull Detected on '{alert.tool_name}'!\n"
            f"   Pinned Hash:   {alert.pinned_hash[:16]}...\n"
            f"   Observed Hash: {alert.observed_hash[:16]}...\n"
            f"   Details:       {alert.diff_summary}\n"
            f"   Action Taken:  {alert.action_taken.upper()}\n\n"
        )
        sys.stderr.flush()

    rugpull_guard = RugPullGuardInterceptor(
        pin_store=pin_store,
        mode=mode,
        strict_unpinned=strict_unpinned,
        on_alert=on_rugpull,
    )
    pipeline.add_interceptor(rugpull_guard)

    # 2. Tool-poisoning injection scanner
    if enable_poisoning_scan:
        def on_poison(tool_name: str, reasons: List[str]):
            sys.stderr.write(
                f"\n⚠️  [SECURITY WARNING] Poisoned Tool Intercepted: '{tool_name}'\n"
                f"   Findings: {'; '.join(reasons)}\n"
                f"   Action: Tool stripped from agent visibility.\n\n"
            )
            sys.stderr.flush()

        poison_guard = ToolPoisoningInterceptor(
            scanner=ToolPoisoningScanner(),
            on_poison=on_poison,
        )
        pipeline.add_interceptor(poison_guard)

    # 3. Tool call policy interceptor
    policy_guard = ToolCallPolicyInterceptor(disallowed_tools=disallowed_tools)
    pipeline.add_interceptor(policy_guard)

    # 4. Resource & output tainting
    if enable_taint:
        pipeline.add_interceptor(ResourceTaintInterceptor())

    return pipeline, pin_store


async def run_inspect(upstream_cmd: str, save_pins_to: Optional[Path] = None) -> int:
    """Connects to upstream MCP server, invokes tools/list, inspects definitions, and prints a report."""
    print(f"[*] Connecting to MCP server: {upstream_cmd}")
    cmd = shlex.split(upstream_cmd)

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=sys.stderr,
    )

    # Send MCP initialize
    init_req = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "AgentShield-MCP-Inspector", "version": "1.0"},
        },
    }
    assert proc.stdin and proc.stdout
    proc.stdin.write((json.dumps(init_req) + "\n").encode("utf-8"))
    await proc.stdin.drain()

    # Read initialize response
    init_resp_line = await proc.stdout.readline()

    # Send tools/list
    list_req = {"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}
    proc.stdin.write((json.dumps(list_req) + "\n").encode("utf-8"))
    await proc.stdin.drain()

    list_resp_line = await proc.stdout.readline()
    proc.terminate()

    try:
        data = json.loads(list_resp_line.decode("utf-8"))
    except Exception as e:
        print(f"[!] Failed to parse tools/list response: {e}", file=sys.stderr)
        return 1

    tools = data.get("result", {}).get("tools", [])
    print(f"[+] Discovered {len(tools)} tools from upstream MCP server.\n")

    scanner = ToolPoisoningScanner()
    pin_store = FilePinStore(save_pins_to) if save_pins_to else None

    print(f"{'Tool Name':<24} {'Canonical Hash':<18} {'Poisoning':<12} {'Status'}")
    print("-" * 75)

    for t in tools:
        name = t.get("name", "unknown")
        pin = compute_tool_pin(t)
        is_poisoned, reasons = scanner.scan_tool(t)

        poison_label = "POISONED ⚠️" if is_poisoned else "Clean ✓"
        status_label = "PINNED" if pin_store else "DISCOVERED"

        print(f"{name:<24} {pin.canonical_hash[:16]}... {poison_label:<12} {status_label}")

        if is_poisoned:
            for r in reasons:
                print(f"   └─ Warning: {r}")

        if pin_store:
            pin_store.save_pin(pin)

    if save_pins_to:
        print(f"\n[✓] Successfully locked {len(tools)} tools to pinfile: {save_pins_to}")

    return 0


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        prog="agentshield-mcp",
        description="AgentShield-X: MCP Security Proxy & Tool Rug-Pull Guard",
    )
    subparsers = parser.add_subparsers(dest="subcommand", help="Available subcommands")

    # Command: proxy
    proxy_parser = subparsers.add_parser("proxy", help="Run the inline MCP security proxy")
    proxy_parser.add_argument(
        "--upstream",
        required=True,
        help="Command to spawn the upstream MCP server (e.g. 'python my_server.py' or 'npx -y @modelcontextprotocol/server-postgres')",
    )
    proxy_parser.add_argument(
        "--pins",
        default="./mcp_pins.json",
        help="Path to tool pins lockfile (default: ./mcp_pins.json)",
    )
    proxy_parser.add_argument(
        "--mode",
        choices=["enforce", "observe", "pin"],
        default="enforce",
        help="Proxy enforcement mode (default: enforce)",
    )
    proxy_parser.add_argument(
        "--disallow-tool",
        action="append",
        default=[],
        help="Specific tool names to block outright on dispatch",
    )
    proxy_parser.add_argument(
        "--no-strict",
        action="store_true",
        help="Allow unpinned tools through with a warning",
    )
    proxy_parser.add_argument(
        "--no-poison-scan",
        action="store_true",
        help="Disable deep prompt-injection scanning of tool descriptions",
    )
    proxy_parser.add_argument(
        "--no-taint",
        action="store_true",
        help="Disable automatic untrusted output wrapping",
    )
    proxy_parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose debug logging to stderr",
    )

    # Command: inspect
    inspect_parser = subparsers.add_parser("inspect", help="Inspect an MCP server and generate pinned hashes")
    inspect_parser.add_argument(
        "--upstream",
        required=True,
        help="Command to spawn the upstream MCP server to inspect",
    )
    inspect_parser.add_argument(
        "--save-pins",
        default=None,
        help="Optional path to save pinned tool definitions lockfile",
    )

    # Command: serve (Native MCP Server)
    serve_parser = subparsers.add_parser("serve", help="Start native AgentShield MCP Security Tools Server for Claude, Cursor, etc.")
    serve_parser.add_argument(
        "--name",
        default="agentshield-security-server",
        help="Server name reported in MCP initialize handshake",
    )

    # Command: connect (Auto-configurator)
    connect_parser = subparsers.add_parser("connect", help="1-Click auto-configure AgentShield in Claude Desktop, Cursor, Windsurf, etc.")
    connect_parser.add_argument(
        "target",
        nargs="?",
        default="all",
        choices=["claude", "cursor", "windsurf", "continue", "all"],
        help="Target client to configure (default: all)",
    )

    # Command: status (Connector health check)
    subparsers.add_parser("status", help="Check installation and configuration status of AI agent / IDE connectors")

    args = parser.parse_args(argv)

    if args.subcommand == "serve":
        from shield_mcp.server import AgentShieldMCPServer
        server = AgentShieldMCPServer(server_name=args.name)
        try:
            asyncio.run(server.run_stdio())
        except (KeyboardInterrupt, asyncio.CancelledError):
            pass
        return 0

    elif args.subcommand == "connect":
        from shield_mcp.connectors import ConnectorManager
        target = args.target.lower()
        if target == "claude":
            ok, msg = ConnectorManager.auto_configure_claude_desktop()
            print(f"[{'OK' if ok else 'FAIL'}] {msg}")
        elif target == "cursor":
            ok, msg = ConnectorManager.auto_configure_cursor()
            print(f"[{'OK' if ok else 'FAIL'}] {msg}")
        elif target == "windsurf":
            ok, msg = ConnectorManager.auto_configure_windsurf()
            print(f"[{'OK' if ok else 'FAIL'}] {msg}")
        elif target == "continue":
            ok, msg = ConnectorManager.auto_configure_continue()
            print(f"[{'OK' if ok else 'FAIL'}] {msg}")
        else:
            res = ConnectorManager.auto_configure_all()
            for k, v in res.items():
                print(f"[{'OK' if v['success'] else 'FAIL'}] {k.upper()}: {v['message']}")
        return 0

    elif args.subcommand == "status":
        from shield_mcp.connectors import ConnectorManager
        statuses = ConnectorManager.get_all_connector_statuses()
        print("\n================ AgentShield-X Connector Status ================")
        for s in statuses:
            tag = "[PROTECTED]" if s["is_configured"] else ("[DETECTED] " if s["is_detected"] else "[NOT FOUND]")
            print(f" {tag:<12} {s['name']:<22} Path: {s['config_path']}")
        print("===============================================================\n")
        return 0

    elif not args.subcommand or args.subcommand == "proxy":
        upstream = getattr(args, "upstream", None)
        if not upstream:
            parser.print_help()
            return 0

        setup_logger(getattr(args, "verbose", False))
        pin_file = Path(args.pins)
        mode = ProxyMode(args.mode)

        pipeline, _ = build_pipeline(
            pin_file=pin_file,
            mode=mode,
            strict_unpinned=not args.no_strict,
            enable_poisoning_scan=not args.no_poison_scan,
            enable_taint=not args.no_taint,
            disallowed_tools=args.disallow_tool,
        )

        proxy = MCPSecurityProxy(
            upstream_cmd=args.upstream,
            pipeline=pipeline,
        )

        try:
            asyncio.run(proxy.run())
        except (KeyboardInterrupt, asyncio.CancelledError):
            proxy.stop()
        return 0

    elif args.subcommand == "inspect":
        save_path = Path(args.save_pins) if args.save_pins else None
        return asyncio.run(run_inspect(args.upstream, save_path))

    return 0


if __name__ == "__main__":
    sys.exit(main())
