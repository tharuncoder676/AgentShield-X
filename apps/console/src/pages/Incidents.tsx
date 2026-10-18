import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  ArrowRight,
  UserCheck,
  Shield,
  ShieldCheck,
  Layers,
} from "lucide-react";
import {
  Panel,
  RiskMeter,
  EmptyState,
  cn,
} from "@agentshield/ui";
import { useAuth } from "../context/AuthContext";
import { Incident, IncidentSeverity, IncidentStatus } from "@agentshield/api-client";

export const Incidents: React.FC = () => {
  const { activeProject, client } = useAuth();
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadIncidents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await client.listIncidents(
        activeProject?.id,
        statusFilter === "all" ? undefined : statusFilter,
        severityFilter === "all" ? undefined : severityFilter
      );
      setIncidents(data);
    } catch (err: any) {
      console.error("Failed to load incidents:", err);
      setError(err?.message || "Failed to fetch incidents");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [activeProject, statusFilter, severityFilter]);

  // Client-side search filtering
  const filteredIncidents = incidents.filter((inc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      inc.title.toLowerCase().includes(q) ||
      inc.id.toLowerCase().includes(q) ||
      inc.session_id.toLowerCase().includes(q) ||
      (inc.policy_violated && inc.policy_violated.toLowerCase().includes(q)) ||
      (inc.assigned_to && inc.assigned_to.toLowerCase().includes(q))
    );
  });

  // Calculate summary statistics
  const totalCount = incidents.length;
  const openCount = incidents.filter((i) => i.status === "open").length;
  const investigatingCount = incidents.filter((i) => i.status === "investigating").length;
  const resolvedCount = incidents.filter((i) => i.status === "resolved").length;
  const criticalCount = incidents.filter((i) => i.severity === "critical").length;

  return (
    <div className="space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert size={20} className="text-bad animate-pulse" />
            <h1 className="text-xl font-chakra font-bold tracking-wide uppercase text-fg">
              Security Incidents & Taint Traces
            </h1>
          </div>
          <p className="text-xs text-mut mt-0.5">
            Interception dossiers for dangerous agent behavior, prompt injections, and exfiltration attempts.
          </p>
        </div>

        <button
          onClick={loadIncidents}
          disabled={isLoading}
          className="px-3.5 py-1.5 text-xs font-chakra font-bold uppercase tracking-wider border border-line bg-panel text-fg hover:bg-line/20 flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Panel variant="critical" className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-chakra text-xs text-mut uppercase tracking-wider">
              Open Threats
            </span>
            <ShieldAlert size={16} className="text-bad" />
          </div>
          <div className="mt-2 text-2xl font-chakra font-bold text-bad">
            {openCount}
          </div>
          <div className="text-[11px] text-mut mt-1">
            Requiring immediate triage
          </div>
        </Panel>

        <Panel variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-chakra text-xs text-mut uppercase tracking-wider">
              Investigating
            </span>
            <Clock size={16} className="text-warn" />
          </div>
          <div className="mt-2 text-2xl font-chakra font-bold text-warn">
            {investigatingCount}
          </div>
          <div className="text-[11px] text-mut mt-1">
            Currently under analyst review
          </div>
        </Panel>

        <Panel variant="shield" className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-chakra text-xs text-mut uppercase tracking-wider">
              Mitigated
            </span>
            <CheckCircle size={16} className="text-ok" />
          </div>
          <div className="mt-2 text-2xl font-chakra font-bold text-ok">
            {resolvedCount}
          </div>
          <div className="text-[11px] text-mut mt-1">
            Closed and neutralized
          </div>
        </Panel>

        <Panel variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-chakra text-xs text-mut uppercase tracking-wider">
              Critical Severity
            </span>
            <AlertTriangle size={16} className="text-bad" />
          </div>
          <div className="mt-2 text-2xl font-chakra font-bold text-fg">
            {criticalCount}
          </div>
          <div className="text-[11px] text-mut mt-1">
            High-blast radius blocks
          </div>
        </Panel>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-panel border border-line p-3 rounded-sm">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-bg border border-line px-3 py-1.5 rounded-sm">
          <Search size={14} className="text-mut shrink-0" />
          <input
            type="text"
            placeholder="Search by title, session ID, tool, or policy..."
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

        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs font-chakra uppercase">
            <span className="text-mut text-[11px]">Status:</span>
            <div className="flex border border-line rounded-sm overflow-hidden bg-bg">
              {["all", "open", "investigating", "resolved"].map((st) => (
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

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 text-xs font-chakra uppercase">
            <span className="text-mut text-[11px]">Severity:</span>
            <div className="flex border border-line rounded-sm overflow-hidden bg-bg">
              {["all", "critical", "high", "medium", "low"].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={cn(
                    "px-2.5 py-1 text-[11px] transition-colors",
                    severityFilter === sev
                      ? "bg-line/60 text-fg font-bold"
                      : "text-mut hover:text-fg hover:bg-line/20"
                  )}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Incidents Table / List */}
      {isLoading ? (
        <div className="p-12 text-center border border-line bg-panel rounded-sm">
          <div className="inline-flex items-center gap-2 font-chakra uppercase text-xs tracking-wider text-mut">
            <RefreshCw size={14} className="animate-spin text-ok" />
            <span>Loading security incident dossiers...</span>
          </div>
        </div>
      ) : error ? (
        <div className="p-8 border border-bad/40 bg-bad/5 text-center text-xs text-bad rounded-sm">
          <ShieldAlert size={20} className="mx-auto mb-2 text-bad" />
          <p className="font-chakra uppercase font-bold">Failed to load incidents</p>
          <p className="font-mono text-mut mt-1">{error}</p>
        </div>
      ) : filteredIncidents.length === 0 ? (
        <EmptyState
          title="No Security Incidents Found"
          description={
            searchQuery || statusFilter !== "all" || severityFilter !== "all"
              ? "No incidents match your current filter parameters. Try clearing your filters."
              : "No blocked or anomalous tool calls have triggered an incident yet. The gateway creates dossiers automatically on critical security interventions."
          }
          icon={<ShieldCheck size={28} className="text-ok" />}
          actionLabel={searchQuery || statusFilter !== "all" ? "Reset Filters" : undefined}
          onAction={() => {
            setSearchQuery("");
            setStatusFilter("all");
            setSeverityFilter("all");
          }}
        />
      ) : (
        <div className="border border-line rounded-sm bg-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-bg/60 text-mut uppercase font-chakra font-medium tracking-wider select-none">
                  <th className="py-2.5 px-3 w-28">Severity</th>
                  <th className="py-2.5 px-3 min-w-[220px]">Incident Details</th>
                  <th className="py-2.5 px-3 w-40">Policy Triggered</th>
                  <th className="py-2.5 px-3 w-36">Composite Risk</th>
                  <th className="py-2.5 px-3 w-32">Status</th>
                  <th className="py-2.5 px-3 w-36">Assigned To</th>
                  <th className="py-2.5 px-3 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-sans">
                {filteredIncidents.map((inc) => {
                  const severityBadgeClass = {
                    critical: "border-bad/60 bg-bad/20 text-bad font-bold",
                    high: "border-bad/40 bg-bad/10 text-bad",
                    medium: "border-warn/40 bg-warn/10 text-warn",
                    low: "border-ok/40 bg-ok/10 text-ok",
                  }[inc.severity] || "border-line bg-panel text-mut";

                  const statusBadgeClass = {
                    open: "border-bad/50 bg-bad/10 text-bad",
                    investigating: "border-warn/50 bg-warn/10 text-warn",
                    resolved: "border-ok/50 bg-ok/10 text-ok",
                  }[inc.status] || "border-line text-mut";

                  return (
                    <tr
                      key={inc.id}
                      onClick={() => navigate(`/incidents/${inc.id}`)}
                      className="hover:bg-line/10 cursor-pointer transition-colors group"
                    >
                      {/* Severity */}
                      <td className="py-3 px-3">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-sm text-[10px] font-chakra uppercase tracking-wider border",
                            severityBadgeClass
                          )}
                        >
                          {inc.severity}
                        </span>
                      </td>

                      {/* Title & Session Info */}
                      <td className="py-3 px-3">
                        <div className="font-chakra font-semibold text-fg text-xs group-hover:text-ok transition-colors">
                          {inc.title}
                        </div>
                        <div className="text-[11px] font-mono text-mut flex items-center gap-2 mt-0.5">
                          <span>Session: {inc.session_id.slice(0, 16)}...</span>
                          <span>•</span>
                          <span>{new Date(inc.created_at).toLocaleString()}</span>
                        </div>
                      </td>

                      {/* Policy */}
                      <td className="py-3 px-3 font-mono text-[11px] text-mut truncate max-w-[160px]" title={inc.policy_violated || "default-guardrail"}>
                        {inc.policy_violated || "default-guardrail"}
                      </td>

                      {/* Risk */}
                      <td className="py-3 px-3">
                        <RiskMeter score={inc.risk} size="sm" showNumeric={true} />
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-sm text-[10px] font-chakra uppercase tracking-wider border",
                            statusBadgeClass
                          )}
                        >
                          {inc.status}
                        </span>
                      </td>

                      {/* Assignee */}
                      <td className="py-3 px-3 font-mono text-[11px] text-fg">
                        {inc.assigned_to ? (
                          <span className="flex items-center gap-1 text-fg">
                            <UserCheck size={12} className="text-ok shrink-0" />
                            <span className="truncate max-w-[120px]">{inc.assigned_to}</span>
                          </span>
                        ) : (
                          <span className="text-mut italic">Unassigned</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/incidents/${inc.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-chakra uppercase font-bold text-ok border border-ok/30 bg-ok/5 hover:bg-ok/15 transition-colors rounded-sm"
                        >
                          <span>Trace</span>
                          <ArrowRight size={11} />
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
