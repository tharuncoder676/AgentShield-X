import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  PlayCircle,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Terminal,
  Database,
  FileText,
  Sliders,
  CheckCircle2,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import {
  Panel,
  RiskMeter,
  VerdictBadge,
  EmptyState,
  cn,
} from "@agentshield/ui";
import { useAuth } from "../context/AuthContext";
import {
  SessionDetail,
  SessionStep,
  SessionReplayResponse,
} from "@agentshield/api-client";

export const SessionDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { client } = useAuth();

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Replay Simulator state
  const [overridePolicy, setOverridePolicy] = useState<string>("strict");
  const [strictMode, setStrictMode] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [replayResult, setReplayResult] = useState<SessionReplayResponse | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const loadSession = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await client.getSession(id);
      setSession(data);
      if (data.steps.length > 0) {
        // Auto-select first blocked step or first step
        const blockedIdx = data.steps.findIndex((s) => s.action in ["block", "kill_session"]);
        setSelectedStepIndex(blockedIdx >= 0 ? blockedIdx : 0);
      }
    } catch (err: any) {
      console.error("Failed to load session details:", err);
      setError(err?.message || "Failed to fetch session");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [id]);

  const handleReplay = async () => {
    if (!id) return;
    setIsSimulating(true);
    try {
      const res = await client.replaySession(id, {
        override_policy: overridePolicy,
        strict_mode: strictMode,
      });
      setReplayResult(res);
    } catch (err: any) {
      console.error("Replay simulation failed:", err);
      alert(`Simulation failed: ${err?.message || "Unknown error"}`);
    } finally {
      setIsSimulating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center">
        <div className="inline-flex items-center gap-2 font-chakra uppercase text-xs tracking-wider text-mut">
          <RefreshCw size={14} className="animate-spin text-ok" />
          <span>Loading Session State Replay #{id}...</span>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="space-y-4 max-w-lg mx-auto py-12">
        <div className="p-6 border border-bad/40 bg-bad/5 text-center text-xs text-bad rounded-sm">
          <ShieldAlert size={24} className="mx-auto mb-2 text-bad" />
          <p className="font-chakra uppercase font-bold text-sm">Session Not Found</p>
          <p className="font-mono text-mut mt-1">{error || `No session found for ID ${id}`}</p>
          <div className="mt-4">
            <Link
              to="/sessions"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-panel border border-line text-xs font-chakra uppercase font-bold text-fg hover:bg-line/20"
            >
              <ArrowLeft size={12} />
              <span>Return to Sessions</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStep: SessionStep | undefined = session.steps[selectedStepIndex];

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-2 text-xs font-chakra uppercase text-mut">
          <Link to="/sessions" className="hover:text-fg transition-colors flex items-center gap-1">
            <ArrowLeft size={12} />
            <span>Sessions</span>
          </Link>
          <span>/</span>
          <span className="font-mono text-fg">{session.session_id}</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-chakra font-bold tracking-wide uppercase text-fg">
                Session Replay: {session.session_id}
              </h1>

              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-sm text-xs font-chakra uppercase font-bold tracking-wider border",
                  session.status === "blocked"
                    ? "border-bad/60 bg-bad/20 text-bad"
                    : session.status === "tainted"
                    ? "border-warn/60 bg-warn/20 text-warn"
                    : "border-ok/40 bg-ok/10 text-ok"
                )}
              >
                {session.status}
              </span>

              <span className="text-xs font-mono text-mut">
                Agent: <span className="text-fg font-semibold">{session.agent_id || "default"}</span>
              </span>
            </div>

            <p className="text-xs text-mut font-mono mt-1">
              Started: {session.started_at ? new Date(session.started_at).toLocaleString() : "N/A"} • Total Turns:{" "}
              <span className="text-fg font-semibold">{session.step_count}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadSession}
              className="px-3 py-1.5 border border-line bg-panel text-xs font-chakra uppercase text-mut hover:text-fg flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw size={13} />
              <span>Reload</span>
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Scrubber Bar */}
      <Panel title="Chronological Turn Scrubber" variant="default">
        <div className="space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {session.steps.map((step, idx) => {
              const isSelected = selectedStepIndex === idx;
              const isBlocked = ["block", "kill_session"].includes(step.action);
              const isSanitized = step.action === "sanitize";
              const isTainted = step.taint.length > 0;

              return (
                <button
                  key={step.event_id}
                  onClick={() => setSelectedStepIndex(idx)}
                  className={cn(
                    "flex flex-col items-start p-2.5 rounded-sm border min-w-[130px] text-left transition-all font-mono text-xs shrink-0",
                    isSelected
                      ? "ring-2 ring-ok ring-offset-1 ring-offset-bg border-ok bg-ok/10"
                      : "border-line bg-bg hover:bg-line/20",
                    isBlocked && !isSelected && "border-bad/60 bg-bad/5",
                    isTainted && !isBlocked && !isSelected && "border-warn/50 bg-warn/5"
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-chakra uppercase font-bold text-[11px] text-fg">
                      Step {step.step}
                    </span>
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        isBlocked
                          ? "bg-bad animate-pulse"
                          : isSanitized
                          ? "bg-warn"
                          : isTainted
                          ? "bg-warn"
                          : "bg-ok"
                      )}
                    />
                  </div>

                  <div className="font-semibold text-fg truncate w-full" title={step.tool_name}>
                    {step.tool_name}
                  </div>

                  <div className="text-[10px] text-mut uppercase font-chakra mt-1">
                    {step.action} ({(step.risk * 100).toFixed(0)}%)
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-mut font-sans">
            Click any step to inspect the exact prompt context, arguments payload, and security detector reasons.
          </p>
        </div>
      </Panel>

      {/* Main Grid: Left = Step Forensic Inspector, Right = Policy Replay Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Step State Inspection (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {currentStep ? (
            <>
              {/* Step Summary Panel */}
              <Panel
                title={
                  <div className="flex items-center gap-2">
                    <Terminal size={15} className="text-ok" />
                    <span>
                      Step {currentStep.step}: Tool Call ({currentStep.tool_name})
                    </span>
                  </div>
                }
                actions={<VerdictBadge action={currentStep.action} size="sm" />}
                variant={["block", "kill_session"].includes(currentStep.action) ? "critical" : "default"}
              >
                <div className="space-y-4">
                  {/* Tool Arguments */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-chakra uppercase text-xs font-semibold text-mut">
                        Tool Arguments Payload
                      </span>
                      <button
                        onClick={() => handleCopy("args", JSON.stringify(currentStep.arguments, null, 2))}
                        className="text-[11px] text-mut hover:text-fg font-mono flex items-center gap-1"
                      >
                        {copiedKey === "args" ? <Check size={11} className="text-ok" /> : <Copy size={11} />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-bg border border-line rounded-sm font-mono text-xs text-fg overflow-x-auto max-h-48">
                      {JSON.stringify(currentStep.arguments, null, 2)}
                    </pre>
                  </div>

                  {/* Context Segments */}
                  {currentStep.context_segments.length > 0 && (
                    <div>
                      <span className="font-chakra uppercase text-xs font-semibold text-mut block mb-1.5">
                        Inbound Context Segments ({currentStep.context_segments.length})
                      </span>
                      <div className="space-y-2">
                        {currentStep.context_segments.map((seg: any) => {
                          const isTainted = currentStep.taint.includes(seg.id) || seg.trust === "untrusted";
                          return (
                            <div
                              key={seg.id}
                              className={cn(
                                "p-2.5 rounded-sm border font-mono text-xs space-y-1",
                                isTainted
                                  ? "border-bad/40 bg-bad/5 text-fg"
                                  : "border-line bg-bg text-mut"
                              )}
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-fg">
                                  {seg.id} ({seg.source})
                                </span>
                                <span
                                  className={cn(
                                    "px-1.5 py-0.2 uppercase text-[10px] rounded-sm font-chakra font-bold",
                                    isTainted ? "bg-bad/20 text-bad" : "bg-line/40 text-mut"
                                  )}
                                >
                                  {isTainted ? "TAINTED" : seg.trust}
                                </span>
                              </div>
                              {seg.text && (
                                <p className="text-[11px] text-mut whitespace-pre-wrap">{seg.text}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Decision Reasons */}
                  {currentStep.reasons.length > 0 && (
                    <div>
                      <span className="font-chakra uppercase text-xs font-semibold text-mut block mb-1.5">
                        Interception Reasons & Detectors
                      </span>
                      <div className="space-y-1.5 font-mono text-xs">
                        {currentStep.reasons.map((r: any, idx: number) => (
                          <div key={idx} className="p-2 bg-bg border border-line rounded-sm space-y-0.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-bad font-semibold">{r.code}</span>
                              <span className="text-mut uppercase text-[10px]">
                                Detector: {r.detector}
                              </span>
                            </div>
                            {r.evidence && (
                              <p className="text-[11px] text-mut">{r.evidence}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Panel>
            </>
          ) : (
            <div className="p-8 text-center border border-line bg-panel text-mut text-xs">
              Select a step from the scrubber above.
            </div>
          )}
        </div>

        {/* Right Column: Policy Replay & Counterfactual Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Panel
            title={
              <div className="flex items-center gap-2">
                <Sliders size={15} className="text-ok" />
                <span>Replay Simulator</span>
              </div>
            }
            subtitle="Dry-run this session under alternative security policies"
            variant="default"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-chakra uppercase font-semibold text-fg mb-1.5">
                  Simulation Policy Variant
                </label>
                <select
                  value={overridePolicy}
                  onChange={(e) => setOverridePolicy(e.target.value)}
                  className="w-full bg-bg border border-line px-3 py-2 rounded-sm text-xs font-mono text-fg focus:outline-none focus:border-ok"
                >
                  <option value="strict">Strict Guardrail (Zero-Tolerance Taint & Sensitive Tools)</option>
                  <option value="permissive">Permissive Mode (Auditing only, unblock benign tools)</option>
                  <option value="default">Default Production Guardrail</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-bg border border-line rounded-sm">
                <div>
                  <span className="text-xs font-chakra uppercase font-bold text-fg block">
                    Zero-Taint Strict Mode
                  </span>
                  <span className="text-[11px] text-mut font-sans">
                    Block immediately if any untrusted context touched the prompt
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={strictMode}
                  onChange={(e) => setStrictMode(e.target.checked)}
                  className="w-4 h-4 rounded-none accent-ok cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={handleReplay}
                disabled={isSimulating}
                className="w-full py-2 bg-ok text-bg font-chakra uppercase font-bold text-xs tracking-wider rounded-sm hover:opacity-90 flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
              >
                <Zap size={14} className={isSimulating ? "animate-spin" : ""} />
                <span>{isSimulating ? "Simulating Policy Replay..." : "Run Replay Simulation"}</span>
              </button>

              {/* Replay Simulation Results */}
              {replayResult && (
                <div className="pt-4 border-t border-line space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-chakra uppercase font-bold text-xs text-fg">
                      Simulation Diff
                    </span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-sm text-[10px] font-chakra uppercase font-bold",
                        replayResult.changed_steps > 0
                          ? "bg-warn/20 text-warn border border-warn/40"
                          : "bg-ok/20 text-ok border border-ok/40"
                      )}
                    >
                      {replayResult.changed_steps} Verdicts Changed
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 bg-bg border border-line rounded-sm">
                      <span className="text-mut text-[10px] block">ORIGINAL BLOCKS</span>
                      <span className="text-fg font-bold text-sm">
                        {replayResult.original_blocked_steps}
                      </span>
                    </div>
                    <div className="p-2 bg-bg border border-line rounded-sm">
                      <span className="text-mut text-[10px] block">SIMULATED BLOCKS</span>
                      <span className="text-bad font-bold text-sm">
                        {replayResult.simulated_blocked_steps}
                      </span>
                    </div>
                  </div>

                  {/* Step Diffs */}
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {replayResult.step_diffs.map((diff) => (
                      <div
                        key={diff.step}
                        className={cn(
                          "p-2 rounded-sm border text-xs font-mono",
                          diff.action_changed
                            ? "border-warn/60 bg-warn/5"
                            : "border-line bg-bg"
                        )}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-fg">
                            Step {diff.step}: {diff.tool_name}
                          </span>
                          <div className="flex items-center gap-1 font-chakra uppercase font-bold text-[10px]">
                            <span className="text-mut">{diff.original_action}</span>
                            <span>&rarr;</span>
                            <span className={diff.action_changed ? "text-warn" : "text-fg"}>
                              {diff.simulated_action}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};
