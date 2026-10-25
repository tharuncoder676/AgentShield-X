import React, { useState, useEffect } from "react";
import {
  X,
  Settings,
  Sparkles,
  Volume2,
  Mic,
  Shield,
  Bot,
  Sliders,
  Check,
  RotateCcw,
  Play,
  VolumeX,
  Cpu,
  Layers,
  Activity,
} from "lucide-react";
import {
  WingmanConfig,
  DEFAULT_WINGMAN_CONFIG,
  PURPOSE_PRESETS,
  saveWingmanConfig,
  getDynamicGreeting,
} from "../types/wingman";

interface WingmanConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WingmanConfig;
  onUpdate: (newConfig: WingmanConfig) => void;
}

export const WingmanConfigModal: React.FC<WingmanConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<
    "greetings" | "purpose" | "voice" | "agents"
  >("greetings");

  const [form, setForm] = useState<WingmanConfig>(config);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>(
    []
  );
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Sync with prop when opened
  useEffect(() => {
    if (isOpen) {
      setForm(config);
      setSaveToast(false);
    }
  }, [isOpen, config]);

  // Load available speech synthesis voices
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const updateVoices = () => {
      const v = window.speechSynthesis.getVoices();
      setAvailableVoices(v);
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, []);

  if (!isOpen) return null;

  // Speak test helper
  const handleTestVoice = (textToSpeak: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = form.speechRate;
    utterance.pitch = form.speechPitch;

    if (form.voiceName) {
      const match = availableVoices.find((v) => v.name === form.voiceName);
      if (match) utterance.voice = match;
    }

    utterance.onstart = () => setIsPlayingPreview(true);
    utterance.onend = () => setIsPlayingPreview(false);
    utterance.onerror = () => setIsPlayingPreview(false);

    window.speechSynthesis.speak(utterance);
  };

  const handlePurposePresetChange = (presetKey: WingmanConfig["purposeMode"]) => {
    const preset = PURPOSE_PRESETS[presetKey];
    setForm((prev) => ({
      ...prev,
      purposeMode: presetKey,
      systemPersonaPrompt: preset ? preset.prompt : prev.systemPersonaPrompt,
    }));
  };

  const handleSave = () => {
    // If greeting mode is auto, re-compute headline
    let updated = { ...form };
    if (updated.greetingMode === "auto") {
      updated.greetingHeadline = getDynamicGreeting(updated.operatorName);
    }

    saveWingmanConfig(updated);
    onUpdate(updated);
    setSaveToast(true);

    if (updated.soundEffects) {
      handleTestVoice(
        `Configuration applied, ${updated.operatorName}. Systems updated to ${
          PURPOSE_PRESETS[updated.purposeMode]?.title || "custom directive"
        }.`
      );
    }

    setTimeout(() => {
      setSaveToast(false);
      onClose();
    }, 1200);
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset all Wingman settings to factory defaults?")) {
      setForm(DEFAULT_WINGMAN_CONFIG);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0c1524] border border-ok/50 w-full max-w-3xl rounded-sm shadow-[0_0_40px_rgba(0,229,255,0.2)] flex flex-col max-h-[90vh] overflow-hidden text-fg font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-panel/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-ok/10 border border-ok/60 flex items-center justify-center text-ok shadow-glow">
              <Settings size={18} />
            </div>
            <div>
              <h2 className="text-base font-chakra font-bold tracking-wider text-white uppercase flex items-center gap-2">
                <span>Wingman AI Configuration Studio</span>
                <span className="text-[10px] text-ok bg-ok/10 px-2 py-0.5 rounded-xs border border-ok/30 font-mono">
                  v0.3.0
                </span>
              </h2>
              <p className="text-xs text-mut">
                Configure greetings, system purpose, voice wake-words, and autonomous defense behavior.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-mut hover:text-white hover:bg-line/40 rounded-xs transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-line bg-bg/40 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab("greetings")}
            className={`px-4 py-2 text-xs font-chakra font-bold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "greetings"
                ? "border-ok text-ok bg-ok/5"
                : "border-transparent text-mut hover:text-fg"
            }`}
          >
            <Sparkles size={14} />
            <span>1. Greetings & Identity</span>
          </button>

          <button
            onClick={() => setActiveTab("purpose")}
            className={`px-4 py-2 text-xs font-chakra font-bold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "purpose"
                ? "border-ok text-ok bg-ok/5"
                : "border-transparent text-mut hover:text-fg"
            }`}
          >
            <Bot size={14} />
            <span>2. Purpose & Persona</span>
          </button>

          <button
            onClick={() => setActiveTab("voice")}
            className={`px-4 py-2 text-xs font-chakra font-bold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "voice"
                ? "border-ok text-ok bg-ok/5"
                : "border-transparent text-mut hover:text-fg"
            }`}
          >
            <Mic size={14} />
            <span>3. Voice & Wake Words</span>
          </button>

          <button
            onClick={() => setActiveTab("agents")}
            className={`px-4 py-2 text-xs font-chakra font-bold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "agents"
                ? "border-ok text-ok bg-ok/5"
                : "border-transparent text-mut hover:text-fg"
            }`}
          >
            <Shield size={14} />
            <span>4. Defense Mesh & Agents</span>
          </button>
        </div>

        {/* Modal Body / Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: GREETINGS & IDENTITY */}
          {activeTab === "greetings" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-chakra font-bold uppercase tracking-wider text-ok mb-1">
                    Operator Call-Sign / Name
                  </label>
                  <input
                    type="text"
                    value={form.operatorName}
                    onChange={(e) =>
                      setForm({ ...form, operatorName: e.target.value })
                    }
                    className="w-full bg-bg border border-line focus:border-ok px-3 py-2 text-xs font-mono rounded-xs outline-none text-white"
                    placeholder="e.g. Tharun"
                  />
                  <span className="text-[10px] text-mut mt-1 block">
                    Used across voice greetings, header profile pill, and audit trails.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-chakra font-bold uppercase tracking-wider text-ok mb-1">
                    Operator Role / Title
                  </label>
                  <input
                    type="text"
                    value={form.operatorRole}
                    onChange={(e) =>
                      setForm({ ...form, operatorRole: e.target.value })
                    }
                    className="w-full bg-bg border border-line focus:border-ok px-3 py-2 text-xs font-mono rounded-xs outline-none text-white"
                    placeholder="e.g. Operator, Lead Architect"
                  />
                  <span className="text-[10px] text-mut mt-1 block">
                    Displays under your avatar in the command deck.
                  </span>
                </div>
              </div>

              {/* Greeting Mode Toggle */}
              <div className="p-4 bg-bg/50 border border-line rounded-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-chakra font-bold text-white uppercase">
                      Greeting Mode
                    </div>
                    <div className="text-[11px] text-mut">
                      Choose whether Wingman adapts greeting to current time of day or uses a custom headline.
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-panel p-1 border border-line rounded-xs">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, greetingMode: "auto" })}
                      className={`px-3 py-1 text-xs font-chakra uppercase rounded-xs transition-colors ${
                        form.greetingMode === "auto"
                          ? "bg-ok text-black font-bold"
                          : "text-mut hover:text-white"
                      }`}
                    >
                      Auto (Time-Based)
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, greetingMode: "custom" })}
                      className={`px-3 py-1 text-xs font-chakra uppercase rounded-xs transition-colors ${
                        form.greetingMode === "custom"
                          ? "bg-ok text-black font-bold"
                          : "text-mut hover:text-white"
                      }`}
                    >
                      Custom Headline
                    </button>
                  </div>
                </div>

                {form.greetingMode === "custom" ? (
                  <div>
                    <label className="block text-[11px] font-chakra uppercase text-mut mb-1">
                      Custom Greeting Headline
                    </label>
                    <input
                      type="text"
                      value={form.greetingHeadline}
                      onChange={(e) =>
                        setForm({ ...form, greetingHeadline: e.target.value })
                      }
                      className="w-full bg-bg border border-line focus:border-ok px-3 py-2 text-xs font-mono rounded-xs outline-none text-white"
                      placeholder="e.g. Good evening, Tharun"
                    />
                  </div>
                ) : (
                  <div className="text-xs font-mono text-ok/90 bg-ok/5 p-2 rounded-xs border border-ok/20">
                    Current calculated greeting:{" "}
                    <strong>{getDynamicGreeting(form.operatorName)}</strong>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-chakra font-bold uppercase tracking-wider text-ok mb-1">
                  Greeting Subtitle
                </label>
                <input
                  type="text"
                  value={form.greetingSubtitle}
                  onChange={(e) =>
                    setForm({ ...form, greetingSubtitle: e.target.value })
                  }
                  className="w-full bg-bg border border-line focus:border-ok px-3 py-2 text-xs rounded-xs outline-none text-white"
                  placeholder="e.g. Your AI agents are protected and running smoothly."
                />
              </div>

              <div>
                <label className="block text-xs font-chakra font-bold uppercase tracking-wider text-ok mb-1">
                  Wingman Status Quote
                </label>
                <textarea
                  rows={2}
                  value={form.statusQuote}
                  onChange={(e) =>
                    setForm({ ...form, statusQuote: e.target.value })
                  }
                  className="w-full bg-bg border border-line focus:border-ok px-3 py-2 text-xs rounded-xs outline-none text-white font-sans resize-none"
                  placeholder='e.g. "All systems secure. I am monitoring 6 agents, scanning for threats, and ready to assist."'
                />
              </div>

              {/* Toggles & Test Speak */}
              <div className="flex items-center justify-between pt-2 border-t border-line flex-wrap gap-3">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={form.speakOnLoad}
                      onChange={(e) =>
                        setForm({ ...form, speakOnLoad: e.target.checked })
                      }
                      className="accent-[#00e5ff]"
                    />
                    <span className="text-white font-chakra">
                      Speak Greeting on Startup
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={form.soundEffects}
                      onChange={(e) =>
                        setForm({ ...form, soundEffects: e.target.checked })
                      }
                      className="accent-[#00e5ff]"
                    />
                    <span className="text-white font-chakra">
                      Sound Effects & Audio Feedback
                    </span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleTestVoice(
                      `${
                        form.greetingMode === "auto"
                          ? getDynamicGreeting(form.operatorName)
                          : form.greetingHeadline
                      }. ${form.greetingSubtitle} ${form.statusQuote}`
                    )
                  }
                  disabled={isPlayingPreview}
                  className="px-3.5 py-1.5 bg-ok/20 hover:bg-ok text-ok hover:text-black border border-ok rounded-xs text-xs font-chakra font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
                >
                  <Volume2 size={14} />
                  <span>{isPlayingPreview ? "Speaking..." : "Test Greeting Audio"}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PURPOSE & PERSONA */}
          {activeTab === "purpose" && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-chakra font-bold uppercase tracking-wider text-ok mb-2">
                  Operational Purpose & Mission Directive Presets
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(
                    Object.keys(PURPOSE_PRESETS) as WingmanConfig["purposeMode"][]
                  ).map((key) => {
                    const preset = PURPOSE_PRESETS[key];
                    const isSelected = form.purposeMode === key;
                    return (
                      <div
                        key={key}
                        onClick={() => handlePurposePresetChange(key)}
                        className={`p-3 border rounded-xs cursor-pointer transition-all ${
                          isSelected
                            ? "bg-ok/10 border-ok shadow-glow"
                            : "bg-bg/60 border-line hover:border-line/90 hover:bg-bg"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs font-chakra font-bold uppercase tracking-wide ${
                              isSelected ? "text-ok" : "text-white"
                            }`}
                          >
                            {preset.title}
                          </span>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-ok" />
                          )}
                        </div>
                        <p className="text-[11px] text-mut leading-relaxed">
                          {preset.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-chakra font-bold uppercase tracking-wider text-ok">
                    System Persona Instructions & Prompt
                  </label>
                  <span className="text-[10px] text-mut font-mono">
                    {form.systemPersonaPrompt.length} characters
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={form.systemPersonaPrompt}
                  onChange={(e) =>
                    setForm({ ...form, systemPersonaPrompt: e.target.value })
                  }
                  className="w-full bg-bg border border-line focus:border-ok p-3 text-xs font-mono rounded-xs outline-none text-white resize-y leading-relaxed"
                  placeholder="Enter system prompt for Wingman Copilot..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-chakra font-bold uppercase tracking-wider text-ok mb-1">
                    Default Reasoning Model
                  </label>
                  <select
                    value={form.llmModel}
                    onChange={(e) =>
                      setForm({ ...form, llmModel: e.target.value })
                    }
                    className="w-full bg-bg border border-line focus:border-ok px-3 py-2 text-xs font-mono rounded-xs outline-none text-white"
                  >
                    <option value="wingshield-x (Ollama - Custom Fine-Tuned)">
                      wingshield-x (Ollama - Custom Fine-Tuned Security Copilot)
                    </option>
                    <option value="llama3:8b (Local Ollama)">
                      llama3:8b (Local Ollama)
                    </option>
                    <option value="gpt-4o (OpenAI API)">
                      gpt-4o (OpenAI API)
                    </option>
                    <option value="claude-3-5-sonnet (Anthropic API)">
                      claude-3-5-sonnet (Anthropic API)
                    </option>
                    <option value="gemini-1.5-pro (Google Vertex AI)">
                      gemini-1.5-pro (Google Vertex AI)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-chakra font-bold uppercase tracking-wider text-ok mb-1">
                    Defense Autonomy Level
                  </label>
                  <select
                    value={form.autonomyLevel}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        autonomyLevel: e.target.value as any,
                      })
                    }
                    className="w-full bg-bg border border-line focus:border-ok px-3 py-2 text-xs font-mono rounded-xs outline-none text-white"
                  >
                    <option value="autonomous">
                      Autonomous Defense (Instant sub-5ms Intercept & Isolation)
                    </option>
                    <option value="supervised">
                      Supervised Approval (Require 1-Click Operator Confirmation)
                    </option>
                    <option value="audit_only">
                      Audit Only (Cryptographic trace without halting execution)
                    </option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VOICE & WAKE WORDS */}
          {activeTab === "voice" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-chakra font-bold uppercase tracking-wider text-ok mb-1">
                    Primary Voice Wake Word
                  </label>
                  <input
                    type="text"
                    value={form.wakeWordPrimary}
                    onChange={(e) =>
                      setForm({ ...form, wakeWordPrimary: e.target.value })
                    }
                    className="w-full bg-bg border border-line focus:border-ok px-3 py-2 text-xs font-mono rounded-xs outline-none text-white"
                    placeholder="e.g. WingShield Wakeup"
                  />
                  <span className="text-[10px] text-mut mt-1 block">
                    Listening phrase that awakens voice dialogue in console.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-chakra font-bold uppercase tracking-wider text-ok mb-1">
                    Secondary CLI Wake Word
                  </label>
                  <input
                    type="text"
                    value={form.wakeWordSecondary}
                    onChange={(e) =>
                      setForm({ ...form, wakeWordSecondary: e.target.value })
                    }
                    className="w-full bg-bg border border-line focus:border-ok px-3 py-2 text-xs font-mono rounded-xs outline-none text-white"
                    placeholder="e.g. AgentShield"
                  />
                  <span className="text-[10px] text-mut mt-1 block">
                    Launches terminal matrix shell or CLI defense tool.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-chakra font-bold uppercase tracking-wider text-ok mb-1">
                  Synthesizer Voice Profile
                </label>
                <select
                  value={form.voiceName}
                  onChange={(e) => setForm({ ...form, voiceName: e.target.value })}
                  className="w-full bg-bg border border-line focus:border-ok px-3 py-2 text-xs font-mono rounded-xs outline-none text-white"
                >
                  <option value="">Default OS Cyber Voice</option>
                  {availableVoices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-bg/50 border border-line rounded-xs">
                <div>
                  <div className="flex items-center justify-between text-xs font-chakra uppercase mb-1">
                    <span className="text-white">Speech Rate</span>
                    <span className="text-ok font-mono">{form.speechRate}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.5"
                    step="0.05"
                    value={form.speechRate}
                    onChange={(e) =>
                      setForm({ ...form, speechRate: parseFloat(e.target.value) })
                    }
                    className="w-full accent-[#00e5ff]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-chakra uppercase mb-1">
                    <span className="text-white">Speech Pitch</span>
                    <span className="text-ok font-mono">{form.speechPitch}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.3"
                    step="0.05"
                    value={form.speechPitch}
                    onChange={(e) =>
                      setForm({ ...form, speechPitch: parseFloat(e.target.value) })
                    }
                    className="w-full accent-[#00e5ff]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-line">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={form.spacebarTrigger}
                    onChange={(e) =>
                      setForm({ ...form, spacebarTrigger: e.target.checked })
                    }
                    className="accent-[#00e5ff]"
                  />
                  <span className="text-white font-chakra">
                    Hold Spacebar to Talk (Push-to-Talk)
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() =>
                    handleTestVoice(
                      `Wingman voice synthesizer test. Ready for operator ${form.operatorName}.`
                    )
                  }
                  disabled={isPlayingPreview}
                  className="px-3.5 py-1.5 bg-ok/20 hover:bg-ok text-ok hover:text-black border border-ok rounded-xs text-xs font-chakra font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
                >
                  <Volume2 size={14} />
                  <span>Test Voice Audio</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: DEFENSE MESH & AGENTS */}
          {activeTab === "agents" && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-chakra font-bold uppercase tracking-wider text-ok mb-2">
                  AgentShield-X Protection Layer Modules
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    {
                      key: "toolInterception",
                      name: "Tool Interception",
                      desc: "Monitors & filters tool calls in kernel hook",
                    },
                    {
                      key: "honeytools",
                      name: "Honeytools",
                      desc: "Deception tools & honeypot canary traps",
                    },
                    {
                      key: "auditLog",
                      name: "Audit Log",
                      desc: "Cryptographic SHA-256 activity trace",
                    },
                    {
                      key: "sandboxing",
                      name: "Sandboxing",
                      desc: "Isolated execution container environment",
                    },
                    {
                      key: "threatIntel",
                      name: "Threat Intel",
                      desc: "Real-time threat detection & CVE feeds",
                    },
                    {
                      key: "mcpDefense",
                      name: "MCP Defense",
                      desc: "Validates MCP integrations & tool signatures",
                    },
                  ].map((mod) => {
                    const isChecked =
                      (form.protectionModules as any)[mod.key] ?? true;
                    return (
                      <label
                        key={mod.key}
                        className={`p-3 border rounded-xs flex items-start gap-3 cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-ok/5 border-ok/50"
                            : "bg-bg/40 border-line text-mut"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              protectionModules: {
                                ...form.protectionModules,
                                [mod.key]: e.target.checked,
                              },
                            })
                          }
                          className="mt-1 accent-[#00e5ff]"
                        />
                        <div>
                          <div className="text-xs font-chakra font-bold text-white uppercase">
                            {mod.name}
                          </div>
                          <div className="text-[11px] text-mut">{mod.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-chakra font-bold uppercase tracking-wider text-ok mb-2">
                  Active Managed Agents Matrix
                </label>
                <div className="space-y-2">
                  {form.activeAgents.map((agent, idx) => (
                    <div
                      key={agent.id}
                      className="p-3 bg-bg/60 border border-line flex items-center justify-between gap-4 rounded-xs"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={agent.enabled}
                          onChange={(e) => {
                            const updated = [...form.activeAgents];
                            updated[idx].enabled = e.target.checked;
                            setForm({ ...form, activeAgents: updated });
                          }}
                          className="accent-[#00e5ff]"
                        />
                        <div>
                          <div className="text-xs font-chakra font-bold text-white uppercase flex items-center gap-2">
                            <span>{agent.name}</span>
                            <span className="text-[10px] text-mut font-mono">
                              ({agent.role})
                            </span>
                          </div>
                          <div className="text-[11px] text-mut">
                            {agent.activity}
                          </div>
                        </div>
                      </div>

                      <select
                        value={agent.status}
                        onChange={(e) => {
                          const updated = [...form.activeAgents];
                          updated[idx].status = e.target.value as any;
                          setForm({ ...form, activeAgents: updated });
                        }}
                        className="bg-panel border border-line text-[11px] font-mono text-ok px-2 py-1 rounded-xs outline-none"
                      >
                        <option value="running">● Running</option>
                        <option value="idle">○ Idle</option>
                        <option value="scanning">⚡ Scanning</option>
                        <option value="paused">❚❚ Paused</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-chakra font-bold uppercase tracking-wider text-ok mb-1">
                  Threat Sensitivity Matrix
                </label>
                <select
                  value={form.threatSensitivity}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      threatSensitivity: e.target.value as any,
                    })
                  }
                  className="w-full bg-bg border border-line focus:border-ok px-3 py-2 text-xs font-mono rounded-xs outline-none text-white"
                >
                  <option value="normal">
                    Normal (Heuristic matching & known exploit DB)
                  </option>
                  <option value="strict">
                    Strict (Zero unverified tools, strict taint tracking)
                  </option>
                  <option value="zero_trust">
                    Zero-Trust Paranoia (Require dual cryptographic attestation on all calls)
                  </option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-line bg-panel/60">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-xs font-chakra uppercase text-mut hover:text-bad flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw size={14} />
            <span>Reset Factory Defaults</span>
          </button>

          <div className="flex items-center gap-3">
            {saveToast && (
              <span className="text-xs font-chakra font-bold text-ok flex items-center gap-1.5 animate-pulse">
                <Check size={14} />
                <span>Configuration Saved & Active!</span>
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-line text-mut hover:text-white rounded-xs text-xs font-chakra font-bold uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-ok text-black hover:bg-ok/90 font-chakra font-bold text-xs uppercase tracking-wider rounded-xs shadow-glow transition-all hover:scale-105 flex items-center gap-2"
            >
              <Check size={16} />
              <span>Apply & Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
