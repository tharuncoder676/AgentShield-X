"""
AgentShield-X AST Repository Security Scanner Router
Exposes static AST analysis endpoints for analyzing agent repositories,
discovering tool definitions, calculating blast radius, and synchronizing scan telemetry with the Web UI.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from shield_core.scanner import RepoScanner
from control_api.db import Database
from control_api.models import UserDTO
from control_api.routes.auth import get_current_user

router = APIRouter(prefix="/v1/scanner", tags=["scanner"])


class ScanRepoRequest(BaseModel):
    repo_path: Optional[str] = Field(default="examples/research-agent", description="Path to repository")
    mode: str = Field(default="enforce", description="Shield mode: off, observe, or enforce")
    project_id: Optional[str] = Field(default="default")


class SyncScanRequest(BaseModel):
    project_id: str = Field(default="default")
    target_dir: str
    report: Dict[str, Any]
    mode: str = Field(default="enforce")
    source: str = Field(default="cli")


@router.post("/scan")
def scan_repository(
    req: ScanRepoRequest,
    current_user: UserDTO = Depends(get_current_user),
) -> Dict[str, Any]:
    """Scans target repository AST for dangerous tool combinations and blast radius."""
    target_path = req.repo_path or "examples/research-agent"
    repo_dir = Path(target_path).resolve()
    if not repo_dir.exists():
        repo_root = Path(__file__).resolve().parents[5]
        candidate = repo_root / target_path
        if candidate.exists():
            repo_dir = candidate
        else:
            raise HTTPException(status_code=404, detail=f"Target repository directory not found: {target_path}")

    try:
        scanner = RepoScanner(repo_dir=repo_dir)
        report = scanner.scan(mode=req.mode)
        report["target_dir"] = str(repo_dir)

        # Automatically persist scan in database for the Web UI
        db = Database.get_instance()
        proj_id = req.project_id or "default"
        saved = db.record_scan(
            project_id=proj_id,
            target_dir=str(repo_dir),
            report=report,
            mode=req.mode,
            source="web",
        )
        report["scan_id"] = saved["id"]
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scanner execution failed: {str(e)}")


@router.post("/scans")
def sync_cli_scan(
    req: SyncScanRequest,
    current_user: UserDTO = Depends(get_current_user),
) -> Dict[str, Any]:
    """Receives and stores a scan executed via the CLI, synchronizing it with the Web UI."""
    db = Database.get_instance()
    try:
        saved = db.record_scan(
            project_id=req.project_id or "default",
            target_dir=req.target_dir,
            report=req.report,
            mode=req.mode,
            source=req.source or "cli",
        )
        return {"status": "synced", "scan": saved}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to sync scan: {str(e)}")


@router.get("/scans")
def list_scans(
    project_id: str = Query(default="default"),
    limit: int = Query(default=50),
    current_user: UserDTO = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Lists historical repository security scans for the project."""
    db = Database.get_instance()
    return db.list_scans(project_id=project_id, limit=limit)


@router.get("/scans/{scan_id}")
def get_scan_detail(
    scan_id: str,
    current_user: UserDTO = Depends(get_current_user),
) -> Dict[str, Any]:
    """Retrieves full details of a specific scan."""
    db = Database.get_instance()
    scan = db.get_scan(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail=f"Scan '{scan_id}' not found")
    return scan
