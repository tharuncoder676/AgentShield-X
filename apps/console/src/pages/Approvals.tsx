import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  Code,
  Terminal,
} from "lucide-react";
import {
  Panel,
  RiskMeter,
  VerdictBadge,
  EmptyState,
  Drawer,
  cn,
} from "@agentshield/ui";
import { useAuth } from "../context/AuthContext";
import { Approval } from "@agentshield/api-client";

export const Approvals: React.FC = () => {
  const { activeProject, client } = useAuth();

  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Resolution Modal / Drawer state
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [resolutionAction, setResolutionAction] = useState<"approved" | "rejected">("approved");
  const [resolutionReason, setResolutionReason] = useState<string>("");
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const loadApprovals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await client.listApprovals(
        activeProject?.id,
        statusFilter === "all" ? undefined : statusFilter
      );
      setApprovals(data);
    } catch (err: any) {
      console.error("Failed to load approvals:", err);
      setError(err?.message || "Failed to load approvals");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, [activeProject, statusFilter]);

  const handleOpenResolve = (approval: Approval, action: "approved" | "rejected") => {
    setSelectedApproval(approval);
    setResolutionAction(action);
    setResolutionReason(
      action === "approved"
        ? "Authorized by security operator"
        : "Rejected due to high policy risk"
    );
    setIsModalOpen(true);
  };

  const handleConfirmResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApproval) return;

    setIsResolving(true);
    try {
      const updated = await client.resolveApproval(selectedApproval.id, {
        status: resolutionAction,
        reason: resolutionReason.trim(),
      });

      setApprovals((prev) =>
        prev.map((a) => (a.id === selectedApproval.id ? updated : a))
      );
      setIsModalOpen(false);
      setSelectedApproval(null);
    } catch (err: any) {
      console.error("Resolution failed:", err);
      alert(`Resolution failed: ${err?.message || "Unknown error"}`);
    } finally {
      setIsResolving(false);
    }
  };

  const filteredApprovals = approvals.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.tool_name.toLowerCase().includes(q) ||
      a.agent_id.toLowerCase().includes(q) ||
      a.session_id.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q)
    );
  });

  const pendingCount = approvals.filter((a) => a.status === "pending").length;
  const approvedCount = approvals.filter((a) => a.status === "approved").length;
  const rejectedCount = approvals.filter((a) => a.status === "rejected").length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-chakra uppercase font-bold text-xs tracking-widest text-warn">
              Human-in-the-Loop
            </span>
            <span className="text-line">&bull;</span>
            <span className="text-xs text-mut font-mono">Escalations Queue</span>
          </div>
          <h1 className="text-2xl font-chakra font-bold text-fg uppercase tracking-wider mt-1">
            Approvals Queue
          </h1>
          <p className="text-xs text-mut mt-0.5">
            Interception triage for tools that require explicit operator authorization before execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadApprovals}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-line bg-panel text-xs text-mut hover:text-fg hover:border-mut transition-colors"
            title="Refresh queue"
          >
            <RefreshCw size={13} className={cn(isLoading && "animate-spin")} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Panel className="p-3">
          <div className="text-[11px] font-chakra uppercase text-mut tracking-wider">
            Pending Approval
          </div>
          <div className="text-xl font-chakra font-bold text-warn mt-1 flex items-center gap-2">
            {pendingCount}
            {pendingCount > 0 && (
              <span className="inline-block w-2 h-2 rounded-full bg-warn animate-ping" />
            )}
          </div>
        </Panel>

        <Panel className="p-3">
          <div className="text-[11px] font-chakra uppercase text-mut tracking-wider">
            Approved Executions
          </div>
          <div className="text-xl font-chakra font-bold text-ok mt-1">
            {approvedCount}
          </div>
        </Panel>

        <Panel className="p-3">
          <div className="text-[11px] font-chakra uppercase text-mut tracking-wider">
            Rejected Actions
          </div>
          <div className="text-xl font-chakra font-bold text-bad mt-1">
            {rejectedCount}
          </div>
        </Panel>

        <Panel className="p-3">
          <div className="text-[11px] font-chakra uppercase text-mut tracking-wider">
            Escalation Threshold
          </div>
          <div className="text-xl font-chakra font-bold text-purple mt-1">
            &ge; 0.28 Risk
          </div>
        </Panel>
      </div>

      {/* Filter and Tab Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-panel border border-line p-2 rounded-sm">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 font-chakra uppercase text-xs">
          {[
            { id: "pending", label: "Pending" },
            { id: "approved", label: "Approved" },
            { id: "rejected", label: "Rejected" },
            { id: "all", label: "All Items" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                "px-3 py-1 font-semibold rounded-sm transition-colors",
                statusFilter === tab.id
                  ? "bg-warn/10 text-warn border border-warn/30"
                  : "text-mut hover:text-fg"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mut"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by tool, agent, session..."
            className="w-full bg-bg border border-line rounded-sm pl-8 pr-3 py-1 text-xs text-fg placeholder:text-mut/50 focus:outline-none focus:border-warn/60"
          />
        </div>
      </div>

      {/* Approvals Listing */}
      <Panel>
        {isLoading && approvals.length === 0 ? (
          <div className="py-12 text-center text-xs text-mut font-chakra uppercase tracking-wider animate-pulse">
            Loading escalation queue...
          </div>
        ) : error ? (
          <div className="p-6 text-center space-y-2">
            <div className="text-xs text-bad font-chakra uppercase tracking-wider">
              {error}
            </div>
            <button
              onClick={loadApprovals}
              className="text-xs text-ok hover:underline uppercase font-chakra"
            >
              Retry
            </button>
          </div>
        ) : filteredApprovals.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck size={32} className="text-ok" />}
            title="Queue is Clear"
            description={
              statusFilter === "pending"
                ? "No pending approvals currently require operator intervention."
                : "No matching approval requests found."
            }
          />
        ) : (
          <div className="divide-y divide-line/40">
            {filteredApprovals.map((approval) => (
              <div
                key={approval.id}
                className="p-4 hover:bg-line/5 transition-colors space-y-3"
              >
                {/* Row Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 rounded-sm bg-panel border border-line text-warn">
                      <Terminal size={14} />
                    </span>
                    <div>
                      <div className="font-chakra font-bold text-fg uppercase tracking-wider text-sm flex items-center gap-2">
                        {approval.tool_name}
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.2 rounded-sm border uppercase font-mono font-semibold",
                            approval.status === "pending"
                              ? "bg-warn/10 text-warn border-warn/30"
                              : approval.status === "approved"
                              ? "bg-ok/10 text-ok border-ok/30"
                              : "bg-bad/10 text-bad border-bad/30"
                          )}
                        >
                          {approval.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-mut font-mono mt-0.5">
                        {approval.id} &bull; Requested {new Date(approval.requested_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] font-chakra uppercase text-mut">Risk Score</div>
                      <div className="font-mono font-bold text-xs text-warn">
                        {(approval.risk * 100).toFixed(0)}%
                      </div>
                    </div>

                    {approval.status === "pending" ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenResolve(approval, "approved")}
                          className="px-3 py-1 bg-ok text-bg font-chakra font-bold text-xs uppercase tracking-wider rounded-sm hover:opacity-90 flex items-center gap-1"
                        >
                          <CheckCircle2 size={12} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleOpenResolve(approval, "rejected")}
                          className="px-3 py-1 bg-bad text-fg font-chakra font-bold text-xs uppercase tracking-wider rounded-sm hover:opacity-90 flex items-center gap-1"
                        >
                          <XCircle size={12} />
                          Deny
                        </button>
                      </div>
                    ) : (
                      <div className="text-right text-[11px] font-mono text-mut">
                        <div>
                          {approval.status === "approved" ? "Authorized" : "Blocked"} by{" "}
                          <span className="text-fg">{approval.resolved_by || "Operator"}</span>
                        </div>
                        {approval.resolution_reason && (
                          <div className="text-[10px] italic text-mut/80 mt-0.5">
                            "{approval.resolution_reason}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Agent & Session Context Links */}
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-mut bg-bg/40 p-2 rounded-sm border border-line/40">
                  <div>
                    Agent:{" "}
                    <Link
                      to={`/agents/${approval.agent_id}`}
                      className="text-fg hover:text-ok underline decoration-dotted"
                    >
                      {approval.agent_id}
                    </Link>
                  </div>
                  <span className="text-line">&bull;</span>
                  <div>
                    Session:{" "}
                    <Link
                      to={`/sessions/${approval.session_id}`}
                      className="text-fg hover:text-ok underline decoration-dotted"
                    >
                      {approval.session_id}
                    </Link>
                  </div>
                  <span className="text-line">&bull;</span>
                  <div className="text-mut flex items-center gap-1">
                    <Clock size={11} />
                    Expires at: {new Date(approval.expires_at).toLocaleTimeString()}
                  </div>
                </div>

                {/* Escalation Reasons */}
                {approval.reasons && approval.reasons.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-chakra uppercase text-mut font-semibold">
                      Triggered Detectors & Evidence
                    </div>
                    <div className="space-y-1">
                      {approval.reasons.map((r, i) => (
                        <div
                          key={i}
                          className="text-xs bg-warn/5 border border-warn/20 rounded-sm p-2 text-warn flex items-start gap-2"
                        >
                          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                          <div>
                            <span className="font-chakra uppercase font-bold text-[10px] mr-1.5">
                              [{r.detector || "SHIELD"}]:
                            </span>
                            <span className="font-mono text-[11px]">{r.evidence || JSON.stringify(r)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payload Arguments */}
                <div>
                  <div className="text-[10px] font-chakra uppercase text-mut font-semibold mb-1">
                    Interception Payload Arguments
                  </div>
                  <pre className="p-2.5 bg-bg border border-line rounded-sm font-mono text-[11px] text-fg overflow-x-auto">
                    {JSON.stringify(approval.arguments, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Resolution Confirmation Modal */}
      <Drawer
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          resolutionAction === "approved"
            ? `Authorize Tool Execution`
            : `Reject Tool Execution`
        }
        size="md"
      >
        {selectedApproval && (
          <form onSubmit={handleConfirmResolve} className="space-y-4">
            <div
              className={cn(
                "p-3 rounded-sm border text-xs",
                resolutionAction === "approved"
                  ? "bg-ok/10 border-ok/30 text-ok"
                  : "bg-bad/10 border-bad/30 text-bad"
              )}
            >
              <div className="font-chakra uppercase font-bold text-xs">
                {resolutionAction === "approved"
                  ? "Authorize Immediate Invocation"
                  : "Block Action & Notify Agent"}
              </div>
              <p className="mt-1 text-fg/80 font-sans text-xs">
                {resolutionAction === "approved"
                  ? `You are authorizing '${selectedApproval.tool_name}' for agent '${selectedApproval.agent_id}'. An audit record will be signed with your identity.`
                  : `This invocation will be permanently rejected. The agent will receive an access denied security fault.`}
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-chakra uppercase font-semibold text-mut mb-1">
                Resolution Reason / Operator Note *
              </label>
              <textarea
                required
                rows={3}
                value={resolutionReason}
                onChange={(e) => setResolutionReason(e.target.value)}
                placeholder="Explain the security justification..."
                className="w-full bg-bg border border-line rounded-sm p-2 text-xs text-fg placeholder:text-mut/40 focus:outline-none focus:border-ok/60 font-sans resize-none"
              />
            </div>

            <div className="pt-3 border-t border-line flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 border border-line text-xs text-mut hover:text-fg rounded-sm font-chakra uppercase"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isResolving}
                className={cn(
                  "px-4 py-1.5 font-chakra font-bold text-xs uppercase tracking-wider rounded-sm text-bg transition-opacity",
                  resolutionAction === "approved"
                    ? "bg-ok hover:opacity-90"
                    : "bg-bad hover:opacity-90 text-fg"
                )}
              >
                {isResolving ? "Resolving..." : `Confirm ${resolutionAction}`}
              </button>
            </div>
          </form>
        )}
      </Drawer>
    </div>
  );
};
