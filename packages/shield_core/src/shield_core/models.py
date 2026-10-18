"""
AgentShield-X Core Data Contracts
Defines versioned Pydantic schemas for events, decisions, policies, incidents,
approvals, audit records, and usage tracking across the platform.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from shield_core.compat import BaseModel, Field


class ToolSensitivity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TrustLevel(str, Enum):
    SYSTEM = "system"
    USER = "user"
    TOOL = "tool"
    UNTRUSTED = "untrusted"


class ShieldAction(str, Enum):
    ALLOW = "allow"
    SANITIZE = "sanitize"
    BLOCK = "block"
    ESCALATE = "escalate"
    KILL_SESSION = "kill_session"


Action = ShieldAction



class ToolDefinition(BaseModel):
    name: str = Field(..., description="Tool name, e.g., send_email, run_sql")
    sensitivity: ToolSensitivity = Field(
        default=ToolSensitivity.LOW,
        description="Sensitivity classification for access control and fail-closed logic",
    )
    description: Optional[str] = Field(default=None, description="Tool description or schema")


class ContextSegment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Segment UUID")
    trust: TrustLevel = Field(default=TrustLevel.UNTRUSTED, description="Trust boundary classification")
    source: str = Field(..., description="Source identifier, e.g. prompt, email_inbox, webpage, tool_result")
    text_hash: str = Field(..., description="SHA-256 hash of segment text")
    text: Optional[str] = Field(default=None, description="Actual segment text (redacted or omitted in privacy modes)")


class ToolCallEvent(BaseModel):
    """
    Core event emitted by SDK when an agent proposes or invokes a tool.
    Matches Master Build Prompt Section 6.
    """
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    schema_version: str = Field(default="1.0")
    tenant_id: Optional[str] = Field(default=None, description="Tenant organization ID (inferred from API key if omitted)")
    agent_id: str = Field(..., description="Agent identifier")
    session_id: str = Field(..., description="Trace/session identifier")
    step: int = Field(default=0, description="Step counter in multi-turn execution")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    task_contract_id: Optional[str] = Field(default=None, description="Linked TaskContract ID if bound")
    tool: ToolDefinition
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Arguments passed to tool")
    context_segments: List[ContextSegment] = Field(
        default_factory=list,
        description="Context segments available to LLM at invocation time",
    )
    taint: List[str] = Field(
        default_factory=list,
        description="IDs of untrusted context segments influencing this call",
    )
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Reason(BaseModel):
    code: str = Field(..., description="Machine-readable rule/detector code, e.g. RULE_INJECTION_OVERRIDE")
    evidence: str = Field(..., description="Short sanitized evidence citation")
    detector: str = Field(..., description="Detector component name, e.g. rules, pii, honey, deberta")


class RiskBreakdown(BaseModel):
    injection: float = Field(default=0.0, ge=0.0, le=1.0)
    anomaly: float = Field(default=0.0, ge=0.0, le=1.0)
    intent_mismatch: float = Field(default=0.0, ge=0.0, le=1.0)
    exfil: float = Field(default=0.0, ge=0.0, le=1.0)
    taint: float = Field(default=0.0, ge=0.0, le=1.0)
    honey: float = Field(default=0.0, ge=0.0, le=1.0)


class Decision(BaseModel):
    """
    Core verdict returned to SDK and Gateway.
    Deterministic action computed from rules, policy, and risk scores.
    """
    decision_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    action: ShieldAction = Field(default=ShieldAction.ALLOW)
    risk: float = Field(default=0.0, ge=0.0, le=1.0, description="Composite risk score [0.0 - 1.0]")
    risk_breakdown: RiskBreakdown = Field(default_factory=RiskBreakdown)
    reasons: List[Reason] = Field(default_factory=list)
    sanitized_payload: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Sanitized arguments if action == SANITIZE, else None",
    )
    policy_version: str = Field(default="1.0.0")
    model_versions: Dict[str, str] = Field(default_factory=dict)
    prompt_versions: Dict[str, str] = Field(default_factory=dict)
    degraded: bool = Field(default=False, description="True if one or more detectors timed out/failed")
    latency_ms: float = Field(default=0.0, description="End-to-end evaluation latency in milliseconds")


class TaskContract(BaseModel):
    contract_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    agent_id: str
    session_id: str
    goal: str
    allowed_tools: List[str]
    allowed_data_scopes: List[str] = Field(default_factory=list)
    forbidden_effects: List[str] = Field(default_factory=list)
    max_steps: int = Field(default=10)
    needs_approval_for: List[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Policy(BaseModel):
    policy_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    version: str = Field(default="1.0.0")
    rules_rego: str = Field(default="", description="Rego policy specification")
    risk_threshold_block: float = Field(default=0.75, ge=0.0, le=1.0)
    risk_threshold_escalate: float = Field(default=0.45, ge=0.0, le=1.0)
    fail_mode_sensitive: str = Field(default="closed", description="'closed' or 'open'")
    fail_mode_standard: str = Field(default="open", description="'closed' or 'open'")
    honeytools_enabled: bool = Field(default=True)


class Incident(BaseModel):
    incident_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    agent_id: str
    session_id: str
    event_id: str
    decision_id: str
    severity: str = Field(default="high")  # low, medium, high, critical
    action_taken: ShieldAction
    reasons: List[Reason]
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Approval(BaseModel):
    approval_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    session_id: str
    event_id: str
    proposed_tool: str
    proposed_arguments: Dict[str, Any]
    status: str = Field(default="pending")  # pending, approved, rejected
    reviewer: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    resolved_at: Optional[str] = None


class AuditRecord(BaseModel):
    """
    Append-only, cryptographically hash-chained audit record.
    Master Build Prompt Section 6: AuditRecord (hash-chained: prev_hash, hash).
    """
    record_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sequence: int = Field(..., ge=0)
    tenant_id: str
    event_id: str
    decision_id: str
    action: ShieldAction
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    prev_hash: str = Field(..., description="SHA-256 hash of previous audit record")
    hash: str = Field(..., description="SHA-256 hash of current audit record contents + prev_hash")


class UsageRecord(BaseModel):
    tenant_id: str
    agent_id: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    events_count: int = Field(default=1)
    blocked_count: int = Field(default=0)
    latency_ms: float = Field(default=0.0)
