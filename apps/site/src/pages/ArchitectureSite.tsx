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
  Sliders,
  Play,
  RotateCcw,
} from "lucide-react";

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

const ARCH_NODES: ArchNode[] = [
  {
    id: "rules",
    stage: "1. Deterministic Security Plane",
    title: "Boundary & Rules Guard",
    subtitle: "High-throughput regex and canary traps",
    icon: <Lock size={18} className="text-ok" />,
    latency: "0.4 ms",
    status: "deterministic",
    description: "Evaluates hardcoded boundary patterns, shell chaining commands, and canary token leakage.",
    spec: {
      algorithm: "Deterministic Pattern Matching + High-Recall Canary Inspection",
      formula: "\\exists c \\in \\mathcal{C}_{canary} : c \\subseteq \\text{args} \\implies \\text{BLOCK}",
      inputs: ["ToolCallEvent arguments", "Untrusted context segments"],
      outputs: ["Reason codes", "Direct override flag"],
      latencyP95: "0.4 ms",
      failMode: "fail-closed",
    },
  },
  {
    id: "pii",
    stage: "1. Deterministic Security Plane",
    title: "PII & Secret Entropy Guard",
    subtitle: "Shannon entropy H(X) and API key patterns",
    icon: <Key size={18} className="text-ok" />,
    latency: "1.2 ms",
    status: "deterministic",
    description: "Scans arguments and outputs for AWS keys, OpenAI tokens, JWTs, and high-entropy strings.",
    spec: {
      algorithm: "Shannon Entropy H(X) + Regex Pattern Scanners",
      formula: "H(X) = -\\sum_{i=1}^{n} P(x_i) \\log_2 P(x_i) > 4.5",
      inputs: ["Argument string values", "Output payloads"],
      outputs: ["PII spans", "Sanitization proposals"],
      latencyP95: "1.2 ms",
      failMode: "sanitize in-place",
    },
  },
  {
    id: "honey",
    stage: "2. Active Deception Plane",
    title: "Decoy Honeytools & Tokens",
    subtitle: "Synthetic tripwire traps",
    icon: <Flame size={18} className="text-bad" />,
    latency: "0.2 ms",
    status: "deterministic",
    description: "Exposes fake high-privilege tools (e.g. export_all_customers). Any touch terminates the session.",
    spec: {
      algorithm: "Exact Decoy Tool Identifier Match",
      formula: "\\text{tool.name} \\in \\mathcal{H}_{decoy} \\implies \\text{KILL\\_SESSION}",
      inputs: ["Tool name", "Fake credentials"],
      outputs: ["Immediate session termination", "Forensic alert"],
      latencyP95: "0.2 ms",
      failMode: "kill session immediately",
    },
  },
  {
    id: "taint",
    stage: "3. Taint & Task Contract Engine",
    title: "Taint Depth & OPA Rego",
    subtitle: "Intent-bound least privilege",
    icon: <GitBranch size={18} className="text-warn" />,
    latency: "2.5 ms",
    status: "active",
    description: "Tracks untrusted segment influence and evaluates tenant OPA Rego guardrails.",
    spec: {
      algorithm: "Graph Reachability + OPA Rego Evaluation",
      formula: "\\text{Path}(u_{untrusted} \\to s_{critical}) \\neq \\emptyset \\implies \\text{ESCALATE}",
      inputs: ["Context segment lineage", "Tenant Rego bundle"],
      outputs: ["Allow/Deny verdict", "Taint propagation graph"],
      latencyP95: "2.5 ms",
      failMode: "fail-closed for high-risk sinks",
    },
  },
  {
    id: "injection",
    stage: "4. Calibrated ML Pipeline",
    title: "Model 1: DeBERTa Classifier",
    subtitle: "Quantized deep neural injection detector",
    icon: <Binary size={18} className="text-ok" />,
    latency: "13.8 ms",
    status: "online",
    description: "Quantized int8 ONNX transformer classifying direct and indirect prompt injections.",
    spec: {
      algorithm: "microsoft/deberta-v3-base (int8 quantized ONNX)",
      formula: "P(\\text{injection}) = \\text{Softmax}(W_2 \\cdot \\text{GELU}(W_1 h + b_1) + b_2)",
      inputs: ["Tokenized arguments and untrusted segments (max 512 tokens)"],
      outputs: ["Injection risk score [0.0 - 1.0]"],
      latencyP95: "13.8 ms",
      failMode: "degraded mode (rules fallback)",
    },
  },
  {
    id: "similarity",
    stage: "4. Calibrated ML Pipeline",
    title: "Model 2: Semantic Attack Index",
    subtitle: "all-MiniLM-L6-v2 + FAISS vector search",
    icon: <Cpu size={18} className="text-ok" />,
    latency: "10.6 ms",
    status: "online",
    description: "Computes cosine distance against index of known jailbreak and exfiltration patterns.",
    spec: {
      algorithm: "Sentence-Transformers all-MiniLM-L6-v2 + FAISS FlatIP",
      formula: "\\text{sim}(q, v_i) = \\frac{q \\cdot v_i}{\\|q\\| \\|v_i\\|} > \\tau",
      inputs: ["Input text embeddings (384 dimensions)"],
      outputs: ["Nearest attack similarity score"],
      latencyP95: "10.6 ms",
      failMode: "bypass to stacker with score 0.0",
    },
  },
  {
    id: "risk_stacker",
    stage: "5. Risk Stacker & Enforcement",
    title: "Model 5: LightGBM Platt Stacker",
    subtitle: "Monotonic calibrated risk fusion",
    icon: <ShieldCheck size={18} className="text-ok" />,
    latency: "1.4 ms",
    status: "active",
    description: "Gradient boosted trees fusing all detector scores with monotonic constraints into true probabilities.",
    spec: {
      algorithm: "LightGBM Classifier + Platt Sigmoid Scaling",
      formula: "P(\\text{threat}) = \\frac{1}{1 + \\exp(A \\cdot f(x) + B)}, \\quad \\frac{\\partial f}{\\partial x_i} \\ge 0",
      inputs: ["Scores from Models 1-4, PII entropy, Rego verdict, Taint depth"],
      outputs: ["Calibrated risk probability P(threat)"],
      latencyP95: "1.4 ms",
      failMode: "rules-only max score",
    },
  },
];

export const ArchitectureSite: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<ArchNode>(ARCH_NODES[0]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="text-ok" size={24} />
          <h1 className="font-chakra text-3xl sm:text-4xl font-bold uppercase tracking-wide text-fg">
            System Architecture Explorer
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-mut max-w-3xl leading-relaxed">
          AgentShield-X decouples enforcement from slow LLM judges. The real-time data plane
          evaluates 7 parallel detector subsystems with mathematical guarantees in &lt; 15ms.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Nodes List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <span className="font-chakra text-xs uppercase font-bold text-mut">
            Inspection Subsystems (Ordered by Execution Stage)
          </span>

          <div className="space-y-2">
            {ARCH_NODES.map((node) => {
              const isSelected = selectedNode.id === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-3.5 border rounded-sm cursor-pointer transition-all space-y-2 ${
                    isSelected
                      ? "bg-panel border-ok shadow-lg"
                      : "bg-panel/40 border-line hover:border-line/80 text-mut hover:text-fg"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-chakra uppercase font-bold text-mut">
                      {node.stage}
                    </span>
                    <span className="font-mono text-[11px] text-ok font-semibold">
                      {node.latency}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-bg border border-line rounded-sm">{node.icon}</div>
                    <div>
                      <div className="font-chakra font-bold text-sm text-fg uppercase">
                        {node.title}
                      </div>
                      <div className="text-[11px] text-mut">{node.subtitle}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Node Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 bg-panel border border-line rounded-sm space-y-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <span className="text-[10px] font-chakra uppercase text-ok font-bold">
                  {selectedNode.stage}
                </span>
                <h2 className="font-chakra text-xl font-bold text-fg uppercase">
                  {selectedNode.title}
                </h2>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 bg-ok/15 text-ok border border-ok/30 rounded-sm font-bold">
                p95: {selectedNode.spec.latencyP95}
              </span>
            </div>

            <p className="text-xs text-mut leading-relaxed">{selectedNode.description}</p>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-chakra uppercase text-mut font-semibold">
                  Algorithm & Engine
                </span>
                <div className="p-2.5 bg-bg border border-line rounded-sm font-mono text-xs text-fg mt-1">
                  {selectedNode.spec.algorithm}
                </div>
              </div>

              {selectedNode.spec.formula && (
                <div>
                  <span className="text-[10px] font-chakra uppercase text-mut font-semibold">
                    Mathematical Specification
                  </span>
                  <pre className="p-2.5 bg-bg border border-line rounded-sm font-mono text-xs text-ok overflow-x-auto mt-1">
                    {selectedNode.spec.formula}
                  </pre>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-[10px] font-chakra uppercase text-mut font-semibold">
                    Input Contract
                  </span>
                  <ul className="list-disc list-inside font-mono text-[11px] text-mut mt-1 space-y-1">
                    {selectedNode.spec.inputs.map((inp, idx) => (
                      <li key={idx}>{inp}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-[10px] font-chakra uppercase text-mut font-semibold">
                    Output Verdict
                  </span>
                  <ul className="list-disc list-inside font-mono text-[11px] text-ok mt-1 space-y-1">
                    {selectedNode.spec.outputs.map((out, idx) => (
                      <li key={idx}>{out}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-line flex items-center justify-between text-xs font-chakra">
              <span className="text-mut">
                Degraded Fail Mode:{" "}
                <strong className="text-fg font-mono">{selectedNode.spec.failMode}</strong>
              </span>
              <Link
                to="/demo"
                className="text-ok font-bold uppercase hover:underline flex items-center gap-1"
              >
                <span>Test in Playground</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
