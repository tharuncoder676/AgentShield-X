import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Layers,
  Search,
  Filter,
  RefreshCw,
  Clock,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  PlayCircle,
  ArrowRight,
  Terminal,
  Activity,
} from "lucide-react";
import {
  Panel,
  RiskMeter,
  EmptyState,
  cn,
} from "@agentshield/ui";
import { useAuth } from "../context/AuthContext";
import { SessionSummary } from "@agentshield/api-client";

export const Sessions: React.FC = () => {
  const { activeProject, client } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadSessions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await client.listSessions(
        activeProject?.id,
        undefined,
        statusFilter === "all" ? undefined : statusFilter
      );
      setSessions(data);
    } catch (err: any) {
      console.error("Failed to load sessions:", err);
      setError(err?.message || "Failed to fetch sessions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [activeProject, statusFilter]);

  // Client-side search
  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.session_id.toLowerCase().includes(q) ||
      (s.agent_id && s.agent_id.toLowerCase().includes(q)) ||
      s.tools_used.some((t) => t.toLowerCase().includes(q))
    );
  });

  // KPI Metrics
  const totalSessions = sessions.length;
  const blockedSessions = sessions.filter((s) => s.status === "blocked").length;
  const taintedSessions = sessions.filter((s) => s.status === "tainted").length;
  const totalSteps = sessions.reduce((acc, s) => acc + s.step_count, 0);
  const avgSteps = totalSessions > 0 ? (totalSteps / totalSessions).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers size={20} className="text-ok" />
            <h1 className="text-xl font-chakra font-bold tracking-wide uppercase text-fg">
              Multi-Turn Sessions & Replay Simulator
            </h1>
          </div>
          <p className="text-xs text-mut mt-0.5">
            Audit full chronological agent reasoning chains and replay sessions under counterfactual policies.
          </p>
        </div>

        <button
          onClick={loadSessions}
          disabled={isLoading}
          className="px-3.5 py-1.5 text-xs font-chakra font-bold uppercase tracking-wider border border-line bg-panel text-fg hover:bg-line/20 flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Panel variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-chakra text-xs text-mut uppercase tracking-wider">
              Total Sessions
            </span>
            <Activity size={16} className="text-ok" />
          </div>
          <div className="mt-2 text-2xl font-chakra font-bold text-fg">
            {totalSessions}
          </div>
          <div className="text-[11px] text-mut mt-1">
            Recorded agent runs
          </div>
        </Panel>

        <Panel variant="critical" className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-chakra text-xs text-mut uppercase tracking-wider">
              Interventions
            </span>
            <ShieldAlert size={16} className="text-bad" />
          </div>
          <div className="mt-2 text-2xl font-chakra font-bold text-bad">
            {blockedSessions}
          </div>
          <div className="text-[11px] text-mut mt-1">
            Blocked malicious tool calls
          </div>
        </Panel>

        <Panel variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-chakra text-xs text-mut uppercase tracking-wider">
              Tainted Sessions
            </span>
            <AlertTriangle size={16} className="text-warn" />
          </div>
          <div className="mt-2 text-2xl font-chakra font-bold text-warn">
            {taintedSessions}
          </div>
          <div className="text-[11px] text-mut mt-1">
            Untrusted context propagated
          </div>
        </Panel>

        <Panel variant="shield" className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-chakra text-xs text-mut uppercase tracking-wider">
              Avg Steps / Run
            </span>
            <Clock size={16} className="text-ok" />
          </div>
          <div className="mt-2 text-2xl font-chakra font-bold text-fg">
            {avgSteps}
          </div>
          <div className="text-[11px] text-mut mt-1">
            Turns per session
          </div>
        </Panel>
      </div>

      {/* Search and Status Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-panel border border-line p-3 rounded-sm">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-bg border border-line px-3 py-1.5 rounded-sm">
          <Search size={14} className="text-mut shrink-0" />
          <input
            type="text"
            placeholder="Search by session ID, agent ID, or tool name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-fg placeholder:text-mut/60 focus:outline-none font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-[11px] text-mut hover:text-fg uppercase font-chakra"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 text-xs font-chakra uppercase">
          <span className="text-mut text-[11px]">Security Status:</span>
          <div className="flex border border-line rounded-sm overflow-hidden bg-bg">
            {["all", "clean", "tainted", "sanitized", "blocked"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "px-2.5 py-1 text-[11px] transition-colors",
                  statusFilter === st
                    ? "bg-line/60 text-fg font-bold"
                    : "text-mut hover:text-fg hover:bg-line/20"
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      {isLoading ? (
        <div className="p-12 text-center border border-line bg-panel rounded-sm">
          <div className="inline-flex items-center gap-2 font-chakra uppercase text-xs tracking-wider text-mut">
            <RefreshCw size={14} className="animate-spin text-ok" />
            <span>Loading agent execution sessions...</span>
          </div>
        </div>
      ) : error ? (
        <div className="p-8 border border-bad/40 bg-bad/5 text-center text-xs text-bad rounded-sm">
          <ShieldAlert size={20} className="mx-auto mb-2 text-bad" />
          <p className="font-chakra uppercase font-bold">Failed to load sessions</p>
          <p className="font-mono text-mut mt-1">{error}</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <EmptyState
          title="No Agent Sessions Recorded"
          description={
            searchQuery || statusFilter !== "all"
              ? "No sessions match your filter criteria. Try resetting your search filters."
              : "When your LLM agents intercept tool calls through the AgentShield-X Gateway, multi-turn sessions will appear here for forensic replay."
          }
          icon={<Layers size={28} className="text-ok" />}
          actionLabel={searchQuery || statusFilter !== "all" ? "Reset Filters" : undefined}
          onAction={() => {
            setSearchQuery("");
            setStatusFilter("all");
          }}
        />
      ) : (
        <div className="border border-line rounded-sm bg-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-bg/60 text-mut uppercase font-chakra font-medium tracking-wider select-none">
                  <th className="py-2.5 px-3 w-44">Session ID</th>
                  <th className="py-2.5 px-3 w-36">Agent</th>
                  <th className="py-2.5 px-3 w-24">Steps</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Tools Invoked</th>
                  <th className="py-2.5 px-3 w-36">Highest Risk</th>
                  <th className="py-2.5 px-3 w-28">Status</th>
                  <th className="py-2.5 px-3 w-40">Last Activity</th>
                  <th className="py-2.5 px-3 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-sans">
                {filteredSessions.map((s) => {
                  const statusBadgeClass = {
                    clean: "border-ok/40 bg-ok/10 text-ok",
                    sanitized: "border-warn/40 bg-warn/10 text-warn",
                    escalated: "border-warn/50 bg-warn/15 text-warn",
                    tainted: "border-warn/60 bg-warn/20 text-warn font-semibold",
                    blocked: "border-bad/60 bg-bad/20 text-bad font-bold",
                  }[s.status] || "border-line text-mut";

                  return (
                    <tr
                      key={s.session_id}
                      onClick={() => navigate(`/sessions/${s.session_id}`)}
                      className="hover:bg-line/10 cursor-pointer transition-colors group"
                    >
                      {/* Session ID */}
                      <td className="py-3 px-3 font-mono text-[11px] text-fg font-semibold group-hover:text-ok transition-colors">
                        {s.session_id}
                      </td>

                      {/* Agent */}
                      <td className="py-3 px-3 font-mono text-[11px] text-fg">
                        {s.agent_id || "default-agent"}
                      </td>

                      {/* Step Count */}
                      <td className="py-3 px-3 font-mono text-xs text-fg">
                        {s.step_count}
                      </td>

                      {/* Tools Used */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {s.tools_used.slice(0, 3).map((tool) => (
                            <span
                              key={tool}
                              className="px-1.5 py-0.5 rounded-sm bg-bg border border-line font-mono text-[10px] text-mut"
                            >
                              {tool}
                            </span>
                          ))}
                          {s.tools_used.length > 3 && (
                            <span className="text-[10px] text-mut font-mono">
                              +{s.tools_used.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Highest Risk */}
                      <td className="py-3 px-3">
                        <RiskMeter score={s.max_risk} size="sm" showNumeric={true} />
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-sm text-[10px] font-chakra uppercase tracking-wider border",
                            statusBadgeClass
                          )}
                        >
                          {s.status}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-3 font-mono text-[11px] text-mut">
                        {s.last_activity_at
                          ? new Date(s.last_activity_at).toLocaleString()
                          : "N/A"}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/sessions/${s.session_id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-chakra uppercase font-bold text-ok border border-ok/30 bg-ok/5 hover:bg-ok/15 transition-colors rounded-sm"
                        >
                          <PlayCircle size={12} />
                          <span>Replay</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
