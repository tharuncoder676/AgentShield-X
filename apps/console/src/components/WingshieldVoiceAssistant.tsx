import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, MicOff, Volume2, VolumeX, Play, ShieldAlert, Sparkles, X, Terminal, Bot, Cpu } from "lucide-react";

export const WingshieldVoiceAssistant: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [copilotReply, setCopilotReply] = useState(
    "Hello Tharun! Wingshield Copilot online. Say 'Wake up AgentShield-X', 'Scan repo', or click Auto Tour to explore all features."
  );
  const [isTourRunning, setIsTourRunning] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const recognitionRef = useRef<any>(null);

  // Speech Synthesis Helper
  const speak = (text: string, onEnd?: () => void) => {
    if (voiceMuted || typeof window === "undefined" || !window.speechSynthesis) {
      if (onEnd) setTimeout(onEnd, 1500);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 0.95;

    // Pick a sleek modern voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("David") || v.lang.startsWith("en")
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  };

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let currentText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);

        const lower = currentText.toLowerCase();
        if (
          lower.includes("wakeup") ||
          lower.includes("wake up") ||
          lower.includes("wingshield") ||
          lower.includes("hey wingshield") ||
          lower.includes("agentshield")
        ) {
          handleVoiceCommand(lower);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  // Voice Command Dispatcher
  const handleVoiceCommand = (cmd: string) => {
    if (cmd.includes("tour") || cmd.includes("replay") || cmd.includes("wake up") || cmd.includes("wakeup") || cmd.includes("full demo")) {
      startAutonomousTour();
    } else if (cmd.includes("scan") || cmd.includes("blast radius")) {
      navigate("/architecture");
      const msg = "Navigating to Architecture. Running AST blast radius analyzer. Identifying reachability from untrusted inputs to sensitive sinks.";
      setCopilotReply(msg);
      speak(msg);
    } else if (cmd.includes("debate") || cmd.includes("terminal")) {
      navigate("/terminal");
      const msg = "Opening Copilot Terminal. Convening 3-Judge Autonomous Debate Committee for borderline tool calls.";
      setCopilotReply(msg);
      speak(msg);
    } else if (cmd.includes("mcp") || cmd.includes("connector") || cmd.includes("rug pull")) {
      navigate("/mcp-proxy");
      const msg = "Accessing Universal MCP Connectors Hub. Canonical SHA-256 tool hash pinning is active to block dynamic tool poisoning.";
      setCopilotReply(msg);
      speak(msg);
    } else if (cmd.includes("honey") || cmd.includes("canary")) {
      navigate("/honeytools");
      const msg = "Deploying decoy canary honeytools across Finance and CloudOps domains to sever unauthorized exfiltration attempts.";
      setCopilotReply(msg);
      speak(msg);
    } else if (cmd.includes("research agent") || cmd.includes("agent")) {
      navigate("/agents");
      const msg = "Our target Research Agent integrates web search, notes, and email. AgentShield-X enforces sub-5ms deterministic containment.";
      setCopilotReply(msg);
      speak(msg);
    } else {
      const msg = "Hello Tharun! Command received. Wingshield Copilot defense mesh operating under 3.4ms latency SLA.";
      setCopilotReply(msg);
      speak(msg);
    }
  };

  // Autonomous Presentation Tour Sequences
  const tourSteps = [
    {
      title: "Step 1: System Online & Research Agent Context",
      route: "/agents",
      narration:
        "Hello Tharun! Wingshield Copilot online. AgentShield-X Security Matrix active. Lead Architect Tharunkumar authenticated. Target Research Agent loaded with web search, internal notes, and email dispatch.",
    },
    {
      title: "Step 2: AST Blast Radius & Deterministic Interception",
      route: "/architecture",
      narration:
        "Step 2: Analyzing AST Reachability Graph. Our zero-dependency parser maps unvalidated entry points to outbound sinks in 3.4 milliseconds without external heavy ML overhead.",
    },
    {
      title: "Step 3: Wingshield Terminal & Autonomous 3-Judge Debate",
      route: "/terminal",
      narration:
        "Step 3: Opening Wingshield Terminal. For ambiguous tool calls, our 3-Judge Committee convenes. The Security Advocate challenges the risk, Utility Optimizer defends valid operations, and the Chief Judge issues a transparent verdict.",
    },
    {
      title: "Step 4: MCP Rug-Pull Guard & Universal Connectors",
      route: "/mcp-proxy",
      narration:
        "Step 4: Universal Connectors Hub. Supports Claude Desktop, Cursor, and Windsurf. Canonical SHA-256 tool hashing detects and quarantines poisoned upstream MCP servers in real time.",
    },
    {
      title: "Step 5: Decoy Honeytools & Canary Tripwires",
      route: "/honeytools",
      narration:
        "Step 5: Dynamic Honeytools. Decoy credentials and tables act as tripwires. Any prompt injection tricking an agent into touching canary data instantly severs outbound network sinks.",
    },
    {
      title: "Step 6: Cryptographic Audit Ledger & SIEM Webhooks",
      route: "/compliance",
      narration:
        "Step 6: Verification complete. All decisions are sealed into our SHA-256 Merkle audit chain and dispatched to Slack, Discord, and PagerDuty. Wingshield Copilot is 100% production ready.",
    },
  ];

  const startAutonomousTour = () => {
    setIsTourRunning(true);
    setTourStep(0);
    executeTourStep(0);
  };

  const executeTourStep = (stepIndex: number) => {
    if (stepIndex >= tourSteps.length) {
      setIsTourRunning(false);
      setCopilotReply("Autonomous Security Demonstration completed successfully. All systems nominal.");
      speak("Autonomous security demonstration completed successfully. All systems nominal, Tharun.");
      return;
    }

    const step = tourSteps[stepIndex];
    setTourStep(stepIndex);
    navigate(step.route);
    setCopilotReply(`${step.title}: ${step.narration}`);

    speak(step.narration, () => {
      // Pause 2 seconds between steps, then proceed
      setTimeout(() => {
        executeTourStep(stepIndex + 1);
      }, 2000);
    });
  };

  return (
    <>
      {/* Floating Futuristic Wingshield Arc-Reactor Launcher */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {isListening && (
          <div className="flex items-center gap-2 bg-[#0d1117]/90 border border-[#38bdf8]/60 px-3 py-1.5 rounded-full shadow-[0_0_20px_rgba(56,189,248,0.4)] backdrop-blur-md animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] animate-ping" />
            <span className="text-xs font-mono text-[#38bdf8] font-bold">WINGSHIELD LISTENING...</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative group p-3.5 rounded-full bg-gradient-to-br from-[#0d1117] via-[#161b22] to-[#0d1117] border border-[#38bdf8]/70 shadow-[0_0_25px_rgba(56,189,248,0.45)] hover:shadow-[0_0_35px_rgba(188,140,255,0.6)] hover:border-[#bc8cff] transition-all duration-300"
          title="AgentShield-X Wingshield Voice Copilot"
        >
          {/* Animated Arc Reactor Core */}
          <div className="relative w-7 h-7 flex items-center justify-center">
            <div className={`absolute inset-0 rounded-full border-2 border-dashed border-[#38bdf8] ${isSpeaking ? "animate-spin" : ""}`} />
            <Bot className="w-4 h-4 text-[#38bdf8] group-hover:text-[#bc8cff] transition-colors" />
          </div>
        </button>
      </div>

      {/* Holographic Wingshield HUD Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 rounded-2xl bg-[#090d13]/95 border border-[#38bdf8]/50 shadow-[0_0_40px_rgba(0,0,0,0.8),0_0_25px_rgba(56,189,248,0.25)] backdrop-blur-xl z-50 p-5 font-mono text-zinc-100 animate-in fade-in slide-in-from-bottom-6 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#30363d]/60">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#38bdf8] animate-pulse" />
              <span className="text-xs font-bold tracking-widest text-[#58a6ff]">WINGSHIELD // COPILOT</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30">
                ONLINE
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setVoiceMuted(!voiceMuted)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
                title={voiceMuted ? "Unmute Voice" : "Mute Voice"}
              >
                {voiceMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Futuristic Audio Waveform / Status visualizer */}
          <div className="my-4 p-3 rounded-xl bg-[#0d1117] border border-[#30363d]/70 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1">
                <Cpu size={12} className="text-[#38bdf8]" />
                Lead Architect: <strong className="text-emerald-400">Tharunkumar.S</strong>
              </span>
              <span className="text-[#38bdf8]">3.4ms SLA</span>
            </div>

            {/* Audio equalizer bars */}
            <div className="flex items-end justify-center gap-1.5 h-10 py-1">
              {[40, 75, 90, 60, 100, 80, 50, 95, 65, 85, 45, 90].map((h, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isSpeaking
                      ? "bg-gradient-to-t from-[#38bdf8] to-[#bc8cff] animate-pulse"
                      : "bg-zinc-700 h-2"
                  }`}
                  style={{ height: isSpeaking ? `${h * Math.random() + 20}%` : "6px" }}
                />
              ))}
            </div>

            {/* AI Narration Text Box */}
            <div className="text-xs text-zinc-200 leading-relaxed font-sans min-h-[50px] bg-[#161b22]/70 p-2.5 rounded-lg border border-[#30363d]/40">
              {copilotReply}
            </div>

            {transcript && (
              <div className="text-[10px] text-zinc-400 italic">
                Heard: "{transcript}"
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {/* Auto Play Full Autonomous Tour Button */}
            <button
              onClick={startAutonomousTour}
              disabled={isTourRunning}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                isTourRunning
                  ? "bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8] animate-pulse"
                  : "bg-gradient-to-r from-[#38bdf8] via-[#58a6ff] to-[#bc8cff] text-zinc-950 hover:opacity-95"
              }`}
            >
              <Play size={14} className={isTourRunning ? "animate-spin" : ""} />
              {isTourRunning ? `Autonomous Replay Running (Step ${tourStep + 1}/6)...` : "⚡ Wake up & Replay Full Automation"}
            </button>

            {/* Mic toggle & quick commands */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={toggleListening}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                  isListening
                    ? "bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                    : "bg-[#161b22] text-zinc-300 border-[#30363d] hover:border-[#38bdf8]/60"
                }`}
              >
                {isListening ? <MicOff size={14} /> : <Mic size={14} className="text-[#38bdf8]" />}
                {isListening ? "Stop Mic" : "Start Voice Mic"}
              </button>

              <button
                onClick={() => handleVoiceCommand("research agent")}
                className="py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 bg-[#161b22] text-zinc-300 border border-[#30363d] hover:border-[#bc8cff]/60 transition-all"
              >
                <Bot size={14} className="text-[#bc8cff]" />
                Research Agent
              </button>
            </div>
          </div>

          {/* Prompt Hint */}
          <div className="mt-3 text-[10px] text-zinc-400 text-center tracking-tight">
            Say <span className="text-[#38bdf8] font-bold">"Hello Tharun"</span> / <span className="text-[#38bdf8] font-bold">"Wake up AgentShield-X"</span> or <span className="text-[#bc8cff] font-bold">"Scan repo"</span> / <span className="text-[#3fb950] font-bold">"Debate"</span>
          </div>
        </div>
      )}
    </>
  );
};

export const JarvisVoiceAssistant = WingshieldVoiceAssistant;
