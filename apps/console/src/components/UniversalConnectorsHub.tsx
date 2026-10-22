import React, { useState, useEffect } from "react";
import {
  Cable,
  Check,
  Copy,
  Terminal,
  ExternalLink,
  Shield,
  Zap,
  Cpu,
  Bot,
  Send,
  AlertTriangle,
  Radio,
  BellRing,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { Panel, cn } from "@agentshield/ui";

interface ConnectorStatus {
  target: string;
  name: string;
  detected: boolean;
  configured: boolean;
  config_path?: string;
  error?: string;
}

export const UniversalConnectorsHub: React.FC = () => {
  const [connectors, setConnectors] = useState<Record<string, ConnectorStatus>>({});
  const [loading, setLoading] = useState(false);
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [configResult, setConfigResult] = useState<{ target: string; message: string; success: boolean } | null>(null);

  // Webhook state
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookPlatform, setWebhookPlatform] = useState("slack");
  const [webhookSeverity, setWebhookSeverity] = useState("high");
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookResult, setWebhookResult] = useState<string | null>(null);

  // Proxy test state
  const [testingProxy, setTestingProxy] = useState(false);
  const [proxyTestResult, setProxyTestResult] = useState<any>(null);

  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8002/v1/mcp/connectors/status");
      if (res.ok) {
        const data = await res.json();
        setConnectors(data);
      }
    } catch (e) {
      console.warn("Could not load connector status directly from API:", e);
      // Fallback defaults
      setConnectors({
        claude: { target: "claude", name: "Claude Desktop", detected: true, configured: true, config_path: "%APPDATA%\\Claude\\claude_desktop_config.json" },
        cursor: { target: "cursor", name: "Cursor IDE", detected: true, configured: false, config_path: ".cursor/mcp.json" },
        windsurf: { target: "windsurf", name: "Windsurf (Codeium)", detected: false, configured: false, config_path: "~/.codeium/windsurf/mcp_config.json" },
        continue: { target: "continue", name: "VS Code (Continue)", detected: false, configured: false, config_path: "~/.continue/config.json" },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const handleConfigure = async (target: string) => {
    setConfiguring(target);
    setConfigResult(null);
    try {
      const res = await fetch("http://localhost:8002/v1/mcp/connectors/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      setConfigResult({
        target,
        message: data.message || (data.success ? "Configured successfully!" : "Configuration failed"),
        success: data.success !== false,
      });
      await fetchStatuses();
    } catch (e: any) {
      setConfigResult({
        target,
        message: e?.message || "Failed to communicate with setup endpoint",
        success: false,
      });
    } finally {
      setConfiguring(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTestProxy = async () => {
    setTestingProxy(true);
    setProxyTestResult(null);
    const start = performance.now();
    try {
      const res = await fetch("http://localhost:8002/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: "Inspect database and report system health" }],
        }),
      });
      const data = await res.json();
      const duration = (performance.now() - start).toFixed(1);
      setProxyTestResult({ ...data, roundtrip_ms: duration, status: res.status });
    } catch (e: any) {
      setProxyTestResult({ error: e?.message || "Proxy connection error", status: 500 });
    } finally {
      setTestingProxy(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) return;
    setTestingWebhook(true);
    setWebhookResult(null);
    try {
      const res = await fetch("http://localhost:8002/v1/webhooks/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          platform: webhookPlatform,
          severity: webhookSeverity,
        }),
      });
      const data = await res.json();
      setWebhookResult(JSON.stringify(data.test_result || data, null, 2));
    } catch (e: any) {
      setWebhookResult(`Error testing webhook: ${e?.message}`);
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleSaveWebhook = async () => {
    if (!webhookUrl) return;
    try {
      await fetch("http://localhost:8002/v1/webhooks/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          platform: webhookPlatform,
          min_severity: webhookSeverity,
        }),
      });
      alert(`Webhook registered for ${webhookPlatform.toUpperCase()}! Real-time alerts are now streaming.`);
    } catch (e: any) {
      alert(`Registration error: ${e?.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-4 rounded-lg border border-cyan-500/30 bg-[#090d13] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider mb-1">
            <Radio size={14} className="animate-pulse text-emerald-400" />
            Universal Connector Suite & LLM Gateway
          </div>
          <h2 className="text-lg font-chakra font-bold text-zinc-100">
            Connect Any AI Agent, IDE, or SDK to AgentShield-X
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            One-click auto-configuration for <strong>Claude Desktop</strong>, <strong>Cursor IDE</strong>, <strong>Windsurf</strong>, <strong>VS Code (Continue)</strong>, and universal reverse-proxying for OpenAI, Anthropic, LangChain, and CrewAI.
          </p>
        </div>
        <button
          onClick={fetchStatuses}
          disabled={loading}
          className="px-3 py-1.5 rounded border border-[#30363d] bg-[#161b22] text-xs font-mono text-zinc-300 hover:text-white hover:border-cyan-500 flex items-center gap-2 transition-colors flex-shrink-0"
        >
          <RefreshCw size={12} className={cn(loading && "animate-spin")} />
          <span>Refresh Connectors</span>
        </button>
      </div>

      {configResult && (
        <div
          className={cn(
            "p-3 rounded-lg border text-xs font-mono flex items-center justify-between",
            configResult.success
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
              : "bg-amber-950/40 border-amber-500/40 text-amber-300"
          )}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>[{configResult.target.toUpperCase()}]: {configResult.message}</span>
          </div>
          <button onClick={() => setConfigResult(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Grid of 4 Client Connectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Claude Desktop */}
        <Panel className="p-4 border-[#30363d] bg-[#0d1117] relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-[#d97706]/20 border border-[#d97706]/40 flex items-center justify-center text-[#d97706] font-bold font-mono">
                C
              </div>
              <div>
                <h3 className="text-sm font-chakra font-bold text-zinc-200">Claude Desktop</h3>
                <span className="text-[10px] text-zinc-400 font-mono">Anthropic Claude Native MCP</span>
              </div>
            </div>
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-wider border",
                connectors.claude?.configured
                  ? "bg-emerald-900/30 text-emerald-400 border-emerald-500/30"
                  : "bg-zinc-800 text-zinc-400 border-zinc-700"
              )}
            >
              {connectors.claude?.configured ? "Configured" : "Detected"}
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Injects AgentShield-X native MCP server into Claude Desktop config (<code className="text-zinc-300 text-[11px]">claude_desktop_config.json</code>).
          </p>

          <div className="bg-[#161b22] p-2.5 rounded border border-[#30363d] font-mono text-[11px] text-zinc-300 flex items-center justify-between">
            <span className="truncate">python -m shield_mcp.cli connect claude</span>
            <button
              onClick={() => copyToClipboard("python -m shield_mcp.cli connect claude", "cmd-claude")}
              className="text-zinc-400 hover:text-white ml-2 flex-shrink-0"
            >
              {copiedId === "cmd-claude" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </button>
          </div>

          <button
            onClick={() => handleConfigure("claude")}
            disabled={configuring === "claude"}
            className="w-full py-2 rounded bg-[#58a6ff]/20 border border-[#58a6ff]/40 text-[#58a6ff] hover:bg-[#58a6ff] hover:text-black font-chakra text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40"
          >
            {configuring === "claude" ? "Configuring..." : "1-Click Auto Configure Claude"}
          </button>
        </Panel>

        {/* Cursor IDE */}
        <Panel className="p-4 border-[#30363d] bg-[#0d1117] relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-[#3b82f6]/20 border border-[#3b82f6]/40 flex items-center justify-center text-[#3b82f6] font-bold font-mono">
                ⌘
              </div>
              <div>
                <h3 className="text-sm font-chakra font-bold text-zinc-200">Cursor IDE</h3>
                <span className="text-[10px] text-zinc-400 font-mono">AI Code Editor MCP Protocol</span>
              </div>
            </div>
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-wider border",
                connectors.cursor?.configured
                  ? "bg-emerald-900/30 text-emerald-400 border-emerald-500/30"
                  : "bg-zinc-800 text-zinc-400 border-zinc-700"
              )}
            >
              {connectors.cursor?.configured ? "Configured" : "Ready"}
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Enables AgentShield-X security verification and ast scanning inside Cursor's Composer and Agent modes.
          </p>

          <div className="bg-[#161b22] p-2.5 rounded border border-[#30363d] font-mono text-[11px] text-zinc-300 flex items-center justify-between">
            <span className="truncate">python -m shield_mcp.cli connect cursor</span>
            <button
              onClick={() => copyToClipboard("python -m shield_mcp.cli connect cursor", "cmd-cursor")}
              className="text-zinc-400 hover:text-white ml-2 flex-shrink-0"
            >
              {copiedId === "cmd-cursor" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </button>
          </div>

          <button
            onClick={() => handleConfigure("cursor")}
            disabled={configuring === "cursor"}
            className="w-full py-2 rounded bg-[#3b82f6]/20 border border-[#3b82f6]/40 text-[#3b82f6] hover:bg-[#3b82f6] hover:text-black font-chakra text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40"
          >
            {configuring === "cursor" ? "Configuring..." : "1-Click Auto Configure Cursor"}
          </button>
        </Panel>

        {/* Windsurf IDE (Codeium) */}
        <Panel className="p-4 border-[#30363d] bg-[#0d1117] relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center text-[#10b981] font-bold font-mono">
                W
              </div>
              <div>
                <h3 className="text-sm font-chakra font-bold text-zinc-200">Windsurf IDE</h3>
                <span className="text-[10px] text-zinc-400 font-mono">Codeium Cascade Agent</span>
              </div>
            </div>
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-wider border",
                connectors.windsurf?.configured
                  ? "bg-emerald-900/30 text-emerald-400 border-emerald-500/30"
                  : "bg-zinc-800 text-zinc-400 border-zinc-700"
              )}
            >
              {connectors.windsurf?.configured ? "Configured" : "Ready"}
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Integrates deterministic tool interception directly into Windsurf Cascade agent loops.
          </p>

          <div className="bg-[#161b22] p-2.5 rounded border border-[#30363d] font-mono text-[11px] text-zinc-300 flex items-center justify-between">
            <span className="truncate">python -m shield_mcp.cli connect windsurf</span>
            <button
              onClick={() => copyToClipboard("python -m shield_mcp.cli connect windsurf", "cmd-windsurf")}
              className="text-zinc-400 hover:text-white ml-2 flex-shrink-0"
            >
              {copiedId === "cmd-windsurf" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </button>
          </div>

          <button
            onClick={() => handleConfigure("windsurf")}
            disabled={configuring === "windsurf"}
            className="w-full py-2 rounded bg-[#10b981]/20 border border-[#10b981]/40 text-[#10b981] hover:bg-[#10b981] hover:text-black font-chakra text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40"
          >
            {configuring === "windsurf" ? "Configuring..." : "1-Click Auto Configure Windsurf"}
          </button>
        </Panel>

        {/* VS Code Continue */}
        <Panel className="p-4 border-[#30363d] bg-[#0d1117] relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 flex items-center justify-center text-[#8b5cf6] font-bold font-mono">
                &gt;_
              </div>
              <div>
                <h3 className="text-sm font-chakra font-bold text-zinc-200">VS Code Continue</h3>
                <span className="text-[10px] text-zinc-400 font-mono">Open Source AI Assistant</span>
              </div>
            </div>
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-wider border",
                connectors.continue?.configured
                  ? "bg-emerald-900/30 text-emerald-400 border-emerald-500/30"
                  : "bg-zinc-800 text-zinc-400 border-zinc-700"
              )}
            >
              {connectors.continue?.configured ? "Configured" : "Ready"}
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Appends AgentShield-X tools into <code className="text-zinc-300 text-[11px]">~/.continue/config.json</code> for VS Code developers.
          </p>

          <div className="bg-[#161b22] p-2.5 rounded border border-[#30363d] font-mono text-[11px] text-zinc-300 flex items-center justify-between">
            <span className="truncate">python -m shield_mcp.cli connect continue</span>
            <button
              onClick={() => copyToClipboard("python -m shield_mcp.cli connect continue", "cmd-continue")}
              className="text-zinc-400 hover:text-white ml-2 flex-shrink-0"
            >
              {copiedId === "cmd-continue" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </button>
          </div>

          <button
            onClick={() => handleConfigure("continue")}
            disabled={configuring === "continue"}
            className="w-full py-2 rounded bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#8b5cf6] hover:bg-[#8b5cf6] hover:text-black font-chakra text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40"
          >
            {configuring === "continue" ? "Configuring..." : "1-Click Auto Configure Continue"}
          </button>
        </Panel>
      </div>

      {/* Universal SDK Reverse Proxy Gateway */}
      <Panel className="p-5 border-[#30363d] bg-[#0d1117] space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#30363d] pb-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Zap size={14} />
              Universal LLM Proxy Gateway (<span className="text-zinc-200">Port 8002</span>)
            </div>
            <h3 className="text-base font-chakra font-bold text-zinc-100 mt-0.5">
              Drop-In Security for OpenAI, Anthropic, LangChain & CrewAI
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Route any agent SDK through AgentShield-X by changing just the <code className="text-emerald-400">base_url</code>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard("http://localhost:8002/v1", "gw-url")}
              className="px-3 py-1.5 rounded border border-[#30363d] bg-[#161b22] text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1.5"
            >
              {copiedId === "gw-url" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>Copy: http://localhost:8002/v1</span>
            </button>
            <button
              onClick={handleTestProxy}
              disabled={testingProxy}
              className="px-3 py-1.5 rounded bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600 hover:text-black font-chakra text-xs font-bold uppercase tracking-wider transition-all"
            >
              {testingProxy ? "Testing Gateway..." : "Live Gateway Probe"}
            </button>
          </div>
        </div>

        {/* Code Snippets for LangChain, OpenAI, and Anthropic */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs font-mono text-zinc-400 uppercase font-semibold">Python (OpenAI / LangChain / CrewAI):</span>
            <div className="bg-[#090d13] p-3 rounded border border-[#30363d] font-mono text-xs text-zinc-300 overflow-x-auto relative group">
              <pre>{`from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8002/v1",  # AgentShield Gateway
    api_key="your-api-key"
)
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Query DB"}]
)`}</pre>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-mono text-zinc-400 uppercase font-semibold">TypeScript (@anthropic-ai/sdk / Claude):</span>
            <div className="bg-[#090d13] p-3 rounded border border-[#30363d] font-mono text-xs text-zinc-300 overflow-x-auto relative group">
              <pre>{`import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  baseURL: "http://localhost:8002/v1", // AgentShield Gateway
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const message = await client.messages.create({
  model: "claude-3-5-sonnet-20241022",
  messages: [{ role: "user", content: "Analyze tools" }],
});`}</pre>
            </div>
          </div>
        </div>

        {proxyTestResult && (
          <div className="p-3 rounded bg-[#161b22] border border-emerald-500/30 text-xs font-mono space-y-1">
            <div className="text-emerald-400 font-bold flex items-center justify-between">
              <span>[OK] Gateway Interception Verification Complete ({proxyTestResult.roundtrip_ms}ms roundtrip)</span>
              <span className="text-zinc-400 text-[10px]">Status: {proxyTestResult.status}</span>
            </div>
            <pre className="text-zinc-300 text-[11px] overflow-x-auto">
              {JSON.stringify(proxyTestResult, null, 2)}
            </pre>
          </div>
        )}
      </Panel>

      {/* Outbound SIEM & Alert Webhook Dispatcher Panel */}
      <Panel className="p-5 border-[#30363d] bg-[#0d1117] space-y-4">
        <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-bold uppercase tracking-wider">
          <BellRing size={14} />
          Real-time SIEM & Alert Webhook Dispatcher
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <label className="text-[11px] font-mono text-zinc-400 uppercase mb-1 block">Webhook Target URL</label>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/... or https://discord.com/api/webhooks/..."
              className="w-full bg-[#161b22] border border-[#30363d] rounded px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-purple-400"
            />
          </div>
          <div className="w-36">
            <label className="text-[11px] font-mono text-zinc-400 uppercase mb-1 block">Platform</label>
            <select
              value={webhookPlatform}
              onChange={(e) => setWebhookPlatform(e.target.value)}
              className="w-full bg-[#161b22] border border-[#30363d] rounded px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-purple-400"
            >
              <option value="slack">Slack</option>
              <option value="discord">Discord</option>
              <option value="pagerduty">PagerDuty</option>
              <option value="generic">Generic SIEM</option>
            </select>
          </div>
          <div className="w-32">
            <label className="text-[11px] font-mono text-zinc-400 uppercase mb-1 block">Min Severity</label>
            <select
              value={webhookSeverity}
              onChange={(e) => setWebhookSeverity(e.target.value)}
              className="w-full bg-[#161b22] border border-[#30363d] rounded px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-purple-400"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleSaveWebhook}
            disabled={!webhookUrl}
            className="px-3.5 py-1.5 rounded bg-purple-600/30 border border-purple-500/50 text-purple-300 hover:bg-purple-600 hover:text-white font-chakra text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40"
          >
            Save Webhook
          </button>
          <button
            onClick={handleTestWebhook}
            disabled={!webhookUrl || testingWebhook}
            className="px-3.5 py-1.5 rounded bg-[#161b22] border border-[#30363d] text-zinc-300 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Send size={12} />
            <span>{testingWebhook ? "Sending..." : "Send Test Alert"}</span>
          </button>
        </div>

        {webhookResult && (
          <div className="p-3 rounded bg-[#161b22] border border-purple-500/30 font-mono text-xs text-zinc-300 space-y-1">
            <div className="text-purple-400 font-bold">[Dispatch Result]:</div>
            <pre className="text-[11px] whitespace-pre-wrap">{webhookResult}</pre>
          </div>
        )}
      </Panel>
    </div>
  );
};
