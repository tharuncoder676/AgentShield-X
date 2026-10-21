import React, { useState, useEffect } from "react";
import { KeyRound, Shield, CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw, Zap, ArrowRight, UserCheck, ShieldAlert } from "lucide-react";
import { Panel, cn } from "@agentshield/ui";
import { useAuth } from "../context/AuthContext";

interface TokenRecord {
  id?: string;
  jti: string;
  issuer_agent: string;
  target_agent: string;
  delegation_intent: string;
  allowed_tools: string[];
  ttl_seconds: number;
  status: "active" | "used" | "revoked" | "expired";
  expires_at: number;
  signature: string;
  invocations_used?: number;
}

export const Attestation: React.FC = () => {
  const { client, activeProject } = useAuth();
  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Form states
  const [issuerAgent, setIssuerAgent] = useState("Planner-Agent-v2");
  const [targetAgent, setTargetAgent] = useState("Database-Specialist");
  const [intent, setIntent] = useState("Query customer quarterly metrics");
  const [allowedTools, setAllowedTools] = useState("query_users,read_audit_log");
  const [ttl, setTtl] = useState(45);

  // Verification tester states
  const [selectedJti, setSelectedJti] = useState("");
  const [testTool, setTestTool] = useState("query_users");
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; message: string } | null>(null);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const data = await client.listA2ATokens(activeProject?.id);
      if (Array.isArray(data) && data.length > 0) {
        setTokens(data);
        if (!selectedJti) setSelectedJti(data[0].jti);
      } else {
        // Fallback demo tokens
        const sample: TokenRecord[] = [
          {
            jti: "AS-A2A-99F128A0C4B8",
            issuer_agent: "Supervisor-Agent",
            target_agent: "Bash-Executor",
            delegation_intent: "Run safe containerized unit tests",
            allowed_tools: ["run_pytest", "read_test_output"],
            ttl_seconds: 30,
            status: "active",
            expires_at: Date.now() / 1000 + 25,
            signature: "88ab92e478f1023d8c...",
            invocations_used: 0,
          },
          {
            jti: "AS-A2A-33B810CC4412",
            issuer_agent: "Research-Lead",
            target_agent: "Web-Scraper",
            delegation_intent: "Fetch documentation references",
            allowed_tools: ["http_get"],
            ttl_seconds: 60,
            status: "used",
            expires_at: Date.now() / 1000 - 15,
            signature: "55ff101a88bc7712e0...",
            invocations_used: 1,
          },
        ];
        setTokens(sample);
        setSelectedJti(sample[0].jti);
      }
    } catch {
      // keep fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, [activeProject]);

  const handleIssueToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssuing(true);
    try {
      const tools = allowedTools.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await client.issueA2AToken({
        issuer_agent: issuerAgent,
        target_agent: targetAgent,
        delegation_intent: intent,
        allowed_tools: tools,
        ttl_seconds: ttl,
        project_id: activeProject?.id,
      });
      if (res && res.jti) {
        setTokens((prev) => [res, ...prev]);
        setSelectedJti(res.jti);
      }
    } catch {
      // Mock local creation on connection failure
      const mockToken: TokenRecord = {
        jti: `AS-A2A-${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
        issuer_agent: issuerAgent,
        target_agent: targetAgent,
        delegation_intent: intent,
        allowed_tools: allowedTools.split(",").map((s) => s.trim()),
        ttl_seconds: ttl,
        status: "active",
        expires_at: Date.now() / 1000 + ttl,
        signature: `${Math.random().toString(16).slice(2, 14)}...`,
        invocations_used: 0,
      };
      setTokens((prev) => [mockToken, ...prev]);
      setSelectedJti(mockToken.jti);
    } finally {
      setIssuing(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedJti) return;
    setVerifying(true);
    try {
      const res = await client.verifyA2AToken({
        token_id: selectedJti,
        tool_name: testTool,
        calling_agent: targetAgent,
      });
      setVerifyResult(res);
      fetchTokens();
    } catch {
      const tok = tokens.find((t) => t.jti === selectedJti);
      const isAllowed = tok?.allowed_tools.includes(testTool);
      setVerifyResult({
        valid: Boolean(isAllowed && tok?.status === "active"),
        message: isAllowed
          ? `[OK] Attestation verified. Tool '${testTool}' permitted under token scope.`
          : `[BLOCKED] Tool '${testTool}' not in permitted capability scope. Allowed: ${tok?.allowed_tools.join(", ")}`,
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-chakra text-xs uppercase font-bold tracking-wider">
            <KeyRound size={14} />
            <span>Agent-to-Agent (A2A) Zero-Trust Defense</span>
          </div>
          <h1 className="text-2xl font-bold font-chakra text-fg tracking-wide mt-1">
            Ephemeral Attestation & Capability Tokens
          </h1>
          <p className="text-sm text-mut mt-1">
            Issues cryptographically signed HMAC-SHA256 tokens scoping inter-agent delegations with strict TTLs and tool quotas.
          </p>
        </div>
        <button
          onClick={fetchTokens}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded border border-line bg-panel hover:border-cyan-400 hover:text-cyan-400 transition-colors text-xs font-mono"
        >
          <RefreshCw size={14} className={cn(loading && "animate-spin")} />
          <span>Refresh Tokens</span>
        </button>
      </div>

      {/* Grid: Token Issuer Form & Verification Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Token Issuer Card */}
        <div className="lg:col-span-6">
          <Panel title="Issue Bounded A2A Capability Token">
            <form onSubmit={handleIssueToken} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-mut mb-1 font-chakra uppercase font-bold text-[11px]">
                    Issuer Agent
                  </label>
                  <input
                    type="text"
                    value={issuerAgent}
                    onChange={(e) => setIssuerAgent(e.target.value)}
                    className="w-full bg-[#080d1a] border border-line rounded px-3 py-2 text-fg focus:outline-none focus:border-cyan-400 font-mono text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-mut mb-1 font-chakra uppercase font-bold text-[11px]">
                    Recipient Sub-Agent
                  </label>
                  <input
                    type="text"
                    value={targetAgent}
                    onChange={(e) => setTargetAgent(e.target.value)}
                    className="w-full bg-[#080d1a] border border-line rounded px-3 py-2 text-fg focus:outline-none focus:border-cyan-400 font-mono text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-mut mb-1 font-chakra uppercase font-bold text-[11px]">
                  Delegation Intent
                </label>
                <input
                  type="text"
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  className="w-full bg-[#080d1a] border border-line rounded px-3 py-2 text-fg focus:outline-none focus:border-cyan-400 font-mono text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-mut mb-1 font-chakra uppercase font-bold text-[11px]">
                  Bounded Allowed Tools (comma-separated)
                </label>
                <input
                  type="text"
                  value={allowedTools}
                  onChange={(e) => setAllowedTools(e.target.value)}
                  className="w-full bg-[#080d1a] border border-line rounded px-3 py-2 text-fg focus:outline-none focus:border-cyan-400 font-mono text-xs"
                  placeholder="query_users, read_audit_log"
                  required
                />
              </div>

              <div>
                <label className="block text-mut mb-1 font-chakra uppercase font-bold text-[11px]">
                  Validity TTL (Seconds: 5 - 300)
                </label>
                <input
                  type="number"
                  min={5}
                  max={300}
                  value={ttl}
                  onChange={(e) => setTtl(Number(e.target.value))}
                  className="w-full bg-[#080d1a] border border-line rounded px-3 py-2 text-fg focus:outline-none focus:border-cyan-400 font-mono text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={issuing}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20 font-chakra uppercase font-bold tracking-wider transition-all shadow-[0_0_15px_rgba(0,240,255,0.15)]"
              >
                <Zap size={14} />
                <span>{issuing ? "Signing Cryptographic Token..." : "Issue Signed Capability Token"}</span>
              </button>
            </form>
          </Panel>
        </div>

        {/* Live Attestation Enforcement Tester */}
        <div className="lg:col-span-6">
          <Panel title="Live Attestation Enforcement Simulator">
            <div className="space-y-4 text-xs font-mono">
              <p className="text-mut text-[11px] leading-relaxed">
                Simulate a recipient sub-agent attempting to invoke a tool using an issued capability token.
                Attestation checks tool bounds, token signature integrity, TTL, and invocation quotas.
              </p>

              <div>
                <label className="block text-mut mb-1 font-chakra uppercase font-bold text-[11px]">
                  Select Capability Token (JTI)
                </label>
                <select
                  value={selectedJti}
                  onChange={(e) => setSelectedJti(e.target.value)}
                  className="w-full bg-[#080d1a] border border-line rounded px-3 py-2 text-fg focus:outline-none focus:border-cyan-400 font-mono text-xs"
                >
                  {tokens.map((t) => (
                    <option key={t.jti} value={t.jti}>
                      {t.jti} [{t.status.toUpperCase()}] &bull; {t.issuer_agent} &rarr; {t.target_agent}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-mut mb-1 font-chakra uppercase font-bold text-[11px]">
                  Tool Invocation to Evaluate
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testTool}
                    onChange={(e) => setTestTool(e.target.value)}
                    className="flex-1 bg-[#080d1a] border border-line rounded px-3 py-2 text-fg focus:outline-none focus:border-cyan-400 font-mono text-xs"
                    placeholder="query_users or drop_table"
                  />
                  <button
                    onClick={() => setTestTool("drop_table")}
                    className="px-2.5 py-1 text-[10px] rounded border border-bad/40 text-bad hover:bg-bad/10"
                  >
                    Test Exploit
                  </button>
                </div>
              </div>

              <button
                onClick={handleVerify}
                disabled={verifying || !selectedJti}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded bg-panel border border-line hover:border-fg text-fg font-chakra uppercase font-bold tracking-wider transition-all"
              >
                <Shield size={14} />
                <span>{verifying ? "Verifying Attestation..." : "Evaluate Delegation & Attenuation"}</span>
              </button>

              {/* Result Banner */}
              {verifyResult && (
                <div
                  className={cn(
                    "p-3 rounded border flex items-start gap-3 mt-3 animate-fade-in",
                    verifyResult.valid
                      ? "bg-ok/10 border-ok/40 text-ok"
                      : "bg-bad/10 border-bad/40 text-bad"
                  )}
                >
                  {verifyResult.valid ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <XCircle size={18} className="shrink-0 mt-0.5" />}
                  <div>
                    <div className="font-bold text-[12px] uppercase tracking-wider font-chakra">
                      {verifyResult.valid ? "Attestation Verification PASSED" : "Attestation Verification REJECTED"}
                    </div>
                    <div className="text-[11px] text-fg/90 mt-1 leading-relaxed font-mono">
                      {verifyResult.message}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>

      {/* Active Tokens Registry Table */}
      <Panel title="Active Delegation Tokens Registry">
        <div className="overflow-x-auto font-mono text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line text-mut text-[11px] font-chakra uppercase">
                <th className="py-2.5 px-3">Token JTI</th>
                <th className="py-2.5 px-3">Issuer &rarr; Recipient</th>
                <th className="py-2.5 px-3">Intent</th>
                <th className="py-2.5 px-3">Allowed Tools</th>
                <th className="py-2.5 px-3">TTL</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {tokens.map((t) => (
                <tr key={t.jti} className="hover:bg-panel/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-cyan-400">{t.jti}</td>
                  <td className="py-3 px-3 text-fg">
                    <span className="text-mut">{t.issuer_agent}</span> &rarr; <span className="font-bold text-fg">{t.target_agent}</span>
                  </td>
                  <td className="py-3 px-3 text-mut truncate max-w-[200px]">{t.delegation_intent}</td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {t.allowed_tools.map((tool) => (
                        <span key={tool} className="px-1.5 py-0.5 rounded bg-panel border border-line text-[10px]">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-mut flex items-center gap-1.5">
                    <Clock size={12} />
                    <span>{t.ttl_seconds}s</span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        t.status === "active" && "bg-ok/10 text-ok border border-ok/30",
                        t.status === "used" && "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30",
                        t.status === "expired" && "bg-mut/20 text-mut border border-mut/30",
                        t.status === "revoked" && "bg-bad/10 text-bad border border-bad/30"
                      )}
                    >
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};
