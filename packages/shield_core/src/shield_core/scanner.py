"""AgentShield-X Universal Static Repo Scanner

Statically inspects any AI agent codebase using Python AST analysis and pattern heuristics:
- Discovers agent tools defined via @shield.tool, @tool (LangChain/CrewAI), custom decorators, or naming conventions
- Identifies untrusted entry points, private data sources, outbound sinks, and decoy honeytools
- Calculates blast radius if an untrusted input is compromised by prompt injection
- Verifies whether an AgentShield-X policy or task contract mitigates the threat
- Formats reports for human review or CI/CD pipelines (--json, --fail-on)
"""
from __future__ import annotations

import ast
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

SEVERITY_LEVELS = {"info": 1, "medium": 2, "high": 3, "critical": 4}

UNTRUSTED_KEYWORDS = {
    "web", "page", "scrape", "fetch", "html", "url", "download",
    "search", "browse", "untrusted", "public", "rss", "feed",
}

PRIVATE_KEYWORDS = {
    "notes", "customer", "user", "secret", "token", "key", "cred",
    "password", "internal", "db", "database", "private", "confidential",
    "salary", "financial", "pricing", "inbox",
}

SINK_KEYWORDS = {
    "email", "send", "mail", "post", "upload", "webhook", "publish",
    "export", "push", "outbox", "external", "shell", "exec", "bash",
    "cmd", "terminal", "write_external",
}

DECOY_KEYWORDS = {
    "decoy", "honey", "honeytool", "canary", "trap", "export_all",
}


from shield_core.semantic_scanner import SemanticDiscoveredTool, inspect_function_ast, ASTBehavioralProfile


class DiscoveredTool(SemanticDiscoveredTool):
    """Universal discovered tool with multi-factor behavioral & semantic classification."""

    def __init__(
        self,
        name: str,
        file_path: Path,
        line: int,
        source: Optional[str] = None,
        reads: Optional[str] = None,
        sink: Optional[str] = None,
        honeytool: bool = False,
        ast_profile: Optional[ASTBehavioralProfile] = None,
    ):
        super().__init__(
            name=name,
            file_path=file_path,
            line=line,
            source=source,
            reads=reads,
            sink=sink,
            honeytool=honeytool,
            ast_profile=ast_profile,
        )


class RepoScanner:
    """Universal static security analyzer for AI agent repositories."""

    def __init__(self, repo_dir: Path | str):
        self.repo_dir = Path(repo_dir).resolve()
        if not self.repo_dir.exists() or not self.repo_dir.is_dir():
            raise ValueError(f"Target repository directory does not exist: {self.repo_dir}")

    def _parse_python_tools(self) -> List[DiscoveredTool]:
        """Scan all .py files using AST analysis for declared and inferred tools."""
        tools_found: List[DiscoveredTool] = []

        for py_path in self.repo_dir.rglob("*.py"):
            # Skip hidden dirs, virtualenvs, caches
            parts = py_path.parts
            if any(p.startswith(".") or p in ("venv", ".venv", "node_modules", "__pycache__") for p in parts):
                continue

            try:
                content = py_path.read_text(encoding="utf-8", errors="ignore")
                tree = ast.parse(content, filename=str(py_path))
            except Exception:
                continue

            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    is_tool_fn = False
                    tool_name = node.name
                    source_val = None
                    reads_val = None
                    sink_val = None
                    is_honey = False

                    # Check decorators
                    for deco in node.decorator_list:
                        deco_name = ""
                        deco_kwargs = {}

                        if isinstance(deco, ast.Call):
                            if isinstance(deco.func, ast.Name):
                                deco_name = deco.func.id
                            elif isinstance(deco.func, ast.Attribute):
                                deco_name = f"{getattr(deco.func.value, 'id', '')}.{deco.func.attr}"

                            for kw in deco.keywords:
                                if isinstance(kw.value, ast.Constant):
                                    deco_kwargs[kw.arg] = kw.value.value

                        elif isinstance(deco, ast.Name):
                            deco_name = deco.id
                        elif isinstance(deco, ast.Attribute):
                            deco_name = f"{getattr(deco.value, 'id', '')}.{deco.attr}"

                        if "tool" in deco_name.lower():
                            is_tool_fn = True
                            if "name" in deco_kwargs:
                                tool_name = str(deco_kwargs["name"])
                            source_val = deco_kwargs.get("source")
                            reads_val = deco_kwargs.get("reads")
                            sink_val = deco_kwargs.get("sink")
                            is_honey = bool(deco_kwargs.get("honeytool", False))

                    # If not explicitly decorated, check if in a tools module or matches tool name prefixes
                    if not is_tool_fn:
                        low_name = node.name.lower()
                        in_tools_file = py_path.stem in ("tools", "tool") or "tools" in py_path.parts
                        if in_tools_file and not node.name.startswith("_"):
                            is_tool_fn = True
                        elif any(k in low_name for k in ("read_", "send_", "export_", "execute_", "fetch_", "query_", "tool_")):
                            is_tool_fn = True

                    if is_tool_fn:
                        ast_prof = inspect_function_ast(node)
                        tools_found.append(
                            DiscoveredTool(
                                name=tool_name,
                                file_path=py_path.relative_to(self.repo_dir),
                                line=node.lineno,
                                source=source_val,
                                reads=reads_val,
                                sink=sink_val,
                                honeytool=is_honey,
                                ast_profile=ast_prof,
                            )
                        )

        # De-duplicate by tool name
        unique_tools: Dict[str, DiscoveredTool] = {}
        for t in tools_found:
            if t.name not in unique_tools:
                unique_tools[t.name] = t
        return list(unique_tools.values())

    def _discover_policy(self) -> Tuple[Optional[Dict[str, Any]], Optional[Path]]:
        """Look for policy.json or policy.yaml in repo."""
        for p in [self.repo_dir / "policy.json", self.repo_dir / "policy.yaml", self.repo_dir / "policy.yml"]:
            if p.exists():
                try:
                    data = json.loads(p.read_text(encoding="utf-8"))
                    return data, p.relative_to(self.repo_dir)
                except Exception:
                    pass
        return None, None

    def scan(self, mode: str = "off") -> Dict[str, Any]:
        """Perform full security audit on target repository."""
        tools = self._parse_python_tools()
        policy, policy_file = self._discover_policy()

        untrusted_tools = [t for t in tools if t.is_untrusted_input()]
        private_tools = [t for t in tools if t.is_private_read()]
        sink_tools = [t for t in tools if t.is_outbound_sink()]
        decoy_tools = [t for t in tools if t.is_decoy()]

        mitigated = (
            mode == "enforce"
            and policy is not None
            and policy.get("taint_blocks_sinks", False)
        )

        findings: List[Dict[str, Any]] = []

        # Finding 1: Dangerous Triple
        if untrusted_tools and private_tools and sink_tools:
            findings.append({
                "id": "AS-001",
                "severity": "high",
                "title": "Private data, untrusted input, and an outbound channel in one agent",
                "detail": (
                    f"Untrusted input ({', '.join(t.name for t in untrusted_tools)}) can trigger "
                    f"private reads ({', '.join(t.name for t in private_tools)}) and exfiltrate via "
                    f"sinks ({', '.join(t.name for t in sink_tools)})."
                ),
                "fix": "Set shield mode to 'enforce' with task contracts, or split tools into separate isolated agents.",
                "status": "mitigated by task contracts and taint rule" if mitigated else "open",
            })

        # Finding 2: Unrestricted outbound sinks
        if sink_tools:
            unrestricted_sinks = []
            if not policy:
                unrestricted_sinks = [t.name for t in sink_tools]
            else:
                tasks = policy.get("tasks", [])
                for sink in sink_tools:
                    allowed_in = [r for r in tasks if sink.name in r.get("allow_tools", [])]
                    if not allowed_in or any(not r.get("allowed_recipients") for r in allowed_in):
                        unrestricted_sinks.append(sink.name)

            if unrestricted_sinks:
                findings.append({
                    "id": "AS-002",
                    "severity": "medium",
                    "title": "Outbound tool without a destination allowlist",
                    "detail": f"Tools ({', '.join(unrestricted_sinks)}) can transmit data without destination restrictions.",
                    "fix": "Configure 'allowed_recipients' in policy.json or restrict allowed endpoints in TaskContract.",
                    "status": "open",
                })

        # Finding 3: Missing decoy / honeytool
        if not decoy_tools:
            findings.append({
                "id": "AS-003",
                "severity": "info",
                "title": "No decoy honeytool registered",
                "detail": "Decoy tools provide a zero-false-positive intrusion detection tripwire against hijacked agents.",
                "fix": "Register a decoy tool using @shield.tool(name='...', honeytool=True).",
                "status": "open",
            })

        # Finding 4: Shell execution / command injection risk
        shell_tools = [t.name for t in tools if any(k in t.name.lower() for k in ("shell", "bash", "cmd", "exec", "terminal"))]
        if shell_tools:
            findings.append({
                "id": "AS-004",
                "severity": "high",
                "title": "Arbitrary shell or command execution tool present",
                "detail": f"Tools ({', '.join(shell_tools)}) allow arbitrary code or command execution.",
                "fix": "Enforce strict allowlists on shell commands or isolate execution in sandboxed microVMs.",
                "status": "open",
            })

        blast_radius = {
            "entry_points": [t.name for t in untrusted_tools],
            "private_data_reachable": [t.name for t in private_tools],
            "outbound_channels_reachable": [t.name for t in sink_tools],
            "decoy_tools": [t.name for t in decoy_tools],
        }

        return {
            "repo_path": str(self.repo_dir),
            "shield_mode": mode,
            "policy_file": str(policy_file) if policy_file else None,
            "tools_count": len(tools),
            "tools": [t.to_dict() for t in tools],
            "findings": findings,
            "blast_radius": blast_radius,
        }

    @staticmethod
    def render_text(report: Dict[str, Any]) -> str:
        """Render report as human-readable terminal output."""
        lines = [
            "=" * 70,
            f"AgentShield-X Repo Scanner Report",
            f"Target: {report['repo_path']}",
            f"Shield Mode: {report['shield_mode']} | Discovered Tools: {report['tools_count']}",
            "=" * 70,
            "",
        ]

        if not report["findings"]:
            lines.append("No security findings discovered. Repository appears safe.")
        else:
            for f in report["findings"]:
                lines.append(f"[{f['severity'].upper()}] {f['id']} - {f['title']}")
                lines.append(f"  Status: {f['status']}")
                lines.append(f"  Detail: {f['detail']}")
                lines.append(f"  Fix:    {f['fix']}")
                lines.append("")

        b = report["blast_radius"]
        lines.append("-" * 70)
        lines.append("Blast Radius Analysis:")
        lines.append(f"  Untrusted Entry Points:  {', '.join(b['entry_points']) or 'None'}")
        lines.append(f"  Private Data Reachable:  {', '.join(b['private_data_reachable']) or 'None'}")
        lines.append(f"  Outbound Channels:       {', '.join(b['outbound_channels_reachable']) or 'None'}")
        lines.append(f"  Decoy Tripwires:         {', '.join(b['decoy_tools']) or 'None'}")
        lines.append("=" * 70)
        return "\n".join(lines)

    @staticmethod
    def calculate_exit_code(report: Dict[str, Any], fail_on: Optional[str] = None) -> int:
        """Determine CLI exit code based on finding severity threshold."""
        if not fail_on:
            return 0
        threshold = SEVERITY_LEVELS.get(fail_on.lower(), 3)
        for f in report["findings"]:
            if f["status"] == "open":
                sev = SEVERITY_LEVELS.get(f["severity"].lower(), 1)
                if sev >= threshold:
                    return 1
        return 0


__all__ = ["RepoScanner", "DiscoveredTool"]
