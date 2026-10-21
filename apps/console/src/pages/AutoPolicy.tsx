import React, { useState, useEffect } from "react";
import { Sparkles, ShieldCheck, CheckCircle, FileCode, Play, Check, AlertTriangle, ArrowRight } from "lucide-react";
import { Panel, EmptyState, cn } from "@agentshield/ui";
import { useAuth } from "../context/AuthContext";

export const AutoPolicy: React.FC = () => {
  const { activeProject, client } = useAuth();
  const [proposals, setProposals] = useState<any[]>([]);
  const [activeProposal, setActiveProposal] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const loadProposals = async () => {
    setIsLoading(true);
    try {
      const data = await client.listPolicyProposals(activeProject?.id);
      setProposals(data);
      if (data.length > 0 && !activeProposal) {
        setActiveProposal(data[0]);
      }
    } catch (err) {
      console.warn("Failed to load policy proposals:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, [activeProject?.id]);

  const handleSynthesize = async () => {
    setIsSynthesizing(true);
    try {
      const res = await client.synthesizeAutoPolicy(undefined, undefined, activeProject?.id);
      await loadProposals();
      setActiveProposal(res);
    } catch (err: any) {
      alert(`Synthesis failed: ${err.message || String(err)}`);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleApply = async () => {
    if (!activeProposal) return;
    setIsApplying(true);
    try {
      await client.applyPolicyProposal(activeProposal.id || activeProposal.proposal_id, activeProject?.id);
      setAppliedSuccess(true);
      await loadProposals();
      setTimeout(() => setAppliedSuccess(false), 3000);
    } catch (err: any) {
      alert(`Failed to apply proposal: ${err.message || String(err)}`);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2 text-purple-400 mb-1">
            <Sparkles size={16} />
            <span className="font-chakra text-xs font-bold uppercase tracking-widest">
              Self-Healing AI Security
            </span>
          </div>
          <h1 className="text-2xl font-chakra font-bold tracking-tight text-fg">
            AutoPolicy Synthesizer & Self-Healing
          </h1>
          <p className="text-xs text-mut mt-1">
            Autonomously transforms scan findings and runtime incidents into verifiable OPA Rego rules, test suites, and 1-click patches.
          </p>
        </div>

        <button
          onClick={handleSynthesize}
          disabled={isSynthesizing}
          className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-purple-600 text-white font-chakra text-xs font-bold uppercase tracking-wider hover:bg-purple-500 transition-all disabled:opacity-50"
        >
          {isSynthesizing ? <span className="animate-spin">⟳</span> : <Sparkles size={14} />}
          <span>{isSynthesizing ? "Synthesizing Policy..." : "Synthesize AutoPolicy"}</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Proposals List */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="font-chakra text-xs font-bold uppercase tracking-wider text-mut">
            Generated Proposals ({proposals.length})
          </h2>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-mut font-chakra uppercase animate-pulse">
              Loading Policy Proposals...
            </div>
          ) : proposals.length === 0 ? (
            <Panel>
              <EmptyState
                icon={<Sparkles size={28} className="text-mut" />}
                title="No Proposals Generated"
                description="Click 'Synthesize AutoPolicy' or execute 'agentshield autopolicy' in the terminal to generate self-healing Rego guardrails."
              />
            </Panel>
          ) : (
            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {proposals.map((p) => {
                const isSelected = activeProposal?.id === p.id || activeProposal?.proposal_id === p.id;
                const isApplied = p.status === "applied";
                return (
                  <div
                    key={p.id}
                    onClick={() => setActiveProposal(p)}
                    className={cn(
                      "p-3 rounded-sm border cursor-pointer transition-all",
                      isSelected
                        ? "border-purple-400 bg-purple-950/20 shadow-md"
                        : "border-line bg-panel hover:border-line/80 hover:bg-panel/80"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-chakra text-xs font-bold text-fg truncate">
                        {p.title}
                      </div>
                      <span className={cn(
                        "text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold",
                        isApplied ? "bg-ok/20 text-ok border border-ok/40" : "bg-purple-950 text-purple-400 border border-purple-800"
                      )}>
                        {p.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-mut truncate mt-1">
                      Risk Reduction: {Math.round((p.risk_reduction_score || 0.85) * 100)}%
                    </div>

                    <div className="text-[10px] text-mut/80 mt-2 pt-2 border-t border-line/40">
                      {new Date(p.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Proposal Inspector & 1-Click Apply */}
        <div className="lg:col-span-2 space-y-4">
          {activeProposal ? (
            <>
              {/* Proposal Banner */}
              <Panel>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold bg-purple-950 text-purple-400 border border-purple-800">
                        AutoPolicy v1.0
                      </span>
                      <span className="text-xs font-mono text-ok font-bold">
                        {Math.round((activeProposal.risk_reduction_score || 0.88) * 100)}% Risk Reduction
                      </span>
                    </div>
                    <div className="text-lg font-chakra font-bold text-fg mt-1">
                      {activeProposal.title}
                    </div>
                    <p className="text-xs text-mut mt-1 leading-relaxed">
                      {activeProposal.rationale}
                    </p>
                  </div>

                  <button
                    onClick={handleApply}
                    disabled={isApplying || activeProposal.status === "applied"}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-sm font-chakra text-xs font-bold uppercase tracking-wider transition-all",
                      activeProposal.status === "applied"
                        ? "bg-ok/20 border border-ok/40 text-ok cursor-default"
                        : "bg-ok text-black hover:bg-ok/90"
                    )}
                  >
                    {activeProposal.status === "applied" || appliedSuccess ? (
                      <>
                        <Check size={14} />
                        <span>Policy Deployed</span>
                      </>
                    ) : (
                      <>
                        <Play size={14} />
                        <span>{isApplying ? "Deploying..." : "1-Click Deploy to Runtime"}</span>
                      </>
                    )}
                  </button>
                </div>
              </Panel>

              {/* Synthesized OPA Rego Code */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-chakra font-bold uppercase text-mut">
                  <span>Synthesized OPA Rego Guardrail</span>
                  <span className="font-mono text-[11px] text-purple-400">package agentshield.policy</span>
                </div>
                <div className="rounded border border-line bg-[#0a0d12] p-4 font-mono text-xs text-cyan-300 overflow-x-auto shadow-inner">
                  <pre className="whitespace-pre">{activeProposal.rego_patch}</pre>
                </div>
              </div>

              {/* Automated Rego Unit Tests */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-chakra font-bold uppercase text-mut">
                  <span>Automated Verification Test Suite</span>
                  <span className="font-mono text-[11px] text-ok">package agentshield.policy_test</span>
                </div>
                <div className="rounded border border-line bg-[#0a0d12] p-4 font-mono text-xs text-ok/90 overflow-x-auto shadow-inner">
                  <pre className="whitespace-pre">{activeProposal.rego_tests}</pre>
                </div>
              </div>
            </>
          ) : (
            <Panel>
              <EmptyState
                icon={<Sparkles size={28} className="text-mut" />}
                title="Select a Policy Proposal"
                description="Select an auto-generated policy patch from the left or synthesize a new one from recent scan findings."
              />
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
};
