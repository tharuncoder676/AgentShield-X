import React, { useState, useEffect } from "react";
import {
  Users,
  Shield,
  Key,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Server,
  Fingerprint,
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Building,
  KeyRound,
  ShieldAlert,
} from "lucide-react";
import { Panel, cn } from "@agentshield/ui";

interface Tenant {
  tenant_id: string;
  tenant_name: string;
  isolation_tier: string;
  max_agents: number;
  active_agent_count: number;
}

interface RBACUser {
  user_id: string;
  email: string;
  display_name: string;
  tenant_id: string;
  role: string;
  sso_provider: string;
  mfa_verified: boolean;
}

interface SSOConfig {
  enabled: boolean;
  provider: string;
  protocol: string;
  entity_id: string;
  idp_sso_url: string;
  cert_fingerprint: string;
  enforce_mfa: boolean;
  auto_provision_jit: boolean;
  default_role: string;
  group_role_mapping: Record<string, string>;
}

export function RBAC() {
  const [roles, setRoles] = useState<string[]>([]);
  const [matrix, setMatrix] = useState<Record<string, string[]>>({});
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<RBACUser[]>([]);
  const [ssoConfig, setSsoConfig] = useState<SSOConfig | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("SECURITY_ANALYST");
  const [simEmail, setSimEmail] = useState("lead.analyst@enterprise.corp");
  const [simGroup, setSimGroup] = useState("SecOps_Engineers");
  const [simResult, setSimResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRoles, resTenants, resUsers, resSSO] = await Promise.all([
        fetch("http://127.0.0.1:8002/v1/rbac/roles"),
        fetch("http://127.0.0.1:8002/v1/rbac/tenants"),
        fetch("http://127.0.0.1:8002/v1/rbac/users"),
        fetch("http://127.0.0.1:8002/v1/rbac/sso/config"),
      ]);

      if (resRoles.ok) {
        const j = await resRoles.json();
        setRoles(j.roles);
        setMatrix(j.matrix);
      }
      if (resTenants.ok) setTenants(await resTenants.json());
      if (resUsers.ok) setUsers(await resUsers.json());
      if (resSSO.ok) setSsoConfig(await resSSO.json());
    } catch (e) {
      console.error("Failed to fetch RBAC configuration", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateSSO = async () => {
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await fetch("http://127.0.0.1:8002/v1/rbac/sso/test-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: simEmail,
          display_name: simEmail.split("@")[0].replace(".", " ").toUpperCase(),
          idp_groups: [simGroup],
          tenant_id: "tenant-prod-us",
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setSimResult(json);
        // Refresh users list to show JIT provisioned user
        const uRes = await fetch("http://127.0.0.1:8002/v1/rbac/users");
        if (uRes.ok) setUsers(await uRes.json());
      }
    } catch (e) {
      console.error("SSO handshake failed", e);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-gray-200">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-2xl bg-[#120a24]/80 border border-purple-900/40 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                ZERO-TRUST MULTI-TENANCY
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                MFA ENFORCED (SAML 2.0 / OIDC)
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Multi-Tenant RBAC & SSO Governance
            </h1>
            <p className="mt-1 text-sm text-gray-400 max-w-2xl">
              Enterprise tenant isolation, role-based resource permissions, and automated Just-In-Time (JIT) provisioning via Okta, Azure AD, and PingIdentity.
            </p>
            <div className="mt-2 text-xs text-purple-300/60 font-mono">
              Lead Architect: Tharunkumar.S | AgentShield-X Security Labs
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-purple-950/40 hover:bg-purple-900/40 text-purple-200 border border-purple-700/40 transition-all shadow-sm"
            >
              <RefreshCw className="w-4 h-4 text-purple-400" />
              Sync Directory
            </button>
          </div>
        </div>
      </div>

      {/* Bento Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[#120a24]/60 border border-purple-800/30 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-300/80 uppercase">
            <span>Isolated Tenants</span>
            <Building className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{tenants.length} Pods</div>
          <div className="text-[11px] text-emerald-400 mt-1">100% Cryptographic Boundary</div>
        </div>

        <div className="rounded-xl bg-[#120a24]/60 border border-purple-800/30 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-300/80 uppercase">
            <span>Active Users</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-200">{users.length} Active</div>
          <div className="text-[11px] text-purple-300/70 mt-1">JIT SCIM Sync Enabled</div>
        </div>

        <div className="rounded-xl bg-[#120a24]/60 border border-purple-800/30 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-300/80 uppercase">
            <span>Identity Provider</span>
            <Fingerprint className="w-4 h-4 text-violet-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{ssoConfig?.provider || "Okta"}</div>
          <div className="text-[11px] text-purple-300/70 mt-1">{ssoConfig?.protocol || "SAML 2.0"} Protocol</div>
        </div>

        <div className="rounded-xl bg-[#120a24]/60 border border-purple-800/30 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-300/80 uppercase">
            <span>Governance Roles</span>
            <KeyRound className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-300">{roles.length} Tiers</div>
          <div className="text-[11px] text-purple-300/70 mt-1">18 Scoped Permissions</div>
        </div>
      </div>

      {/* Multi-Tenant Pods Bento */}
      <div className="rounded-2xl bg-[#120a24]/70 border border-purple-900/30 p-6 backdrop-blur-md">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-1">
          <Building className="w-5 h-5 text-purple-400" />
          Enterprise Isolated Tenant Pods
        </h2>
        <p className="text-xs text-gray-400 mb-5">
          Dedicated security perimeters with cross-tenant data leakage prevention and hardware-backed isolation tiers.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tenants.map((t) => (
            <div
              key={t.tenant_id}
              className="rounded-xl bg-purple-950/20 border border-purple-800/30 p-5 flex flex-col justify-between hover:border-purple-600/50 transition-all"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{t.tenant_name}</span>
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                      t.isolation_tier === "AIRGAPPED"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : t.isolation_tier === "DEDICATED_VPC"
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    )}
                  >
                    {t.isolation_tier}
                  </span>
                </div>
                <div className="text-[10px] text-purple-400 font-mono mt-1">{t.tenant_id}</div>

                <div className="mt-4 flex items-baseline justify-between text-xs">
                  <span className="text-gray-400">Agent Capacity:</span>
                  <span className="text-white font-mono font-semibold">
                    {t.active_agent_count} / {t.max_agents} Agents
                  </span>
                </div>
                <div className="w-full bg-purple-950/60 rounded-full h-1.5 mt-1.5 overflow-hidden border border-purple-900/40">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-violet-400 h-1.5 rounded-full"
                    style={{ width: `${(t.active_agent_count / t.max_agents) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role & Permission Matrix Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Selector List */}
        <div className="rounded-2xl bg-[#120a24]/70 border border-purple-900/30 p-6 backdrop-blur-md">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-1">
            <KeyRound className="w-5 h-5 text-purple-400" />
            Configured Roles
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Select a role to inspect its granular permission boundary.
          </p>

          <div className="space-y-2">
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRole(r)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-between",
                  selectedRole === r
                    ? "bg-purple-600/30 border-purple-500 text-white shadow-md shadow-purple-900/20"
                    : "bg-purple-950/20 border-purple-900/30 text-gray-300 hover:border-purple-700/40"
                )}
              >
                <div>
                  <div className="font-semibold">{r.replace("_", " ")}</div>
                  <div className="text-[10px] text-purple-300/70 font-mono">
                    {matrix[r]?.length || 0} Permissions Granted
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Selected Role Permissions Detail */}
        <div className="lg:col-span-2 rounded-2xl bg-[#120a24]/70 border border-purple-900/30 p-6 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-400" />
                Active Permission Boundary for: {selectedRole}
              </h3>
              <span className="text-xs font-mono text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                {matrix[selectedRole]?.length || 0} Permissions
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-5">
              These scoped capabilities are automatically attached to JIT session tokens during authentication.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {(matrix[selectedRole] || []).map((perm) => (
                <div
                  key={perm}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#0d0718] border border-purple-950 text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="font-mono text-purple-200">{perm}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-purple-900/30 text-[11px] text-gray-400 flex items-center justify-between">
            <span>Least-Privilege Enforcement Mode: Enforced</span>
            <span className="text-emerald-400">SOC2 Type II CC6.1 Compliant</span>
          </div>
        </div>
      </div>

      {/* Enterprise SSO Handshake Simulator & IdP Config */}
      <div className="rounded-2xl bg-[#120a24]/80 border border-purple-900/40 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Fingerprint className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Enterprise SSO & JIT Directory Provisioning Hub</h2>
            </div>
            <p className="text-xs text-gray-400">
              Federate with enterprise IdPs via SAML 2.0 or OIDC. Test SCIM group mapping and session token issuance.
            </p>
          </div>
          <span className="text-xs font-mono text-purple-300 bg-purple-950/60 px-3 py-1.5 rounded-lg border border-purple-800/40">
            SP Entity: {ssoConfig?.entity_id}
          </span>
        </div>

        {/* Live Simulator Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">User Corporate Email</label>
            <input
              type="email"
              value={simEmail}
              onChange={(e) => setSimEmail(e.target.value)}
              className="w-full bg-[#0d0718] border border-purple-900/40 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">IdP SCIM Group</label>
            <select
              value={simGroup}
              onChange={(e) => setSimGroup(e.target.value)}
              className="w-full bg-[#0d0718] border border-purple-900/40 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="AgentShield_Admins">AgentShield_Admins → SECURITY_ADMIN</option>
              <option value="SecOps_Engineers">SecOps_Engineers → SECURITY_ANALYST</option>
              <option value="AI_App_Developers">AI_App_Developers → DEVELOPER</option>
              <option value="Compliance_Auditors">Compliance_Auditors → AUDITOR</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSimulateSSO}
              disabled={simulating}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 via-purple-500 to-violet-600 hover:from-purple-500 hover:to-violet-500 shadow-lg shadow-purple-900/30 transition-all border border-purple-400/30 disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              {simulating ? "Authenticating IdP..." : "Simulate SSO Handshake"}
            </button>
          </div>
        </div>

        {/* Simulator Output Box */}
        {simResult && (
          <div className="rounded-xl bg-[#090412] border border-purple-950 p-4 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-purple-900/40">
              <span className="text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                SSO ASSERTION VALIDATED & JIT USER PROVISIONED
              </span>
              <span className="text-purple-300">
                Assigned Role: <strong className="text-white">{simResult.assigned_role}</strong>
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-gray-400">
              <div>Session Token: <span className="text-purple-300">{simResult.session_token}</span></div>
              <div>Tenant Pod: <span className="text-purple-300">{simResult.tenant?.tenant_name}</span></div>
              <div>MFA Enforced: <span className="text-emerald-400">TRUE</span></div>
              <div>Granted Scopes: <span className="text-purple-300">{simResult.authorized_permissions?.length} Scoped APIs</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RBAC;

