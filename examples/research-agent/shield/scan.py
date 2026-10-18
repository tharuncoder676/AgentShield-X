"""`scan`: static check for dangerous tool combinations (no model, no API key, takes milliseconds)."""
from __future__ import annotations

import json

from agent import tools  # noqa: F401  (importing registers the tools)
from shield import shield

SEVERITY = {"high": 3, "medium": 2, "info": 1}


def scan(mode: str | None = None) -> dict:
    mode = mode or shield.mode
    reg = shield.registry
    untrusted = [t for t in reg.values() if t.source == "untrusted"]
    private = [t for t in reg.values() if t.reads == "private" and not t.honeytool]
    sinks = [t for t in reg.values() if t.sink == "external" and not t.honeytool]
    mitigated = mode == "enforce" and shield.policy.get("taint_blocks_sinks", True)
    findings = []

    if untrusted and private and sinks:
        findings.append({
            "id": "AS-001", "severity": "high",
            "title": "Private data, untrusted input and an outbound channel in one agent",
            "detail": (f"A hijacked page read through {', '.join(t.name for t in untrusted)} could make the agent "
                       f"read {', '.join(t.name for t in private)} and send it out with {', '.join(t.name for t in sinks)}."),
            "fix": "Keep shield mode on 'enforce' (task contracts + taint rule), require approval on the sink, "
                   "or split this into two agents so no single agent holds all three.",
            "status": "mitigated by task contracts and taint rule" if mitigated else "open",
        })
    allow_rules = [r for r in shield.policy["tasks"] if any(t.name in r["allow_tools"] for t in sinks)]
    if any(not r.get("allowed_recipients") for r in allow_rules):
        findings.append({
            "id": "AS-002", "severity": "medium",
            "title": "A task contract allows an outbound tool without a recipient allowlist",
            "detail": "Any destination is accepted for that task.",
            "fix": "Add allowed_recipients to the contract in policy.json.", "status": "open"})
    if not any(t.honeytool for t in reg.values()):
        findings.append({
            "id": "AS-003", "severity": "info", "title": "No decoy tool registered",
            "detail": "A honeytool gives a near-zero false-positive alarm when an agent is hijacked.",
            "fix": "Register a decoy tool with honeytool=True.", "status": "open"})

    blast = {
        "entry_points": [t.name for t in untrusted],
        "private_data_reachable": [t.name for t in private],
        "outbound_channels_reachable": [t.name for t in sinks],
    }
    return {"mode": mode, "tools": len(reg), "findings": findings, "blast_radius": blast}


def render(report: dict) -> str:
    lines = [f"AgentShield-lite scan (shield mode: {report['mode']}, {report['tools']} tools)", ""]
    for f in report["findings"]:
        lines += [f"[{f['severity'].upper()}] {f['id']} {f['title']}  ->  {f['status']}",
                  f"    {f['detail']}", f"    Fix: {f['fix']}", ""]
    b = report["blast_radius"]
    lines += ["Blast radius if an untrusted input is hijacked:",
              f"    entry points:  {', '.join(b['entry_points']) or 'none'}",
              f"    private data:  {', '.join(b['private_data_reachable']) or 'none'}",
              f"    can send out:  {', '.join(b['outbound_channels_reachable']) or 'none'}"]
    return "\n".join(lines)


def exit_code(report: dict, fail_on: str) -> int:
    limit = SEVERITY[fail_on]
    bad = [f for f in report["findings"] if f["status"] == "open" and SEVERITY[f["severity"]] >= limit]
    return 1 if bad else 0


def as_json(report: dict) -> str:
    return json.dumps(report, indent=2)
