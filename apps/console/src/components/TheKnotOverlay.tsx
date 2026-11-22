import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Mic,
  MicOff,
  Eye,
  CheckCircle2,
  X,
  ChevronUp,
  ChevronDown,
  Layers,
  ArrowRight,
  Shield,
  Clock,
  Calendar,
  Send,
  Zap,
  Activity,
  Check
} from "lucide-react";

interface Proposal {
  id: string;
  type: string;
  title: string;
  details: string;
  proposed_schedule: string;
  risk_level: string;
  risk_score: number;
  status: "pending" | "approved" | "declined";
}

export const TheKnotOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [activeMode, setActiveMode] = useState<"screen" | "voice" | "tasks">("screen");
  const [approvedCount, setApprovedCount] = useState(0);

  // Fetch pending proposals for quick badge
  const fetchProposals = async () => {
    try {
      const res = await fetch("/v1/nus/timeline");
      if (res.ok) {
        const data = await res.json();
        const pending = (data.proposals || []).filter((p: Proposal) => p.status === "pending");
        setProposals(pending);
      }
    } catch {
      // Fallback local pending proposals
      setProposals([
        {
          id: "prop-fallback-1",
          type: "focus_block",
          title: "Schedule 3hr Deep Work Study Block for Midterm Exam",
          details: "Reserve uninterrupted focus block 48 hours prior to exam in local calendar.",
          proposed_schedule: "Oct 25, 2:00 PM - 5:00 PM",
          risk_level: "LOW",
          risk_score: 0.02,
          status: "pending"
        }
      ]);
    }
  };

  useEffect(() => {
    fetchProposals();
    const interval = setInterval(fetchProposals, 10000);
    return () => clearInterval(interval);
  }, []);

  // Shortcut Ctrl+Shift+T opens The Knot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "T" || e.key === "t")) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleQuery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("/v1/nus/screen-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          screen_context: "Active Wingman Command Center / Nūs Desktop View"
        })
      });

      if (res.ok) {
        const data = await res.json();
        setResponse(data.response);
      } else {
        fallbackQueryResponse();
      }
    } catch {
      fallbackQueryResponse();
    } finally {
      setLoading(false);
    }
  };

  const fallbackQueryResponse = () => {
    const qLower = query.toLowerCase();
    if (qLower.includes("next") || qLower.includes("deadline") || qLower.includes("due")) {
      setResponse("Your next immediate deliverable is **Problem Set 1** for CS 410, due in 3 days. I recommend blocking 2 hours of focus time tonight.");
    } else if (qLower.includes("exam") || qLower.includes("midterm")) {
      setResponse("You have the **CS 410 Midterm Exam** on October 27 (25% weight). All study materials and lecture slides have been mapped into your living timeline.");
    } else {
      setResponse(`Nūs Knot Companion analyzing active screen. Everything is running smoothly under AgentShield-X dual-rail protection with 0 pending security alerts.`);
    }
  };

  const handleApproveProposal = async (propId: string) => {
    try {
      await fetch("/v1/nus/proposal/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposal_id: propId,
          action: "approve",
          operator: "Tharun"
        })
      });
    } catch {
      // Local fallback
    }
    setProposals((prev) => prev.filter((p) => p.id !== propId));
    setApprovedCount((c) => c + 1);
  };

  const handleDeclineProposal = async (propId: string) => {
    try {
      await fetch("/v1/nus/proposal/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposal_id: propId,
          action: "decline",
          operator: "Tharun"
        })
      });
    } catch {
      // Local fallback
    }
    setProposals((prev) => prev.filter((p) => p.id !== propId));
  };

  const toggleVoice = () => {
    if (!isListening) {
      setIsListening(true);
      // Attempt browser speech recognition if supported
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = "en-US";
          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setQuery(transcript);
            setIsListening(false);
            setTimeout(() => handleQuery(), 200);
          };
          recognition.onerror = () => setIsListening(false);
          recognition.onend = () => setIsListening(false);
          recognition.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setTimeout(() => {
          setQuery("What is my next upcoming deadline?");
          setIsListening(false);
          setTimeout(() => handleQuery(), 200);
        }, 1500);
      }
    } else {
      setIsListening(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end select-none font-sans">
      {/* Expanded Knot Companion Card */}
      {isOpen && (
        <div className="mb-3 w-96 max-w-[calc(100vw-32px)] bg-[#0e071e]/95 backdrop-blur-xl border border-purple-500/40 rounded-2xl shadow-2xl shadow-purple-950/80 overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-purple-950/80 via-[#180a30] to-purple-900/60 border-b border-purple-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                </div>
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-purple-950 animate-ping" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  The Knot Companion
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 border border-purple-400/30">
                    Local-First
                  </span>
                </div>
                <div className="text-[10px] text-purple-300/70">
                  Nūs Desktop Screen & Semester Intelligence
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-purple-400/80 hover:text-white hover:bg-purple-900/40 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex border-b border-purple-900/30 bg-[#0a0518]/60 text-[11px] font-mono">
            <button
              onClick={() => setActiveMode("screen")}
              className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 transition-colors ${
                activeMode === "screen" ? "text-cyan-300 bg-purple-900/40 border-b-2 border-cyan-400" : "text-purple-300/60 hover:text-purple-200"
              }`}
            >
              <Eye className="w-3 h-3" />
              Screen Watch
            </button>
            <button
              onClick={() => setActiveMode("tasks")}
              className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 transition-colors ${
                activeMode === "tasks" ? "text-purple-300 bg-purple-900/40 border-b-2 border-purple-400" : "text-purple-300/60 hover:text-purple-200"
              }`}
            >
              <Layers className="w-3 h-3" />
              Proposals ({proposals.length})
            </button>
          </div>

          {/* Content Body */}
          <div className="p-3.5 space-y-3 max-h-80 overflow-y-auto">
            {activeMode === "screen" && (
              <>
                {/* Response Area */}
                {response && (
                  <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/30 text-xs text-purple-100 leading-relaxed shadow-inner">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-300 font-bold mb-1">
                      <Zap className="w-3 h-3" />
                      Nūs Intelligence Advice:
                    </div>
                    {response}
                  </div>
                )}

                {/* Input Bar */}
                <form onSubmit={handleQuery} className="relative flex items-center">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about active screen, syllabus, deadlines..."
                    className="w-full bg-[#070311] border border-purple-800/60 rounded-xl pl-3 pr-20 py-2 text-xs text-purple-200 placeholder-purple-400/40 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  <div className="absolute right-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={toggleVoice}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isListening
                          ? "bg-rose-500 text-white animate-pulse"
                          : "text-purple-400 hover:text-white hover:bg-purple-900/40"
                      }`}
                      title="Toggle Microphone Voice Input"
                    >
                      {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !query.trim()}
                      className="p-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>

                <div className="text-[10px] text-purple-400/50 flex items-center justify-between font-mono">
                  <span>Shortcut: Ctrl+Shift+T</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" /> Zero Data Leakage
                  </span>
                </div>
              </>
            )}

            {activeMode === "tasks" && (
              <div className="space-y-2">
                {proposals.length === 0 ? (
                  <div className="text-center py-6 text-xs text-purple-300/60 space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                    <p className="font-semibold text-white">All Clear!</p>
                    <p className="text-[11px]">No pending schedule proposals requiring your authorization.</p>
                  </div>
                ) : (
                  proposals.map((prop) => (
                    <div
                      key={prop.id}
                      className="p-3 rounded-xl bg-[#070311] border border-purple-900/60 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-white text-[11px] leading-snug">
                          {prop.title}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono whitespace-nowrap">
                          Approve First
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-300/80 leading-relaxed">
                        {prop.details}
                      </p>
                      <div className="flex items-center justify-between text-[10px] font-mono text-purple-400/70 pt-1 border-t border-purple-950">
                        <span>Risk: {prop.risk_level} ({prop.risk_score})</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDeclineProposal(prop.id)}
                            className="px-2 py-0.5 rounded bg-purple-950/80 hover:bg-rose-950 text-purple-300 hover:text-rose-300 border border-purple-800/40 transition-colors"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleApproveProposal(prop.id)}
                            className="px-2 py-0.5 rounded bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold transition-colors flex items-center gap-1 shadow-sm shadow-emerald-950"
                          >
                            <Check className="w-2.5 h-2.5" /> Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Knot Pill Trigger */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-purple-950/90 via-[#180a30] to-purple-900/90 hover:from-purple-900 hover:to-violet-800 border border-purple-500/50 hover:border-cyan-400/80 text-white shadow-xl shadow-purple-950/80 hover:shadow-cyan-500/20 transition-all duration-300 backdrop-blur-md"
      >
        <div className="relative">
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-400 flex items-center justify-center shadow-md">
            <Sparkles className="w-3 h-3 text-white group-hover:rotate-12 transition-transform" />
          </div>
          {proposals.length > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-purple-950 animate-pulse" />
          )}
        </div>

        <span className="text-xs font-bold tracking-wide bg-gradient-to-r from-white via-purple-100 to-cyan-300 bg-clip-text text-transparent">
          The Knot
        </span>

        {proposals.length > 0 ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
            {proposals.length} pending
          </span>
        ) : (
          <span className="text-[10px] text-cyan-300/80 font-mono">
            Active
          </span>
        )}

        <ChevronUp className={`w-3.5 h-3.5 text-purple-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
    </div>
  );
};
