import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  UserCheck,
  FileText,
  Copy,
  Check,
  ArrowRight,
  RefreshCw,
  GitFork,
  Database,
  Terminal,
  Save,
  CheckCircle2,
} from "lucide-react";
import {
  Panel,
  RiskMeter,
  VerdictBadge,
  TaintGraphNode as UITaintGraphNode,
  NodeType,
  NodeTrust,
  EmptyState,
  cn,
} from "@agentshield/ui";
import { useAuth } from "../context/AuthContext";
import {
  Incident,
  TaintGraphResponse,
  TaintGraphNode as APITaintGraphNode,
  IncidentStatus,
} from "@agentshield/api-client";

export const IncidentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { client, user } = useAuth();
  const navigate = useNavigate();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [taintGraph, setTaintGraph] = useState<TaintGraphResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Operator Triage Form state
  const [statusVal, setStatusVal] = useState<IncidentStatus>("open");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [resolutionNotes, setResolutionNotes] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Selected node in taint graph
  const [selectedNode, setSelectedNode] = useState<APITaintGraphNode | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (field: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [incData, graphData] = await Promise.all([
        client.getIncident(id),
        client.getIncidentTaintGraph(id),
      ]);
      setIncident(incData);
      setTaintGraph(graphData);
      setStatusVal(incData.status);
      setAssignedTo(incData.assigned_to || "");
      setResolutionNotes(incData.resolution_notes || "");

      // Auto-select sink node or first tainted node if available
      if (graphData.nodes.length > 0) {
        const defaultNode =
          graphData.nodes.find((n) => n.type === "sink") ||
          graphData.nodes.find((n) => n.tainted) ||
          graphData.nodes[0];
        setSelectedNode(defaultNode);
      }
    } catch (err: any) {
      console.error("Failed to load incident detail:", err);
      setError(err?.message || "Failed to load incident details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdate = async (overrideStatus?: IncidentStatus) => {
    if (!id) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const targetStatus = overrideStatus || statusVal;
      const updated = await client.updateIncident(id, {
        status: targetStatus,
        assigned_to: assignedTo.trim() || null,
        resolution_notes: resolutionNotes.trim() || null,
      });
      setIncident(updated);
      setStatusVal(updated.status);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Failed to update incident:", err);
      alert(`Update failed: ${err?.message || "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center">
        <div className="inline-flex items-center gap-2 font-chakra uppercase text-xs tracking-wider text-mut">
          <RefreshCw size={14} className="animate-spin text-ok" />
          <span>Loading Incident Dossier #{id}...</span>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="space-y-4 max-w-lg mx-auto py-12">
        <div className="p-6 border border-bad/40 bg-bad/5 text-center text-xs text-bad rounded-sm">
          <ShieldAlert size={24} className="mx-auto mb-2 text-bad" />
          <p className="font-chakra uppercase font-bold text-sm">Incident Not Found</p>
          <p className="font-mono text-mut mt-1">{error || `No dossier found for ID ${id}`}</p>
          <div className="mt-4">
            <Link
              to="/incidents"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-panel border border-line text-xs font-chakra uppercase font-bold text-fg hover:bg-line/20"
            >
              <ArrowLeft size={12} />
              <span>Return to Incidents</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Map API node type to UI NodeType
  const mapNodeType = (type: string): NodeType => {
    if (type === "source") return "source";
    if (type === "context") return "context";
    if (type === "agent" || type === "agent_step") return "agent_step";
    if (type === "sink") return "sink";
    return "source";
  };

  // Map API trust to UI NodeTrust
  const mapNodeTrust = (trust?: string): NodeTrust => {
    if (trust === "system") return "system";
    if (trust === "user") return "user";
    if (trust === "tool") return "tool";
    return "untrusted";
  };

  const isResolved = incident.status === "resolved";

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-2 text-xs font-chakra uppercase text-mut">
          <Link to="/incidents" className="hover:text-fg transition-colors flex items-center gap-1">
            <ArrowLeft size={12} />
            <span>Incidents</span>
          </Link>
          <span>/</span>
          <span className="font-mono text-fg">{incident.id}</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-chakra font-bold tracking-wide uppercase text-fg">
                {incident.title}
              </h1>
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-sm text-xs font-chakra uppercase font-bold tracking-wider border",
                  incident.severity === "critical"
                    ? "border-bad/60 bg-bad/20 text-bad"
                    : incident.severity === "high"
                    ? "border-bad/40 bg-bad/10 text-bad"
                    : "border-warn/40 bg-warn/10 text-warn"
                )}
              >
                {incident.severity} Severity
              </span>

              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-sm text-xs font-chakra uppercase font-semibold tracking-wider border",
                  incident.status === "open"
                    ? "border-bad/50 bg-bad/10 text-bad"
                    : incident.status === "investigating"
                    ? "border-warn/50 bg-warn/10 text-warn"
                    : "border-ok/50 bg-ok/10 text-ok"
                )}
              >
                Status: {incident.status}
              </span>
            </div>

            <p className="text-xs text-mut font-mono mt-1">
              Triggered: {new Date(incident.created_at).toLocaleString()} • Policy:{" "}
              <span className="text-fg">{incident.policy_violated || "default-guardrail"}</span>
            </p>
          </div>

          {/* Quick Status Toggle */}
          <div className="flex items-center gap-2">
            {incident.status !== "resolved" ? (
              <button
                onClick={() => handleUpdate("resolved")}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-ok text-bg font-chakra uppercase font-bold text-xs tracking-wider rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                <span>Resolve Incident</span>
              </button>
            ) : (
              <button
                onClick={() => handleUpdate("investigating")}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-panel border border-warn text-warn font-chakra uppercase font-bold text-xs tracking-wider rounded-sm hover:bg-warn/10 transition-colors disabled:opacity-50"
              >
                <Clock size={14} />
                <span>Re-open for Investigation</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Taint Graph & Provenance, Right = Forensics & Triage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Taint Graph Analysis (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Panel
            title={
              <div className="flex items-center gap-2">
                <GitFork size={15} className="text-warn" />
                <span>Taint Path Graph & Provenance Flow</span>
              </div>
            }
            subtitle="Causal dependency graph tracing untrusted context to intercepted tool sink"
            variant="default"
          >
            <div className="space-y-4">
              {/* Visual Graph Canvas */}
              <div className="p-4 bg-bg/80 border border-line rounded-sm overflow-x-auto min-h-[220px] flex items-center justify-around gap-4">
                {taintGraph && taintGraph.nodes.length > 0 ? (
                  taintGraph.nodes.map((node, idx) => {
                    const isSelected = selectedNode?.id === node.id;
                    return (
                      <React.Fragment key={node.id}>
                        <div className="relative group">
                          <UITaintGraphNode
                            id={node.id}
                            type={mapNodeType(node.type)}
                            label={node.label}
                            sublabel={
                              node.text_preview
                                ? `"${node.text_preview.slice(0, 32)}..."`
                                : node.action
                                ? `Action: ${node.action}`
                                : undefined
                            }
                            trust={mapNodeTrust(node.trust)}
                            isTainted={node.tainted ?? false}
                            taintOrigins={
                              node.tainted ? ["Untrusted Prompt/Tool"] : []
                            }
                            onClick={() => setSelectedNode(node)}
                            className={cn(
                              isSelected && "ring-2 ring-ok ring-offset-1 ring-offset-bg"
                            )}
                          />
                          {isSelected && (
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-ok rounded-full" />
                          )}
                        </div>

                        {idx < taintGraph.nodes.length - 1 && (
                          <div className="flex flex-col items-center justify-center px-1 text-bad">
                            <span className="text-[10px] font-mono uppercase text-bad/80 font-bold mb-0.5">
                              Taint Flow
                            </span>
                            <div className="w-8 sm:w-12 h-0.5 bg-bad/60 relative">
                              <ArrowRight
                                size={14}
                                className="absolute -right-2 -top-1.5 text-bad"
                              />
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <div className="text-xs text-mut font-chakra uppercase p-6">
                    No graph nodes generated for this event.
                  </div>
                )}
              </div>

              {/* Selected Node Deep Inspector */}
              {selectedNode && (
                <div className="border border-line bg-panel p-3.5 rounded-sm space-y-2.5">
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-chakra uppercase font-bold text-xs text-fg">
                        Node Inspector: {selectedNode.label}
                      </span>
                      {selectedNode.tainted && (
                        <span className="px-1.5 py-0.2 bg-bad/20 text-bad border border-bad/40 text-[10px] font-chakra font-bold rounded-sm">
                          TAINT DETECTED
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-mut uppercase">
                      Type: {selectedNode.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-mut text-[11px]">Node ID:</span>
                      <p className="text-fg truncate">{selectedNode.id}</p>
                    </div>
                    <div>
                      <span className="text-mut text-[11px]">Trust Boundary:</span>
                      <p className="text-fg capitalize">{selectedNode.trust || "untrusted"}</p>
                    </div>
                  </div>

                  {selectedNode.text_preview && (
                    <div className="pt-2 border-t border-line">
                      <span className="text-mut text-[11px] font-chakra uppercase font-semibold">
                        Content / Arguments Snapshot:
                      </span>
                      <pre className="mt-1 p-2 bg-bg border border-line rounded-sm font-mono text-[11px] text-fg whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {selectedNode.text_preview}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Taint Path Analysis Narrative */}
              <div className="p-3 bg-panel/60 border border-line rounded-sm text-xs leading-relaxed text-mut">
                <div className="font-chakra font-bold uppercase text-fg text-xs mb-1 flex items-center gap-1.5">
                  <ShieldAlert size={13} className="text-warn" />
                  <span>Causal Assessment</span>
                </div>
                Data originating from an untrusted source entered the agent context and was incorporated into reasoning. When the agent attempted to invoke tool{" "}
                <span className="font-mono text-bad font-semibold">
                  {taintGraph?.tool_name || "sink"}
                </span>
                , AgentShield-X detected the tainted parameter flow and executed intervention policy{" "}
                <span className="font-mono text-fg font-semibold">
                  {incident.policy_violated || "default-guardrail"}
                </span>
                .
              </div>
            </div>
          </Panel>

          {/* Forensics & Attack Metadata */}
          <Panel
            title={
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-ok" />
                <span>Forensic Artifacts & Evidence</span>
              </div>
            }
            variant="default"
          >
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between p-2.5 bg-bg border border-line rounded-sm">
                <span className="text-mut font-chakra uppercase text-[11px]">Session ID:</span>
                <div className="flex items-center gap-2">
                  <span className="text-fg truncate max-w-[240px]">{incident.session_id}</span>
                  <button
                    onClick={() => handleCopy("session", incident.session_id)}
                    className="text-mut hover:text-fg p-1"
                    title="Copy Session ID"
                  >
                    {copiedField === "session" ? <Check size={12} className="text-ok" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-bg border border-line rounded-sm">
                <span className="text-mut font-chakra uppercase text-[11px]">Event ID:</span>
                <div className="flex items-center gap-2">
                  <span className="text-fg truncate max-w-[240px]">{incident.event_id}</span>
                  <button
                    onClick={() => handleCopy("event", incident.event_id)}
                    className="text-mut hover:text-fg p-1"
                    title="Copy Event ID"
                  >
                    {copiedField === "event" ? <Check size={12} className="text-ok" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-bg border border-line rounded-sm">
                <span className="text-mut font-chakra uppercase text-[11px]">Project ID:</span>
                <span className="text-fg">{incident.project_id}</span>
              </div>
            </div>
          </Panel>
        </div>

        {/* Right Column: Operator Triage & Risk Assessment (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Risk Assessment Panel */}
          <Panel
            title="Risk Assessment & Meter"
            variant={incident.risk >= 0.7 ? "critical" : "default"}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-chakra uppercase text-xs text-mut">Composite Risk:</span>
                <span className="font-mono text-base font-bold text-fg">
                  {(incident.risk * 100).toFixed(1)}%
                </span>
              </div>
              <RiskMeter score={incident.risk} showNumeric={false} size="lg" />
              <p className="text-[11px] text-mut leading-relaxed pt-1">
                Risk score synthesized across DeBERTa prompt injection, Isolation Forest tool anomalies, and taint propagation heuristics.
              </p>
            </div>
          </Panel>

          {/* Operator Triage & Resolution Workflow */}
          <Panel
            title={
              <div className="flex items-center gap-2">
                <UserCheck size={15} className="text-ok" />
                <span>Operator Triage & Workflow</span>
              </div>
            }
            variant="default"
          >
            <div className="space-y-4">
              {/* Status Select */}
              <div>
                <label className="block text-xs font-chakra uppercase font-semibold text-fg mb-1.5">
                  Investigation Status
                </label>
                <div className="grid grid-cols-3 gap-2 font-chakra uppercase text-xs">
                  {(["open", "investigating", "resolved"] as IncidentStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusVal(st)}
                      className={cn(
                        "py-1.5 px-2 text-center rounded-sm border transition-colors font-bold",
                        statusVal === st
                          ? st === "resolved"
                            ? "border-ok bg-ok/20 text-ok"
                            : st === "investigating"
                            ? "border-warn bg-warn/20 text-warn"
                            : "border-bad bg-bad/20 text-bad"
                          : "border-line bg-bg text-mut hover:text-fg hover:bg-line/20"
                      )}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-xs font-chakra uppercase font-semibold text-fg mb-1.5">
                  Assigned Security Analyst
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. analyst@company.com"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full bg-bg border border-line px-3 py-1.5 rounded-sm text-xs font-mono text-fg focus:outline-none focus:border-ok"
                  />
                  {user?.email && (
                    <button
                      type="button"
                      onClick={() => setAssignedTo(user.email)}
                      className="px-2.5 py-1.5 text-[11px] font-chakra uppercase border border-line bg-bg text-mut hover:text-fg shrink-0"
                      title="Assign to myself"
                    >
                      Assign Me
                    </button>
                  )}
                </div>
              </div>

              {/* Resolution Notes */}
              <div>
                <label className="block text-xs font-chakra uppercase font-semibold text-fg mb-1.5">
                  Resolution & Forensic Notes
                </label>
                <textarea
                  rows={4}
                  placeholder="Record investigation findings, root cause, and remediation steps taken..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full bg-bg border border-line p-2.5 rounded-sm text-xs font-mono text-fg focus:outline-none focus:border-ok resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleUpdate()}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-ok text-bg font-chakra uppercase font-bold text-xs tracking-wider rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Save size={13} />
                  <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                </button>

                {saveSuccess && (
                  <span className="text-xs text-ok font-chakra uppercase font-semibold flex items-center gap-1">
                    <Check size={13} />
                    <span>Updated!</span>
                  </span>
                )}
              </div>
            </div>
          </Panel>

          {/* Incident Timeline */}
          <Panel title="Incident Timeline" variant="default">
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full bg-bad mt-1 shrink-0" />
                <div>
                  <div className="text-fg font-semibold font-chakra uppercase text-[11px]">
                    Interception Triggered
                  </div>
                  <div className="text-mut text-[10px]">
                    {new Date(incident.created_at).toLocaleString()}
                  </div>
                  <div className="text-mut text-[11px] mt-0.5">
                    Tool call blocked with composite risk {(incident.risk * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full bg-warn mt-1 shrink-0" />
                <div>
                  <div className="text-fg font-semibold font-chakra uppercase text-[11px]">
                    Dossier Created & Taint Extracted
                  </div>
                  <div className="text-mut text-[10px]">
                    {new Date(incident.created_at).toLocaleString()}
                  </div>
                  <div className="text-mut text-[11px] mt-0.5">
                    Extracted causal dependencies for session {incident.session_id.slice(0, 8)}
                  </div>
                </div>
              </div>

              {incident.status === "resolved" && (
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-ok mt-1 shrink-0" />
                  <div>
                    <div className="text-ok font-semibold font-chakra uppercase text-[11px]">
                      Incident Mitigated
                    </div>
                    <div className="text-mut text-[10px]">
                      {new Date(incident.updated_at).toLocaleString()}
                    </div>
                    <div className="text-mut text-[11px] mt-0.5">
                      Marked as resolved by {incident.assigned_to || "operator"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};
