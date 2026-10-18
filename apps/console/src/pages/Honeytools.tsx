import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Flame,
  Plus,
  Search,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  Terminal,
  Key,
  Info,
} from "lucide-react";
import {
  Panel,
  EmptyState,
  Drawer,
  cn,
} from "@agentshield/ui";
import { useAuth } from "../context/AuthContext";
import {
  Honeytool,
  HoneyTrigger,
} from "@agentshield/api-client";

export const Honeytools: React.FC = () => {
  const { activeProject, client } = useAuth();

  const [honeytools, setHoneytools] = useState<Honeytool[]>([]);
  const [triggers, setTriggers] = useState<HoneyTrigger[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"inventory" | "triggers">("inventory");

  // Deploy Decoy Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [type, setType] = useState<"tool" | "token">("tool");
  const [description, setDescription] = useState<string>("");
  const [sensitivity, setSensitivity] = useState<string>("critical");
  const [isDeploying, setIsDeploying] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [toolsData, triggersData] = await Promise.all([
        client.listHoneytools(activeProject?.id),
        client.listHoneyTriggers(activeProject?.id),
      ]);
      setHoneytools(toolsData);
      setTriggers(triggersData);
    } catch (err: any) {
      console.error("Failed to load honeytools data:", err);
      setError(err?.message || "Failed to load honeytools");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProject]);

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activeProject) return;

    setIsDeploying(true);
    try {
      await client.createHoneytool(activeProject.id, {
        name: name.trim(),
        type,
        description: description.trim(),
        sensitivity,
      });
      setIsDrawerOpen(false);
      setName("");
      setDescription("");
      loadData();
    } catch (err: any) {
      console.error("Failed to deploy honeytool:", err);
      alert(`Deployment failed: ${err?.message || "Unknown error"}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Remove this decoy trap from active monitoring?")) return;
    try {
      await client.deleteHoneytool(id);
      setHoneytools((prev) => prev.filter((h) => h.id !== id));
    } catch (err: any) {
      console.error("Failed to delete honeytool:", err);
      alert(`Deletion failed: ${err?.message || "Unknown error"}`);
    }
  };

  const handleSelectPreset = (presetName: string, presetType: "tool" | "token", desc: string) => {
    setName(presetName);
    setType(presetType);
    setDescription(desc);
  };

  const filteredHoneytools = honeytools.filter((h) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      h.name.toLowerCase().includes(q) ||
      (h.description && h.description.toLowerCase().includes(q)) ||
      h.id.toLowerCase().includes(q);
    const matchesType = typeFilter === "all" || h.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalTriggers = honeytools.reduce((acc, h) => acc + h.trigger_count, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-chakra uppercase font-bold text-xs tracking-widest text-bad">
              Active Deception
            </span>
            <span className="text-line">&bull;</span>
            <span className="text-xs text-mut font-mono">Honeypots & Decoy Traps</span>
          </div>
          <h1 className="text-2xl font-chakra font-bold text-fg uppercase tracking-wider mt-1">
            Honeytools & Decoys
          </h1>
          <p className="text-xs text-mut mt-0.5">
            Seed tempting fake tools and canary tokens to immediately expose prompt injections, goal hijacks, and rogue agents.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-line bg-panel text-xs text-mut hover:text-fg hover:border-mut transition-colors"
            title="Refresh honeypots"
          >
            <RefreshCw size={13} className={cn(isLoading && "animate-spin")} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-bad text-fg font-chakra font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            <span>Deploy Decoy</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Panel className="p-3">
          <div className="text-[11px] font-chakra uppercase text-mut tracking-wider">
            Active Traps
          </div>
          <div className="text-xl font-chakra font-bold text-fg mt-1">
            {honeytools.length}
          </div>
        </Panel>

        <Panel className="p-3">
          <div className="text-[11px] font-chakra uppercase text-mut tracking-wider">
            Trap Triggers
          </div>
          <div
            className={cn(
              "text-xl font-chakra font-bold mt-1 flex items-center gap-2",
              totalTriggers > 0 ? "text-bad" : "text-ok"
            )}
          >
            {totalTriggers}
            {totalTriggers > 0 && (
              <span className="inline-block w-2 h-2 rounded-full bg-bad animate-ping" />
            )}
          </div>
        </Panel>

        <Panel className="p-3">
          <div className="text-[11px] font-chakra uppercase text-mut tracking-wider">
            Tool vs Canary Split
          </div>
          <div className="text-xl font-chakra font-bold text-purple mt-1 font-mono">
            {honeytools.filter((h) => h.type === "tool").length}T /{" "}
            {honeytools.filter((h) => h.type === "token").length}K
          </div>
        </Panel>

        <Panel className="p-3">
          <div className="text-[11px] font-chakra uppercase text-mut tracking-wider">
            Trap Interception
          </div>
          <div className="text-xl font-chakra font-bold text-bad mt-1">
            100% Immediate Kill
          </div>
        </Panel>
      </div>

      {/* Tabs and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-panel border border-line p-2 rounded-sm">
        <div className="flex items-center gap-1 font-chakra uppercase text-xs">
          <button
            onClick={() => setActiveTab("inventory")}
            className={cn(
              "px-3 py-1 font-semibold rounded-sm transition-colors",
              activeTab === "inventory"
                ? "bg-bad/10 text-bad border border-bad/30"
                : "text-mut hover:text-fg"
            )}
          >
            Decoy Inventory ({honeytools.length})
          </button>
          <button
            onClick={() => setActiveTab("triggers")}
            className={cn(
              "px-3 py-1 font-semibold rounded-sm transition-colors flex items-center gap-1.5",
              activeTab === "triggers"
                ? "bg-warn/10 text-warn border border-warn/30"
                : "text-mut hover:text-fg"
            )}
          >
            Forensic Trigger Feed
            {triggers.length > 0 && (
              <span className="px-1 py-0.2 rounded-full bg-bad/20 text-bad text-[10px] font-mono">
                {triggers.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "inventory" && (
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-bg border border-line text-xs text-fg rounded-sm px-2 py-1 font-chakra uppercase focus:outline-none"
            >
              <option value="all">All Decoy Types</option>
              <option value="tool">Decoy Tools</option>
              <option value="token">Canary Tokens</option>
            </select>

            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mut"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search decoys..."
                className="w-48 bg-bg border border-line rounded-sm pl-8 pr-3 py-1 text-xs text-fg placeholder:text-mut/50 focus:outline-none focus:border-bad/60"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      {activeTab === "inventory" ? (
        <Panel>
          {isLoading && honeytools.length === 0 ? (
            <div className="py-12 text-center text-xs text-mut font-chakra uppercase tracking-wider animate-pulse">
              Loading active decoy traps...
            </div>
          ) : error ? (
            <div className="p-6 text-center space-y-2">
              <div className="text-xs text-bad font-chakra uppercase tracking-wider">
                {error}
              </div>
              <button
                onClick={loadData}
                className="text-xs text-ok hover:underline uppercase font-chakra"
              >
                Retry
              </button>
            </div>
          ) : filteredHoneytools.length === 0 ? (
            <EmptyState
              icon={<Flame size={32} className="text-bad" />}
              title="No Decoy Traps Configured"
              description="Deploy your first decoy tool or canary credential to entrap rogue agents and prompt injections."
              actionLabel="Deploy Decoy Trap"
              onAction={() => setIsDrawerOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-line bg-bg/40 text-[11px] font-chakra uppercase text-mut tracking-wider">
                    <th className="py-2.5 px-4 font-semibold">Decoy Name & ID</th>
                    <th className="py-2.5 px-4 font-semibold">Type</th>
                    <th className="py-2.5 px-4 font-semibold">Description</th>
                    <th className="py-2.5 px-4 font-semibold">Severity</th>
                    <th className="py-2.5 px-4 font-semibold">Trap Triggers</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40 font-mono">
                  {filteredHoneytools.map((ht) => (
                    <tr key={ht.id} className="hover:bg-line/10 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-chakra font-bold text-fg uppercase tracking-wider flex items-center gap-2">
                          {ht.type === "tool" ? (
                            <Terminal size={13} className="text-bad" />
                          ) : (
                            <Key size={13} className="text-purple" />
                          )}
                          {ht.name}
                        </div>
                        <div className="text-[10px] text-mut font-mono mt-0.5">
                          {ht.id}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded-sm text-[10px] uppercase font-bold border",
                            ht.type === "tool"
                              ? "bg-bad/10 text-bad border-bad/30"
                              : "bg-purple/10 text-purple border-purple/30"
                          )}
                        >
                          {ht.type === "tool" ? "Decoy Tool" : "Canary Token"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs font-sans text-mut max-w-xs truncate">
                        {ht.description || "—"}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-1.5 py-0.5 rounded-sm bg-bad/10 text-bad border border-bad/30 text-[10px] font-bold uppercase">
                          {ht.sensitivity}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "font-bold text-xs px-2 py-0.5 rounded-sm font-mono",
                            ht.trigger_count > 0
                              ? "bg-bad/20 text-bad border border-bad/40"
                              : "text-mut"
                          )}
                        >
                          {ht.trigger_count} touches
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => handleDelete(ht.id, e)}
                          className="p-1 text-mut hover:text-bad hover:bg-line/30 rounded-sm transition-colors"
                          title="Remove trap"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      ) : (
        /* Forensic Trigger Feed */
        <Panel title="Forensic Interception Triggers">
          {triggers.length === 0 ? (
            <div className="p-8 text-center text-xs text-ok font-chakra uppercase tracking-wider">
              No honeytrap triggers recorded. Decoys remain untouched.
            </div>
          ) : (
            <div className="divide-y divide-line/40">
              {triggers.map((trig) => (
                <div key={trig.id} className="p-4 space-y-2 hover:bg-line/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-sm bg-bad/20 text-bad border border-bad/30">
                        <AlertTriangle size={14} />
                      </span>
                      <div className="font-chakra font-bold text-bad uppercase tracking-wider text-xs">
                        Trap Sprung: {trig.honeytool_id}
                      </div>
                      <span className="text-xs text-mut font-mono">
                        {trig.id} &bull; {new Date(trig.triggered_at).toLocaleString()}
                      </span>
                    </div>

                    <span className="px-1.5 py-0.5 rounded-sm bg-bad text-fg text-[10px] font-chakra font-bold uppercase">
                      KILL_SESSION APPLIED
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-mut bg-bg/40 p-2 rounded-sm border border-line">
                    <div>
                      Agent:{" "}
                      <Link
                        to={`/agents/${trig.agent_id}`}
                        className="text-fg hover:text-bad underline"
                      >
                        {trig.agent_id}
                      </Link>
                    </div>
                    <span>&bull;</span>
                    <div>
                      Session:{" "}
                      <Link
                        to={`/sessions/${trig.session_id}`}
                        className="text-fg hover:text-bad underline"
                      >
                        {trig.session_id}
                      </Link>
                    </div>
                    <span>&bull;</span>
                    <div>Event: {trig.event_id}</div>
                  </div>

                  <div>
                    <div className="text-[10px] font-chakra uppercase text-mut font-semibold mb-1">
                      Attacker Arguments Captured
                    </div>
                    <pre className="p-2 bg-bg border border-line rounded-sm font-mono text-[11px] text-fg overflow-x-auto">
                      {JSON.stringify(trig.arguments, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* Deploy Decoy Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Deploy Active Decoy Trap"
        size="md"
      >
        <form onSubmit={handleDeploy} className="space-y-4">
          <div className="p-3 bg-bad/10 border border-bad/30 rounded-sm text-xs text-bad">
            <div className="font-chakra uppercase font-bold flex items-center gap-1.5">
              <Flame size={13} /> Active Honeypot Defense
            </div>
            <p className="mt-1 text-fg/80 font-sans text-xs">
              Decoy tools are advertised to the LLM agent via its system tool definitions. Any model attempt to invoke a decoy immediately terminates the session and raises a critical alarm.
            </p>
          </div>

          {/* Quick Preset Pills */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-chakra uppercase font-semibold text-mut">
              Recommended Decoy Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: "export_all_customers", type: "tool" as const, desc: "Dumps complete customer CRM table" },
                { name: "dump_system_credentials", type: "tool" as const, desc: "Dumps runtime environment variables and AWS secrets" },
                { name: "elevate_to_superuser", type: "tool" as const, desc: "Requests Unix sudo / root elevation" },
                { name: "fetch_master_keys", type: "tool" as const, desc: "Requests master KMS encryption secrets" },
                { name: "PROD_API_KEY_CANARY", type: "token" as const, desc: "Canary credential in system context" },
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(preset.name, preset.type, preset.desc)}
                  className="px-2 py-1 bg-panel border border-line hover:border-bad/60 rounded-sm text-[10px] font-mono text-fg transition-colors"
                >
                  +{preset.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-chakra uppercase font-semibold text-mut mb-1">
              Decoy Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. dump_customer_records"
              className="w-full bg-bg border border-line rounded-sm px-2.5 py-1.5 text-xs text-fg placeholder:text-mut/40 focus:outline-none focus:border-bad/60 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-chakra uppercase font-semibold text-mut mb-1">
                Decoy Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-bg border border-line rounded-sm px-2.5 py-1.5 text-xs text-fg focus:outline-none font-chakra uppercase"
              >
                <option value="tool">Decoy Tool (Function)</option>
                <option value="token">Canary Token (Credential)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-chakra uppercase font-semibold text-mut mb-1">
                Sensitivity
              </label>
              <select
                value={sensitivity}
                onChange={(e) => setSensitivity(e.target.value)}
                className="w-full bg-bg border border-line rounded-sm px-2.5 py-1.5 text-xs text-fg focus:outline-none font-chakra uppercase"
              >
                <option value="critical">Critical (Kill Session)</option>
                <option value="high">High (Block Only)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-chakra uppercase font-semibold text-mut mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explains what this decoy simulates..."
              className="w-full bg-bg border border-line rounded-sm p-2 text-xs text-fg placeholder:text-mut/40 focus:outline-none focus:border-bad/60 font-sans resize-none"
            />
          </div>

          <div className="pt-3 border-t border-line flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="px-3 py-1.5 border border-line text-xs text-mut hover:text-fg rounded-sm font-chakra uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDeploying}
              className="px-4 py-1.5 bg-bad text-fg font-chakra font-bold text-xs uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity"
            >
              {isDeploying ? "Deploying..." : "Deploy Decoy"}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};
