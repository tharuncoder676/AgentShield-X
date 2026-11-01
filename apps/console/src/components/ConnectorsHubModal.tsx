import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { CONNECTORS_DATA, CATEGORIES, Connector } from "../data/connectorsCatalog";

interface ConnectorsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConnector?: (connector: Connector) => void;
}

export const ConnectorsHubModal: React.FC<ConnectorsHubModalProps> = ({
  isOpen,
  onClose,
  onSelectConnector,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [connectorsState, setConnectorsState] = useState<Connector[]>(CONNECTORS_DATA);
  const [filterConnectedOnly, setFilterConnectedOnly] = useState(false);
  const [selectedConnectorDetail, setSelectedConnectorDetail] = useState<Connector | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testSuccessId, setTestSuccessId] = useState<string | null>(null);

  if (!isOpen) return null;

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

  const handleToggleConnect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConnectorsState((prev) =>
      prev.map((c) => (c.id === id ? { ...c, connected: !c.connected } : c))
    );
    if (selectedConnectorDetail && selectedConnectorDetail.id === id) {
      setSelectedConnectorDetail((prev) => (prev ? { ...prev, connected: !prev.connected } : null));
    }
  };

  const handleTestLatency = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTestingId(id);
    setTimeout(() => {
      setTestingId(null);
      setTestSuccessId(id);
      setTimeout(() => setTestSuccessId(null), 3000);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[88vh] bg-[#0c0d14] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#10121d]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Workflow size={20} className="animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-sora text-white tracking-wide">
                  Universal Connectors & Tools Hub
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  312 Available
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {connectedCount} Connected
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Grant Wingman secure deterministic access with dual-rail Trust Boundary verification.
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
        <div className="px-6 py-3 border-b border-white/10 bg-[#0e1019] flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 312 tools, apps, and actions (e.g. GitHub, Slack, Docker)..."
              className="w-full bg-[#151724] border border-white/10 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
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

          <div className="flex items-center gap-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={filterConnectedOnly}
                onChange={(e) => setFilterConnectedOnly(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-800"
              />
              <span>Connected only ({connectedCount})</span>
            </label>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="px-6 py-2 border-b border-white/5 bg-[#0a0b12] flex items-center gap-2 overflow-x-auto scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20"
                  : "bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10 border border-transparent"
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedCategory === cat.id
                    ? "bg-cyan-500/30 text-cyan-200"
                    : "bg-black/30 text-slate-500"
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
                    ? "bg-[#111422]/90 border-cyan-500/30 hover:border-cyan-400 shadow-sm hover:shadow-cyan-500/10"
                    : "bg-[#0f111a]/80 border-white/5 hover:border-white/20 hover:bg-[#131522]"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border ${
                          connector.connected
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                            : "bg-white/5 text-slate-300 border-white/10 group-hover:border-white/20"
                        }`}
                      >
                        {connector.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold text-sm text-white group-hover:text-cyan-300 transition-colors">
                            {connector.name}
                          </h3>
                          {connector.popular && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono">
                              Popular
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">{connector.categoryLabel}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleToggleConnect(connector.id, e)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        connector.connected
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40"
                          : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30"
                      }`}
                    >
                      {connector.connected ? "Connected" : "Connect"}
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                    {connector.description}
                  </p>

                  {/* Trust Boundary preview */}
                  <div className="p-2 rounded-lg bg-black/40 border border-white/5 text-[11px] text-slate-400 mb-3 flex items-start gap-1.5">
                    <Shield size={13} className="text-cyan-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{connector.trustBoundaryRule}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-mono">
                    <Zap size={12} className="text-amber-400" />
                    {connector.routineActions.length + connector.consequentialActions.length} tools
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleTestLatency(connector.id, e)}
                      disabled={isTesting || !connector.connected}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors flex items-center gap-1 ${
                        isTestedOk
                          ? "bg-emerald-500/20 text-emerald-300"
                          : isTesting
                          ? "bg-cyan-500/20 text-cyan-300 animate-pulse"
                          : "bg-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {isTesting ? (
                        <RefreshCw size={10} className="animate-spin" />
                      ) : isTestedOk ? (
                        <>
                          <Check size={10} /> 18ms
                        </>
                      ) : (
                        "Test"
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectConnector) onSelectConnector(connector);
                        onClose();
                      }}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
                    >
                      Use <ExternalLink size={10} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Connector Policy Drawer/Modal */}
        {selectedConnectorDetail && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex justify-end animate-fadeIn">
            <div className="w-full max-w-lg bg-[#0e1019] border-l border-cyan-500/30 h-full p-6 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-start justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center font-bold text-lg text-cyan-300">
                      {selectedConnectorDetail.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white font-sora">
                        {selectedConnectorDetail.name}
                      </h3>
                      <span className="text-xs text-slate-400">
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
                    <h4 className="text-slate-400 uppercase tracking-wider font-chakra text-[10px] mb-1">
                      Description
                    </h4>
                    <p className="text-slate-300 leading-relaxed">
                      {selectedConnectorDetail.description}
                    </p>
                  </div>

                  {/* Trust Boundary Policy */}
                  <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold mb-1">
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
                  <div className="pt-4 border-t border-white/10 space-y-2">
                    <h4 className="text-slate-400 uppercase tracking-wider font-chakra text-[10px]">
                      Authentication & Scopes
                    </h4>
                    <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">OAuth 2.0 Token Status:</span>
                        <span className="text-emerald-400 font-mono">
                          {selectedConnectorDetail.connected ? "ACTIVE & REFRESHED" : "NOT CONNECTED"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Deterministic Proxy:</span>
                        <span className="text-cyan-400 font-mono">ENFORCED (PORT 8002)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center gap-2">
                <button
                  onClick={() => handleToggleConnect(selectedConnectorDetail.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedConnectorDetail.connected
                      ? "bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30"
                      : "bg-cyan-500 text-black hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
                  }`}
                >
                  {selectedConnectorDetail.connected ? "Disconnect Integration" : "Connect Integration"}
                </button>
                <button
                  onClick={() => {
                    if (onSelectConnector) onSelectConnector(selectedConnectorDetail);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 text-white hover:bg-white/20 border border-white/10"
                >
                  Insert In Chat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#0e1019] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AgentShield-X Trust Boundary Layer Active</span>
          </div>
          <div>
            Showing <strong className="text-white">{filteredConnectors.length}</strong> of 312 connectors
          </div>
        </div>

      </div>
    </div>
  );
};
