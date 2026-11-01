import React, { useState, useEffect, useRef } from "react";
import {
  Film,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Download,
  Copy,
  Check,
  Zap,
  Terminal,
  Activity,
  Award,
  Layers,
  Sparkles,
  ExternalLink,
  Info,
} from "lucide-react";
import { Panel, cn } from "@agentshield/ui";

interface ForensicFrame {
  frame_index: number;
  offset_ms: number;
  phase: string;
  actor: string;
  headline: string;
  content_payload: string;
  taint_level: string;
  mitre_technique_id?: string;
  mitre_technique_name?: string;
  metadata?: Record<string, any>;
}

interface ForensicTrace {
  incident_id: string;
  attack_name: string;
  target_agent: string;
  total_frames: number;
  total_duration_ms: number;
  severity: string;
  mitre_tactics: string[];
  evidence_root_hash: string;
  frames: ForensicFrame[];
  timestamp: number;
}

export const Forensics: React.FC = () => {
  const [tracesSummary, setTracesSummary] = useState<any[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>("INC-2026-9941");
  const [activeTrace, setActiveTrace] = useState<ForensicTrace | null>(null);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // What-If Simulator state
  const [whatIfMode, setWhatIfMode] = useState<string>("BALANCED");
  const [whatIfResult, setWhatIfResult] = useState<any>(null);
  const [simulatingWhatIf, setSimulatingWhatIf] = useState<boolean>(false);

  // Certificate Modal state
  const [certData, setCertData] = useState<any>(null);
  const [certModalOpen, setCertModalOpen] = useState<boolean>(false);
  const [copiedCert, setCopiedCert] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  // Fetch all trace summaries
  useEffect(() => {
    fetch("http://127.0.0.1:8002/v1/forensics/traces")
      .then((res) => res.json())
      .then((data) => {
        setTracesSummary(data);
        if (data.length > 0 && !selectedIncidentId) {
          setSelectedIncidentId(data[0].incident_id);
        }
      })
      .catch((err) => console.warn("Failed to load forensics traces:", err));
  }, []);

  // Fetch full trace when incident selection changes
  useEffect(() => {
    if (!selectedIncidentId) return;
    setLoading(true);
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);

    fetch(`http://127.0.0.1:8002/v1/forensics/traces/${selectedIncidentId}`)
      .then((res) => res.json())
      .then((data) => {
        setActiveTrace(data);
        setCurrentFrameIndex(0);
        // Default run balanced simulation
        runWhatIfSimulation("BALANCED", data.incident_id);
      })
      .catch((err) => console.error("Failed to load trace details:", err))
      .finally(() => setLoading(false));
  }, [selectedIncidentId]);

  // Autoplay loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentFrameIndex((prev) => {
          if (!activeTrace || prev >= activeTrace.frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1600);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, activeTrace]);

  const runWhatIfSimulation = async (mode: string, incidentId?: string) => {
    setWhatIfMode(mode);
    setSimulatingWhatIf(true);
    try {
      const res = await fetch("http://127.0.0.1:8002/v1/forensics/what-if", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_id: incidentId || selectedIncidentId,
          policy_mode: mode,
        }),
      });
      if (res.ok) {
        setWhatIfResult(await res.json());
      }
    } catch (e) {
      console.error("What-if simulation failed:", e);
    } finally {
      setSimulatingWhatIf(false);
    }
  };

  const handleOpenCert = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8002/v1/forensics/traces/${selectedIncidentId}/certificate`);
      if (res.ok) {
        setCertData(await res.json());
        setCertModalOpen(true);
      }
    } catch (e) {
      console.error("Certificate fetch failed:", e);
    }
  };

  const handleCopyCert = () => {
    if (!certData) return;
    navigator.clipboard.writeText(JSON.stringify(certData, null, 2));
    setCopiedCert(true);
    setTimeout(() => setCopiedCert(false), 2000);
  };

  const currentFrame = activeTrace?.frames[currentFrameIndex];

  return (
    <div className="space-y-6">
      {/* Top Header - AgentShield-X Style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#120a24]/80 border border-purple-500/20 backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.12)]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 text-[10px] font-chakra font-bold rounded bg-purple-950/80 text-purple-300 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
              FEATURE 3: INCIDENT FLIGHT RECORDER
            </span>
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
              WHAT-IF POLICY SIMULATION
            </span>
            <span className="text-purple-400/50">&bull;</span>
            <span className="text-xs text-purple-300/80 font-mono">Frame-by-Frame Attack Theater</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-chakra font-bold uppercase tracking-wider bg-gradient-to-r from-white via-purple-100 to-purple-400 bg-clip-text text-transparent flex items-center gap-2.5">
            <Film className="text-purple-400" size={26} />
            Live Agent Forensics & Attack Replay
          </h1>
          <p className="text-xs text-purple-200/70 font-chakra mt-1 max-w-2xl">
            Immutable session recording and step-by-step forensic flight replay. Inspect prompts, reasoning chains, taint propagation, and MITRE AI techniques with counterfactual What-If simulation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCert}
            className="flex items-center gap-2 px-4 py-2 text-xs font-chakra uppercase font-bold border border-purple-500/30 bg-[#160d2e]/80 text-purple-200 hover:text-white hover:border-purple-400 rounded-lg transition-all backdrop-blur-xl"
          >
            <Lock size={14} className="text-purple-400" />
            Evidence Certificate
          </button>
        </div>
      </div>

      {/* Incident Selection Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {tracesSummary.map((t) => {
          const isSel = selectedIncidentId === t.incident_id;
          return (
            <button
              key={t.incident_id}
              onClick={() => setSelectedIncidentId(t.incident_id)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-chakra font-bold uppercase tracking-wider transition-all border flex items-center gap-2 backdrop-blur-xl",
                isSel
                  ? "bg-purple-950/70 border-purple-400 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                  : "bg-[#120a24]/60 border-purple-500/20 text-purple-300/60 hover:text-white hover:border-purple-400/40"
              )}
            >
              <span>{t.incident_id}</span>
              <span className="text-[10px] font-mono text-purple-400/80">({t.attack_name})</span>
            </button>
          );
        })}
      </div>

      {/* Main Theater Screen & Playback Deck */}
      <div className="p-6 rounded-2xl border border-purple-500/25 bg-[#120a24]/85 backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.15)] space-y-5">
        {/* Playback Controls & Scrubber Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentFrameIndex(0)}
              className="p-2 rounded-lg bg-[#0a0518] border border-purple-500/30 text-purple-300 hover:text-white hover:border-purple-400 transition-colors"
              title="Reset to Frame 1"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={() => setCurrentFrameIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentFrameIndex === 0}
              className="p-2 rounded-lg bg-[#0a0518] border border-purple-500/30 text-purple-300 hover:text-white hover:border-purple-400 transition-colors disabled:opacity-30"
              title="Previous Frame"
            >
              <SkipBack size={14} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 via-purple-500 to-violet-600 hover:from-purple-500 hover:to-fuchsia-600 text-white font-chakra font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.45)] border border-purple-400/30 transition-all"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span>{isPlaying ? "Pause Replay" : "Play Attack"}</span>
            </button>
            <button
              onClick={() =>
                setCurrentFrameIndex((prev) =>
                  activeTrace ? Math.min(activeTrace.frames.length - 1, prev + 1) : prev
                )
              }
              disabled={activeTrace ? currentFrameIndex >= activeTrace.frames.length - 1 : true}
              className="p-2 rounded-lg bg-[#0a0518] border border-purple-500/30 text-purple-300 hover:text-white hover:border-purple-400 transition-colors disabled:opacity-30"
              title="Next Frame"
            >
              <SkipForward size={14} />
            </button>

            <span className="text-xs font-mono text-purple-300 ml-3">
              Frame <strong className="text-white">{currentFrameIndex + 1}</strong> of{" "}
              {activeTrace?.frames.length || 0}
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-purple-300/70">Timeline Offset:</span>
            <span className="text-white font-bold bg-[#0a0518] px-2.5 py-1 rounded border border-purple-500/30">
              +{currentFrame?.offset_ms || 0} ms
            </span>
            <span className="text-purple-300/70">Target Agent:</span>
            <span className="text-purple-300 font-bold">{activeTrace?.target_agent}</span>
          </div>
        </div>

        {/* Timeline Frame Step Scrubber */}
        <div className="grid grid-cols-6 gap-2">
          {activeTrace?.frames.map((frame, idx) => {
            const isCurrent = idx === currentFrameIndex;
            const isPast = idx < currentFrameIndex;
            return (
              <button
                key={idx}
                onClick={() => setCurrentFrameIndex(idx)}
                className={cn(
                  "py-2 px-2.5 rounded-lg border text-left transition-all font-mono text-[11px]",
                  isCurrent
                    ? "bg-purple-900/60 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)] text-white font-bold"
                    : isPast
                    ? "bg-[#0a0518]/70 border-purple-500/30 text-purple-300/80"
                    : "bg-[#0a0518]/30 border-purple-500/10 text-purple-400/40"
                )}
              >
                <div className="flex items-center justify-between text-[10px] uppercase">
                  <span>F{frame.frame_index}</span>
                  <span>+{frame.offset_ms}ms</span>
                </div>
                <div className="truncate mt-0.5">{frame.phase.replace(/_/g, " ")}</div>
              </button>
            );
          })}
        </div>

        {/* Theater Frame Spotlight Display */}
        {currentFrame && (
          <div className="p-6 rounded-xl border border-purple-500/30 bg-[#0a0518]/80 backdrop-blur-xl space-y-4 shadow-[0_0_25px_rgba(168,85,247,0.1)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "text-[10px] font-chakra font-bold uppercase px-2.5 py-0.5 rounded border tracking-wider",
                    currentFrame.phase === "interception_gate"
                      ? "bg-rose-950/70 border-rose-500/50 text-rose-300 animate-pulse"
                      : currentFrame.phase === "mitigation_applied"
                      ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-300"
                      : "bg-purple-950/70 border-purple-500/40 text-purple-300"
                  )}
                >
                  {currentFrame.phase.replace(/_/g, " ")}
                </span>
                <span className="text-purple-400/50">&bull;</span>
                <span className="text-xs font-mono text-purple-200">
                  Actor: <strong className="uppercase text-white">{currentFrame.actor.replace(/_/g, " ")}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                {currentFrame.mitre_technique_id && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 flex items-center gap-1">
                    <ShieldAlert size={12} />
                    <span>MITRE: {currentFrame.mitre_technique_id} ({currentFrame.mitre_technique_name})</span>
                  </span>
                )}
                <span
                  className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded border uppercase",
                    currentFrame.taint_level === "compromised"
                      ? "bg-rose-950/60 border-rose-500 text-rose-300"
                      : currentFrame.taint_level === "suspicious"
                      ? "bg-amber-950/60 border-amber-500 text-amber-300"
                      : "bg-emerald-950/60 border-emerald-500 text-emerald-300"
                  )}
                >
                  Taint: {currentFrame.taint_level}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-chakra font-bold text-white uppercase tracking-wider">
                {currentFrame.headline}
              </h3>
              <pre className="p-4 rounded-xl bg-[#07030e] border border-purple-500/30 text-xs font-mono text-purple-200/90 whitespace-pre-wrap leading-relaxed overflow-x-auto shadow-inner">
                {currentFrame.content_payload}
              </pre>
            </div>

            {currentFrame.metadata && Object.keys(currentFrame.metadata).length > 0 && (
              <div className="flex items-center gap-3 text-[11px] font-mono text-purple-300/70 pt-2 border-t border-purple-500/10">
                <span>Telemetry Invariants:</span>
                <span className="text-purple-200">{JSON.stringify(currentFrame.metadata)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Counterfactual "What-If" Policy Simulator */}
      <div className="p-6 rounded-2xl border border-purple-500/25 bg-[#120a24]/85 backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.12)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
          <div>
            <h2 className="text-base font-chakra font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="text-purple-400" size={16} />
              Counterfactual "What-If" Policy Simulator
            </h2>
            <p className="text-xs text-purple-200/70 mt-0.5">
              Replay this exact attack sequence through alternative policy configurations to evaluate defense sensitivity.
            </p>
          </div>

          {/* Policy Sensitivity Selectors */}
          <div className="flex items-center gap-2">
            {["STRICT", "BALANCED", "PERMISSIVE"].map((mode) => (
              <button
                key={mode}
                onClick={() => runWhatIfSimulation(mode)}
                disabled={simulatingWhatIf}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-chakra font-bold uppercase tracking-wider transition-all border",
                  whatIfMode === mode
                    ? "bg-purple-950/80 border-purple-400 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    : "bg-[#0a0518] border-purple-500/20 text-purple-400/60 hover:text-white"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {whatIfResult && (
          <div
            className={cn(
              "p-4 rounded-xl border font-mono text-xs space-y-2",
              whatIfResult.breach_occurred
                ? "bg-rose-950/40 border-rose-500/50 text-rose-200"
                : "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {whatIfResult.breach_occurred ? (
                  <ShieldAlert size={18} className="text-rose-400" />
                ) : (
                  <ShieldCheck size={18} className="text-emerald-400" />
                )}
                <span className="font-bold uppercase tracking-wider">
                  SIMULATION VERDICT: {whatIfResult.interception_status}
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-current">
                {whatIfResult.breach_occurred ? "BREACH OCCURRED" : "ATTACK DEFLECTED"}
              </span>
            </div>
            <p className="text-xs opacity-90">{whatIfResult.blast_radius_impact}</p>
          </div>
        )}
      </div>

      {/* Cryptographic Evidence Certificate Modal */}
      {certModalOpen && certData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-xl rounded-2xl bg-[#120a24] border border-purple-500/40 shadow-[0_0_50px_rgba(168,85,247,0.3)] p-6 space-y-5 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div className="flex items-center gap-2 text-purple-300 font-chakra font-bold text-sm uppercase">
                <Lock size={16} className="text-purple-400" />
                Cryptographic Evidence Attestation Certificate
              </div>
              <button
                onClick={() => setCertModalOpen(false)}
                className="text-purple-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-[#07030e] border border-purple-500/30 text-purple-200 text-[11px] overflow-x-auto whitespace-pre-wrap max-h-80">
              {JSON.stringify(certData, null, 2)}
            </pre>

            <div className="flex items-center justify-between pt-2 border-t border-purple-500/20">
              <span className="text-[11px] text-purple-300/70">SHA-256 Merkle Chain Non-Repudiation Spec</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCert}
                  className="px-3.5 py-1.5 rounded-lg border border-purple-500/30 bg-[#160d2e] text-purple-200 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  {copiedCert ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedCert ? "Copied" : "Copy Certificate JSON"}</span>
                </button>
                <button
                  onClick={() => setCertModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 text-white font-chakra uppercase font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
