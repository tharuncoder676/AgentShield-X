import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Cpu,
  Power,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Terminal,
  Globe,
  Database,
  HardDrive,
  Key,
  PlayCircle,
  Clock,
} from "lucide-react";
import {
  Panel,
  RiskMeter,
  EmptyState,
  cn,
} from "@agentshield/ui";
import { useAuth } from "../context/AuthContext";
import { Agent, SessionSummary } from "@agentshield/api-client";

export const AgentDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { client } = useAuth();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isTogglingKillSwitch, setIsTogglingKillSwitch] = useState<boolean>(false);

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [agentData, sessionData] = await Promise.all([
        client.getAgent(id),
        client.listSessions(undefined, id),
      ]);
      setAgent(agentData);
      setSessions(sessionData);
    } catch (err: any) {
      console.error("Failed to load agent details:", err);
      setError(err?.message || "Failed to load agent");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleToggleKillSwitch = async () => {
    if (!agent) return;
    const willSuspend = agent.status === "active";
    const confirmMsg = willSuspend
      ? `EMERGENCY ACTION: Are you sure you want to suspend agent '${agent.name}'? All incoming tool calls from this agent will be blocked instantly.`
      : `Re-activate agent '${agent.name}'?`;

    if (!window.confirm(confirmMsg)) return;

    setIsTogglingKillSwitch(true);
    try {
      const updated = await client.toggleKillSwitch(agent.id, {
        suspended: willSuspend,
        reason: willSuspend ? "Manual kill-switch triggered" : "Re-activated",
      });
      setAgent(updated);
    } catch (err: any) {
      console.error("Failed to toggle kill switch:", err);
      alert(`Kill switch failed: ${err?.message || "Unknown error"}`);
    } finally {
      setIsTogglingKillSwitch(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center">
        <div className="inline-flex items-center gap-2 font-chakra uppercase text-xs tracking-wider text-mut">
          <RefreshCw size={14} className="animate-spin text-ok" />
          <span>Loading Agent Security Matrix #{id}...</span>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="space-y-4 max-w-lg mx-auto py-12">
        <div className="p-6 border border-bad/40 bg-bad/5 text-center text-xs text-bad rounded-sm">
          <ShieldAlert size={24} className="mx-auto mb-2 text-bad" />
          <p className="font-chakra uppercase font-bold text-sm">Agent Not Found</p>
          <p className="font-mono text-mut mt-1">{error || `No agent found for ID ${id}`}</p>
          <div className="mt-4">
            <Link
              to="/agents"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-panel border border-line text-xs font-chakra uppercase font-bold text-fg hover:bg-line/20"
            >
              <ArrowLeft size={12} />
              <span>Return to Agent Registry</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isSuspended = agent.status === "suspended";

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-2 text-xs font-chakra uppercase text-mut">
          <Link to="/agents" className="hover:text-fg transition-colors flex items-center gap-1">
            <ArrowLeft size={12} />
            <span>Agents</span>
          </Link>
          <span>/</span>
          <span className="font-mono text-fg">{agent.id}</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-chakra font-bold tracking-wide uppercase text-fg">
                {agent.name}
              </h1>

              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-sm text-xs font-chakra uppercase font-bold tracking-wider border",
                  isSuspended
                    ? "border-bad/60 bg-bad/20 text-bad"
                    : "border-ok/40 bg-ok/10 text-ok"
                )}
              >
                Status: {agent.status}
              </span>

              <span className="text-xs font-mono text-mut">
                Security Score:{" "}
                <span className="text-ok font-semibold">{agent.security_score.toFixed(0)}/100</span>
              </span>
            </div>

            <p className="text-xs text-mut font-mono mt-1">
              {agent.description || "Autonomous agent registered under project"} • Created:{" "}
              {new Date(agent.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Emergency Kill Switch Control */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleKillSwitch}
              disabled={isTogglingKillSwitch}
              className={cn(
                "px-4 py-2 font-chakra uppercase font-bold text-xs tracking-wider rounded-sm flex items-center gap-2 transition-colors",
                isSuspended
                  ? "bg-ok text-bg hover:opacity-90"
                  : "bg-bad text-bg hover:opacity-90 animate-pulse"
              )}
            >
              <Power size={14} />
              <span>
                {isTogglingKillSwitch
                  ? "Updating..."
                  : isSuspended
                  ? "Re-activate Agent"
                  : "Trigger Emergency Kill-Switch"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Blast Radius Radar & Tool Matrix, Right = Execution History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Blast Radius Analysis & Permissions (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Blast Radius Profile Panel */}
          <Panel
            title="Blast Radius Assessment & Boundaries"
            subtitle="Calculated attack surface and privilege escalation potential"
            variant={agent.blast_radius_score >= 60 ? "critical" : "default"}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-chakra uppercase text-xs text-mut font-semibold">
                  Composite Blast Radius Score
                </span>
                <span className="font-mono text-base font-bold text-fg">
                  {agent.blast_radius_score.toFixed(0)}%
                </span>
              </div>
              <RiskMeter score={agent.blast_radius_score / 100} showNumeric={false} size="lg" />

              {/* Permission Vectors */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-line text-xs font-mono">
                <div className="p-3 bg-bg border border-line rounded-sm space-y-1">
                  <div className="flex items-center gap-1.5 text-mut text-[11px] font-chakra uppercase">
                    <Globe size={13} className="text-warn" />
                    <span>Network Egress</span>
                  </div>
                  <p className="text-fg font-semibold">Permitted (Filtered)</p>
                  <p className="text-[10px] text-mut">Outbound HTTP requests via curl/requests</p>
                </div>

                <div className="p-3 bg-bg border border-line rounded-sm space-y-1">
                  <div className="flex items-center gap-1.5 text-mut text-[11px] font-chakra uppercase">
                    <HardDrive size={13} className="text-bad" />
                    <span>File System</span>
                  </div>
                  <p className="text-fg font-semibold">Restricted</p>
                  <p className="text-[10px] text-mut">Read-only sandbox, write blocked</p>
                </div>

                <div className="p-3 bg-bg border border-line rounded-sm space-y-1">
                  <div className="flex items-center gap-1.5 text-mut text-[11px] font-chakra uppercase">
                    <Database size={13} className="text-ok" />
                    <span>Database</span>
                  </div>
                  <p className="text-fg font-semibold">Scoped Querying</p>
                  <p className="text-[10px] text-mut">Tenant row-level isolation active</p>
                </div>

                <div className="p-3 bg-bg border border-line rounded-sm space-y-1">
                  <div className="flex items-center gap-1.5 text-mut text-[11px] font-chakra uppercase">
                    <Key size={13} className="text-bad" />
                    <span>Credentials</span>
                  </div>
                  <p className="text-fg font-semibold">Quarantined</p>
                  <p className="text-[10px] text-mut">Honeytokens and canary traps monitored</p>
                </div>
              </div>
            </div>
          </Panel>

          {/* Allowed Tools Matrix Panel */}
          <Panel
            title={
              <div className="flex items-center gap-2">
                <Terminal size={15} className="text-ok" />
                <span>Allowed Tools & Capability Boundaries</span>
              </div>
            }
            variant="default"
          >
            {agent.allowed_tools.length === 0 ? (
              <p className="text-xs text-mut font-sans p-4 text-center">
                No custom tool boundaries registered. Agent operates under default project guardrails.
              </p>
            ) : (
              <div className="border border-line rounded-sm overflow-hidden font-mono text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-line bg-bg/60 text-mut uppercase font-chakra text-[11px]">
                      <th className="py-2 px-3">Tool Name</th>
                      <th className="py-2 px-3">Sensitivity</th>
                      <th className="py-2 px-3">Approval Gate</th>
                      <th className="py-2 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {agent.allowed_tools.map((tool: any, idx: number) => {
                      const toolName = tool.name || tool;
                      const sensitivity = tool.sensitivity || (["bash", "curl", "exec"].includes(toolName) ? "critical" : "medium");
                      return (
                        <tr key={idx} className="hover:bg-line/10">
                          <td className="py-2.5 px-3 text-fg font-semibold">{toolName}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={cn(
                                "px-1.5 py-0.2 rounded-sm text-[10px] font-chakra uppercase",
                                sensitivity === "critical"
                                  ? "bg-bad/20 text-bad"
                                  : sensitivity === "high"
                                  ? "bg-bad/10 text-bad"
                                  : "bg-warn/10 text-warn"
                              )}
                            >
                              {sensitivity}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-mut text-[11px]">
                            {tool.requires_approval ? "Human Approval Required" : "Automated Shield"}
                          </td>
                          <td className="py-2.5 px-3 text-right text-ok text-[11px]">
                            Permitted
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>

        {/* Right Column: Recent Sessions History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Panel
            title={
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-ok" />
                <span>Recent Agent Sessions</span>
              </div>
            }
            subtitle={`Execution history for ${agent.name}`}
            variant="default"
          >
            {sessions.length === 0 ? (
              <p className="text-xs text-mut font-sans p-6 text-center">
                No execution sessions recorded yet for this agent.
              </p>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {sessions.slice(0, 8).map((s) => (
                  <Link
                    key={s.session_id}
                    to={`/sessions/${s.session_id}`}
                    className="p-3 bg-bg border border-line rounded-sm hover:border-ok flex items-center justify-between transition-colors block group"
                  >
                    <div>
                      <div className="text-fg font-semibold group-hover:text-ok transition-colors">
                        {s.session_id}
                      </div>
                      <div className="text-[11px] text-mut flex items-center gap-2 mt-0.5">
                        <span>{s.step_count} turns</span>
                        <span>•</span>
                        <span>
                          {s.last_activity_at
                            ? new Date(s.last_activity_at).toLocaleTimeString()
                            : "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-sm text-[10px] font-chakra uppercase font-bold",
                          s.status === "blocked"
                            ? "bg-bad/20 text-bad"
                            : s.status === "tainted"
                            ? "bg-warn/20 text-warn"
                            : "bg-ok/20 text-ok"
                        )}
                      >
                        {s.status}
                      </span>
                      <PlayCircle size={14} className="text-mut group-hover:text-ok" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
};
