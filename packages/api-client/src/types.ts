import { z } from "zod";

// ============================================================================
// Core Shield Enums & Schemas
// ============================================================================

export const ShieldActionSchema = z.enum([
  "allow",
  "sanitize",
  "block",
  "escalate",
  "kill_session",
]);
export type ShieldAction = z.infer<typeof ShieldActionSchema>;

export const ToolSensitivitySchema = z.enum(["low", "medium", "high", "critical"]);
export type ToolSensitivity = z.infer<typeof ToolSensitivitySchema>;

export const ReasonSchema = z.object({
  code: z.string(),
  evidence: z.string(),
  detector: z.string(),
});
export type Reason = z.infer<typeof ReasonSchema>;

export const RiskBreakdownSchema = z.object({
  injection: z.number().default(0.0),
  anomaly: z.number().default(0.0),
  intent_mismatch: z.number().default(0.0),
  exfil: z.number().default(0.0),
  taint: z.number().default(0.0),
  honey: z.number().default(0.0),
});
export type RiskBreakdown = z.infer<typeof RiskBreakdownSchema>;

export const ContextSegmentSchema = z.object({
  id: z.string(),
  trust: z.enum(["system", "user", "tool", "untrusted"]),
  source: z.string(),
  text_hash: z.string(),
  text: z.string().optional(),
});
export type ContextSegment = z.infer<typeof ContextSegmentSchema>;

export const ToolCallEventSchema = z.object({
  event_id: z.string(),
  schema_version: z.string().default("1.0"),
  tenant_id: z.string().optional().default(""),
  agent_id: z.string(),
  session_id: z.string(),
  step: z.number().default(0),
  timestamp: z.string(),
  task_contract_id: z.string().nullable().optional(),
  tool: z.object({
    name: z.string(),
    sensitivity: ToolSensitivitySchema.default("low"),
  }),
  arguments: z.record(z.any()).default({}),
  context_segments: z.array(ContextSegmentSchema).default([]),
  taint: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
});
export type ToolCallEvent = z.infer<typeof ToolCallEventSchema>;

export const DecisionSchema = z.object({
  decision_id: z.string(),
  event_id: z.string(),
  action: ShieldActionSchema,
  risk: z.number(),
  risk_breakdown: RiskBreakdownSchema.default({
    injection: 0.0,
    anomaly: 0.0,
    intent_mismatch: 0.0,
    exfil: 0.0,
    taint: 0.0,
    honey: 0.0,
  }),
  reasons: z.array(ReasonSchema).default([]),
  sanitized_payload: z.any().nullable().optional(),
  policy_version: z.string().default("1.0.0"),
  model_versions: z.record(z.string()).default({}),
  prompt_versions: z.record(z.string()).default({}),
  degraded: z.boolean().default(false),
  latency_ms: z.number().default(0.0),
});
export type Decision = z.infer<typeof DecisionSchema>;

// ============================================================================
// Auth & SaaS Entities
// ============================================================================

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  full_name: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  created_at: z.string().optional().nullable(),
});
export type User = z.infer<typeof UserSchema>;

export const SignupRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
  organization_name: z.string().min(2).optional(),
});
export type SignupRequest = z.infer<typeof SignupRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string().default("bearer"),
  user: UserSchema,
  organization_id: z.string().nullable().optional(),
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const OrgRoleSchema = z.enum(["owner", "admin", "analyst", "viewer"]);
export type OrgRole = z.infer<typeof OrgRoleSchema>;

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  plan: z.string().default("free"),
  user_role: z.string().optional().nullable(),
  owner_id: z.string().optional().nullable(),
  created_at: z.string().optional().nullable(),
});
export type Organization = z.infer<typeof OrganizationSchema>;

export const OrgMemberSchema = z.object({
  id: z.string(),
  org_id: z.string(),
  user_id: z.string(),
  role: OrgRoleSchema,
  email: z.string().email(),
  full_name: z.string(),
  joined_at: z.string(),
});
export type OrgMember = z.infer<typeof OrgMemberSchema>;

export const PrivacyModeSchema = z.enum(["full", "hashed", "local"]);
export type PrivacyMode = z.infer<typeof PrivacyModeSchema>;

export const ProjectSchema = z.object({
  id: z.string(),
  org_id: z.string(),
  name: z.string(),
  slug: z.string(),
  privacy_mode: PrivacyModeSchema.default("full"),
  created_at: z.string().optional().nullable(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const CreateProjectRequestSchema = z.object({
  name: z.string().min(2),
  privacy_mode: PrivacyModeSchema.default("full"),
});
export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;

export const ApiKeySchema = z.object({
  id: z.string(),
  project_id: z.string().optional().nullable(),
  name: z.string(),
  key_prefix: z.string().optional().nullable(),
  prefix: z.string().optional().nullable(),
  scopes: z.array(z.string()).default(["ingest", "read"]),
  created_at: z.string().optional().nullable(),
  last_used_at: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});
export type ApiKey = z.infer<typeof ApiKeySchema>;

export const CreateApiKeyRequestSchema = z.object({
  name: z.string().min(2),
  scopes: z.array(z.string()).default(["ingest", "read"]),
});
export type CreateApiKeyRequest = z.infer<typeof CreateApiKeyRequestSchema>;

export const ApiKeyCreatedResponseSchema = z.object({
  id: z.string(),
  project_id: z.string().optional().nullable(),
  name: z.string(),
  key: z.string().optional().nullable(), // raw secret key shown only once
  raw_key: z.string().optional().nullable(),
  key_prefix: z.string().optional().nullable(),
  prefix: z.string().optional().nullable(),
  scopes: z.array(z.string()).default(["ingest", "read"]),
  created_at: z.string().optional().nullable(),
});
export type ApiKeyCreatedResponse = z.infer<typeof ApiKeyCreatedResponseSchema>;

export const OnboardingStatusSchema = z.object({
  project_id: z.string(),
  has_project: z.boolean().default(true),
  has_api_key: z.boolean().default(false),
  api_key_prefix: z.string().nullable().optional(),
  test_event_received: z.boolean().default(false),
  event_count: z.number().default(0),
  completed: z.boolean().default(false),
  is_complete: z.boolean().default(false),
});
export type OnboardingStatus = z.infer<typeof OnboardingStatusSchema>;

export const AnalyticsOverviewSchema = z.object({
  tenant_id: z.string(),
  total_events: z.number(),
  actions: z.record(z.number()),
  avg_latency_ms: z.number(),
  risk_breakdown: RiskBreakdownSchema,
  status: z.string().default("healthy"),
});
export type AnalyticsOverview = z.infer<typeof AnalyticsOverviewSchema>;

// ============================================================================
// WebSocket Streaming Contracts
// ============================================================================

export const DecisionStreamPayloadSchema = z.object({
  type: z.literal("decision"),
  data: z.object({
    event: ToolCallEventSchema,
    decision: DecisionSchema,
  }),
  timestamp: z.string(),
});
export type DecisionStreamPayload = z.infer<typeof DecisionStreamPayloadSchema>;

export const PingStreamPayloadSchema = z.object({
  type: z.literal("ping"),
  timestamp: z.string(),
});
export type PingStreamPayload = z.infer<typeof PingStreamPayloadSchema>;

export const ErrorStreamPayloadSchema = z.object({
  type: z.literal("error"),
  error: z.string(),
  timestamp: z.string().optional(),
});
export type ErrorStreamPayload = z.infer<typeof ErrorStreamPayloadSchema>;

export const WebSocketMessageSchema = z.discriminatedUnion("type", [
  DecisionStreamPayloadSchema,
  PingStreamPayloadSchema,
  ErrorStreamPayloadSchema,
]);
export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;

// ============================================================================
// Incidents & Taint Path Contracts
// ============================================================================

export const IncidentSeveritySchema = z.enum(["low", "medium", "high", "critical"]);
export type IncidentSeverity = z.infer<typeof IncidentSeveritySchema>;

export const IncidentStatusSchema = z.enum(["open", "investigating", "resolved"]);
export type IncidentStatus = z.infer<typeof IncidentStatusSchema>;

export const IncidentSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  event_id: z.string(),
  session_id: z.string(),
  title: z.string(),
  severity: IncidentSeveritySchema.default("high"),
  status: IncidentStatusSchema.default("open"),
  assigned_to: z.string().nullable().optional(),
  resolution_notes: z.string().nullable().optional(),
  policy_violated: z.string().nullable().optional(),
  risk: z.number().default(0.0),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Incident = z.infer<typeof IncidentSchema>;

export const UpdateIncidentRequestSchema = z.object({
  status: IncidentStatusSchema.optional(),
  assigned_to: z.string().nullable().optional(),
  resolution_notes: z.string().nullable().optional(),
});
export type UpdateIncidentRequest = z.infer<typeof UpdateIncidentRequestSchema>;

export const TaintGraphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["source", "agent", "sink", "unknown"]).default("unknown"),
  trust: z.string().optional(),
  action: z.string().optional(),
  risk: z.number().optional(),
  tainted: z.boolean().optional(),
  text_preview: z.string().optional(),
  step: z.number().optional(),
});
export type TaintGraphNode = z.infer<typeof TaintGraphNodeSchema>;

export const TaintGraphEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  tainted: z.boolean().default(true),
  action: z.string().optional(),
});
export type TaintGraphEdge = z.infer<typeof TaintGraphEdgeSchema>;

export const TaintGraphResponseSchema = z.object({
  incident_id: z.string(),
  nodes: z.array(TaintGraphNodeSchema),
  edges: z.array(TaintGraphEdgeSchema),
  risk: z.number(),
  tool_name: z.string().nullable().optional(),
  agent_id: z.string().nullable().optional(),
});
export type TaintGraphResponse = z.infer<typeof TaintGraphResponseSchema>;

// ============================================================================
// Agent Registry & Blast-Radius Contracts
// ============================================================================

export const AgentToolConfigSchema = z.object({
  name: z.string(),
  sensitivity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  requires_approval: z.boolean().default(false),
  rate_limit_per_min: z.number().nullable().optional(),
});
export type AgentToolConfig = z.infer<typeof AgentToolConfigSchema>;

export const AgentSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  name: z.string(),
  description: z.string().default(""),
  status: z.enum(["active", "suspended"]).default("active"),
  allowed_tools: z.array(z.any()).default([]),
  blast_radius_score: z.number().default(25.0),
  security_score: z.number().default(100.0),
  metadata: z.record(z.any()).default({}),
  created_at: z.string(),
});
export type Agent = z.infer<typeof AgentSchema>;

export const CreateAgentRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  allowed_tools: z.array(z.any()).default([]),
  blast_radius_score: z.number().default(25.0),
  metadata: z.record(z.any()).default({}),
});
export type CreateAgentRequest = z.infer<typeof CreateAgentRequestSchema>;

export const UpdateAgentRequestSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  allowed_tools: z.array(z.any()).optional(),
  blast_radius_score: z.number().optional(),
  status: z.enum(["active", "suspended"]).optional(),
});
export type UpdateAgentRequest = z.infer<typeof UpdateAgentRequestSchema>;

export const KillSwitchRequestSchema = z.object({
  suspended: z.boolean(),
  reason: z.string().nullable().optional(),
});
export type KillSwitchRequest = z.infer<typeof KillSwitchRequestSchema>;

// ============================================================================
// Sessions & Replay Simulator Contracts
// ============================================================================

export const SessionStatusSchema = z.enum(["clean", "sanitized", "escalated", "tainted", "blocked"]);
export type SessionStatus = z.infer<typeof SessionStatusSchema>;

export const SessionSummarySchema = z.object({
  session_id: z.string(),
  project_id: z.string().nullable().optional(),
  agent_id: z.string().nullable().optional(),
  step_count: z.number().default(0),
  max_risk: z.number().default(0.0),
  tools_used: z.array(z.string()).default([]),
  started_at: z.string().nullable().optional(),
  last_activity_at: z.string().nullable().optional(),
  status: SessionStatusSchema.default("clean"),
});
export type SessionSummary = z.infer<typeof SessionSummarySchema>;

export const SessionStepSchema = z.object({
  event_id: z.string(),
  step: z.number(),
  tool_name: z.string(),
  arguments: z.record(z.any()).default({}),
  action: z.string(),
  risk: z.number(),
  reasons: z.array(z.any()).default([]),
  context_segments: z.array(z.any()).default([]),
  taint: z.array(z.string()).default([]),
  latency_ms: z.number().default(0.0),
  timestamp: z.string(),
});
export type SessionStep = z.infer<typeof SessionStepSchema>;

export const SessionDetailSchema = z.object({
  session_id: z.string(),
  project_id: z.string().nullable().optional(),
  agent_id: z.string().nullable().optional(),
  step_count: z.number(),
  max_risk: z.number(),
  tools_used: z.array(z.string()).default([]),
  started_at: z.string().nullable().optional(),
  last_activity_at: z.string().nullable().optional(),
  status: z.string(),
  steps: z.array(SessionStepSchema).default([]),
});
export type SessionDetail = z.infer<typeof SessionDetailSchema>;

export const SessionReplayRequestSchema = z.object({
  override_policy: z.string().default("strict"),
  sensitivity_overrides: z.record(z.string()).nullable().optional(),
  strict_mode: z.boolean().default(false),
});
export type SessionReplayRequest = z.infer<typeof SessionReplayRequestSchema>;

export const SessionStepDiffSchema = z.object({
  step: z.number(),
  tool_name: z.string(),
  original_action: z.string(),
  simulated_action: z.string(),
  action_changed: z.boolean(),
  original_risk: z.number(),
  simulated_risk: z.number(),
  arguments: z.record(z.any()).default({}),
  reasons: z.array(z.any()).default([]),
  timestamp: z.string(),
});
export type SessionStepDiff = z.infer<typeof SessionStepDiffSchema>;

export const SessionReplayResponseSchema = z.object({
  session_id: z.string(),
  policy_applied: z.string(),
  strict_mode: z.boolean(),
  total_steps: z.number(),
  changed_steps: z.number(),
  original_blocked_steps: z.number(),
  simulated_blocked_steps: z.number(),
  step_diffs: z.array(SessionStepDiffSchema).default([]),
});
export type SessionReplayResponse = z.infer<typeof SessionReplayResponseSchema>;

// ============================================================================
// Policy Subsystem Contracts
// ============================================================================

export const PolicySchema = z.object({
  id: z.string(),
  project_id: z.string(),
  name: z.string(),
  description: z.string().default(""),
  rules_rego: z.string(),
  version: z.string().default("1.0.0"),
  is_active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Policy = z.infer<typeof PolicySchema>;

export const CreatePolicyRequestSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().default(""),
  rules_rego: z.string(),
  version: z.string().optional().default("1.0.0"),
  is_active: z.boolean().optional().default(true),
});
export type CreatePolicyRequest = z.infer<typeof CreatePolicyRequestSchema>;

export const UpdatePolicyRequestSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  rules_rego: z.string().optional(),
  version: z.string().optional(),
  is_active: z.boolean().optional(),
});
export type UpdatePolicyRequest = z.infer<typeof UpdatePolicyRequestSchema>;

export const ValidatePolicyRequestSchema = z.object({
  rules_rego: z.string(),
});
export type ValidatePolicyRequest = z.infer<typeof ValidatePolicyRequestSchema>;

export const ValidatePolicyResponseSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
});
export type ValidatePolicyResponse = z.infer<typeof ValidatePolicyResponseSchema>;

export const SimulatePolicyRequestSchema = z.object({
  rules_rego: z.string(),
  sample_size: z.number().optional().default(50),
});
export type SimulatePolicyRequest = z.infer<typeof SimulatePolicyRequestSchema>;

export const SimulatePolicyResponseSchema = z.object({
  total_simulated: z.number(),
  changed_verdicts_count: z.number(),
  original_blocked: z.number(),
  simulated_blocked: z.number(),
  blocked_diff: z.number(),
  changed_events: z.array(z.record(z.any())).default([]),
  impacted_sessions: z.array(z.string()).default([]),
});
export type SimulatePolicyResponse = z.infer<typeof SimulatePolicyResponseSchema>;

// ============================================================================
// Approvals Queue Contracts
// ============================================================================

export const ApprovalSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  event_id: z.string(),
  agent_id: z.string(),
  session_id: z.string(),
  tool_name: z.string(),
  arguments: z.record(z.any()).default({}),
  risk: z.number().default(0.0),
  reasons: z.array(z.any()).default([]),
  status: z.enum(["pending", "approved", "rejected", "expired"]).default("pending"),
  requested_at: z.string(),
  resolved_at: z.string().nullable().optional(),
  resolved_by: z.string().nullable().optional(),
  resolution_reason: z.string().nullable().optional(),
  expires_at: z.string(),
});
export type Approval = z.infer<typeof ApprovalSchema>;

export const ResolveApprovalRequestSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reason: z.string().optional().default("Authorized by operator"),
});
export type ResolveApprovalRequest = z.infer<typeof ResolveApprovalRequestSchema>;

// ============================================================================
// Model Registry & Threshold Contracts
// ============================================================================

export const ModelThresholdsSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  block_threshold: z.number(),
  escalate_threshold: z.number(),
  sanitize_threshold: z.number(),
  kill_session_threshold: z.number(),
  updated_at: z.string(),
});
export type ModelThresholds = z.infer<typeof ModelThresholdsSchema>;

export const UpdateModelThresholdsRequestSchema = z.object({
  block_threshold: z.number().optional(),
  escalate_threshold: z.number().optional(),
  sanitize_threshold: z.number().optional(),
  kill_session_threshold: z.number().optional(),
});
export type UpdateModelThresholdsRequest = z.infer<typeof UpdateModelThresholdsRequestSchema>;

export const ModelStatusSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  version: z.string(),
  status: z.string(),
  latency_p95_ms: z.number(),
  threshold: z.number(),
  device: z.string(),
  accuracy: z.number(),
  description: z.string(),
});
export type ModelStatus = z.infer<typeof ModelStatusSchema>;

// ============================================================================
// Honeytools & Decoy Traps Contracts
// ============================================================================

export const HoneytoolSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  name: z.string(),
  type: z.enum(["tool", "token"]).default("tool"),
  description: z.string().default(""),
  sensitivity: z.string().default("critical"),
  trigger_count: z.number().default(0),
  is_active: z.boolean().default(true),
  created_at: z.string(),
});
export type Honeytool = z.infer<typeof HoneytoolSchema>;

export const CreateHoneytoolRequestSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["tool", "token"]).default("tool"),
  description: z.string().optional().default(""),
  sensitivity: z.string().optional().default("critical"),
});
export type CreateHoneytoolRequest = z.infer<typeof CreateHoneytoolRequestSchema>;

export const HoneyTriggerSchema = z.object({
  id: z.string(),
  honeytool_id: z.string(),
  project_id: z.string(),
  agent_id: z.string(),
  session_id: z.string(),
  event_id: z.string(),
  triggered_at: z.string(),
  arguments: z.record(z.any()).default({}),
});
export type HoneyTrigger = z.infer<typeof HoneyTriggerSchema>;

// ============================================================================
// Cryptographic Audit Log Contracts
// ============================================================================

export const AuditRecordSchema = z.object({
  sequence: z.number(),
  id: z.string(),
  project_id: z.string(),
  tenant_id: z.string(),
  event_id: z.string(),
  decision_id: z.string(),
  action: z.string(),
  timestamp: z.string(),
  prev_hash: z.string(),
  hash: z.string(),
});
export type AuditRecord = z.infer<typeof AuditRecordSchema>;

export const VerifyAuditLogResponseSchema = z.object({
  valid: z.boolean(),
  total_records: z.number(),
  unbroken_count: z.number(),
  broken_at_sequence: z.number().nullable().optional(),
  genesis_hash: z.string(),
  head_hash: z.string(),
  verified_at: z.string(),
});
export type VerifyAuditLogResponse = z.infer<typeof VerifyAuditLogResponseSchema>;

// ============================================================================
// Metering, Subscription & Stripe Billing Contracts
// ============================================================================

export const SubscriptionSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  plan: z.enum(["free", "team", "enterprise"]).default("free"),
  status: z.string().default("active"),
  current_period_start: z.string(),
  current_period_end: z.string(),
  calls_limit: z.number().default(10000),
  stripe_customer_id: z.string().nullable().optional(),
  stripe_subscription_id: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Subscription = z.infer<typeof SubscriptionSchema>;

export const UpdateSubscriptionRequestSchema = z.object({
  plan: z.enum(["free", "team", "enterprise"]),
});
export type UpdateSubscriptionRequest = z.infer<typeof UpdateSubscriptionRequestSchema>;

export const BillingUsageSchema = z.object({
  project_id: z.string(),
  plan: z.string(),
  calls_used: z.number(),
  calls_limit: z.number(),
  quota_used_pct: z.number(),
  actions_breakdown: z.record(z.number()).default({}),
  billing_period_start: z.string(),
  billing_period_end: z.string(),
});
export type BillingUsage = z.infer<typeof BillingUsageSchema>;

export const InvoiceSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  amount_cents: z.number(),
  currency: z.string().default("usd"),
  status: z.string().default("paid"),
  period_start: z.string(),
  period_end: z.string(),
  created_at: z.string(),
});
export type Invoice = z.infer<typeof InvoiceSchema>;

// ============================================================================
// Architecture Explorer Contracts
// ============================================================================

export const ArchitectureTopologySchema = z.object({
  schema_version: z.string(),
  system_name: z.string(),
  description: z.string(),
  generated_at: z.string(),
  planes: z.array(z.any()),
  connections: z.array(z.any()),
});
export type ArchitectureTopology = z.infer<typeof ArchitectureTopologySchema>;

export const ArchitectureHealthSchema = z.object({
  status: z.string(),
  timestamp: z.number(),
  components: z.record(z.any()),
});
export type ArchitectureHealth = z.infer<typeof ArchitectureHealthSchema>;

// ============================================================================
// Shieldwing AI Security Copilot Contracts
// ============================================================================

export const ShieldwingProposalSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  description: z.string(),
  rego_code: z.string().optional(),
  status: z.string().default("pending_review"),
});
export type ShieldwingProposal = z.infer<typeof ShieldwingProposalSchema>;

export const ShieldwingChatResponseSchema = z.object({
  message: z.string(),
  evidence_citations: z.array(z.string()).default([]),
  proposals: z.array(ShieldwingProposalSchema).default([]),
  dogfood_verdict: z.string(),
  shield_protected: z.boolean().default(true),
});
export type ShieldwingChatResponse = z.infer<typeof ShieldwingChatResponseSchema>;

export const ShieldwingChatRequestSchema = z.object({
  message: z.string(),
  context: z.record(z.any()).optional(),
});
export type ShieldwingChatRequest = z.infer<typeof ShieldwingChatRequestSchema>;

export const ShieldwingConfigSchema = z.object({
  provider: z.string(),
  active_provider_name: z.string().optional().default("Deterministic Security Engine"),
  model: z.string(),
  has_api_key: z.boolean(),
  base_url: z.string(),
  available_models: z.array(z.string()),
});
export type ShieldwingConfig = z.infer<typeof ShieldwingConfigSchema>;

export const UpdateShieldwingConfigRequestSchema = z.object({
  api_key: z.string().optional(),
  model: z.string().optional(),
  provider: z.string().optional(),
});
export type UpdateShieldwingConfigRequest = z.infer<typeof UpdateShieldwingConfigRequestSchema>;

export const TestConnectionResponseSchema = z.object({
  status: z.string(),
  provider: z.string(),
  model: z.string(),
  sample_response: z.string().optional(),
});
export type TestConnectionResponse = z.infer<typeof TestConnectionResponseSchema>;



