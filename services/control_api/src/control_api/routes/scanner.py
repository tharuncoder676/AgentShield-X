"""
AgentShield-X AST Repository Security Scanner Router
Exposes static AST analysis endpoints for analyzing agent repositories,
discovering tool definitions, calculating blast radius, and checking policy mitigations.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from shield_core.scanner import RepoScanner
from control_api.models import UserDTO
from control_api.routes.auth import get_current_user

router = APIRouter(prefix="/v1/scanner", tags=["scanner"])


class ScanRepoRequest(BaseModel):
    repo_path: Optional[str] = Field(default="examples/research-agent", description="Path to repository")
    mode: str = Field(default="enforce", description="Shield mode: off, observe, or enforce")


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
        # Ensure target_dir is serializable string
        report["target_dir"] = str(repo_dir)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scanner execution failed: {str(e)}")
