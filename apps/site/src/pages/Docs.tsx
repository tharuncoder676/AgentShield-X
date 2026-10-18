import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Terminal,
  Code,
  FileCode,
  ExternalLink,
  Shield,
  Layers,
  Lock,
  GitBranch,
  Cpu,
  Flame,
} from "lucide-react";

export const Docs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"quickstart" | "sdk" | "rego" | "mcp" | "models">("quickstart");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Sidebar Nav (3 cols) */}
        <div className="md:col-span-3 space-y-4">
          <div className="font-chakra font-bold text-xs uppercase tracking-wider text-fg flex items-center gap-1.5">
            <BookOpen size={14} className="text-ok" /> Documentation
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("quickstart")}
              className={`w-full text-left px-3 py-2 text-xs font-chakra font-semibold uppercase rounded-sm transition-colors ${
                activeTab === "quickstart"
                  ? "bg-ok/15 text-ok border-l-2 border-ok"
                  : "text-mut hover:text-fg hover:bg-panel"
              }`}
            >
              Quickstart Guide
            </button>
            <button
              onClick={() => setActiveTab("sdk")}
              className={`w-full text-left px-3 py-2 text-xs font-chakra font-semibold uppercase rounded-sm transition-colors ${
                activeTab === "sdk"
                  ? "bg-ok/15 text-ok border-l-2 border-ok"
                  : "text-mut hover:text-fg hover:bg-panel"
              }`}
            >
              Python & TS SDKs
            </button>
            <button
              onClick={() => setActiveTab("rego")}
              className={`w-full text-left px-3 py-2 text-xs font-chakra font-semibold uppercase rounded-sm transition-colors ${
                activeTab === "rego"
                  ? "bg-ok/15 text-ok border-l-2 border-ok"
                  : "text-mut hover:text-fg hover:bg-panel"
              }`}
            >
              Rego & OPA Guardrails
            </button>
            <button
              onClick={() => setActiveTab("mcp")}
              className={`w-full text-left px-3 py-2 text-xs font-chakra font-semibold uppercase rounded-sm transition-colors ${
                activeTab === "mcp"
                  ? "bg-ok/15 text-ok border-l-2 border-ok"
                  : "text-mut hover:text-fg hover:bg-panel"
              }`}
            >
              MCP Proxy Integration
            </button>
            <button
              onClick={() => setActiveTab("models")}
              className={`w-full text-left px-3 py-2 text-xs font-chakra font-semibold uppercase rounded-sm transition-colors ${
                activeTab === "models"
                  ? "bg-ok/15 text-ok border-l-2 border-ok"
                  : "text-mut hover:text-fg hover:bg-panel"
              }`}
            >
              Model Specifications
            </button>
          </nav>

          <div className="pt-6 border-t border-line/60 space-y-2 text-[11px] font-chakra text-mut">
            <a
              href="https://github.com/agentshield-x/agentshield-x/blob/main/docs/api/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-ok flex items-center gap-1"
            >
              <span>Edit this page on GitHub</span>
              <ExternalLink size={10} />
            </a>
          </div>
        </div>

        {/* Content Area (9 cols) */}
        <div className="md:col-span-9 bg-panel border border-line rounded-sm p-6 sm:p-8 space-y-8 font-sans">
          {activeTab === "quickstart" && (
            <div className="space-y-6">
              <div className="space-y-2 border-b border-line pb-4">
                <span className="text-[10px] font-chakra uppercase text-ok font-bold">
                  Getting Started
                </span>
                <h2 className="font-chakra text-2xl font-bold uppercase text-fg">
                  AgentShield-X Quickstart
                </h2>
                <p className="text-xs text-mut leading-relaxed">
                  Protect any Python or TypeScript agent with lightweight tool decorators that
                  intercept invocations before network dispatch.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-chakra font-bold text-sm uppercase text-fg">
                  1. Install the SDK
                </h3>
                <pre className="p-3 bg-bg border border-line rounded-sm font-mono text-xs text-ok">
                  pip install agentshield-sdk
                </pre>
              </div>

              <div className="space-y-3">
                <h3 className="font-chakra font-bold text-sm uppercase text-fg">
                  2. Decorate Your Tools
                </h3>
                <pre className="p-4 bg-bg border border-line rounded-sm font-mono text-xs text-fg leading-relaxed overflow-x-auto">
{`from agentshield import AgentShield

# Initialize shield client (points to local or SaaS gateway)
shield = AgentShield(
    api_key="shield_live_key_981a",
    gateway_url="http://localhost:8000",
    fail_mode="closed"  # closed for sensitive sinks
)

@shield.tool(name="send_customer_email", sensitivity="high")
def send_customer_email(recipient: str, body: str):
    """Intercepted by AgentShield-X in < 15ms before execution."""
    return mailer.send(to=recipient, message=body)`}
                </pre>
              </div>

              <div className="space-y-3">
                <h3 className="font-chakra font-bold text-sm uppercase text-fg">
                  3. Verify in Console
                </h3>
                <p className="text-xs text-mut leading-relaxed">
                  When your agent runs, tool events stream live via WebSocket into the{" "}
                  <Link to="/demo" className="text-ok hover:underline font-semibold">
                    Live Telemetry Feed
                  </Link>
                  . Any adversarial prompt injection will raise a{" "}
                  <code className="text-bad font-mono text-xs">ShieldBlockedException</code>.
                </p>
              </div>
            </div>
          )}

          {activeTab === "sdk" && (
            <div className="space-y-6">
              <div className="space-y-2 border-b border-line pb-4">
                <span className="text-[10px] font-chakra uppercase text-ok font-bold">
                  SDK Reference
                </span>
                <h2 className="font-chakra text-2xl font-bold uppercase text-fg">
                  Python & TypeScript Integration
                </h2>
                <p className="text-xs text-mut leading-relaxed">
                  Official bindings with zero-dependency synchronous and asynchronous execution.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-chakra font-bold text-sm uppercase text-fg">
                  LangGraph Agent Wrapper
                </h3>
                <pre className="p-4 bg-bg border border-line rounded-sm font-mono text-xs text-fg leading-relaxed overflow-x-auto">
{`from agentshield import AgentShield
from langgraph.prebuilt import create_react_agent

shield = AgentShield(api_key="shield_key_prod")

# Wrap entire LangGraph agent with taint tracking and boundary guard
protected_agent = shield.wrap(agent)
result = protected_agent.invoke({"messages": [("user", "Analyze customer logs")]})`}
                </pre>
              </div>

              <div className="space-y-4">
                <h3 className="font-chakra font-bold text-sm uppercase text-fg">
                  TypeScript / Node.js
                </h3>
                <pre className="p-4 bg-bg border border-line rounded-sm font-mono text-xs text-fg leading-relaxed overflow-x-auto">
{`import { AgentShield } from "@agentshield/sdk";

const shield = new AgentShield({
  apiKey: process.env.SHIELD_API_KEY,
  failMode: "closed",
});

const sendPayment = shield.wrapTool({
  name: "transfer_funds",
  sensitivity: "critical",
  execute: async (args) => bankApi.transfer(args.to, args.amount),
});`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === "rego" && (
            <div className="space-y-6">
              <div className="space-y-2 border-b border-line pb-4">
                <span className="text-[10px] font-chakra uppercase text-ok font-bold">
                  Policy Engine
                </span>
                <h2 className="font-chakra text-2xl font-bold uppercase text-fg">
                  OPA Rego Guardrails & Contracts
                </h2>
                <p className="text-xs text-mut leading-relaxed">
                  Enforce deterministic authorization rules on tool names, arguments, and risk scores.
                </p>
              </div>

              <pre className="p-4 bg-bg border border-line rounded-sm font-mono text-xs text-fg leading-relaxed overflow-x-auto">
{`package agentshield.authz

default allow = false

# Allow low-risk tools without taint
allow {
    input.tool.sensitivity == "low"
    input.risk < 0.35
}

# Require escalation for financial tools with untrusted taint
escalate {
    input.tool.name == "transfer_funds"
    count(input.taint) > 0
}

# Block all shell execution outright
deny {
    input.tool.name == "execute_shell_command"
}`}
              </pre>
            </div>
          )}

          {activeTab === "mcp" && (
            <div className="space-y-6">
              <div className="space-y-2 border-b border-line pb-4">
                <span className="text-[10px] font-chakra uppercase text-ok font-bold">
                  Model Context Protocol
                </span>
                <h2 className="font-chakra text-2xl font-bold uppercase text-fg">
                  AgentShield MCP Proxy
                </h2>
                <p className="text-xs text-mut leading-relaxed">
                  Inspect tools/call, resources/read, and prompts/get between your agent and any MCP server.
                </p>
              </div>

              <p className="text-xs text-mut leading-relaxed">
                The AgentShield MCP Proxy pins tool definitions to prevent rug-pull attacks where a
                remote MCP server mutates descriptions to inject adversarial instructions.
              </p>

              <pre className="p-3 bg-bg border border-line rounded-sm font-mono text-xs text-ok">
                agentshield-mcp-proxy --upstream-server stdio://weather-server
              </pre>
            </div>
          )}

          {activeTab === "models" && (
            <div className="space-y-6">
              <div className="space-y-2 border-b border-line pb-4">
                <span className="text-[10px] font-chakra uppercase text-ok font-bold">
                  Machine Learning
                </span>
                <h2 className="font-chakra text-2xl font-bold uppercase text-fg">
                  Model Zoo & Platt Risk Stacker
                </h2>
                <p className="text-xs text-mut leading-relaxed">
                  5 versioned models running on CPU/ONNX with strict monotonic constraints.
                </p>
              </div>

              <div className="space-y-3 text-xs leading-relaxed">
                <div className="p-3 bg-bg border border-line rounded-sm">
                  <div className="font-chakra font-bold text-sm text-ok uppercase">
                    Model 1: DeBERTa Injection Classifier (ONNX int8)
                  </div>
                  <p className="text-mut text-xs mt-1">
                    microsoft/deberta-v3-base trained with class-weighted cross entropy on 2,000+ adversarial samples.
                  </p>
                </div>

                <div className="p-3 bg-bg border border-line rounded-sm">
                  <div className="font-chakra font-bold text-sm text-ok uppercase">
                    Model 5: LightGBM Platt Stacker
                  </div>
                  <p className="text-mut text-xs mt-1">
                    Monotonic gradient-boosted decision tree calibrated with Platt sigmoid scaling into true probabilities.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
