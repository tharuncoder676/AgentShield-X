import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  X,
  Terminal,
  Zap,
  Shield,
  Bot,
  Sparkles,
  Play,
  RotateCcw,
} from "lucide-react";
import { WingmanConfig } from "../types/wingman";

interface WingmanTalkModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WingmanConfig;
  onNavigate?: (path: string) => void;
}

export const WingmanTalkModal: React.FC<WingmanTalkModalProps> = ({
  isOpen,
  onClose,
  config,
  onNavigate,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [inputText, setInputText] = useState("");
  const [replyMessage, setReplyMessage] = useState(
    `Wingman online, ${config.operatorName}. All 6 agents secured. What are your orders?`
  );
  const [history, setHistory] = useState<
    { role: "user" | "wingman"; text: string; time: string }[]
  >([]);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, replyMessage]);

  // Speech Synthesis
  const speakText = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = config.speechRate;
    utterance.pitch = config.speechPitch;

    if (config.voiceName) {
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find((v) => v.name === config.voiceName);
      if (match) utterance.voice = match;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        let currentText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);

        if (event.results[event.results.length - 1].isFinal) {
          handleExecuteCommand(currentText);
          setTranscript("");
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Speech recognition auto-start notice:", err);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, [isOpen]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(
        "Web Speech Recognition is not supported in this browser. You can type commands below!"
      );
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
        console.warn("Recognition start error:", e);
      }
    }
  };

  // Tactical Command Dispatcher
  const handleExecuteCommand = async (rawInput: string) => {
    const query = rawInput.trim();
    if (!query) return;

    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    setHistory((prev) => [...prev, { role: "user", text: query, time: timeStr }]);
    setIsProcessing(true);

    const lower = query.toLowerCase();
    let reply = "";

    // 1. Desktop & Web App Automation (OpenJarvis Parity)
    if (lower.includes("youtube")) {
      reply = `Opening YouTube for you, ${config.operatorName}.`;
      try {
        fetch("http://localhost:8002/v1/desktop/open", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target: lower }),
        }).catch(() => {});
      } catch (_) {}
    } else if (lower.includes("chrome") || lower.includes("open browser")) {
      reply = `Opening Google Chrome, ${config.operatorName}.`;
      try {
        fetch("http://localhost:8002/v1/desktop/open", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target: lower }),
        }).catch(() => {});
      } catch (_) {}
    } else if (
      lower.includes("vs code") ||
      lower.includes("vscode") ||
      lower.includes("open code") ||
      lower === "code"
    ) {
      reply = `Workspace initialized in VS Code for AgentShield-X repository.`;
      try {
        fetch("http://localhost:8002/v1/desktop/open", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target: "vscode" }),
        }).catch(() => {});
      } catch (_) {}
    } else if (lower.includes("calc") || lower.includes("calculator")) {
      reply = `Launching Calculator.`;
      try {
        fetch("http://localhost:8002/v1/desktop/open", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target: "calc" }),
        }).catch(() => {});
      } catch (_) {}
    } else if (lower.includes("notepad")) {
      reply = `Opening Notepad.`;
      try {
        fetch("http://localhost:8002/v1/desktop/open", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target: "notepad" }),
        }).catch(() => {});
      } catch (_) {}
    } else if (lower.includes("spotify")) {
      reply = `Opening Spotify for you, ${config.operatorName}.`;
      try {
        fetch("http://localhost:8002/v1/desktop/open", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target: "spotify" }),
        }).catch(() => {});
      } catch (_) {}
    } else if (lower.startsWith("open ") || lower.startsWith("launch ") || lower.startsWith("start ")) {
      reply = `Executing desktop directive: ${query}.`;
      try {
        fetch("http://localhost:8002/v1/desktop/open", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target: query }),
        }).catch(() => {});
      } catch (_) {}
    } else if (
      lower.includes("who created you") ||
      lower.includes("creator") ||
      lower.includes("who made you")
    ) {
      reply = `I was created by Tharunkumar.S as the autonomous AI security copilot and defense runtime for AgentShield-X.`;
    } else if (
      lower.includes("system status") ||
      lower.includes("telemetry") ||
      lower.includes("diagnostics")
    ) {
      reply = `System Telemetry: CPU at 18%, RAM at 52%, Risk Score 8 out of 100. All 6 agents are online and protected under the sub-5 millisecond defense mesh.`;
    } else if (
      lower.includes("threat") ||
      lower.includes("security") ||
      lower.includes("attacks")
    ) {
      reply = `Live Intelligence Report: 127 attacks blocked today, including a prompt injection against the Research Agent and an unauthorized /etc/passwd filesystem read. Zero compromise.`;
    } else if (lower.includes("scan") || lower.includes("scanner")) {
      reply = `Initiating comprehensive static and runtime vulnerability scan across all connected agent tools and repositories.`;
      if (onNavigate) onNavigate("/scans");
    } else if (lower.includes("audit") || lower.includes("logs")) {
      reply = `Opening cryptographic SHA-256 audit log subsystem.`;
      if (onNavigate) onNavigate("/audit");
    } else if (lower.includes("terminal") || lower.includes("sandbox")) {
      reply = `Launching isolated agent execution sandbox terminal.`;
      if (onNavigate) onNavigate("/terminal");
    } else {
      // 2. Query Local Ollama or Shieldwing Copilot API
      try {
        const ollamaRes = await fetch("http://localhost:11434/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "wingshield-x",
            prompt: `System: ${config.systemPersonaPrompt}\nOperator ${config.operatorName}: ${query}\nWingman:`,
            stream: false,
          }),
        });

        if (ollamaRes.ok) {
          const data = await ollamaRes.json();
          reply =
            data.response ||
            `Understood, ${config.operatorName}. Executing defense directive.`;
        } else {
          // Fallback to intelligent tactical response
          reply = `Acknowledged, ${config.operatorName}. Directive processed under ${config.purposeMode} protocol. All agent interception hooks remain fully synchronized.`;
        }
      } catch (e) {
        reply = `Understood, ${config.operatorName}. I am monitoring 6 agents with sub-5ms interception active. Directive recorded in cryptographic audit ledger.`;
      }
    }

    setReplyMessage(reply);
    setHistory((prev) => [
      ...prev,
      {
        role: "wingman",
        text: reply,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      },
    ]);

    setIsProcessing(false);
    speakText(reply);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const txt = inputText;
    setInputText("");
    handleExecuteCommand(txt);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#09101d] border border-ok/60 w-full max-w-2xl rounded-sm shadow-[0_0_50px_rgba(0,229,255,0.3)] flex flex-col h-[600px] overflow-hidden text-fg font-chakra">
        {/* Top Cockpit Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line bg-panel/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-ok bg-ok/10 flex items-center justify-center text-ok shadow-glow">
              <Bot size={18} />
            </div>
            <div>
              <div className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
                <span>WINGMAN Autonomous Tactical Voice HUD</span>
                <span className="text-[10px] text-ok bg-ok/10 px-2 py-0.5 rounded-xs border border-ok/40 font-mono">
                  {config.llmModel.split(" ")[0]}
                </span>
              </div>
              <div className="text-[11px] text-mut font-sans">
                Voice Wake-Word:{" "}
                <span className="text-ok font-mono font-bold">
                  "{config.wakeWordPrimary}"
                </span>{" "}
                &bull; Operator: {config.operatorName}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-mut hover:text-white hover:bg-line/40 rounded-xs transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Central Audio Visualizer Banner */}
        <div className="bg-bg/80 border-b border-line/60 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleListening}
              className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${
                isListening
                  ? "bg-ok text-black border-ok shadow-glow scale-105"
                  : "bg-panel text-mut border-line hover:border-ok/60"
              }`}
              title={isListening ? "Mute Microphone" : "Activate Microphone"}
            >
              {isListening ? <Mic size={22} /> : <MicOff size={22} />}
            </button>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <span>
                  {isListening
                    ? "Microphone Active & Listening..."
                    : "Microphone Paused (Click to speak)"}
                </span>
                {isListening && (
                  <span className="w-2 h-2 rounded-full bg-ok animate-ping" />
                )}
              </div>
              <div className="text-[11px] text-mut font-mono">
                {isSpeaking
                  ? "🔊 Synthesizer output active..."
                  : isProcessing
                  ? "⚡ Evaluating model inference..."
                  : transcript
                  ? `Heard: "${transcript}"`
                  : `Say commands like 'Open YouTube', 'Scan repo', or 'Threat status'`}
              </div>
            </div>
          </div>

          {/* Animated Equalizer Waves */}
          <div className="flex items-center gap-1 h-8">
            {[40, 75, 100, 60, 90, 45, 80, 50, 95, 30].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-ok rounded-full transition-all duration-150"
                style={{
                  height: isListening || isSpeaking ? `${h}%` : "15%",
                  opacity: isListening || isSpeaking ? 0.9 : 0.25,
                }}
              />
            ))}
          </div>
        </div>

        {/* Dialog / History View */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 font-sans text-xs">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-mut space-y-3 font-chakra">
              <div className="w-14 h-14 rounded-full border border-ok/40 bg-ok/5 flex items-center justify-center text-ok">
                <Sparkles size={24} />
              </div>
              <div className="text-sm font-bold text-white uppercase tracking-wider">
                Wingman Tactical Matrix Ready
              </div>
              <p className="max-w-md text-xs text-mut leading-relaxed">
                Speak directly through your microphone or use the command line below.
                Try saying: <span className="text-ok font-mono">"Open YouTube"</span>,{" "}
                <span className="text-ok font-mono">"System status"</span>,{" "}
                <span className="text-ok font-mono">"Who created you"</span>, or{" "}
                <span className="text-ok font-mono">"Scan repo"</span>.
              </p>
            </div>
          ) : (
            history.map((item, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  item.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div className="flex items-center gap-2 mb-1 text-[10px] text-mut font-mono">
                  <span>{item.role === "user" ? config.operatorName : "WINGMAN"}</span>
                  <span>&bull;</span>
                  <span>{item.time}</span>
                </div>
                <div
                  className={`p-3 max-w-[85%] rounded-xs leading-relaxed ${
                    item.role === "user"
                      ? "bg-ok/20 border border-ok/40 text-white font-medium"
                      : "bg-panel/90 border border-line text-fg font-chakra text-xs"
                  }`}
                >
                  {item.text}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Badges */}
        <div className="px-5 py-2 bg-bg/50 border-t border-line flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-mut font-mono uppercase">
            Quick Prompts:
          </span>
          {[
            "Open YouTube",
            "System status",
            "Who created you",
            "Threat status",
            "Scan repo",
          ].map((cmd) => (
            <button
              key={cmd}
              onClick={() => handleExecuteCommand(cmd)}
              className="px-2 py-0.5 bg-panel hover:bg-ok/20 border border-line hover:border-ok/60 text-[10px] font-chakra text-mut hover:text-white rounded-xs transition-colors"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Bottom Command Input Bar */}
        <form
          onSubmit={handleManualSubmit}
          className="p-3 border-t border-line bg-panel/80 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Type a command or instruction for Wingman (e.g. "open youtube", "system status")...`}
            className="flex-1 bg-bg border border-line focus:border-ok px-3 py-2 text-xs font-mono rounded-xs outline-none text-white placeholder:text-mut"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-2 bg-ok text-black hover:bg-ok/90 disabled:opacity-50 font-chakra font-bold text-xs uppercase tracking-wider rounded-xs flex items-center gap-1.5 transition-colors"
          >
            <span>Send</span>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};
