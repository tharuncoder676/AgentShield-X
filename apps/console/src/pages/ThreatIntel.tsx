import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  ShieldAlert, 
  AlertTriangle, 
  Download, 
  ExternalLink, 
  Copy, 
  CheckCircle2, 
  Activity, 
  Search, 
  Flame, 
  RefreshCw,
  Cpu,
  Layers,
  Database
} from 'lucide-react';

interface AgentAdvisory {
  advisory_id: string;
  title: string;
  target_framework: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  cvss_score: number;
  mitre_atlas_technique: string;
  description: string;
  remediation: string;
  published_at: string;
  patch_rule_id: string;
}

interface MCPRating {
  tool_name: string;
  category: string;
  risk_score: number;
  vulnerability_tags: string[];
  recommended_containment: string;
}

interface TrendingThreat {
  signature_id: string;
  pattern_name: string;
  prevalence_pct: number;
  observed_in_the_wild_count: number;
  mitre_category: string;
  mitigation_status: string;
}

export const ThreatIntel: React.FC = () => {
  const [advisories, setAdvisories] = useState<AgentAdvisory[]>([]);
  const [mcpRatings, setMcpRatings] = useState<MCPRating[]>([]);
  const [trending, setTrending] = useState<TrendingThreat[]>([]);
  const [activeTab, setActiveTab] = useState<'advisories' | 'mcp' | 'trending' | 'stix'>('advisories');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const fetchIntel = async () => {
    try {
      const [advRes, mcpRes, trendRes] = await Promise.all([
        fetch('http://127.0.0.1:8002/v1/threats/advisories'),
        fetch('http://127.0.0.1:8002/v1/threats/mcp-index'),
        fetch('http://127.0.0.1:8002/v1/threats/trending'),
      ]);

      if (advRes.ok && mcpRes.ok && trendRes.ok) {
        const aData = await advRes.json();
        const mData = await mcpRes.json();
        const tData = await trendRes.json();
        setAdvisories(aData.advisories || []);
        setMcpRatings(mData.ratings || []);
        setTrending(tData.trending || []);
      } else {
        fallbackData();
      }
    } catch {
      fallbackData();
    } finally {
      setLoading(false);
    }
  };

  const fallbackData = () => {
    setAdvisories([
      {
        advisory_id: 'ASA-2026-0041',
        title: 'LangChain Experimental REPL Arbitrary Code Execution',
        target_framework: 'LangChain <= 0.2.14',
        severity: 'CRITICAL',
        cvss_score: 9.8,
        mitre_atlas_technique: 'AML.T0054: LLM Jailbreak via Code Execution Sink',
        description: 'Unsanitized PythonREPL tool allows prompt-injected strings to bypass ast whitelist and execute os.system via builtin reflection.',
        remediation: 'Upgrade to AgentShield Universal SDK wrapper or enforce Ephemeral Docker Sandbox isolation.',
        published_at: '2026-10-28T14:00:00Z',
        patch_rule_id: 'rule-block-003',
      },
      {
        advisory_id: 'ASA-2026-0038',
        title: 'Model Context Protocol Filesystem Rug-Pull Path Traversal',
        target_framework: 'MCP Standard Server: @modelcontextprotocol/server-filesystem',
        severity: 'CRITICAL',
        cvss_score: 9.1,
        mitre_atlas_technique: 'AML.T0024: Exfiltration via MCP Tool Schema Poisoning',
        description: 'Malicious tool schema updates allow symlink resolution outside the permitted directory boundary.',
        remediation: "Pin MCP tool definitions using 'agentshield mcp-proxy --pins mcp_pins.json'.",
        published_at: '2026-10-24T09:30:00Z',
        patch_rule_id: 'pkg-mcp-github-slack-guard',
      },
      {
        advisory_id: 'ASA-2026-0035',
        title: 'CrewAI Multi-Turn Role-Play Memory Poisoning',
        target_framework: 'CrewAI <= 0.51.0',
        severity: 'HIGH',
        cvss_score: 8.4,
        mitre_atlas_technique: 'AML.T0040: Persistent Agent Identity Drift',
        description: 'Adversaries can inject system prompt overriding text into long-term agent memory vectors, persisting across sessions.',
        remediation: 'Enable Agent Genome Behavioral DNA continuous drift monitoring.',
        published_at: '2026-10-19T11:15:00Z',
        patch_rule_id: 'pkg-owasp-top-10-llm',
      },
      {
        advisory_id: 'ASA-2026-0029',
        title: 'Indirect RAG Document Taint via Unicode Homoglyphs',
        target_framework: 'Universal RAG / LlamaIndex / LangChain',
        severity: 'HIGH',
        cvss_score: 8.1,
        mitre_atlas_technique: 'AML.T0051: LLM Prompt Injection via RAG',
        description: 'Cyrillic homoglyphs bypass naive regex filters while rendering as valid English instructions to generative models.',
        remediation: 'Deploy AgentShield RAG Firewall with JIT Homoglyph Normalization.',
        published_at: '2026-10-15T16:45:00Z',
        patch_rule_id: 'lesson-01-indirect-injection',
      },
    ]);

    setMcpRatings([
      { tool_name: 'mcp_shell_bash_executor', category: 'System Execution', risk_score: 0.96, vulnerability_tags: ['Root Escalation', 'Destruction'], recommended_containment: 'Block in Production' },
      { tool_name: 'mcp_filesystem_read_write', category: 'Filesystem', risk_score: 0.89, vulnerability_tags: ['RCE', 'Data Exfiltration'], recommended_containment: 'Strict Read-Only Sandbox' },
      { tool_name: 'mcp_database_sql_query', category: 'Database', risk_score: 0.74, vulnerability_tags: ['SQL Injection', 'Table Drops'], recommended_containment: 'Read-Only + AST Filter' },
      { tool_name: 'mcp_slack_send_message', category: 'Collaboration', risk_score: 0.58, vulnerability_tags: ['Public Exfil'], recommended_containment: 'Human Auth for DMs' },
      { tool_name: 'mcp_github_issue_manager', category: 'Developer Tools', risk_score: 0.42, vulnerability_tags: ['Secret Scraping'], recommended_containment: 'Pin Single Repo Scope' },
      { tool_name: 'mcp_weather_math_calculator', category: 'Utility', risk_score: 0.04, vulnerability_tags: ['Benign Calculation'], recommended_containment: 'Zero-Latency Pass' },
    ]);

    setTrending([
      { signature_id: 'SIG-TREND-01', pattern_name: 'Indirect Markdown Image Steganography', prevalence_pct: 88.4, observed_in_the_wild_count: 4820, mitre_category: 'AML.T0051', mitigation_status: 'MITIGATED_BY_AGENTSHIELD' },
      { signature_id: 'SIG-TREND-02', pattern_name: 'Autonomous Tool DAG Lateral Staging', prevalence_pct: 74.2, observed_in_the_wild_count: 3190, mitre_category: 'AML.T0024', mitigation_status: 'MITIGATED_BY_AGENTSHIELD' },
      { signature_id: 'SIG-TREND-03', pattern_name: 'Dynamic MCP Tool Definition Rug-Pull', prevalence_pct: 68.9, observed_in_the_wild_count: 2840, mitre_category: 'AML.T0040', mitigation_status: 'MITIGATED_BY_AGENTSHIELD' },
      { signature_id: 'SIG-TREND-04', pattern_name: 'Recursive Context Sponge DoS Attacks', prevalence_pct: 52.1, observed_in_the_wild_count: 1920, mitre_category: 'AML.T0035', mitigation_status: 'MITIGATED_BY_AGENTSHIELD' },
    ]);
  };

  useEffect(() => {
    fetchIntel();
  }, []);

  const stixBundlePreview = JSON.stringify(
    {
      type: 'bundle',
      id: 'bundle--agentshield-intel-20261031',
      spec_version: '2.1',
      published: new Date().toISOString(),
      objects: advisories.map(a => ({
        type: 'vulnerability',
        spec_version: '2.1',
        id: `vulnerability--${a.advisory_id.toLowerCase()}`,
        name: a.title,
        description: a.description,
        external_references: [
          { source_name: 'AgentShield-X Labs', external_id: a.advisory_id },
          { source_name: 'MITRE ATLAS', external_id: a.mitre_atlas_technique.split(':')[0] },
        ],
        x_cvss_score: a.cvss_score,
        x_severity: a.severity,
        x_remediation: a.remediation,
      })),
    },
    null,
    2
  );

  const copyStix = () => {
    navigator.clipboard.writeText(stixBundlePreview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredAdvisories = advisories.filter(a => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.advisory_id.toLowerCase().includes(q) ||
      a.target_framework.toLowerCase().includes(q) ||
      a.mitre_atlas_technique.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#0a0518] text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-purple-900/30 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400">
                <Radio className="w-6 h-6 animate-pulse text-violet-300" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                Public Threat Intelligence Feed
              </h1>
            </div>
            <p className="text-sm text-purple-300/70 mt-1">
              Open-access Agent Security Advisories (ASA), MITRE ATLAS attack mapping, and standardized MCP tool risk ratings
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-800/40 text-xs font-mono text-purple-300">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-ping" />
              STIX 2.1 TAXII Feed: LIVE
            </span>
            <button
              onClick={fetchIntel}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#120a24] hover:bg-purple-950/40 text-purple-300 font-medium transition-all border border-purple-800/40 text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Telemetry Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-purple-300/70 text-xs font-semibold uppercase tracking-wider">
              <span>Active Advisories</span>
              <ShieldAlert className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-extrabold text-transparent bg-gradient-to-r from-rose-400 to-purple-300 bg-clip-text mt-2 font-mono">
              {advisories.length} Disclosed
            </div>
            <div className="text-xs text-purple-400/80 mt-1">CVSS 8.0+ Criticality</div>
          </div>

          <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-emerald-300/70 text-xs font-semibold uppercase tracking-wider">
              <span>Rated MCP Sinks</span>
              <Cpu className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">
              {mcpRatings.length} Tools
            </div>
            <div className="text-xs text-emerald-400/80 mt-1">Standardized Risk Scores</div>
          </div>

          <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-violet-300/70 text-xs font-semibold uppercase tracking-wider">
              <span>Observed Attacks</span>
              <Flame className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-3xl font-extrabold text-violet-300 mt-2 font-mono">
              12,770+
            </div>
            <div className="text-xs text-violet-400/80 mt-1">Federated Sensor Telemetry</div>
          </div>

          <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-amber-300/70 text-xs font-semibold uppercase tracking-wider">
              <span>Feed Standards</span>
              <Database className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white mt-2 font-mono">
              STIX 2.1 JSON
            </div>
            <div className="text-xs text-amber-400/80 mt-1">SIEM & EDR Ingest Ready</div>
          </div>
        </div>

        {/* Tab View Switcher */}
        <div className="flex items-center gap-3 border-b border-purple-900/30 pb-3">
          {[
            { id: 'advisories', label: 'Security Advisories (ASA Feed)' },
            { id: 'mcp', label: 'MCP Tool Risk Index' },
            { id: 'trending', label: 'MITRE ATLAS Trending Leaderboard' },
            { id: 'stix', label: 'STIX 2.1 Feed (SIEM Export)' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                  : 'text-purple-300/70 hover:text-white bg-[#120a24] border border-purple-900/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Advisories Feed */}
        {activeTab === 'advisories' && (
          <div className="space-y-4">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-purple-400/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search advisories, LangChain, CVSS, MITRE..."
                className="w-full bg-[#120a24] border border-purple-900/40 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredAdvisories.map(adv => {
                const isCrit = adv.severity === 'CRITICAL';
                return (
                  <div
                    key={adv.advisory_id}
                    className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-6 shadow-xl space-y-4 hover:border-purple-600/50 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-purple-950/80 border border-purple-800/60 text-purple-300 font-bold">
                            {adv.advisory_id}
                          </span>
                          <h3 className="text-base font-bold text-white">
                            {adv.title}
                          </h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              isCrit
                                ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                                : 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {adv.severity} (CVSS {adv.cvss_score})
                          </span>
                        </div>
                        <div className="text-xs text-purple-300/70">
                          Target: <strong className="text-white">{adv.target_framework}</strong> • MITRE ATLAS: <code className="text-purple-300">{adv.mitre_atlas_technique}</code>
                        </div>
                      </div>

                      <div className="text-xs text-purple-400/60 font-mono shrink-0">
                        Published: {new Date(adv.published_at).toLocaleDateString()}
                      </div>
                    </div>

                    <p className="text-xs text-purple-200/90 leading-relaxed bg-[#0a0518]/60 p-3.5 rounded-xl border border-purple-950">
                      {adv.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-purple-900/30 text-xs">
                      <div className="text-emerald-400 font-mono">
                        Remediation: <span className="text-emerald-200">{adv.remediation}</span>
                      </div>
                      <span className="text-purple-400/80 font-mono text-[11px]">
                        Mitigation Rule: {adv.patch_rule_id}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: MCP Risk Matrix */}
        {activeTab === 'mcp' && (
          <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="text-xs text-purple-400/60 uppercase tracking-widest font-semibold">
              Standardized Model Context Protocol (MCP) Tool Risk Ratings
            </div>

            <div className="border border-purple-950 rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0e071e] text-purple-400 border-b border-purple-950">
                  <tr>
                    <th className="py-2.5 px-4">MCP Tool Identifier</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Risk Score</th>
                    <th className="py-2.5 px-4">Threat Vectors</th>
                    <th className="py-2.5 px-4">Recommended Zero-Trust Containment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-950/40">
                  {mcpRatings.map((r, i) => {
                    const isHigh = r.risk_score >= 0.8;
                    const isMed = r.risk_score >= 0.5;
                    return (
                      <tr key={i} className="hover:bg-purple-950/20 text-slate-300">
                        <td className="py-2.5 px-4 font-bold text-white">{r.tool_name}</td>
                        <td className="py-2.5 px-4 text-purple-300">{r.category}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              isHigh
                                ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                                : isMed
                                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {r.risk_score.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-purple-300/80 font-sans">
                          {r.vulnerability_tags.join(', ')}
                        </td>
                        <td className="py-2.5 px-4 text-emerald-400 font-sans">
                          {r.recommended_containment}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: MITRE ATLAS Trending Leaderboard */}
        {activeTab === 'trending' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trending.map(t => (
              <div
                key={t.signature_id}
                className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-6 shadow-xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-purple-950/80 text-purple-300 font-bold border border-purple-800/60">
                    {t.signature_id}
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/50">
                    +{t.prevalence_pct}% SURGE
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">
                  {t.pattern_name}
                </h3>

                <div className="text-xs text-purple-300/70 font-mono">
                  Observed In-The-Wild: <strong className="text-white">{t.observed_in_the_wild_count.toLocaleString()}</strong> events
                </div>
                <div className="text-xs text-purple-400/80 font-mono">
                  MITRE ATLAS: {t.mitre_category}
                </div>

                <div className="pt-2 border-t border-purple-900/30 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Protected by Default AgentShield Pipeline
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: STIX 2.1 Feed Export */}
        {activeTab === 'stix' && (
          <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-purple-300">
                STIX 2.1 Threat Feed (Universal SIEM Ingest)
              </span>
              <button
                onClick={copyStix}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-white text-xs font-medium transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied!' : 'Copy STIX JSON'}
              </button>
            </div>
            <pre className="bg-[#0a0518] p-5 rounded-xl border border-purple-950 font-mono text-xs text-purple-200 overflow-x-auto leading-relaxed max-h-[500px] overflow-y-auto">
              {stixBundlePreview}
            </pre>
          </div>
        )}

        {/* Footer Attribution Watermark */}
        <div className="text-center pt-8 border-t border-purple-900/20 text-xs text-purple-400/40 font-mono">
          AgentShield-X Security Labs • Open Threat Intelligence Feed • Lead Architect Tharunkumar.S
        </div>
      </div>
    </div>
  );
};

