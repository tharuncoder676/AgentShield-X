"""
Control API routes for AgentShield-X Public Threat Intelligence Feed
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query

from shield_core.threat_intel import (
    default_threat_intel,
    AgentAdvisory,
    MCPToolRiskRating,
)

router = APIRouter(prefix="/v1/threats", tags=["threat-intel"])


@router.get("/advisories", response_model=Dict[str, Any])
def list_advisories(severity: Optional[str] = None):
    """Retrieve verified Agent Security Advisories (ASA) aligned with MITRE ATLAS."""
    advs = default_threat_intel.get_advisories(severity=severity)
    return {
        "total": len(advs),
        "advisories": [a.to_dict() for a in advs],
    }


@router.get("/mcp-index", response_model=Dict[str, Any])
def list_mcp_risk_ratings():
    """Retrieve standardized risk scores and containment advice for Model Context Protocol tools."""
    ratings = default_threat_intel.get_mcp_risk_index()
    return {
        "total_rated_tools": len(ratings),
        "ratings": [r.to_dict() for r in ratings],
    }


@router.get("/trending", response_model=Dict[str, Any])
def list_trending_threats():
    """Live leaderboard of trending attack patterns observed across the federation."""
    trending = default_threat_intel.get_trending_leaderboard()
    return {
        "trending": [t.to_dict() for t in trending],
    }


@router.get("/stix", response_model=Dict[str, Any])
def get_stix_taxii_feed():
    """Export public threat intelligence in standard STIX 2.1 JSON bundle format for SIEM/EDR ingest."""
    return default_threat_intel.get_stix_taxii_bundle()


@router.get("/overview", response_model=Dict[str, Any])
def get_intel_overview():
    """Summary of threat advisories and attack trends."""
    return default_threat_intel.get_intel_summary()

