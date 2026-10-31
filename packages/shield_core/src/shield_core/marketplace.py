"""
AgentShield-X Community Marketplace Engine
==========================================
Community hub for sharing, discovering, and installing policy packs,
detector plugins, universal connectors, and adversarial war game scenarios.

Author: Tharunkumar.S | AgentShield-X Security Labs
"""

from __future__ import annotations

import datetime
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Set


class MarketplaceItemType(str, Enum):
    RULE_PACK = "RULE_PACK"
    DETECTOR_PLUGIN = "DETECTOR_PLUGIN"
    CONNECTOR = "CONNECTOR"
    SIM_LAB_SCENARIO = "SIM_LAB_SCENARIO"
    COMPLIANCE_TEMPLATE = "COMPLIANCE_TEMPLATE"


class MarketplaceTier(str, Enum):
    COMMUNITY_FREE = "COMMUNITY_FREE"
    VERIFIED_OFFICIAL = "VERIFIED_OFFICIAL"
    ENTERPRISE_PRO = "ENTERPRISE_PRO"


@dataclass
class MarketplacePackage:
    package_id: str
    name: str
    description: str
    item_type: MarketplaceItemType
    tier: MarketplaceTier
    version: str
    author: str
    stars: int
    downloads_count: int
    verified_by_labs: bool
    rules_included_count: int
    compatibility: str
    tags: List[str]
    installed: bool = False
    content_payload: Dict[str, Any] = field(default_factory=dict)
    updated_at: str = field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "package_id": self.package_id,
            "name": self.name,
            "description": self.description,
            "item_type": self.item_type.value,
            "tier": self.tier.value,
            "version": self.version,
            "author": self.author,
            "stars": self.stars,
            "downloads_count": self.downloads_count,
            "verified_by_labs": self.verified_by_labs,
            "rules_included_count": self.rules_included_count,
            "compatibility": self.compatibility,
            "tags": self.tags,
            "installed": self.installed,
            "content_payload": self.content_payload,
            "updated_at": self.updated_at,
        }


class MarketplaceRegistry:
    """
    Central hub managing package discovery, 1-click installation, and community publishing.
    """

    def __init__(self) -> None:
        self.packages: Dict[str, MarketplacePackage] = {}
        self.installed_package_ids: Set[str] = set()
        self._seed_default_marketplace()

    def _seed_default_marketplace(self) -> None:
        seeds = [
            MarketplacePackage(
                package_id="pkg-owasp-top-10-llm",
                name="OWASP GenAI Top 10 Defense Pack",
                description="Comprehensive detection bundle covering prompt injection, insecure output handling, model theft, and SSRF.",
                item_type=MarketplaceItemType.RULE_PACK,
                tier=MarketplaceTier.VERIFIED_OFFICIAL,
                version="2.3.0",
                author="AgentShield Labs (Tharunkumar.S)",
                stars=1420,
                downloads_count=34200,
                verified_by_labs=True,
                rules_included_count=18,
                compatibility="AgentShield-X >= 1.0.0",
                tags=["owasp", "genai", "prompt-injection", "ssrf"],
                installed=True,
                content_payload={"rules": ["owasp-llm-01", "owasp-llm-02", "owasp-llm-07"]},
            ),
            MarketplacePackage(
                package_id="pkg-pci-dss-fintech-shield",
                name="PCI-DSS v4.0 Fintech Compliance Pack",
                description="Enforces strict zero-trust cardholder data tokenization, CVV redaction, and audited refund authorizations.",
                item_type=MarketplaceItemType.COMPLIANCE_TEMPLATE,
                tier=MarketplaceTier.VERIFIED_OFFICIAL,
                version="1.2.0",
                author="FinSec Alliance",
                stars=890,
                downloads_count=18900,
                verified_by_labs=True,
                rules_included_count=14,
                compatibility="AgentShield-X >= 1.0.0",
                tags=["pci-dss", "fintech", "credit-card", "compliance"],
                installed=False,
                content_payload={"controls": ["PCI-3.4", "PCI-6.5", "PCI-10.2"]},
            ),
            MarketplacePackage(
                package_id="pkg-mcp-github-slack-guard",
                name="GitHub & Slack MCP Rug-Pull Guard",
                description="Locks down MCP tools for GitHub and Slack to prevent unauthorized repo deletion and channel exfiltration.",
                item_type=MarketplaceItemType.DETECTOR_PLUGIN,
                tier=MarketplaceTier.VERIFIED_OFFICIAL,
                version="1.5.1",
                author="AgentShield Labs",
                stars=740,
                downloads_count=15200,
                verified_by_labs=True,
                rules_included_count=8,
                compatibility="AgentShield-X >= 1.0.0",
                tags=["mcp", "github", "slack", "rug-pull"],
                installed=True,
                content_payload={"pinned_tools": ["github_create_issue", "slack_send_msg"]},
            ),
            MarketplacePackage(
                package_id="pkg-healthcare-hipaa-pack",
                name="HIPAA Healthcare PHI Guard",
                description="Detects and masks Protected Health Information (PHI), medical record numbers, and clinical diagnostic summaries.",
                item_type=MarketplaceItemType.RULE_PACK,
                tier=MarketplaceTier.COMMUNITY_FREE,
                version="1.1.0",
                author="HealthSec Open Source",
                stars=520,
                downloads_count=9800,
                verified_by_labs=True,
                rules_included_count=12,
                compatibility="AgentShield-X >= 1.0.0",
                tags=["hipaa", "healthcare", "phi", "privacy"],
                installed=False,
                content_payload={"phi_detectors": ["mrn_regex", "icd10_filter"]},
            ),
            MarketplacePackage(
                package_id="pkg-redteam-adversarial-20",
                name="20 Extreme Adversarial War Game Scenarios",
                description="Sim Lab expansion pack containing nation-state APT personas, multi-turn recursive jailbreaks, and indirect RAG payloads.",
                item_type=MarketplaceItemType.SIM_LAB_SCENARIO,
                tier=MarketplaceTier.ENTERPRISE_PRO,
                version="3.0.0",
                author="AgentShield Offensive Labs",
                stars=1850,
                downloads_count=42100,
                verified_by_labs=True,
                rules_included_count=20,
                compatibility="AgentShield-X >= 1.0.0",
                tags=["red-team", "sim-lab", "apt", "adversarial"],
                installed=False,
                content_payload={"personas": ["apt-phantom-broker", "recursive-sponge-jailbreaker"]},
            ),
            MarketplacePackage(
                package_id="pkg-crypto-web3-anti-drainer",
                name="Web3 Anti-Drainer & Private Key Guard",
                description="Detects wallet address substitutions, malicious ERC-20 permit authorizations, and seed phrase leakage.",
                item_type=MarketplaceItemType.RULE_PACK,
                tier=MarketplaceTier.COMMUNITY_FREE,
                version="2.0.1",
                author="ZeroKnowledgeDefenders",
                stars=610,
                downloads_count=11400,
                verified_by_labs=False,
                rules_included_count=10,
                compatibility="AgentShield-X >= 1.0.0",
                tags=["crypto", "web3", "seed-phrase", "ethereum"],
                installed=False,
                content_payload={"crypto_rules": ["eth_seed_mask", "drainer_contract_filter"]},
            ),
        ]
        for s in seeds:
            self.packages[s.package_id] = s
            if s.installed:
                self.installed_package_ids.add(s.package_id)

    def list_packages(
        self,
        filter_type: Optional[str] = None,
        search_query: Optional[str] = None,
        only_installed: bool = False,
    ) -> List[MarketplacePackage]:
        pkgs = list(self.packages.values())

        if only_installed:
            pkgs = [p for p in pkgs if p.installed]

        if filter_type and filter_type.upper() != "ALL":
            pkgs = [p for p in pkgs if p.item_type.value.upper() == filter_type.upper()]

        if search_query:
            sq = search_query.lower()
            pkgs = [
                p for p in pkgs
                if sq in p.name.lower() or sq in p.description.lower() or any(sq in t.lower() for t in p.tags)
            ]

        return sorted(pkgs, key=lambda x: x.stars, reverse=True)

    def install_package(self, package_id: str) -> Dict[str, Any]:
        """Install a package from the marketplace into the local agent shield runtime."""
        if package_id not in self.packages:
            raise KeyError(f"Marketplace package '{package_id}' not found")

        pkg = self.packages[package_id]
        pkg.installed = True
        pkg.downloads_count += 1
        self.installed_package_ids.add(package_id)

        return {
            "success": True,
            "package_id": pkg.package_id,
            "name": pkg.name,
            "version": pkg.version,
            "installed_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "rules_activated": pkg.rules_included_count,
            "status": "INSTALLED_AND_ACTIVE",
        }

    def uninstall_package(self, package_id: str) -> Dict[str, Any]:
        """Uninstall a package and deactivate its rules."""
        if package_id not in self.packages:
            raise KeyError(f"Marketplace package '{package_id}' not found")

        pkg = self.packages[package_id]
        pkg.installed = False
        self.installed_package_ids.discard(package_id)

        return {
            "success": True,
            "package_id": pkg.package_id,
            "name": pkg.name,
            "status": "UNINSTALLED",
        }

    def publish_package(
        self,
        package_id: str,
        name: str,
        description: str,
        item_type: str,
        author: str,
        rules_count: int,
        tags: List[str],
        content: Optional[Dict[str, Any]] = None,
    ) -> MarketplacePackage:
        """Publish a community package to the AgentShield marketplace."""
        pkg = MarketplacePackage(
            package_id=package_id,
            name=name,
            description=description,
            item_type=MarketplaceItemType(item_type),
            tier=MarketplaceTier.COMMUNITY_FREE,
            version="1.0.0",
            author=author,
            stars=1,
            downloads_count=1,
            verified_by_labs=False,
            rules_included_count=rules_count,
            compatibility="AgentShield-X >= 1.0.0",
            tags=tags,
            installed=True,
            content_payload=content or {},
        )
        self.packages[package_id] = pkg
        self.installed_package_ids.add(package_id)
        return pkg

    def get_marketplace_stats(self) -> Dict[str, Any]:
        total_downloads = sum(p.downloads_count for p in self.packages.values())
        return {
            "total_packages_available": len(self.packages),
            "installed_packages_count": len(self.installed_package_ids),
            "total_community_downloads": total_downloads,
            "verified_publishers_count": 8,
            "registry_version": "v1.0.0-federated",
        }


# Singleton instance
default_marketplace = MarketplaceRegistry()

