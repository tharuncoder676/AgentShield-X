"""
AgentShield-X ML Shared Interfaces and Schemas
Matches Master Build Prompt Section 4:
- DetectorOutput
- ToolCallEvent
- BaseDetector protocol
"""

from __future__ import annotations

import json
import os
import sys
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union

# Ensure shield_core is discoverable
_BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
_SHIELD_CORE = os.path.join(_BASE, "packages", "shield_core", "src")
if os.path.exists(_SHIELD_CORE) and _SHIELD_CORE not in sys.path:
    sys.path.insert(0, _SHIELD_CORE)

from shield_core.compat import BaseModel, Field


class DetectorOutput(BaseModel):
    """
    Standard output produced by every detector in AgentShield-X.
    Section 4 Schema.
    """
    detector: str = Field(..., description="'injection' | 'similarity' | 'anomaly' | 'intent' | ...")
    score: float = Field(..., ge=0.0, le=1.0, description="Risk score 0..1, higher = riskier")
    flagged: bool = Field(..., description="True if score >= detector's tuned threshold")
    threshold: float = Field(..., ge=0.0, le=1.0, description="Tuned threshold used for flagging")
    evidence: Dict[str, Any] = Field(default_factory=dict, description="Nearest attack id, top features, etc.")
    model_version: str = Field(default="1.0.0", description="Model semver string")
    latency_ms: float = Field(default=0.0, ge=0.0, description="Inference latency in milliseconds")


class ToolCallEvent(BaseModel):
    """
    Standard tool call event intercepted by AgentShield-X data plane.
    Section 4 Schema.
    """
    session_id: str = Field(..., description="Session identifier")
    step: int = Field(default=0, ge=0, description="Step counter in multi-turn execution")
    tool: str = Field(..., description="Tool name, e.g., read_email, send_email, run_sql")
    sensitivity: str = Field(default="low", description="low | medium | high | critical")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Arguments passed to tool")
    task_text: str = Field(default="", description="The active user prompt or task contract goal")
    context_segments: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="List of {id, trust, source, text} segments in prompt context",
    )
    taint: List[str] = Field(
        default_factory=list,
        description="IDs of untrusted context segments influencing this call",
    )


from enum import Enum


class Action(str, Enum):
    ALLOW = "allow"
    SANITIZE = "sanitize"
    ESCALATE = "escalate"
    BLOCK = "block"
    KILL_SESSION = "kill_session"


class Decision(BaseModel):
    """
    Verdict returned by AgentShield inference pipeline.
    Section 8 Schema.
    """
    action: Action = Field(default=Action.ALLOW)
    risk: float = Field(default=0.0, ge=0.0, le=1.0)
    reason: str = Field(default="")
    evidence: Dict[str, Any] = Field(default_factory=dict)
    session_id: str = Field(default="")
    step: int = Field(default=0)
    latency_ms: float = Field(default=0.0)
    degraded: bool = Field(default=False)



class BaseDetector(ABC):
    """Abstract interface that every detector implements."""

    @abstractmethod
    def score(self, event_or_text: Union[ToolCallEvent, str]) -> DetectorOutput:
        """Evaluates an event or string and returns standardized DetectorOutput."""
        pass

    @abstractmethod
    def get_manifest(self) -> Dict[str, Any]:
        """Returns model manifest metadata."""
        pass


def export_schemas() -> Dict[str, Any]:
    """Generates JSON schema dictionary for core ML interfaces."""
    schemas = {}
    if hasattr(DetectorOutput, "model_json_schema"):
        schemas["DetectorOutput"] = DetectorOutput.model_json_schema()
        schemas["ToolCallEvent"] = ToolCallEvent.model_json_schema()
    else:
        # Fallback dictionary schema representation
        schemas["DetectorOutput"] = {
            "title": "DetectorOutput",
            "type": "object",
            "properties": {
                "detector": {"type": "string"},
                "score": {"type": "number"},
                "flagged": {"type": "boolean"},
                "threshold": {"type": "number"},
                "evidence": {"type": "object"},
                "model_version": {"type": "string"},
                "latency_ms": {"type": "number"},
            },
            "required": ["detector", "score", "flagged", "threshold"],
        }
        schemas["ToolCallEvent"] = {
            "title": "ToolCallEvent",
            "type": "object",
            "properties": {
                "session_id": {"type": "string"},
                "step": {"type": "integer"},
                "tool": {"type": "string"},
                "sensitivity": {"type": "string"},
                "arguments": {"type": "object"},
                "task_text": {"type": "string"},
                "context_segments": {"type": "array"},
                "taint": {"type": "array"},
            },
            "required": ["session_id", "tool"],
        }
    return schemas
