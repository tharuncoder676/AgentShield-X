"""AgentShield-X Core Package"""

from shield_core.models import (
    ToolSensitivity,
    TrustLevel,
    ShieldAction,
    ToolDefinition,
    ContextSegment,
    ToolCallEvent,
    Reason,
    RiskBreakdown,
    Decision,
    TaskContract,
    Policy,
    Incident,
    Approval,
    AuditRecord,
    UsageRecord,
)
from shield_core.crypto import (
    sha256_hex,
    compute_audit_hash,
    verify_audit_chain,
    generate_canary_token,
)
from shield_core.scanner import (
    RepoScanner,
    DiscoveredTool,
)
from shield_core.attestation import A2AAttestationEngine, default_attestation_engine
from shield_core.honeytokens import DynamicHoneytoolEngine, default_honeytoken_engine
from shield_core.sandbox import EphemeralSandboxGuard, default_sandbox_guard
from shield_core.rag_firewall import RAGFirewallEngine, default_rag_firewall
from shield_core.rag_engine import (
    EnterpriseRAGPipeline,
    default_rag_pipeline,
    SemanticVectorStore,
    HomoglyphAndUnicodeNormalizer,
    JITContextMasker,
    CitationAttestationEngine,
    MultiHopTaintTracker,
)
from shield_core.gitops import GitOpsPolicyEngine, default_gitops_engine
from shield_core.immunity import ContinuousImmunityEngine, default_immunity_engine

__all__ = [
    "ToolSensitivity",
    "TrustLevel",
    "ShieldAction",
    "ToolDefinition",
    "ContextSegment",
    "ToolCallEvent",
    "Reason",
    "RiskBreakdown",
    "Decision",
    "TaskContract",
    "Policy",
    "Incident",
    "Approval",
    "AuditRecord",
    "UsageRecord",
    "sha256_hex",
    "compute_audit_hash",
    "verify_audit_chain",
    "generate_canary_token",
    "RepoScanner",
    "DiscoveredTool",
    "A2AAttestationEngine",
    "default_attestation_engine",
    "DynamicHoneytoolEngine",
    "default_honeytoken_engine",
    "EphemeralSandboxGuard",
    "default_sandbox_guard",
    "RAGFirewallEngine",
    "default_rag_firewall",
    "GitOpsPolicyEngine",
    "default_gitops_engine",
    "ContinuousImmunityEngine",
    "default_immunity_engine",
]
