import React, { useState } from "react";
import {
  X,
  Send,
  Shield,
  CheckCircle,
  AlertTriangle,
  Zap,
  Check,
  RotateCcw,
  Sparkles,
  MessageSquare,
  RefreshCw,
  Calendar,
  Mail,
  Users,
  Code2,
  Trash2,
  ExternalLink,
  Clock,
  ShieldAlert,
  ChevronRight
} from "lucide-react";
import { ShieldWingBot } from "../types/shieldwing";

interface WingmanChatDrawerProps {
  bot: ShieldWingBot | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "bot" | "system";
  text: string;
  timestamp: string;
  cardType?: "calendar" | "draft" | "leads" | "github" | "revocation";
  cardData?: any;
  trustBoundaryResult?: {
    category: "routine" | "consequential";
    status: "approved" | "paused" | "rejected";
    latencyMs: number;
    reason: string;
  };
}

export const WingmanChatDrawer: React.FC<WingmanChatDrawerProps> = ({
  bot,
  isOpen,
  onClose
}) => {
  if (!isOpen || !bot) return null;

  const [inputMsg, setInputMsg] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_init",
      sender: "bot",
      text: `Hello! I'm ${bot.name}, your ${bot.roleTitle}. I'm connected to ${bot.channels.join(", ")}. I can balance your calendar, triage your inbox with draft buffers, find verified leads with timed pacing, or deploy web code to GitHub Pages. How can I assist?`,
      timestamp: "Just now"
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Preset example prompts covering the user's specific capabilities
  const examplePrompts = [
    "Balance tomorrow's calendar: fit 2hr focus time and reschedule conflicts",
    "Scan unreplied emails and draft replies to Drafts folder (with safety buffer)",
    "Find 5 verified enterprise leads and prepare cold outreach with timed pacing",
    "Deploy repository to GitHub Pages with AST security check",
    "Revoke single-click tool access for Slack"
  ];

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputMsg).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "user",
      text,
      timestamp: "Just now"
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMsg("");
    setIsProcessing(true);

    setTimeout(() => {
      const lower = text.toLowerCase();

      // 1. Calendar Balancing capability
      if (lower.includes("calendar") || lower.includes("schedule") || lower.includes("focus time")) {
        const botReply: ChatMessage = {
          id: `msg_bot_${Date.now()}`,
          sender: "bot",
          text: "I analyzed your calendar availability, balanced your daily blocks, and carved out a 2-hour deep focus window without moving your high-priority client sessions.",
          timestamp: "Just now",
          cardType: "calendar",
          cardData: {
            title: "Tomorrow's Schedule Optimized",
            blocks: [
              { time: "09:00 AM - 10:00 AM", title: "Inbox Triage & Standup", type: "routine" },
              { time: "10:30 AM - 12:30 PM", title: "🛡️ Protected Deep Focus Time", type: "focus" },
              { time: "02:00 PM - 02:45 PM", title: "Enterprise Solution Architecture Review", type: "meeting" },
              { time: "04:00 PM - 04:30 PM", title: "Async Task Wrap-up", type: "routine" }
            ]
          },
          trustBoundaryResult: {
            category: "routine",
            status: "approved",
            latencyMs: 0.74,
            reason: "Internal calendar balancing auto-cleared under 0.85ms SLA"
          }
        };
        setMessages((prev) => [...prev, botReply]);
      }
      // 2. Email & Inbox Handling (Drafts with Safety Buffer & Auto-Unsubscribe)
      else if (lower.includes("email") || lower.includes("inbox") || lower.includes("draft") || lower.includes("reply")) {
        const botReply: ChatMessage = {
          id: `msg_bot_${Date.now()}`,
          sender: "bot",
          text: "I scanned your unreplied inbox messages and found 3 pending inquiries. I generated contextual drafts saved directly to your Drafts folder with a 15-minute safety buffer. I also unsubscribed from 2 promotional newsletters.",
          timestamp: "Just now",
          cardType: "draft",
          cardData: {
            unrepliedFound: 3,
            draftsSaved: [
              { to: "alex.m@clientcorp.io", subject: "Re: Q4 Security Audit Deliverables", status: "Draft Saved (Buffer Active)" },
              { to: "sarah@venturecapital.com", subject: "Re: AgentShield-X Technical Whitepaper", status: "Draft Saved (Buffer Active)" }
            ],
            unsubscribed: ["Daily Marketing Pulse Newsletter", "Promo Spam Blast"]
          },
          trustBoundaryResult: {
            category: "routine",
            status: "approved",
            latencyMs: 0.79,
            reason: "Draft creation and unsubscribing are low-stakes tasks (auto-approved)"
          }
        };
        setMessages((prev) => [...prev, botReply]);
      }
      // 3. Lead Gen & Timed Outreach Pacing (Spam Filter Safe)
      else if (lower.includes("lead") || lower.includes("outreach") || lower.includes("sales") || lower.includes("campaign")) {
        const isBulk = lower.includes("450") || lower.includes("blast") || lower.includes("mass");
        
        if (isBulk) {
          const botReply: ChatMessage = {
            id: `msg_bot_${Date.now()}`,
            sender: "bot",
            text: "I extracted and verified 450 enterprise security leads with personalized email copy. However, executing this cold outreach crosses your Consequential Trust Boundary: 'Mass outreach >25 leads requires 1-click confirmation'. Pacing will throttle to 1 email per 90 seconds to protect domain reputation.",
            timestamp: "Just now",
            cardType: "leads",
            cardData: {
              leadCount: 450,
              verifiedRate: "98.4%",
              pacing: "1 send every 90 seconds (anti-spam pacing)",
              channels: "Outlook / HubSpot CRM"
            },
            trustBoundaryResult: {
              category: "consequential",
              status: "paused",
              latencyMs: 0.81,
              reason: "Bulk email dispatch requires human-in-the-loop confirmation"
            }
          };
          setMessages((prev) => [...prev, botReply]);
        } else {
          const botReply: ChatMessage = {
            id: `msg_bot_${Date.now()}`,
            sender: "bot",
            text: "I extracted 5 verified enterprise prospect leads with roles, company dossiers, and personalized copy. Outreach is queued with anti-spam timed pacing.",
            timestamp: "Just now",
            cardType: "leads",
            cardData: {
              leadCount: 5,
              verifiedRate: "100%",
              pacing: "1 send every 90 seconds",
              channels: "HubSpot CRM"
            },
            trustBoundaryResult: {
              category: "routine",
              status: "approved",
              latencyMs: 0.72,
              reason: "Targeted lead synthesis <10 contacts is routine (auto-approved)"
            }
          };
          setMessages((prev) => [...prev, botReply]);
        }
      }
      // 4. Technical GitHub Pages Deployment with AST Gate
      else if (lower.includes("github") || lower.includes("deploy") || lower.includes("pages") || lower.includes("repo")) {
        const botReply: ChatMessage = {
          id: `msg_bot_${Date.now()}`,
          sender: "bot",
          text: "I analyzed the repository commits, verified AST security signatures, and dispatched the deployment build to GitHub Pages. All integrity checks passed.",
          timestamp: "Just now",
          cardType: "github",
          cardData: {
            repo: "agentshield-x-demo",
            branch: "gh-pages",
            astVerification: "Zero Malicious MCP Tools Found",
            liveUrl: "https://agentshield.github.io/web-demo"
          },
          trustBoundaryResult: {
            category: "routine",
            status: "approved",
            latencyMs: 0.85,
            reason: "GitHub Pages deploy with verified AST signature auto-cleared"
          }
        };
        setMessages((prev) => [...prev, botReply]);
      }
      // 5. Tool Revocation capability
      else if (lower.includes("revoke") || lower.includes("disconnect")) {
        const botReply: ChatMessage = {
          id: `msg_bot_${Date.now()}`,
          sender: "bot",
          text: "You can revoke any tool or integration with a single tap. Once revoked, all tokens are instantly expunged from the keychain.",
          timestamp: "Just now",
          cardType: "revocation",
          cardData: {
            toolName: "Slack Workspaces",
            status: "Active (Tap below to revoke)"
          },
          trustBoundaryResult: {
            category: "routine",
            status: "approved",
            latencyMs: 0.65,
            reason: "Security privilege revocation is immediately honored"
          }
        };
        setMessages((prev) => [...prev, botReply]);
      }
      // Generic fallback
      else {
        const botReply: ChatMessage = {
          id: `msg_bot_${Date.now()}`,
          sender: "bot",
          text: `Task received! I evaluated your request against the safety AST in 0.76ms, executed the background flow, and synced updates across ${bot.channels.slice(0, 2).join(" & ")}.`,
          timestamp: "Just now",
          trustBoundaryResult: {
            category: "routine",
            status: "approved",
            latencyMs: 0.76,
            reason: "Routine low-stakes task executed silently within autonomy boundary"
          }
        };
        setMessages((prev) => [...prev, botReply]);
      }

      setIsProcessing(false);
    }, 400);
  };

  const handleResolveConsequential = (msgId: string, decision: "approve" | "reject") => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId && m.trustBoundaryResult) {
          return {
            ...m,
            trustBoundaryResult: {
              ...m.trustBoundaryResult,
              status: decision === "approve" ? "approved" : "rejected"
            }
          };
        }
        return m;
      })
    );

    const followUpMsg: ChatMessage = {
      id: `msg_sys_${Date.now()}`,
      sender: "system",
      text:
        decision === "approve"
          ? `✅ Operation confirmed by user via WhatsApp: Outreach dispatched with 90s anti-spam pacing.`
          : `🛑 Operation quashed by human: Zero emails sent. All contacts preserved.`,
      timestamp: "Just now"
    };

    setMessages((prev) => [...prev, followUpMsg]);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] bg-[#0d0e11] border-l border-[#2a2d34] shadow-2xl flex flex-col font-sans animate-fade-in">
      {/* Top Header */}
      <div className="px-5 py-4 border-b border-[#1f1638] bg-[#141518] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#202226] border border-[#a855f7]/40 shadow-md">
            <img src={bot.avatar} alt={bot.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-chakra font-bold text-white text-base flex items-center space-x-2">
              <span>{bot.name}</span>
              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
            </div>
            <div className="text-[11px] font-mono text-[#a9a9aa]">{bot.roleTitle}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#a9a9aa] hover:text-white hover:bg-[#202226] transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Trust Boundary Pill Banner */}
      <div className="px-5 py-2.5 bg-[#120a24] border-b border-[#1f1638] flex items-center justify-between text-[11px] font-mono text-[#c084fc]">
        <div className="flex items-center space-x-1.5">
          <Shield className="w-3.5 h-3.5 text-[#a855f7]" />
          <span>Tiered Action Safeguards: ACTIVE (0.85ms SLA)</span>
        </div>
        <span className="text-[#9ba1a6]">No API Keys Needed</span>
      </div>

      {/* Chat Messages Scrollable Body */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.sender === "user"
                ? "items-end"
                : m.sender === "system"
                ? "items-center"
                : "items-start"
            }`}
          >
            {m.sender === "system" ? (
              <div className="px-3.5 py-2 rounded-xl bg-[#1f1638] text-[11px] font-mono text-[#e9d5ff] border border-[#a855f7]/30 text-center max-w-[90%]">
                {m.text}
              </div>
            ) : (
              <div className="max-w-[88%] space-y-2.5">
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    m.sender === "user"
                      ? "bg-[#a855f7] text-white rounded-br-none shadow-md shadow-[#a855f7]/20"
                      : "bg-[#141518] text-[#e8eef7] border border-[#2a2d34] rounded-bl-none shadow-lg"
                  }`}
                >
                  {m.text}
                </div>

                {/* Capability Rich Action Cards */}
                {m.cardType === "calendar" && m.cardData && (
                  <div className="p-3.5 rounded-2xl bg-[#08090b] border border-[#a855f7]/40 space-y-2 text-xs">
                    <div className="flex items-center space-x-2 text-[#a855f7] font-bold text-[11px] font-mono">
                      <Calendar className="w-4 h-4" />
                      <span>{m.cardData.title}</span>
                    </div>
                    <div className="space-y-1.5">
                      {m.cardData.blocks.map((b: any, idx: number) => (
                        <div key={idx} className={`p-2 rounded-lg flex items-center justify-between text-[11px] ${
                          b.type === "focus"
                            ? "bg-[#1f1638] text-[#c084fc] font-bold border border-[#a855f7]/30"
                            : "bg-[#141518] text-[#cbd5e1]"
                        }`}>
                          <span>{b.title}</span>
                          <span className="font-mono text-[10px] text-[#9ba1a6]">{b.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {m.cardType === "draft" && m.cardData && (
                  <div className="p-3.5 rounded-2xl bg-[#08090b] border border-[#3b82f6]/40 space-y-2.5 text-xs">
                    <div className="flex items-center space-x-2 text-[#3b82f6] font-bold text-[11px] font-mono">
                      <Mail className="w-4 h-4" />
                      <span>Contextual Responses (15m Safety Buffer)</span>
                    </div>
                    <div className="space-y-1.5">
                      {m.cardData.draftsSaved.map((d: any, idx: number) => (
                        <div key={idx} className="p-2 rounded-lg bg-[#141518] border border-[#2a2d34] text-[11px]">
                          <div className="text-white font-medium">{d.subject}</div>
                          <div className="text-[#9ba1a6] text-[10px] flex items-center justify-between mt-0.5">
                            <span>To: {d.to}</span>
                            <span className="text-[#22c55e] font-mono">{d.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] text-[#f59e0b] font-mono">
                      ✓ Auto-unsubscribed from 2 newsletters
                    </div>
                  </div>
                )}

                {m.cardType === "leads" && m.cardData && (
                  <div className="p-3.5 rounded-2xl bg-[#08090b] border border-[#f59e0b]/40 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#f59e0b] font-bold flex items-center space-x-1.5">
                        <Users className="w-4 h-4" />
                        <span>Lead Gen & Timed Pacing</span>
                      </span>
                      <span className="text-[#22c55e]">{m.cardData.verifiedRate} Verified</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#141518] border border-[#2a2d34] text-[11px] text-[#cbd5e1] space-y-1 font-mono">
                      <div className="flex justify-between">
                        <span>Total Target Leads:</span>
                        <span className="text-white font-bold">{m.cardData.leadCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Anti-Spam Pacing:</span>
                        <span className="text-[#c084fc]">{m.cardData.pacing}</span>
                      </div>
                    </div>
                  </div>
                )}

                {m.cardType === "github" && m.cardData && (
                  <div className="p-3.5 rounded-2xl bg-[#08090b] border border-[#10b981]/40 space-y-2 text-xs">
                    <div className="flex items-center space-x-2 text-[#10b981] font-bold text-[11px] font-mono">
                      <Code2 className="w-4 h-4" />
                      <span>GitHub Pages Deployment Live</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#141518] border border-[#2a2d34] text-[11px] font-mono space-y-1">
                      <div className="text-[#cbd5e1]">Repo: {m.cardData.repo} ({m.cardData.branch})</div>
                      <div className="text-[#22c55e] text-[10px]">🛡️ {m.cardData.astVerification}</div>
                      <a
                        href={m.cardData.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#a855f7] hover:underline flex items-center space-x-1 pt-1"
                      >
                        <span>View Live Deployment</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                {m.cardType === "revocation" && m.cardData && (
                  <div className="p-3.5 rounded-2xl bg-[#08090b] border border-red-500/40 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-red-400 font-bold flex items-center space-x-1.5">
                        <Trash2 className="w-4 h-4" />
                        <span>Single-Tap Tool Revocation</span>
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#141518] border border-[#2a2d34] text-[11px] flex items-center justify-between">
                      <span className="text-white">{m.cardData.toolName}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const followUp: ChatMessage = {
                            id: `msg_sys_${Date.now()}`,
                            sender: "system",
                            text: `🔒 Single-Tap Revocation: ${m.cardData.toolName} tokens expunged from keychain. Access severed immediately.`,
                            timestamp: "Just now"
                          };
                          setMessages((prev) => [...prev, followUp]);
                        }}
                        className="px-2.5 py-1 rounded-md bg-red-950/60 text-red-300 border border-red-500/50 hover:bg-red-900 transition-all font-mono text-[10px]"
                      >
                        Revoke Access Now
                      </button>
                    </div>
                  </div>
                )}

                {/* Trust Boundary Result Box if present */}
                {m.trustBoundaryResult && (
                  <div
                    className={`p-3 rounded-xl text-xs font-mono border space-y-2 ${
                      m.trustBoundaryResult.category === "routine"
                        ? "bg-[#082813]/60 border-[#22c55e]/40 text-[#22c55e]"
                        : "bg-[#271506]/60 border-[#f59e0b]/40 text-[#f59e0b]"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-[11px]">
                      <span>
                        {m.trustBoundaryResult.category === "routine"
                          ? "⚡ ROUTINE TASK (0.76ms Auto-Cleared)"
                          : "🛑 CONSEQUENTIAL GATE TRIGGERED"}
                      </span>
                      <span>{m.trustBoundaryResult.status.toUpperCase()}</span>
                    </div>

                    <p className="text-[11px] text-[#cbd5e1] font-sans">
                      {m.trustBoundaryResult.reason}
                    </p>

                    {/* Interactive Confirmation Buttons for Paused Consequential Actions */}
                    {m.trustBoundaryResult.status === "paused" && (
                      <div className="pt-1 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleResolveConsequential(m.id, "approve")}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-[#22c55e] text-black font-bold font-sans text-xs hover:bg-[#16a34a] transition-all"
                        >
                          Confirm via WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveConsequential(m.id, "reject")}
                          className="flex-1 py-1.5 px-3 rounded-lg border border-red-500/40 bg-red-950/40 text-red-300 font-bold font-sans text-xs hover:bg-red-950/70 transition-all"
                        >
                          Reject & Abort
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-[10px] text-[#666] font-mono px-1">{m.timestamp}</div>
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center space-x-2 text-xs font-mono text-[#a855f7] p-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>AgentShield-X AST Evaluating Intent & Safety Buffers...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-5 py-2.5 border-t border-[#1f1638] bg-[#08090b]/80 flex items-center gap-1.5 overflow-x-auto text-[11px] font-sans">
        <span className="text-[#a9a9aa] whitespace-nowrap text-[10px] font-mono">Suggested:</span>
        {examplePrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(p)}
            className="px-2.5 py-1 rounded-full bg-[#141518] hover:bg-[#202226] text-[#cbd5e1] border border-[#2a2d34] whitespace-nowrap transition-all"
          >
            {p.length > 30 ? p.substring(0, 30) + "..." : p}
          </button>
        ))}
      </div>

      {/* Message Input Box */}
      <div className="p-4 border-t border-[#1f1638] bg-[#141518]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder={`Instruct ${bot.name} (Calendar, Email, Leads, Deploy, Revoke)...`}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#0d0e11] border border-[#2a2d34] text-white text-xs font-sans focus:outline-none focus:border-[#a855f7] transition-all"
          />
          <button
            type="submit"
            disabled={!inputMsg.trim() || isProcessing}
            className="p-2.5 rounded-xl bg-[#a855f7] text-white hover:bg-[#9333ea] transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
