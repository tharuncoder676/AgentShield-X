import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  Shield,
  Activity,
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  Calendar,
  Compass,
  RefreshCw,
  Target,
} from "lucide-react";
import { Panel, cn } from "@agentshield/ui";

interface ForecastDataPoint {
  hour_offset: number;
  timestamp_iso: string;
  projected_attacks_p50: number;
  bound_p10: number;
  bound_p90: number;
  confidence_pct: number;
  risk_level: string;
}

interface HighRiskWindow {
  window_id: string;
  start_utc: string;
  end_utc: string;
  predicted_surge_pct: number;
  dominant_attack_vector: string;
  recommended_mitigation: string;
}

interface AgentRiskForecast {
  agent_id: string;
  agent_name: string;
  target_probability_pct: number;
  predicted_threat_vectors: string[];
  forecasted_risk_tier: string;
}

interface ForecastSummary {
  forecast_period: string;
  total_projected_attacks_24h: number;
  peak_hourly_volume: number;
  model_architecture: string;
  mean_model_confidence_pct: number;
  hourly_projection: ForecastDataPoint[];
  high_risk_windows: HighRiskWindow[];
  agent_vulnerability_forecast: AgentRiskForecast[];
}

export function Forecasting() {
  const [data, setData] = useState<ForecastSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchForecast();
  }, []);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const res = await fetch("/v1/forecasting/summary");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to fetch forecast summary", e);
    } finally {
      setLoading(false);
    }
  };

  const peak = data?.peak_hourly_volume || 150;

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-gray-200">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-2xl bg-[#120a24]/80 border border-purple-900/40 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                <Compass className="w-3.5 h-3.5 text-purple-400" />
                PREDICTIVE AI THREAT RADAR
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ENSEMBLE ACTIVE ({data?.mean_model_confidence_pct || 89.5}% CONFIDENCE)
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Predictive Threat Forecasting
            </h1>
            <p className="mt-1 text-sm text-gray-400 max-w-2xl">
              Forward-looking 24-hour and 7-day adversarial attack projections using Holt-Winters seasonal decomposition and autoregressive neural networks.
            </p>
            <div className="mt-2 text-xs text-purple-300/60 font-mono">
              Lead Architect: Tharunkumar.S | AgentShield-X Security Labs
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchForecast}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-purple-200 bg-purple-950/40 hover:bg-purple-900/40 border border-purple-700/40 transition-all shadow-sm"
            >
              <RefreshCw className="w-4 h-4 text-purple-400" />
              Recalculate Projections
            </button>
          </div>
        </div>
      </div>

      {/* Top Bento Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[#120a24]/60 border border-purple-800/30 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-300/80 uppercase">
            <span>24h Projected Attacks</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {data ? data.total_projected_attacks_24h.toLocaleString() : "1,617"} Attacks
          </div>
          <div className="text-[11px] text-purple-300/70 mt-1">Holt-Winters Seasonal Median</div>
        </div>

        <div className="rounded-xl bg-[#120a24]/60 border border-purple-800/30 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-300/80 uppercase">
            <span>Peak Hourly Surge</span>
            <Zap className="w-4 h-4 text-violet-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-200">
            {data ? data.peak_hourly_volume : "121"} / Hour
          </div>
          <div className="text-[11px] text-rose-400 mt-1">Surge Window Detected</div>
        </div>

        <div className="rounded-xl bg-[#120a24]/60 border border-purple-800/30 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-300/80 uppercase">
            <span>Ensemble Confidence</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">
            {data ? data.mean_model_confidence_pct : "89.5"}%
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">p10 - p90 Prediction Bounds</div>
        </div>

        <div className="rounded-xl bg-[#120a24]/60 border border-purple-800/30 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-300/80 uppercase">
            <span>High-Risk Windows</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-300">
            {data?.high_risk_windows.length || 2} Imminent
          </div>
          <div className="text-[11px] text-purple-300/70 mt-1">Pre-emptive Guardrail Enforced</div>
        </div>
      </div>

      {/* 24-Hour Forward-Looking Threat Volume Chart Bento */}
      <div className="rounded-2xl bg-[#120a24]/80 border border-purple-900/40 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold text-white">24-Hour Forward-Looking Attack Volume Curve</h2>
            </div>
            <p className="text-xs text-gray-400">
              Projected attack frequency by hour. Purple bars show median projection (p50); glowing caps show upper uncertainty bound (p90).
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-gray-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" /> Normal
            </span>
            <span className="flex items-center gap-1.5 text-purple-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-violet-400" /> Elevated
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Surge
            </span>
          </div>
        </div>

        {/* 24 Hourly Bar Timeline */}
        <div className="pt-8 pb-2 overflow-x-auto">
          <div className="min-w-[700px] flex items-end justify-between gap-2 h-48 border-b border-purple-900/40 px-2">
            {(data?.hourly_projection || []).map((pt) => {
              const heightPct = Math.max(12, Math.min(100, (pt.projected_attacks_p50 / peak) * 100));
              return (
                <div key={pt.hour_offset} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 border border-purple-800 text-[10px] font-mono text-purple-200 px-2 py-1 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none">
                    {pt.timestamp_iso}: {pt.projected_attacks_p50} attacks ({pt.bound_p10}-{pt.bound_p90})
                  </div>

                  {/* Upper bound marker */}
                  <div
                    className="w-full flex justify-center mb-1"
                    style={{ height: `${heightPct}%` }}
                  >
                    <div
                      className={cn(
                        "w-full rounded-t-md transition-all duration-500",
                        pt.risk_level === "HIGH"
                          ? "bg-gradient-to-t from-purple-600 via-rose-500 to-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                          : pt.risk_level === "ELEVATED"
                          ? "bg-gradient-to-t from-purple-800 to-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                          : "bg-purple-900/60 hover:bg-purple-800/80"
                      )}
                    />
                  </div>

                  <span className="text-[9px] font-mono text-gray-500 mt-2 truncate w-full text-center">
                    {pt.timestamp_iso.replace(" UTC", "")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* High-Risk Windows & Targeted Agent Assets Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Risk Time Windows */}
        <div className="rounded-2xl bg-[#120a24]/70 border border-purple-900/30 p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Identified High-Risk Surge Windows</h2>
          </div>
          <p className="text-xs text-gray-400 mb-5">
            Temporal attack clusters forecasted with anomalous off-peak threat concentrations.
          </p>

          <div className="space-y-3.5">
            {(data?.high_risk_windows || []).map((win) => (
              <div
                key={win.window_id}
                className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/30 hover:border-purple-700/40 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded bg-purple-900/40 border border-purple-700/40">
                      {win.start_utc} - {win.end_utc}
                    </span>
                    <span className="text-xs font-bold text-rose-400">+{win.predicted_surge_pct}% Surge</span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-300/80">{win.window_id}</span>
                </div>

                <div className="text-xs text-gray-300">
                  <strong className="text-purple-300">Dominant Vector:</strong> {win.dominant_attack_vector}
                </div>

                <div className="text-[11px] text-gray-400 bg-[#0d0718] p-2.5 rounded-lg border border-purple-950">
                  <strong className="text-emerald-400">Automated Countermeasure:</strong> {win.recommended_mitigation}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Targeted Agent Vulnerabilities */}
        <div className="rounded-2xl bg-[#120a24]/70 border border-purple-900/30 p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Forecasted Agent Vulnerability Index</h2>
          </div>
          <p className="text-xs text-gray-400 mb-5">
            Probabilistic targeting likelihood per production agent asset across the next 7-day window.
          </p>

          <div className="space-y-3">
            {(data?.agent_vulnerability_forecast || []).map((agent) => (
              <div
                key={agent.agent_id}
                className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-900/30 hover:border-purple-700/40 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">{agent.agent_name}</div>
                    <div className="text-[10px] text-purple-400 font-mono">{agent.agent_id}</div>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                      agent.forecasted_risk_tier === "CRITICAL"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : agent.forecasted_risk_tier === "HIGH"
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    )}
                  >
                    {agent.forecasted_risk_tier} RISK
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>Targeting Probability</span>
                    <span className="font-mono text-purple-200 font-bold">{agent.target_probability_pct}%</span>
                  </div>
                  <div className="w-full bg-purple-950/60 rounded-full h-1.5 overflow-hidden border border-purple-900/40">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-rose-400 h-1.5 rounded-full"
                      style={{ width: `${agent.target_probability_pct}%` }}
                    />
                  </div>
                </div>

                <div className="text-[10px] text-gray-400 font-mono flex flex-wrap gap-1.5 pt-1">
                  {agent.predicted_threat_vectors.map((vec, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-[#0d0718] border border-purple-950 text-purple-300">
                      {vec}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Forecasting;

