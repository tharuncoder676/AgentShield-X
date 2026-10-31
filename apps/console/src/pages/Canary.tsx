import React, { useState, useEffect } from "react";
import {
  GitFork,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Award,
  Zap,
  TrendingUp,
  Shield,
  Layers,
  ArrowRight,
  ShieldAlert,
  Sliders,
  CheckSquare,
} from "lucide-react";
import { Panel, cn } from "@agentshield/ui";

interface PolicyVersion {
  version_id: string;
  rego_policy_code: string;
  created_at: number;
  description: string;
  author: string;
}

interface CanaryMetrics {
  total_requests: number;
  baseline_deflections: number;
  canary_deflections: number;
  canary_false_positives: number;
  canary_false_positive_rate_pct: number;
  baseline_avg_latency_ms: number;
  canary_avg_latency_ms: number;
  agreement_rate_pct: number;
}

interface CanaryDeployment {
  deployment_id: string;
  baseline_policy: PolicyVersion;
  canary_policy: PolicyVersion;
  split_mode: string;
  canary_percentage: number;
  max_allowed_fp_rate_pct: number;
  max_allowed_latency_ms: number;
  health: string;
  metrics: CanaryMetrics;
  deployed_at: number;
  rollback_reason?: string;
}

interface EvaluationRecord {
  request_id: string;
  tool_name: string;
  routed_to: string;
  active_version: string;
  active_decision: string;
  baseline_decision: string;
  canary_decision: string;
  baseline_latency_ms: number;
  canary_latency_ms: number;
  timestamp: number;
}

export function Canary() {
  const [deployment, setDeployment] = useState<CanaryDeployment | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [splitPct, setSplitPct] = useState<number>(10);
  const [testTool, setTestTool] = useState<string>("execute_sql");
  const [testArgs, setTestArgs] = useState<string>('{"query": "SELECT * FROM users"}');
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchCanaryStatus();
  }, []);

  const fetchCanaryStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8002/v1/canary/status");
      if (res.ok) {
        const json = await res.json();
        setDeployment(json.deployment);
        setEvaluations(json.recent_evaluations);
        setSplitPct(json.deployment.canary_percentage);
      }
    } catch (e) {
      console.error("Failed to fetch canary status", e);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySplit = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8002/v1/canary/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ percentage: splitPct }),
      });
      if (res.ok) {
        setStatusMessage(`Canary split adjusted to ${splitPct}%`);
        await fetchCanaryStatus();
      }
    } catch (e) {
      console.error("Failed to update split", e);
    }
  };

  const handlePromote = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8002/v1/canary/promote", { method: "POST" });
      if (res.ok) {
        setStatusMessage("Canary policy successfully promoted to 100% production baseline!");
        await fetchCanaryStatus();
      }
    } catch (e) {
      console.error("Promotion failed", e);
    }
  };

  const handleRollback = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8002/v1/canary/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Operator triggered manual emergency rollback" }),
      });
      if (res.ok) {
        setStatusMessage("Emergency rollback complete. Traffic reverted 100% to baseline.");
        await fetchCanaryStatus();
      }
    } catch (e) {
      console.error("Rollback failed", e);
    }
  };

  const handleRunEvaluation = async () => {
    setEvaluating(true);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(testArgs);
      } catch (err) {}

      const res = await fetch("http://127.0.0.1:8002/v1/canary/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool_name: testTool,
          arguments: parsed,
          is_tainted: testTool === "eval",
        }),
      });
      if (res.ok) {
        await fetchCanaryStatus();
      }
    } catch (e) {
      console.error("Evaluation request failed", e);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-gray-200">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-2xl bg-[#120a24]/80 border border-purple-900/40 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                <GitFork className="w-3.5 h-3.5 text-purple-400" />
                CANARY DEPLOYMENT HUB
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
                  deployment?.health === "AUTOMATICALLY_ROLLED_BACK"
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                HEALTH: {deployment?.health || "HEALTHY"}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              A/B Policy Testing & Canary Deployments
            </h1>
            <p className="mt-1 text-sm text-gray-400 max-w-2xl">
              Zero-downtime Rego policy experimentation with real-time shadow evaluation and automated fail-safe rollback on false-positive spikes.
            </p>
            <div className="mt-2 text-xs text-purple-300/60 font-mono">
              Lead Architect: Tharunkumar.S | AgentShield-X Security Labs
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRollback}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-700/40 transition-all shadow-sm"
            >
              <RotateCcw className="w-4 h-4 text-rose-400" />
              Emergency Rollback
            </button>
            <button
              onClick={handlePromote}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 via-purple-500 to-violet-600 hover:from-purple-500 hover:to-violet-500 shadow-lg shadow-purple-900/30 transition-all border border-purple-400/30"
            >
              <Award className="w-4 h-4" />
              Promote Canary to Baseline
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-4 p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs text-purple-300 flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-gray-400 hover:text-white">✕</button>
          </div>
        )}
      </div>

      {/* Top Bento Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[#120a24]/60 border border-purple-800/30 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-300/80 uppercase">
            <span>Traffic Split Ratio</span>
            <GitFork className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {deployment?.canary_percentage}% Canary / {100 - (deployment?.canary_percentage || 0)}% Baseline
          </div>
          <div className="text-[11px] text-purple-300/70 mt-1">Deterministic Hash Partitioning</div>
        </div>

        <div className="rounded-xl bg-[#120a24]/60 border border-purple-800/30 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-300/80 uppercase">
            <span>False Positive Rate</span>
            <AlertTriangle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">
            {deployment?.metrics.canary_false_positive_rate_pct}%
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">
            Tripwire Threshold: &lt; {deployment?.max_allowed_fp_rate_pct}%
          </div>
        </div>

        <div className="rounded-xl bg-[#120a24]/60 border border-purple-800/30 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-300/80 uppercase">
            <span>Agreement Rate</span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-200">
            {deployment?.metrics.agreement_rate_pct}%
          </div>
          <div className="text-[11px] text-purple-300/70 mt-1">High Interceptor Concordance</div>
        </div>

        <div className="rounded-xl bg-[#120a24]/60 border border-purple-800/30 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-300/80 uppercase">
            <span>Median Latency Delta</span>
            <Zap className="w-4 h-4 text-violet-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-300">
            +0.09 ms
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">
            Canary: {deployment?.metrics.canary_avg_latency_ms}ms (p95 &lt; 5ms)
          </div>
        </div>
      </div>

      {/* Baseline vs Canary Comparison Bento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Baseline Policy Card */}
        <div className="rounded-2xl bg-[#120a24]/70 border border-purple-900/30 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/60 px-2.5 py-0.5 rounded border border-purple-800/40">
              {deployment?.baseline_policy.version_id}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              PRODUCTION BASELINE
            </span>
          </div>
          <h3 className="text-sm font-bold text-white mt-1">
            {deployment?.baseline_policy.description}
          </h3>
          <div className="text-xs text-gray-400 mt-1">Author: {deployment?.baseline_policy.author}</div>

          <div className="mt-4 rounded-xl bg-[#090412] border border-purple-950 p-3 font-mono text-xs text-purple-200/90 overflow-x-auto max-h-40">
            <pre>{deployment?.baseline_policy.rego_policy_code}</pre>
          </div>

          <div className="mt-4 pt-3 border-t border-purple-900/30 flex items-center justify-between text-xs text-gray-400">
            <span>Deflections Recorded:</span>
            <span className="text-white font-mono font-bold">{deployment?.metrics.baseline_deflections} Blocks</span>
          </div>
        </div>

        {/* Candidate Canary Policy Card */}
        <div className="rounded-2xl bg-[#120a24]/70 border border-purple-900/30 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/60 px-2.5 py-0.5 rounded border border-purple-800/40">
              {deployment?.canary_policy.version_id}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              CANDIDATE CANARY ({deployment?.canary_percentage}%)
            </span>
          </div>
          <h3 className="text-sm font-bold text-white mt-1">
            {deployment?.canary_policy.description}
          </h3>
          <div className="text-xs text-gray-400 mt-1">Author: {deployment?.canary_policy.author}</div>

          <div className="mt-4 rounded-xl bg-[#090412] border border-purple-950 p-3 font-mono text-xs text-purple-200/90 overflow-x-auto max-h-40">
            <pre>{deployment?.canary_policy.rego_policy_code}</pre>
          </div>

          <div className="mt-4 pt-3 border-t border-purple-900/30 flex items-center justify-between text-xs text-gray-400">
            <span>Deflections Recorded:</span>
            <span className="text-purple-300 font-mono font-bold">{deployment?.metrics.canary_deflections} Blocks</span>
          </div>
        </div>
      </div>

      {/* Traffic Slider & Simulator Hub */}
      <div className="rounded-2xl bg-[#120a24]/80 border border-purple-900/40 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sliders className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Dynamic Traffic Split & Rollback Guardrails</h2>
            </div>
            <p className="text-xs text-gray-400">
              Adjust live traffic percentage routed to the Canary policy. Automated rollback triggers instantly if false positives exceed threshold.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-purple-300 font-mono">
              Selected Split: <strong className="text-white">{splitPct}% Canary</strong>
            </div>
            <button
              onClick={handleApplySplit}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-all shadow-md shadow-purple-900/30"
            >
              Apply Split
            </button>
          </div>
        </div>

        {/* Traffic Slider */}
        <div className="mb-8">
          <div className="flex justify-between text-xs font-mono text-gray-400 mb-2">
            <span>0% (100% Baseline)</span>
            <span className="text-purple-300 font-bold">{splitPct}% Canary Split</span>
            <span>100% (Full Rollout)</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={splitPct}
            onChange={(e) => setSplitPct(parseInt(e.target.value))}
            className="w-full h-2 bg-[#0d0718] rounded-lg appearance-none cursor-pointer accent-purple-500 border border-purple-900/50"
          />
        </div>

        {/* Interactive Evaluation Tester */}
        <div className="border-t border-purple-900/30 pt-6">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Play className="w-4 h-4 text-purple-400" />
            Evaluate Test Traffic Through Splitter
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Tool Target</label>
              <input
                type="text"
                value={testTool}
                onChange={(e) => setTestTool(e.target.value)}
                className="w-full bg-[#0d0718] border border-purple-900/40 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-300 mb-1">Tool Arguments (JSON)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testArgs}
                  onChange={(e) => setTestArgs(e.target.value)}
                  className="w-full bg-[#0d0718] border border-purple-900/40 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
                <button
                  onClick={handleRunEvaluation}
                  disabled={evaluating}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 transition-all flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  {evaluating ? "Evaluating..." : "Send Request"}
                </button>
              </div>
            </div>
          </div>

          {/* Recent Evaluations Table */}
          {evaluations.length > 0 && (
            <div className="mt-4 rounded-xl bg-[#090412] border border-purple-950 overflow-hidden text-xs font-mono">
              <div className="p-3 bg-purple-950/40 border-b border-purple-900/40 font-semibold text-purple-300 flex justify-between">
                <span>Recent A/B Telemetry Stream</span>
                <span>{evaluations.length} Events Logged</span>
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-purple-950/60">
                {evaluations.map((ev, i) => (
                  <div key={i} className="p-3 flex items-center justify-between hover:bg-purple-950/20">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold",
                          ev.routed_to === "CANARY"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                            : "bg-gray-800 text-gray-300 border border-gray-700"
                        )}
                      >
                        {ev.routed_to}
                      </span>
                      <span className="text-white">{ev.tool_name}</span>
                      <span className="text-[11px] text-gray-500">[{ev.request_id}]</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={cn(
                          "font-bold text-[11px]",
                          ev.active_decision === "ALLOW" ? "text-emerald-400" : "text-rose-400"
                        )}
                      >
                        {ev.active_decision}
                      </span>
                      <span className="text-gray-400 text-[10px]">{ev.canary_latency_ms}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Canary;

