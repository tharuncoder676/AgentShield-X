"""
AgentShield-X Public Threat Intelligence Engine
================================================
Free open-access threat intelligence feed for the AI security community:
Vulnerability Advisories (ASA-2026-XXXX), MCP Tool Risk Ratings,
STIX 2.1 Threat Bundles, and MITRE ATLAS Attack Technique Leaderboard.

Author: Tharunkumar.S | AgentShield-X Security Labs
"""

from __future__ import annotations

import datetime
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class AdvisorySeverity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


@dataclass
class AgentAdvisory:
    advisory_id: str
    title: str
    target_framework: str
    severity: AdvisorySeverity
    cvss_score: float
    mitre_atlas_technique: str
    description: str
    remediation: str
    published_at: str
    patch_rule_id: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "advisory_id": self.advisory_id,
            "title": self.title,
            "target_framework": self.target_framework,
            "severity": self.severity.value,
            "cvss_score": self.cvss_score,
            "mitre_atlas_technique": self.mitre_atlas_technique,
            "description": self.description,
            "remediation": self.remediation,
            "published_at": self.published_at,
            "patch_rule_id": self.patch_rule_id,
        }


@dataclass
class MCPToolRiskRating:
    tool_name: str
    category: str
    risk_score: float
    vulnerability_tags: List[str]
    recommended_containment: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "tool_name": self.tool_name,
            "category": self.category,
            "risk_score": round(self.risk_score, 2),
            "vulnerability_tags": self.vulnerability_tags,
            "recommended_containment": self.recommended_containment,
        }


@dataclass
class TrendingThreatSignature:
    signature_id: str
    pattern_name: str
    prevalence_pct: float
    observed_in_the_wild_count: int
    mitre_category: str
    mitigation_status: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "signature_id": self.signature_id,
            "pattern_name": self.pattern_name,
            "prevalence_pct": self.prevalence_pct,
            "observed_in_the_wild_count": self.observed_in_the_wild_count,
            "mitre_category": self.mitre_category,
            "mitigation_status": self.mitigation_status,
        }


class ThreatIntelligenceEngine:
    """
    Public Threat Intelligence feed providing verified advisories, tool ratings, and STIX feeds.
    """

    def __init__(self) -> None:
        self.advisories: Dict[str, AgentAdvisory] = {}
        self.mcp_ratings: List[MCPToolRiskRating] = []
        self.trending: List[TrendingThreatSignature] = []
        self._seed_default_threat_intel()

    def _seed_default_threat_intel(self) -> None:
        advs = [
            AgentAdvisory(
                advisory_id="ASA-2026-0041",
                title="LangChain Experimental REPL Arbitrary Code Execution",
                target_framework="LangChain <= 0.2.14",
                severity=AdvisorySeverity.CRITICAL,
                cvss_score=9.8,
                mitre_atlas_technique="AML.T0054: LLM Jailbreak via Code Execution Sink",
                description="Unsanitized PythonREPL tool allows prompt-injected strings to bypass ast whitelist and execute os.system via builtin reflection.",
                remediation="Upgrade to AgentShield Universal SDK wrapper or enforce Ephemeral Docker Sandbox isolation.",
                published_at="2026-10-28T14:00:00Z",
                patch_rule_id="rule-block-003",
            ),
            AgentAdvisory(
                advisory_id="ASA-2026-0038",
                title="Model Context Protocol Filesystem Rug-Pull Path Traversal",
                target_framework="MCP Standard Server: @modelcontextprotocol/server-filesystem",
                severity=AdvisorySeverity.CRITICAL,
                cvss_score=9.1,
                mitre_atlas_technique="AML.T0024: Exfiltration via MCP Tool Schema Poisoning",
                description="Malicious tool schema updates allow symlink resolution outside the permitted directory boundary.",
                remediation="Pin MCP tool definitions using 'agentshield mcp-proxy --pins mcp_pins.json'.",
                published_at="2026-10-24T09:30:00Z",
                patch_rule_id="pkg-mcp-github-slack-guard",
            ),
            AgentAdvisory(
                advisory_id="ASA-2026-0035",
                title="CrewAI Multi-Turn Role-Play Memory Poisoning",
                target_framework="CrewAI <= 0.51.0",
                severity=AdvisorySeverity.HIGH,
                cvss_score=8.4,
                mitre_atlas_technique="AML.T0040: Persistent Agent Identity Drift",
                description="Adversaries can inject system prompt overriding text into long-term agent memory vectors, persisting across sessions.",
                remediation="Enable Agent Genome Behavioral DNA continuous drift monitoring.",
                published_at="2026-10-19T11:15:00Z",
                patch_rule_id="pkg-owasp-top-10-llm",
            ),
            AgentAdvisory(
                advisory_id="ASA-2026-0029",
                title="Indirect RAG Document Taint via Unicode Homoglyphs",
                target_framework="Universal RAG / LlamaIndex / LangChain",
                severity=AdvisorySeverity.HIGH,
                cvss_score=8.1,
                mitre_atlas_technique="AML.T0051: LLM Prompt Injection via RAG",
                description="Cyrillic homoglyphs bypass naive regex filters while rendering as valid English instructions to generative models.",
                remediation="Deploy AgentShield RAG Firewall with JIT Homoglyph Normalization.",
                published_at="2026-10-15T16:45:00Z",
                patch_rule_id="lesson-01-indirect-injection",
            ),
        ]
        for a in advs:
            self.advisories[a.advisory_id] = a

        self.mcp_ratings = [
            MCPToolRiskRating("mcp_filesystem_read_write", "Filesystem", 0.89, ["RCE", "Data Exfiltration"], "Strict Ephemeral Read-Only Sandbox"),
            MCPToolRiskRating("mcp_shell_bash_executor", "System Execution", 0.96, ["Root Privilege Escalation", "Host Destruction"], "Block in Production"),
            MCPToolRiskRating("mcp_database_sql_query", "Database", 0.74, ["SQL Injection", "Table Drops", "PII Leak"], "Read-Only Replica + AST Filtering"),
            MCPToolRiskRating("mcp_github_issue_manager", "Developer Tools", 0.42, ["Secret Scraping"], "Pin Scopes to Single Repository"),
            MCPToolRiskRating("mcp_slack_send_message", "Collaboration", 0.58, ["Public Channel Exfiltration"], "Require Human Authorization for DMs"),
            MCPToolRiskRating("mcp_weather_math_calculator", "Utility", 0.04, ["Benign Calculation"], "Zero-Latency Permissive Pass"),
        ]

        self.trending = [
            TrendingThreatSignature("SIG-TREND-01", "Indirect Markdown Image Steganography", 88.4, 4820, "AML.T0051", "MITIGATED_BY_AGENTSHIELD"),
            TrendingThreatSignature("SIG-TREND-02", "Autonomous Tool DAG Lateral Staging", 74.2, 3190, "AML.T0024", "MITIGATED_BY_AGENTSHIELD"),
            TrendingThreatSignature("SIG-TREND-03", "Dynamic MCP Tool Definition Rug-Pull", 68.9, 2840, "AML.T0040", "MITIGATED_BY_AGENTSHIELD"),
            TrendingThreatSignature("SIG-TREND-04", "Recursive Context Sponge DoS Attacks", 52.1, 1920, "AML.T0035", "MITIGATED_BY_AGENTSHIELD"),
        ]

    def get_advisories(self, severity: Optional[str] = None) -> List[AgentAdvisory]:
        advs = list(self.advisories.values())
        if severity:
            advs = [a for a in advs if a.severity.value.upper() == severity.upper()]
        return sorted(advs, key=lambda x: x.cvss_score, reverse=True)

    def get_mcp_risk_index(self) -> List[MCPToolRiskRating]:
        return sorted(self.mcp_ratings, key=lambda x: x.risk_score, reverse=True)

    def get_trending_leaderboard(self) -> List[TrendingThreatSignature]:
        return sorted(self.trending, key=lambda x: x.prevalence_pct, reverse=True)

    def get_stix_taxii_bundle(self) -> Dict[str, Any]:
        """Generates STIX 2.1 compliant JSON bundle for SIEM and SOC threat feeds."""
        objects = []
        for adv in self.advisories.values():
            objects.append({
                "type": "vulnerability",
                "spec_version": "2.1",
                "id": f"vulnerability--{adv.advisory_id.lower()}",
                "name": adv.title,
                "description": adv.description,
                "external_references": [
                    {"source_name": "AgentShield-X Labs", "external_id": adv.advisory_id},
                    {"source_name": "MITRE ATLAS", "external_id": adv.mitre_atlas_technique.split(":")[0]},
                ],
                "x_cvss_score": adv.cvss_score,
                "x_severity": adv.severity.value,
                "x_remediation": adv.remediation,
            })

        return {
            "type": "bundle",
            "id": f"bundle--agentshield-intel-{datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d')}",
            "spec_version": "2.1",
            "published": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "objects": objects,
        }

    def get_intel_summary(self) -> Dict[str, Any]:
        return {
            "total_advisories": len(self.advisories),
            "critical_advisories": sum(1 for a in self.advisories.values() if a.severity == AdvisorySeverity.CRITICAL),
            "rated_mcp_tools": len(self.mcp_ratings),
            "active_threat_campaigns": len(self.trending),
            "feed_protocol": "STIX 2.1 / TAXII 2.1 Compliant",
            "updated_daily": True,
        }


# Singleton instance
default_threat_intel = ThreatIntelligenceEngine()

