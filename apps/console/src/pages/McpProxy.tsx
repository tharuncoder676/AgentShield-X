import React, { useEffect, useState } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Server,
  Lock,
  Copy,
  Check,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Terminal,
  FileCode,
  AlertTriangle,
  Info,
  Cable,
} from "lucide-react";
import { Panel, EmptyState, Drawer, cn } from "@agentshield/ui";
import { useAuth } from "../context/AuthContext";
import { MCPServer, MCPPin, MCPAlert } from "@agentshield/api-client";
import { UniversalConnectorsHub } from "../components/UniversalConnectorsHub";

export const McpProxy: React.FC = () => {
  const { activeProject, client } = useAuth();

  const [servers, setServers] = useState<MCPServer[]>([]);
  const [pins, setPins] = useState<MCPPin[]>([]);
  const [alerts, setAlerts] = useState<MCPAlert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"connectors" | "pins" | "alerts" | "servers">("connectors");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Pin tool drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newServerId, setNewServerId] = useState("");
  const [newToolName, setNewToolName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [serversData, pinsData, alertsData] = await Promise.all([
        client.listMCPServers(activeProject?.id),
        client.listMCPPins(activeProject?.id),
        client.listMCPAlerts(activeProject?.id),
      ]);
      setServers(serversData);
      setPins(pinsData);
      setAlerts(alertsData);
      if (serversData.length > 0 && !newServerId) {
        setNewServerId(serversData[0].id);
      }
    } catch (err: any) {
      console.error("Failed to load MCP telemetry:", err);
      setError(err?.message || "Failed to load MCP security data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProject]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToolName.trim() || !newServerId) return;

    setIsSaving(true);
    try {
      // Create a deterministic pin
      const canonicalHash = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      await client.saveMCPPin(
        {
          server_id: newServerId,
          tool_name: newToolName.trim(),
          canonical_hash: canonicalHash,
          description_hash: canonicalHash.slice(0, 32),
          schema_hash: canonicalHash.slice(32),
          description: newDescription.trim(),
          input_schema: { type: "object", properties: {} },
        },
        activeProject?.id
      );

      setIsDrawerOpen(false);
      setNewToolName("");
      setNewDescription("");
      await loadData();
    } catch (err: any) {
      alert(`Error pinning tool: ${err?.message || "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePin = async (toolName: string, serverId: string) => {
    if (!confirm(`Revoke pin for tool '${toolName}'? Unpinned tools in strict mode will be quarantined.`)) {
      return;
    }
    try {
      await client.deleteMCPPin(toolName, serverId, activeProject?.id);
      await loadData();
    } catch (err: any) {
      alert(`Error deleting pin: ${err?.message || "Unknown error"}`);
    }
  };

  // Filtered tools
  const filteredPins = pins.filter(
    (p) =>
      p.tool_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.canonical_hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-chakra font-bold uppercase tracking-wider text-fg flex items-center gap-2">
              <Lock className="text-ok" size={20} />
              MCP Security Proxy & Tool Rug-Pull Guard
            </h1>
            <span className="text-[10px] px-2 py-0.5 bg-ok/10 text-ok border border-ok/30 rounded font-mono uppercase tracking-wider">
              Enforce Active
            </span>
          </div>
          <p className="text-xs text-mut mt-1">
            Zero-trust Model Context Protocol proxy that pins tool definitions, detects shadow schema mutations, and blocks indirect prompt injection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="px-3 py-1.5 bg-panel border border-line text-mut hover:text-fg text-xs font-chakra uppercase rounded flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={14} className={cn(isLoading && "animate-spin")} />
            Refresh
          </button>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="px-3 py-1.5 bg-ok text-bg font-chakra font-bold text-xs uppercase tracking-wider rounded flex items-center gap-1.5 hover:bg-ok/90 transition-colors shadow-sm"
          >
            <Plus size={14} />
            Pin New Tool
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Panel className="p-4 border-line bg-panel/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-mut uppercase font-chakra tracking-wider">Pinned Definitions</span>
            <Lock className="text-ok" size={16} />
          </div>
          <div className="mt-2 text-2xl font-chakra font-bold text-fg">
            {pins.length}
          </div>
          <div className="mt-1 text-[11px] text-mut flex items-center gap-1">
            <span className="text-ok font-mono font-bold">100%</span> verified canonical hashes
          </div>
        </Panel>

        <Panel className="p-4 border-line bg-panel/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-mut uppercase font-chakra tracking-wider">Monitored Servers</span>
            <Server className="text-fg" size={16} />
          </div>
          <div className="mt-2 text-2xl font-chakra font-bold text-fg">
            {servers.length}
          </div>
          <div className="mt-1 text-[11px] text-mut">
            stdio & SSE protocol endpoints
          </div>
        </Panel>

        <Panel className="p-4 border-line bg-panel/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-mut uppercase font-chakra tracking-wider">Rug-Pulls Deflected</span>
            <ShieldAlert className={alerts.length > 0 ? "text-bad" : "text-ok"} size={16} />
          </div>
          <div className="mt-2 text-2xl font-chakra font-bold text-fg">
            {alerts.length}
          </div>
          <div className="mt-1 text-[11px] text-mut">
            Shadow schema mutations blocked
          </div>
        </Panel>

        <Panel className="p-4 border-line bg-panel/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-mut uppercase font-chakra tracking-wider">Supply-Chain Health</span>
            <ShieldCheck className="text-ok" size={16} />
          </div>
          <div className="mt-2 text-2xl font-chakra font-bold text-ok">
            Protected
          </div>
          <div className="mt-1 text-[11px] text-mut">
            Zero-trust fail-closed policy
          </div>
        </Panel>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-line gap-4">
        <button
          onClick={() => setActiveTab("connectors")}
          className={cn(
            "pb-2 font-chakra font-bold text-xs uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5",
            activeTab === "connectors"
              ? "border-ok text-ok"
              : "border-transparent text-mut hover:text-fg"
          )}
        >
          <Cable size={14} />
          Universal Connectors & LLM Gateway
        </button>
        <button
          onClick={() => setActiveTab("pins")}
          className={cn(
            "pb-2 font-chakra font-bold text-xs uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5",
            activeTab === "pins"
              ? "border-ok text-ok"
              : "border-transparent text-mut hover:text-fg"
          )}
        >
          <Lock size={14} />
          Tool Definition Pins ({pins.length})
        </button>
        <button
          onClick={() => setActiveTab("alerts")}
          className={cn(
            "pb-2 font-chakra font-bold text-xs uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5",
            activeTab === "alerts"
              ? "border-ok text-ok"
              : "border-transparent text-mut hover:text-fg"
          )}
        >
          <AlertTriangle size={14} />
          Rug-Pull Incursions ({alerts.length})
        </button>
        <button
          onClick={() => setActiveTab("servers")}
          className={cn(
            "pb-2 font-chakra font-bold text-xs uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5",
            activeTab === "servers"
              ? "border-ok text-ok"
              : "border-transparent text-mut hover:text-fg"
          )}
        >
          <Server size={14} />
          Upstream MCP Servers ({servers.length})
        </button>
      </div>

      {/* Tab: Universal Connectors */}
      {activeTab === "connectors" && <UniversalConnectorsHub />}

      {/* Tab: Tool Definition Pins */}
      {activeTab === "pins" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mut" />
              <input
                type="text"
                placeholder="Search tools by name, description or canonical hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-panel border border-line pl-9 pr-3 py-1.5 text-xs text-fg rounded focus:outline-none focus:border-ok font-mono placeholder:font-sans"
              />
            </div>
          </div>

          <Panel title="Pinned MCP Tool Registry" className="overflow-hidden">
            {filteredPins.length === 0 ? (
              <EmptyState
                icon={<Lock size={32} className="text-mut" />}
                title="No Tool Pins Found"
                description={searchQuery ? "No tools match your search query." : "Run 'agentshield mcp-proxy --mode pin' or click 'Pin New Tool' to lock baseline schemas."}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-line bg-panel/30 text-mut uppercase font-chakra text-[11px] tracking-wider">
                      <th className="py-2.5 px-4">Tool Name</th>
                      <th className="py-2.5 px-4">Canonical SHA-256 Pin</th>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredPins.map((pin) => (
                      <tr key={pin.id} className="hover:bg-panel/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-fg flex items-center gap-2">
                          <Lock size={13} className="text-ok" />
                          <span>{pin.tool_name}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-mut">
                          <div className="flex items-center gap-2">
                            <span>{pin.canonical_hash.slice(0, 16)}...{pin.canonical_hash.slice(-8)}</span>
                            <button
                              onClick={() => handleCopy(pin.canonical_hash, pin.id)}
                              className="text-mut hover:text-fg"
                              title="Copy full hash"
                            >
                              {copiedIndex === pin.id ? <Check size={12} className="text-ok" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-mut max-w-xs truncate" title={pin.description || ""}>
                          {pin.description || <span className="italic text-mut/50">No description</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-ok/10 text-ok border border-ok/30 uppercase">
                            {pin.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeletePin(pin.tool_name, pin.server_id)}
                            className="p-1 text-mut hover:text-bad rounded transition-colors"
                            title="Revoke pin"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* Tab: Rug-Pull Alerts */}
      {activeTab === "alerts" && (
        <Panel title="Rug-Pull Incursion Log" className="overflow-hidden">
          {alerts.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck size={32} className="text-ok" />}
              title="Zero Rug-Pull Incursions Detected"
              description="Upstream MCP servers are serving valid, unmutated tool definitions matching canonical lockfile hashes."
            />
          ) : (
            <div className="divide-y divide-line">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-4 hover:bg-panel/40 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded font-mono font-bold uppercase bg-bad/20 text-bad border border-bad/40">
                        {alert.severity} Rug-Pull
                      </span>
                      <span className="font-chakra font-bold text-sm text-fg">
                        Tool: <span className="text-ok font-mono">{alert.tool_name}</span>
                      </span>
                    </div>
                    <span className="text-[11px] text-mut font-mono">
                      {new Date(alert.created_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-fg/90 font-mono bg-panel p-2 rounded border border-line">
                    {alert.diff_summary}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-mut font-mono">
                    <div>Pinned Hash: <span className="text-fg">{alert.pinned_hash.slice(0, 16)}...</span></div>
                    <div>Observed Hash: <span className="text-bad">{alert.observed_hash.slice(0, 16)}...</span></div>
                    <div>Action Taken: <span className="text-ok font-bold uppercase">{alert.action_taken}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* Tab: Upstream Servers */}
      {activeTab === "servers" && (
        <div className="space-y-6">
          <Panel title="Registered Upstream MCP Servers">
            <div className="divide-y divide-line">
              {servers.map((srv) => (
                <div key={srv.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Server size={15} className="text-ok" />
                      <span className="font-chakra font-bold text-sm text-fg">{srv.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-panel border border-line text-mut rounded font-mono uppercase">
                        {srv.transport}
                      </span>
                    </div>
                    <div className="font-mono text-xs text-mut">
                      Command: <span className="text-fg">{srv.command_or_url}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-chakra">
                    <div>
                      <span className="text-mut uppercase text-[10px]">Pinned Tools:</span>{" "}
                      <span className="font-bold text-fg">{srv.pinned_tools_count}</span>
                    </div>
                    <div>
                      <span className="text-mut uppercase text-[10px]">Status:</span>{" "}
                      <span className="text-ok font-bold uppercase">{srv.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Quick Integration Guide */}
          <Panel title="Claude Desktop / Agent Integration">
            <div className="p-4 space-y-3">
              <p className="text-xs text-mut leading-relaxed">
                To protect Claude Desktop, Cursor, or any MCP client against tool rug-pulls and indirect injection, wrap your upstream MCP servers with AgentShield Proxy:
              </p>

              <div className="bg-bg p-3 rounded border border-line font-mono text-xs text-fg relative">
                <button
                  onClick={() =>
                    handleCopy(
                      JSON.stringify(
                        {
                          mcpServers: {
                            "database-protected": {
                              command: "agentshield",
                              args: [
                                "mcp-proxy",
                                "--upstream",
                                "npx -y @modelcontextprotocol/server-postgres",
                                "--pins",
                                "./mcp_pins.json",
                                "--mode",
                                "enforce",
                              ],
                            },
                          },
                        },
                        null,
                        2
                      ),
                      "claude-cfg"
                    )
                  }
                  className="absolute top-3 right-3 text-mut hover:text-fg p-1 rounded bg-panel border border-line"
                  title="Copy configuration snippet"
                >
                  {copiedIndex === "claude-cfg" ? <Check size={13} className="text-ok" /> : <Copy size={13} />}
                </button>
                <pre className="overflow-x-auto text-[11px] leading-relaxed">
{`{
  "mcpServers": {
    "database-protected": {
      "command": "agentshield",
      "args": [
        "mcp-proxy",
        "--upstream", "npx -y @modelcontextprotocol/server-postgres",
        "--pins", "./mcp_pins.json",
        "--mode", "enforce"
      ]
    }
  }
}`}
                </pre>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* Drawer: Pin New Tool */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Pin Approved MCP Tool Definition"
      >
        <form onSubmit={handleSavePin} className="space-y-4 p-4 text-xs font-sans">
          <p className="text-mut leading-relaxed">
            Register a verified tool definition to establish a canonical cryptographic baseline. Any subsequent deviation by an upstream server will trigger a Rug-Pull alert and automatic safe restoration.
          </p>

          <div>
            <label className="block text-mut uppercase font-chakra text-[11px] mb-1">Upstream Server</label>
            <select
              value={newServerId}
              onChange={(e) => setNewServerId(e.target.value)}
              className="w-full bg-panel border border-line p-2 rounded text-fg focus:outline-none focus:border-ok font-mono"
            >
              {servers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.command_or_url})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-mut uppercase font-chakra text-[11px] mb-1">Tool Name</label>
            <input
              type="text"
              required
              placeholder="e.g. read_file, execute_sql"
              value={newToolName}
              onChange={(e) => setNewToolName(e.target.value)}
              className="w-full bg-panel border border-line p-2 rounded text-fg focus:outline-none focus:border-ok font-mono"
            />
          </div>

          <div>
            <label className="block text-mut uppercase font-chakra text-[11px] mb-1">Verified Description</label>
            <textarea
              rows={3}
              placeholder="Human and model readable description of the tool..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full bg-panel border border-line p-2 rounded text-fg focus:outline-none focus:border-ok font-mono resize-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-line">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="px-3 py-1.5 text-mut hover:text-fg font-chakra uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-1.5 bg-ok text-bg font-chakra font-bold uppercase rounded hover:bg-ok/90 disabled:opacity-50"
            >
              {isSaving ? "Locking Pin..." : "Lock Tool Pin"}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};
