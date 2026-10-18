import React, { useEffect, useState } from "react";
import {
  Cpu,
  Zap,
  Sliders,
  Activity,
  Layers,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Gauge,
  Sparkles,
  Info,
  Save,
  RotateCcw,
} from "lucide-react";
import {
  Panel,
  RiskMeter,
  VerdictBadge,
  cn,
} from "@agentshield/ui";
import { useAuth } from "../context/AuthContext";
import {
  ModelStatus,
  ModelThresholds,
} from "@agentshield/api-client";

export const Models: React.FC = () => {
  const { activeProject, client } = useAuth();

  const [models, setModels] = useState<ModelStatus[]>([]);
  const [thresholds, setThresholds] = useState<ModelThresholds | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form states for threshold tuning
  const [blockThresh, setBlockThresh] = useState<number>(0.36);
  const [escalateThresh, setEscalateThresh] = useState<number>(0.28);
  const [sanitizeThresh, setSanitizeThresh] = useState<number>(0.16);
  const [killThresh, setKillThresh] = useState<number>(0.95);
  const [isSavingThresh, setIsSavingThresh] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [modelsData, threshData] = await Promise.all([
        client.getModelsStatus(),
        client.getModelThresholds(activeProject?.id),
      ]);
      setModels(modelsData);
      setThresholds(threshData);
      setBlockThresh(threshData.block_threshold);
      setEscalateThresh(threshData.escalate_threshold);
      setSanitizeThresh(threshData.sanitize_threshold);
      setKillThresh(threshData.kill_session_threshold);
    } catch (err: any) {
      console.error("Failed to load model registry data:", err);
      setError(err?.message || "Failed to load model registry");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProject]);

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingThresh(true);
    setSaveSuccess(false);
    try {
      const updated = await client.updateModelThresholds(
        {
          block_threshold: blockThresh,
          escalate_threshold: escalateThresh,
          sanitize_threshold: sanitizeThresh,
          kill_session_threshold: killThresh,
        },
        activeProject?.id
      );
      setThresholds(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Failed to update thresholds:", err);
      alert(`Update failed: ${err?.message || "Unknown error"}`);
    } finally {
      setIsSavingThresh(false);
    }
  };

  const handleResetDefaults = () => {
    setBlockThresh(0.36);
    setEscalateThresh(0.28);
    setSanitizeThresh(0.16);
    setKillThresh(0.95);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-chakra uppercase font-bold text-xs tracking-widest text-ok">
              Defense In Depth
            </span>
            <span className="text-line">&bull;</span>
            <span className="text-xs text-mut font-mono">Calibrated 5-Model Pipeline</span>
          </div>
          <h1 className="text-2xl font-chakra font-bold text-fg uppercase tracking-wider mt-1">
            Detectors & Model Registry
          </h1>
          <p className="text-xs text-mut mt-0.5">
            Monitor ML inference latencies, inspect precision metrics, and dynamically tune enforcement risk cut-offs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-line bg-panel text-xs text-mut hover:text-fg hover:border-mut transition-colors"
            title="Refresh models and metrics"
          >
            <RefreshCw size={13} className={cn(isLoading && "animate-spin")} />
            <span>Refresh Metrics</span>
          </button>
        </div>
      </div>

      {/* Threshold Calibration Card */}
      <Panel
        title="Dynamic Risk Threshold Calibration"
        actions={
          <span className="text-[10px] font-mono text-ok uppercase px-1.5 py-0.5 rounded-sm bg-ok/10 border border-ok/30">
            REAL-TIME ENFORCEMENT
          </span>
        }
        className="border-line"
      >
        <form onSubmit={handleSaveThresholds} className="space-y-6 pt-2">
          <p className="text-xs text-mut leading-relaxed">
            Configure the decision cut-offs for the LightGBM calibrated monotonic risk stacker. Any intercepted tool call with a composite risk score exceeding these thresholds triggers the corresponding action.
          </p>

          {/* Visual Risk Tier Visualizer */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-chakra uppercase text-mut font-semibold">
              Risk Tier Cut-Offs
            </div>
            <div className="h-6 w-full rounded-sm overflow-hidden flex font-mono text-[10px] font-bold text-bg select-none">
              <div
                style={{ width: `${sanitizeThresh * 100}%` }}
                className="bg-ok flex items-center justify-center transition-all truncate px-1"
                title={`Clean: 0.00 - ${sanitizeThresh.toFixed(2)}`}
              >
                ALLOW &lt; {sanitizeThresh.toFixed(2)}
              </div>
              <div
                style={{ width: `${(escalateThresh - sanitizeThresh) * 100}%` }}
                className="bg-info flex items-center justify-center transition-all truncate px-1 text-fg"
                title={`Sanitize: ${sanitizeThresh.toFixed(2)} - ${escalateThresh.toFixed(2)}`}
              >
                SANITIZE
              </div>
              <div
                style={{ width: `${(blockThresh - escalateThresh) * 100}%` }}
                className="bg-warn flex items-center justify-center transition-all truncate px-1 text-bg"
                title={`Escalate: ${escalateThresh.toFixed(2)} - ${blockThresh.toFixed(2)}`}
              >
                ESCALATE
              </div>
              <div
                style={{ width: `${(killThresh - blockThresh) * 100}%` }}
                className="bg-bad flex items-center justify-center transition-all truncate px-1"
                title={`Block: ${blockThresh.toFixed(2)} - ${killThresh.toFixed(2)}`}
              >
                BLOCK
              </div>
              <div
                style={{ width: `${(1.0 - killThresh) * 100}%` }}
                className="bg-purple flex items-center justify-center transition-all truncate px-1"
                title={`Kill Session: ${killThresh.toFixed(2)} - 1.00`}
              >
                TERMINATE
              </div>
            </div>
          </div>

          {/* Sliders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {/* Sanitize Slider */}
            <div className="p-3 bg-panel border border-line rounded-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-chakra uppercase font-bold text-info">
                <span>Sanitize</span>
                <span className="font-mono text-fg">{sanitizeThresh.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.01"
                value={sanitizeThresh}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSanitizeThresh(val);
                  if (val >= escalateThresh) setEscalateThresh(val + 0.05);
                }}
                className="w-full accent-info cursor-pointer"
              />
              <div className="text-[10px] text-mut font-sans">
                Redacts sensitive PII & secrets in arguments.
              </div>
            </div>

            {/* Escalate Slider */}
            <div className="p-3 bg-panel border border-line rounded-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-chakra uppercase font-bold text-warn">
                <span>Escalate</span>
                <span className="font-mono text-fg">{escalateThresh.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.70"
                step="0.01"
                value={escalateThresh}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setEscalateThresh(val);
                  if (val <= sanitizeThresh) setSanitizeThresh(Math.max(0.05, val - 0.05));
                  if (val >= blockThresh) setBlockThresh(val + 0.05);
                }}
                className="w-full accent-warn cursor-pointer"
              />
              <div className="text-[10px] text-mut font-sans">
                Dispatches to Human-in-the-Loop approval queue.
              </div>
            </div>

            {/* Block Slider */}
            <div className="p-3 bg-panel border border-line rounded-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-chakra uppercase font-bold text-bad">
                <span>Block</span>
                <span className="font-mono text-fg">{blockThresh.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.20"
                max="0.85"
                step="0.01"
                value={blockThresh}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setBlockThresh(val);
                  if (val <= escalateThresh) setEscalateThresh(Math.max(0.10, val - 0.05));
                  if (val >= killThresh) setKillThresh(val + 0.05);
                }}
                className="w-full accent-bad cursor-pointer"
              />
              <div className="text-[10px] text-mut font-sans">
                Instantly aborts invocation and records an incident.
              </div>
            </div>

            {/* Kill Session Slider */}
            <div className="p-3 bg-panel border border-line rounded-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-chakra uppercase font-bold text-purple">
                <span>Kill Session</span>
                <span className="font-mono text-fg">{killThresh.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="0.99"
                step="0.01"
                value={killThresh}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setKillThresh(val);
                  if (val <= blockThresh) setBlockThresh(Math.max(0.20, val - 0.05));
                }}
                className="w-full accent-purple cursor-pointer"
              />
              <div className="text-[10px] text-mut font-sans">
                Severe compromise: terminates session entirely.
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-line">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-line rounded-sm text-xs font-chakra uppercase text-mut hover:text-fg hover:border-mut transition-colors"
            >
              <RotateCcw size={12} />
              Reset Defaults (Recommended)
            </button>

            <div className="flex items-center gap-3">
              {saveSuccess && (
                <span className="text-xs font-chakra uppercase text-ok flex items-center gap-1">
                  <ShieldCheck size={14} /> Thresholds Updated Live
                </span>
              )}
              <button
                type="submit"
                disabled={isSavingThresh}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-ok text-bg font-chakra font-bold text-xs uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity"
              >
                <Save size={13} />
                {isSavingThresh ? "Saving..." : "Save Calibration"}
              </button>
            </div>
          </div>
        </form>
      </Panel>

      {/* Model Registry Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="font-chakra font-bold text-base text-fg uppercase tracking-wider">
            Active Defense Pipeline (5 Models + 2 Rule Engines)
          </div>
          <span className="text-xs font-mono text-ok">7 / 7 Online</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((model) => (
            <Panel
              key={model.id}
              className="flex flex-col justify-between hover:border-mut transition-colors"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-line">
                  <div>
                    <div className="text-[10px] font-chakra uppercase font-bold text-ok tracking-wider">
                      {model.type}
                    </div>
                    <div className="font-chakra font-bold text-sm text-fg uppercase tracking-wider mt-0.5">
                      {model.name}
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-sm bg-ok/10 text-ok border border-ok/30 text-[10px] font-mono font-bold uppercase">
                    {model.status}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-mut font-sans mt-2.5 leading-relaxed">
                  {model.description}
                </p>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-line/50 text-xs font-mono">
                  <div className="p-2 bg-panel/60 rounded-sm border border-line/40">
                    <div className="text-[10px] font-chakra uppercase text-mut">Latency (p95)</div>
                    <div className="text-fg font-bold mt-0.5 flex items-center gap-1">
                      <Zap size={11} className="text-ok" />
                      {model.latency_p95_ms} ms
                    </div>
                  </div>

                  <div className="p-2 bg-panel/60 rounded-sm border border-line/40">
                    <div className="text-[10px] font-chakra uppercase text-mut">Accuracy / Conf</div>
                    <div className="text-fg font-bold mt-0.5 flex items-center gap-1">
                      <ShieldCheck size={11} className="text-ok" />
                      {(model.accuracy * 100).toFixed(0)}%
                    </div>
                  </div>

                  <div className="p-2 bg-panel/60 rounded-sm border border-line/40">
                    <div className="text-[10px] font-chakra uppercase text-mut">Threshold</div>
                    <div className="text-fg font-bold mt-0.5 font-mono">
                      {model.threshold.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-2 bg-panel/60 rounded-sm border border-line/40">
                    <div className="text-[10px] font-chakra uppercase text-mut">Compute Target</div>
                    <div className="text-fg font-bold mt-0.5 text-[11px] truncate">
                      {model.device}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-2.5 border-t border-line flex items-center justify-between text-[10px] font-mono text-mut">
                <span>Version: v{model.version}</span>
                <span className="text-ok flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse" />
                  Live Intercept
                </span>
              </div>
            </Panel>
          ))}
        </div>
      </div>
    </div>
  );
};
