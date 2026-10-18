import React, { useEffect, useState } from "react";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  ShieldAlert,
  Clock,
} from "lucide-react";
import { Panel, DataTable } from "@agentshield/ui";
import { useAuth } from "../context/AuthContext";
import { ApiKey, ApiKeyCreatedResponse } from "@agentshield/api-client";

export const ApiKeys: React.FC = () => {
  const { activeProject, client } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New key creation state
  const [modalOpen, setModalOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newKeyResult, setNewKeyResult] = useState<ApiKeyCreatedResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadKeys = async () => {
    if (!activeProject) return;
    setIsLoading(true);
    try {
      const list = await client.listApiKeys(activeProject.id);
      setKeys(list);
    } catch (err: any) {
      console.warn("Failed to load API keys:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, [activeProject]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !keyName.trim()) return;
    setError(null);

    try {
      const res = await client.createApiKey(activeProject.id, {
        name: keyName.trim(),
        scopes: ["ingest", "read"],
      });
      setNewKeyResult(res);
      await loadKeys();
    } catch (err: any) {
      setError(err.message || "Failed to create API key");
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!confirm("Are you sure you want to permanently revoke this API key? Any agents using it will immediately fail authentication.")) {
      return;
    }

    try {
      await client.revokeApiKey(keyId);
      await loadKeys();
    } catch (err: any) {
      alert("Failed to revoke key: " + err.message);
    }
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Key size={18} className="text-ok" />
            <h1 className="text-xl font-chakra font-bold tracking-wide uppercase text-fg">
              Scoped API Keys
            </h1>
          </div>
          <p className="text-xs text-mut mt-0.5">
            Manage ingest credentials for {activeProject?.name || "current project"}.
          </p>
        </div>

        <button
          onClick={() => {
            setKeyName("");
            setNewKeyResult(null);
            setError(null);
            setModalOpen(true);
          }}
          className="bg-ok text-black px-3.5 py-2 text-xs font-chakra font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-ok/90 transition-colors"
        >
          <Plus size={14} />
          <span>Generate New Key</span>
        </button>
      </div>

      {/* Keys List */}
      <Panel title="Active Access Keys">
        {keys.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-line text-xs text-mut space-y-2">
            <p>No active API keys found for this project.</p>
            <p>Generate a key to begin intercepting agent tool calls.</p>
          </div>
        ) : (
          <div className="divide-y divide-line font-mono text-xs">
            {keys.map((k) => (
              <div
                key={k.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-fg font-chakra text-sm">
                      {k.name}
                    </span>
                    <span className="text-[10px] bg-line/40 px-1.5 py-0.5 text-mut">
                      {k.scopes.join(", ")}
                    </span>
                  </div>
                  <div className="text-mut text-[11px] mt-1 flex items-center gap-4">
                    <span>
                      Prefix: <span className="text-ok">{k.key_prefix}••••••••</span>
                    </span>
                    <span>
                      Created: {k.created_at ? new Date(k.created_at).toLocaleDateString() : "Just now"}
                    </span>
                    {k.last_used_at && (
                      <span>
                        Last Used: {new Date(k.last_used_at).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleRevoke(k.id)}
                  className="text-bad/70 hover:text-bad flex items-center gap-1.5 text-xs font-chakra uppercase self-start sm:self-auto transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Revoke</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Key Creation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-panel border border-line p-6 max-w-md w-full shadow-hairline space-y-4">
            <h3 className="font-chakra font-bold text-sm uppercase text-fg flex items-center justify-between">
              <span>Generate Ingress API Key</span>
              <button
                onClick={() => setModalOpen(false)}
                className="text-mut hover:text-fg text-xs"
              >
                ✕
              </button>
            </h3>

            {error && (
              <div className="p-3 bg-bad/10 border border-bad/30 text-bad text-xs">
                {error}
              </div>
            )}

            {!newKeyResult ? (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-chakra uppercase tracking-wider text-mut mb-1">
                    Key Identifier / Name
                  </label>
                  <input
                    type="text"
                    required
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g., langgraph-agent-production"
                    className="w-full bg-bg border border-line px-3 py-2 text-sm text-fg focus:border-ok focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-panel border border-line text-xs text-mut font-chakra">
                  Scope: <strong className="text-fg">ingest</strong> (tool call interception) and <strong className="text-fg">read</strong> (telemetry query).
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-xs font-chakra uppercase border border-line bg-bg text-mut hover:text-fg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-chakra uppercase bg-ok text-black font-bold hover:bg-ok/90"
                  >
                    Generate Secret
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-warn/10 border border-warn/30 text-warn text-xs flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>
                    Copy this key now. It will <strong>never</strong> be shown again.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-chakra uppercase tracking-wider text-mut mb-1">
                    API Key Secret
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={newKeyResult.key || (newKeyResult as any).raw_key || ""}
                      className="flex-1 bg-bg border border-line px-3 py-2 font-mono text-xs text-ok select-all focus:outline-none"
                    />
                    <button
                      onClick={() => copySecret(newKeyResult.key || (newKeyResult as any).raw_key || "")}
                      className="bg-line hover:bg-line/80 px-3 py-2 text-xs font-chakra uppercase font-bold flex items-center gap-1 transition-colors"
                    >
                      {copied ? <Check size={14} className="text-ok" /> : <Copy size={14} />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2 text-xs font-chakra uppercase bg-ok text-black font-bold hover:bg-ok/90"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
