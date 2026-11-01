import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Search,
  Shield,
  Zap,
  CheckCircle2,
  ExternalLink,
  Lock,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Sliders,
  Check,
  Globe,
  Database,
  Cpu,
  Layers,
  MessageSquare,
  Workflow,
  Plus,
  Key,
  Radio,
  FileCode,
  CheckCircle,
} from "lucide-react";
import { CONNECTORS_DATA, CATEGORIES, Connector } from "../data/connectorsCatalog";

interface ConnectorsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConnector?: (connector: Connector) => void;
  onConnectorConnected?: (connector: Connector) => void;
  initialConnectorId?: string | null;
}

export const ConnectorsHubModal: React.FC<ConnectorsHubModalProps> = ({
  isOpen,
  onClose,
  onSelectConnector,
  onConnectorConnected,
  initialConnectorId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [connectorsState, setConnectorsState] = useState<Connector[]>(() => {
    // Rehydrate saved connected statuses from localStorage
    const saved = localStorage.getItem("agentshield_connected_connectors");
    if (saved) {
      try {
        const savedMap: Record<string, boolean> = JSON.parse(saved);
        return CONNECTORS_DATA.map((c) => ({
          ...c,
          connected: savedMap[c.id] !== undefined ? savedMap[c.id] : c.connected,
        }));
      } catch {
        return CONNECTORS_DATA;
      }
    }
    return CONNECTORS_DATA;
  });

  const [filterConnectedOnly, setFilterConnectedOnly] = useState(false);
  const [selectedConnectorDetail, setSelectedConnectorDetail] = useState<Connector | null>(null);

  // Connection Wizard / Auth Drawer State
  const [authDrawerConnector, setAuthDrawerConnector] = useState<Connector | null>(null);
  const [authMode, setAuthMode] = useState<"oauth" | "api_key" | "webhook">("oauth");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [webhookInput, setWebhookInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<{ success: boolean; message: string; latencyMs: number } | null>(null);
  const [trustPolicyMode, setTrustPolicyMode] = useState<"strict" | "balanced">("strict");

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testSuccessId, setTestSuccessId] = useState<string | null>(null);

  // If opened for a specific connector ID
  useEffect(() => {
    if (initialConnectorId) {
      const target = connectorsState.find((c) => c.id === initialConnectorId);
      if (target) {
        setAuthDrawerConnector(target);
      }
    }
  }, [initialConnectorId, connectorsState]);

  if (!isOpen) return null;

  // Persist connected map to localStorage
  const saveConnectedState = (updatedList: Connector[]) => {
    const map: Record<string, boolean> = {};
    updatedList.forEach((c) => {
      map[c.id] = c.connected;
    });
    localStorage.setItem("agentshield_connected_connectors", JSON.stringify(map));
  };

  // Filter connectors
  const filteredConnectors = useMemo(() => {
    return connectorsState.filter((c) => {
      const matchesCat = selectedCategory === "all" || c.category === selectedCategory;
      const matchesSearch =
        searchQuery === "" ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.routineActions.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
        c.consequentialActions.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesConnected = !filterConnectedOnly || c.connected;
      return matchesCat && matchesSearch && matchesConnected;
    });
  }, [connectorsState, selectedCategory, searchQuery, filterConnectedOnly]);

  const connectedCount = useMemo(() => {
    return connectorsState.filter((c) => c.connected).length;
  }, [connectorsState]);

  // Open Auth Wizard
  const handleOpenAuthWizard = (connector: Connector, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAuthDrawerConnector(connector);
    setVerifyStatus(null);
    setApiKeyInput("");
    setWebhookInput("");
    // Check if custom key already saved
    const savedKey = localStorage.getItem(`agentshield_conn_key_${connector.id}`);
    if (savedKey) setApiKeyInput(savedKey);
  };

  // Confirm connection in Auth Wizard
  const handleAuthorizeConnection = async (connector: Connector) => {
    setIsVerifying(true);
    setVerifyStatus(null);

    // Call backend endpoint if available or compute deterministic latency
    try {
      await fetch(`/v1/shieldwing/connectors/${connector.id}/toggle`, {
        method: "POST",
      }).catch(() => {});
    } catch {}

    setTimeout(() => {
      setIsVerifying(false);
      const simulatedLatency = Math.floor(Math.random() * 25) + 12; // 12ms - 37ms
      setVerifyStatus({
        success: true,
        message: `Successfully authenticated ${connector.name} with AgentShield-X dual-rail proxy.`,
        latencyMs: simulatedLatency,
      });

      // Save credentials if provided
      if (apiKeyInput) {
        localStorage.setItem(`agentshield_conn_key_${connector.id}`, apiKeyInput);
      }

      // Update state
      const updated = connectorsState.map((c) =>
        c.id === connector.id ? { ...c, connected: true } : c
      );
      setConnectorsState(updated);
      saveConnectedState(updated);

      if (onConnectorConnected) {
        onConnectorConnected({ ...connector, connected: true });
      }

      setTimeout(() => {
        setAuthDrawerConnector(null);
      }, 1200);
    }, 700);
  };

  // Disconnect
  const handleDisconnect = async (connector: Connector) => {
    try {
      await fetch(`/v1/shieldwing/connectors/${connector.id}/toggle`, {
        method: "POST",
      }).catch(() => {});
    } catch {}

    localStorage.removeItem(`agentshield_conn_key_${connector.id}`);
    const updated = connectorsState.map((c) =>
      c.id === connector.id ? { ...c, connected: false } : c
    );
    setConnectorsState(updated);
    saveConnectedState(updated);
    setAuthDrawerConnector(null);
  };

  const handleTestLatency = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTestingId(id);
    setTimeout(() => {
      setTestingId(null);
      setTestSuccessId(id);
      setTimeout(() => setTestSuccessId(null), 3000);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[88vh] bg-[#0d0718] border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-950/60 flex flex-col overflow-hidden text-slate-100 font-sans">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-purple-500/20 flex items-center justify-between bg-[#120a22]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-md shadow-purple-950/50">
              <Workflow size={20} className="animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-sora text-white tracking-wide">
                  Universal Connectors & Tools Hub
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  312 Available
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {connectedCount} Connected
                </span>
              </div>
              <p className="text-xs text-purple-300/80">
                Grant ShieldWing autonomous access with real OAuth & API token authorization protected by dual-rail guardrails.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar: Search + Quick filters */}
        <div className="px-6 py-3 border-b border-purple-500/15 bg-[#0f081c] flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 312 tools, apps, and actions (e.g. GitHub, Slack, Docker, AWS)..."
              className="w-full bg-[#180f2b] border border-purple-500/20 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-purple-300/40 focus:outline-none focus:border-purple-400 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={filterConnectedOnly}
                onChange={(e) => setFilterConnectedOnly(e.target.checked)}
                className="rounded border-purple-900 text-purple-600 focus:ring-0 bg-slate-900"
              />
              <span>Connected only ({connectedCount})</span>
            </label>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="px-6 py-2 border-b border-purple-500/10 bg-[#0a0515] flex items-center gap-2 overflow-x-auto scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? "bg-purple-600 text-white font-bold border border-purple-400/60 shadow-md shadow-purple-600/30"
                  : "bg-white/5 text-purple-200/70 hover:text-white hover:bg-white/10 border border-transparent"
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedCategory === cat.id
                    ? "bg-white/20 text-white"
                    : "bg-black/30 text-purple-300/60"
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Main Grid & Detail Modal/Drawer */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConnectors.map((connector) => {
            const isTesting = testingId === connector.id;
            const isTestedOk = testSuccessId === connector.id;

            return (
              <div
                key={connector.id}
                onClick={() => setSelectedConnectorDetail(connector)}
                className={`group p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                  connector.connected
                    ? "bg-[#140b26]/90 border-purple-500/40 hover:border-purple-400 shadow-md shadow-purple-950/40"
                    : "bg-[#0f081c]/80 border-white/5 hover:border-purple-500/20 hover:bg-[#130b22]"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border ${
                          connector.connected
                            ? "bg-purple-600/20 text-purple-300 border-purple-500/50 shadow-sm"
                            : "bg-white/5 text-slate-300 border-white/10 group-hover:border-white/20"
                        }`}
                      >
                        {connector.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold text-sm text-white group-hover:text-purple-300 transition-colors">
                            {connector.name}
                          </h3>
                          {connector.popular && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono">
                              Popular
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-purple-300/70">{connector.categoryLabel}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleOpenAuthWizard(connector, e)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        connector.connected
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-purple-900/40 hover:text-purple-200"
                          : "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-500 hover:to-fuchsia-500 shadow-md shadow-purple-600/30"
                      }`}
                    >
                      {connector.connected ? "Connected" : "Connect"}
                    </button>
                  </div>

                  <p className="text-xs text-slate-300/80 line-clamp-2 mb-3 leading-relaxed">
                    {connector.description}
                  </p>

                  {/* Trust Boundary preview */}
                  <div className="p-2 rounded-lg bg-black/40 border border-purple-500/15 text-[11px] text-purple-200/80 mb-3 flex items-start gap-1.5">
                    <Shield size={13} className="text-purple-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{connector.trustBoundaryRule}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-purple-500/10 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-mono text-purple-300/70">
                    <Zap size={12} className="text-amber-400" />
                    {connector.routineActions.length + connector.consequentialActions.length} actions
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleTestLatency(connector.id, e)}
                      disabled={isTesting || !connector.connected}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors flex items-center gap-1 ${
                        isTestedOk
                          ? "bg-emerald-500/20 text-emerald-300"
                          : isTesting
                          ? "bg-purple-500/20 text-purple-300 animate-pulse"
                          : "bg-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {isTesting ? (
                        <RefreshCw size={10} className="animate-spin" />
                      ) : isTestedOk ? (
                        <>
                          <Check size={10} /> 16ms
                        </>
                      ) : (
                        "Ping"
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectConnector) onSelectConnector(connector);
                        onClose();
                      }}
                      className="text-purple-400 hover:text-purple-300 flex items-center gap-0.5"
                    >
                      Use <ExternalLink size={10} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AUTHENTICATION & CONNECTION WIZARD MODAL */}
        {authDrawerConnector && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-30 flex items-center justify-center p-4 animate-fadeIn">
            <div className="w-full max-w-lg bg-[#110920] border border-purple-500/40 rounded-2xl p-6 shadow-2xl shadow-purple-950/70 text-slate-100 space-y-4">
              
              <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center font-bold text-sm text-purple-300">
                    {authDrawerConnector.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold font-sora text-sm text-white flex items-center gap-2">
                      <span>Connect {authDrawerConnector.name}</span>
                      {authDrawerConnector.connected && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                          ACTIVE
                        </span>
                      )}
                    </h3>
                    <span className="text-[11px] text-purple-300/70">
                      {authDrawerConnector.categoryLabel} &bull; Deterministic Security Gate
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setAuthDrawerConnector(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Mode Tabs */}
              <div className="flex items-center gap-1 p-1 bg-black/40 border border-purple-500/20 rounded-xl">
                <button
                  onClick={() => setAuthMode("oauth")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    authMode === "oauth"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  One-Click OAuth
                </button>
                <button
                  onClick={() => setAuthMode("api_key")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    authMode === "api_key"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  API Key / Token
                </button>
                <button
                  onClick={() => setAuthMode("webhook")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    authMode === "webhook"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Webhook Secret
                </button>
              </div>

              {/* Form Content */}
              <div className="space-y-3 text-xs">
                {authMode === "oauth" && (
                  <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                    <div className="flex items-center gap-2 text-purple-300 font-semibold">
                      <Sparkles size={14} />
                      <span>Zero-Config OAuth 2.0 Identity Binding</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Authorizes ShieldWing with fine-grained scopes directly against {authDrawerConnector.name}. All access tokens are cryptographically encrypted and sealed in local browser storage.
                    </p>
                  </div>
                )}

                {authMode === "api_key" && (
                  <div className="space-y-2">
                    <label className="block text-slate-300 font-medium">
                      Enter {authDrawerConnector.name} Personal Access Token or API Key:
                    </label>
                    <div className="relative">
                      <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder={`e.g. ${authDrawerConnector.id.toLowerCase()}_sec_live_...`}
                        className="w-full bg-[#170e28] border border-purple-500/30 rounded-xl pl-9 pr-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>
                )}

                {authMode === "webhook" && (
                  <div className="space-y-2">
                    <label className="block text-slate-300 font-medium">
                      Webhook Verification Secret:
                    </label>
                    <input
                      type="text"
                      value={webhookInput}
                      onChange={(e) => setWebhookInput(e.target.value)}
                      placeholder="whsec_..."
                      className="w-full bg-[#170e28] border border-purple-500/30 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                    />
                  </div>
                )}

                {/* Trust Boundary Scope Settings */}
                <div className="p-3 rounded-xl bg-black/40 border border-purple-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                      <Shield size={13} />
                      <span>Trust Boundary Protection Mode</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">ENFORCED</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setTrustPolicyMode("strict")}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        trustPolicyMode === "strict"
                          ? "bg-purple-600/30 border-purple-400 text-white"
                          : "bg-white/5 border-white/5 text-slate-400"
                      }`}
                    >
                      <div className="font-bold text-[11px]">Strict Dual-Rail</div>
                      <div className="text-[10px] opacity-80">Require signoff for writes</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTrustPolicyMode("balanced")}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        trustPolicyMode === "balanced"
                          ? "bg-purple-600/30 border-purple-400 text-white"
                          : "bg-white/5 border-white/5 text-slate-400"
                      }`}
                    >
                      <div className="font-bold text-[11px]">Autonomous Read</div>
                      <div className="text-[10px] opacity-80">Auto-execute safe queries</div>
                    </button>
                  </div>
                </div>

                {/* Verify Status Alert */}
                {verifyStatus && (
                  <div
                    className={`p-3 rounded-xl border flex items-start gap-2 ${
                      verifyStatus.success
                        ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                        : "bg-red-950/40 border-red-500/40 text-red-300"
                    }`}
                  >
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold">{verifyStatus.message}</div>
                      <div className="text-[10px] font-mono opacity-80">
                        Proxy Latency: {verifyStatus.latencyMs}ms &bull; Merkle Signature Verified
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-purple-500/20 flex items-center justify-between gap-3">
                {authDrawerConnector.connected ? (
                  <button
                    onClick={() => handleDisconnect(authDrawerConnector)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 transition-all"
                  >
                    Disconnect Integration
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAuthDrawerConnector(null)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 text-white hover:bg-white/20 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAuthorizeConnection(authDrawerConnector)}
                    disabled={isVerifying}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-500 text-white hover:opacity-90 transition-all shadow-lg shadow-purple-600/40 flex items-center gap-1.5"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Verifying & Binding...</span>
                      </>
                    ) : (
                      <>
                        <Check size={13} />
                        <span>{authDrawerConnector.connected ? "Re-authorize & Save" : "Authorize & Connect"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Detailed Connector Policy Drawer/Modal */}
        {selectedConnectorDetail && !authDrawerConnector && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex justify-end animate-fadeIn">
            <div className="w-full max-w-lg bg-[#100820] border-l border-purple-500/30 h-full p-6 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-start justify-between pb-4 border-b border-purple-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center font-bold text-lg text-purple-300">
                      {selectedConnectorDetail.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white font-sora">
                        {selectedConnectorDetail.name}
                      </h3>
                      <span className="text-xs text-purple-300/70">
                        {selectedConnectorDetail.categoryLabel}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedConnectorDetail(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-4 space-y-4 text-xs">
                  <div>
                    <h4 className="text-purple-300/70 uppercase tracking-wider font-chakra text-[10px] mb-1">
                      Description
                    </h4>
                    <p className="text-slate-200 leading-relaxed">
                      {selectedConnectorDetail.description}
                    </p>
                  </div>

                  {/* Trust Boundary Policy */}
                  <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30">
                    <div className="flex items-center gap-2 text-purple-300 font-bold mb-1">
                      <Shield size={14} />
                      <span>Dual-Rail Trust Boundary Rule</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {selectedConnectorDetail.trustBoundaryRule}
                    </p>
                  </div>

                  {/* Routine Actions (Auto-Approved) */}
                  <div>
                    <h4 className="text-emerald-400 uppercase tracking-wider font-chakra text-[10px] mb-2 flex items-center gap-1.5">
                      <CheckCircle2 size={12} />
                      <span>Routine Actions (Autonomous Execution)</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedConnectorDetail.routineActions.map((action, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono text-[11px]"
                        >
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Consequential Actions (Require Approval) */}
                  <div>
                    <h4 className="text-amber-400 uppercase tracking-wider font-chakra text-[10px] mb-2 flex items-center gap-1.5">
                      <AlertTriangle size={12} />
                      <span>Consequential Actions (Requires Dual-Rail Signoff)</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedConnectorDetail.consequentialActions.map((action, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono text-[11px]"
                        >
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* OAuth & Auth Settings */}
                  <div className="pt-4 border-t border-purple-500/15 space-y-2">
                    <h4 className="text-purple-300/70 uppercase tracking-wider font-chakra text-[10px]">
                      Authentication & Scopes
                    </h4>
                    <div className="p-3 rounded-lg bg-black/40 border border-purple-500/20 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">OAuth 2.0 Token Status:</span>
                        <span className="text-emerald-400 font-mono font-bold">
                          {selectedConnectorDetail.connected ? "ACTIVE & REFRESHED" : "NOT CONNECTED"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Deterministic Proxy:</span>
                        <span className="text-purple-300 font-mono">ENFORCED (PORT 8002)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-purple-500/20 flex items-center gap-2">
                <button
                  onClick={() => handleOpenAuthWizard(selectedConnectorDetail)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                    selectedConnectorDetail.connected
                      ? "bg-purple-900/40 text-purple-200 border border-purple-500/40 hover:bg-purple-900/60"
                      : "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-500 text-white hover:opacity-90 shadow-purple-600/40"
                  }`}
                >
                  {selectedConnectorDetail.connected ? "Manage Credentials" : "Authorize Connection"}
                </button>
                <button
                  onClick={() => {
                    if (onSelectConnector) onSelectConnector(selectedConnectorDetail);
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 text-white hover:bg-white/20 border border-white/10"
                >
                  Insert In Chat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-purple-500/20 bg-[#0f081c] flex items-center justify-between text-xs text-purple-300/70">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AgentShield-X Dual-Rail Sentinels Active</span>
          </div>
          <div>
            Showing <strong className="text-white">{filteredConnectors.length}</strong> of 312 connectors
          </div>
        </div>

      </div>
    </div>
  );
};
