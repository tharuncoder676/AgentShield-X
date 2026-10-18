import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  Cpu,
  Shield,
  Zap,
  ArrowRight,
  Database,
  Radio,
  FileCode,
  Flame,
  Binary,
  GitBranch,
  Key,
  Lock,
  UserCheck,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Info,
  Maximize2,
  Sliders,
  Play,
  RotateCcw,
} from "lucide-react";
import {
  Panel,
  VerdictBadge,
  Drawer,
  cn,
} from "@agentshield/ui";

interface ArchNode {
  id: string;
  stage: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  latency: string;
  status: "active" | "online" | "deterministic";
  description: string;
  spec: {
    algorithm: string;
    formula?: string;
    inputs: string[];
    outputs: string[];
    latencyP95: string;
    failMode: string;
  };
}

const ARCH_NODES: Record<string, ArchNode> = {
  // Stage 1
  sdk_ingress: {
    id: "sdk_ingress",
    stage: "1. Client & Agent Layer",
    title: "AgentShield SDK",
    subtitle: "Python / TypeScript Ingress",
    icon: <Cpu size={18} className="text-ok" />,
    latency: "< 0.5 ms",
    status: "active",
    description: "Lightweight client library wrapping LLM tool calls. Serializes input context, hash-chains segments, and communicates over HTTP/WebSocket.",
    spec: {
      algorithm: "Asynchronous Zero-Copy Interceptor",
      inputs: ["Tool name", "Arguments JSON", "Context segments", "Active session ID"],
      outputs: ["Serialized ToolCallEvent (Schema v1.0)"],
      latencyP95: "0.4 ms",
      failMode: "Configurable: Fail-Closed on high-sensitivity, Fail-Open on low-sensitivity",
    },
  },

  // Stage 2
  gateway_edge: {
    id: "gateway_edge",
    stage: "2. Edge Protection & Ingress",
    title: "Ingress Gateway",
    subtitle: "FastAPI / Uvicorn Async Core",
    icon: <Shield size={18} className="text-ok" />,
    latency: "1.2 ms",
    status: "online",
    description: "High-throughput edge reverse proxy. Enforces constant-time API key verification, tenant isolation, and token-bucket rate limiting.",
    spec: {
      algorithm: "Token-Bucket Rate Limiting (capacity=1000, refill=500/s)",
      formula: "tokens = min(capacity, prev_tokens + elapsed * refill_rate)",
      inputs: ["HTTP POST /v1/events/tool-call", "X-Shield-API-Key header"],
      outputs: ["Authenticated ToolCallEvent", "HTTP 429 on exhaustion", "HTTP 401 on invalid key"],
      latencyP95: "1.8 ms",
      failMode: "Fail-Closed: Drops unauthenticated or rate-exceeded requests",
    },
  },
  kill_switch: {
    id: "kill_switch",
    stage: "2. Edge Protection & Ingress",
    title: "Agent Kill-Switch",
    subtitle: "Zero-Latency Circuit Breaker",
    icon: <Zap size={18} className="text-bad" />,
    latency: "0.1 ms",
    status: "deterministic",
    description: "Instant in-memory lookup. If an agent has been suspended by an operator or severe anomaly, tool call is blocked with zero model overhead.",
    spec: {
      algorithm: "O(1) In-Memory Bitset / Atomic Flag",
      inputs: ["agent_id"],
      outputs: ["Immediate Block verdict if suspended, else pass-through"],
      latencyP95: "0.1 ms",
      failMode: "Fail-Closed: Suspended agents never reach ML pipeline",
    },
  },

  // Stage 3
  event_bus: {
    id: "event_bus",
    stage: "3. Telemetry & Event Stream",
    title: "Event Bus & WebSocket",
    subtitle: "Real-time Telemetry Dispatcher",
    icon: <Radio size={18} className="text-purple" />,
    latency: "0.8 ms",
    status: "online",
    description: "Dispatches intercepted tool calls and decisions to live browser consoles via WebSockets (/v1/ws/decisions) and persistent DB storage.",
    spec: {
      algorithm: "Pub/Sub Memory Bus / Redis Stream",
      inputs: ["ToolCallEvent", "Decision"],
      outputs: ["Live broadcast to connected console clients", "Async DB telemetry write"],
      latencyP95: "1.2 ms",
      failMode: "Non-blocking: Telemetry lag never delays decision response",
    },
  },

  // Stage 4A: Deterministic
  rego_engine: {
    id: "rego_engine",
    stage: "4A. Deterministic Rules",
    title: "OPA / Rego Engine",
    subtitle: "Declarative Guardrails",
    icon: <FileCode size={18} className="text-ok" />,
    latency: "1.1 ms",
    status: "deterministic",
    description: "Evaluates declarative OPA / Rego security rules against tool names, argument boundaries, and role permissions.",
    spec: {
      algorithm: "Open Policy Agent AST Evaluation",
      inputs: ["ToolCallEvent (tool, arguments, session, context)"],
      outputs: ["allow / block / sanitize verdict", "Rule violation code"],
      latencyP95: "1.9 ms",
      failMode: "Fail-Closed on critical tools",
    },
  },
  pii_scanner: {
    id: "pii_scanner",
    stage: "4A. Deterministic Rules",
    title: "PII & Shannon Entropy",
    subtitle: "Secret & Credential Scanner",
    icon: <Lock size={18} className="text-warn" />,
    latency: "0.8 ms",
    status: "deterministic",
    description: "Scans arguments using Shannon entropy thresholds (H > 4.5) and regex patterns to catch AWS keys, JWTs, OpenAI keys, and credit cards.",
    spec: {
      algorithm: "Shannon Entropy Calculation & Regex Vectorization",
      formula: "H(X) = - \\sum_{i=1}^{n} P(x_i) \\log_2 P(x_i)",
      inputs: ["Tool argument string values"],
      outputs: ["PII flags", "Redacted sanitized payload", "Entropy score"],
      latencyP95: "1.2 ms",
      failMode: "Sanitizes secret before tool execution",
    },
  },
  honeytools_trap: {
    id: "honeytools_trap",
    stage: "4A. Deterministic Rules",
    title: "Honeytools & Canary Traps",
    subtitle: "Active Deception Decoys",
    icon: <Flame size={18} className="text-bad" />,
    latency: "0.1 ms",
    status: "deterministic",
    description: "Exposes tempting fake tools (e.g. export_all_customers) and canary tokens. Any invocation triggers an instant kill_session verdict.",
    spec: {
      algorithm: "O(1) Decoy Set Intersection & Canary Token Matching",
      inputs: ["tool_name", "arguments"],
      outputs: ["HONEY_TOOL_INVOKED trigger", "Risk = 1.0", "Action = kill_session"],
      latencyP95: "0.2 ms",
      failMode: "Immediate session termination",
    },
  },
  taint_tracker: {
    id: "taint_tracker",
    stage: "4A. Deterministic Rules",
    title: "Taint Propagation Graph",
    subtitle: "Information Flow Tracker",
    icon: <GitBranch size={18} className="text-warn" />,
    latency: "0.5 ms",
    status: "active",
    description: "Maintains a per-session Directed Acyclic Graph (DAG) tracking untrusted data from user/web sources into sensitive downstream tool sinks.",
    spec: {
      algorithm: "DAG Forward Reachability Taint Analysis",
      formula: "Taint(sink) = \\bigcup_{source \\in Path(sink)} Trust(source)",
      inputs: ["Context segments", "Tool sensitivity", "Session step history"],
      outputs: ["Taint vector", "Unsafe sink violation reason"],
      latencyP95: "0.9 ms",
      failMode: "Escalates or blocks tainted tool execution",
    },
  },

  // Stage 4B: 5 ML Models
  model_1: {
    id: "model_1",
    stage: "4B. Calibrated ML Pipeline",
    title: "Model 1: DeBERTa Classifier",
    subtitle: "Deep Learning Injection Detection",
    icon: <Binary size={18} className="text-bad" />,
    latency: "18.5 ms",
    status: "active",
    description: "Supervised transformer trained on adversarial prompt injections, DAN jailbreaks, base64 obfuscations, and markdown exfiltrations. ONNX runtime.",
    spec: {
      algorithm: "DeBERTa-v3 Token Classification with Attention Head Pooling",
      formula: "P(\\text{injection}) = \\sigma(W \\cdot \\text{DeBERTa}(x) + b)",
      inputs: ["Concatenated context segments and tool arguments"],
      outputs: ["Injection probability [0.0, 1.0]"],
      latencyP95: "24.0 ms",
      failMode: "Falls back to rules heuristics if inference times out",
    },
  },
  model_2: {
    id: "model_2",
    stage: "4B. Calibrated ML Pipeline",
    title: "Model 2: MiniLM Similarity",
    subtitle: "Known-Attack Vector Index",
    icon: <Database size={18} className="text-info" />,
    latency: "3.2 ms",
    status: "active",
    description: "Embeds tool arguments with all-MiniLM-L6-v2 and computes k-NN cosine distance against a curated Qdrant index of 10,000+ confirmed exploits.",
    spec: {
      algorithm: "Dense Embeddings + HNSW Cosine Similarity Search",
      formula: "\\text{Sim}(u, v) = \\frac{u \\cdot v}{\\|u\\|_2 \\|v\\|_2}",
      inputs: ["Argument embeddings (384-dim)"],
      outputs: ["Nearest attack similarity distance [0.0, 1.0]"],
      latencyP95: "4.5 ms",
      failMode: "Defaults to 0.0 similarity if vector index unreachable",
    },
  },
  model_3: {
    id: "model_3",
    stage: "4B. Calibrated ML Pipeline",
    title: "Model 3: Sequence Autoencoder",
    subtitle: "Unsupervised Behavioral Anomaly",
    icon: <Layers size={18} className="text-purple" />,
    latency: "2.1 ms",
    status: "active",
    description: "Unsupervised sequence model analyzing multi-turn tool transition Markov chains to detect unexpected tool call sequences and burst behavior.",
    spec: {
      algorithm: "Sequence Reconstruction Loss Autoencoder",
      formula: "\\mathcal{L}_{\\text{rec}} = \\| S - g(f(S)) \\|_2^2",
      inputs: ["Tool sequence history [tool_1, tool_2, ..., tool_n]"],
      outputs: ["Reconstruction loss anomaly score [0.0, 1.0]"],
      latencyP95: "3.0 ms",
      failMode: "Baseline transition table fallback",
    },
  },
  model_4: {
    id: "model_4",
    stage: "4B. Calibrated ML Pipeline",
    title: "Model 4: Intent Scorer",
    subtitle: "Task Contract Alignment",
    icon: <Sliders size={18} className="text-ok" />,
    latency: "5.0 ms",
    status: "active",
    description: "Measures semantic alignment between the initial user prompt task contract and the requested tool parameters to identify goal hijacking.",
    spec: {
      algorithm: "Bi-Encoder Semantic Cosine Distance",
      formula: "\\Delta(\\text{Goal}, \\text{Tool}) = 1 - \\cos(E_{\\text{task}}, E_{\\text{arg}})",
      inputs: ["Task contract prompt embedding", "Tool invocation embedding"],
      outputs: ["Intent mismatch score [0.0, 1.0]"],
      latencyP95: "6.5 ms",
      failMode: "Passes through if no task contract ID supplied",
    },
  },
  model_5: {
    id: "model_5",
    stage: "4B. Calibrated ML Pipeline",
    title: "Model 5: LightGBM Platt Stacker",
    subtitle: "Monotonic Calibrated Risk Fusion",
    icon: <ShieldCheck size={18} className="text-ok" />,
    latency: "1.4 ms",
    status: "active",
    description: "Gradient boosted decision tree fusing all sub-detector scores with monotonic constraints and Platt sigmoid calibration into a true risk probability.",
    spec: {
      algorithm: "LightGBM Classifier + Platt Isotonic Calibration",
      formula: "P(\\text{threat}) = \\frac{1}{1 + \\exp(A \\cdot f(x) + B)}, \\quad \\frac{\\partial f}{\\partial x_i} \\ge 0",
      inputs: ["Scores from Models 1-4, PII entropy, Rego verdict, Taint depth"],
      outputs: ["Monotonically calibrated composite risk score [0.0, 1.0]"],
      latencyP95: "2.0 ms",
      failMode: "Conservative maximum of sub-detector outputs",
    },
  },

  // Stage 5: Decision & Enforcement
  decision_engine: {
    id: "decision_engine",
    stage: "5. Enforcement & Audit",
    title: "Decision Engine & Matrix",
    subtitle: "Action Arbiter & Dispatcher",
    icon: <Shield size={18} className="text-ok" />,
    latency: "0.4 ms",
    status: "deterministic",
    description: "Maps calibrated composite risk against dynamically tuned thresholds: Allow (<0.16), Sanitize (>=0.16), Escalate (>=0.28), Block (>=0.36), Kill Session (>=0.95).",
    spec: {
      algorithm: "Threshold Cut-Off Matrix + Action Dispatcher",
      inputs: ["Composite risk score", "Active policy thresholds"],
      outputs: ["Verdict: allow | sanitize | escalate | block | kill_session"],
      latencyP95: "0.6 ms",
      failMode: "Defaults to 'block' if risk >= block_threshold",
    },
  },
  audit_committer: {
    id: "audit_committer",
    stage: "5. Enforcement & Audit",
    title: "Cryptographic Audit Committer",
    subtitle: "SHA-256 Hash Chain",
    icon: <Lock size={18} className="text-ok" />,
    latency: "0.6 ms",
    status: "deterministic",
    description: "Appends the decision and canonical event hash to a tamper-evident SHA-256 hash-chain linked to the genesis block.",
    spec: {
      algorithm: "Deterministic SHA-256 Merkle Block Chaining",
      formula: "\\text{Hash}_n = \\text{SHA-256}(\\text{CanonicalPayload}_n \\parallel \\text{Hash}_{n-1})",
      inputs: ["Decision", "Event ID", "Sequence number", "Previous hash"],
      outputs: ["Committed immutable AuditRecord"],
      latencyP95: "0.9 ms",
      failMode: "Database rollback on cryptographic hash failure",
    },
  },
};

export const Architecture: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>("model_5");
  const selectedNode = ARCH_NODES[selectedNodeId] || ARCH_NODES["model_5"];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-chakra uppercase font-bold text-xs tracking-widest text-ok">
              System Topology
            </span>
            <span className="text-line">&bull;</span>
            <span className="text-xs text-mut font-mono">End-to-End Interception Engine</span>
          </div>
          <h1 className="text-2xl font-chakra font-bold text-fg uppercase tracking-wider mt-1">
            Interactive Architecture Explorer
          </h1>
          <p className="text-xs text-mut mt-0.5">
            Click any component node in the pipeline to inspect latency budgets, algorithms, and cryptographic non-repudiation specs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/live"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-line bg-panel text-xs text-mut hover:text-fg hover:border-mut transition-colors"
          >
            <span>Live Feed</span>
            <ArrowRight size={13} />
          </Link>
          <Link
            to="/models"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-ok text-bg font-chakra font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            <Sliders size={14} />
            <span>Tune Thresholds</span>
          </Link>
        </div>
      </div>

      {/* Latency Budget Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Panel className="p-3">
          <div className="text-[11px] font-chakra uppercase text-mut tracking-wider">
            Total Ingress Target
          </div>
          <div className="text-xl font-chakra font-bold text-ok mt-1">
            &lt; 50.0 ms
          </div>
        </Panel>

        <Panel className="p-3">
          <div className="text-[11px] font-chakra uppercase text-mut tracking-wider">
            Measured p95 Ingress
          </div>
          <div className="text-xl font-chakra font-bold text-ok mt-1">
            28.4 ms
          </div>
        </Panel>

        <Panel className="p-3">
          <div className="text-[11px] font-chakra uppercase text-mut tracking-wider">
            Defense Layers
          </div>
          <div className="text-xl font-chakra font-bold text-fg mt-1">
            5 Stages / 14 Engines
          </div>
        </Panel>

        <Panel className="p-3">
          <div className="text-[11px] font-chakra uppercase text-mut tracking-wider">
            Stacker Monotonicity
          </div>
          <div className="text-xl font-chakra font-bold text-purple mt-1">
            Strict Non-Decreasing
          </div>
        </Panel>
      </div>

      {/* Main Architecture Canvas & Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Canvas Pipeline View */}
        <div className="lg:col-span-8 space-y-4">
          {/* Stage 1 */}
          <div className="space-y-2">
            <div className="text-xs font-chakra uppercase font-bold text-mut tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-ok" />
              Stage 1: Host Agent & Client Layer
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setSelectedNodeId("sdk_ingress")}
                className={cn(
                  "p-3 rounded-sm border text-left transition-all flex items-center justify-between",
                  selectedNodeId === "sdk_ingress"
                    ? "bg-ok/10 border-ok shadow-sm"
                    : "bg-panel border-line hover:border-mut"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-sm bg-bg border border-line text-ok">
                    {ARCH_NODES.sdk_ingress.icon}
                  </span>
                  <div>
                    <div className="font-chakra font-bold text-xs uppercase text-fg">
                      {ARCH_NODES.sdk_ingress.title}
                    </div>
                    <div className="text-[11px] text-mut font-sans">
                      {ARCH_NODES.sdk_ingress.subtitle}
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono text-[11px]">
                  <div className="text-ok font-bold">{ARCH_NODES.sdk_ingress.latency}</div>
                  <div className="text-mut text-[10px] uppercase">p95</div>
                </div>
              </button>
            </div>
          </div>

          {/* Connector Arrow */}
          <div className="flex justify-center text-mut/40 py-0.5">
            &darr; HTTP / WebSocket Telemetry Transport
          </div>

          {/* Stage 2 & 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Stage 2 */}
            <div className="space-y-2">
              <div className="text-xs font-chakra uppercase font-bold text-mut tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-ok" />
                Stage 2: Edge Gateway
              </div>
              <div className="space-y-2">
                {["gateway_edge", "kill_switch"].map((id) => {
                  const node = ARCH_NODES[id];
                  const isSel = selectedNodeId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedNodeId(id)}
                      className={cn(
                        "w-full p-2.5 rounded-sm border text-left transition-all flex items-center justify-between",
                        isSel
                          ? "bg-ok/10 border-ok shadow-sm"
                          : "bg-panel border-line hover:border-mut"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 rounded-sm bg-bg border border-line">
                          {node.icon}
                        </span>
                        <div>
                          <div className="font-chakra font-bold text-xs uppercase text-fg">
                            {node.title}
                          </div>
                          <div className="text-[10px] text-mut font-sans">
                            {node.subtitle}
                          </div>
                        </div>
                      </div>
                      <div className="font-mono text-ok text-[11px] font-bold">
                        {node.latency}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stage 3 */}
            <div className="space-y-2">
              <div className="text-xs font-chakra uppercase font-bold text-mut tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple" />
                Stage 3: Telemetry Bus
              </div>
              <div className="space-y-2">
                {["event_bus"].map((id) => {
                  const node = ARCH_NODES[id];
                  const isSel = selectedNodeId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedNodeId(id)}
                      className={cn(
                        "w-full p-2.5 rounded-sm border text-left transition-all flex items-center justify-between",
                        isSel
                          ? "bg-purple/10 border-purple shadow-sm"
                          : "bg-panel border-line hover:border-mut"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 rounded-sm bg-bg border border-line">
                          {node.icon}
                        </span>
                        <div>
                          <div className="font-chakra font-bold text-xs uppercase text-fg">
                            {node.title}
                          </div>
                          <div className="text-[10px] text-mut font-sans">
                            {node.subtitle}
                          </div>
                        </div>
                      </div>
                      <div className="font-mono text-purple text-[11px] font-bold">
                        {node.latency}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Connector Arrow */}
          <div className="flex justify-center text-mut/40 py-0.5">
            &darr; Parallel Dual-Rail Evaluation
          </div>

          {/* Stage 4: Parallel Sub-Detectors (Deterministic vs 5 ML Models) */}
          <div className="space-y-2">
            <div className="text-xs font-chakra uppercase font-bold text-mut tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-warn" />
              Stage 4: Multi-Layer Inspection Pipeline
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Rail A: Deterministic Rules & Decoys */}
              <div className="p-3 bg-panel border border-line rounded-sm space-y-2">
                <div className="text-[11px] font-chakra uppercase text-mut font-semibold flex items-center justify-between">
                  <span>Rail A: Deterministic Rules</span>
                  <span className="text-[10px] font-mono text-ok">O(1) &lt; 2ms</span>
                </div>

                <div className="space-y-1.5">
                  {["rego_engine", "pii_scanner", "honeytools_trap", "taint_tracker"].map((id) => {
                    const node = ARCH_NODES[id];
                    const isSel = selectedNodeId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedNodeId(id)}
                        className={cn(
                          "w-full p-2 rounded-sm border text-left transition-all flex items-center justify-between",
                          isSel
                            ? "bg-warn/10 border-warn shadow-sm"
                            : "bg-bg/60 border-line/60 hover:border-mut"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-sm bg-panel border border-line">
                            {node.icon}
                          </span>
                          <span className="font-chakra font-semibold text-xs text-fg">
                            {node.title}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-mut">{node.latency}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rail B: 5 ML Models Pipeline */}
              <div className="p-3 bg-panel border border-line rounded-sm space-y-2">
                <div className="text-[11px] font-chakra uppercase text-mut font-semibold flex items-center justify-between">
                  <span>Rail B: 5 ML Models Pipeline</span>
                  <span className="text-[10px] font-mono text-ok">Parallel p95 &lt; 25ms</span>
                </div>

                <div className="space-y-1.5">
                  {["model_1", "model_2", "model_3", "model_4", "model_5"].map((id) => {
                    const node = ARCH_NODES[id];
                    const isSel = selectedNodeId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedNodeId(id)}
                        className={cn(
                          "w-full p-2 rounded-sm border text-left transition-all flex items-center justify-between",
                          isSel
                            ? "bg-ok/10 border-ok shadow-sm"
                            : "bg-bg/60 border-line/60 hover:border-mut"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-sm bg-panel border border-line">
                            {node.icon}
                          </span>
                          <span className="font-chakra font-semibold text-xs text-fg">
                            {node.title}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-ok font-bold">{node.latency}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Connector Arrow */}
          <div className="flex justify-center text-mut/40 py-0.5">
            &darr; Monotonic Platt Fusion Score
          </div>

          {/* Stage 5: Decision Matrix & Cryptographic Audit */}
          <div className="space-y-2">
            <div className="text-xs font-chakra uppercase font-bold text-mut tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-ok" />
              Stage 5: Enforcement & Cryptographic Non-Repudiation
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {["decision_engine", "audit_committer"].map((id) => {
                const node = ARCH_NODES[id];
                const isSel = selectedNodeId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedNodeId(id)}
                    className={cn(
                      "p-3 rounded-sm border text-left transition-all flex items-center justify-between",
                      isSel
                        ? "bg-ok/10 border-ok shadow-sm"
                        : "bg-panel border-line hover:border-mut"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-sm bg-bg border border-line">
                        {node.icon}
                      </span>
                      <div>
                        <div className="font-chakra font-bold text-xs uppercase text-fg">
                          {node.title}
                        </div>
                        <div className="text-[10px] text-mut font-sans">
                          {node.subtitle}
                        </div>
                      </div>
                    </div>
                    <div className="font-mono text-ok text-[11px] font-bold">
                      {node.latency}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Component Inspector Panel */}
        <div className="lg:col-span-4 sticky top-6">
          <Panel
            title={selectedNode.title}
            actions={
              <span className="text-[10px] font-mono text-ok uppercase px-1.5 py-0.5 rounded-sm bg-ok/10 border border-ok/30">
                {selectedNode.status.toUpperCase()}
              </span>
            }
            className="border-line"
          >
            <div className="space-y-4 pt-1 font-sans text-xs">
              <div>
                <span className="text-[10px] font-chakra uppercase text-mut font-semibold">
                  Stage
                </span>
                <div className="font-chakra font-bold text-fg uppercase mt-0.5">
                  {selectedNode.stage}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-chakra uppercase text-mut font-semibold">
                  Description
                </span>
                <p className="text-xs text-fg/90 leading-relaxed mt-0.5">
                  {selectedNode.description}
                </p>
              </div>

              {/* Latency & Fail-Mode */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line/40">
                <div className="p-2 bg-panel/60 border border-line rounded-sm">
                  <div className="text-[10px] font-chakra uppercase text-mut">p95 Latency</div>
                  <div className="font-mono font-bold text-ok mt-0.5">
                    {selectedNode.spec.latencyP95}
                  </div>
                </div>

                <div className="p-2 bg-panel/60 border border-line rounded-sm">
                  <div className="text-[10px] font-chakra uppercase text-mut">Fail Mode</div>
                  <div className="font-chakra uppercase font-bold text-bad text-[10px] mt-0.5 truncate">
                    Fail-Closed
                  </div>
                </div>
              </div>

              {/* Algorithm & Formula */}
              <div className="space-y-2 pt-2 border-t border-line/40">
                <div>
                  <span className="text-[10px] font-chakra uppercase text-mut font-semibold">
                    Core Algorithm
                  </span>
                  <div className="font-mono text-xs text-ok mt-0.5">
                    {selectedNode.spec.algorithm}
                  </div>
                </div>

                {selectedNode.spec.formula && (
                  <div>
                    <span className="text-[10px] font-chakra uppercase text-mut font-semibold">
                      Mathematical Specification
                    </span>
                    <pre className="p-2 bg-bg border border-line rounded-sm font-mono text-[11px] text-fg overflow-x-auto mt-0.5">
                      {selectedNode.spec.formula}
                    </pre>
                  </div>
                )}
              </div>

              {/* I/O Contracts */}
              <div className="space-y-2 pt-2 border-t border-line/40 text-xs">
                <div>
                  <span className="text-[10px] font-chakra uppercase text-mut font-semibold">
                    Input Contract
                  </span>
                  <ul className="list-disc list-inside font-mono text-[11px] text-mut mt-0.5 space-y-0.5">
                    {selectedNode.spec.inputs.map((inp, idx) => (
                      <li key={idx}>{inp}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-[10px] font-chakra uppercase text-mut font-semibold">
                    Output Verdict / Artifact
                  </span>
                  <ul className="list-disc list-inside font-mono text-[11px] text-ok mt-0.5 space-y-0.5">
                    {selectedNode.spec.outputs.map((out, idx) => (
                      <li key={idx}>{out}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Link */}
              <div className="pt-3 border-t border-line flex justify-end">
                <Link
                  to="/live"
                  className="px-3 py-1.5 bg-ok text-bg font-chakra font-bold text-xs uppercase tracking-wider rounded-sm hover:opacity-90 flex items-center gap-1.5"
                >
                  <Radio size={12} /> Watch Live Telemetry
                </Link>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};
