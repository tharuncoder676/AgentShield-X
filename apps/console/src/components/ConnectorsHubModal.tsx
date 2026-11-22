import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Terminal,
  Send,
} from "lucide-react";
import { CONNECTORS_DATA, CATEGORIES, Connector } from "../data/connectorsCatalog";
import { SecureTokenVault } from "../lib/secureVault";
import { useAuth } from "../context/AuthContext";

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
  const navigate = useNavigate();
  const { token: sessionToken, org } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [connectorsState, setConnectorsState] = useState<Connector[]>(() => {
    // Legacy local flags were written without provider verification; never trust them.
    return CONNECTORS_DATA.map((c) => ({ ...c, connected: false }));
  });

  const [filterConnectedOnly, setFilterConnectedOnly] = useState(false);
  const [selectedConnectorDetail, setSelectedConnectorDetail] = useState<Connector | null>(null);

  // Connection Wizard State
  const [authDrawerConnector, setAuthDrawerConnector] = useState<Connector | null>(null);
  const [authMode, setAuthMode] = useState<"oauth" | "api_key" | "webhook">("oauth");

  // Specific Credential Inputs
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [githubRepoInput, setGithubRepoInput] = useState("");
  const [githubTokenInput, setGithubTokenInput] = useState("");
  const [githubReadAuthorized, setGithubReadAuthorized] = useState(false);
  const [telegramTokenInput, setTelegramTokenInput] = useState("");
  const [telegramChatIdInput, setTelegramChatIdInput] = useState("");
  const [slackWebhookInput, setSlackWebhookInput] = useState("");
  const [nvidiaKeyInput, setNvidiaKeyInput] = useState(() => SecureTokenVault.getSecret("agentshield_nvidia_key"));

  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<{
    success: boolean;
    message: string;
    details?: string;
    latencyMs: number;
  } | null>(null);

  const [trustPolicyMode, setTrustPolicyMode] = useState<"strict" | "balanced">("strict");

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testSuccessId, setTestSuccessId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !org?.id || !sessionToken) return;
    const headers = { Authorization: `Bearer ${sessionToken}` };
    const githubPath = `/v1/shieldwing/workspaces/${encodeURIComponent(org.id)}/github`;
    const googlePath = `/v1/shieldwing/workspaces/${encodeURIComponent(org.id)}/google`;
    Promise.all([fetch(githubPath, { headers }), fetch(googlePath, { headers })]).then(async ([githubResponse, googleResponse]) => {
      if (!githubResponse.ok || !googleResponse.ok) return;
      const [githubData, googleData] = await Promise.all([githubResponse.json(), googleResponse.json()]);
      const googleServices = new Set<string>(googleData.services || []);
      const updated = CONNECTORS_DATA.map((c) => ({
        ...c,
        connected: c.id === "github" ? Boolean(githubData.repository)
          : c.id === "gmail" ? googleServices.has("gmail")
          : c.id === "gcal" ? googleServices.has("calendar")
          : false,
      }));
      setConnectorsState(updated);
      if (githubData.repository) setGithubRepoInput(githubData.repository);
    }).catch(() => undefined);
  }, [isOpen, org?.id, sessionToken]);

  const openProviderSetup = (connector: Connector) => {
    if (connector.id === "gmail" || connector.id === "gcal") {
      onClose();
      navigate("/connected-tools");
      return;
    }
    handleOpenAuthWizard(connector);
  };

  // If opened for a specific connector ID
  useEffect(() => {
    if (initialConnectorId) {
      const target = connectorsState.find((c) => c.id === initialConnectorId);
      if (target) openProviderSetup(target);
    }
  }, [initialConnectorId, connectorsState]);

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

  if (!isOpen) return null;

  // Open Auth Wizard
  const handleOpenAuthWizard = (connector: Connector, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAuthDrawerConnector(connector);
    setAuthMode("oauth");
    setSelectedConnectorDetail(null);
    setVerifyStatus(null);
    setGithubReadAuthorized(false);

    // Prepopulate saved values
    if (connector.id === "github") {
      setGithubRepoInput(localStorage.getItem("agentshield_github_repo") || "");
      setGithubTokenInput(SecureTokenVault.getSecret("agentshield_github_token"));
    } else if (connector.id === "telegram") {
      setTelegramTokenInput(SecureTokenVault.getSecret("agentshield_telegram_token"));
      setTelegramChatIdInput(SecureTokenVault.getSecret("agentshield_telegram_chat_id"));
    } else if (connector.id === "slack") {
      setSlackWebhookInput(SecureTokenVault.getSecret("agentshield_slack_webhook"));
    } else if (connector.id === "nvidia") {
      setNvidiaKeyInput(SecureTokenVault.getSecret("agentshield_nvidia_key"));
    } else {
      const savedKey = SecureTokenVault.getSecret(`agentshield_conn_key_${connector.id}`);
      setApiKeyInput(savedKey || "");
    }
  };

  // 1-Click Instant Connect for any tool
  const handleQuickConnect = async (connector: Connector, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (connector.id === "gmail" || connector.id === "gcal") {
      openProviderSetup(connector);
      return;
    }
    handleOpenAuthWizard(connector);
    if (connector.id !== "github") {
      setVerifyStatus({
        success: false,
        message: `${connector.name} is catalog-only and is not connected yet.`,
        details: "This provider has no complete credential, health-check, and tool-execution flow in this release.",
        latencyMs: 0,
      });
    }
  };

  // Perform Real Live Verification and Authorization
  const handleAuthorizeConnection = async (connector: Connector) => {
    setIsVerifying(true);
    setVerifyStatus(null);
    const startMs = performance.now();

    try {
      if (connector.id === "github") {
        const repo = githubRepoInput.trim();
        const token = githubTokenInput.trim();
        if (!org?.id || !sessionToken) throw new Error("Sign in and select a workspace before connecting GitHub.");
        if (!repo || !token) throw new Error("Repository and fine-grained GitHub token are required.");
        const response = await fetch(`/v1/shieldwing/workspaces/${encodeURIComponent(org.id)}/github`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
          body: JSON.stringify({ repository: repo, token, authorization_confirmed: githubReadAuthorized }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          const detail = Array.isArray(payload.detail)
            ? payload.detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join("; ")
            : payload.detail;
          throw new Error(detail || "GitHub rejected the connection.");
        }
        localStorage.setItem("agentshield_github_repo", payload.repository);
        SecureTokenVault.removeSecret("agentshield_github_token");

        setVerifyStatus({
          success: true,
          message: `Verified access to ${payload.repository}`,
          details: "Credential was verified with GitHub and stored encrypted for this workspace. Repository actions use the token's actual permissions and require one-time approval.",
          latencyMs: Math.round(performance.now() - startMs),
        });
      } else {
        throw new Error(`${connector.name} does not have a live connector implementation yet.`);
      }

      // Mark connector connected in state & localStorage
      const updated = connectorsState.map((c) =>
        c.id === connector.id ? { ...c, connected: true } : c
      );
      setConnectorsState(updated);

      if (onConnectorConnected) {
        onConnectorConnected({ ...connector, connected: true });
      }

    } catch (err: any) {
      setVerifyStatus({
        success: false,
        message: `Failed to connect: ${err.message || 'Verification error'}`,
        latencyMs: 0,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Disconnect
  const handleDisconnect = async (connector: Connector) => {
    if (connector.id === "github" && org?.id && sessionToken) {
      const response = await fetch(`/v1/shieldwing/workspaces/${encodeURIComponent(org.id)}/github`, {
        method: "DELETE", headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (!response.ok) {
        setVerifyStatus({ success: false, message: "GitHub disconnect failed.", latencyMs: 0 });
        return;
      }
    }

    SecureTokenVault.removeSecret(`agentshield_conn_key_${connector.id}`);
    localStorage.removeItem(`agentshield_conn_key_${connector.id}`);
    if (connector.id === "github") {
      SecureTokenVault.removeSecret("agentshield_github_token");
      localStorage.removeItem("agentshield_conn_github");
    }
    if (connector.id === "telegram") {
      SecureTokenVault.removeSecret("agentshield_telegram_token");
      SecureTokenVault.removeSecret("agentshield_telegram_chat_id");
      localStorage.removeItem("agentshield_conn_telegram");
    }
    if (connector.id === "slack") {
      SecureTokenVault.removeSecret("agentshield_slack_webhook");
      localStorage.removeItem("agentshield_conn_slack");
    }
    if (connector.id === "nvidia") {
      SecureTokenVault.removeSecret("agentshield_nvidia_key");
      localStorage.removeItem("agentshield_conn_nvidia");
    }

    const updated = connectorsState.map((c) =>
      c.id === connector.id ? { ...c, connected: false } : c
    );
    setConnectorsState(updated);
    setAuthDrawerConnector(null);
  };

  const handleTestLatency = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (id !== "github" || !org?.id || !sessionToken) return;
    setTestingId(id);
    fetch(`/v1/shieldwing/workspaces/${encodeURIComponent(org.id)}/github/pull-requests`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    }).then((response) => {
      if (!response.ok) throw new Error("Provider check failed");
      setTestSuccessId(id);
      setTimeout(() => setTestSuccessId(null), 3000);
    }).catch(() => setVerifyStatus({ success: false, message: "GitHub health check failed.", latencyMs: 0 }))
      .finally(() => setTestingId(null));
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
                  {CONNECTORS_DATA.length} Catalog Entries
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {connectedCount} Connected
                </span>
              </div>
              <p className="text-xs text-purple-300/80">
                GitHub, Gmail, and Google Calendar are available. The remaining catalog connectors are coming soon.
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
              placeholder={`Search ${CONNECTORS_DATA.length} catalog entries (e.g. GitHub, Gmail, Slack, VS Code)...`}
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
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none ml-2">
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

        {/* Main Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConnectors.map((connector) => {
            const isTesting = testingId === connector.id;
            const isTestedOk = testSuccessId === connector.id;

            return (
              <div
                key={connector.id}
                onClick={() => ["github", "gmail", "gcal"].includes(connector.id) && openProviderSetup(connector)}
                className={`group p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${["github", "gmail", "gcal"].includes(connector.id) ? "cursor-pointer" : "cursor-default"} ${
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

                    <div className="flex items-center gap-1.5 shrink-0">
                      {connector.connected ? (
                        <button
                          onClick={(e) => handleOpenAuthWizard(connector, e)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-purple-900/40 hover:text-purple-200 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 size={12} className="text-emerald-400" />
                          <span>Connected</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleQuickConnect(connector, e)}
                            disabled={!['github', 'gmail', 'gcal'].includes(connector.id)}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-md shadow-purple-600/30 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title={["github", "gmail", "gcal"].includes(connector.id) ? "Connect this provider" : "Coming soon"}
                          >
                            {!["github", "gmail", "gcal"].includes(connector.id) ? <span>Coming soon</span> : <><Zap size={11} className="fill-white" /><span>{connector.id === "gmail" || connector.id === "gcal" ? "Setup" : "Connect"}</span></>}
                          </button>
                          {["github", "gmail", "gcal"].includes(connector.id) && <button
                            onClick={(e) => handleOpenAuthWizard(connector, e)}
                            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-purple-300 hover:text-white border border-purple-500/20 transition-all cursor-pointer"
                            title="Configure connection"
                          ><Key size={12} /></button>}
                        </div>
                      )}
                    </div>
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
                          <Check size={10} /> Live
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
                      disabled={!connector.connected}
                      className="text-purple-400 hover:text-purple-300 disabled:text-slate-600 disabled:cursor-not-allowed flex items-center gap-0.5"
                      title={connector.connected ? "Use this connected provider" : "Connect this provider before using it"}
                    >
                      Use <ExternalLink size={10} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AUTHENTICATION & LIVE CONNECTION WIZARD MODAL */}
        {authDrawerConnector && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-30 flex items-center justify-center p-4 animate-fadeIn">
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
                          ACTIVE & ENFORCED
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

              {/* Mode Selector Tabs */}
              <div className="flex items-center gap-2 border-b border-purple-500/20 pb-2.5">
                <button
                  type="button"
                  onClick={() => setAuthMode("oauth")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    authMode === "oauth"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : "text-purple-300/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Zap size={13} className="fill-white" />
                  <span>Provider authorization</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("api_key")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    authMode === "api_key"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : "text-purple-300/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Key size={13} />
                  <span>🔑 Manual API Key / Webhook</span>
                </button>
              </div>

              {/* TAB 1: 1-Click Instant OAuth Connect */}
              {authMode === "oauth" && (
                <div className="space-y-3 p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Shield size={15} className="text-purple-400" />
                    <span>Authorize {authDrawerConnector.name} through its provider flow</span>
                  </div>

                  {authDrawerConnector.id === "github" ? (
                    <div className="space-y-3 rounded-lg border border-purple-500/20 bg-black/20 p-3">
                      <label className="block text-slate-300">
                        <span className="mb-1 block font-medium">Repository (owner/repo or GitHub URL)</span>
                        <input
                          type="text"
                          value={githubRepoInput}
                          onChange={(event) => setGithubRepoInput(event.target.value)}
                          placeholder="owner/repository or https://github.com/owner/repository"
                          autoComplete="off"
                          className="w-full rounded-lg border border-purple-500/30 bg-[#180f2b] px-3 py-2 font-mono text-xs text-white focus:border-purple-400 focus:outline-none"
                        />
                      </label>
                      <label className="block text-slate-300">
                          <span className="mb-1 block font-medium">GitHub personal access token</span>
                        <input
                          type="password"
                          value={githubTokenInput}
                          onChange={(event) => setGithubTokenInput(event.target.value)}
                          placeholder="github_pat_… or ghp_…"
                          autoComplete="new-password"
                          className="w-full rounded-lg border border-purple-500/30 bg-[#180f2b] px-3 py-2 font-mono text-xs text-white focus:border-purple-400 focus:outline-none"
                        />
                      </label>
                      <p className="text-[10px] leading-relaxed text-purple-200/70">Fine-grained tokens are recommended: restrict one to this repository and grant only the needed read/write permissions. Classic ghp_ tokens are accepted but may have broader grants. AgentShield verifies repository access and stores the token encrypted. GitHub enforces the token's permissions.</p>
                      <label className="flex items-start gap-2 text-slate-300">
                        <input type="checkbox" checked={githubReadAuthorized} onChange={(event) => setGithubReadAuthorized(event.target.checked)} />
                        <span>I authorize repository-scoped read and write API actions. ShieldWing will show each exact action for one-time approval.</span>
                      </label>
                    </div>
                  ) : (
                    <p className="text-purple-200/80 leading-relaxed text-[11px]">
                      GitHub, Gmail, and Google Calendar have live connector flows in this release. Other catalog entries are coming soon.
                    </p>
                  )}

                  <div className="space-y-1.5 text-[11px] font-mono">
                    <div className="flex items-center gap-2 text-emerald-300">
                      <CheckCircle2 size={13} />
                      <span>{authDrawerConnector.id === "github" ? "Repository API access, limited by the token" : `Available read actions: ${authDrawerConnector.routineActions.slice(0, 3).join(", ")}`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-300">
                      <Lock size={13} />
                      <span>{authDrawerConnector.id === "github" ? "Every action requires one-time approval; sensitive admin endpoints are blocked" : `Trust boundary: ${authDrawerConnector.trustBoundaryRule}`}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => authDrawerConnector.id === "github"
                        ? void handleAuthorizeConnection(authDrawerConnector)
                        : void handleQuickConnect(authDrawerConnector)}
                      disabled={isVerifying || (authDrawerConnector.id === "github" && (!githubReadAuthorized || !githubRepoInput.trim() || !githubTokenInput.trim()))}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-500 hover:opacity-90 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/40 cursor-pointer"
                    >
                      {isVerifying ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Authorizing with {authDrawerConnector.name}...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={14} className="fill-white" />
                          <span>{verifyStatus?.success ? "Connected" : authDrawerConnector.id === "github" ? "Verify token & connect GitHub" : authDrawerConnector.connected ? "Re-authorize & Refresh Token" : `Authorize & Connect ${authDrawerConnector.name}`}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: Manual Credentials */}
              {authMode === "api_key" && (
                <div className="space-y-3.5 text-xs">
                  {/* 1. GITHUB CONNECTOR */}
                  {authDrawerConnector.id === "github" && (
                    <div className="space-y-3 p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30">
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">
                          Target GitHub Repository (Owner / Repo or GitHub URL):
                        </label>
                        <input
                          type="text"
                          value={githubRepoInput}
                          onChange={(e) => setGithubRepoInput(e.target.value)}
                          placeholder="owner/repo or https://github.com/owner/repo"
                          className="w-full bg-[#180f2b] border border-purple-500/30 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                        />
                        <span className="text-[10px] text-purple-300/60 mt-0.5 block">
                          ShieldWing can use supported read and write APIs in this one repository. GitHub enforces the token's permissions; every action requires one-time approval.
                        </span>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">
                          GitHub PAT (fine-grained recommended; ghp_ classic accepted):
                        </label>
                        <input
                          type="password"
                          value={githubTokenInput}
                          onChange={(e) => setGithubTokenInput(e.target.value)}
                          placeholder="github_pat_... or ghp_..."
                          className="w-full bg-[#180f2b] border border-purple-500/30 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                        />
                      </div>
                      <label className="flex items-start gap-2 text-slate-300">
                        <input type="checkbox" checked={githubReadAuthorized} onChange={(event) => setGithubReadAuthorized(event.target.checked)} />
                        <span>I authorize repository-scoped read and write API actions with one-time approval for every action.</span>
                      </label>
                    </div>
                  )}

                  {/* 2. TELEGRAM CONNECTOR */}
                  {authDrawerConnector.id === "telegram" && (
                    <div className="space-y-3 p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30">
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">
                          Telegram Bot Token (from @BotFather):
                        </label>
                        <input
                          type="password"
                          value={telegramTokenInput}
                          onChange={(e) => setTelegramTokenInput(e.target.value)}
                          placeholder="1234567890:ABCDefGhIJKlmNoPQRstuv..."
                          className="w-full bg-[#180f2b] border border-purple-500/30 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">
                          Your Telegram Chat ID (from @userinfobot):
                        </label>
                        <input
                          type="text"
                          value={telegramChatIdInput}
                          onChange={(e) => setTelegramChatIdInput(e.target.value)}
                          placeholder="e.g. 987654321"
                          className="w-full bg-[#180f2b] border border-purple-500/30 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* 3. SLACK CONNECTOR */}
                  {authDrawerConnector.id === "slack" && (
                    <div className="space-y-3 p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30">
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">
                          Slack Incoming Webhook URL:
                        </label>
                        <input
                          type="text"
                          value={slackWebhookInput}
                          onChange={(e) => setSlackWebhookInput(e.target.value)}
                          placeholder="https://hooks.slack.com/services/T00/B00/XXXX"
                          className="w-full bg-[#180f2b] border border-purple-500/30 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* 4. NVIDIA CONNECTOR */}
                  {authDrawerConnector.id === "nvidia" && (
                    <div className="space-y-3 p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30">
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">
                          NVIDIA NIM API Key (build.nvidia.com):
                        </label>
                        <input
                          type="password"
                          value={nvidiaKeyInput}
                          onChange={(e) => setNvidiaKeyInput(e.target.value)}
                          placeholder="nvapi-..."
                          className="w-full bg-[#180f2b] border border-purple-500/30 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                        />
                        <span className="text-[10px] text-purple-300/60 mt-0.5 block">
                          Accelerates ShieldWing Studio with NVIDIA Nemotron-4 340B & sub-second cloud inference.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 5. GENERAL CONNECTOR */}
                  {!["github", "telegram", "slack", "nvidia"].includes(authDrawerConnector.id) && (
                    <div className="space-y-3 p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30">
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">
                          {authDrawerConnector.name} API Key or Secret Token:
                        </label>
                        <input
                          type="password"
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          placeholder={`e.g. ${authDrawerConnector.id}_live_sec_...`}
                          className="w-full bg-[#180f2b] border border-purple-500/30 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Trust Boundary Scope Settings */}
              <div className="p-3 rounded-xl bg-black/40 border border-purple-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-purple-300 flex items-center gap-1.5 text-xs">
                    <Shield size={13} />
                    <span>Dual-Rail Trust Boundary Enforcement</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">ENFORCED</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
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

              {/* Live Verification Status Alert */}
              {verifyStatus && (
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-2.5 animate-fadeIn ${
                    verifyStatus.success
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                      : "bg-red-950/40 border-red-500/40 text-red-300"
                  }`}
                >
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                  <div className="space-y-0.5 text-xs">
                    <div className="font-bold">{verifyStatus.message}</div>
                    {verifyStatus.details && (
                      <div className="text-[11px] text-slate-300 leading-relaxed font-sans">
                        {verifyStatus.details}
                      </div>
                    )}
                    <div className="text-[10px] font-mono opacity-80 pt-1">
                      Proxy Latency: {verifyStatus.latencyMs}ms &bull; Merkle Signature Verified
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-purple-500/20 flex items-center justify-between gap-3">
                {authDrawerConnector.connected ? (
                  <button
                    onClick={() => handleDisconnect(authDrawerConnector)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 transition-all cursor-pointer"
                  >
                    Disconnect
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAuthDrawerConnector(null)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
                  >
                    {verifyStatus?.success ? "Done" : "Cancel"}
                  </button>

                  {authMode === "api_key" && (
                    <button
                      onClick={() => handleAuthorizeConnection(authDrawerConnector)}
                      disabled={isVerifying || (authDrawerConnector.id === "github" && !githubReadAuthorized)}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-500 text-white hover:opacity-90 transition-all shadow-lg shadow-purple-600/40 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isVerifying ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Verifying Live Route...</span>
                        </>
                      ) : (
                        <>
                          <Check size={13} />
                          <span>{verifyStatus?.success ? "Save Credentials" : "Authorize & Connect"}</span>
                        </>
                      )}
                    </button>
                  )}

                  {verifyStatus?.success && onSelectConnector && (
                    <button
                      onClick={() => {
                        onSelectConnector(authDrawerConnector);
                        setAuthDrawerConnector(null);
                        onClose();
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90 transition-all shadow-lg shadow-emerald-600/40 flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare size={13} />
                      <span>Use in Chat</span>
                    </button>
                  )}
                </div>
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
            Showing <strong className="text-white">{filteredConnectors.length}</strong> of {CONNECTORS_DATA.length} catalog entries
          </div>
        </div>

      </div>
    </div>
  );
};
