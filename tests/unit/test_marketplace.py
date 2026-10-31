"""
Unit tests for AgentShield-X Community Marketplace Engine
"""

import pytest
from shield_core.marketplace import (
    MarketplaceRegistry,
    MarketplacePackage,
    MarketplaceItemType,
    MarketplaceTier,
)


@pytest.fixture
def marketplace() -> MarketplaceRegistry:
    return MarketplaceRegistry()


def test_default_marketplace_seeds(marketplace: MarketplaceRegistry):
    pkgs = marketplace.list_packages()
    assert len(pkgs) >= 6
    assert any(p.package_id == "pkg-owasp-top-10-llm" for p in pkgs)
    assert any(p.verified_by_labs for p in pkgs)

    stats = marketplace.get_marketplace_stats()
    assert stats["total_packages_available"] >= 6
    assert stats["total_community_downloads"] > 50000


def test_filter_by_type_and_search(marketplace: MarketplaceRegistry):
    rules = marketplace.list_packages(filter_type="RULE_PACK")
    assert all(p.item_type == MarketplaceItemType.RULE_PACK for p in rules)

    searched = marketplace.list_packages(search_query="hipaa")
    assert len(searched) == 1
    assert searched[0].package_id == "pkg-healthcare-hipaa-pack"


def test_install_and_uninstall_package(marketplace: MarketplaceRegistry):
    pkg_id = "pkg-pci-dss-fintech-shield"
    pkg = marketplace.packages[pkg_id]
    assert pkg.installed is False
    initial_downloads = pkg.downloads_count

    # Install
    res = marketplace.install_package(pkg_id)
    assert res["success"] is True
    assert pkg.installed is True
    assert pkg.downloads_count == initial_downloads + 1
    assert pkg_id in marketplace.installed_package_ids

    # Uninstall
    un_res = marketplace.uninstall_package(pkg_id)
    assert un_res["success"] is True
    assert pkg.installed is False
    assert pkg_id not in marketplace.installed_package_ids


def test_publish_community_package(marketplace: MarketplaceRegistry):
    new_pkg = marketplace.publish_package(
        package_id="pkg-community-slack-dlp",
        name="Slack DLP Leakage Prevention",
        description="Community pack preventing confidential paste leaks into public channels.",
        item_type="RULE_PACK",
        author="SecOpsContributor",
        rules_count=5,
        tags=["slack", "dlp", "community"],
    )

    assert new_pkg.package_id in marketplace.packages
    assert new_pkg.installed is True

    # Search and find
    found = marketplace.list_packages(search_query="dlp")
    assert any(p.package_id == "pkg-community-slack-dlp" for p in found)

