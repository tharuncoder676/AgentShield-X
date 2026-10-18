import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Zap,
  Lock,
  Cpu,
  ArrowRight,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Bot,
  Layers,
  FileCode,
  Eye,
  GitBranch,
} from "lucide-react";
import { RECORDED_SCENARIOS } from "../data/recordedScenarios";

export const Home: React.FC = () => {
  const [shieldActive, setShieldActive] = useState(true);
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

  const scenario = RECORDED_SCENARIOS[activeScenarioIdx];

  const handleCopyCode = () => {
    navigator.clipboard.writeText("pip install agentshield-sdk\n# or\nnpm install @agentshield/sdk");
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-24 py-12 md:py-20">
      {/* 1. Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-panel border border-ok/40 rounded-sm text-xs font-chakra uppercase tracking-wider text-ok">
          <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse" />
          <span>Real-Time Ingress Gateway &bull; Models Advise, Code Decides</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-chakra font-bold tracking-tight text-fg uppercase max-w-4xl mx-auto leading-none">
          Autonomous Security for{" "}
          <span className="text-ok underline decoration-ok/30 underline-offset-8">
            LLM Agents
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-mut leading-relaxed font-sans">
          AgentShield-X intercepts tool calls before execution. It halts prompt injections,
          quarantines data exfiltration channels, tripwires decoy honeytools, and enforces OPA Rego
          least-privilege contracts in under 15ms.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            to="/demo"
            className="px-6 py-3 bg-ok text-bg font-chakra font-bold text-sm uppercase tracking-wider rounded-sm hover:opacity-90 flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
          >
            <Play size={15} /> Try Interactive Demo
          </Link>
          <Link
            to="/architecture"
            className="px-6 py-3 bg-panel border border-line hover:border-ok/50 text-fg font-chakra font-bold text-sm uppercase tracking-wider rounded-sm transition-colors flex items-center gap-2"
          >
            <Layers size={15} className="text-ok" /> Explore Architecture
          </Link>
          <a
            href="http://localhost:5173"
            className="px-6 py-3 bg-panel border border-line hover:border-line/80 text-mut hover:text-fg font-chakra font-bold text-sm uppercase tracking-wider rounded-sm transition-colors flex items-center gap-2"
          >
            <span>Launch Console</span>
            <ArrowRight size={15} />
          </a>
        </div>

        {/* Honest Metrics Bar */}
        <div className="pt-8 border-t border-line/60 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-left">
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-chakra font-bold text-ok">98.5%</span>
            <div className="text-[11px] font-chakra text-mut uppercase">
              Semantic Attack Recall
            </div>
            <div className="text-[10px] text-mut/80 font-mono">FPR &le; 2.0% on held-out suite</div>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-chakra font-bold text-fg">1.4 ms</span>
            <div className="text-[11px] font-chakra text-mut uppercase">Risk Stacker Latency</div>
            <div className="text-[10px] text-mut/80 font-mono">Monotonic GBDT + Sigmoid</div>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-chakra font-bold text-ok">100%</span>
            <div className="text-[11px] font-chakra text-mut uppercase">Honeytool Detection</div>
            <div className="text-[10px] text-mut/80 font-mono">0 false positives on benign suites</div>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-chakra font-bold text-fg">SHA-256</span>
            <div className="text-[11px] font-chakra text-mut uppercase">Merkle Audit Chain</div>
            <div className="text-[10px] text-mut/80 font-mono">Tamper-evident verification</div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Shield Boundary Demo Box */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-chakra text-2xl font-bold uppercase tracking-wide text-fg">
            The Shield Boundary in Action
          </h2>
          <p className="text-xs text-mut max-w-lg mx-auto">
            Toggle enforcement to inspect how an untrusted indirect prompt injection executes when
            unprotected vs quarantined at the shield boundary.
          </p>
        </div>

        <div className="bg-panel border border-line rounded-sm overflow-hidden shadow-2xl">
          {/* Top Bar with Controls */}
          <div className="h-14 border-b border-line px-4 sm:px-6 flex items-center justify-between bg-bg/60">
            <div className="flex items-center gap-2 overflow-x-auto py-2">
              {RECORDED_SCENARIOS.slice(0, 4).map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setActiveScenarioIdx(idx)}
                  className={`px-3 py-1.5 text-xs font-chakra uppercase font-semibold rounded-sm whitespace-nowrap transition-colors ${
                    activeScenarioIdx === idx
                      ? "bg-ok text-bg font-bold"
                      : "bg-panel border border-line text-mut hover:text-fg"
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>

            {/* Shield Toggle Switch */}
            <div className="flex items-center gap-3 pl-4 border-l border-line">
              <span className="text-xs font-chakra uppercase font-bold text-fg hidden sm:inline">
                AgentShield-X:
              </span>
              <button
                onClick={() => setShieldActive(!shieldActive)}
                className={`px-3 py-1 text-xs font-chakra font-bold uppercase rounded-sm flex items-center gap-1.5 transition-colors ${
                  shieldActive
                    ? "bg-ok/20 border border-ok text-ok"
                    : "bg-bad/20 border border-bad text-bad animate-pulse"
                }`}
              >
                <Shield size={12} />
                <span>{shieldActive ? "SHIELD ON" : "SHIELD OFF"}</span>
              </button>
            </div>
          </div>

          {/* Scenario Details & Outcome */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Inbound Tool Call */}
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-chakra uppercase text-mut font-semibold">
                  Target Agent & Vector
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 bg-bg border border-line rounded-sm text-fg">
                    {scenario.agentId}
                  </span>
                  <span className="text-[11px] font-chakra text-warn uppercase">
                    &bull; {scenario.attackVector}
                  </span>
                </div>
              </div>

              {scenario.untrustedContext && (
                <div className="space-y-1">
                  <span className="text-[10px] font-chakra uppercase text-mut font-semibold">
                    Inbound Untrusted Context
                  </span>
                  <div className="p-3 bg-bg border border-line rounded-sm font-mono text-xs text-bad/90 leading-relaxed">
                    {scenario.untrustedContext}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[10px] font-chakra uppercase text-mut font-semibold">
                  Proposed Tool & Arguments
                </span>
                <div className="p-3 bg-bg border border-line rounded-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-ok font-bold">{scenario.toolName}()</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-bad/20 text-bad rounded-sm uppercase">
                      {scenario.sensitivity}
                    </span>
                  </div>
                  <pre className="font-mono text-[11px] text-fg overflow-x-auto">
                    {JSON.stringify(scenario.arguments, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Right: Enforcement Outcome */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-[10px] font-chakra uppercase text-mut font-semibold">
                  Enforcement Verdict & Trace
                </span>

                {shieldActive ? (
                  <div className="p-4 bg-bg border border-ok/40 rounded-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-chakra font-bold text-ok uppercase flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> Quarantined at Boundary
                      </span>
                      <span className="font-mono text-xs px-2 py-0.5 bg-ok/20 text-ok border border-ok/40 rounded-sm font-bold uppercase">
                        {scenario.withShield.action}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="text-mut text-[11px]">
                        Detector:{" "}
                        <strong className="text-fg font-mono">
                          {scenario.withShield.detector}
                        </strong>
                      </div>
                      <div className="text-mut text-[11px]">
                        Reason: <span className="text-fg">{scenario.withShield.reason}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-line flex items-center justify-between text-[11px] font-mono text-mut">
                      <span>Calibrated Risk: {(scenario.withShield.risk * 100).toFixed(0)}%</span>
                      <span className="text-ok">Latency: {scenario.withShield.latencyMs}ms</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-bad/10 border border-bad/50 rounded-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-chakra font-bold text-bad uppercase flex items-center gap-1.5">
                        <AlertTriangle size={14} /> Security Breach Occurred
                      </span>
                      <span className="font-mono text-xs px-2 py-0.5 bg-bad text-bg font-bold rounded-sm uppercase">
                        EXPLOITED
                      </span>
                    </div>

                    <p className="text-xs text-fg leading-relaxed">
                      {scenario.withoutShield.result}
                    </p>

                    <div className="pt-2 border-t border-bad/30 text-[11px] font-chakra font-bold text-bad">
                      Impact: {scenario.withoutShield.impact}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-line flex items-center justify-between">
                <span className="text-[11px] text-mut font-chakra">
                  Evidence logged to SHA-256 Merkle chain
                </span>
                <Link
                  to="/demo"
                  className="text-xs font-chakra font-bold uppercase text-ok hover:underline flex items-center gap-1"
                >
                  <span>Explore all 10 scenarios</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Differentiators Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="font-chakra text-2xl sm:text-3xl font-bold uppercase tracking-wide text-fg">
            Built for High-Stakes Agentic Systems
          </h2>
          <p className="text-xs sm:text-sm text-mut max-w-xl mx-auto">
            Traditional web firewalls inspect strings. AgentShield-X tracks execution intent,
            taint provenance, and behavioral sequences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-panel border border-line rounded-sm space-y-3 hover:border-ok/40 transition-colors">
            <div className="w-8 h-8 rounded-sm bg-ok/10 border border-ok/30 flex items-center justify-center text-ok">
              <Lock size={16} />
            </div>
            <h3 className="font-chakra font-bold text-base text-fg uppercase">Task Contracts</h3>
            <p className="text-xs text-mut leading-relaxed">
              Extract user intent into immutable contracts at step 0. If an indirect injection tries
              to reroute the agent to sensitive sinks, OPA Rego denies it deterministically.
            </p>
          </div>

          <div className="p-6 bg-panel border border-line rounded-sm space-y-3 hover:border-ok/40 transition-colors">
            <div className="w-8 h-8 rounded-sm bg-ok/10 border border-ok/30 flex items-center justify-center text-ok">
              <GitBranch size={16} />
            </div>
            <h3 className="font-chakra font-bold text-base text-fg uppercase">Taint Propagation</h3>
            <p className="text-xs text-mut leading-relaxed">
              Every token from a webhook, email, or webpage carries an untrusted taint label. Tainted
              segments can never reach critical sinks without human escalation.
            </p>
          </div>

          <div className="p-6 bg-panel border border-line rounded-sm space-y-3 hover:border-ok/40 transition-colors">
            <div className="w-8 h-8 rounded-sm bg-ok/10 border border-ok/30 flex items-center justify-center text-ok">
              <Eye size={16} />
            </div>
            <h3 className="font-chakra font-bold text-base text-fg uppercase">Decoy Honeytools</h3>
            <p className="text-xs text-mut leading-relaxed">
              Inject synthetic high-value tools (e.g. export_all_customers) into the schema. Any
              adversarial agent attempting to touch them is immediately halted and quarantined.
            </p>
          </div>

          <div className="p-6 bg-panel border border-line rounded-sm space-y-3 hover:border-ok/40 transition-colors">
            <div className="w-8 h-8 rounded-sm bg-ok/10 border border-ok/30 flex items-center justify-center text-ok">
              <Cpu size={16} />
            </div>
            <h3 className="font-chakra font-bold text-base text-fg uppercase">Calibrated ML Fusion</h3>
            <p className="text-xs text-mut leading-relaxed">
              5 versioned neural and classical models combined via monotonic LightGBM and Platt
              isotonic scaling into true probabilities, avoiding false positive alert fatigue.
            </p>
          </div>

          <div className="p-6 bg-panel border border-line rounded-sm space-y-3 hover:border-ok/40 transition-colors">
            <div className="w-8 h-8 rounded-sm bg-ok/10 border border-ok/30 flex items-center justify-center text-ok">
              <Bot size={16} />
            </div>
            <h3 className="font-chakra font-bold text-base text-fg uppercase">Shieldwing Copilot</h3>
            <p className="text-xs text-mut leading-relaxed">
              Built-in AI security copilot that explains decisions citing exact evidence fields,
              triages incidents, and proposes Rego policies while protected by the shield.
            </p>
          </div>

          <div className="p-6 bg-panel border border-line rounded-sm space-y-3 hover:border-ok/40 transition-colors">
            <div className="w-8 h-8 rounded-sm bg-ok/10 border border-ok/30 flex items-center justify-center text-ok">
              <Layers size={16} />
            </div>
            <h3 className="font-chakra font-bold text-base text-fg uppercase">Cryptographic Audit</h3>
            <p className="text-xs text-mut leading-relaxed">
              Canonical SHA-256 Merkle chain linking every event back to Genesis. Tamper detection
              algorithm verifies full sequence integrity mathematically.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Quickstart 3-Command Integration Box */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="p-6 bg-panel border border-line rounded-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={18} className="text-ok" />
              <span className="font-chakra font-bold text-sm uppercase text-fg">
                3-Line Integration Quickstart
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-2.5 py-1 bg-bg border border-line hover:border-ok/50 text-xs font-chakra uppercase text-mut hover:text-fg rounded-sm transition-colors"
            >
              {copiedCode ? "Copied!" : "Copy"}
            </button>
          </div>

          <pre className="p-4 bg-bg border border-line rounded-sm font-mono text-xs text-fg leading-relaxed overflow-x-auto">
{`from agentshield import AgentShield

shield = AgentShield(api_key="your_api_key", fail_mode="closed")

@shield.tool(name="send_email", sensitivity="high")
def send_email(recipient: str, body: str):
    # Intercepted automatically in < 15ms
    return smtp_client.send(recipient, body)`}
          </pre>

          <div className="flex items-center justify-between text-[11px] font-chakra text-mut">
            <span>Also supports TypeScript, LangGraph, LangChain, and MCP Proxy</span>
            <Link to="/docs" className="text-ok hover:underline uppercase font-bold">
              Read SDK Reference &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
