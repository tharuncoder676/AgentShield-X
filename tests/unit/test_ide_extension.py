"""
Unit Tests for AgentShield-X IDE Extension Engine (Feature #22)
Architect: Tharunkumar.S | AgentShield-X Security Labs
"""

import pytest
from shield_core.ide_engine import IDEEngine


def test_lint_vulnerable_python_agent():
    vulnerable_code = """
import os

def my_agent_tool(cmd):
    # DANGEROUS: Arbitrary shell execution
    return os.system(cmd)

api_key = "sk-live-supersecretapikey123456789"
"""
    result = IDEEngine.lint_file_content("agent.py", vulnerable_code)
    assert result.language == "python"
    assert result.total_issues >= 2
    assert result.critical_count >= 2
    rule_ids = [d.rule_id for d in result.diagnostics]
    assert "AS-IDE-001" in rule_ids
    assert "AS-IDE-002" in rule_ids
    assert not result.shield_protected


def test_lint_protected_clean_agent():
    clean_code = """
from shield_core.connectors import agentshield

@agentshield.wrap
def search_knowledge_base(query: str):
    return "Sanitized search results"
"""
    result = IDEEngine.lint_file_content("clean_agent.py", clean_code)
    assert result.language == "python"
    assert result.total_issues == 0
    assert result.shield_protected is True


def test_lint_mcp_config_unpinned():
    mcp_config = """{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"]
    }
  }
}"""
    result = IDEEngine.lint_file_content("mcp.json", mcp_config)
    assert result.language == "json"
    assert result.total_issues == 1
    assert result.diagnostics[0].rule_id == "AS-IDE-005"


def test_generate_honeytool_stubs():
    stubs = IDEEngine.generate_honeytool_code(tool_type="sql_database")
    assert "AS-CANARY-" in stubs["canary_token"]
    assert "query_sql_database_admin" in stubs["tool_name"]
    assert "DynamicHoneytoolFactory" in stubs["python"]
    assert "registerCanaryTool" in stubs["typescript"]

