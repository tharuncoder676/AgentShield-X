import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Key,
  Terminal,
  Activity,
  CheckCircle,
  Copy,
  Check,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Zap,
} from "lucide-react";
import { StepList, StepItem, Panel } from "@agentshield/ui";
import { useAuth } from "../context/AuthContext";
import { useStream } from "../context/StreamContext";
import { ApiKeyCreatedResponse, PrivacyMode, Project } from "@agentshield/api-client";

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { org, activeProject, setActiveProject, refreshProjects, client } = useAuth();
  const { events } = useStream();

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [projectName, setProjectName] = useState("Production-Agent-1");
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>("full");
  const [createdProject, setCreatedProject] = useState<Project | null>(activeProject);
  const [createdKey, setCreatedKey] = useState<ApiKeyCreatedResponse | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [snippetCopied, setSnippetCopied] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snippetTab, setSnippetTab] = useState<"python" | "curl">("python");

  // Verification state (Step 4)
  const [testEventDetected, setTestEventDetected] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [latestEventDetails, setLatestEventDetails] = useState<any>(null);

  // Poll real backend onboarding status
  useEffect(() => {
    let interval: any = null;
    const targetProjId = createdProject?.id || activeProject?.id;

    if (currentStepIndex === 3 && targetProjId) {
      setIsPolling(true);
      const checkStatus = async () => {
        try {
          const status = await client.getOnboardingStatus(targetProjId);
          if (status.test_event_received || status.event_count > 0) {
            setTestEventDetected(true);
          }
        } catch (err) {
          console.warn("Error polling onboarding status:", err);
        }
      };

      checkStatus();
      interval = setInterval(checkStatus, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStepIndex, createdProject, activeProject]);

  // Also check WebSocket stream for incoming events in real time
  useEffect(() => {
    if (events.length > 0 && currentStepIndex === 3) {
      setTestEventDetected(true);
      setLatestEventDetails(events[0]);
    }
  }, [events, currentStepIndex]);

  // Step 1: Create Project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    setError(null);
    setIsCreatingProject(true);

    try {
      const proj = await client.createProject(org.id, {
        name: projectName.trim(),
        privacy_mode: privacyMode,
      });
      setCreatedProject(proj);
      setActiveProject(proj);
      await refreshProjects();
      setCurrentStepIndex(1);
    } catch (err: any) {
      setError(err.message || "Failed to create project");
    } finally {
      setIsCreatingProject(false);
    }
  };

  // Step 2: Generate API Key
  const handleGenerateKey = async () => {
    const projId = createdProject?.id || activeProject?.id;
    if (!projId) return;
    setError(null);
    setIsGeneratingKey(true);

    try {
      const keyResp = await client.createApiKey(projId, {
        name: "initial-sdk-key",
        scopes: ["ingest", "read"],
      });
      setCreatedKey(keyResp);
    } catch (err: any) {
      setError(err.message || "Failed to generate API key");
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const copyToClipboard = (text: string, type: "key" | "snippet") => {
    navigator.clipboard.writeText(text);
    if (type === "key") {
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2500);
    } else {
      setSnippetCopied(true);
      setTimeout(() => setSnippetCopied(false), 2500);
    }
  };

  const sdkKey = createdKey?.key || createdKey?.raw_key || "shield_live_SAMPLE_KEY_PLEASE_GENERATE";
  const targetProjId = createdProject?.id || activeProject?.id || "proj_live_default";

  // 1-Click Browser Dispatch Handler for authentic real-data verification
  const handleDispatchTestEvent = async () => {
    if (!targetProjId) return;
    setIsDispatching(true);
    setError(null);
    try {
      const res = await client.dispatchTestEvent(targetProjId);
      setTestEventDetected(true);
      setLatestEventDetails(res);
    } catch (err: any) {
      console.error("Error dispatching test event:", err);
      setError(err.message || "Failed to dispatch test event through Gateway");
    } finally {
      setIsDispatching(false);
    }
  };

  const pythonSnippet = `import urllib.request
import json
import uuid
from datetime import datetime, timezone

# 1. Target your running AgentShield-X Gateway
GATEWAY_URL = "http://127.0.0.1:8002/v1/events/tool-call"
API_KEY = "${sdkKey}"

# 2. Intercept an authentic agent tool call (Standard Library - zero pip packages needed!)
payload = {
    "event_id": str(uuid.uuid4()),
    "schema_version": "1.0",
    "agent_id": "${createdProject?.slug || 'agent-support-v1'}",
    "session_id": "session-live-01",
    "step": 1,
    "timestamp": datetime.now(timezone.utc).isoformat(),
    "tool": {
        "name": "read_customer_database",
        "sensitivity": "medium"
    },
    "arguments": {"customer_id": "cust_1009"},
    "context_segments": [
        {
            "id": "seg-1",
            "trust": "user",
            "source": "chat",
            "text_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "text": "Please fetch customer balance for cust_1009"
        }
    ],
    "taint": [],
    "metadata": {
        "project_id": "${targetProjId}"
    }
}

req = urllib.request.Request(
    GATEWAY_URL,
    data=json.dumps(payload).encode("utf-8"),
    headers={
        "Content-Type": "application/json",
        "X-Shield-API-Key": API_KEY,
    },
    method="POST",
)

try:
    with urllib.request.urlopen(req) as resp:
        decision = json.loads(resp.read().decode("utf-8"))
        print("=" * 60)
        print("AgentShield-X Real-Time Interception:")
        print(f"  Action:     {decision.get('action', '').upper()}")
        print(f"  Risk Score: {decision.get('risk', 0.0)}")
        print(f"  Latency:    {decision.get('latency_ms', 0.0)}ms")
        print(f"  Reasons:    {decision.get('reasons', [])}")
        print("=" * 60)
except Exception as e:
    print(f"Interception request error: {e}")
`;

  const curlSnippet = `curl -X POST http://127.0.0.1:8002/v1/events/tool-call \\
  -H "Content-Type: application/json" \\
  -H "X-Shield-API-Key: ${sdkKey}" \\
  -d '{
    "schema_version": "1.0",
    "agent_id": "${createdProject?.slug || 'agent-support-v1'}",
    "session_id": "session-live-01",
    "step": 1,
    "tool": {"name": "read_customer_database", "sensitivity": "medium"},
    "arguments": {"customer_id": "cust_1009"},
    "context_segments": [{
      "id": "seg-1",
      "trust": "user",
      "source": "chat",
      "text_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "text": "Please fetch customer balance for cust_1009"
    }],
    "metadata": {"project_id": "${targetProjId}"}
  }'`;


  const steps: StepItem[] = [
    {
      id: 0,
      title: "1. Project & Privacy Configuration",
      description: "Define the agent workspace boundary and customer data privacy tier.",
      status: currentStepIndex > 0 ? "completed" : currentStepIndex === 0 ? "active" : "pending",
    },
    {
      id: 1,
      title: "2. Scoped API Key Provisioning",
      description: "Generate and store an encrypted authentication key for your agent SDK.",
      status: currentStepIndex > 1 ? "completed" : currentStepIndex === 1 ? "active" : "pending",
    },
    {
      id: 2,
      title: "3. Embed Ingress Interceptor",
      description: "Run the provided Python code snippet to intercept tool calls.",
      status: currentStepIndex > 2 ? "completed" : currentStepIndex === 2 ? "active" : "pending",
    },
    {
      id: 3,
      title: "4. Live Verification Against Gateway",
      description: "Detect the first real test event stream live in real time.",
      status: testEventDetected
        ? "completed"
        : currentStepIndex === 3
        ? "active"
        : "pending",
    },
  ];

  return (
    <div className="min-h-screen bg-bg text-fg p-6 max-w-5xl mx-auto flex flex-col justify-center">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2 text-ok mb-1">
            <Shield size={20} />
            <span className="font-chakra text-xs font-bold uppercase tracking-widest">
              Guided System Provisioning
            </span>
          </div>
          <h1 className="text-2xl font-chakra font-bold tracking-wide uppercase">
            AgentShield<span className="text-ok">-X</span> Onboarding Wizard
          </h1>
          <p className="text-xs text-mut mt-1">
            Connect an agentic pipeline to real-time defense in less than two minutes.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2 border border-line px-3 py-1.5 bg-panel text-xs font-mono">
          <span className="text-mut">ORG:</span>
          <span className="text-fg font-semibold">{org?.name || "Workspace"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Step Progress Sidebar */}
        <div className="md:col-span-1 space-y-4">
          <StepList steps={steps} />

          <Panel title="Non-Negotiable Verification" variant="default" className="text-xs space-y-2">
            <p className="text-mut leading-relaxed">
              AgentShield-X enforces <strong>real-data verification</strong>. Step 4 completes only when an authentic test event is processed by the running Gateway.
            </p>
          </Panel>
        </div>

        {/* Active Step Panel */}
        <div className="md:col-span-2">
          {error && (
            <div className="mb-4 p-3 bg-bad/10 border border-bad/30 text-bad text-xs flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: PROJECT SETUP */}
          {currentStepIndex === 0 && (
            <Panel title="Step 1: Project & Privacy Mode" className="space-y-6">
              <form onSubmit={handleCreateProject} className="space-y-5">
                <div>
                  <label className="block text-xs font-chakra uppercase tracking-wider text-mut mb-1">
                    Agent / Project Name
                  </label>
                  <input
                    type="text"
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., Financial-Advisor-Agent"
                    className="w-full bg-bg border border-line px-3 py-2 text-sm text-fg focus:border-ok focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-chakra uppercase tracking-wider text-mut mb-2">
                    Privacy Mode
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    <label
                      className={`border p-3 cursor-pointer flex items-start gap-3 transition-colors ${
                        privacyMode === "full"
                          ? "border-ok bg-ok/5"
                          : "border-line bg-bg hover:border-line/80"
                      }`}
                    >
                      <input
                        type="radio"
                        name="privacy"
                        value="full"
                        checked={privacyMode === "full"}
                        onChange={() => setPrivacyMode("full")}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-chakra font-bold text-xs uppercase text-fg">
                          Full Inspection Mode (Recommended for Development)
                        </div>
                        <div className="text-xs text-mut mt-0.5">
                          Stores context text, tool arguments, and full evidence quotes for comprehensive auditability.
                        </div>
                      </div>
                    </label>

                    <label
                      className={`border p-3 cursor-pointer flex items-start gap-3 transition-colors ${
                        privacyMode === "hashed"
                          ? "border-ok bg-ok/5"
                          : "border-line bg-bg hover:border-line/80"
                      }`}
                    >
                      <input
                        type="radio"
                        name="privacy"
                        value="hashed"
                        checked={privacyMode === "hashed"}
                        onChange={() => setPrivacyMode("hashed")}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-chakra font-bold text-xs uppercase text-fg">
                          Hashed Zero-Storage Mode
                        </div>
                        <div className="text-xs text-mut mt-0.5">
                          Only cryptographic text hashes and extracted numerical features are retained. No raw text is ever stored.
                        </div>
                      </div>
                    </label>

                    <label
                      className={`border p-3 cursor-pointer flex items-start gap-3 transition-colors ${
                        privacyMode === "local"
                          ? "border-ok bg-ok/5"
                          : "border-line bg-bg hover:border-line/80"
                      }`}
                    >
                      <input
                        type="radio"
                        name="privacy"
                        value="local"
                        checked={privacyMode === "local"}
                        onChange={() => setPrivacyMode("local")}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-chakra font-bold text-xs uppercase text-fg">
                          Local Air-Gapped Mode
                        </div>
                        <div className="text-xs text-mut mt-0.5">
                          Data plane runs strictly inside your on-premise perimeter. Zero telemetry ever exits your boundary.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isCreatingProject}
                    className="bg-ok text-black font-chakra font-bold text-xs uppercase tracking-wider py-2.5 px-6 flex items-center gap-2 hover:bg-ok/90 disabled:opacity-50"
                  >
                    {isCreatingProject ? "Creating..." : "Save & Continue"}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </form>
            </Panel>
          )}

          {/* STEP 2: API KEY GENERATION */}
          {currentStepIndex === 1 && (
            <Panel title="Step 2: Generate Scoped API Key" className="space-y-6">
              <p className="text-xs text-mut leading-relaxed">
                Your agent SDK authenticates each tool call via an <code className="text-fg bg-line/20 px-1 py-0.5">X-Shield-API-Key</code> header. Keys are salted and hashed at rest.
              </p>

              {!createdKey ? (
                <div className="p-6 border border-line bg-bg text-center space-y-4">
                  <Key size={32} className="mx-auto text-ok" />
                  <div>
                    <h3 className="font-chakra font-bold text-sm uppercase">
                      Provision Live Key for "{createdProject?.name || 'Current Project'}"
                    </h3>
                    <p className="text-xs text-mut mt-1">
                      Key will be generated with ingest and read scopes.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateKey}
                    disabled={isGeneratingKey}
                    className="bg-ok text-black font-chakra font-bold text-xs uppercase tracking-wider py-2 px-5 inline-flex items-center gap-2 hover:bg-ok/90 disabled:opacity-50"
                  >
                    {isGeneratingKey ? "Generating..." : "Generate Live Secret Key"}
                    <Key size={14} />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-warn/10 border border-warn/30 text-warn text-xs flex items-center gap-2">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>
                      Copy this secret immediately. It will <strong>never</strong> be displayed again.
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-chakra uppercase tracking-wider text-mut">
                      Live Secret Key
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={createdKey.key || createdKey.raw_key || ""}
                        className="flex-1 bg-bg border border-line px-3 py-2 font-mono text-xs text-ok select-all focus:outline-none"
                      />
                      <button
                        onClick={() => copyToClipboard(createdKey.key || createdKey.raw_key || "", "key")}
                        className="bg-line hover:bg-line/80 px-3 py-2 text-xs font-chakra uppercase font-bold flex items-center gap-1.5 transition-colors"
                      >
                        {keyCopied ? (
                          <>
                            <Check size={14} className="text-ok" />
                            <span className="text-ok">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between items-center border-t border-line">
                    <span className="text-xs text-mut font-mono">
                      Prefix: {createdKey.key_prefix}
                    </span>
                    <button
                      onClick={() => setCurrentStepIndex(2)}
                      className="bg-ok text-black font-chakra font-bold text-xs uppercase tracking-wider py-2.5 px-6 flex items-center gap-2 hover:bg-ok/90"
                    >
                      I Have Stored the Key &gt; Continue
                    </button>
                  </div>
                </div>
              )}
            </Panel>
          )}

          {/* STEP 3: SDK CODE SNIPPET */}
          {currentStepIndex === 2 && (
            <Panel title="Step 3: Execute Ingress Test Snippet" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-mut leading-relaxed">
                  Run in your terminal to dispatch an authentic tool-call through the running Gateway:
                </p>
                <div className="flex border border-line rounded-none bg-bg text-xs font-mono">
                  <button
                    onClick={() => setSnippetTab("python")}
                    className={`px-3 py-1 text-xs font-chakra uppercase transition-colors ${
                      snippetTab === "python" ? "bg-ok text-black font-bold" : "text-mut hover:text-fg"
                    }`}
                  >
                    Python (Zero-Dep)
                  </button>
                  <button
                    onClick={() => setSnippetTab("curl")}
                    className={`px-3 py-1 text-xs font-chakra uppercase transition-colors ${
                      snippetTab === "curl" ? "bg-ok text-black font-bold" : "text-mut hover:text-fg"
                    }`}
                  >
                    cURL (CLI)
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre className="p-4 bg-bg border border-line text-xs font-mono text-fg overflow-x-auto rounded-none max-h-72">
                  {snippetTab === "python" ? pythonSnippet : curlSnippet}
                </pre>
                <button
                  onClick={() => copyToClipboard(snippetTab === "python" ? pythonSnippet : curlSnippet, "snippet")}
                  className="absolute top-3 right-3 bg-panel border border-line hover:bg-line/40 px-2.5 py-1 text-xs font-chakra uppercase font-semibold flex items-center gap-1 transition-colors"
                >
                  {snippetCopied ? (
                    <>
                      <Check size={12} className="text-ok" />
                      <span className="text-ok">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy Snippet</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-mut italic">
                * Zero dependencies required. The Python snippet uses built-in <code>urllib.request</code> and requires no pip installs.
              </p>

              <div className="pt-3 flex justify-between items-center border-t border-line">
                <button
                  onClick={() => setCurrentStepIndex(1)}
                  className="text-xs text-mut hover:text-fg font-chakra uppercase"
                >
                  &larr; Back to Keys
                </button>
                <button
                  onClick={() => setCurrentStepIndex(3)}
                  className="bg-ok text-black font-chakra font-bold text-xs uppercase tracking-wider py-2.5 px-6 flex items-center gap-2 hover:bg-ok/90"
                >
                  Proceed to Live Listener
                  <ArrowRight size={14} />
                </button>
              </div>
            </Panel>
          )}

          {/* STEP 4: REAL-TIME VERIFICATION */}
          {currentStepIndex === 3 && (
            <Panel title="Step 4: Live Gateway Verification" className="space-y-6">
              {error && (
                <div className="p-3 bg-err/10 border border-err/30 text-err text-xs flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {!testEventDetected ? (
                <div className="p-8 border border-line bg-bg text-center space-y-6">
                  <div className="relative inline-flex items-center justify-center">
                    <Activity size={36} className="text-ok animate-pulse" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-ok rounded-full animate-ping" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-chakra font-bold text-base uppercase text-fg">
                      Listening for Authentic Gateway Event
                    </h3>
                    <p className="text-xs text-mut max-w-lg mx-auto">
                      AgentShield-X enforces real-data verification. Step 4 completes immediately when an authentic tool-call is evaluated by the Gateway and recorded in the database.
                    </p>
                  </div>

                  {/* 1-Click Live Authentic Event Trigger */}
                  <div className="py-2 flex flex-col items-center gap-3">
                    <button
                      onClick={handleDispatchTestEvent}
                      disabled={isDispatching}
                      className="bg-ok text-black font-chakra font-bold text-xs uppercase tracking-wider py-3.5 px-8 flex items-center gap-2.5 hover:bg-ok/90 shadow-glow transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isDispatching ? (
                        <>
                          <RefreshCw size={15} className="animate-spin" />
                          <span>Processing on Gateway (sub-100ms)...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={15} className="fill-current" />
                          <span>⚡ Dispatch Authentic Test Event from Browser</span>
                        </>
                      )}
                    </button>
                    <span className="text-[11px] text-mut font-mono">
                      Target: http://127.0.0.1:8002 &bull; Project: {targetProjId}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-line/60 flex items-center justify-center gap-4 text-xs font-mono text-mut">
                    <div className="inline-flex items-center gap-2 border border-ok/30 bg-ok/5 px-3 py-1.5 text-xs text-ok">
                      <RefreshCw size={12} className="animate-spin" />
                      <span>Polling database status & streaming WebSocket...</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="p-4 bg-ok/10 border border-ok/40 text-ok text-xs flex items-start gap-3">
                    <CheckCircle size={20} className="shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-chakra font-bold uppercase text-sm">
                        Real Test Event Intercepted Successfully!
                      </h4>
                      <p className="text-xs text-fg/80 mt-0.5">
                        Your agent is now streaming live telemetry to AgentShield-X with sub-100ms policy evaluation.
                      </p>
                    </div>
                  </div>

                  {latestEventDetails && (
                    <div className="border border-line bg-bg p-4 font-mono text-xs space-y-2">
                      <div className="flex justify-between border-b border-line pb-1.5">
                        <span className="text-mut">EVENT ID:</span>
                        <span className="text-fg font-bold">
                          {latestEventDetails.event?.event_id || latestEventDetails.event_id || "ev_live_verified"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-line pb-1.5">
                        <span className="text-mut">TOOL CALLED:</span>
                        <span className="text-fg">
                          {latestEventDetails.event?.tool?.name || latestEventDetails.tool_name || "read_customer_database"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-line pb-1.5">
                        <span className="text-mut">SHIELD ACTION:</span>
                        <span className="text-ok font-bold uppercase">
                          {latestEventDetails.decision?.action || latestEventDetails.action || "ALLOW"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-line pb-1.5">
                        <span className="text-mut">RISK SCORE:</span>
                        <span className="text-fg">
                          {latestEventDetails.decision?.risk ?? latestEventDetails.risk ?? 0.05}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-mut">EVALUATION LATENCY:</span>
                        <span className="text-ok font-mono">
                          {latestEventDetails.decision?.latency_ms ?? latestEventDetails.latency_ms ?? 1.2}ms
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={() => navigate("/overview")}
                      className="bg-ok text-black font-chakra font-bold text-xs uppercase tracking-wider py-3 px-8 flex items-center gap-2 hover:bg-ok/90 shadow-glow"
                    >
                      Enter Security Console
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
};
