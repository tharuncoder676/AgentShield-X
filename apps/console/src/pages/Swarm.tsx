import React, { useState, useEffect } from "react";
import { Network, ShieldCheck, ShieldAlert, Play, ArrowRight, Layers, Users, Lock, AlertTriangle } from "lucide-react";
import { Panel, EmptyState, cn } from "@agentshield/ui";
import { useAuth } from "../context/AuthContext";

export const Swarm: React.FC = () => {
  const { activeProject, client } = useAuth();
  const [traces, setTraces] = useState<any[]>([]);
  const [currentTrace, setCurrentTrace] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [swarmName, setSwarmName] = useState("Enterprise-Research-Swarm");

  const loadTraces = async () => {
    setIsLoading(true);
    try {
      const data = await client.listSwarmTraces(activeProject?.id);
      setTraces(data);
      if (data.length > 0 && !currentTrace) {
        setCurrentTrace(data[0]);
      }
    } catch (err) {
      console.warn("Failed to load swarm traces:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTraces();
  }, [activeProject?.id]);

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const res = await client.simulateSwarm(swarmName, undefined, activeProject?.id);
      await loadTraces();
      setCurrentTrace(res);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message || String(err)}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const steps = currentTrace?.steps || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2 text-ok mb-1">
            <Network size={16} />
            <span className="font-chakra text-xs font-bold uppercase tracking-widest">
              Multi-Agent Architecture
            </span>
          </div>
          <h1 className="text-2xl font-chakra font-bold tracking-tight text-fg">
            Swarm Defense & A2A Taint Attenuation
          </h1>
          <p className="text-xs text-mut mt-1">
            Tracks taint propagation across sub-agent delegations and enforces capability attenuation in LangGraph, CrewAI, and AutoGen swarms.
          </p>
        </div>

        <button
          onClick={handleSimulate}
          disabled={isSimulating}
          className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-ok text-black font-chakra text-xs font-bold uppercase tracking-wider hover:bg-ok/90 transition-all disabled:opacity-50"
        >
          {isSimulating ? <span className="animate-spin">⟳</span> : <Play size={14} />}
          <span>{isSimulating ? "Simulating Swarm..." : "Simulate Swarm Delegation"}</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Trace History */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="font-chakra text-xs font-bold uppercase tracking-wider text-mut">
            Swarm Traces ({traces.length})
          </h2>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-mut font-chakra uppercase animate-pulse">
              Loading Swarm Traces...
            </div>
          ) : traces.length === 0 ? (
            <Panel>
              <EmptyState
                icon={<Network size={28} className="text-mut" />}
                title="No Swarm Traces"
                description="Simulate a swarm above or execute 'agentshield swarm' in your CLI to inspect cross-agent taint attenuation."
              />
            </Panel>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {traces.map((t) => {
                const isSelected = currentTrace?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setCurrentTrace(t)}
                    className={cn(
                      "p-3 rounded-sm border cursor-pointer transition-all",
                      isSelected
                        ? "border-ok bg-ok/5 shadow-md"
                        : "border-line bg-panel hover:border-line/80 hover:bg-panel/80"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-chakra text-xs font-bold text-fg truncate">
                        {t.swarm_name}
                      </div>
                      <span className={cn(
                        "text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold",
                        t.safe ? "bg-ok/20 text-ok border border-ok/40" : "bg-bad/20 text-bad border border-bad/40"
                      )}>
                        {t.safe ? "SAFE" : "VIOLATION"}
                      </span>
                    </div>

                    <div className="text-[11px] text-mut font-mono mt-1">
                      {t.total_steps} delegation steps &bull; {t.violations_detected} violations
                    </div>

                    <div className="text-[10px] text-mut/80 mt-2 pt-2 border-t border-line/40">
                      {new Date(t.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Interactive Multi-Agent Trace & Attenuation Visualizer */}
        <div className="lg:col-span-2 space-y-4">
          {currentTrace ? (
            <>
              {/* Swarm Metrics Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Panel>
                  <div className="text-[11px] font-chakra font-bold text-mut uppercase">Swarm Status</div>
                  <div className={cn("text-lg font-chakra font-bold mt-1", currentTrace.safe ? "text-ok" : "text-bad")}>
                    {currentTrace.safe ? "SECURE & ATTENUATED" : "VIOLATIONS INTERCEPTED"}
                  </div>
                </Panel>
                <Panel>
                  <div className="text-[11px] font-chakra font-bold text-mut uppercase">Delegation Steps</div>
                  <div className="text-lg font-chakra font-bold text-fg mt-1">
                    {currentTrace.total_steps} Agent Hops
                  </div>
                </Panel>
                <Panel>
                  <div className="text-[11px] font-chakra font-bold text-mut uppercase">Active Taint Tags</div>
                  <div className="text-lg font-chakra font-bold text-warn mt-1">
                    {currentTrace.final_taint_count || 2} Inherited Labels
                  </div>
                </Panel>
              </div>

              {/* Step-by-Step Multi-Agent Delegation Graph */}
              <div className="space-y-3">
                <div className="font-chakra text-xs font-bold uppercase tracking-wider text-mut">
                  Delegation Sequence & Attenuation Decisions
                </div>

                {steps.map((s: any, idx: number) => {
                  const v = s.verdict || {};
                  const isApproved = v.allowed;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "p-4 rounded-sm border bg-panel transition-all space-y-3",
                        isApproved ? "border-line" : "border-bad/40 bg-bad/5"
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {/* Agent Hop Diagram */}
                        <div className="flex items-center gap-2 font-mono text-xs font-bold">
                          <span className="px-2.5 py-1 rounded bg-panel border border-cyan-500/40 text-cyan-400">
                            {s.parent_agent_id}
                          </span>
                          <ArrowRight size={14} className="text-mut" />
                          <span className="px-2.5 py-1 rounded bg-panel border border-purple-500/40 text-purple-400">
                            {s.child_agent_id}
                          </span>
                        </div>

                        <span className={cn(
                          "text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase w-fit",
                          isApproved ? "bg-ok/20 text-ok border border-ok/30" : "bg-bad/20 text-bad border border-bad/30"
                        )}>
                          {isApproved ? "DELEGATION APPROVED" : "DELEGATION BLOCKED"}
                        </span>
                      </div>

                      {/* Task Content */}
                      <div className="text-xs text-mut font-sans">
                        <span className="font-bold text-fg">Delegated Task:</span> {s.task}
                      </div>

                      {/* Attenuation Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-line/40 text-[11px] font-mono">
                        <div>
                          <span className="text-mut block">Permitted Attenuated Tools:</span>
                          <span className="text-ok font-bold">
                            {(v.attenuated_tools || []).join(", ") || "None (Sinks strictly stripped)"}
                          </span>
                        </div>
                        <div>
                          <span className="text-mut block">Cross-Agent Taint Labels:</span>
                          <span className="text-warn font-bold">
                            {(v.inherited_taint || []).join(", ") || "Untainted"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <Panel>
              <EmptyState
                icon={<Network size={28} className="text-mut" />}
                title="Select a Swarm Trace"
                description="Select an agentic trace from the left or run a new simulation to view multi-agent attenuation."
              />
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
};
