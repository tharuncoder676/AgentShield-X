import React, { useState, useRef, useEffect } from "react";
import {
  Shield,
  Bot,
  Send,
  X,
  FileCode,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Settings,
  Brain,
  Key,
  Cpu,
  RefreshCw,
} from "lucide-react";
import { cn } from "../../utils/cn";

export interface ShieldwingProposal {
  id: string;
  type: string;
  title: string;
  description: string;
  rego_code?: string;
  status: string;
}

export interface ShieldwingChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  evidence_citations?: string[];
  proposals?: ShieldwingProposal[];
  dogfood_verdict?: string;
  shield_protected?: boolean;
  reasoning?: string;
}

export interface ShieldwingDrawerConfig {
  provider: string;
  active_provider_name?: string;
  model: string;
  has_api_key: boolean;
  available_models: string[];
}

export interface ShieldwingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ShieldwingChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onApplyProposal?: (proposal: ShieldwingProposal) => void;
  isLoading?: boolean;
  activeContext?: {
    view: string;
    entityId?: string;
    title?: string;
  };
  config?: ShieldwingDrawerConfig;
  onUpdateConfig?: (data: { api_key?: string; model?: string; provider?: string }) => Promise<void>;
  onTestConnection?: (data: { api_key?: string; model?: string }) => Promise<{ status: string; sample_response?: string }>;
  className?: string;
}

export const ShieldwingDrawer: React.FC<ShieldwingDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  onApplyProposal,
  isLoading = false,
  activeContext,
  config,
  onUpdateConfig,
  onTestConnection,
  className,
}) => {
  const [inputText, setInputText] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(
    config?.model || "meta/llama-3.3-70b-instruct"
  );
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (config?.model) {
      setSelectedModel(config.model);
    }
  }, [config?.model]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const msg = inputText;
    setInputText("");
    await onSendMessage(msg);
  };

  const handleQuickPrompt = async (prompt: string) => {
    if (isLoading) return;
    await onSendMessage(prompt);
  };

  const handleTestConnection = async () => {
    if (!onTestConnection) return;
    setIsTesting(true);
    setTestStatus(null);
    try {
      const res = await onTestConnection({
        api_key: apiKeyInput.trim() || undefined,
        model: selectedModel,
      });
      setTestStatus(`Connected! Model verified: ${res.sample_response || "READY"}`);
    } catch (err: any) {
      setTestStatus(`Error: ${err.message || "Failed to connect to NVIDIA NIM"}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!onUpdateConfig) return;
    setIsSaving(true);
    try {
      await onUpdateConfig({
        api_key: apiKeyInput.trim() || undefined,
        model: selectedModel,
        provider: "nvidia",
      });
      setIsSettingsOpen(false);
      setTestStatus(null);
    } catch (err: any) {
      setTestStatus(`Save Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleReasoning = (id: string) => {
    setExpandedReasoning((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper to extract <thinking>...</thinking>
  const parseContent = (content: string) => {
    let reasoning: string | null = null;
    let mainContent = content;

    if (content.includes("<thinking>") && content.includes("</thinking>")) {
      const parts = content.split("</thinking>");
      reasoning = parts[0].replace("<thinking>", "").trim();
      mainContent = parts[1].trim();
    }

    return { reasoning, mainContent };
  };

  const isNvidiaActive = config?.provider === "nvidia" && config?.has_api_key;

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] md:w-[560px] bg-panel border-l border-line shadow-2xl flex flex-col font-sans transition-transform duration-200",
        className
      )}
    >
      {/* Header */}
      <div className="h-14 border-b border-line px-4 flex items-center justify-between bg-bg/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-ok/10 border border-ok/40 flex items-center justify-center text-ok rounded-sm">
            <Bot size={16} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-chakra font-bold text-sm tracking-wider uppercase text-fg leading-none">
                Shieldwing
              </span>
              <span className="text-[10px] font-chakra px-1.5 py-0.5 rounded-sm bg-ok/15 text-ok border border-ok/30 flex items-center gap-1 font-semibold">
                <Shield size={10} /> Copilot
              </span>
              {isNvidiaActive ? (
                <span className="text-[9px] font-chakra px-1.5 py-0.5 rounded-sm bg-[#76b900]/15 text-[#76b900] border border-[#76b900]/30 flex items-center gap-1 font-semibold">
                  <Cpu size={9} /> NVIDIA NIM
                </span>
              ) : (
                <span className="text-[9px] font-chakra px-1.5 py-0.5 rounded-sm bg-line/50 text-mut border border-line flex items-center gap-1">
                  Deterministic
                </span>
              )}
            </div>
            <span className="text-[10px] text-mut font-chakra leading-tight mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse" />
              Protected by AgentShield-X
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onUpdateConfig && (
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={cn(
                "p-1.5 border rounded-sm transition-colors text-xs flex items-center gap-1",
                isSettingsOpen
                  ? "bg-ok/20 border-ok text-ok"
                  : "border-line text-mut hover:text-fg hover:bg-line/20"
              )}
              title="Provider & Model Settings"
            >
              <Settings size={15} />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 text-mut hover:text-fg border border-line rounded-sm hover:bg-line/20 transition-colors"
            aria-label="Close Shieldwing"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* NVIDIA Provider Settings Tray */}
      {isSettingsOpen && (
        <div className="bg-bg/95 border-b border-line p-4 space-y-3 font-chakra animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-fg uppercase tracking-wider flex items-center gap-1.5">
              <Cpu size={14} className="text-[#76b900]" /> NVIDIA NIM Inference Configuration
            </span>
            <span className="text-[10px] text-mut font-mono">Free Tier Cloud API</span>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[11px] text-mut flex items-center gap-1 mb-1">
                <Key size={11} /> NVIDIA API Key
              </label>
              <input
                type="password"
                placeholder={config?.has_api_key ? "•••••••••••••••••••••••• (Configured)" : "Enter nvapi-..."}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full bg-panel border border-line px-2.5 py-1.5 text-xs text-fg rounded-sm font-mono focus:outline-none focus:border-ok"
              />
            </div>

            <div>
              <label className="text-[11px] text-mut flex items-center gap-1 mb-1">
                <Brain size={11} /> Target Reasoning Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-panel border border-line px-2.5 py-1.5 text-xs text-fg rounded-sm font-mono focus:outline-none focus:border-ok"
              >
                {(config?.available_models || [
                  "meta/llama-3.3-70b-instruct",
                  "deepseek-ai/deepseek-v4.1-flash",
                  "google/gemma-3-12b-it",
                  "mistralai/mixtral-8x7b-instruct-v0.1",
                ]).map((m) => (
                  <option key={m} value={m}>
                    {m} {m.includes("llama-3.3") ? "(Llama 3.3 70B)" : m.includes("deepseek") ? "(DeepSeek Flash)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {testStatus && (
            <div
              className={cn(
                "p-2 rounded-sm text-[11px] font-mono leading-relaxed",
                testStatus.startsWith("Connected")
                  ? "bg-ok/10 border border-ok/30 text-ok"
                  : "bg-bad/10 border border-bad/30 text-bad"
              )}
            >
              {testStatus}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            {onTestConnection && (
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-2.5 py-1 bg-line/30 hover:bg-line/50 text-fg text-xs rounded-sm transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                {isTesting ? <RefreshCw size={12} className="animate-spin" /> : null}
                <span>Test Connection</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="px-3 py-1 bg-ok text-bg font-bold text-xs uppercase rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      )}

      {/* Unconfigured Provider Notice Banner */}
      {!isNvidiaActive && !isSettingsOpen && onUpdateConfig && (
        <div className="bg-[#76b900]/10 border-b border-[#76b900]/30 px-3.5 py-2 flex items-center justify-between text-xs font-chakra">
          <span className="text-fg flex items-center gap-1.5 text-[11px]">
            <Cpu size={13} className="text-[#76b900]" />
            <span>Enable <strong>NVIDIA NIM</strong> free cloud reasoning</span>
          </span>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="text-[10px] text-[#76b900] underline font-bold hover:text-[#76b900]/80 uppercase"
          >
            Configure Key
          </button>
        </div>
      )}

      {/* Active Context Banner */}
      {activeContext && (
        <div className="bg-bg/60 border-b border-line px-4 py-1.5 flex items-center justify-between text-xs font-chakra">
          <span className="text-mut text-[11px] uppercase tracking-wider">
            Context: <strong className="text-fg">{activeContext.view}</strong>{" "}
            {activeContext.entityId && (
              <span className="font-mono text-ok">({activeContext.entityId})</span>
            )}
          </span>
          <span className="text-[10px] text-ok/80 font-mono">L0 Trust Enveloped</span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-10 h-10 mx-auto rounded-full bg-ok/10 border border-ok/30 flex items-center justify-center text-ok">
              <Sparkles size={20} />
            </div>
            <div className="space-y-1">
              <div className="font-chakra font-bold text-sm text-fg uppercase">
                Shieldwing SOC Copilot
              </div>
              <p className="text-xs text-mut max-w-sm mx-auto leading-relaxed">
                Autonomous AI security intelligence powered by NVIDIA NIM & AgentShield-X.
                Cites real detector evidence, triages adversarial threats, and synthesizes OPA Rego policies.
              </p>
            </div>

            {/* Quick action chips */}
            <div className="pt-2 flex flex-col gap-2 max-w-xs mx-auto text-left">
              <button
                onClick={() =>
                  handleQuickPrompt("Explain why the latest high-risk decision was blocked.")
                }
                className="px-3 py-2 bg-bg border border-line hover:border-ok/50 text-xs text-fg rounded-sm transition-colors text-left flex items-center justify-between"
              >
                <span>Explain latest blocked decision</span>
                <ChevronRight size={12} className="text-mut" />
              </button>
              <button
                onClick={() =>
                  handleQuickPrompt("Triage the active incident and identify root cause.")
                }
                className="px-3 py-2 bg-bg border border-line hover:border-ok/50 text-xs text-fg rounded-sm transition-colors text-left flex items-center justify-between"
              >
                <span>Triage active incident</span>
                <ChevronRight size={12} className="text-mut" />
              </button>
              <button
                onClick={() =>
                  handleQuickPrompt("Draft an OPA Rego policy to restrict export_all_customers.")
                }
                className="px-3 py-2 bg-bg border border-line hover:border-ok/50 text-xs text-fg rounded-sm transition-colors text-left flex items-center justify-between"
              >
                <span>Draft policy for export sinks</span>
                <ChevronRight size={12} className="text-mut" />
              </button>
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const { reasoning, mainContent } = parseContent(m.content);
            const isReasoningExpanded = expandedReasoning[m.id] ?? false;

            return (
              <div
                key={m.id}
                className={cn(
                  "flex flex-col space-y-2 text-xs",
                  m.role === "user" ? "items-end" : "items-start"
                )}
              >
                {/* Role Header */}
                <div className="flex items-center gap-1.5 text-[10px] text-mut font-chakra">
                  {m.role === "assistant" ? (
                    <>
                      <span className="font-bold text-ok uppercase">Shieldwing</span>
                      <span>&bull;</span>
                      <span className="text-[9px] text-mut">Dogfood Inspected</span>
                    </>
                  ) : (
                    <span className="font-bold text-fg uppercase">Security Operator</span>
                  )}
                  <span>&bull;</span>
                  <span className="font-mono">{m.timestamp}</span>
                </div>

                {/* Message Bubble */}
                <div
                  className={cn(
                    "p-3 rounded-sm leading-relaxed max-w-[94%] space-y-2",
                    m.role === "user"
                      ? "bg-ok/15 text-fg border border-ok/30 font-sans"
                      : "bg-bg text-fg border border-line font-sans"
                  )}
                >
                  {/* Reasoning Trace Block (Nemotron thinking) */}
                  {(reasoning || m.reasoning) && (
                    <div className="border border-line/80 bg-panel/70 rounded-sm overflow-hidden text-[11px] font-mono">
                      <button
                        onClick={() => toggleReasoning(m.id)}
                        className="w-full px-2.5 py-1.5 bg-line/20 hover:bg-line/30 flex items-center justify-between text-mut text-[10px] font-chakra tracking-wide uppercase transition-colors"
                      >
                        <span className="flex items-center gap-1.5 text-fg font-semibold">
                          <Brain size={12} className="text-[#76b900]" />
                          <span>Chain-of-Thought Reasoning Trace</span>
                        </span>
                        {isReasoningExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                      {isReasoningExpanded && (
                        <div className="p-2.5 text-mut whitespace-pre-wrap leading-relaxed border-t border-line/60 bg-bg/50">
                          {reasoning || m.reasoning}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="whitespace-pre-wrap">{mainContent}</div>

                  {/* Evidence Citations */}
                  {m.evidence_citations && m.evidence_citations.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-line/60 flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-chakra uppercase text-mut self-center mr-1">
                        Citations:
                      </span>
                      {m.evidence_citations.map((cite, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-mono px-1.5 py-0.5 bg-panel border border-line rounded-sm text-ok"
                        >
                          {cite}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Proposal Diffs */}
                  {m.proposals && m.proposals.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-line space-y-2">
                      {m.proposals.map((prop) => (
                        <div
                          key={prop.id}
                          className="p-2.5 bg-panel border border-warn/40 rounded-sm space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-chakra font-bold text-xs uppercase text-warn flex items-center gap-1">
                              <FileCode size={12} /> {prop.title}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 bg-warn/15 text-warn rounded-sm border border-warn/30">
                              PROPOSAL
                            </span>
                          </div>
                          <p className="text-[11px] text-mut">{prop.description}</p>
                          {prop.rego_code && (
                            <pre className="p-2 bg-bg border border-line rounded-sm font-mono text-[10px] text-fg overflow-x-auto">
                              {prop.rego_code}
                            </pre>
                          )}
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() => onApplyProposal && onApplyProposal(prop)}
                              className="px-2.5 py-1 bg-ok text-bg font-chakra font-bold text-[10px] uppercase rounded-sm hover:opacity-90 flex items-center gap-1"
                            >
                              <CheckCircle2 size={11} /> Apply Policy
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-bg border border-line rounded-sm text-xs text-mut font-chakra">
            <span className="w-2 h-2 rounded-full bg-ok animate-ping" />
            <span>Shieldwing analyzing evidence & validating safety boundaries...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-line bg-bg">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask Shieldwing about decisions, incidents, or policy drafts..."
            className="flex-1 bg-panel border border-line rounded-sm px-3 py-2 text-xs text-fg focus:outline-none focus:border-ok font-sans"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="px-3.5 py-2 bg-ok text-bg font-chakra font-bold text-xs uppercase rounded-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-1 transition-opacity"
          >
            <Send size={12} />
          </button>
        </div>
      </form>
    </div>
  );
};
