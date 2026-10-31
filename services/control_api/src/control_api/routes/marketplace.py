"""
Control API routes for AgentShield-X Community Marketplace
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from shield_core.marketplace import (
    default_marketplace,
    MarketplacePackage,
    MarketplaceItemType,
    MarketplaceTier,
)

router = APIRouter(prefix="/v1/marketplace", tags=["marketplace"])


class PublishPackageRequest(BaseModel):
    package_id: str
    name: str
    description: str
    item_type: str = "RULE_PACK"
    author: str = "Community Contributor"
    rules_count: int = 1
    tags: List[str] = Field(default_factory=list)
    content: Dict[str, Any] = Field(default_factory=dict)


@router.get("/packages", response_model=Dict[str, Any])
def list_marketplace_packages(
    type: Optional[str] = None,
    search: Optional[str] = None,
    installed: bool = Query(False, description="Filter only installed packages"),
):
    """Discover community policy packs, detectors, and connectors."""
    pkgs = default_marketplace.list_packages(
        filter_type=type,
        search_query=search,
        only_installed=installed,
    )
    return {
        "total": len(pkgs),
        "packages": [p.to_dict() for p in pkgs],
    }


@router.get("/stats", response_model=Dict[str, Any])
def get_marketplace_stats():
    """Retrieve community download counters and package distribution."""
    return default_marketplace.get_marketplace_stats()


@router.post("/install/{package_id}", response_model=Dict[str, Any])
def install_package(package_id: str):
    """1-Click installation of a policy pack or detector into active agent defenses."""
    try:
        res = default_marketplace.install_package(package_id)
        return res
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Package '{package_id}' not found")


@router.post("/uninstall/{package_id}", response_model=Dict[str, Any])
def uninstall_package(package_id: str):
    """Uninstall a package and deactivate its enforcement hooks."""
    try:
        res = default_marketplace.uninstall_package(package_id)
        return res
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Package '{package_id}' not found")


@router.post("/publish", response_model=Dict[str, Any])
def publish_package(body: PublishPackageRequest):
    """Publish a verified or community rule pack to the global marketplace."""
    pkg = default_marketplace.publish_package(
        package_id=body.package_id,
        name=body.name,
        description=body.description,
        item_type=body.item_type,
        author=body.author,
        rules_count=body.rules_count,
        tags=body.tags,
        content=body.content,
    )
    return {
        "success": True,
        "message": f"Package '{pkg.name}' published to community exchange.",
        "package": pkg.to_dict(),
    }

