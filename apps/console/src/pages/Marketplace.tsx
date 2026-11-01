import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Download, 
  CheckCircle2, 
  Star, 
  ShieldCheck, 
  Layers, 
  Plus, 
  Tag, 
  ArrowUpRight, 
  Sparkles, 
  RefreshCw,
  Box,
  Sliders,
  ExternalLink
} from 'lucide-react';

interface MarketplacePackage {
  package_id: string;
  name: string;
  description: string;
  item_type: string;
  tier: string;
  version: string;
  author: string;
  stars: number;
  downloads_count: number;
  verified_by_labs: boolean;
  rules_included_count: number;
  compatibility: string;
  tags: string[];
  installed: boolean;
}

export const Marketplace: React.FC = () => {
  const [packages, setPackages] = useState<MarketplacePackage[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);

  // Publish form
  const [pubName, setPubName] = useState<string>('');
  const [pubDesc, setPubDesc] = useState<string>('');
  const [pubType, setPubType] = useState<string>('RULE_PACK');
  const [pubTags, setPubTags] = useState<string>('community, defense');

  const fetchMarketplace = async () => {
    try {
      const [pkgsRes, statsRes] = await Promise.all([
        fetch('/v1/marketplace/packages'),
        fetch('/v1/marketplace/stats'),
      ]);

      if (pkgsRes.ok && statsRes.ok) {
        const pData = await pkgsRes.json();
        const sData = await statsRes.json();
        setPackages(pData.packages || []);
        setStats(sData);
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
    const list: MarketplacePackage[] = [
      {
        package_id: 'pkg-owasp-top-10-llm',
        name: 'OWASP GenAI Top 10 Defense Pack',
        description: 'Comprehensive detection bundle covering prompt injection, insecure output handling, model theft, and SSRF.',
        item_type: 'RULE_PACK',
        tier: 'VERIFIED_OFFICIAL',
        version: '2.3.0',
        author: 'AgentShield Labs (Tharunkumar.S)',
        stars: 1420,
        downloads_count: 34200,
        verified_by_labs: true,
        rules_included_count: 18,
        compatibility: 'AgentShield-X >= 1.0.0',
        tags: ['owasp', 'genai', 'prompt-injection', 'ssrf'],
        installed: true,
      },
      {
        package_id: 'pkg-pci-dss-fintech-shield',
        name: 'PCI-DSS v4.0 Fintech Compliance Pack',
        description: 'Enforces strict zero-trust cardholder data tokenization, CVV redaction, and audited refund authorizations.',
        item_type: 'COMPLIANCE_TEMPLATE',
        tier: 'VERIFIED_OFFICIAL',
        version: '1.2.0',
        author: 'FinSec Alliance',
        stars: 890,
        downloads_count: 18900,
        verified_by_labs: true,
        rules_included_count: 14,
        compatibility: 'AgentShield-X >= 1.0.0',
        tags: ['pci-dss', 'fintech', 'credit-card', 'compliance'],
        installed: false,
      },
      {
        package_id: 'pkg-mcp-github-slack-guard',
        name: 'GitHub & Slack MCP Rug-Pull Guard',
        description: 'Locks down MCP tools for GitHub and Slack to prevent unauthorized repo deletion and channel exfiltration.',
        item_type: 'DETECTOR_PLUGIN',
        tier: 'VERIFIED_OFFICIAL',
        version: '1.5.1',
        author: 'AgentShield Labs',
        stars: 740,
        downloads_count: 15200,
        verified_by_labs: true,
        rules_included_count: 8,
        compatibility: 'AgentShield-X >= 1.0.0',
        tags: ['mcp', 'github', 'slack', 'rug-pull'],
        installed: true,
      },
      {
        package_id: 'pkg-healthcare-hipaa-pack',
        name: 'HIPAA Healthcare PHI Guard',
        description: 'Detects and masks Protected Health Information (PHI), medical record numbers, and clinical diagnostic summaries.',
        item_type: 'RULE_PACK',
        tier: 'COMMUNITY_FREE',
        version: '1.1.0',
        author: 'HealthSec Open Source',
        stars: 520,
        downloads_count: 9800,
        verified_by_labs: true,
        rules_included_count: 12,
        compatibility: 'AgentShield-X >= 1.0.0',
        tags: ['hipaa', 'healthcare', 'phi', 'privacy'],
        installed: false,
      },
      {
        package_id: 'pkg-redteam-adversarial-20',
        name: '20 Extreme Adversarial War Game Scenarios',
        description: 'Sim Lab expansion pack containing nation-state APT personas, multi-turn recursive jailbreaks, and indirect RAG payloads.',
        item_type: 'SIM_LAB_SCENARIO',
        tier: 'ENTERPRISE_PRO',
        version: '3.0.0',
        author: 'AgentShield Offensive Labs',
        stars: 1850,
        downloads_count: 42100,
        verified_by_labs: true,
        rules_included_count: 20,
        compatibility: 'AgentShield-X >= 1.0.0',
        tags: ['red-team', 'sim-lab', 'apt', 'adversarial'],
        installed: false,
      },
      {
        package_id: 'pkg-crypto-web3-anti-drainer',
        name: 'Web3 Anti-Drainer & Private Key Guard',
        description: 'Detects wallet address substitutions, malicious ERC-20 permit authorizations, and seed phrase leakage.',
        item_type: 'RULE_PACK',
        tier: 'COMMUNITY_FREE',
        version: '2.0.1',
        author: 'ZeroKnowledgeDefenders',
        stars: 610,
        downloads_count: 11400,
        verified_by_labs: false,
        rules_included_count: 10,
        compatibility: 'AgentShield-X >= 1.0.0',
        tags: ['crypto', 'web3', 'seed-phrase', 'ethereum'],
        installed: false,
      },
    ];
    setPackages(list);
    setStats({
      total_packages_available: 6,
      installed_packages_count: 2,
      total_community_downloads: 131600,
      verified_publishers_count: 8,
    });
  };

  useEffect(() => {
    fetchMarketplace();
  }, []);

  const handleInstallToggle = async (pkg: MarketplacePackage) => {
    setActionLoading(pkg.package_id);
    const endpoint = pkg.installed ? 'uninstall' : 'install';
    try {
      await fetch(`/v1/marketplace/${endpoint}/${pkg.package_id}`, { method: 'POST' });
    } catch {}

    setPackages(prev =>
      prev.map(p =>
        p.package_id === pkg.package_id
          ? {
              ...p,
              installed: !p.installed,
              downloads_count: !p.installed ? p.downloads_count + 1 : p.downloads_count,
            }
          : p
      )
    );
    setActionLoading(null);
  };

  const handlePublish = async () => {
    if (!pubName) return;
    const pkgId = `pkg-${pubName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const newPkg: MarketplacePackage = {
      package_id: pkgId,
      name: pubName,
      description: pubDesc,
      item_type: pubType,
      tier: 'COMMUNITY_FREE',
      version: '1.0.0',
      author: 'Community Developer',
      stars: 1,
      downloads_count: 1,
      verified_by_labs: false,
      rules_included_count: 4,
      compatibility: 'AgentShield-X >= 1.0.0',
      tags: pubTags.split(',').map(t => t.trim()),
      installed: true,
    };

    try {
      await fetch('/v1/marketplace/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPkg),
      });
    } catch {}

    setPackages(prev => [newPkg, ...prev]);
    setShowPublishModal(false);
    setPubName('');
    setPubDesc('');
  };

  const filtered = packages.filter(p => {
    if (filterType === 'INSTALLED' && !p.installed) return false;
    if (filterType !== 'ALL' && filterType !== 'INSTALLED' && p.item_type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchTag = p.tags.some(t => t.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchTag) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0518] text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-purple-900/30 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400">
                <ShoppingBag className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                  AgentShield Marketplace
                </h1>
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase tracking-wider">
                  SEEDED DEMO CATALOG
                </span>
              </div>
            </div>
            <p className="text-sm text-purple-300/70 mt-1">
              Community registry for zero-trust policy packs, custom detectors, and adversarial war game scenarios
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPublishModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-medium shadow-lg shadow-purple-950/40 transition-all border border-purple-500/30 text-sm"
            >
              <Plus className="w-4 h-4" />
              Publish Package
            </button>
            <button
              onClick={fetchMarketplace}
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
              <span>Available Packages</span>
              <Box className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-extrabold text-white mt-2 font-mono">
              {stats?.total_packages_available || packages.length} Packs
            </div>
            <div className="text-xs text-purple-400/80 mt-1">Verified & Community</div>
          </div>

          <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-emerald-300/70 text-xs font-semibold uppercase tracking-wider">
              <span>Active Installed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">
              {packages.filter(p => p.installed).length} Installed
            </div>
            <div className="text-xs text-emerald-400/80 mt-1">Running in Local Fleet</div>
          </div>

          <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-violet-300/70 text-xs font-semibold uppercase tracking-wider">
              <span>Community Downloads</span>
              <Download className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-3xl font-extrabold text-violet-300 mt-2 font-mono">
              {stats?.total_community_downloads?.toLocaleString() || '131,600+'}
            </div>
            <div className="text-xs text-violet-400/80 mt-1">Global Deployments</div>
          </div>

          <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-amber-300/70 text-xs font-semibold uppercase tracking-wider">
              <span>Audited Publishers</span>
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-amber-300 mt-2 font-mono">
              8 Partners
            </div>
            <div className="text-xs text-amber-400/80 mt-1">Zero-Trust Certified</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {[
              { id: 'ALL', label: 'All Items' },
              { id: 'RULE_PACK', label: 'Rule Packs' },
              { id: 'DETECTOR_PLUGIN', label: 'Detectors' },
              { id: 'SIM_LAB_SCENARIO', label: 'Sim Lab' },
              { id: 'COMPLIANCE_TEMPLATE', label: 'Compliance' },
              { id: 'INSTALLED', label: 'Installed' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filterType === tab.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-[#120a24] text-purple-300/70 hover:text-white border border-purple-900/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-purple-400/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search packs, tags, OWASP..."
              className="w-full bg-[#120a24] border border-purple-900/40 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Package Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(pkg => {
            const isInstalled = pkg.installed;
            return (
              <div
                key={pkg.package_id}
                className={`bg-[#120a24]/80 backdrop-blur-md border rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-purple-600/50 transition-all ${
                  isInstalled ? 'border-emerald-900/50 bg-emerald-950/10' : 'border-purple-900/40'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800/60 text-purple-300">
                      {pkg.item_type}
                    </span>

                    <div className="flex items-center gap-1 text-amber-400 text-xs font-mono">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{pkg.stars}</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-white tracking-wide">
                        {pkg.name}
                      </h3>
                      {pkg.verified_by_labs && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          VERIFIED
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-purple-400/70 mt-1">
                      by <span className="text-purple-300">{pkg.author}</span> • v{pkg.version}
                    </div>
                    <p className="text-xs text-purple-200/80 mt-2 leading-relaxed">
                      {pkg.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {pkg.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-[#0a0518] border border-purple-950 text-purple-400 font-mono"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Card Footer */}
                <div className="pt-5 border-t border-purple-900/30 mt-4 flex items-center justify-between text-xs">
                  <div className="text-purple-400/60 font-mono">
                    {pkg.rules_included_count} Rules • {pkg.downloads_count.toLocaleString()} installs
                  </div>

                  <button
                    onClick={() => handleInstallToggle(pkg)}
                    disabled={actionLoading === pkg.package_id}
                    className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all ${
                      isInstalled
                        ? 'bg-emerald-950/60 hover:bg-rose-950/60 text-emerald-300 hover:text-rose-300 border border-emerald-800/40 hover:border-rose-800/40'
                        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/50'
                    }`}
                  >
                    {isInstalled ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Installed
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        Install Pack
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal: Publish Community Package */}
        {showPublishModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#120a24] border border-purple-800/60 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-400" />
                  Publish to Community Marketplace
                </h3>
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="text-purple-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-purple-300 block mb-1 font-semibold">Package Name</label>
                  <input
                    type="text"
                    value={pubName}
                    onChange={e => setPubName(e.target.value)}
                    placeholder="e.g. Supabase DB Shield"
                    className="w-full bg-[#0a0518] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-purple-300 block mb-1 font-semibold">Description</label>
                  <textarea
                    value={pubDesc}
                    onChange={e => setPubDesc(e.target.value)}
                    rows={3}
                    placeholder="Describe the threats and rules contained in this pack..."
                    className="w-full bg-[#0a0518] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-purple-300 block mb-1 font-semibold">Package Type</label>
                  <select
                    value={pubType}
                    onChange={e => setPubType(e.target.value)}
                    className="w-full bg-[#0a0518] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="RULE_PACK">Rule Pack</option>
                    <option value="DETECTOR_PLUGIN">Detector Plugin</option>
                    <option value="SIM_LAB_SCENARIO">Sim Lab Scenario</option>
                    <option value="COMPLIANCE_TEMPLATE">Compliance Template</option>
                  </select>
                </div>

                <div>
                  <label className="text-purple-300 block mb-1 font-semibold">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={pubTags}
                    onChange={e => setPubTags(e.target.value)}
                    placeholder="supabase, postgres, dlp"
                    className="w-full bg-[#0a0518] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-900/40">
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-purple-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublish}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-900/50"
                >
                  Publish Package
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Attribution Watermark */}
        <div className="text-center pt-8 border-t border-purple-900/20 text-xs text-purple-400/40 font-mono">
          AgentShield-X Security Labs • Community Marketplace & Package Hub • Lead Architect Tharunkumar.S
        </div>
      </div>
    </div>
  );
};

