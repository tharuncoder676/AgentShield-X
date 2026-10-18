import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Cpu,
  Plus,
  Search,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Power,
  Sliders,
  ArrowRight,
  Check,
  X,
} from "lucide-react";
import {
  Panel,
  RiskMeter,
  Drawer,
  EmptyState,
  cn,
} from "@agentshield/ui";
import { useAuth } from "../context/AuthContext";
import { Agent, CreateAgentRequest } from "@agentshield/api-client";

export const Agents: React.FC = () => {
  const { activeProject, client } = useAuth();
  const navigate = useNavigate();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Register Agent Drawer state
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);
  const [newAgentName, setNewAgentName] = useState<string>("");
  const [newAgentDesc, setNewAgentDesc] = useState<string>("");
  const [newAgentTools, setNewAgentTools] = useState<string>("bash, curl, read_file, query_db");
  const [newAgentBlastRadius, setNewAgentBlastRadius] = useState<number>(35);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadAgents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await client.listAgents(activeProject?.id);
      setAgents(data);
    } catch (err: any) {
      console.error("Failed to load agents:", err);
      setError(err?.message || "Failed to load agents");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, [activeProject]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim() || !activeProject) return;
    setIsSubmitting(true);
    try {
      const toolsList = newAgentTools
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .map((name) => ({
          name,
          sensitivity: ["bash", "curl", "exec", "rm"].includes(name) ? "critical" : "medium",
        }));

      await client.registerAgent(activeProject.id, {
        name: newAgentName.trim(),
        description: newAgentDesc.trim(),
        allowed_tools: toolsList,
        blast_radius_score: newAgentBlastRadius,
        metadata: {},
      });

      setIsRegisterOpen(false);
      setNewAgentName("");
      setNewAgentDesc("");
      loadAgents();
    } catch (err: any) {
      console.error("Failed to register agent:", err);
      alert(`Registration failed: ${err?.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleKillSwitch = async (agent: Agent, e: React.MouseEvent) => {
    e.stopPropagation();
    const willSuspend = agent.status === "active";
    const confirmMsg = willSuspend
      ? `EMERGENCY ACTION: Are you sure you want to trigger the kill-switch on agent '${agent.name}'? All incoming tool calls from this agent will be blocked instantly.`
      : `Re-activate agent '${agent.name}'?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const updated = await client.toggleKillSwitch(agent.id, {
        suspended: willSuspend,
        reason: willSuspend ? "Manual operator kill-switch triggered" : "Re-activated by operator",
      });
      setAgents((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err: any) {
      console.error("Failed to toggle kill switch:", err);
      alert(`Kill switch failed: ${err?.message || "Unknown error"}`);
    }
  };

  // Search filter
  const filteredAgents = agents.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q)
    );
  });

  const totalCount = agents.length;
  const activeCount = agents.filter((a) => a.status === "active").length;
  const suspendedCount = agents.filter((a) => a.status === "suspended").length;
  const avgSecurityScore =
    totalCount > 0
      ? (agents.reduce((acc, a) => acc + a.security_score, 0) / totalCount).toFixed(0)
      : "100";

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu size={20} className="text-ok" />
            <h1 className="text-xl font-chakra font-bold tracking-wide uppercase text-fg">
              Agent Registry & Blast-Radius Matrix
            </h1>
          </div>
          <p className="text-xs text-mut mt-0.5">
            Audit autonomous agents, configure least-privilege tool boundaries, and manage emergency kill-switches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="px-3.5 py-1.5 bg-ok text-bg font-chakra uppercase font-bold text-xs tracking-wider rounded-sm hover:opacity-90 flex items-center gap-1.5 transition-opacity"
          >
            <Plus size={14} />
            <span>Register Agent</span>
          </button>

          <button
            onClick={loadAgents}
            disabled={isLoading}
            className="px-3 py-1.5 border border-line bg-panel text-xs font-chakra uppercase text-mut hover:text-fg flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Panel variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-chakra text-xs text-mut uppercase tracking-wider">
              Total Agents
            </span>
            <Cpu size={16} className="text-ok" />
          </div>
          <div className="mt-2 text-2xl font-chakra font-bold text-fg">
            {totalCount}
          </div>
          <div className="text-[11px] text-mut mt-1">Registered under project</div>
        </Panel>

        <Panel variant="shield" className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-chakra text-xs text-mut uppercase tracking-wider">
              Active Fleet
            </span>
            <ShieldCheck size={16} className="text-ok" />
          </div>
          <div className="mt-2 text-2xl font-chakra font-bold text-ok">
            {activeCount}
          </div>
          <div className="text-[11px] text-mut mt-1">Intercepting traffic</div>
        </Panel>

        <Panel variant="critical" className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-chakra text-xs text-mut uppercase tracking-wider">
              Kill-Switched
            </span>
            <Power size={16} className="text-bad" />
          </div>
          <div className="mt-2 text-2xl font-chakra font-bold text-bad">
            {suspendedCount}
          </div>
          <div className="text-[11px] text-mut mt-1">Suspended from tools</div>
        </Panel>

        <Panel variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-chakra text-xs text-mut uppercase tracking-wider">
              Avg Security Score
            </span>
            <Sliders size={16} className="text-ok" />
          </div>
          <div className="mt-2 text-2xl font-chakra font-bold text-fg">
            {avgSecurityScore}%
          </div>
          <div className="text-[11px] text-mut mt-1">Least-privilege index</div>
        </Panel>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-panel border border-line p-3 rounded-sm">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-bg border border-line px-3 py-1.5 rounded-sm">
          <Search size={14} className="text-mut shrink-0" />
          <input
            type="text"
            placeholder="Search by agent name, ID, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-fg placeholder:text-mut/60 focus:outline-none font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs font-chakra uppercase">
          <span className="text-mut text-[11px]">Status:</span>
          <div className="flex border border-line rounded-sm overflow-hidden bg-bg">
            {["all", "active", "suspended"].map((st) => (
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

      {/* Agents Table */}
      {isLoading ? (
        <div className="p-12 text-center border border-line bg-panel rounded-sm">
          <div className="inline-flex items-center gap-2 font-chakra uppercase text-xs tracking-wider text-mut">
            <RefreshCw size={14} className="animate-spin text-ok" />
            <span>Loading registered agents...</span>
          </div>
        </div>
      ) : error ? (
        <div className="p-8 border border-bad/40 bg-bad/5 text-center text-xs text-bad rounded-sm">
          <ShieldAlert size={20} className="mx-auto mb-2 text-bad" />
          <p className="font-chakra uppercase font-bold">Failed to load agents</p>
          <p className="font-mono text-mut mt-1">{error}</p>
        </div>
      ) : filteredAgents.length === 0 ? (
        <EmptyState
          title="No Agents Registered"
          description="Register your AI agents to define their allowed tools, calculate blast radius scores, and arm emergency kill-switches."
          icon={<Cpu size={28} className="text-ok" />}
          actionLabel="Register First Agent"
          onAction={() => setIsRegisterOpen(true)}
        />
      ) : (
        <div className="border border-line rounded-sm bg-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-bg/60 text-mut uppercase font-chakra font-medium tracking-wider select-none">
                  <th className="py-2.5 px-3 w-40">Agent Name</th>
                  <th className="py-2.5 px-3 w-32">Status</th>
                  <th className="py-2.5 px-3 w-36">Blast Radius</th>
                  <th className="py-2.5 px-3 w-36">Security Health</th>
                  <th className="py-2.5 px-3 min-w-[180px]">Allowed Tools</th>
                  <th className="py-2.5 px-3 w-44 text-right">Emergency Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-sans">
                {filteredAgents.map((agent) => {
                  const isSuspended = agent.status === "suspended";
                  return (
                    <tr
                      key={agent.id}
                      onClick={() => navigate(`/agents/${agent.id}`)}
                      className="hover:bg-line/10 cursor-pointer transition-colors group"
                    >
                      {/* Name & ID */}
                      <td className="py-3 px-3">
                        <div className="font-chakra font-semibold text-fg text-xs group-hover:text-ok transition-colors">
                          {agent.name}
                        </div>
                        <div className="text-[11px] font-mono text-mut">
                          {agent.id}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-sm text-[10px] font-chakra uppercase font-bold tracking-wider border",
                            isSuspended
                              ? "border-bad/60 bg-bad/20 text-bad"
                              : "border-ok/40 bg-ok/10 text-ok"
                          )}
                        >
                          {agent.status}
                        </span>
                      </td>

                      {/* Blast Radius */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <RiskMeter score={agent.blast_radius_score / 100} size="sm" showNumeric={false} />
                          <span className="font-mono text-xs text-fg font-semibold">
                            {agent.blast_radius_score.toFixed(0)}%
                          </span>
                        </div>
                      </td>

                      {/* Security Health */}
                      <td className="py-3 px-3">
                        <div className="font-mono text-xs font-semibold text-ok">
                          {agent.security_score.toFixed(0)}/100
                        </div>
                      </td>

                      {/* Allowed Tools */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {agent.allowed_tools.slice(0, 3).map((tool: any, idx: number) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded-sm bg-bg border border-line font-mono text-[10px] text-mut"
                            >
                              {tool.name || tool}
                            </span>
                          ))}
                          {agent.allowed_tools.length > 3 && (
                            <span className="text-[10px] text-mut font-mono">
                              +{agent.allowed_tools.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Controls */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleToggleKillSwitch(agent, e)}
                            className={cn(
                              "px-2.5 py-1 text-[11px] font-chakra uppercase font-bold rounded-sm border flex items-center gap-1 transition-colors",
                              isSuspended
                                ? "bg-ok/10 border-ok text-ok hover:bg-ok/20"
                                : "bg-bad/10 border-bad text-bad hover:bg-bad/20"
                            )}
                          >
                            <Power size={11} />
                            <span>{isSuspended ? "Re-activate" : "Kill-Switch"}</span>
                          </button>

                          <Link
                            to={`/agents/${agent.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-mut hover:text-fg"
                            title="Inspect Agent Matrix"
                          >
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register Agent Drawer */}
      <Drawer
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register Autonomous Agent"
        subtitle="Define security boundaries, allowed tools, and blast radius configuration."
        size="md"
      >
        <form onSubmit={handleRegister} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block font-chakra uppercase font-semibold text-fg mb-1">
              Agent Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Financial-Report-Agent"
              value={newAgentName}
              onChange={(e) => setNewAgentName(e.target.value)}
              className="w-full bg-bg border border-line px-3 py-2 rounded-sm text-xs font-mono text-fg focus:outline-none focus:border-ok"
            />
          </div>

          <div>
            <label className="block font-chakra uppercase font-semibold text-fg mb-1">
              Description & Purpose
            </label>
            <textarea
              rows={3}
              placeholder="Primary autonomous role and expected execution environment..."
              value={newAgentDesc}
              onChange={(e) => setNewAgentDesc(e.target.value)}
              className="w-full bg-bg border border-line p-2.5 rounded-sm text-xs font-mono text-fg focus:outline-none focus:border-ok resize-none"
            />
          </div>

          <div>
            <label className="block font-chakra uppercase font-semibold text-fg mb-1">
              Allowed Tools (Comma-separated)
            </label>
            <input
              type="text"
              value={newAgentTools}
              onChange={(e) => setNewAgentTools(e.target.value)}
              className="w-full bg-bg border border-line px-3 py-2 rounded-sm text-xs font-mono text-fg focus:outline-none focus:border-ok"
            />
            <span className="text-[11px] text-mut font-sans mt-0.5 block">
              Sensitive tools like bash, curl, and query_db are automatically tagged for stricter checks.
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-chakra uppercase font-semibold text-fg">
                Initial Blast Radius Score
              </label>
              <span className="font-mono text-xs font-bold text-fg">
                {newAgentBlastRadius}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={newAgentBlastRadius}
              onChange={(e) => setNewAgentBlastRadius(Number(e.target.value))}
              className="w-full accent-ok cursor-pointer"
            />
          </div>

          <div className="pt-4 border-t border-line flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(false)}
              className="px-3.5 py-1.5 border border-line text-xs font-chakra uppercase text-mut hover:text-fg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newAgentName.trim()}
              className="px-4 py-1.5 bg-ok text-bg font-chakra uppercase font-bold text-xs tracking-wider rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? "Registering..." : "Register Agent"}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};
