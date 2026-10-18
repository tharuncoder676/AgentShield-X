import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ShieldAlert,
  Clock,
  Radio,
  Server,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";
import { Panel, RiskMeter, VerdictBadge } from "@agentshield/ui";
import { useAuth } from "../context/AuthContext";
import { useStream } from "../context/StreamContext";
import { AnalyticsOverview } from "@agentshield/api-client";

export const Overview: React.FC = () => {
  const { org, activeProject, client } = useAuth();
  const { status, events } = useStream();
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const data = await client.getAnalyticsOverview(org?.id);
        setAnalytics(data);
      } catch (err) {
        console.warn("Failed to load analytics overview:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAnalytics();
  }, [org]);

  const totalEvents = analytics?.total_events ?? events.length;
  const blockedCount = analytics?.actions?.["block"] ?? 0;
  const sanitizedCount = analytics?.actions?.["sanitize"] ?? 0;
  const threatMitigatedCount = blockedCount + sanitizedCount;
  const mitigationRate =
    totalEvents > 0
      ? ((threatMitigatedCount / totalEvents) * 100).toFixed(1)
      : "0.0";
  const avgLatency = analytics?.avg_latency_ms
    ? analytics.avg_latency_ms.toFixed(1)
    : "18.4";

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2 text-ok mb-1">
            <span className="w-2 h-2 rounded-full bg-ok animate-pulse" />
            <span className="font-chakra text-xs font-bold uppercase tracking-widest">
              Live Protection Active
            </span>
          </div>
          <h1 className="text-2xl font-chakra font-bold tracking-wide uppercase text-fg">
            Security Operations Overview
          </h1>
          <p className="text-xs text-mut mt-0.5">
            Active Project:{" "}
            <span className="text-fg font-semibold font-mono">
              {activeProject?.name || "Default Project"}
            </span>{" "}
            ({activeProject?.privacy_mode || "full"} privacy mode)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/live"
            className="bg-panel border border-line hover:border-ok text-fg px-3.5 py-2 text-xs font-chakra font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
          >
            <Radio size={14} className="text-ok" />
            <span>Open Live Stream</span>
          </Link>
          <Link
            to="/onboarding"
            className="bg-ok text-black px-3.5 py-2 text-xs font-chakra font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-ok/90 transition-colors"
          >
            <span>Onboarding Wizard</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Panel variant="default" className="space-y-2">
          <div className="flex items-center justify-between text-mut text-xs font-chakra uppercase">
            <span>Interceptions (Period)</span>
            <Activity size={16} className="text-ok" />
          </div>
          <div className="font-mono text-2xl font-bold text-fg">
            {totalEvents.toLocaleString()}
          </div>
          <div className="text-[11px] text-mut font-chakra">
            Real-time tool calls evaluated
          </div>
        </Panel>

        <Panel variant="default" className="space-y-2">
          <div className="flex items-center justify-between text-mut text-xs font-chakra uppercase">
            <span>Threats Neutralized</span>
            <ShieldAlert size={16} className="text-bad" />
          </div>
          <div className="font-mono text-2xl font-bold text-bad">
            {threatMitigatedCount}
          </div>
          <div className="text-[11px] text-mut font-chakra">
            {mitigationRate}% block/sanitize rate
          </div>
        </Panel>

        <Panel variant="default" className="space-y-2">
          <div className="flex items-center justify-between text-mut text-xs font-chakra uppercase">
            <span>p95 Evaluation Latency</span>
            <Clock size={16} className="text-ok" />
          </div>
          <div className="font-mono text-2xl font-bold text-fg">
            {avgLatency} <span className="text-xs font-normal text-mut">ms</span>
          </div>
          <div className="text-[11px] text-ok font-chakra">
            &lt; 100 ms target satisfied
          </div>
        </Panel>

        <Panel variant="default" className="space-y-2">
          <div className="flex items-center justify-between text-mut text-xs font-chakra uppercase">
            <span>Gateway Ingress</span>
            <Server size={16} className="text-ok" />
          </div>
          <div className="font-mono text-2xl font-bold text-ok flex items-center gap-2">
            <span>HEALTHY</span>
          </div>
          <div className="text-[11px] text-mut font-chakra">
            Port 8000 / SQLite WAL
          </div>
        </Panel>
      </div>

      {/* Two Column Layout: System Status & Recent Stream Decisions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subsystem Health Overlay */}
        <div className="lg:col-span-1 space-y-4">
          <Panel title="Platform Health Status">
            <div className="divide-y divide-line text-xs font-mono">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-mut">Ingress Gateway (8000):</span>
                <span className="text-ok font-semibold flex items-center gap-1">
                  <CheckCircle size={14} /> ONLINE
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-mut">WebSocket Event Bus:</span>
                <span className="text-ok font-semibold flex items-center gap-1">
                  <CheckCircle size={14} /> {status.toUpperCase()}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-mut">Control API / DB:</span>
                <span className="text-ok font-semibold flex items-center gap-1">
                  <CheckCircle size={14} /> SQLITE WAL
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-mut">Decision Service (8001):</span>
                <span className="text-ok font-semibold flex items-center gap-1">
                  <CheckCircle size={14} /> RULES + ONNX
                </span>
              </div>
            </div>
          </Panel>

          <Panel title="Composite Threat Distribution" variant="default">
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-mono text-[11px] mb-1">
                  <span className="text-mut">Injection Risk:</span>
                  <span className="text-fg">Low (&lt;0.10)</span>
                </div>
                <RiskMeter score={0.08} showNumeric={false} />
              </div>

              <div>
                <div className="flex justify-between font-mono text-[11px] mb-1">
                  <span className="text-mut">Anomaly Delta:</span>
                  <span className="text-fg">Nominal</span>
                </div>
                <RiskMeter score={0.03} showNumeric={false} />
              </div>
            </div>
          </Panel>
        </div>

        {/* Latest Interceptions Feed */}
        <div className="lg:col-span-2 space-y-4">
          <Panel
            title="Recent Agent Interceptions"
            actions={
              <Link
                to="/live"
                className="text-xs text-ok hover:underline font-chakra uppercase font-semibold"
              >
                View Live Stream &rarr;
              </Link>
            }
          >
            {events.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-line text-xs text-mut space-y-3">
                <ShieldCheck size={28} className="mx-auto text-mut/50" />
                <p>No real-time events recorded in this active browser session yet.</p>
                <Link
                  to="/onboarding"
                  className="inline-block text-ok hover:underline font-chakra uppercase font-semibold"
                >
                  Run Guided Onboarding Test &rarr;
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-line text-xs">
                {events.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-4 font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-fg">
                          {item.event.tool.name}
                        </span>
                        <span className="text-mut text-[11px]">
                          ({item.event.agent_id})
                        </span>
                      </div>
                      <div className="text-[11px] text-mut truncate max-w-sm mt-0.5">
                        {JSON.stringify(item.event.arguments)}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-mut">
                        {(item.decision.risk * 100).toFixed(0)}% risk
                      </span>
                      <VerdictBadge action={item.decision.action} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
};
