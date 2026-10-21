import React, { useState, useEffect } from "react";
import { Crosshair, ShieldCheck, ShieldAlert, Zap, Play, Filter, AlertTriangle, Bug } from "lucide-react";
import { Panel, RiskMeter, EmptyState, cn } from "@agentshield/ui";
import { useAuth } from "../context/AuthContext";

export const RedTeam: React.FC = () => {
  const { activeProject, client } = useAuth();
  const [runs, setRuns] = useState<any[]>([]);
  const [activeRun, setActiveRun] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFuzzing, setIsFuzzing] = useState(false);
  const [rounds, setRounds] = useState(5);
  const [filterTech, setFilterTech] = useState<string>("all");

  const loadRuns = async () => {
    setIsLoading(true);
    try {
      const data = await client.listRedteamRuns(activeProject?.id);
      setRuns(data);
      if (data.length > 0 && !activeRun) {
        setActiveRun(data[0]);
      }
    } catch (err) {
      console.warn("Failed to load redteam runs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, [activeProject?.id]);

  const handleLaunchCampaign = async () => {
    setIsFuzzing(true);
    try {
      const res = await client.runRedteam(
        activeProject?.name || "Customer-Support-Agent",
        rounds,
        undefined,
        activeProject?.id
      );
      await loadRuns();
      setActiveRun(res);
    } catch (err: any) {
      alert(`Campaign failed: ${err.message || String(err)}`);
    } finally {
      setIsFuzzing(false);
    }
  };

  const probes = (activeRun?.probes || []).filter((p: any) =>
    filterTech === "all" ? true : p.mutation_technique === filterTech
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2 text-warn mb-1">
            <Crosshair size={16} />
            <span className="font-chakra text-xs font-bold uppercase tracking-widest">
              Continuous Adversarial Fuzzing
            </span>
          </div>
          <h1 className="text-2xl font-chakra font-bold tracking-tight text-fg">
            Autonomous Red-Team Attack Swarm
          </h1>
          <p className="text-xs text-mut mt-1">
            Mutates indirect injections, delimiter escapes, and exfiltration payloads to evaluate agent containment under empirical stress testing.
          </p>
        </div>

        {/* Campaign Trigger */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-mut">Rounds:</span>
            <select
              value={rounds}
              onChange={(e) => setRounds(parseInt(e.target.value, 10))}
              className="bg-panel border border-line rounded px-2 py-1 text-fg font-mono text-xs focus:outline-none focus:border-warn"
            >
              <option value={3}>3 Rounds (18 probes)</option>
              <option value={5}>5 Rounds (30 probes)</option>
              <option value={10}>10 Rounds (60 probes)</option>
            </select>
          </div>

          <button
            onClick={handleLaunchCampaign}
            disabled={isFuzzing}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-sm bg-warn text-black font-chakra text-xs font-bold uppercase tracking-wider hover:bg-warn/90 transition-all disabled:opacity-50"
          >
            {isFuzzing ? <span className="animate-spin">⟳</span> : <Zap size={14} />}
            <span>{isFuzzing ? "Attacking..." : "Launch Attack Swarm"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Past Campaigns */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="font-chakra text-xs font-bold uppercase tracking-wider text-mut">
            Campaign Runs ({runs.length})
          </h2>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-mut font-chakra uppercase animate-pulse">
              Loading Red-Team Campaigns...
            </div>
          ) : runs.length === 0 ? (
            <Panel>
              <EmptyState
                icon={<Crosshair size={28} className="text-mut" />}
                title="No Campaigns Executed"
                description="Launch an attack campaign above or execute 'agentshield redteam' in the terminal to probe your tools."
              />
            </Panel>
          ) : (
            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {runs.map((r) => {
                const isSelected = activeRun?.id === r.id;
                const hasBypass = (r.bypassed_count || 0) > 0;
                return (
                  <div
                    key={r.id}
                    onClick={() => setActiveRun(r)}
                    className={cn(
                      "p-3 rounded-sm border cursor-pointer transition-all",
                      isSelected
                        ? "border-warn bg-warn/5 shadow-md"
                        : "border-line bg-panel hover:border-line/80 hover:bg-panel/80"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-chakra text-xs font-bold text-fg truncate">
                        {r.target_name}
                      </div>
                      <span className={cn(
                        "text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold",
                        hasBypass ? "bg-bad/20 text-bad border border-bad/30" : "bg-ok/20 text-ok border border-ok/30"
                      )}>
                        {r.catch_rate}% CATCH
                      </span>
                    </div>

                    <div className="text-[11px] text-mut font-mono mt-1">
                      {r.total_probes} probes tested &bull; {r.rounds_executed} rounds
                    </div>

                    <div className="text-[10px] text-mut/80 mt-2 pt-2 border-t border-line/40 flex items-center justify-between">
                      <span>CI: [{r.ci_low || r.confidence_interval_low}%, {r.ci_high || r.confidence_interval_high}%]</span>
                      <span>{new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active Campaign Metrics & Probes */}
        <div className="lg:col-span-2 space-y-4">
          {activeRun ? (
            <>
              {/* Campaign KPI Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Panel>
                  <div className="text-[11px] font-chakra font-bold text-mut uppercase">Catch Rate</div>
                  <div className="text-xl font-chakra font-bold text-ok mt-1">
                    {activeRun.catch_rate}%
                  </div>
                  <div className="text-[10px] text-mut font-mono mt-0.5">Wilson 95% CI</div>
                </Panel>
                <Panel>
                  <div className="text-[11px] font-chakra font-bold text-mut uppercase">Probes Blocked</div>
                  <div className="text-xl font-chakra font-bold text-fg mt-1">
                    {activeRun.blocked_count} / {activeRun.total_probes}
                  </div>
                  <div className="text-[10px] text-ok font-mono mt-0.5">Containment active</div>
                </Panel>
                <Panel>
                  <div className="text-[11px] font-chakra font-bold text-mut uppercase">Bypass Leaks</div>
                  <div className={cn("text-xl font-chakra font-bold mt-1", activeRun.bypassed_count > 0 ? "text-bad" : "text-ok")}>
                    {activeRun.bypassed_count}
                  </div>
                  <div className="text-[10px] text-mut font-mono mt-0.5">Zero-day escapes</div>
                </Panel>
                <Panel>
                  <div className="text-[11px] font-chakra font-bold text-mut uppercase">Confidence</div>
                  <div className="text-xs font-mono font-bold text-fg mt-2">
                    [{activeRun.ci_low || activeRun.confidence_interval_low}%, {activeRun.ci_high || activeRun.confidence_interval_high}%]
                  </div>
                </Panel>
              </div>

              {/* Mutation Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono border-b border-line pb-3">
                <span className="text-mut text-[11px] font-chakra uppercase font-bold mr-1">Filter Mutation:</span>
                {["all", "raw", "base64_obfuscation", "delimiter_escape", "markdown_sink", "split_context"].map((tech) => (
                  <button
                    key={tech}
                    onClick={() => setFilterTech(tech)}
                    className={cn(
                      "px-2.5 py-0.5 rounded border transition-colors capitalize",
                      filterTech === tech
                        ? "bg-warn/20 border-warn text-warn font-bold"
                        : "bg-panel border-line text-mut hover:border-fg/40"
                    )}
                  >
                    {tech.replace("_", " ")}
                  </button>
                ))}
              </div>

              {/* Probes List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 font-mono text-xs">
                {probes.map((p: any, idx: number) => {
                  const isBlocked = p.blocked;
                  return (
                    <div
                      key={p.probe_id || idx}
                      className={cn(
                        "p-3 rounded-sm border bg-[#0d1117] space-y-2 transition-all",
                        isBlocked ? "border-line" : "border-bad bg-bad/10"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded uppercase font-bold",
                            isBlocked ? "bg-ok/20 text-ok border border-ok/30" : "bg-bad text-white font-bold"
                          )}>
                            {isBlocked ? "BLOCKED" : "BYPASSED"}
                          </span>
                          <span className="text-fg font-bold">
                            Tool: {p.target_tool}
                          </span>
                        </div>
                        <span className="text-mut text-[11px]">
                          Tech: {p.mutation_technique}
                        </span>
                      </div>

                      <div className="text-fg/80 text-[11px] bg-panel/60 p-2 rounded border border-line/40 truncate">
                        Payload: {p.payload}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-mut pt-1">
                        <span>Detector: {p.detector_cited || "rules_engine"}</span>
                        <span>Evidence: {p.evidence || "Detected injection pattern"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <Panel>
              <EmptyState
                icon={<Crosshair size={28} className="text-mut" />}
                title="Select a Campaign"
                description="Select an adversarial fuzzing campaign from the left or launch a new run."
              />
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
};
