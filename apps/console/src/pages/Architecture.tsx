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
  Sparkles,
  Activity,
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
    icon: <Cpu size={18} className="text-purple-400" />,
    latency: "< 0.5 ms",
    status: "active",
    description: "Zero-dependency client library wrapping LangChain, CrewAI, AutoGen, or custom LLM agent loops with non-blocking async hooks.",
    spec: {
      algorithm: "Async Event Dispatcher + Local Shared Memory Cache",
      formula: "T_{\\text{overhead}} \\le 0.5\\text{ms}",
      inputs: ["Raw Tool Invocation payload", "Agent Metadata", "API Keys (Redacted)"],
      outputs: ["Canonical AST Action Envelope", "Client Timestamp Nonce"],
      latencyP95: "0.42 ms",
      failMode: "Configurable: Fail-Closed or Fail-Bypass",
    },
  },

  // Stage 2
  gateway_edge: {
    id: "gateway_edge",
    stage: "2. Edge Gateway Layer",
    title: "Ingress Gateway",
    subtitle: "FastAPI / Uvicorn Async Core",
    icon: <Shield size={18} className="text-purple-300" />,
    latency: "1.2 ms",
    status: "active",
    description: "High-throughput token authentication, rate limiting, and mTLS verification gateway.",
    spec: {
      algorithm: "Ed25519 Token Verification + Sliding Window Leaky Bucket",
      inputs: ["Bearer Token", "Action Envelope Payload"],
      outputs: ["Validated Ingress Context", "Tenant Partition Key"],
      latencyP95: "1.20 ms",
      failMode: "Fail-Closed (HTTP 401 / 429)",
    },
  },
  kill_switch: {
    id: "kill_switch",
    stage: "2. Edge Gateway Layer",
    title: "Agent Kill-Switch",
    subtitle: "Zero-Latency Circuit Breaker",
    icon: <Zap size={18} className="text-fuchsia-400" />,
    latency: "0.1 ms",
    status: "active",
    description: "In-memory atomic bitmask capable of revoking agent credentials and intercepting compromised execution loops in under 100 microseconds.",
    spec: {
      algorithm: "Atomic Redis Bitmask / Local Shared Memory Flag",
      formula: "\\text{Revoke}(a_i) \\implies \\text{Block}(t > t_0)",
      inputs: ["Agent ID", "Security Policy State"],
      outputs: ["Execution Permitted / Terminated"],
      latencyP95: "0.08 ms",
      failMode: "Fail-Closed",
    },
  },

  // Stage 3
  event_bus: {
    id: "event_bus",
    stage: "3. Telemetry Bus",
    title: "Event Bus & WebSocket",
    subtitle: "Real-time Telemetry Dispatcher",
    icon: <Radio size={18} className="text-purple-400" />,
    latency: "0.8 ms",
    status: "online",
    description: "Broadcasts continuous telemetry, verdicts, and taint traces to connected web consoles and SIEM collectors via WebSocket.",
    spec: {
      algorithm: "Pub/Sub Ring Buffer with Memory Backpressure Drops",
      inputs: ["Engine Verdict Events", "Taint Graph Deltas"],
      outputs: ["WebSocket Binary Frames", "Audit Queue"],
      latencyP95: "0.78 ms",
      failMode: "Degrade to Polling",
    },
  },

  // Stage 4 - Deterministic Rail
  rego_engine: {
    id: "rego_engine",
    stage: "4A. Deterministic Rules",
    title: "OPA / Rego Engine",
    subtitle: "Declarative Policy Evaluation",
    icon: <FileCode size={18} className="text-purple-300" />,
    latency: "1.1 ms",
    status: "deterministic",
    description: "Open Policy Agent engine running compiled declarative rules against agent payloads, verifying blast-radius limits, file access, and network egress.",
    spec: {
      algorithm: "Compiled Rego AST Traversal (Go/Wasm Interop)",
      inputs: ["Action Context", "Organization Policies"],
      outputs: ["Deterministic Boolean Verdict", "Violated Rule Sets"],
      latencyP95: "1.08 ms",
      failMode: "Fail-Closed",
    },
  },
  pii_scanner: {
    id: "pii_scanner",
    stage: "4A. Deterministic Rules",
    title: "PII & Secret Scanner",
    subtitle: "Hyperscan Regex + Entropy",
    icon: <Lock size={18} className="text-purple-400" />,
    latency: "0.9 ms",
    status: "deterministic",
    description: "Scans arguments and output text for API keys, AWS credentials, JWT tokens, credit cards, and high-entropy secret payloads.",
    spec: {
      algorithm: "Shannon Entropy Filtering + SIMD Hyperscan Regex",
      formula: "H(X) = -\\sum P(x) \\log_2 P(x)",
      inputs: ["Command Strings", "File Contents", "LLM Messages"],
      outputs: ["Sanitized Payload", "PII Redaction Map"],
      latencyP95: "0.88 ms",
      failMode: "Fail-Closed / Redact",
    },
  },
  honeytools_trap: {
    id: "honeytools_trap",
    stage: "4A. Deterministic Rules",
    title: "Honeytools Decoy Trap",
    subtitle: "Synthetic Deception Layer",
    icon: <ShieldCheck size={18} className="text-fuchsia-400" />,
    latency: "0.2 ms",
    status: "deterministic",
    description: "Dynamically injects decoy tools (e.g. read_aws_credentials, run_admin_sql) into the agent's schema to detect adversarial jailbreaks and zero-day prompt injection.",
    spec: {
      algorithm: "Exact Hash Matching + Shadow Tool Manifest",
      inputs: ["Invoked Tool Name", "Tool Argument Schema"],
      outputs: ["Deception Trigger Alert", "Synthetic Honeytoken"],
      latencyP95: "0.18 ms",
      failMode: "Immediate Quarantine",
    },
  },
  taint_tracker: {
    id: "taint_tracker",
    stage: "4A. Deterministic Rules",
    title: "Taint-to-Sink Tracker",
    subtitle: "Multi-Hop Blast Propagation",
    icon: <GitBranch size={18} className="text-purple-300" />,
    latency: "1.4 ms",
    status: "deterministic",
    description: "Constructs a directed acyclic graph (DAG) tracing untrusted user and tool outputs to high-privilege sinks (bash, database, email) across multi-agent workflows.",
    spec: {
      algorithm: "Dynamic Taint Flow Analysis over AST Directed Acyclic Graph",
      formula: "\\text{Sink}(s) \\cap \\text{Taint}(u) \\ne \\emptyset \\implies \\text{Block}",
      inputs: ["Action Flow History", "Tool Invocations DAG"],
      outputs: ["Taint Contamination Vector", "Blast Radius Metric"],
      latencyP95: "1.38 ms",
      failMode: "Fail-Closed",
    },
  },

  // Stage 4 - ML Rail
  model_1: {
    id: "model_1",
    stage: "4B. Calibrated ML Pipeline",
    title: "Model 1: DeBERTa Classifier",
    subtitle: "Prompt Injection & Jailbreak Neural Detector",
    icon: <Binary size={18} className="text-purple-400" />,
    latency: "18.5 ms",
    status: "active",
    description: "Fine-tuned DeBERTa-v3 sequence classification model detecting direct and indirect prompt injection, instruction overrides, and role-reversal attacks.",
    spec: {
      algorithm: "Transformer Encoder + Cross-Attention Head",
      inputs: ["Prompt String", "System Prompt Context"],
      outputs: ["P(Injection) \\in [0, 1]"],
      latencyP95: "18.5 ms",
      failMode: "Fall-through to Platt Stacker",
    },
  },
  model_2: {
    id: "model_2",
    stage: "4B. Calibrated ML Pipeline",
    title: "Model 2: Llama-Guard 3",
    subtitle: "Safety & Policy Moderation",
    icon: <Shield size={18} className="text-violet-400" />,
    latency: "22.1 ms",
    status: "active",
    description: "Quantized 8B parameter safety evaluator categorizing content against 14 risk categories including malware generation and unauthorized data extraction.",
    spec: {
      algorithm: "Quantized Auto-Regressive LLM Guard",
      inputs: ["Input/Output Transcript"],
      outputs: ["Safety Category Probability Distribution"],
      latencyP95: "22.1 ms",
      failMode: "Fall-through to Platt Stacker",
    },
  },
  model_3: {
    id: "model_3",
    stage: "4B. Calibrated ML Pipeline",
    title: "Model 3: Semantic Isolation",
    subtitle: "Prototype Vector Embedding Classifier",
    icon: <Activity size={18} className="text-fuchsia-400" />,
    latency: "0.04 ms",
    status: "active",
    description: "Sub-millisecond latent distance classifier projecting commands and tools onto 64-D adversarial prototype spaces with cosine similarity scoring.",
    spec: {
      algorithm: "64-D Latent Semantic Distance Projection",
      formula: "\\text{Risk}(x) = \\max_k \\cos(\\vec{v}(x), \\vec{\\mu}_k)",
      inputs: ["Tool Command / Argument Vector"],
      outputs: ["Semantic Sink Risk Score"],
      latencyP95: "0.05 ms",
      failMode: "Deterministic Fallback",
    },
  },
  model_4: {
    id: "model_4",
    stage: "4B. Calibrated ML Pipeline",
    title: "Model 4: Behavioral Anomaly",
    subtitle: "Autoencoder Reconstruction Loss",
    icon: <Zap size={18} className="text-purple-300" />,
    latency: "3.2 ms",
    status: "active",
    description: "Evaluates deviations from historical baseline agent behavior, detecting rogue loops and exfiltration spikes in tool call sequencing.",
    spec: {
      algorithm: "Variational Autoencoder (VAE) Reconstruction Error",
      formula: "\\mathcal{L}_{\\text{anomaly}} = ||x - \\hat{x}||^2 + D_{\\text{KL}}",
      inputs: ["Tool Call Frequency", "Payload Size", "Argument Entropy"],
      outputs: ["Drift Anomaly Score"],
      latencyP95: "3.2 ms",
      failMode: "Zero-loss Baseline",
    },
  },
  model_5: {
    id: "model_5",
    stage: "4B. Calibrated ML Pipeline",
    title: "Model 5: LightGBM Platt Stacker",
    subtitle: "Calibrated Monotonic Risk Aggregator",
    icon: <Sparkles size={18} className="text-fuchsia-400" />,
    latency: "2.0 ms",
    status: "active",
    description: "Gradient boosted decision tree fusing all sub-detector scores with monotonic constraints and Platt sigmoid calibration into a true risk probability.",
    spec: {
      algorithm: "LightGBM Classifier + Platt Isotonic Calibration",
      formula: "P(\\text{Threat}) = \\frac{1}{1 + \\exp(A \\cdot f(x) + B)}",
      inputs: ["Scores from Models 1-4", "PII entropy", "Rego verdict", "Taint depth"],
      outputs: ["Calibrated Risk Probability [0.0 - 1.0]", "Ensemble Confidence"],
      latencyP95: "2.0 ms",
      failMode: "FAIL-CLOSED",
    },
  },

  // Stage 5
  decision_engine: {
    id: "decision_engine",
    stage: "5. Enforcement & Decision Matrix",
    title: "Autonomous Decision Matrix",
    subtitle: "Allow / Block / Sanitize / Quarantine",
    icon: <ShieldCheck size={18} className="text-purple-400" />,
    latency: "0.4 ms",
    status: "active",
    description: "Evaluates calibrated risk against organization-defined sensitivity thresholds to enact instantaneous mitigation.",
    spec: {
      algorithm: "Multi-Threshold Branching Decision Logic",
      inputs: ["Calibrated Risk", "Policy Action Matrix", "Attestation Token"],
      outputs: ["Final Enforcement Action (ALLOW/BLOCK/SANITIZE/QUARANTINE)"],
      latencyP95: "0.38 ms",
      failMode: "Fail-Closed",
    },
  },
  audit_committer: {
    id: "audit_committer",
    stage: "5. Enforcement & Cryptographic Non-Repudiation",
    title: "Cryptographic Audit Ledger",
    subtitle: "Merkle-Chained Non-Repudiation Log",
    icon: <Lock size={18} className="text-violet-400" />,
    latency: "0.9 ms",
    status: "active",
    description: "Appends the tamper-evident cryptographic hash of the action, prompt, verdict, and signatures into a verifiable local Merkle ledger.",
    spec: {
      algorithm: "SHA-256 Merkle Tree Hash-Chaining + Ed25519 System Signature",
      formula: "H_n = \\text{SHA-256}(H_{n-1} \\parallel \\text{Payload}_n)",
      inputs: ["Action Verdict Envelope", "Parent Merkle Root"],
      outputs: ["Signed Audit Receipt", "Merkle Proof Leaf"],
      latencyP95: "0.85 ms",
      failMode: "Fail-Safe Async Queue",
    },
  },
};

export const Architecture: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>("model_5");
  const selectedNode = ARCH_NODES[selectedNodeId] || ARCH_NODES["model_5"];

  return (
    <div className="space-y-6">
      {/* Top Header - AgentShield-X Style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#120a24]/80 border border-purple-500/20 backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.12)]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-chakra uppercase font-bold text-xs tracking-widest text-purple-300 bg-purple-950/70 px-2.5 py-0.5 rounded border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
              System Topology
            </span>
            <span className="text-purple-400/50">&bull;</span>
            <span className="text-xs text-purple-300/80 font-mono">End-to-End Interception Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-chakra font-bold uppercase tracking-wider bg-gradient-to-r from-white via-purple-100 to-purple-400 bg-clip-text text-transparent">
            Interactive Architecture Explorer
          </h1>
          <p className="text-xs text-purple-200/70 mt-1 max-w-2xl">
            Click any component node in the pipeline to inspect latency budgets, algorithms, and cryptographic non-repudiation specs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/live"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-purple-500/30 bg-[#160d2e]/80 text-xs font-chakra font-bold uppercase tracking-wider text-purple-200 hover:text-white hover:border-purple-400 transition-all backdrop-blur-xl"
          >
            <span>Live Feed</span>
            <ArrowRight size={14} />
          </Link>
          <Link
            to="/models"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 via-purple-500 to-violet-600 hover:from-purple-500 hover:to-fuchsia-600 text-white font-chakra font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.45)] border border-purple-400/40 transition-all"
          >
            <Sliders size={14} />
            <span>Tune Thresholds</span>
          </Link>
        </div>
      </div>

      {/* Latency Budget Ribbon - AgentShield-X Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#120a24]/70 border border-purple-500/20 backdrop-blur-xl shadow-[0_0_20px_rgba(168,85,247,0.08)] hover:border-purple-400/40 transition-all">
          <div className="text-[11px] font-chakra uppercase text-purple-300/80 tracking-wider">
            Total Ingress Target
          </div>
          <div className="text-2xl font-chakra font-bold text-purple-300 mt-1 drop-shadow-[0_0_10px_rgba(192,132,252,0.4)]">
            &lt; 50.0 ms
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#120a24]/70 border border-purple-500/20 backdrop-blur-xl shadow-[0_0_20px_rgba(168,85,247,0.08)] hover:border-purple-400/40 transition-all">
          <div className="text-[11px] font-chakra uppercase text-purple-300/80 tracking-wider">
            Measured p95 Ingress
          </div>
          <div className="text-2xl font-chakra font-bold text-fuchsia-400 mt-1 drop-shadow-[0_0_10px_rgba(232,121,249,0.4)]">
            28.4 ms
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#120a24]/70 border border-purple-500/20 backdrop-blur-xl shadow-[0_0_20px_rgba(168,85,247,0.08)] hover:border-purple-400/40 transition-all">
          <div className="text-[11px] font-chakra uppercase text-purple-300/80 tracking-wider">
            Defense Layers
          </div>
          <div className="text-2xl font-chakra font-bold text-white mt-1">
            5 Stages / 14 Engines
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#120a24]/70 border border-purple-500/20 backdrop-blur-xl shadow-[0_0_20px_rgba(168,85,247,0.08)] hover:border-purple-400/40 transition-all">
          <div className="text-[11px] font-chakra uppercase text-purple-300/80 tracking-wider">
            Stacker Monotonicity
          </div>
          <div className="text-2xl font-chakra font-bold text-purple-400 mt-1">
            Strict Non-Decreasing
          </div>
        </div>
      </div>

      {/* Main Architecture Canvas & Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Canvas Pipeline View */}
        <div className="lg:col-span-8 space-y-4">
          {/* Stage 1 */}
          <div className="space-y-2">
            <div className="text-xs font-chakra uppercase font-bold text-purple-300 tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              Stage 1: Host Agent & Client Layer
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setSelectedNodeId("sdk_ingress")}
                className={cn(
                  "p-3.5 rounded-xl border text-left transition-all flex items-center justify-between backdrop-blur-xl",
                  selectedNodeId === "sdk_ingress"
                    ? "bg-purple-950/60 border-purple-400/80 shadow-[0_0_25px_rgba(168,85,247,0.3)]"
                    : "bg-[#120a24]/70 border-purple-500/20 hover:border-purple-400/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-lg bg-[#0d071a] border border-purple-500/30 text-purple-400">
                    {ARCH_NODES.sdk_ingress.icon}
                  </span>
                  <div>
                    <div className="font-chakra font-bold text-sm uppercase text-white">
                      {ARCH_NODES.sdk_ingress.title}
                    </div>
                    <div className="text-xs text-purple-300/70 font-sans">
                      {ARCH_NODES.sdk_ingress.subtitle}
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono text-xs">
                  <div className="text-purple-300 font-bold">{ARCH_NODES.sdk_ingress.latency}</div>
                  <div className="text-purple-400/60 text-[10px] uppercase">p95</div>
                </div>
              </button>
            </div>
          </div>

          {/* Connector Arrow */}
          <div className="flex justify-center text-purple-400/50 py-0.5 font-mono text-xs">
            &darr; HTTP / WebSocket Telemetry Transport
          </div>

          {/* Stage 2 & 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Stage 2 */}
            <div className="space-y-2">
              <div className="text-xs font-chakra uppercase font-bold text-purple-300 tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
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
                        "w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between backdrop-blur-xl",
                        isSel
                          ? "bg-purple-950/60 border-purple-400/80 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                          : "bg-[#120a24]/70 border-purple-500/20 hover:border-purple-400/50"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-lg bg-[#0d071a] border border-purple-500/30">
                          {node.icon}
                        </span>
                        <div>
                          <div className="font-chakra font-bold text-xs uppercase text-white">
                            {node.title}
                          </div>
                          <div className="text-[10px] text-purple-300/70 font-sans">
                            {node.subtitle}
                          </div>
                        </div>
                      </div>
                      <div className="font-mono text-purple-300 text-xs font-bold">
                        {node.latency}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stage 3 */}
            <div className="space-y-2">
              <div className="text-xs font-chakra uppercase font-bold text-purple-300 tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.8)]" />
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
                        "w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between backdrop-blur-xl",
                        isSel
                          ? "bg-purple-950/60 border-purple-400/80 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                          : "bg-[#120a24]/70 border-purple-500/20 hover:border-purple-400/50"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-lg bg-[#0d071a] border border-purple-500/30">
                          {node.icon}
                        </span>
                        <div>
                          <div className="font-chakra font-bold text-xs uppercase text-white">
                            {node.title}
                          </div>
                          <div className="text-[10px] text-purple-300/70 font-sans">
                            {node.subtitle}
                          </div>
                        </div>
                      </div>
                      <div className="font-mono text-fuchsia-400 text-xs font-bold">
                        {node.latency}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Connector Arrow */}
          <div className="flex justify-center text-purple-400/50 py-0.5 font-mono text-xs">
            &darr; Parallel Dual-Rail Evaluation
          </div>

          {/* Stage 4: Parallel Sub-Detectors (Deterministic vs 5 ML Models) */}
          <div className="space-y-2">
            <div className="text-xs font-chakra uppercase font-bold text-purple-300 tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              Stage 4: Multi-Layer Inspection Pipeline
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Rail A: Deterministic Rules & Decoys */}
              <div className="p-4 bg-[#120a24]/70 border border-purple-500/20 rounded-xl space-y-2.5 backdrop-blur-xl">
                <div className="text-xs font-chakra uppercase text-purple-300 font-semibold flex items-center justify-between">
                  <span>Rail A: Deterministic Rules</span>
                  <span className="text-[10px] font-mono text-purple-300">O(1) &lt; 2ms</span>
                </div>

                <div className="space-y-2">
                  {["rego_engine", "pii_scanner", "honeytools_trap", "taint_tracker"].map((id) => {
                    const node = ARCH_NODES[id];
                    const isSel = selectedNodeId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedNodeId(id)}
                        className={cn(
                          "w-full p-2.5 rounded-lg border text-left transition-all flex items-center justify-between",
                          isSel
                            ? "bg-purple-900/50 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.25)]"
                            : "bg-[#0d071a]/60 border-purple-500/20 hover:border-purple-400/40"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="p-1.5 rounded-md bg-[#120a24] border border-purple-500/30">
                            {node.icon}
                          </span>
                          <span className="font-chakra font-semibold text-xs text-white">
                            {node.title}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-purple-300/80">{node.latency}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rail B: 5 ML Models Pipeline */}
              <div className="p-4 bg-[#120a24]/70 border border-purple-500/20 rounded-xl space-y-2.5 backdrop-blur-xl">
                <div className="text-xs font-chakra uppercase text-purple-300 font-semibold flex items-center justify-between">
                  <span>Rail B: 5 ML Models Pipeline</span>
                  <span className="text-[10px] font-mono text-fuchsia-400">Parallel p95 &lt; 25ms</span>
                </div>

                <div className="space-y-2">
                  {["model_1", "model_2", "model_3", "model_4", "model_5"].map((id) => {
                    const node = ARCH_NODES[id];
                    const isSel = selectedNodeId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedNodeId(id)}
                        className={cn(
                          "w-full p-2.5 rounded-lg border text-left transition-all flex items-center justify-between",
                          isSel
                            ? "bg-purple-900/50 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.25)]"
                            : "bg-[#0d071a]/60 border-purple-500/20 hover:border-purple-400/40"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="p-1.5 rounded-md bg-[#120a24] border border-purple-500/30">
                            {node.icon}
                          </span>
                          <span className="font-chakra font-semibold text-xs text-white">
                            {node.title}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-purple-300 font-bold">{node.latency}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Connector Arrow */}
          <div className="flex justify-center text-purple-400/50 py-0.5 font-mono text-xs">
            &darr; Monotonic Platt Fusion Score
          </div>

          {/* Stage 5: Decision Matrix & Cryptographic Audit */}
          <div className="space-y-2">
            <div className="text-xs font-chakra uppercase font-bold text-purple-300 tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
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
                      "p-3 rounded-xl border text-left transition-all flex items-center justify-between backdrop-blur-xl",
                      isSel
                        ? "bg-purple-950/60 border-purple-400/80 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                        : "bg-[#120a24]/70 border-purple-500/20 hover:border-purple-400/50"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-lg bg-[#0d071a] border border-purple-500/30">
                        {node.icon}
                      </span>
                      <div>
                        <div className="font-chakra font-bold text-xs uppercase text-white">
                          {node.title}
                        </div>
                        <div className="text-[10px] text-purple-300/70 font-sans">
                          {node.subtitle}
                        </div>
                      </div>
                    </div>
                    <div className="font-mono text-purple-300 text-xs font-bold">
                      {node.latency}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Component Inspector Panel - AgentShield-X Glass Card */}
        <div className="lg:col-span-4 sticky top-6">
          <div className="rounded-2xl bg-[#120a24]/85 border border-purple-500/25 p-5 backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.15)] space-y-4">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <h3 className="font-chakra font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                {selectedNode.icon}
                {selectedNode.title}
              </h3>
              <span className="text-[10px] font-mono text-purple-300 uppercase px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/40">
                {selectedNode.status.toUpperCase()}
              </span>
            </div>

            <div className="space-y-4 font-sans text-xs">
              <div>
                <span className="text-[10px] font-chakra uppercase text-purple-300/70 font-semibold tracking-wider">
                  Stage
                </span>
                <div className="font-chakra font-bold text-white uppercase mt-0.5">
                  {selectedNode.stage}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-chakra uppercase text-purple-300/70 font-semibold tracking-wider">
                  Description
                </span>
                <p className="text-xs text-purple-100/80 leading-relaxed mt-0.5">
                  {selectedNode.description}
                </p>
              </div>

              {/* Latency & Fail-Mode */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-500/20">
                <div className="p-2.5 bg-[#0d071a]/70 border border-purple-500/20 rounded-lg">
                  <div className="text-[10px] font-chakra uppercase text-purple-300/70">p95 Latency</div>
                  <div className="font-mono font-bold text-purple-300 mt-0.5 text-sm">
                    {selectedNode.spec.latencyP95}
                  </div>
                </div>

                <div className="p-2.5 bg-[#0d071a]/70 border border-purple-500/20 rounded-lg">
                  <div className="text-[10px] font-chakra uppercase text-purple-300/70">Fail Mode</div>
                  <div className="font-chakra uppercase font-bold text-rose-400 text-xs mt-0.5 truncate">
                    Fail-Closed
                  </div>
                </div>
              </div>

              {/* Algorithm & Formula */}
              <div className="space-y-2 pt-2 border-t border-purple-500/20">
                <div>
                  <span className="text-[10px] font-chakra uppercase text-purple-300/70 font-semibold tracking-wider">
                    Core Algorithm
                  </span>
                  <div className="font-mono text-xs text-purple-300 mt-0.5">
                    {selectedNode.spec.algorithm}
                  </div>
                </div>

                {selectedNode.spec.formula && (
                  <div>
                    <span className="text-[10px] font-chakra uppercase text-purple-300/70 font-semibold tracking-wider">
                      Mathematical Specification
                    </span>
                    <pre className="p-2.5 bg-[#090414] border border-purple-500/30 rounded-lg font-mono text-[11px] text-purple-200 overflow-x-auto mt-0.5">
                      {selectedNode.spec.formula}
                    </pre>
                  </div>
                )}
              </div>

              {/* I/O Contracts */}
              <div className="space-y-2 pt-2 border-t border-purple-500/20 text-xs">
                <div>
                  <span className="text-[10px] font-chakra uppercase text-purple-300/70 font-semibold tracking-wider">
                    Input Contract
                  </span>
                  <ul className="list-disc list-inside font-mono text-[11px] text-purple-300/70 mt-0.5 space-y-0.5">
                    {selectedNode.spec.inputs.map((inp, idx) => (
                      <li key={idx}>{inp}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-[10px] font-chakra uppercase text-purple-300/70 font-semibold tracking-wider">
                    Output Verdict / Artifact
                  </span>
                  <ul className="list-disc list-inside font-mono text-[11px] text-purple-300 mt-0.5 space-y-0.5">
                    {selectedNode.spec.outputs.map((out, idx) => (
                      <li key={idx}>{out}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Link */}
              <div className="pt-3 border-t border-purple-500/20 flex justify-end">
                <Link
                  to="/live"
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-600 via-purple-500 to-violet-600 hover:from-purple-500 hover:to-fuchsia-600 text-white font-chakra font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-purple-400/30 transition-all flex items-center justify-center gap-2"
                >
                  <Radio size={14} /> Watch Live Telemetry
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
