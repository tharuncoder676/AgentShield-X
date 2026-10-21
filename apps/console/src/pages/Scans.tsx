import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, ShieldAlert, CheckCircle, Clock, Play, ArrowRight, Sparkles, AlertTriangle, Layers, ExternalLink } from "lucide-react";
import { Panel, RiskMeter, EmptyState, cn } from "@agentshield/ui";
import { useAuth } from "../context/AuthContext";

export const Scans: React.FC = () => {
  const { activeProject, client } = useAuth();
  const [scans, setScans] = useState<any[]>([]);
  const [selectedScan, setSelectedScan] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [targetPath, setTargetPath] = useState("examples/research-agent");
  const [activeTab, setActiveTab] = useState<"findings" | "blast_radius">("findings");

  const loadScans = async () => {
    setIsLoading(true);
    try {
      const data = await client.listScans(activeProject?.id);
      setScans(data);
      if (data.length > 0 && !selectedScan) {
        setSelectedScan(data[0]);
      }
    } catch (err) {
      console.warn("Failed to load scans:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadScans();
  }, [activeProject?.id]);

  const handleRunScan = async () => {
    setIsScanning(true);
    try {
      const res = await client.scanRepo(targetPath, "enforce", activeProject?.id);
      await loadScans();
      setSelectedScan(res);
    } catch (err: any) {
      alert(`Scan failed: ${err.message || String(err)}`);
    } finally {
      setIsScanning(false);
    }
  };

  const br = selectedScan?.blast_radius || {};
  const findings = selectedScan?.findings || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2 text-ok mb-1">
            <Search size={16} />
            <span className="font-chakra text-xs font-bold uppercase tracking-widest">
              Static AST Security Analysis
            </span>
          </div>
          <h1 className="text-2xl font-chakra font-bold tracking-tight text-fg">
            Repository Scans & Blast Radius
          </h1>
          <p className="text-xs text-mut mt-1">
            Synchronized scans from CLI (`agentshield scan`) and Web. Discovers tools and computes injection propagation paths.
          </p>
        </div>

        {/* Scan Input & Trigger */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={targetPath}
            onChange={(e) => setTargetPath(e.target.value)}
            placeholder="Repository path (e.g. . or examples/research-agent)"
            className="px-3 py-1.5 rounded-sm border border-line bg-panel text-xs font-mono placeholder:text-mut focus:outline-none focus:border-ok flex-1 sm:w-64"
          />
          <button
            onClick={handleRunScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-sm bg-ok text-black font-chakra text-xs font-bold uppercase tracking-wider hover:bg-ok/90 transition-all disabled:opacity-50"
          >
            {isScanning ? (
              <span className="animate-spin text-sm">⟳</span>
            ) : (
              <Play size={14} />
            )}
            <span>{isScanning ? "Scanning..." : "Scan Repo"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Scan History List + Detailed View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Historical Scans List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-chakra text-xs font-bold uppercase tracking-wider text-mut">
              Scan History ({scans.length})
            </h2>
            <Link
              to="/terminal"
              className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>Run in CLI</span>
              <ExternalLink size={10} />
            </Link>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-mut font-chakra uppercase animate-pulse">
              Loading Scan Telemetry...
            </div>
          ) : scans.length === 0 ? (
            <Panel>
              <EmptyState
                icon={<Search size={28} className="text-mut" />}
                title="No Scans Recorded"
                description="Run 'agentshield scan .' in your terminal or click 'Scan Repo' above to evaluate tool blast radius."
              />
            </Panel>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {scans.map((s) => {
                const isSelected = selectedScan?.id === s.id;
                const hasHigh = (s.high_findings_count || 0) > 0;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedScan(s)}
                    className={cn(
                      "p-3 rounded-sm border cursor-pointer transition-all",
                      isSelected
                        ? "border-ok bg-ok/5 shadow-md"
                        : "border-line bg-panel hover:border-line/80 hover:bg-panel/80"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-mono text-xs font-bold truncate max-w-[180px]">
                        {s.target_dir.split("/").pop() || s.target_dir.split("\\").pop()}
                      </div>
                      <span className={cn(
                        "text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold",
                        s.source === "cli" ? "bg-cyan-950 text-cyan-400 border border-cyan-800" : "bg-panel text-mut border border-line"
                      )}>
                        {s.source || "cli"}
                      </span>
                    </div>

                    <div className="text-[11px] text-mut truncate mt-1">
                      {s.target_dir}
                    </div>

                    <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-line/50">
                      <div className="flex items-center gap-2">
                        {hasHigh ? (
                          <span className="text-bad flex items-center gap-1 font-bold">
                            <AlertTriangle size={12} />
                            <span>{s.high_findings_count} Critical</span>
                          </span>
                        ) : (
                          <span className="text-ok flex items-center gap-1">
                            <CheckCircle size={12} />
                            <span>Safe</span>
                          </span>
                        )}
                      </div>
                      <div className="text-mut text-[10px]">
                        {new Date(s.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Scan Details, Blast Radius & AutoPolicy */}
        <div className="lg:col-span-2 space-y-4">
          {selectedScan ? (
            <>
              {/* Scan Summary Banner */}
              <Panel>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-ok font-bold uppercase">
                        Scan ID: {selectedScan.id}
                      </span>
                      <span className="text-mut text-xs">&bull;</span>
                      <span className="text-xs text-mut font-mono">
                        Mode: {selectedScan.mode || "enforce"}
                      </span>
                    </div>
                    <div className="text-base font-chakra font-bold text-fg mt-1">
                      {selectedScan.target_dir}
                    </div>
                  </div>

                  <Link
                    to="/autopolicy"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-purple-600/20 border border-purple-500/40 text-purple-400 hover:bg-purple-600 hover:text-white font-chakra text-xs font-bold uppercase transition-all"
                  >
                    <Sparkles size={14} />
                    <span>Heal with AutoPolicy</span>
                  </Link>
                </div>
              </Panel>

              {/* Tabs: Findings vs Blast Radius */}
              <div className="flex items-center gap-2 border-b border-line">
                <button
                  onClick={() => setActiveTab("findings")}
                  className={cn(
                    "px-4 py-2 font-chakra text-xs font-bold uppercase border-b-2 transition-colors",
                    activeTab === "findings"
                      ? "border-ok text-ok"
                      : "border-transparent text-mut hover:text-fg"
                  )}
                >
                  Vulnerability Findings ({findings.length})
                </button>
                <button
                  onClick={() => setActiveTab("blast_radius")}
                  className={cn(
                    "px-4 py-2 font-chakra text-xs font-bold uppercase border-b-2 transition-colors",
                    activeTab === "blast_radius"
                      ? "border-ok text-ok"
                      : "border-transparent text-mut hover:text-fg"
                  )}
                >
                  Blast Radius Diagram
                </button>
              </div>

              {/* Findings Tab Content */}
              {activeTab === "findings" && (
                <div className="space-y-3">
                  {findings.length === 0 ? (
                    <Panel>
                      <div className="text-center py-8 text-ok">
                        <CheckCircle size={32} className="mx-auto mb-2 text-ok" />
                        <div className="font-chakra font-bold text-sm uppercase">Zero Security Findings Detected</div>
                        <p className="text-xs text-mut mt-1">All agent tools and sinks are properly constrained.</p>
                      </div>
                    </Panel>
                  ) : (
                    findings.map((f: any, idx: number) => {
                      const isHigh = f.severity === "high" || f.severity === "critical";
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "p-4 rounded-sm border bg-panel transition-all space-y-2",
                            isHigh ? "border-bad/40" : "border-line"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase",
                                isHigh ? "bg-bad/20 text-bad border border-bad/30" : "bg-panel text-mut border border-line"
                              )}>
                                {f.severity || "MEDIUM"}
                              </span>
                              <span className="font-mono text-xs font-bold text-fg">
                                {f.tool ? `Tool: ${f.tool}` : "Repository Finding"}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-mut">
                              Status: {f.status || "open"}
                            </span>
                          </div>

                          <p className="text-xs text-mut leading-relaxed">
                            {f.message || f.description || "Unconstrained data flow detected from untrusted source to sink."}
                          </p>

                          {f.recommendation && (
                            <div className="text-[11px] font-mono text-cyan-400 bg-cyan-950/20 p-2 rounded border border-cyan-800/40">
                              Mitigation: {f.recommendation}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Blast Radius Tab Content */}
              {activeTab === "blast_radius" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Untrusted Entry Points */}
                    <div className="p-4 rounded-sm border border-bad/30 bg-bad/5 space-y-2">
                      <div className="text-xs font-chakra font-bold uppercase text-bad flex items-center gap-1.5">
                        <AlertTriangle size={14} />
                        <span>Untrusted Entry Points</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(br.entry_points || []).length > 0 ? (
                          (br.entry_points || []).map((t: string) => (
                            <span key={t} className="px-2 py-0.5 rounded bg-bad/20 text-bad font-mono text-xs font-bold">
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-mut italic">No external entry points detected</span>
                        )}
                      </div>
                    </div>

                    {/* Private Data Reads */}
                    <div className="p-4 rounded-sm border border-warn/30 bg-warn/5 space-y-2">
                      <div className="text-xs font-chakra font-bold uppercase text-warn flex items-center gap-1.5">
                        <Layers size={14} />
                        <span>Private Data Sources</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(br.private_data_reachable || []).length > 0 ? (
                          (br.private_data_reachable || []).map((t: string) => (
                            <span key={t} className="px-2 py-0.5 rounded bg-warn/20 text-warn font-mono text-xs font-bold">
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-mut italic">No private read sources reachable</span>
                        )}
                      </div>
                    </div>

                    {/* Outbound Sinks */}
                    <div className="p-4 rounded-sm border border-purple-500/30 bg-purple-950/10 space-y-2">
                      <div className="text-xs font-chakra font-bold uppercase text-purple-400 flex items-center gap-1.5">
                        <ArrowRight size={14} />
                        <span>Outbound Channels (Sinks)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(br.outbound_channels_reachable || []).length > 0 ? (
                          (br.outbound_channels_reachable || []).map((t: string) => (
                            <span key={t} className="px-2 py-0.5 rounded bg-purple-900/30 text-purple-300 font-mono text-xs font-bold">
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-mut italic">No outbound sinks reachable</span>
                        )}
                      </div>
                    </div>

                    {/* Decoy Honeytools */}
                    <div className="p-4 rounded-sm border border-ok/30 bg-ok/5 space-y-2">
                      <div className="text-xs font-chakra font-bold uppercase text-ok flex items-center gap-1.5">
                        <CheckCircle size={14} />
                        <span>Decoy Tripwires (Honeytools)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(br.decoy_tools || []).length > 0 ? (
                          (br.decoy_tools || []).map((t: string) => (
                            <span key={t} className="px-2 py-0.5 rounded bg-ok/20 text-ok font-mono text-xs font-bold">
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-mut italic">No decoy tripwires configured</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Panel>
              <EmptyState
                icon={<Search size={28} className="text-mut" />}
                title="Select a Scan"
                description="Choose a repository scan from the left to view security findings and blast-radius graph."
              />
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
};
