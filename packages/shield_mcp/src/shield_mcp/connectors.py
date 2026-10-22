"""
AgentShield-X Universal Connectors & Auto-Configurator
Enables 1-click zero-friction integration for:
- Claude Desktop
- Cursor IDE
- Windsurf (Codeium)
- VS Code (Continue / GitHub Copilot)
"""

from __future__ import annotations

import json
import os
import shutil
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


def get_claude_desktop_config_path() -> Path:
    """Returns platform-specific path to Claude Desktop configuration file."""
    if sys.platform == "win32":
        app_data = os.getenv("APPDATA", "")
        return Path(app_data) / "Claude" / "claude_desktop_config.json"
    elif sys.platform == "darwin":
        return Path.home() / "Library" / "Application Support" / "Claude" / "claude_desktop_config.json"
    else:
        return Path.home() / ".config" / "Claude" / "claude_desktop_config.json"


def get_cursor_mcp_config_path() -> Path:
    """Returns platform-specific path to Cursor IDE MCP configuration file."""
    if sys.platform == "win32":
        app_data = os.getenv("APPDATA", "")
        # Check standard Cursor / Cline paths
        cline_path = Path(app_data) / "Cursor" / "User" / "globalStorage" / "saoudrizwan.claude-dev" / "settings" / "cline_mcp_settings.json"
        if cline_path.parent.exists():
            return cline_path
        return Path(app_data) / "Cursor" / "mcp.json"
    elif sys.platform == "darwin":
        return Path.home() / "Library" / "Application Support" / "Cursor" / "mcp.json"
    else:
        return Path.home() / ".config" / "Cursor" / "mcp.json"


def get_windsurf_mcp_config_path() -> Path:
    """Returns platform-specific path to Windsurf (Codeium) MCP configuration file."""
    return Path.home() / ".codeium" / "windsurf" / "mcp_config.json"


def get_continue_config_path() -> Path:
    """Returns platform-specific path to VS Code Continue extension configuration."""
    return Path.home() / ".continue" / "config.json"


class ConnectorManager:
    """
    Manages detection, status checks, and 1-click automated injection of AgentShield-X
    into all major AI agent and IDE connector targets.
    """

    get_claude_desktop_config_path = staticmethod(get_claude_desktop_config_path)
    get_cursor_mcp_config_path = staticmethod(get_cursor_mcp_config_path)
    get_windsurf_mcp_config_path = staticmethod(get_windsurf_mcp_config_path)
    get_continue_config_path = staticmethod(get_continue_config_path)

    @staticmethod
    def get_agentshield_python_exec() -> str:
        """Returns the Python executable running AgentShield."""
        return sys.executable

    @classmethod
    def generate_server_config(cls) -> Dict[str, Any]:
        """Generates standard MCP server configuration for AgentShield-X."""
        py_exec = cls.get_agentshield_python_exec()
        return {
            "command": py_exec,
            "args": ["-m", "shield_mcp.cli", "serve"],
            "env": {
                "PYTHONUNBUFFERED": "1",
            },
        }

    @classmethod
    def get_all_connector_statuses(cls) -> List[Dict[str, Any]]:
        """Returns live detection and configuration status across all client targets."""
        connectors = [
            ("claude", "Claude Desktop", get_claude_desktop_config_path()),
            ("cursor", "Cursor IDE", get_cursor_mcp_config_path()),
            ("windsurf", "Windsurf IDE", get_windsurf_mcp_config_path()),
            ("continue", "VS Code (Continue)", get_continue_config_path()),
        ]

        results = []
        for cid, name, path in connectors:
            installed = path.parent.exists() or path.exists()
            configured = False
            config_snippet = cls.generate_server_config()

            if path.exists():
                try:
                    data = json.loads(path.read_text(encoding="utf-8"))
                    mcp_servers = data.get("mcpServers", {})
                    if "agentshield-security" in mcp_servers:
                        configured = True
                except Exception:
                    pass

            results.append({
                "id": cid,
                "name": name,
                "config_path": str(path),
                "is_detected": installed,
                "is_configured": configured,
                "status": "PROTECTED" if configured else ("DETECTED" if installed else "NOT_FOUND"),
                "sample_config": {
                    "mcpServers": {
                        "agentshield-security": config_snippet,
                    }
                },
            })

        return results

    @classmethod
    def auto_configure_claude_desktop(cls) -> Tuple[bool, str]:
        """Automatically injects AgentShield-X into Claude Desktop configuration."""
        path = get_claude_desktop_config_path()
        return cls._inject_mcp_server(path, "Claude Desktop")

    @classmethod
    def auto_configure_cursor(cls) -> Tuple[bool, str]:
        """Automatically injects AgentShield-X into Cursor IDE configuration."""
        path = get_cursor_mcp_config_path()
        return cls._inject_mcp_server(path, "Cursor IDE")

    @classmethod
    def auto_configure_windsurf(cls) -> Tuple[bool, str]:
        """Automatically injects AgentShield-X into Windsurf configuration."""
        path = get_windsurf_mcp_config_path()
        return cls._inject_mcp_server(path, "Windsurf")

    @classmethod
    def auto_configure_continue(cls) -> Tuple[bool, str]:
        """Automatically injects AgentShield-X into Continue configuration."""
        path = get_continue_config_path()
        return cls._inject_mcp_server(path, "VS Code (Continue)")

    @classmethod
    def auto_configure_all(cls) -> Dict[str, Any]:
        """Auto-configures all detected clients on this machine."""
        out = {}
        ok_claude, msg_claude = cls.auto_configure_claude_desktop()
        out["claude"] = {"success": ok_claude, "message": msg_claude}

        ok_cursor, msg_cursor = cls.auto_configure_cursor()
        out["cursor"] = {"success": ok_cursor, "message": msg_cursor}

        ok_windsurf, msg_windsurf = cls.auto_configure_windsurf()
        out["windsurf"] = {"success": ok_windsurf, "message": msg_windsurf}

        ok_continue, msg_continue = cls.auto_configure_continue()
        out["continue"] = {"success": ok_continue, "message": msg_continue}

        return out

    @classmethod
    def _inject_mcp_server(cls, config_path: Path, client_name: str) -> Tuple[bool, str]:
        try:
            config_path.parent.mkdir(parents=True, exist_ok=True)
            existing_data: Dict[str, Any] = {}

            if config_path.exists():
                try:
                    # Create timestamped backup
                    backup_path = config_path.with_suffix(".backup.json")
                    shutil.copyfile(config_path, backup_path)
                    existing_data = json.loads(config_path.read_text(encoding="utf-8"))
                except Exception as e:
                    logger_msg = f"Failed to read existing {client_name} config: {e}"
                    existing_data = {}

            if "mcpServers" not in existing_data or not isinstance(existing_data["mcpServers"], dict):
                existing_data["mcpServers"] = {}

            # Inject AgentShield security server
            existing_data["mcpServers"]["agentshield-security"] = cls.generate_server_config()

            config_path.write_text(json.dumps(existing_data, indent=2), encoding="utf-8")
            return True, f"Successfully injected AgentShield-X into {client_name} at {config_path}"
        except Exception as e:
            return False, f"Error configuring {client_name}: {str(e)}"
