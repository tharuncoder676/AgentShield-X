"""
Phase 6 Test Suite: Universal Repo Scanner Verification
Tests:
- AST analysis on examples/research-agent detecting dangerous combinations
- Verification of policy mitigations under enforce mode
- Clean repository scanning with zero false alarms
- CLI functionality (scripts/scan_repo.py) and exit code enforcement
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
AGENT_ROOT = REPO_ROOT / "examples" / "research-agent"

for p in [
    str(AGENT_ROOT),
    str(REPO_ROOT),
    str(REPO_ROOT / "packages" / "shield_core" / "src"),
]:
    if p not in sys.path:
        sys.path.insert(0, p)

from shield_core.scanner import RepoScanner


class TestUniversalRepoScanner:
    """Verifies static scanning across diverse agent codebases."""

    def test_scan_research_agent_identifies_dangerous_triple(self):
        scanner = RepoScanner(AGENT_ROOT)
        rep_off = scanner.scan(mode="off")

        assert rep_off["tools_count"] >= 4
        tool_names = [t["name"] for t in rep_off["tools"]]
        assert "read_webpage" in tool_names
        assert "read_notes" in tool_names
        assert "send_email" in tool_names
        assert "export_all_customers" in tool_names

        # Finding AS-001 must be open when mode is off
        findings = {f["id"]: f for f in rep_off["findings"]}
        assert "AS-001" in findings
        assert findings["AS-001"]["severity"] == "high"
        assert findings["AS-001"]["status"] == "open"
        assert scanner.calculate_exit_code(rep_off, fail_on="high") == 1

        # Finding AS-001 must be mitigated when mode is enforce
        rep_enforce = scanner.scan(mode="enforce")
        findings_enforce = {f["id"]: f for f in rep_enforce["findings"]}
        assert "AS-001" in findings_enforce
        assert "mitigated" in findings_enforce["AS-001"]["status"]
        assert scanner.calculate_exit_code(rep_enforce, fail_on="high") == 0

    def test_scan_clean_dummy_repo_has_zero_high_findings(self, tmp_path: Path):
        """A clean repository with only benign compute tools should produce no high findings."""
        clean_tool = tmp_path / "tools.py"
        clean_tool.write_text(
            """
def calculate_metrics(values: list[float]) -> dict:
    '''Benign statistical computation tool.'''
    return {"sum": sum(values), "count": len(values)}

def format_table(data: dict) -> str:
    '''Pure formatting helper.'''
    return str(data)
"""
        )

        scanner = RepoScanner(tmp_path)
        report = scanner.scan(mode="off")

        assert report["tools_count"] >= 1
        high_findings = [f for f in report["findings"] if f["severity"] in ("high", "critical")]
        assert len(high_findings) == 0
        assert scanner.calculate_exit_code(report, fail_on="high") == 0

    def test_cli_scan_repo_script_execution(self):
        """Test invoking scripts/scan_repo.py as a subprocess CLI."""
        python_bin = sys.executable
        script_path = str(REPO_ROOT / "scripts" / "scan_repo.py")

        # 1. Run with --json
        cmd = [python_bin, script_path, "--repo", str(AGENT_ROOT), "--json", "--mode", "enforce"]
        res = subprocess.run(cmd, capture_output=True, text=True)
        assert res.returncode == 0
        data = json.loads(res.stdout)
        assert "tools" in data
        assert "findings" in data
        assert "blast_radius" in data

        # 2. Run with --fail-on high in off mode -> exit code 1
        cmd_fail = [python_bin, script_path, "--repo", str(AGENT_ROOT), "--mode", "off", "--fail-on", "high"]
        res_fail = subprocess.run(cmd_fail, capture_output=True, text=True)
        assert res_fail.returncode == 1

        # 3. Run with --fail-on high in enforce mode -> exit code 0
        cmd_pass = [python_bin, script_path, "--repo", str(AGENT_ROOT), "--mode", "enforce", "--fail-on", "high"]
        res_pass = subprocess.run(cmd_pass, capture_output=True, text=True)
        assert res_pass.returncode == 0
