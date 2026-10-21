"""
AgentShield-X MCP Tool-Poisoning & Injection Scanner
Detects hidden instructions, imperative overrides, and exfiltration attempts
embedded within MCP tool descriptions and argument schemas.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Tuple, Union

from shield_mcp.models import MCPToolDefinition

# Regex patterns for adversarial overrides in tool definitions
POISON_PATTERNS = [
    (
        "RULE_INJECTION_OVERRIDE",
        re.compile(
            r"(ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|directives|rules)|disregard\s+(all\s+)?prior)",
            re.IGNORECASE,
        ),
    ),
    (
        "RULE_FAKE_SYSTEM_TAG",
        re.compile(
            r"(\[SYSTEM\s*(NOTE|DIRECTIVE|MESSAGE)?\]|<<SYS>>|<\|system\|>|###\s*System:)",
            re.IGNORECASE,
        ),
    ),
    (
        "RULE_ADMIN_PRIVILEGE_HIJACK",
        re.compile(
            r"(system\s+override|admin\s+mode\s+enabled|you\s+must\s+now\s+execute|developer\s+mode\s+active)",
            re.IGNORECASE,
        ),
    ),
    (
        "RULE_EXFIL_MARKDOWN_URL",
        re.compile(
            r"(!\[.*?\]\(https?://[^\s\)]+|href=[\"']https?://[^\s\"']+)",
            re.IGNORECASE,
        ),
    ),
    (
        "RULE_EXFIL_INSTRUCTION",
        re.compile(
            r"(send|forward|exfiltrate|transmit|upload|export)\s+(all\s+)?(secrets|credentials|tokens|keys|passwords|env|environment|history)\s+to\b",
            re.IGNORECASE,
        ),
    ),
]

# Zero-width / invisible unicode characters often used for steganographic injection
INVISIBLE_CHARS_REGEX = re.compile(r"[\u200B-\u200D\uFEFF\u202A-\u202E]")


class ToolPoisoningScanner:
    """Scans MCP tool metadata to ensure upstream servers do not poison the agent context."""

    def scan_tool(
        self, tool: Union[Dict[str, Any], MCPToolDefinition]
    ) -> Tuple[bool, List[str]]:
        """
        Scans a tool definition for malicious poisoning.
        Returns:
            (is_poisoned: bool, reasons: List[str])
        """
        if isinstance(tool, MCPToolDefinition):
            name = tool.name
            desc = tool.description or ""
            schema = tool.inputSchema or {}
        else:
            name = tool.get("name", "")
            desc = str(tool.get("description") or "")
            schema = tool.get("inputSchema") or tool.get("input_schema") or {}

        reasons: List[str] = []

        # 1. Scan description for invisible unicode injection
        if INVISIBLE_CHARS_REGEX.search(desc):
            reasons.append(
                f"Tool '{name}': Detected invisible/zero-width unicode characters in description (steganographic injection)."
            )

        # 2. Scan description for override patterns
        for code, pattern in POISON_PATTERNS:
            match = pattern.search(desc)
            if match:
                snippet = match.group(0)[:60]
                reasons.append(
                    f"Tool '{name}': Poisoning pattern [{code}] detected in description: '{snippet}'"
                )

        # 3. Recursively scan inputSchema for injected defaults or descriptions
        schema_reasons = self._scan_schema(name, schema)
        reasons.extend(schema_reasons)

        return (len(reasons) > 0, reasons)

    def _scan_schema(self, tool_name: str, schema: Dict[str, Any]) -> List[str]:
        reasons: List[str] = []
        if not isinstance(schema, dict):
            return reasons

        properties = schema.get("properties", {})
        if isinstance(properties, dict):
            for prop_name, prop_data in properties.items():
                if not isinstance(prop_data, dict):
                    continue

                # Check property description
                prop_desc = str(prop_data.get("description") or "")
                for code, pattern in POISON_PATTERNS:
                    match = pattern.search(prop_desc)
                    if match:
                        reasons.append(
                            f"Tool '{tool_name}' argument '{prop_name}': Injected instruction [{code}] in property description."
                        )

                # Check default value for exfiltration URLs or shell commands
                default_val = str(prop_data.get("default") or "")
                if default_val:
                    for code, pattern in POISON_PATTERNS:
                        if pattern.search(default_val):
                            reasons.append(
                                f"Tool '{tool_name}' argument '{prop_name}': Malicious default value matches [{code}]."
                            )

        return reasons
