import React, { useEffect, useState } from "react";
import {
  FileCode,
  Plus,
  Search,
  RefreshCw,
  Check,
  AlertCircle,
  Play,
  Trash2,
  Edit3,
  Sliders,
  ShieldAlert,
  ArrowRight,
  Info,
} from "lucide-react";
import {
  Panel,
  PolicyEditor,
  Drawer,
  EmptyState,
  Switch,
  VerdictBadge,
  cn,
} from "@agentshield/ui";
import { useAuth } from "../context/AuthContext";
import {
  Policy,
  ValidatePolicyResponse,
  SimulatePolicyResponse,
} from "@agentshield/api-client";

const DEFAULT_REGO_TEMPLATE = `package shield.guardrails

# Default rule allows tools unless restricted
default allow = true

# Block dangerous shell execution tools without prior approval
block {
    input.tool.name == "bash"
    input.trust == "untrusted"
}

# Restrict sensitive payment and data exfiltration
block {
    input.tool.name == "execute_payment"
    input.risk > 0.35
}
`;

export const Policies: React.FC = () => {
  const { activeProject, client } = useAuth();

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Editor / Simulator Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [version, setVersion] = useState<string>("1.0.0");
  const [rulesRego, setRulesRego] = useState<string>(DEFAULT_REGO_TEMPLATE);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Validation & Simulation states
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<ValidatePolicyResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<SimulatePolicyResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"code" | "simulate">("code");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const loadPolicies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await client.listPolicies(activeProject?.id);
      setPolicies(data);
    } catch (err: any) {
      console.error("Failed to load policies:", err);
      setError(err?.message || "Failed to load policies");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, [activeProject]);

  const handleOpenCreate = () => {
    setEditingPolicyId(null);
    setName("");
    setDescription("");
    setVersion("1.0.0");
    setRulesRego(DEFAULT_REGO_TEMPLATE);
    setIsActive(true);
    setValidationResult(null);
    setSimulationResult(null);
    setActiveTab("code");
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (policy: Policy) => {
    setEditingPolicyId(policy.id);
    setName(policy.name);
    setDescription(policy.description || "");
    setVersion(policy.version || "1.0.0");
    setRulesRego(policy.rules_rego);
    setIsActive(policy.is_active);
    setValidationResult(null);
    setSimulationResult(null);
    setActiveTab("code");
    setIsDrawerOpen(true);
  };

  const handleToggleActive = async (policy: Policy, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await client.updatePolicy(policy.id, {
        is_active: !policy.is_active,
      });
      setPolicies((prev) =>
        prev.map((p) => (p.id === policy.id ? { ...p, is_active: updated.is_active } : p))
      );
    } catch (err: any) {
      console.error("Failed to toggle policy status:", err);
      alert(`Failed to update status: ${err?.message || "Unknown error"}`);
    }
  };

  const handleDelete = async (policyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this policy?")) {
      return;
    }
    try {
      await client.deletePolicy(policyId);
      setPolicies((prev) => prev.filter((p) => p.id !== policyId));
      if (editingPolicyId === policyId) {
        setIsDrawerOpen(false);
      }
    } catch (err: any) {
      console.error("Failed to delete policy:", err);
      alert(`Deletion failed: ${err?.message || "Unknown error"}`);
    }
  };

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const result = await client.validatePolicy({ rules_rego: rulesRego });
      setValidationResult(result);
    } catch (err: any) {
      setValidationResult({
        valid: false,
        errors: [err?.message || "Validation failed"],
        warnings: [],
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    setActiveTab("simulate");
    try {
      const result = await client.simulatePolicy(
        { rules_rego: rulesRego, sample_size: 50 },
        activeProject?.id
      );
      setSimulationResult(result);
    } catch (err: any) {
      console.error("Simulation failed:", err);
      alert(`Simulation failed: ${err?.message || "Unknown error"}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activeProject) return;

    setIsSaving(true);
    try {
      if (editingPolicyId) {
        await client.updatePolicy(editingPolicyId, {
          name: name.trim(),
          description: description.trim(),
          rules_rego: rulesRego,
          version: version.trim(),
          is_active: isActive,
        });
      } else {
        await client.createPolicy(activeProject.id, {
          name: name.trim(),
          description: description.trim(),
          rules_rego: rulesRego,
          version: version.trim(),
          is_active: isActive,
        });
      }
      setIsDrawerOpen(false);
      loadPolicies();
    } catch (err: any) {
      console.error("Failed to save policy:", err);
      alert(`Save failed: ${err?.message || "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPolicies = policies.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      p.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-chakra uppercase font-bold text-xs tracking-widest text-ok">
              Deterministic Guardrails
            </span>
            <span className="text-line">&bull;</span>
            <span className="text-xs text-mut font-mono">Rego / OPA Engine</span>
          </div>
          <h1 className="text-2xl font-chakra font-bold text-fg uppercase tracking-wider mt-1">
            Policy Subsystem
          </h1>
          <p className="text-xs text-mut mt-0.5">
            Define declarative security guardrails, execute dry-run replay simulations, and safely stage changes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadPolicies}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-line bg-panel text-xs text-mut hover:text-fg hover:border-mut transition-colors"
            title="Refresh policies"
          >
            <RefreshCw size={13} className={cn(isLoading && "animate-spin")} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-ok text-bg font-chakra font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            <span>New Policy</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Panel className="p-3">
          <div className="text-[11px] font-chakra uppercase text-mut tracking-wider">
            Active Policies
          </div>
          <div className="text-xl font-chakra font-bold text-ok mt-1">
            {policies.filter((p) => p.is_active).length}
            <span className="text-xs font-mono text-mut font-normal ml-1.5">
              / {policies.length} total
            </span>
          </div>
        </Panel>

        <Panel className="p-3">
          <div className="text-[11px] font-chakra uppercase text-mut tracking-wider">
            Policy Engine
          </div>
          <div className="text-xl font-chakra font-bold text-fg mt-1">
            Open Policy Agent
          </div>
        </Panel>

        <Panel className="p-3">
          <div className="text-[11px] font-chakra uppercase text-mut tracking-wider">
            Enforcement Mode
          </div>
          <div className="text-xl font-chakra font-bold text-ok mt-1">
            Deterministic First
          </div>
        </Panel>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-panel border border-line p-2 rounded-sm">
        <div className="relative flex-1 max-w-md">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mut"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search policies by name, description, ID..."
            className="w-full bg-bg border border-line rounded-sm pl-8 pr-3 py-1.5 text-xs text-fg placeholder:text-mut/50 focus:outline-none focus:border-ok/60"
          />
        </div>

        <div className="text-xs font-mono text-mut">
          Showing {filteredPolicies.length} of {policies.length}
        </div>
      </div>

      {/* Policies Table */}
      <Panel>
        {isLoading && policies.length === 0 ? (
          <div className="py-12 text-center text-xs text-mut font-chakra uppercase tracking-wider animate-pulse">
            Loading security policies...
          </div>
        ) : error ? (
          <div className="p-6 text-center space-y-2">
            <div className="text-xs text-bad font-chakra uppercase tracking-wider">
              {error}
            </div>
            <button
              onClick={loadPolicies}
              className="text-xs text-ok hover:underline uppercase font-chakra"
            >
              Retry
            </button>
          </div>
        ) : filteredPolicies.length === 0 ? (
          <EmptyState
            icon={<FileCode size={32} className="text-mut" />}
            title="No Policies Configured"
            description="Create your first Rego policy to enforce deterministic constraints on agent tool execution."
            actionLabel="Create First Policy"
            onAction={handleOpenCreate}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-line bg-bg/40 text-[11px] font-chakra uppercase text-mut tracking-wider">
                  <th className="py-2.5 px-4 font-semibold">Policy Name & ID</th>
                  <th className="py-2.5 px-4 font-semibold">Description</th>
                  <th className="py-2.5 px-4 font-semibold">Version</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">Last Updated</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40 font-mono">
                {filteredPolicies.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => handleOpenEdit(p)}
                    className="hover:bg-line/10 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <div className="font-chakra font-semibold text-fg uppercase tracking-wider group-hover:text-ok transition-colors">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-mut font-mono mt-0.5">
                        {p.id}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-xs font-sans text-mut max-w-xs truncate">
                      {p.description || "—"}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-block px-1.5 py-0.5 rounded-sm bg-line/40 text-[11px] font-mono text-fg border border-line">
                        v{p.version}
                      </span>
                    </td>

                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={p.is_active}
                          onCheckedChange={() => handleToggleActive(p, {} as any)}
                        />
                        <span
                          className={cn(
                            "text-[10px] font-chakra uppercase font-bold",
                            p.is_active ? "text-ok" : "text-mut"
                          )}
                        >
                          {p.is_active ? "ACTIVE" : "DISABLED"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[11px] text-mut">
                      {new Date(p.updated_at).toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1 text-mut hover:text-ok hover:bg-line/30 rounded-sm transition-colors"
                          title="Edit & Simulate"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(p.id, e)}
                          className="p-1 text-mut hover:text-bad hover:bg-line/30 rounded-sm transition-colors"
                          title="Delete policy"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Editor & Simulator Slide-Over Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingPolicyId ? `Edit Policy: ${name}` : "Create Security Policy"}
        size="lg"
      >
        <div className="flex flex-col h-full space-y-4">
          {/* Drawer Subheader Tabs */}
          <div className="flex items-center justify-between border-b border-line pb-2">
            <div className="flex items-center gap-2 font-chakra uppercase text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("code")}
                className={cn(
                  "px-3 py-1 font-semibold rounded-sm transition-colors",
                  activeTab === "code"
                    ? "bg-ok/10 text-ok border border-ok/30"
                    : "text-mut hover:text-fg"
                )}
              >
                Rego Source
              </button>
              <button
                type="button"
                onClick={handleSimulate}
                className={cn(
                  "px-3 py-1 font-semibold rounded-sm transition-colors flex items-center gap-1.5",
                  activeTab === "simulate"
                    ? "bg-purple/10 text-purple border border-purple/30"
                    : "text-mut hover:text-fg"
                )}
              >
                <Play size={11} className={cn(isSimulating && "animate-spin")} />
                Dry-Run Simulation
                {simulationResult && (
                  <span className="text-[10px] px-1 py-0.2 rounded-full bg-purple/20 text-purple ml-1">
                    {simulationResult.changed_verdicts_count} diffs
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-mut font-chakra uppercase">Enforce:</span>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          {activeTab === "code" ? (
            <form onSubmit={handleSave} className="flex-1 flex flex-col space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-chakra uppercase font-semibold text-mut mb-1">
                    Policy Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Payment Execution Guardrail"
                    className="w-full bg-bg border border-line rounded-sm px-2.5 py-1.5 text-xs text-fg placeholder:text-mut/40 focus:outline-none focus:border-ok/60 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-chakra uppercase font-semibold text-mut mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="1.0.0"
                    className="w-full bg-bg border border-line rounded-sm px-2.5 py-1.5 text-xs text-fg placeholder:text-mut/40 focus:outline-none focus:border-ok/60 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-chakra uppercase font-semibold text-mut mb-1">
                  Description / Intent
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explains what tools and risks this rule intercepts"
                  className="w-full bg-bg border border-line rounded-sm px-2.5 py-1.5 text-xs text-fg placeholder:text-mut/40 focus:outline-none focus:border-ok/60 font-sans"
                />
              </div>

              {/* Code Editor */}
              <div className="flex-1 flex flex-col min-h-[280px]">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-chakra uppercase font-semibold text-mut">
                    Rego Rule Definition
                  </label>
                  <button
                    type="button"
                    onClick={handleValidate}
                    disabled={isValidating}
                    className="text-[11px] font-chakra uppercase text-ok hover:underline flex items-center gap-1"
                  >
                    <Check size={11} /> Validate Syntax
                  </button>
                </div>

                <PolicyEditor
                  value={rulesRego}
                  onChange={setRulesRego}
                  language="rego"
                  className="flex-1"
                  error={
                    validationResult && !validationResult.valid
                      ? validationResult.errors[0]
                      : null
                  }
                />

                {/* Validation Feedback Banner */}
                {validationResult && (
                  <div
                    className={cn(
                      "mt-2 p-2.5 rounded-sm border text-xs",
                      validationResult.valid
                        ? "bg-ok/10 border-ok/30 text-ok"
                        : "bg-bad/10 border-bad/30 text-bad"
                    )}
                  >
                    <div className="font-chakra uppercase font-bold text-[11px] flex items-center gap-1.5">
                      {validationResult.valid ? (
                        <>
                          <Check size={13} /> Rego Syntax Valid
                        </>
                      ) : (
                        <>
                          <AlertCircle size={13} /> Syntax Validation Failed
                        </>
                      )}
                    </div>
                    {validationResult.errors.length > 0 && (
                      <ul className="list-disc list-inside mt-1 font-mono text-[11px] space-y-0.5">
                        {validationResult.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    )}
                    {validationResult.warnings.length > 0 && (
                      <div className="text-warn text-[11px] mt-1 font-sans">
                        Warning: {validationResult.warnings.join(", ")}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-line mt-auto">
                <button
                  type="button"
                  onClick={handleSimulate}
                  className="px-3 py-1.5 border border-line bg-panel text-xs text-mut hover:text-fg hover:border-mut rounded-sm font-chakra uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Play size={12} /> Test Dry Run
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-3 py-1.5 border border-line text-xs text-mut hover:text-fg rounded-sm font-chakra uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-1.5 bg-ok text-bg font-chakra font-bold text-xs uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity"
                  >
                    {isSaving ? "Saving..." : editingPolicyId ? "Save Changes" : "Deploy Policy"}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Simulation View */
            <div className="flex-1 flex flex-col space-y-4 overflow-y-auto">
              <div className="p-3 bg-panel border border-line rounded-sm space-y-2">
                <div className="text-[11px] font-chakra uppercase text-mut font-semibold flex items-center gap-1.5">
                  <Info size={12} className="text-ok" />
                  Traffic Replay Simulator
                </div>
                <p className="text-xs text-mut">
                  Evaluates this policy against the last 50 production events to predict verdict changes before publishing.
                </p>
                <button
                  onClick={handleSimulate}
                  disabled={isSimulating}
                  className="px-3 py-1 bg-panel border border-line text-xs text-ok hover:border-ok rounded-sm font-chakra uppercase tracking-wider flex items-center gap-1"
                >
                  <RefreshCw size={11} className={cn(isSimulating && "animate-spin")} />
                  Rerun Simulation
                </button>
              </div>

              {isSimulating ? (
                <div className="py-12 text-center text-xs font-chakra uppercase tracking-wider text-mut animate-pulse">
                  Simulating policy execution against historical telemetry...
                </div>
              ) : simulationResult ? (
                <div className="space-y-4">
                  {/* Simulation KPIs */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 bg-panel border border-line rounded-sm text-center">
                      <div className="text-[10px] font-chakra uppercase text-mut">Evaluated</div>
                      <div className="text-lg font-chakra font-bold text-fg mt-0.5">
                        {simulationResult.total_simulated}
                      </div>
                    </div>

                    <div className="p-2.5 bg-panel border border-line rounded-sm text-center">
                      <div className="text-[10px] font-chakra uppercase text-mut">Verdict Diffs</div>
                      <div
                        className={cn(
                          "text-lg font-chakra font-bold mt-0.5",
                          simulationResult.changed_verdicts_count > 0 ? "text-warn" : "text-ok"
                        )}
                      >
                        {simulationResult.changed_verdicts_count}
                      </div>
                    </div>

                    <div className="p-2.5 bg-panel border border-line rounded-sm text-center">
                      <div className="text-[10px] font-chakra uppercase text-mut">Net Block Diff</div>
                      <div
                        className={cn(
                          "text-lg font-chakra font-bold mt-0.5",
                          simulationResult.blocked_diff > 0
                            ? "text-bad"
                            : simulationResult.blocked_diff < 0
                            ? "text-ok"
                            : "text-fg"
                        )}
                      >
                        {simulationResult.blocked_diff > 0
                          ? `+${simulationResult.blocked_diff}`
                          : simulationResult.blocked_diff}
                      </div>
                    </div>
                  </div>

                  {/* Changed Events Table */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-chakra uppercase text-mut font-semibold">
                      Impacted Verdicts ({simulationResult.changed_events.length})
                    </div>

                    {simulationResult.changed_events.length === 0 ? (
                      <div className="p-4 text-center border border-line rounded-sm bg-panel text-xs text-ok font-chakra uppercase">
                        Zero verdict changes predicted. Policy is 100% compliant with historical traffic.
                      </div>
                    ) : (
                      <div className="border border-line rounded-sm overflow-hidden bg-panel">
                        <table className="w-full text-left text-xs font-mono">
                          <thead>
                            <tr className="border-b border-line bg-bg/40 text-[10px] font-chakra uppercase text-mut">
                              <th className="py-2 px-3">Event / Tool</th>
                              <th className="py-2 px-3">Original</th>
                              <th className="py-2 px-3">Simulated</th>
                              <th className="py-2 px-3 text-right">Risk</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line/30">
                            {simulationResult.changed_events.map((ev, i) => (
                              <tr key={i} className="hover:bg-line/10">
                                <td className="py-2 px-3">
                                  <div className="font-semibold text-fg">{ev.tool_name}</div>
                                  <div className="text-[10px] text-mut">{ev.event_id}</div>
                                </td>
                                <td className="py-2 px-3">
                                  <VerdictBadge action={ev.original_action} size="sm" />
                                </td>
                                <td className="py-2 px-3">
                                  <VerdictBadge action={ev.simulated_action} size="sm" />
                                </td>
                                <td className="py-2 px-3 text-right text-fg font-semibold">
                                  {(ev.risk * 100).toFixed(0)}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Impacted Sessions Tags */}
                  {simulationResult.impacted_sessions.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-chakra uppercase text-mut font-semibold">
                        Impacted Multi-Turn Sessions ({simulationResult.impacted_sessions.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {simulationResult.impacted_sessions.map((sess, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-line/20 border border-line rounded-sm text-[10px] font-mono text-fg"
                          >
                            {sess}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              <div className="pt-3 border-t border-line mt-auto flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab("code")}
                  className="px-3 py-1.5 bg-ok text-bg font-chakra font-bold text-xs uppercase tracking-wider rounded-sm"
                >
                  Return to Code
                </button>
              </div>
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
};
