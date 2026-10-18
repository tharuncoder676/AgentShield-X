"""
AgentShield-X Control Plane API Request and Response Models
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field


class SignUpRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="Password (at least 8 chars)")
    org_name: str = Field(default="My Organization", description="Primary organization name")
    organization_name: Optional[str] = None
    full_name: Optional[str] = None

    def get_org_name(self) -> str:
        return self.organization_name or self.org_name or "My Organization"


class LoginRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="Password")


class UserDTO(BaseModel):
    id: str
    email: str
    role: str
    created_at: str
    full_name: Optional[str] = "Operator"
    is_active: bool = True


class OrgDTO(BaseModel):
    id: str
    name: str
    slug: str
    plan: str
    user_role: str = "owner"
    owner_id: Optional[str] = "usr_system"
    created_at: Optional[str] = None

    def model_post_init(self, __context: Any) -> None:
        if not self.owner_id:
            self.owner_id = "usr_system"
        if not self.created_at:
            import datetime
            self.created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()


class AuthResponse(BaseModel):
    token: str
    access_token: Optional[str] = None
    token_type: str = "bearer"
    user: UserDTO
    org: Optional[OrgDTO] = None
    organization_id: Optional[str] = None

    def model_post_init(self, __context: Any) -> None:
        if not self.access_token:
            self.access_token = self.token
        if self.org and not self.organization_id:
            self.organization_id = self.org.id


class CreateProjectRequest(BaseModel):
    name: str = Field(..., min_length=2, description="Project name")
    privacy_mode: str = Field(default="full", description="'full', 'hashed', or 'local'")


class ProjectDTO(BaseModel):
    id: str
    org_id: str
    name: str
    slug: str
    privacy_mode: str
    created_at: str


class CreateApiKeyRequest(BaseModel):
    name: str = Field(default="Default SDK Key", description="Friendly key identifier")


class ApiKeyResponse(BaseModel):
    id: str
    name: str
    project_id: Optional[str] = None
    raw_key: Optional[str] = None
    key: Optional[str] = None
    prefix: str
    key_prefix: Optional[str] = None
    scopes: List[str] = ["ingest", "read"]
    created_at: str
    last_used_at: Optional[str] = None

    def model_post_init(self, __context: Any) -> None:
        if self.key is None:
            self.key = self.raw_key
        if self.key_prefix is None:
            self.key_prefix = self.prefix


class OnboardingStatusResponse(BaseModel):
    project_id: str
    has_project: bool = True
    has_api_key: bool
    api_key_prefix: Optional[str] = None
    test_event_received: bool
    event_count: int
    completed: bool
    is_complete: Optional[bool] = None

    def model_post_init(self, __context: Any) -> None:
        if self.is_complete is None:
            self.is_complete = self.completed


class OverviewAnalyticsResponse(BaseModel):
    total_events: int
    blocked_events: int
    sanitized_events: int
    allowed_events: int
    mean_latency_ms: float
    p95_latency_ms: float
    threat_rate_percent: float
    risk_trend: List[Dict[str, Any]] = []
    top_attack_families: List[Dict[str, Any]] = []
    tenant_id: Optional[str] = None
    project_id: Optional[str] = None
    actions: Dict[str, int] = {}
    avg_latency_ms: Optional[float] = None
    status: str = "healthy"

    def model_post_init(self, __context: Any) -> None:
        if not self.actions:
            self.actions = {
                "block": self.blocked_events,
                "sanitize": self.sanitized_events,
                "allow": self.allowed_events,
            }
        if self.avg_latency_ms is None:
            self.avg_latency_ms = self.mean_latency_ms


class IncidentDTO(BaseModel):
    id: str
    project_id: str
    event_id: str
    session_id: str
    title: str
    severity: str = "high"
    status: str = "open"
    assigned_to: Optional[str] = None
    resolution_notes: Optional[str] = None
    policy_violated: Optional[str] = None
    risk: float = 0.0
    created_at: str
    updated_at: str


class UpdateIncidentRequest(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    resolution_notes: Optional[str] = None


class TaintGraphNodeDTO(BaseModel):
    id: str
    label: str
    type: str
    trust: Optional[str] = None
    action: Optional[str] = None
    risk: Optional[float] = None
    tainted: Optional[bool] = None
    text_preview: Optional[str] = None
    step: Optional[int] = None


class TaintGraphEdgeDTO(BaseModel):
    id: str
    source: str
    target: str
    tainted: Optional[bool] = True
    action: Optional[str] = None


class TaintGraphResponse(BaseModel):
    incident_id: str
    nodes: List[TaintGraphNodeDTO]
    edges: List[TaintGraphEdgeDTO]
    risk: float
    tool_name: Optional[str] = None
    agent_id: Optional[str] = None


# ==========================================
# Agents & Blast Radius Models
# ==========================================

class AgentToolConfig(BaseModel):
    name: str
    sensitivity: str = "medium"  # low, medium, high, critical
    requires_approval: bool = False
    rate_limit_per_min: Optional[int] = None


class AgentDTO(BaseModel):
    id: str
    project_id: str
    name: str
    description: str = ""
    status: str = "active"  # active, suspended
    allowed_tools: List[Dict[str, Any]] = []
    blast_radius_score: float = 25.0
    security_score: float = 100.0
    metadata: Dict[str, Any] = {}
    created_at: str


class CreateAgentRequest(BaseModel):
    name: str
    description: str = ""
    allowed_tools: List[Dict[str, Any]] = []
    blast_radius_score: float = 25.0
    metadata: Dict[str, Any] = {}


class UpdateAgentRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    allowed_tools: Optional[List[Dict[str, Any]]] = None
    blast_radius_score: Optional[float] = None
    status: Optional[str] = None


class KillSwitchRequest(BaseModel):
    suspended: bool = True
    reason: Optional[str] = None


# ==========================================
# Sessions & Replay Simulator Models
# ==========================================

class SessionSummaryDTO(BaseModel):
    session_id: str
    project_id: Optional[str] = None
    agent_id: Optional[str] = None
    step_count: int
    max_risk: float
    tools_used: List[str] = []
    started_at: Optional[str] = None
    last_activity_at: Optional[str] = None
    status: str = "clean"  # clean, sanitized, escalated, tainted, blocked


class SessionStepDTO(BaseModel):
    event_id: str
    step: int
    tool_name: str
    arguments: Dict[str, Any] = {}
    action: str
    risk: float
    reasons: List[Dict[str, Any]] = []
    context_segments: List[Dict[str, Any]] = []
    taint: List[str] = []
    latency_ms: float = 0.0
    timestamp: str


class SessionDetailDTO(BaseModel):
    session_id: str
    project_id: Optional[str] = None
    agent_id: Optional[str] = None
    step_count: int
    max_risk: float
    tools_used: List[str] = []
    started_at: Optional[str] = None
    last_activity_at: Optional[str] = None
    status: str
    steps: List[SessionStepDTO] = []


class SessionReplayRequest(BaseModel):
    override_policy: Optional[str] = "strict"  # strict, permissive, default
    sensitivity_overrides: Optional[Dict[str, str]] = None
    strict_mode: bool = False


class SessionStepDiffDTO(BaseModel):
    step: int
    tool_name: str
    original_action: str
    simulated_action: str
    action_changed: bool
    original_risk: float
    simulated_risk: float
    arguments: Dict[str, Any] = {}
    reasons: List[Dict[str, Any]] = []
    timestamp: str


class SessionReplayResponse(BaseModel):
    session_id: str
    policy_applied: str
    strict_mode: bool
    total_steps: int
    changed_steps: int
    original_blocked_steps: int
    simulated_blocked_steps: int
    step_diffs: List[SessionStepDiffDTO] = []


# ==========================================
# Policy Subsystem Models
# ==========================================

class PolicyDTO(BaseModel):
    id: str
    project_id: str
    name: str
    description: str = ""
    rules_rego: str
    version: str = "1.0.0"
    is_active: bool = True
    created_at: str
    updated_at: str


class CreatePolicyRequest(BaseModel):
    name: str
    description: str = ""
    rules_rego: str
    version: str = "1.0.0"
    is_active: bool = True


class UpdatePolicyRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    rules_rego: Optional[str] = None
    version: Optional[str] = None
    is_active: Optional[bool] = None


class ValidatePolicyRequest(BaseModel):
    rules_rego: str


class ValidatePolicyResponse(BaseModel):
    valid: bool
    errors: List[str] = []
    warnings: List[str] = []


class SimulatePolicyRequest(BaseModel):
    rules_rego: str
    sample_size: int = 50


class SimulatePolicyResponse(BaseModel):
    total_simulated: int
    changed_verdicts_count: int
    original_blocked: int
    simulated_blocked: int
    blocked_diff: int
    changed_events: List[Dict[str, Any]] = []
    impacted_sessions: List[str] = []


# ==========================================
# Approvals Queue Models
# ==========================================

class ApprovalDTO(BaseModel):
    id: str
    project_id: str
    event_id: str
    agent_id: str
    session_id: str
    tool_name: str
    arguments: Dict[str, Any] = {}
    risk: float = 0.0
    reasons: List[Dict[str, Any]] = []
    status: str = "pending"  # pending, approved, rejected, expired
    requested_at: str
    resolved_at: Optional[str] = None
    resolved_by: Optional[str] = None
    resolution_reason: Optional[str] = None
    expires_at: str


class ResolveApprovalRequest(BaseModel):
    status: str  # approved, rejected
    reason: Optional[str] = "Authorized by operator"


# ==========================================
# Model Registry & Thresholds Models
# ==========================================

class ModelThresholdsDTO(BaseModel):
    id: str
    project_id: str
    block_threshold: float = 0.36
    escalate_threshold: float = 0.28
    sanitize_threshold: float = 0.16
    kill_session_threshold: float = 0.95
    updated_at: str


class UpdateModelThresholdsRequest(BaseModel):
    block_threshold: Optional[float] = None
    escalate_threshold: Optional[float] = None
    sanitize_threshold: Optional[float] = None
    kill_session_threshold: Optional[float] = None


class ModelStatusDTO(BaseModel):
    id: str
    name: str
    type: str
    version: str
    status: str
    latency_p95_ms: float
    threshold: float
    device: str
    accuracy: float
    description: str


# ==========================================
# Honeytools & Decoys Models
# ==========================================

class HoneytoolDTO(BaseModel):
    id: str
    project_id: str
    name: str
    type: str = "tool"  # tool or token
    description: str = ""
    sensitivity: str = "critical"
    trigger_count: int = 0
    is_active: bool = True
    created_at: str


class CreateHoneytoolRequest(BaseModel):
    name: str
    type: str = "tool"
    description: str = ""
    sensitivity: str = "critical"


class HoneyTriggerDTO(BaseModel):
    id: str
    honeytool_id: str
    project_id: str
    agent_id: str
    session_id: str
    event_id: str
    triggered_at: str
    arguments: Dict[str, Any] = {}


# ==========================================
# Cryptographic Audit Log Models
# ==========================================

class AuditRecordDTO(BaseModel):
    sequence: int
    id: str
    project_id: str
    tenant_id: str
    event_id: str
    decision_id: str
    action: str
    timestamp: str
    prev_hash: str
    hash: str


class VerifyAuditLogResponse(BaseModel):
    valid: bool
    total_records: int
    unbroken_count: int
    broken_at_sequence: Optional[int] = None
    genesis_hash: str
    head_hash: str
    verified_at: str


# ==========================================
# Billing, Metering & Subscription Models
# ==========================================

class SubscriptionDTO(BaseModel):
    id: str
    project_id: str
    plan: str = "free"
    status: str = "active"
    current_period_start: str
    current_period_end: str
    calls_limit: int = 10000
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    created_at: str
    updated_at: str


class UpdateSubscriptionRequest(BaseModel):
    plan: str  # free, team, enterprise


class BillingUsageDTO(BaseModel):
    project_id: str
    plan: str
    calls_used: int
    calls_limit: int
    quota_used_pct: float
    actions_breakdown: Dict[str, int] = {}
    billing_period_start: str
    billing_period_end: str


class InvoiceDTO(BaseModel):
    id: str
    project_id: str
    amount_cents: int
    currency: str = "usd"
    status: str = "paid"
    period_start: str
    period_end: str
    created_at: str


