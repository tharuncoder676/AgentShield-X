import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bot,
  MessageSquare,
  Clock,
  Sliders,
  Sparkles,
  Send,
  Plus,
  Percent,
  Mic,
  MicOff,
  X,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Shield,
  Zap,
  Cpu,
  Layers,
  Terminal,
  FileCode,
  Calendar,
  Globe,
  Settings,
  ArrowRight,
  Check,
  Copy,
} from "lucide-react";
import { ConnectorsHubModal } from "../components/ConnectorsHubModal";
import { Connector } from "../data/connectorsCatalog";

interface TaskItem {
  id: string;
  name: string;
  schedule: string;
  scheduleHuman: string;
  enabled: boolean;
  connectors: string[];
  lastRun?: string;
  lastStatus?: "success" | "failed" | "running";
  prompt: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  thinkingSteps?: string[];
  toolCalls?: Array<{
    tool: string;
    args: Record<string, any>;
    status: "running" | "success" | "blocked";
    result?: string;
  }>;
  trustApproval?: {
    action: string;
    consequences: string;
    approved?: boolean;
  };
}

export const ShieldWingStudio: React.FC = () => {
  const navigate = useNavigate();

  // Navigation & View tabs
  const [activeTab, setActiveTab] = useState<"chat" | "tasks">("chat");
  const [agentName, setAgentName] = useState("Wingman");
  const [isConnectorsModalOpen, setIsConnectorsModalOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [showAppsBanner, setShowAppsBanner] = useState(true);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [micAudioWave, setMicAudioWave] = useState<number[]>([40, 60, 30, 80, 50, 90, 70, 40]);

  // Input state
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // Workflow Automations (Tasks)
  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: "task-briefing",
      name: "Daily Morning Briefing",
      schedule: "0 7 * * *",
      scheduleHuman: "7:30 AM every morning",
      enabled: true,
      connectors: ["GitHub", "Slack", "Gmail", "Jira"],
      lastRun: "Today, 7:30 AM",
      lastStatus: "success",
      prompt: "Synthesize pull requests, unread Slack alerts, top Jira blockers, and emails from yesterday into an executive brief.",
    },
    {
      id: "task-pr-linter",
      name: "GitHub PR AST Security & Taint Linter",
      schedule: "on_pr_opened",
      scheduleHuman: "On every pull request opened",
      enabled: true,
      connectors: ["GitHub", "Semgrep", "Discord"],
      lastRun: "12 mins ago",
      lastStatus: "success",
      prompt: "Parse AST tree for newly opened pull requests, verify taint propagation, and post inline comments on security violations.",
    },
    {
      id: "task-hubspot-outreach",
      name: "HubSpot & Apollo Outreach Pipeline",
      schedule: "0 */4 * * *",
      scheduleHuman: "Every 4 hours",
      enabled: true,
      connectors: ["HubSpot", "Apollo", "Gmail", "Salesforce"],
      lastRun: "2 hours ago",
      lastStatus: "success",
      prompt: "Enrich high-intent inbound visitors with Apollo data, update HubSpot CRM records, and draft tailored executive outreach.",
    },
    {
      id: "task-inbox-triage",
      name: "Executive Inbox Triage & Spam Defense",
      schedule: "*/15 * * * *",
      scheduleHuman: "Every 15 minutes",
      enabled: false,
      connectors: ["Gmail", "Outlook", "Slack"],
      lastRun: "Yesterday, 6:00 PM",
      lastStatus: "success",
      prompt: "Filter incoming inbox items, label high-priority customer requests, and ping urgent items on Slack.",
    },
  ]);

  // Active execution state for "Run Now"
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const [taskExecutionLogs, setTaskExecutionLogs] = useState<{ id: string; logs: string[] } | null>(null);

  // Chat conversation
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Audio waveform animation when recording
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setMicAudioWave(
          Array.from({ length: 8 }, () => Math.floor(Math.random() * 80) + 20)
        );
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Toggle task enabled
  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, enabled: !t.enabled } : t))
    );
  };

  // Run task immediately
  const handleRunTask = (task: TaskItem) => {
    setRunningTaskId(task.id);
    const logs: string[] = [
      `[${new Date().toLocaleTimeString()}] Triggering workflow automation: "${task.name}"`,
      `[${new Date().toLocaleTimeString()}] Resolving bound connectors: ${task.connectors.join(", ")}`,
      `[${new Date().toLocaleTimeString()}] Dual-Rail Policy Verification: deterministic validation OK`,
      `[${new Date().toLocaleTimeString()}] Executing prompt: "${task.prompt.substring(0, 60)}..."`,
      `[${new Date().toLocaleTimeString()}] Synthesizing multi-modal connector outputs...`,
      `[${new Date().toLocaleTimeString()}] Execution completed in 1,240ms. Status: 200 OK`,
    ];
    setTaskExecutionLogs({ id: task.id, logs });

    setTimeout(() => {
      setRunningTaskId(null);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, lastRun: "Just now", lastStatus: "success" } : t
        )
      );
    }, 1500);
  };

  // Apply starter prompt
  const handleApplyStarterPrompt = () => {
    const starterPrompt =
      "Set up a recurring Daily Briefing for me at 7:30 AM every morning in my local time zone, and send me one right now for yesterday. Use yesterday's date for news, market close, and emails received yesterday. Title it 'Yesterday's Briefing — Today'.";
    handleSendMessage(starterPrompt);
  };

  // Send message
  const handleSendMessage = (customText?: string) => {
    const query = (customText || inputValue).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputValue("");
    setIsThinking(true);

    // Simulate Agent execution with thoughts and tool call
    setTimeout(() => {
      setIsThinking(false);

      if (query.toLowerCase().includes("briefing") || query.toLowerCase().includes("daily")) {
        const agentMsg: ChatMessage = {
          id: `agent-${Date.now()}`,
          sender: "agent",
          text: `### Yesterday's Briefing — ${new Date(Date.now() - 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}\n\n**1. Pull Requests & Codebase:**\n- 3 PRs merged to \`main\` (Auth hardening, Connectors Hub 300+, Webhook dispatcher).\n- 1 security review pending: PR #412 (*Taint Analysis on MCP Proxy Tool Calls*).\n\n**2. System & Security Telemetry:**\n- 0 unauthorized privilege escalations. Dual-rail guardrails intercepted 14 prompt injections.\n- Average API latency: 18ms across all active nodes.\n\n**3. Calendar & Communications:**\n- 4 unread high-priority emails flagged in Gmail.\n- Customer Support triage bot resolved 18 tickets automatically.\n\n---\n*Recurring automation scheduled: Runs daily at 7:30 AM.*`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          thinkingSteps: [
            "Parsed scheduling request: '7:30 AM daily'",
            "Registered cron schedule: '0 7 * * *' into AgentShield-X Automation Engine",
            "Queried GitHub API for merged PRs in past 24 hours",
            "Scanned Gmail and Slack for high-priority unread items",
            "Checked security telemetry via AgentShield-X decision engine",
          ],
          toolCalls: [
            {
              tool: "cron.schedule_task",
              args: { schedule: "0 7 * * *", name: "Daily Morning Briefing" },
              status: "success",
              result: "Task registered with ID 'task-briefing-auto'",
            },
            {
              tool: "github.list_prs",
              args: { state: "all", since: "24h" },
              status: "success",
              result: "Fetched 4 pull requests",
            },
          ],
        };
        setMessages((prev) => [...prev, agentMsg]);
      } else if (query.toLowerCase().includes("pr") || query.toLowerCase().includes("github")) {
        const agentMsg: ChatMessage = {
          id: `agent-${Date.now()}`,
          sender: "agent",
          text: `Found **3 open Pull Requests** on \`github.com/AgentShield-X\`:\n\n1. **#418: chore: Add 300+ Universal App Connectors** — *Ready to merge, AST linter passed.*\n2. **#417: fix(auth): Remove Apple Auth and enforce deterministic JWT** — *Merged cleanly.*\n3. **#415: feat(security): Consequential action dual-rail gatekeeper** — *Awaiting review.*\n\nWould you like me to run an automated AST taint audit on PR #418 or post an inline approval?`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          thinkingSteps: [
            "Authenticating via GitHub connector token",
            "Executing 'github.list_pull_requests' on active repository",
            "Running AST safety check on PR diffs",
          ],
          toolCalls: [
            {
              tool: "github.list_pull_requests",
              args: { repo: "AgentShield-X", state: "open" },
              status: "success",
              result: "Found 3 PRs",
            },
          ],
        };
        setMessages((prev) => [...prev, agentMsg]);
      } else {
        const agentMsg: ChatMessage = {
          id: `agent-${Date.now()}`,
          sender: "agent",
          text: `I've analyzed your instruction: "${query}".\n\nI have 312 universal connectors ready to dispatch this action with full AgentShield-X dual-rail trust boundary enforcement. Let me know if you would like me to chain this into a recurring schedule in your **Tasks** tab or execute immediately!`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          thinkingSteps: [
            "Analyzing prompt intent and target tools",
            "Validating against dual-rail Trust Boundary policies",
            "Simulating execution blast radius",
          ],
        };
        setMessages((prev) => [...prev, agentMsg]);
      }
    }, 1000);
  };

  const handleVoiceToggle = () => {
    if (!isRecording) {
      setIsRecording(true);
      // If browser SpeechRecognition is available, we could bind it
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
              .map((r: any) => r[0].transcript)
              .join("");
            setInputValue(transcript);
          };
          recognition.onerror = () => setIsRecording(false);
          recognition.onend = () => setIsRecording(false);
          recognition.start();
        } catch {
          // Fallback simulation
          setTimeout(() => {
            setInputValue("Connect GitHub and check PRs for security vulnerabilities");
            setIsRecording(false);
          }, 3000);
        }
      } else {
        // Fallback simulation
        setTimeout(() => {
          setInputValue("Connect GitHub and check PRs for security vulnerabilities");
          setIsRecording(false);
        }, 3000);
      }
    } else {
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080d] text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      
      {/* TOP HEADER: Matches uploaded screenshot */}
      <header className="h-14 border-b border-white/5 bg-[#0b0c13] px-4 flex items-center justify-between sticky top-0 z-30">
        
        {/* Left: Sidebar toggle + Cyan Wingman Pill */}
        <div className="flex items-center gap-3">
          <Link
            to="/overview"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            title="Return to Console Overview"
          >
            <Layers size={18} />
          </Link>

          {/* Cyan Glowing Pill button: "Wingman" */}
          <button
            onClick={() => setIsSetupModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-400 text-black font-semibold text-xs tracking-wide shadow-md shadow-cyan-400/20 hover:bg-cyan-300 transition-all cursor-pointer"
          >
            <Bot size={15} className="text-black fill-black" />
            <span>{agentName}</span>
          </button>
        </div>

        {/* Right: Upgrade Plan + Green Counter + Setup */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/billing")}
            className="px-3 py-1 rounded-full bg-white text-black font-semibold text-xs hover:bg-slate-200 transition-colors shadow-sm"
          >
            Upgrade Plan
          </button>

          <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-mono text-xs font-bold">
            0
          </span>

          <button
            onClick={() => setIsSetupModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors border border-white/5"
          >
            <Sliders size={14} />
            <span>Setup</span>
          </button>
        </div>
      </header>

      {/* SUB-HEADER / VIEW TABS: Chat vs Tasks */}
      <div className="h-11 border-b border-white/5 bg-[#090a10] px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 py-2 text-xs font-medium transition-colors relative ${
              activeTab === "chat" ? "text-cyan-400" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                activeTab === "chat" ? "bg-cyan-400 shadow-sm shadow-cyan-400" : "bg-transparent"
              }`}
            />
            <MessageSquare size={14} />
            <span>Chat</span>
          </button>

          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center gap-2 py-2 text-xs font-medium transition-colors relative ${
              activeTab === "tasks" ? "text-cyan-400" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock size={14} />
            <span>Tasks</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-slate-300 font-mono">
              {tasks.filter((t) => t.enabled).length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <Shield size={12} className="text-cyan-400" />
            <span>Dual-Rail Guard Active</span>
          </span>
          <button
            onClick={() => setIsSetupModalOpen(true)}
            className="flex items-center gap-1 text-slate-400 hover:text-white"
          >
            <Settings size={13} />
            <span>Setup</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER: Left Avatar Rail + Content Viewport */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT NAV RAIL: Avatar + Plus Button */}
        <div className="w-16 border-r border-white/5 bg-[#0a0b12] flex flex-col items-center justify-between py-4">
          <div className="flex flex-col items-center gap-4">
            {/* Circular Agent Avatar with Cyan Glow */}
            <div
              onClick={() => setIsSetupModalOpen(true)}
              className="relative w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 shadow-lg shadow-cyan-500/20 cursor-pointer hover:scale-105 transition-transform"
              title={`${agentName} - Click to configure`}
            >
              <div className="w-full h-full rounded-full bg-[#0e111a] flex items-center justify-center overflow-hidden">
                <Bot size={22} className="text-cyan-300" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0a0b12]" />
            </div>

            {/* Plus (+) Button for new agent / new automation */}
            <button
              onClick={() => {
                if (activeTab === "tasks") {
                  setIsNewTaskModalOpen(true);
                } else {
                  setMessages([]);
                }
              }}
              className="w-8 h-8 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              title={activeTab === "tasks" ? "Create New Automation" : "New Chat Session"}
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Bottom Rail Icon */}
          <div className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer" title="AgentShield-X Engine 2.4">
            <Shield size={18} />
          </div>
        </div>

        {/* WORKSPACE VIEWPORT */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#07080e]">
          
          {/* TAB 1: CHAT VIEW */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-y-auto px-4 pb-48 pt-6">
              
              {/* STARTER CARD: Exactly matching the uploaded mockup */}
              {messages.length === 0 && (
                <div className="max-w-2xl mx-auto w-full my-auto space-y-4 animate-fadeIn">
                  
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <span>Try this prompt for daily summary:</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-[11px] text-slate-300 font-mono">
                      Today
                    </span>
                  </div>

                  {/* The Daily Briefing Starter Prompt Box */}
                  <div
                    onClick={handleApplyStarterPrompt}
                    className="group p-6 rounded-2xl bg-[#0f121d]/90 border border-white/5 hover:border-cyan-500/40 transition-all duration-300 cursor-pointer shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-500/10 text-cyan-300 border-b border-l border-cyan-500/20 text-[10px] font-mono uppercase tracking-wider rounded-bl-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <span>Click to Execute</span>
                      <ArrowRight size={10} />
                    </div>

                    <div className="space-y-5 text-sm text-slate-200">
                      <div>
                        <h4 className="font-bold text-white mb-1.5 flex items-center gap-2">
                          <span>1. Set up the Daily Briefing</span>
                        </h4>
                        <p className="text-slate-400 text-xs pl-3 border-l border-white/10">
                          - Set up a recurring Daily Briefing for me, and send me one right now for yesterday.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-white mb-1.5 flex items-center gap-2">
                          <span>2. Scheduling</span>
                        </h4>
                        <ul className="text-slate-400 text-xs space-y-1 pl-3 border-l border-white/10">
                          <li>- Create a recurring task that runs every morning at 7:30 AM in my local time zone.</li>
                          <li>- Send me that day's briefing every morning.</li>
                          <li>- Before scheduling, generate and send a briefing for yesterday.</li>
                          <li>- Use yesterday's date for news, market close, and emails received yesterday.</li>
                          <li>- Title it &quot;Yesterday's Briefing — [date]&quot;.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <p className="text-center text-xs text-slate-500">
                    Click the card above or type a command below to dispatch actions across your connected tools.
                  </p>
                </div>
              )}

              {/* MESSAGES THREAD */}
              {messages.length > 0 && (
                <div className="max-w-3xl mx-auto w-full space-y-6 pt-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3.5 ${
                        msg.sender === "user" ? "justify-end" : "justify-start"
                      } animate-fadeIn`}
                    >
                      {msg.sender === "agent" && (
                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 mt-1">
                          <Bot size={16} />
                        </div>
                      )}

                      <div
                        className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-cyan-500 text-black font-medium shadow-md shadow-cyan-500/20"
                            : "bg-[#111422] border border-white/10 text-slate-200 shadow-lg"
                        }`}
                      >
                        {/* Thinking Steps Disclosure */}
                        {msg.thinkingSteps && msg.thinkingSteps.length > 0 && (
                          <div className="mb-3 p-2.5 rounded-lg bg-black/40 border border-white/5 text-[11px] font-mono text-cyan-300 space-y-1">
                            <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1 font-sans">
                              <Sparkles size={11} className="text-cyan-400" />
                              <span>Autonomous Agent Chain of Thought</span>
                            </div>
                            {msg.thinkingSteps.map((step, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-slate-300">
                                <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Tool Calls Summary */}
                        {msg.toolCalls && msg.toolCalls.length > 0 && (
                          <div className="mb-3 space-y-1.5">
                            {msg.toolCalls.map((tc, idx) => (
                              <div
                                key={idx}
                                className="p-2 rounded bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between text-[11px] font-mono text-cyan-200"
                              >
                                <span className="flex items-center gap-1.5">
                                  <Terminal size={12} className="text-cyan-400" />
                                  <span>{tc.tool}</span>
                                </span>
                                <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                                  <Check size={10} /> {tc.result}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="whitespace-pre-wrap">{msg.text}</div>

                        <div
                          className={`mt-2 text-[10px] text-right ${
                            msg.sender === "user" ? "text-black/60" : "text-slate-500"
                          }`}
                        >
                          {msg.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Thinking Pulse Indicator */}
                  {isThinking && (
                    <div className="flex gap-3.5 items-center text-xs text-cyan-400 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                        <Bot size={16} />
                      </div>
                      <div className="p-3 rounded-2xl bg-[#111422] border border-cyan-500/20 flex items-center gap-2">
                        <RefreshCw size={12} className="animate-spin text-cyan-400" />
                        <span>{agentName} is thinking & analyzing 300+ connected tools...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TASKS VIEW (WORKFLOW AUTOMATION ENGINE) */}
          {activeTab === "tasks" && (
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              
              {/* Header Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#121629] to-[#0c0e17] border border-cyan-500/20 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold font-sora text-white">
                      Automated Workflows & Recurring Schedules
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Dual-Rail Cron Engine
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Scheduled tasks run autonomously via deterministic proxy and respect human signoff rules.
                  </p>
                </div>

                <button
                  onClick={() => setIsNewTaskModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-400/20"
                >
                  <Plus size={15} />
                  <span>New Workflow Automation</span>
                </button>
              </div>

              {/* Automation Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#0f111a] border border-white/5">
                  <span className="text-[11px] text-slate-400 uppercase font-chakra tracking-wider">
                    Active Automations
                  </span>
                  <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">
                    {tasks.filter((t) => t.enabled).length}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0f111a] border border-white/5">
                  <span className="text-[11px] text-slate-400 uppercase font-chakra tracking-wider">
                    Next Trigger
                  </span>
                  <div className="text-sm font-semibold font-mono text-emerald-400 mt-2">
                    Tomorrow, 7:30 AM
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0f111a] border border-white/5">
                  <span className="text-[11px] text-slate-400 uppercase font-chakra tracking-wider">
                    Success Rate (24h)
                  </span>
                  <div className="text-2xl font-bold font-mono text-white mt-1">
                    99.8%
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0f111a] border border-white/5">
                  <span className="text-[11px] text-slate-400 uppercase font-chakra tracking-wider">
                    Trust Boundary Enforced
                  </span>
                  <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                    100%
                  </div>
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-3">
                {tasks.map((task) => {
                  const isRunning = runningTaskId === task.id;

                  return (
                    <div
                      key={task.id}
                      className={`p-5 rounded-xl border transition-all ${
                        task.enabled
                          ? "bg-[#101321] border-cyan-500/20 hover:border-cyan-500/40"
                          : "bg-[#0c0d14] border-white/5 opacity-70"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        
                        <div className="space-y-1 max-w-xl">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-white">
                              {task.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-slate-300">
                              {task.scheduleHuman}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 leading-relaxed">
                            {task.prompt}
                          </p>

                          {/* Bound Connectors */}
                          <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] text-slate-500 font-mono">Bound Tools:</span>
                            {task.connectors.map((c, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleRunTask(task)}
                            disabled={isRunning}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                              isRunning
                                ? "bg-cyan-500/20 text-cyan-300 animate-pulse"
                                : "bg-white/10 hover:bg-white/20 text-white"
                            }`}
                          >
                            {isRunning ? (
                              <>
                                <RefreshCw size={12} className="animate-spin" />
                                <span>Executing...</span>
                              </>
                            ) : (
                              <>
                                <Play size={12} className="fill-white" />
                                <span>Run Now</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleToggleTask(task.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              task.enabled
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                                : "bg-slate-800 text-slate-400 hover:text-white"
                            }`}
                          >
                            {task.enabled ? "Active" : "Paused"}
                          </button>
                        </div>

                      </div>

                      {/* Last Run Status */}
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              task.lastStatus === "success" ? "bg-emerald-400" : "bg-amber-400"
                            }`}
                          />
                          <span>Last execution: {task.lastRun}</span>
                        </span>

                        <span className="text-slate-500">Cron: {task.schedule}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Execution Logs Drawer if active */}
              {taskExecutionLogs && (
                <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/30 text-xs font-mono space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-cyan-300 font-bold pb-2 border-b border-white/10">
                    <span className="flex items-center gap-2">
                      <Terminal size={14} />
                      <span>Live Automation Dispatch Logs</span>
                    </span>
                    <button
                      onClick={() => setTaskExecutionLogs(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="space-y-1 text-slate-300">
                    {taskExecutionLogs.logs.map((log, idx) => (
                      <div key={idx}>{log}</div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* FLOATING BOTTOM DOCK: Exact replica of the uploaded image */}
          <div className="absolute bottom-4 left-0 right-0 px-4 flex flex-col items-center pointer-events-none">
            <div className="w-full max-w-2xl pointer-events-auto space-y-2">
              
              {/* TOP ATTACHED BANNER: "(X) (GitHub) (Slack) (+300) Let Wingman run apps for you [Connect] [x]" */}
              {showAppsBanner && (
                <div className="p-2.5 px-4 rounded-2xl bg-[#141824]/95 border border-cyan-500/30 shadow-2xl backdrop-blur-md flex items-center justify-between text-xs animate-fadeIn">
                  
                  {/* Left: Icons cluster + text */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center -space-x-1.5">
                      <div
                        onClick={() => setIsConnectorsModalOpen(true)}
                        className="w-6 h-6 rounded-full bg-black border border-white/20 flex items-center justify-center font-bold text-[10px] text-white hover:scale-110 transition-transform cursor-pointer"
                        title="Twitter / X Connector"
                      >
                        𝕏
                      </div>
                      <div
                        onClick={() => setIsConnectorsModalOpen(true)}
                        className="w-6 h-6 rounded-full bg-[#1e2330] border border-white/20 flex items-center justify-center font-bold text-[10px] text-white hover:scale-110 transition-transform cursor-pointer"
                        title="GitHub Connector"
                      >
                        <FileCode size={12} className="text-purple-400" />
                      </div>
                      <div
                        onClick={() => setIsConnectorsModalOpen(true)}
                        className="w-6 h-6 rounded-full bg-[#3c1445] border border-white/20 flex items-center justify-center font-bold text-[10px] text-white hover:scale-110 transition-transform cursor-pointer"
                        title="Slack Connector"
                      >
                        <MessageSquare size={12} className="text-emerald-400" />
                      </div>
                      <div
                        onClick={() => setIsConnectorsModalOpen(true)}
                        className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 font-mono text-[10px] font-bold text-cyan-300 hover:scale-105 transition-transform cursor-pointer"
                        title="Click to view all 312 Universal Connectors"
                      >
                        +300
                      </div>
                    </div>

                    <span className="font-semibold text-white tracking-wide text-xs">
                      Let {agentName} run apps for you
                    </span>
                  </div>

                  {/* Right: Connect button + Dismiss */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsConnectorsModalOpen(true)}
                      className="px-3.5 py-1 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors shadow-sm shadow-cyan-500/30"
                    >
                      Connect
                    </button>
                    <button
                      onClick={() => setShowAppsBanner(false)}
                      className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                      title="Dismiss banner"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* MAIN INPUT CONTAINER: Rounded dark box with (+), (%), mic and send */}
              <div className="p-2.5 px-4 rounded-2xl bg-[#12151f]/95 border border-cyan-500/25 shadow-2xl backdrop-blur-md flex items-center gap-3">
                
                {/* Left: Plus (+) and Percent (%) buttons */}
                <div className="flex items-center gap-1.5 text-slate-400">
                  <button
                    onClick={() => setIsConnectorsModalOpen(true)}
                    className="p-1.5 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                    title="Attach Context, Document, or File"
                  >
                    <Plus size={16} />
                  </button>

                  <button
                    onClick={() => setIsConnectorsModalOpen(true)}
                    className="p-1.5 hover:text-cyan-400 rounded-lg hover:bg-white/5 transition-colors"
                    title="Insert Variable, Skill, or Connector"
                  >
                    <Percent size={14} />
                  </button>
                </div>

                {/* Input Text Box */}
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Reply to ${agentName}...`}
                  className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                />

                {/* Right: Mic Button + Send Button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleVoiceToggle}
                    className={`p-2 rounded-full transition-all ${
                      isRecording
                        ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                    title={isRecording ? "Stop voice listening" : "Click to speak with Wingman"}
                  >
                    <Mic size={15} />
                  </button>

                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim()}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      inputValue.trim()
                        ? "bg-cyan-400 text-black shadow-md shadow-cyan-400/30 hover:bg-cyan-300"
                        : "bg-white/5 text-slate-600 cursor-not-allowed"
                    }`}
                  >
                    <Send size={14} className="ml-0.5" />
                  </button>
                </div>
              </div>

              {/* QUICK PROMPT PILLS: Exact replica of the pills underneath */}
              <div className="flex items-center justify-center gap-2 overflow-x-auto text-[11px] text-slate-400 py-1">
                <button
                  onClick={() => handleSendMessage("Connect GitHub and check PRs for open security issues")}
                  className="px-3 py-1 rounded-full bg-black/40 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span className="font-mono text-cyan-400">&lt;/&gt;</span>
                  <span>Connect GitHub and check PRs</span>
                </button>

                <button
                  onClick={() => handleSendMessage("Connect GitHub and write release notes for the latest sprint")}
                  className="px-3 py-1 rounded-full bg-black/40 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span className="font-mono text-cyan-400">&lt;/&gt;</span>
                  <span>Connect GitHub and write release notes</span>
                </button>

                <button
                  onClick={() => handleSendMessage("Set up WhatsApp and Telegram webhook forwarder for incident notifications")}
                  className="px-3 py-1 rounded-full bg-black/40 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 whitespace-nowrap"
                >
                  <MessageSquare size={12} className="text-emerald-400" />
                  <span>Let&apos;s chat on WhatsApp or Telegram</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* 300+ CONNECTORS HUB MODAL */}
      <ConnectorsHubModal
        isOpen={isConnectorsModalOpen}
        onClose={() => setIsConnectorsModalOpen(false)}
        onSelectConnector={(connector: Connector) => {
          setInputValue((prev) => `${prev} @${connector.name} `);
        }}
      />

      {/* SETUP / PERSONALITY CONFIG MODAL */}
      {isSetupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#0e1019] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-cyan-400" />
                <h3 className="font-bold font-sora text-sm text-white">
                  Agent Settings & Identity
                </h3>
              </div>
              <button
                onClick={() => setIsSetupModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Agent Name</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full bg-[#151724] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Inference Model</label>
                <select className="w-full bg-[#151724] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400">
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Recommended - 2M Context)</option>
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="llama-3-3-70b">Llama 3.3 70B (Local Ollama / NIM)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Dual-Rail Guardrail Mode</label>
                <select className="w-full bg-[#151724] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400">
                  <option value="strict">Strict (Require dual-rail approval for all consequential writes)</option>
                  <option value="balanced">Balanced (Auto-approve routine read operations)</option>
                  <option value="permissive">Permissive (Log all tool calls without blocking)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
              <button
                onClick={() => setIsSetupModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-cyan-400 text-black font-bold text-xs hover:bg-cyan-300"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW WORKFLOW AUTOMATION MODAL */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0e1019] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-cyan-400" />
                <h3 className="font-bold font-sora text-sm text-white">
                  Schedule New Workflow Automation
                </h3>
              </div>
              <button
                onClick={() => setIsNewTaskModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Automation Title</label>
                <input
                  type="text"
                  placeholder="e.g. Daily Security Vulnerability Triage"
                  id="newTaskTitle"
                  className="w-full bg-[#151724] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Cron Expression / Schedule</label>
                <input
                  type="text"
                  placeholder="e.g. 0 8 * * * (8:00 AM daily) or on_pr_opened"
                  id="newTaskCron"
                  className="w-full bg-[#151724] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Task Prompt / Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Tell Wingman what apps to run and what output to generate..."
                  id="newTaskPrompt"
                  className="w-full bg-[#151724] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
              <button
                onClick={() => setIsNewTaskModalOpen(false)}
                className="px-3 py-2 rounded-xl bg-white/10 text-white font-medium text-xs hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const titleInput = (document.getElementById("newTaskTitle") as HTMLInputElement)?.value;
                  const cronInput = (document.getElementById("newTaskCron") as HTMLInputElement)?.value;
                  const promptInput = (document.getElementById("newTaskPrompt") as HTMLTextAreaElement)?.value;
                  if (titleInput) {
                    setTasks((prev) => [
                      ...prev,
                      {
                        id: `task-${Date.now()}`,
                        name: titleInput,
                        schedule: cronInput || "0 8 * * *",
                        scheduleHuman: cronInput || "Every morning at 8:00 AM",
                        enabled: true,
                        connectors: ["GitHub", "Slack"],
                        prompt: promptInput || "Run scheduled workflow and report results.",
                        lastRun: "Never",
                        lastStatus: "running",
                      },
                    ]);
                  }
                  setIsNewTaskModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-400 text-black font-bold text-xs hover:bg-cyan-300"
              >
                Create Automation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
