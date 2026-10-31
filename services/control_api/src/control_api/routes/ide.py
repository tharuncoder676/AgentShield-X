"""
AgentShield-X IDE Extension API Routes (Feature #22)
Handles real-time diagnostics, honeytool generation, and status checks for VS Code & Cursor.
Architect: Tharunkumar.S | AgentShield-X Security Labs
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from shield_core.ide_engine import IDEEngine, IDELintResult

router = APIRouter(prefix="/v1/ide", tags=["ide"])


class IDELintRequest(BaseModel):
    file_path: str
    content: str


class IDEHoneytoolRequest(BaseModel):
    tool_type: Optional[str] = "sql_database"


@router.get("/status")
def get_ide_status():
    """
    Returns the real-time health and connection status for IDE extensions.
    """
    return {
        "status": "connected",
        "service": "AgentShield-X IDE Language Server",
        "version": "1.0.0",
        "active_rules": len(IDEEngine.DANGEROUS_PATTERNS),
        "supported_languages": ["python", "typescript", "javascript", "json", "yaml"],
        "telemetry_mode": "local_zero_leakage",
    }


@router.post("/lint", response_model=IDELintResult)
def lint_code(req: IDELintRequest):
    """
    Performs deterministic AST security analysis on an open file buffer from VS Code.
    """
    return IDEEngine.lint_file_content(req.file_path, req.content)


@router.post("/honeytool")
def generate_honeytool_stub(req: IDEHoneytoolRequest):
    """
    Generates an active canary honeytool stub ready for 1-click insertion into the editor.
    """
    return IDEEngine.generate_honeytool_code(tool_type=req.tool_type or "sql_database")

