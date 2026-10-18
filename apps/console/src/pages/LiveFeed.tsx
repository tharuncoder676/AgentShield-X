import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Radio,
  Pause,
  Play,
  Trash2,
  Filter,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  Info,
} from "lucide-react";
import {
  DecisionRow,
  Drawer,
  Panel,
  RiskMeter,
  VerdictBadge,
  EmptyState,
} from "@agentshield/ui";
import { useStream, StreamItem } from "../context/StreamContext";

export const LiveFeed: React.FC = () => {
  const { status, events, isPaused, togglePause, clearEvents } = useStream();
  const [filterAction, setFilterAction] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<StreamItem | null>(null);

  const filteredEvents = events.filter((item) => {
    if (filterAction === "all") return true;
    return item.decision.action.toLowerCase() === filterAction.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio
              size={18}
              className={
                status === "connected"
                  ? "text-ok animate-pulse"
                  : "text-warn"
              }
            />
            <h1 className="text-xl font-chakra font-bold tracking-wide uppercase text-fg">
              Real-Time Decision Feed
            </h1>
          </div>
          <p className="text-xs text-mut mt-0.5">
            Streaming live agent tool call interceptions over WebSocket.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={togglePause}
            className={`px-3 py-1.5 text-xs font-chakra font-bold uppercase tracking-wider border flex items-center gap-1.5 transition-colors ${
              isPaused
                ? "bg-warn/10 border-warn text-warn hover:bg-warn/20"
                : "bg-panel border-line text-fg hover:bg-line/20"
            }`}
          >
            {isPaused ? (
              <>
                <Play size={14} />
                <span>Resume Feed</span>
              </>
            ) : (
              <>
                <Pause size={14} />
                <span>Pause Feed</span>
              </>
            )}
          </button>

          <button
            onClick={clearEvents}
            disabled={events.length === 0}
            className="px-3 py-1.5 text-xs font-chakra uppercase border border-line bg-panel text-mut hover:text-fg hover:bg-line/20 flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Trash2 size={14} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-chakra uppercase">
        <span className="text-mut flex items-center gap-1 shrink-0">
          <Filter size={12} />
          <span>Action:</span>
        </span>
        {["all", "allow", "sanitize", "block", "escalate", "kill_session"].map(
          (act) => (
            <button
              key={act}
              onClick={() => setFilterAction(act)}
              className={`px-2.5 py-1 border transition-colors ${
                filterAction === act
                  ? "bg-line/40 border-ok text-ok font-bold"
                  : "bg-panel border-line text-mut hover:text-fg hover:border-line/80"
              }`}
            >
              {act}
            </button>
          )
        )}
      </div>

      {/* Decision Rows Feed */}
      {filteredEvents.length === 0 ? (
        <EmptyState
          title={
            events.length === 0
              ? "Awaiting Live Tool Calls"
              : "No Decisions Match Current Filter"
          }
          description={
            events.length === 0
              ? "Run your agent SDK or the onboarding verification test to observe live tool interceptions streaming in real time."
              : "Try switching the action filter back to 'all' to view the entire streaming queue."
          }
        />
      ) : (
        <div className="space-y-2">
          {filteredEvents.map((item) => {
            const argsSummary = JSON.stringify(item.event.arguments || {});
            return (
              <DecisionRow
                key={item.id}
                id={item.id}
                timestamp={item.timestamp}
                agentId={item.event.agent_id}
                sessionId={item.event.session_id}
                step={item.event.step}
                toolName={item.event.tool.name}
                argumentsSummary={
                  argsSummary.length > 70
                    ? `${argsSummary.slice(0, 70)}...`
                    : argsSummary
                }
                action={item.decision.action}
                risk={item.decision.risk}
                reasons={item.decision.reasons}
                latencyMs={item.decision.latency_ms}
                degraded={item.decision.degraded}
                selected={selectedItem?.id === item.id}
                onClick={() => setSelectedItem(item)}
              />
            );
          })}
        </div>
      )}

      {/* Decision Detail Drawer */}
      <Drawer
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={
          <div className="flex items-center gap-2">
            <span>Decision Detail</span>
            {selectedItem && (
              <VerdictBadge
                action={selectedItem.decision.action}
                size="sm"
              />
            )}
          </div>
        }
        subtitle={
          selectedItem
            ? `Event ID: ${selectedItem.event.event_id}`
            : undefined
        }
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-6 text-xs">
            {/* Direct Incident Escalation Banner if Blocked / High-Risk */}
            {(["block", "escalate", "kill_session"].includes(selectedItem.decision.action) ||
              selectedItem.decision.risk >= 0.7) && (
              <div className="p-3 bg-bad/10 border border-bad/40 rounded-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={16} className="text-bad shrink-0 animate-pulse" />
                  <div>
                    <div className="font-chakra uppercase font-bold text-bad text-xs">
                      Critical Security Intervention
                    </div>
                    <div className="text-[11px] text-mut font-sans">
                      An incident dossier has been automatically opened for this interception.
                    </div>
                  </div>
                </div>
                <Link
                  to="/incidents"
                  className="px-3 py-1.5 bg-bad text-bg font-chakra uppercase font-bold text-xs tracking-wider rounded-sm hover:opacity-90 shrink-0 transition-opacity"
                >
                  View Dossier
                </Link>
              </div>
            )}

            {/* Risk Breakdown Panel */}
            <Panel title="Risk Score & Assessment" variant="default">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-chakra uppercase text-mut">Composite Risk:</span>
                  <span className="font-mono text-sm font-bold">
                    {(selectedItem.decision.risk * 100).toFixed(1)}%
                  </span>
                </div>
                <RiskMeter score={selectedItem.decision.risk} showNumeric={false} />

                {/* Sub-detector breakdowns */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-line text-[11px] font-mono">
                  <div>
                    <span className="text-mut">Injection: </span>
                    <span className="text-fg font-semibold">
                      {(selectedItem.decision.risk_breakdown.injection * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-mut">Anomaly: </span>
                    <span className="text-fg font-semibold">
                      {(selectedItem.decision.risk_breakdown.anomaly * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-mut">Intent: </span>
                    <span className="text-fg font-semibold">
                      {(selectedItem.decision.risk_breakdown.intent_mismatch * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-mut">Exfil: </span>
                    <span className="text-fg font-semibold">
                      {(selectedItem.decision.risk_breakdown.exfil * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-mut">Taint: </span>
                    <span className="text-fg font-semibold">
                      {(selectedItem.decision.risk_breakdown.taint * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-mut">Honeytool: </span>
                    <span className="text-fg font-semibold">
                      {(selectedItem.decision.risk_breakdown.honey * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </Panel>

            {/* Fired Reasons */}
            {selectedItem.decision.reasons && selectedItem.decision.reasons.length > 0 && (
              <Panel title="Fired Rule / Model Reasons" variant="default">
                <div className="space-y-2">
                  {selectedItem.decision.reasons.map((r, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-bad/10 border border-bad/30 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-chakra font-bold text-bad">
                          {r.code}
                        </span>
                        <span className="text-[10px] font-mono text-mut">
                          DETECTOR: {r.detector}
                        </span>
                      </div>
                      <p className="text-fg/90 font-mono text-[11px] leading-relaxed">
                        {r.evidence}
                      </p>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {/* Tool & Arguments */}
            <Panel title="Tool Ingress Specification">
              <div className="space-y-2">
                <div className="flex justify-between font-mono pb-1 border-b border-line">
                  <span className="text-mut">Tool Name:</span>
                  <span className="text-ok font-bold">{selectedItem.event.tool.name}</span>
                </div>
                <div className="flex justify-between font-mono pb-1 border-b border-line">
                  <span className="text-mut">Sensitivity:</span>
                  <span className="text-fg uppercase">{selectedItem.event.tool.sensitivity}</span>
                </div>
                <div className="flex justify-between font-mono pb-1 border-b border-line">
                  <span className="text-mut">Latency:</span>
                  <span className="text-fg">{selectedItem.decision.latency_ms} ms</span>
                </div>
                <div className="pt-2">
                  <span className="text-mut font-chakra uppercase block mb-1">
                    Arguments Payload:
                  </span>
                  <pre className="p-3 bg-bg border border-line font-mono text-[11px] overflow-x-auto">
                    {JSON.stringify(selectedItem.event.arguments, null, 2)}
                  </pre>
                </div>
              </div>
            </Panel>

            {/* Context Segments & Taint */}
            {selectedItem.event.context_segments && selectedItem.event.context_segments.length > 0 && (
              <Panel title="Context Segments & Provenance">
                <div className="space-y-2">
                  {selectedItem.event.context_segments.map((seg) => (
                    <div key={seg.id} className="p-2.5 bg-bg border border-line space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-fg font-semibold">
                          {seg.id} ({seg.source})
                        </span>
                        <span
                          className={`px-1.5 py-0.2 font-mono uppercase text-[10px] ${
                            seg.trust === "untrusted"
                              ? "bg-bad/20 text-bad border border-bad/30"
                              : "bg-line/40 text-mut"
                          }`}
                        >
                          {seg.trust}
                        </span>
                      </div>
                      {seg.text && (
                        <p className="text-mut font-mono text-[11px]">{seg.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};
