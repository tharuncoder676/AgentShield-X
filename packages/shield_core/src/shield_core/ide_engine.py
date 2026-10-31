"""
AgentShield-X IDE Extension Engine (Feature #22)
Provides real-time AST linting, vulnerability diagnostics, and honeytool injection
for VS Code, Cursor, and JetBrains IDEs.
Architect: Tharunkumar.S | AgentShield-X Security Labs
"""

from __future__ import annotations

import re
import uuid
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class IDEDiagnostic(BaseModel):
    id: str = Field(default_factory=lambda: f"diag-{uuid.uuid4().hex[:8]}")
    line: int
    column: int
    end_line: int
    end_column: int
    severity: str  # ERROR, WARNING, INFORMATION, HINT
    rule_id: str
    message: str
    source: str = "AgentShield-X Security"
    suggested_fix: Optional[str] = None


class IDELintResult(BaseModel):
    file_path: str
    language: str
    total_issues: int
    critical_count: int
    warning_count: int
    diagnostics: List[IDEDiagnostic] = Field(default_factory=list)
    shield_protected: bool = False


class IDEEngine:
    """
    Analyzes agent code files (Python, TypeScript, JavaScript, YAML, JSON)
    for agentic security vulnerabilities, unattenuated tool calls, and unpinned MCP schemas.
    """

    DANGEROUS_PATTERNS = [
        {
            "regex": r"(os\.system|subprocess\.(Popen|run|call|check_output)|exec|eval)\s*\(",
            "rule_id": "AS-IDE-001",
            "severity": "ERROR",
            "message": "Raw arbitrary shell execution detected inside agent tool. Wrap with AgentShield Ephemeral Sandbox or use sanitized execution helper.",
            "fix": "from shield_core.connectors import agentshield\n# @agentshield.wrap_tool(sandbox=True)",
        },
        {
            "regex": r"(api_key|secret_key|password|bearer_token)\s*=\s*['\"][A-Za-z0-9_\-\.]{12,}['\"]",
            "rule_id": "AS-IDE-002",
            "severity": "ERROR",
            "message": "Hardcoded secret or API token detected in agent definition. Move to environment variable or AgentShield Vault.",
            "fix": "import os\napi_key = os.getenv('AGENT_SECRET_KEY')",
        },
        {
            "regex": r"tools\s*=\s*\[\s*['\"]bash['\"],\s*['\"]internet_search['\"]\s*\]",
            "rule_id": "AS-IDE-003",
            "severity": "WARNING",
            "message": "Unattenuated capability set: agent possesses both internet egress and local shell execution simultaneously without A2A attestation boundary.",
            "fix": "# Use Ephemeral A2A Capability Tokens: agentshield.attest(capabilities=['internet_search'])",
        },
        {
            "regex": r"while\s+True\s*:\s*.*agent\.(run|step|execute)\(",
            "rule_id": "AS-IDE-004",
            "severity": "WARNING",
            "message": "Unbounded autonomous agent execution loop detected. Risk of Denial-of-Wallet (unlimited LLM token burn) if prompt-injected.",
            "fix": "for step in range(MAX_ATTENUATED_STEPS): # Bound iteration limit",
        },
        {
            "regex": r"\"args\":\s*\[\s*\"-y\",\s*\"@modelcontextprotocol",
            "rule_id": "AS-IDE-005",
            "severity": "WARNING",
            "message": "MCP Server configuration uses unpinned latest package (`-y`). Vulnerable to dynamic tool schema rug-pull attacks.",
            "fix": "Pin MCP tool definitions with 'agentshield mcp-proxy --pin'",
        },
    ]

    @classmethod
    def lint_file_content(cls, file_path: str, content: str) -> IDELintResult:
        """
        Lints source code content and returns structured VS Code diagnostics.
        """
        diagnostics: List[IDEDiagnostic] = []
        lines = content.splitlines()

        # Determine language
        lowered_path = file_path.lower()
        if lowered_path.endswith(".py"):
            lang = "python"
        elif lowered_path.endswith((".ts", ".tsx")):
            lang = "typescript"
        elif lowered_path.endswith((".js", ".jsx")):
            lang = "javascript"
        elif lowered_path.endswith((".yaml", ".yml")):
            lang = "yaml"
        elif lowered_path.endswith(".json"):
            lang = "json"
        else:
            lang = "plaintext"

        # Check if already protected
        shield_protected = bool(re.search(r"(agentshield|shield_core|@agentshield)", content, re.IGNORECASE))

        # Check each pattern line by line
        for rule in cls.DANGEROUS_PATTERNS:
            pattern = rule["regex"]
            for idx, line_text in enumerate(lines):
                match = re.search(pattern, line_text, re.IGNORECASE)
                if match:
                    start_col = match.start() + 1
                    end_col = match.end() + 1
                    diagnostics.append(
                        IDEDiagnostic(
                            line=idx + 1,
                            column=start_col,
                            end_line=idx + 1,
                            end_column=end_col,
                            severity=rule["severity"],
                            rule_id=rule["rule_id"],
                            message=rule["message"],
                            suggested_fix=rule["fix"],
                        )
                    )

        crit_count = sum(1 for d in diagnostics if d.severity == "ERROR")
        warn_count = sum(1 for d in diagnostics if d.severity == "WARNING")

        return IDELintResult(
            file_path=file_path,
            language=lang,
            total_issues=len(diagnostics),
            critical_count=crit_count,
            warning_count=warn_count,
            diagnostics=diagnostics,
            shield_protected=shield_protected,
        )

    @classmethod
    def generate_honeytool_code(cls, tool_type: str = "sql_database") -> Dict[str, str]:
        """
        Generates copy-pasteable code stubs for injecting a dynamic canary honeytool in Python or TypeScript.
        """
        canary_id = f"AS-CANARY-{uuid.uuid4().hex[:8].upper()}"

        python_snippet = f'''
# ==============================================================================
# AgentShield-X Canary Honeytool Trap (Generated for VS Code)
# Architect: Tharunkumar.S | AgentShield-X Security Labs
# ==============================================================================
from shield_core.honeytools import DynamicHoneytoolFactory

@DynamicHoneytoolFactory.register(
    name="query_{tool_type}_admin",
    description="Internal administrative diagnostic query tool for privileged operations. Do not call without authorization.",
    canary_token="{canary_id}"
)
def query_{tool_type}_admin(query: str) -> str:
    """
    Decoy canary tool: Any agent invocation instantly trips the AgentShield
    socket sever switch in <1ms and alerts the Security Operations Center.
    """
    raise SecurityException("AgentShield Security Trap: Unauthorized execution of canary honeytool.")
'''

        ts_snippet = f'''
// ==============================================================================
// AgentShield-X Canary Honeytool Trap (Generated for VS Code)
// Architect: Tharunkumar.S | AgentShield-X Security Labs
// ==============================================================================
import {{ registerCanaryTool }} from "@agentshield/sdk";

export const query_{tool_type}_admin = registerCanaryTool({{
  name: "query_{tool_type}_admin",
  description: "Internal administrative diagnostic tool for privileged operations.",
  canaryToken: "{canary_id}",
  handler: async (args: {{ query: string }}) => {{
    throw new Error("AgentShield Security Trap: Canary honeytool tripped.");
  }}
}});
'''
        return {
            "canary_token": canary_id,
            "tool_name": f"query_{tool_type}_admin",
            "python": python_snippet.strip(),
            "typescript": ts_snippet.strip(),
        }
