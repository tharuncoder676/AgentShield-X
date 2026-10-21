import {
  AuthResponse,
  AuthResponseSchema,
  CreateApiKeyRequest,
  CreateProjectRequest,
  Decision,
  DecisionSchema,
  ApiKey,
  ApiKeyCreatedResponse,
  ApiKeyCreatedResponseSchema,
  ApiKeySchema,
  LoginRequest,
  OnboardingStatus,
  OnboardingStatusSchema,
  Organization,
  OrganizationSchema,
  Project,
  ProjectSchema,
  SignupRequest,
  ToolCallEvent,
  User,
  UserSchema,
  AnalyticsOverview,
  AnalyticsOverviewSchema,
  Incident,
  IncidentSchema,
  UpdateIncidentRequest,
  TaintGraphResponse,
  TaintGraphResponseSchema,
  Agent,
  AgentSchema,
  CreateAgentRequest,
  UpdateAgentRequest,
  KillSwitchRequest,
  SessionSummary,
  SessionSummarySchema,
  SessionDetail,
  SessionDetailSchema,
  SessionReplayRequest,
  SessionReplayResponse,
  SessionReplayResponseSchema,
  Policy,
  PolicySchema,
  CreatePolicyRequest,
  UpdatePolicyRequest,
  ValidatePolicyRequest,
  ValidatePolicyResponse,
  ValidatePolicyResponseSchema,
  SimulatePolicyRequest,
  SimulatePolicyResponse,
  SimulatePolicyResponseSchema,
  Approval,
  ApprovalSchema,
  ResolveApprovalRequest,
  ModelThresholds,
  ModelThresholdsSchema,
  UpdateModelThresholdsRequest,
  ModelStatus,
  ModelStatusSchema,
  Honeytool,
  HoneytoolSchema,
  CreateHoneytoolRequest,
  HoneyTrigger,
  HoneyTriggerSchema,
  AuditRecord,
  AuditRecordSchema,
  VerifyAuditLogResponse,
  VerifyAuditLogResponseSchema,
  Subscription,
  SubscriptionSchema,
  UpdateSubscriptionRequest,
  BillingUsage,
  BillingUsageSchema,
  Invoice,
  InvoiceSchema,
  ArchitectureTopology,
  ArchitectureTopologySchema,
  ArchitectureHealth,
  ArchitectureHealthSchema,
  ShieldwingChatResponse,
  ShieldwingChatResponseSchema,
  ShieldwingChatRequest,
  ShieldwingProposal,
  ShieldwingConfig,
  ShieldwingConfigSchema,
  UpdateShieldwingConfigRequest,
  TestConnectionResponse,
  TestConnectionResponseSchema,
  MCPServer,
  MCPServerSchema,
  CreateMCPServerRequest,
  MCPPin,
  MCPPinSchema,
  CreateMCPPinRequest,
  MCPAlert,
  MCPAlertSchema,
} from "./types";

import { z } from "zod";

export interface ClientConfig {
  baseUrl?: string;
  token?: string | null;
  apiKey?: string | null;
}

export class AgentShieldError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: any
  ) {
    super(`AgentShield API Error (${status}): ${message}`);
    this.name = "AgentShieldError";
  }
}

export class AgentShieldClient {
  private baseUrl: string;
  private token: string | null = null;
  private apiKey: string | null = null;

  constructor(config: ClientConfig = {}) {
    this.baseUrl = (config.baseUrl || "http://localhost:8000").replace(/\/+$/, "");
    this.token = config.token || null;
    this.apiKey = config.apiKey || null;
  }

  public setToken(token: string | null) {
    this.token = token;
  }

  public getToken(): string | null {
    return this.token;
  }

  public setApiKey(apiKey: string | null) {
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    schema?: z.ZodTypeAny
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    if (this.apiKey) {
      headers["X-Shield-API-Key"] = this.apiKey;
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errDetail = res.statusText;
      try {
        const errJson = await res.json();
        errDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
      } catch {
        // ignore json parse error
      }
      throw new AgentShieldError(res.status, errDetail);
    }

    const data = await res.json();
    if (schema) {
      return schema.parse(data);
    }
    return data as T;
  }

  // ==========================================
  // Auth Endpoints
  // ==========================================

  public async signup(data: SignupRequest): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>(
      "/v1/auth/signup",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      AuthResponseSchema
    );
    this.setToken(res.access_token);
    return res;
  }

  public async login(data: LoginRequest): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>(
      "/v1/auth/login",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      AuthResponseSchema
    );
    this.setToken(res.access_token);
    return res;
  }

  public async getMe(): Promise<User> {
    return this.request<User>("/v1/auth/me", { method: "GET" }, UserSchema);
  }

  // ==========================================
  // Organizations & Projects
  // ==========================================

  public async listOrgs(): Promise<Organization[]> {
    return this.request<Organization[]>(
      "/v1/orgs",
      { method: "GET" },
      z.array(OrganizationSchema)
    );
  }

  public async createOrg(name: string): Promise<Organization> {
    return this.request<Organization>(
      "/v1/orgs",
      {
        method: "POST",
        body: JSON.stringify({ name }),
      },
      OrganizationSchema
    );
  }

  public async listProjects(orgId: string): Promise<Project[]> {
    return this.request<Project[]>(
      `/v1/orgs/${encodeURIComponent(orgId)}/projects`,
      { method: "GET" },
      z.array(ProjectSchema)
    );
  }

  public async createProject(
    orgId: string,
    data: CreateProjectRequest
  ): Promise<Project> {
    return this.request<Project>(
      `/v1/orgs/${encodeURIComponent(orgId)}/projects`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      ProjectSchema
    );
  }

  // ==========================================
  // API Keys
  // ==========================================

  public async listApiKeys(projectId: string): Promise<ApiKey[]> {
    return this.request<ApiKey[]>(
      `/v1/projects/${encodeURIComponent(projectId)}/api-keys`,
      { method: "GET" },
      z.array(ApiKeySchema)
    );
  }

  public async createApiKey(
    projectId: string,
    data: CreateApiKeyRequest
  ): Promise<ApiKeyCreatedResponse> {
    return this.request<ApiKeyCreatedResponse>(
      `/v1/projects/${encodeURIComponent(projectId)}/api-keys`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      ApiKeyCreatedResponseSchema
    );
  }

  public async revokeApiKey(keyId: string): Promise<{ success: boolean; detail: string }> {
    return this.request<{ success: boolean; detail: string }>(
      `/v1/api-keys/${encodeURIComponent(keyId)}`,
      { method: "DELETE" }
    );
  }

  // ==========================================
  // Onboarding & Analytics
  // ==========================================

  public async getOnboardingStatus(projectId: string): Promise<OnboardingStatus> {
    return this.request<OnboardingStatus>(
      `/v1/projects/${encodeURIComponent(projectId)}/onboarding`,
      { method: "GET" },
      OnboardingStatusSchema
    );
  }

  public async dispatchTestEvent(projectId: string): Promise<any> {
    return this.request<any>(
      `/v1/projects/${encodeURIComponent(projectId)}/test-event`,
      { method: "POST" }
    );
  }

  public async getAnalyticsOverview(tenantId?: string): Promise<AnalyticsOverview> {
    const query = tenantId ? `?tenant_id=${encodeURIComponent(tenantId)}` : "";
    return this.request<AnalyticsOverview>(
      `/v1/analytics/overview${query}`,
      { method: "GET" },
      AnalyticsOverviewSchema
    );
  }

  // ==========================================
  // Incidents & Taint Path Extraction
  // ==========================================

  public async listIncidents(
    projectId?: string,
    status?: string,
    severity?: string
  ): Promise<Incident[]> {
    const params = new URLSearchParams();
    if (projectId) params.append("project_id", projectId);
    if (status) params.append("status", status);
    if (severity) params.append("severity", severity);
    const qs = params.toString() ? `?${params.toString()}` : "";

    return this.request<Incident[]>(
      `/v1/incidents${qs}`,
      { method: "GET" },
      z.array(IncidentSchema)
    );
  }

  public async getIncident(incidentId: string): Promise<Incident> {
    return this.request<Incident>(
      `/v1/incidents/${encodeURIComponent(incidentId)}`,
      { method: "GET" },
      IncidentSchema
    );
  }

  public async updateIncident(
    incidentId: string,
    data: UpdateIncidentRequest
  ): Promise<Incident> {
    return this.request<Incident>(
      `/v1/incidents/${encodeURIComponent(incidentId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      IncidentSchema
    );
  }

  public async getIncidentTaintGraph(
    incidentId: string
  ): Promise<TaintGraphResponse> {
    return this.request<TaintGraphResponse>(
      `/v1/incidents/${encodeURIComponent(incidentId)}/taint-graph`,
      { method: "GET" },
      TaintGraphResponseSchema
    );
  }

  // ==========================================
  // Agent Registry & Blast-Radius
  // ==========================================

  public async listAgents(projectId?: string): Promise<Agent[]> {
    const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
    return this.request<Agent[]>(
      `/v1/agents${qs}`,
      { method: "GET" },
      z.array(AgentSchema)
    );
  }

  public async getAgent(agentId: string): Promise<Agent> {
    return this.request<Agent>(
      `/v1/agents/${encodeURIComponent(agentId)}`,
      { method: "GET" },
      AgentSchema
    );
  }

  public async registerAgent(
    projectId: string,
    data: CreateAgentRequest
  ): Promise<Agent> {
    return this.request<Agent>(
      `/v1/projects/${encodeURIComponent(projectId)}/agents`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      AgentSchema
    );
  }

  public async updateAgent(
    agentId: string,
    data: UpdateAgentRequest
  ): Promise<Agent> {
    return this.request<Agent>(
      `/v1/agents/${encodeURIComponent(agentId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      AgentSchema
    );
  }

  public async toggleKillSwitch(
    agentId: string,
    data: KillSwitchRequest
  ): Promise<Agent> {
    return this.request<Agent>(
      `/v1/agents/${encodeURIComponent(agentId)}/kill-switch`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      AgentSchema
    );
  }

  // ==========================================
  // Sessions & Replay Simulator
  // ==========================================

  public async listSessions(
    projectId?: string,
    agentId?: string,
    status?: string,
    limit?: number
  ): Promise<SessionSummary[]> {
    const params = new URLSearchParams();
    if (projectId) params.append("project_id", projectId);
    if (agentId) params.append("agent_id", agentId);
    if (status) params.append("status", status);
    if (limit) params.append("limit", limit.toString());
    const qs = params.toString() ? `?${params.toString()}` : "";

    return this.request<SessionSummary[]>(
      `/v1/sessions${qs}`,
      { method: "GET" },
      z.array(SessionSummarySchema)
    );
  }

  public async getSession(sessionId: string): Promise<SessionDetail> {
    return this.request<SessionDetail>(
      `/v1/sessions/${encodeURIComponent(sessionId)}`,
      { method: "GET" },
      SessionDetailSchema
    );
  }

  public async replaySession(
    sessionId: string,
    data: SessionReplayRequest
  ): Promise<SessionReplayResponse> {
    return this.request<SessionReplayResponse>(
      `/v1/sessions/${encodeURIComponent(sessionId)}/replay`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      SessionReplayResponseSchema
    );
  }

  // ==========================================
  // Policy Subsystem & Dry-run Simulation
  // ==========================================

  public async listPolicies(projectId?: string): Promise<Policy[]> {
    const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
    return this.request<Policy[]>(
      `/v1/policies${qs}`,
      { method: "GET" },
      z.array(PolicySchema)
    );
  }

  public async createPolicy(
    projectId: string,
    data: CreatePolicyRequest
  ): Promise<Policy> {
    return this.request<Policy>(
      `/v1/projects/${encodeURIComponent(projectId)}/policies`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      PolicySchema
    );
  }

  public async getPolicy(policyId: string): Promise<Policy> {
    return this.request<Policy>(
      `/v1/policies/${encodeURIComponent(policyId)}`,
      { method: "GET" },
      PolicySchema
    );
  }

  public async updatePolicy(
    policyId: string,
    data: UpdatePolicyRequest
  ): Promise<Policy> {
    return this.request<Policy>(
      `/v1/policies/${encodeURIComponent(policyId)}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      PolicySchema
    );
  }

  public async deletePolicy(
    policyId: string
  ): Promise<{ success: boolean; detail: string }> {
    return this.request<{ success: boolean; detail: string }>(
      `/v1/policies/${encodeURIComponent(policyId)}`,
      { method: "DELETE" }
    );
  }

  public async validatePolicy(
    data: ValidatePolicyRequest
  ): Promise<ValidatePolicyResponse> {
    return this.request<ValidatePolicyResponse>(
      "/v1/policies/validate",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      ValidatePolicyResponseSchema
    );
  }

  public async simulatePolicy(
    data: SimulatePolicyRequest,
    projectId?: string
  ): Promise<SimulatePolicyResponse> {
    const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
    return this.request<SimulatePolicyResponse>(
      `/v1/policies/simulate${qs}`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      SimulatePolicyResponseSchema
    );
  }

  // ==========================================
  // Approvals Queue
  // ==========================================

  public async listApprovals(
    projectId?: string,
    status?: string,
    limit?: number
  ): Promise<Approval[]> {
    const params = new URLSearchParams();
    if (projectId) params.append("project_id", projectId);
    if (status) params.append("status", status);
    if (limit) params.append("limit", limit.toString());
    const qs = params.toString() ? `?${params.toString()}` : "";

    return this.request<Approval[]>(
      `/v1/approvals${qs}`,
      { method: "GET" },
      z.array(ApprovalSchema)
    );
  }

  public async getApproval(approvalId: string): Promise<Approval> {
    return this.request<Approval>(
      `/v1/approvals/${encodeURIComponent(approvalId)}`,
      { method: "GET" },
      ApprovalSchema
    );
  }

  public async resolveApproval(
    approvalId: string,
    data: ResolveApprovalRequest
  ): Promise<Approval> {
    return this.request<Approval>(
      `/v1/approvals/${encodeURIComponent(approvalId)}/resolve`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      ApprovalSchema
    );
  }

  // ==========================================
  // Model Registry & Threshold Calibration
  // ==========================================

  public async getModelsStatus(): Promise<ModelStatus[]> {
    return this.request<ModelStatus[]>(
      "/v1/models/status",
      { method: "GET" },
      z.array(ModelStatusSchema)
    );
  }

  public async getModelThresholds(projectId?: string): Promise<ModelThresholds> {
    const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
    return this.request<ModelThresholds>(
      `/v1/models/thresholds${qs}`,
      { method: "GET" },
      ModelThresholdsSchema
    );
  }

  public async updateModelThresholds(
    data: UpdateModelThresholdsRequest,
    projectId?: string
  ): Promise<ModelThresholds> {
    const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
    return this.request<ModelThresholds>(
      `/v1/models/thresholds${qs}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      ModelThresholdsSchema
    );
  }

  // ==========================================
  // Honeytools & Decoy Traps
  // ==========================================

  public async listHoneytools(projectId?: string): Promise<Honeytool[]> {
    const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
    return this.request<Honeytool[]>(
      `/v1/honeytools${qs}`,
      { method: "GET" },
      z.array(HoneytoolSchema)
    );
  }

  public async createHoneytool(
    projectId: string,
    data: CreateHoneytoolRequest
  ): Promise<Honeytool> {
    return this.request<Honeytool>(
      `/v1/projects/${encodeURIComponent(projectId)}/honeytools`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      HoneytoolSchema
    );
  }

  public async deleteHoneytool(
    honeytoolId: string
  ): Promise<{ success: boolean; detail: string }> {
    return this.request<{ success: boolean; detail: string }>(
      `/v1/honeytools/${encodeURIComponent(honeytoolId)}`,
      { method: "DELETE" }
    );
  }

  public async listHoneyTriggers(
    projectId?: string,
    limit?: number
  ): Promise<HoneyTrigger[]> {
    const params = new URLSearchParams();
    if (projectId) params.append("project_id", projectId);
    if (limit) params.append("limit", limit.toString());
    const qs = params.toString() ? `?${params.toString()}` : "";

    return this.request<HoneyTrigger[]>(
      `/v1/honeytools/triggers${qs}`,
      { method: "GET" },
      z.array(HoneyTriggerSchema)
    );
  }

  // ==========================================
  // Cryptographic Audit Log
  // ==========================================

  public async listAuditRecords(
    projectId?: string,
    limit?: number,
    offset?: number
  ): Promise<AuditRecord[]> {
    const params = new URLSearchParams();
    if (projectId) params.append("project_id", projectId);
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    const qs = params.toString() ? `?${params.toString()}` : "";

    return this.request<AuditRecord[]>(
      `/v1/audit${qs}`,
      { method: "GET" },
      z.array(AuditRecordSchema)
    );
  }

  public async verifyAuditLog(projectId?: string): Promise<VerifyAuditLogResponse> {
    const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
    return this.request<VerifyAuditLogResponse>(
      `/v1/audit/verify${qs}`,
      { method: "POST" },
      VerifyAuditLogResponseSchema
    );
  }

  // ==========================================
  // Usage Metering & Stripe Billing
  // ==========================================

  public async getSubscription(projectId?: string): Promise<Subscription> {
    const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
    return this.request<Subscription>(
      `/v1/billing/subscription${qs}`,
      { method: "GET" },
      SubscriptionSchema
    );
  }

  public async updateSubscription(
    projectId: string,
    data: UpdateSubscriptionRequest
  ): Promise<Subscription> {
    const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
    return this.request<Subscription>(
      `/v1/billing/subscription${qs}`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      SubscriptionSchema
    );
  }

  public async getBillingUsage(projectId?: string): Promise<BillingUsage> {
    const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
    return this.request<BillingUsage>(
      `/v1/billing/usage${qs}`,
      { method: "GET" },
      BillingUsageSchema
    );
  }

  public async listInvoices(projectId?: string): Promise<Invoice[]> {
    const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
    return this.request<Invoice[]>(
      `/v1/billing/invoices${qs}`,
      { method: "GET" },
      z.array(InvoiceSchema)
    );
  }

  // ==========================================
  // Architecture Explorer
  // ==========================================

  public async getArchitectureTopology(): Promise<ArchitectureTopology> {
    return this.request<ArchitectureTopology>(
      "/v1/architecture/topology",
      { method: "GET" },
      ArchitectureTopologySchema
    );
  }

  public async getArchitectureHealth(): Promise<ArchitectureHealth> {
    return this.request<ArchitectureHealth>(
      "/v1/architecture/health",
      { method: "GET" },
      ArchitectureHealthSchema
    );
  }

  // ==========================================
  // Shieldwing AI Security Copilot
  // ==========================================

  public async chatShieldwing(
    message: string,
    context?: Record<string, any>
  ): Promise<ShieldwingChatResponse> {
    return this.request<ShieldwingChatResponse>(
      "/v1/shieldwing/chat",
      {
        method: "POST",
        body: JSON.stringify({ message, context }),
      },
      ShieldwingChatResponseSchema
    );
  }

  public async explainDecisionWithShieldwing(
    decisionId: string
  ): Promise<ShieldwingChatResponse> {
    return this.request<ShieldwingChatResponse>(
      "/v1/shieldwing/explain",
      {
        method: "POST",
        body: JSON.stringify({ decision_id: decisionId }),
      },
      ShieldwingChatResponseSchema
    );
  }

  public async triageIncidentWithShieldwing(
    incidentId: string,
    severity?: string
  ): Promise<ShieldwingChatResponse> {
    return this.request<ShieldwingChatResponse>(
      "/v1/shieldwing/triage",
      {
        method: "POST",
        body: JSON.stringify({ incident_id: incidentId, severity }),
      },
      ShieldwingChatResponseSchema
    );
  }

  public async draftPolicyWithShieldwing(
    instruction: string,
    targetTool?: string
  ): Promise<ShieldwingChatResponse> {
    return this.request<ShieldwingChatResponse>(
      "/v1/shieldwing/draft-policy",
      {
        method: "POST",
        body: JSON.stringify({ instruction, target_tool: targetTool }),
      },
      ShieldwingChatResponseSchema
    );
  }

  public async getShieldwingConfig(): Promise<ShieldwingConfig> {
    return this.request<ShieldwingConfig>(
      "/v1/shieldwing/config",
      { method: "GET" },
      ShieldwingConfigSchema
    );
  }

  public async updateShieldwingConfig(
    data: UpdateShieldwingConfigRequest
  ): Promise<ShieldwingConfig> {
    return this.request<ShieldwingConfig>(
      "/v1/shieldwing/config",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      ShieldwingConfigSchema
    );
  }

  public async testShieldwingConnection(
    data: UpdateShieldwingConfigRequest
  ): Promise<TestConnectionResponse> {
    return this.request<TestConnectionResponse>(
      "/v1/shieldwing/test-connection",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      TestConnectionResponseSchema
    );
  }

  // ==========================================
  // MCP Security Proxy & Rug-Pull Guard
  // ==========================================

  public async listMCPServers(projectId?: string): Promise<MCPServer[]> {
    const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
    return this.request<MCPServer[]>(
      `/v1/mcp/servers${qs}`,
      { method: "GET" },
      z.array(MCPServerSchema)
    );
  }

  public async createMCPServer(
    data: CreateMCPServerRequest,
    projectId?: string
  ): Promise<MCPServer> {
    const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
    return this.request<MCPServer>(
      `/v1/mcp/servers${qs}`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      MCPServerSchema
    );
  }

  public async listMCPPins(
    projectId?: string,
    serverId?: string
  ): Promise<MCPPin[]> {
    const params = new URLSearchParams();
    if (projectId) params.append("project_id", projectId);
    if (serverId) params.append("server_id", serverId);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return this.request<MCPPin[]>(
      `/v1/mcp/pins${qs}`,
      { method: "GET" },
      z.array(MCPPinSchema)
    );
  }

  public async saveMCPPin(
    data: CreateMCPPinRequest,
    projectId?: string
  ): Promise<MCPPin> {
    const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
    return this.request<MCPPin>(
      `/v1/mcp/pins${qs}`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      MCPPinSchema
    );
  }

  public async deleteMCPPin(
    toolName: string,
    serverId: string,
    projectId?: string
  ): Promise<{ status: string; tool_name: string }> {
    const params = new URLSearchParams();
    params.append("server_id", serverId);
    if (projectId) params.append("project_id", projectId);
    return this.request<{ status: string; tool_name: string }>(
      `/v1/mcp/pins/${encodeURIComponent(toolName)}?${params.toString()}`,
      { method: "DELETE" }
    );
  }

  public async listMCPAlerts(projectId?: string): Promise<MCPAlert[]> {
    const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
    return this.request<MCPAlert[]>(
      `/v1/mcp/alerts${qs}`,
      { method: "GET" },
      z.array(MCPAlertSchema)
    );
  }

  // ==========================================
  // Gateway Tool Call Interception
  // ==========================================

  public async interceptToolCall(
    event: ToolCallEvent,
    overrideApiKey?: string
  ): Promise<Decision> {
    const headers: Record<string, string> = {};
    const key = overrideApiKey || this.apiKey;
    if (key) {
      headers["X-Shield-API-Key"] = key;
    }
    return this.request<Decision>(
      "/v1/events/tool-call",
      {
        method: "POST",
        headers,
        body: JSON.stringify(event),
      },
      DecisionSchema
    );
  }

  // ==========================================
  // Agentic Infrastructure & Synchronized Scans
  // ==========================================

  public async listScans(projectId?: string): Promise<any[]> {
    const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
    return this.request<any[]>(`/v1/scanner/scans${qs}`, { method: "GET" });
  }

  public async scanRepo(repoPath?: string, mode: string = "enforce", projectId?: string): Promise<any> {
    return this.request<any>("/v1/scanner/scan", {
      method: "POST",
      body: JSON.stringify({ repo_path: repoPath, mode, project_id: projectId }),
    });
  }

  public async getScan(scanId: string): Promise<any> {
    return this.request<any>(`/v1/scanner/scans/${encodeURIComponent(scanId)}`, { method: "GET" });
  }

  public async simulateSwarm(swarmName?: string, steps?: any[], projectId?: string): Promise<any> {
    return this.request<any>("/v1/swarm/simulate", {
      method: "POST",
      body: JSON.stringify({ swarm_name: swarmName, steps, project_id: projectId }),
    });
  }

  public async listSwarmTraces(projectId?: string): Promise<any[]> {
    const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
    return this.request<any[]>(`/v1/swarm/traces${qs}`, { method: "GET" });
  }

  public async runDebate(
    toolName: string,
    args: Record<string, any> = {},
    taintSources: string[] = [],
    contextPreview: string = "",
    projectId?: string
  ): Promise<any> {
    return this.request<any>("/v1/judge/debate", {
      method: "POST",
      body: JSON.stringify({
        tool_name: toolName,
        arguments: args,
        taint_sources: taintSources,
        context_preview: contextPreview,
        project_id: projectId,
      }),
    });
  }

  public async listDebates(projectId?: string): Promise<any[]> {
    const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
    return this.request<any[]>(`/v1/judge/history${qs}`, { method: "GET" });
  }

  public async runRedteam(
    targetName: string = "Research-Assistant-v1",
    rounds: number = 5,
    targetTools?: string[],
    projectId?: string
  ): Promise<any> {
    return this.request<any>("/v1/redteam/run", {
      method: "POST",
      body: JSON.stringify({
        target_name: targetName,
        rounds,
        target_tools: targetTools,
        project_id: projectId,
      }),
    });
  }

  public async listRedteamRuns(projectId?: string): Promise<any[]> {
    const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
    return this.request<any[]>(`/v1/redteam/runs${qs}`, { method: "GET" });
  }

  public async synthesizeAutoPolicy(scanId?: string, scanReport?: any, projectId?: string): Promise<any> {
    return this.request<any>("/v1/autopolicy/synthesize/scan", {
      method: "POST",
      body: JSON.stringify({ scan_id: scanId, scan_report: scanReport, project_id: projectId }),
    });
  }

  public async listPolicyProposals(projectId?: string, status?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (projectId) params.append("project_id", projectId);
    if (status) params.append("status", status);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return this.request<any[]>(`/v1/autopolicy/proposals${qs}`, { method: "GET" });
  }

  public async applyPolicyProposal(proposalId: string, projectId?: string): Promise<any> {
    return this.request<any>("/v1/autopolicy/apply", {
      method: "POST",
      body: JSON.stringify({ proposal_id: proposalId, project_id: projectId }),
    });
  }

  // ==========================================
  // 1. Ephemeral A2A Attestation & Tokens
  // ==========================================

  public async issueA2AToken(data: {
    issuer_agent: string;
    target_agent: string;
    delegation_intent: string;
    allowed_tools: string[];
    ttl_seconds?: number;
    max_invocations?: number;
    project_id?: string;
  }): Promise<any> {
    return this.request<any>("/v1/attestation/tokens", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public async verifyA2AToken(data: {
    token_id: string;
    tool_name: string;
    calling_agent: string;
    params?: any;
  }): Promise<any> {
    return this.request<any>("/v1/attestation/verify", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public async listA2ATokens(projectId?: string): Promise<any[]> {
    const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
    return this.request<any[]>(`/v1/attestation/tokens${qs}`, { method: "GET" });
  }

  // ==========================================
  // 2. Dynamic Domain Honeytools & Canaries
  // ==========================================

  public async generateHoneytokenDecoys(data: {
    domain?: string;
    existing_tools?: string[];
    project_id?: string;
  }): Promise<any> {
    return this.request<any>("/v1/honeytokens/generate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public async inspectOutboundSink(data: {
    sink_name: string;
    payload_text: string;
    agent_id?: string;
    project_id?: string;
  }): Promise<any> {
    return this.request<any>("/v1/honeytokens/inspect", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public async listHoneytokenCanaries(projectId?: string): Promise<any[]> {
    const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
    return this.request<any[]>(`/v1/honeytokens/canaries${qs}`, { method: "GET" });
  }

  // ==========================================
  // 3. Ephemeral Sandbox Tool Isolation
  // ==========================================

  public async executeInSandbox(data: {
    tool_name: string;
    command_or_code: string;
    params?: any;
  }): Promise<any> {
    return this.request<any>("/v1/sandbox/execute", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ==========================================
  // 4. Semantic Memory Poisoning & RAG Firewall
  // ==========================================

  public async inspectRAGChunks(data: {
    chunks: string[];
    project_id?: string;
  }): Promise<any> {
    return this.request<any>("/v1/rag/inspect", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public async listRAGHistory(projectId?: string): Promise<any[]> {
    const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
    return this.request<any[]>(`/v1/rag/history${qs}`, { method: "GET" });
  }

  public async listRAGDocuments(): Promise<any[]> {
    return this.request<any[]>("/v1/rag/documents", { method: "GET" });
  }

  public async addRAGDocument(data: {
    title: string;
    content: string;
    project_id?: string;
  }): Promise<any> {
    return this.request<any>("/v1/rag/documents", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public async queryRAG(data: {
    query: string;
    protect_with_shield?: boolean;
    top_k?: number;
    project_id?: string;
  }): Promise<any> {
    return this.request<any>("/v1/rag/query", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public async simulateRAGAttack(query?: string): Promise<any> {
    const qs = query ? `?query=${encodeURIComponent(query)}` : "";
    return this.request<any>(`/v1/rag/simulate-attack${qs}`, {
      method: "POST",
    });
  }

  public async normalizeRAGText(text: string): Promise<any> {
    return this.request<any>("/v1/rag/normalize", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  }

  public async maskRAGContext(text: string): Promise<any> {
    return this.request<any>("/v1/rag/mask", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  }

  public async attestRAGCitation(data: {
    claim_text: string;
    chunk_id: string;
    chunk_text: string;
  }): Promise<any> {
    return this.request<any>("/v1/rag/attest-citation", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public async simulateMultiHopRAG(data?: {
    initial_query?: string;
    secondary_query?: string;
  }): Promise<any> {
    return this.request<any>("/v1/rag/multihop", {
      method: "POST",
      body: JSON.stringify(data || {}),
    });
  }

  // ==========================================
  // 5. GitOps Hot-Reload & Automated PRs
  // ==========================================

  public async generateGitOpsPR(data: {
    rule_name: string;
    rego_code: string;
    test_code: string;
    target_tool: string;
    mitigated_cve?: string;
    author?: string;
    project_id?: string;
  }): Promise<any> {
    return this.request<any>("/v1/gitops/proposals", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public async applyGitOpsHotfix(proposalId: string): Promise<any> {
    return this.request<any>(`/v1/gitops/proposals/${encodeURIComponent(proposalId)}/apply`, {
      method: "POST",
      body: JSON.stringify({ proposal_id: proposalId }),
    });
  }

  public async listGitOpsProposals(projectId?: string): Promise<any[]> {
    const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
    return this.request<any[]>(`/v1/gitops/proposals${qs}`, { method: "GET" });
  }

  // ==========================================
  // 6. Live Immunity Score & Drift Monitor
  // ==========================================

  public async getImmunityScore(projectId?: string): Promise<any> {
    const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
    return this.request<any>(`/v1/immunity/score${qs}`, { method: "GET" });
  }

  public async getImmunityDrift(projectId?: string): Promise<any[]> {
    const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
    return this.request<any[]>(`/v1/immunity/drift${qs}`, { method: "GET" });
  }

  public async runChaosProbe(agentName?: string): Promise<any> {
    return this.request<any>("/v1/immunity/chaos-probe", {
      method: "POST",
      body: JSON.stringify({ agent_name: agentName || "Customer-Support-Agent" }),
    });
  }
}
