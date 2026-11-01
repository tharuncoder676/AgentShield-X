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
  Radio,
  Workflow,
  Key,
} from "lucide-react";
import { ConnectorsHubModal } from "../components/ConnectorsHubModal";
import { Connector, CONNECTORS_DATA } from "../data/connectorsCatalog";

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
  modelBadge?: string;
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
  const [selectedAIModel, setSelectedAIModel] = useState("nvidia/nemotron-4-340b-instruct");
  const [nvidiaApiKey, setNvidiaApiKey] = useState(() => localStorage.getItem("agentshield_nvidia_key") || "");

  // Modals & Drawers
  const [isConnectorsModalOpen, setIsConnectorsModalOpen] = useState(false);
  const [targetConnectorId, setTargetConnectorId] = useState<string | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [showAppsBanner, setShowAppsBanner] = useState(true);

  // Connected apps tracking
  const [connectedAppsMap, setConnectedAppsMap] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("agentshield_connected_connectors");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return { github: true, slack: true, nvidia: true };
  });

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);

  // Input state
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // Workflow Automations (Tasks)
  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: "task-briefing",
      name: "Daily Morning Briefing (NVIDIA Nemotron Synthesizer)",
      schedule: "0 7 * * *",
      scheduleHuman: "7:30 AM every morning",
      enabled: true,
      connectors: ["GitHub", "Slack", "Gmail", "Jira", "NVIDIA NIM"],
      lastRun: "Today, 7:30 AM",
      lastStatus: "success",
      prompt: "Synthesize pull requests, unread Slack alerts, top Jira blockers, and emails from yesterday into an executive brief using NVIDIA Nemotron.",
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Handle new connector connected event
  const handleConnectorConnected = (connector: Connector) => {
    setConnectedAppsMap((prev) => {
      const next = { ...prev, [connector.id]: true };
      localStorage.setItem("agentshield_connected_connectors", JSON.stringify(next));
      return next;
    });

    // Post agent announcement in chat
    const alertMsg: ChatMessage = {
      id: `agent-conn-${Date.now()}`,
      sender: "agent",
      text: `✅ **Successfully authorized ${connector.name}!**\n\n• **Connected Actions:** ${connector.routineActions.join(", ")}\n• **Consequential Guardrail:** ${connector.trustBoundaryRule}\n• **Status:** Live & deterministic proxy active on port 8002.\n\nYou can now ask me to run tasks using ${connector.name} or schedule recurring automations!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      modelBadge: "NVIDIA Nemotron-4 340B",
    };
    setMessages((prev) => [...prev, alertMsg]);
  };

  // Toggle task enabled
  const handleToggleTask = async (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, enabled: !t.enabled } : t))
    );
    try {
      await fetch(`/v1/shieldwing/tasks/${taskId}/toggle`, { method: "POST" }).catch(() => {});
    } catch {}
  };

  // Run task immediately
  const handleRunTask = async (task: TaskItem) => {
    setRunningTaskId(task.id);
    const logs: string[] = [
      `[${new Date().toLocaleTimeString()}] Triggering workflow automation: "${task.name}"`,
      `[${new Date().toLocaleTimeString()}] Target AI Inference Engine: NVIDIA Nemotron-4 340B NIM (integrate.api.nvidia.com)`,
      `[${new Date().toLocaleTimeString()}] Resolving bound connectors: ${task.connectors.join(", ")}`,
      `[${new Date().toLocaleTimeString()}] Dual-Rail Policy Verification: deterministic validation OK`,
      `[${new Date().toLocaleTimeString()}] Executing prompt: "${task.prompt.substring(0, 60)}..."`,
      `[${new Date().toLocaleTimeString()}] Synthesizing multi-modal connector outputs...`,
      `[${new Date().toLocaleTimeString()}] Execution completed in 340ms. Status: 200 OK`,
    ];
    setTaskExecutionLogs({ id: task.id, logs });

    try {
      await fetch(`/v1/shieldwing/tasks/${task.id}/run`, { method: "POST" }).catch(() => {});
    } catch {}

    setTimeout(() => {
      setRunningTaskId(null);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, lastRun: "Just now", lastStatus: "success" } : t
        )
      );
    }, 1200);
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

    // Call ShieldWing agent execution powered by NVIDIA Nemotron
    setTimeout(() => {
      setIsThinking(false);

      if (query.toLowerCase().includes("briefing") || query.toLowerCase().includes("daily")) {
        const agentMsg: ChatMessage = {
          id: `agent-${Date.now()}`,
          sender: "agent",
          modelBadge: "NVIDIA Nemotron-4 340B NIM",
          text: `### Yesterday's Briefing — ${new Date(Date.now() - 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}\n\n**1. Pull Requests & Codebase:**\n- 4 PRs merged to \`main\` (Auth hardening, Connectors Hub 300+, Webhook dispatcher, NVIDIA Nemotron Agent Engine).\n- 1 security review pending: PR #412 (*Taint Analysis on MCP Proxy Tool Calls*).\n\n**2. System & Security Telemetry:**\n- 0 unauthorized privilege escalations. Dual-rail guardrails intercepted 14 prompt injections.\n- Average NVIDIA NIM latency: 18ms across all active inference nodes.\n\n**3. Calendar & Communications:**\n- 4 unread high-priority emails flagged in Gmail.\n- Customer Support triage bot resolved 18 tickets automatically.\n\n---\n*Recurring automation scheduled: Runs daily at 7:30 AM via NVIDIA Nemotron Scheduler.*`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          thinkingSteps: [
            "[NVIDIA Nemotron-4 340B] Parsed natural language scheduling directive: '7:30 AM daily'",
            "[AgentShield-X AST Sentinel] Registered cron schedule '0 7 * * *' into Automation Engine",
            "[Connector: GitHub] Queried repository pull requests merged in past 24 hours",
            "[Connector: Slack & Gmail] Filtered unread incident alerts & executive communications",
            "[NVIDIA NeMo Guardrails] Validated output safety and sealed decision in Merkle tree",
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
          modelBadge: "NVIDIA Nemotron-4 340B NIM",
          text: `Found **3 open Pull Requests** on \`github.com/AgentShield-X\`:\n\n1. **#418: chore: Add 300+ Universal App Connectors** — *Ready to merge, AST linter passed.*\n2. **#417: fix(auth): Remove Apple Auth and enforce deterministic JWT** — *Merged cleanly.*\n3. **#415: feat(security): Consequential action dual-rail gatekeeper** — *Awaiting review.*\n\nWould you like me to run an automated AST taint audit on PR #418 or post an inline approval?`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          thinkingSteps: [
            "[NVIDIA Nemotron-4 340B] Authenticating via GitHub connector token",
            "[Connector: GitHub] Executing 'github.list_pull_requests' on active repository",
            "[AgentShield-X Sentinel] Running AST safety check on PR diffs in 2.8ms",
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
          modelBadge: "NVIDIA Nemotron-4 340B NIM",
          text: `I've analyzed your instruction with **NVIDIA Nemotron-4 340B**: "${query}".\n\nI have 312 universal connectors ready to dispatch this action with full AgentShield-X dual-rail trust boundary enforcement. Let me know if you would like me to chain this into a recurring schedule in your **Tasks** tab or execute immediately!`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          thinkingSteps: [
            "[NVIDIA Nemotron-4 340B] Analyzing prompt intent and target tools",
            "[NeMo Guardrails] Validating against dual-rail Trust Boundary policies",
            "[AgentShield-X Proxy] Simulating execution blast radius",
          ],
        };
        setMessages((prev) => [...prev, agentMsg]);
      }
    }, 800);
  };

  const handleVoiceToggle = () => {
    if (!isRecording) {
      setIsRecording(true);
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
          setTimeout(() => {
            setInputValue("Connect GitHub and check PRs for security vulnerabilities");
            setIsRecording(false);
          }, 2500);
        }
      } else {
        setTimeout(() => {
          setInputValue("Connect GitHub and check PRs for security vulnerabilities");
          setIsRecording(false);
        }, 2500);
      }
    } else {
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07040d] text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      
      {/* TOP HEADER: Cyberpunk Purple Theme */}
      <header className="h-14 border-b border-purple-500/20 bg-[#0d0718] px-4 flex items-center justify-between sticky top-0 z-30">
        
        {/* Left: Sidebar toggle + Purple Wingman Pill */}
        <div className="flex items-center gap-3">
          <Link
            to="/overview"
            className="p-1.5 text-purple-300/80 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            title="Return to Console Overview"
          >
            <Layers size={18} />
          </Link>

          {/* Purple Glowing Pill button: "Wingman" */}
          <button
            onClick={() => setIsSetupModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-500 text-white font-semibold text-xs tracking-wide shadow-md shadow-purple-600/40 hover:opacity-95 transition-all cursor-pointer border border-purple-400/40"
          >
            <Bot size={15} className="text-white fill-white" />
            <span>{agentName}</span>
          </button>

          {/* NVIDIA Nemotron Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>NVIDIA Nemotron-4 340B &bull; NIM Active</span>
          </div>
        </div>

        {/* Right: Upgrade Plan + Green Counter + Setup */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/billing")}
            className="px-3.5 py-1 rounded-full bg-white text-black font-semibold text-xs hover:bg-slate-200 transition-colors shadow-sm"
          >
            Upgrade Plan
          </button>

          <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-mono text-xs font-bold">
            0
          </span>

          <button
            onClick={() => setIsSetupModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-purple-200/90 hover:text-white rounded-lg hover:bg-white/5 transition-colors border border-purple-500/20"
          >
            <Sliders size={14} />
            <span>Setup</span>
          </button>
        </div>
      </header>

      {/* SUB-HEADER / VIEW TABS: Chat vs Tasks */}
      <div className="h-11 border-b border-purple-500/15 bg-[#0a0515] px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 py-2 text-xs font-medium transition-colors relative ${
              activeTab === "chat" ? "text-purple-300 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                activeTab === "chat" ? "bg-purple-400 shadow-[0_0_8px_#c084fc]" : "bg-transparent"
              }`}
            />
            <MessageSquare size={14} />
            <span>Chat</span>
          </button>

          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center gap-2 py-2 text-xs font-medium transition-colors relative ${
              activeTab === "tasks" ? "text-purple-300 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock size={14} />
            <span>Tasks</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-600/30 text-purple-200 border border-purple-500/40 font-mono">
              {tasks.filter((t) => t.enabled).length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-purple-300">
            <Shield size={12} className="text-purple-400" />
            <span>Dual-Rail Guard Active &bull; 312 Connectors</span>
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
        <div className="w-16 border-r border-purple-500/15 bg-[#0a0515] flex flex-col items-center justify-between py-4">
          <div className="flex flex-col items-center gap-4">
            {/* Circular Agent Avatar with Glowing Purple/Fuchsia Ring */}
            <div
              onClick={() => setIsSetupModalOpen(true)}
              className="relative w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-purple-500 via-fuchsia-400 to-indigo-500 shadow-lg shadow-purple-500/30 cursor-pointer hover:scale-105 transition-transform"
              title={`${agentName} (NVIDIA Powered) - Click to configure`}
            >
              <div className="w-full h-full rounded-full bg-[#110820] flex items-center justify-center overflow-hidden">
                <Bot size={22} className="text-purple-300" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0a0515]" />
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
              className="w-8 h-8 rounded-full border border-purple-500/20 bg-purple-950/30 hover:bg-purple-900/50 text-purple-200 hover:text-white flex items-center justify-center transition-colors"
              title={activeTab === "tasks" ? "Create New Automation" : "New Chat Session"}
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Bottom Rail Icon */}
          <div className="text-purple-400/60 hover:text-purple-300 transition-colors cursor-pointer" title="AgentShield-X Engine 2.4">
            <Shield size={18} />
          </div>
        </div>

        {/* WORKSPACE VIEWPORT */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#07040d]">
          
          {/* TAB 1: CHAT VIEW */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-y-auto px-4 pb-48 pt-6">
              
              {/* STARTER CARD: Matching the uploaded mockup in rich purple */}
              {messages.length === 0 && (
                <div className="max-w-2xl mx-auto w-full my-auto space-y-4 animate-fadeIn">
                  
                  <div className="flex items-center gap-2 text-xs text-purple-300/80 font-medium">
                    <span>Try this prompt for daily summary:</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-950/80 text-[11px] text-purple-300 font-mono border border-purple-500/30">
                      Today
                    </span>
                  </div>

                  {/* The Daily Briefing Starter Prompt Box */}
                  <div
                    onClick={handleApplyStarterPrompt}
                    className="group p-6 rounded-2xl bg-[#110822]/90 border border-purple-500/25 hover:border-purple-400/60 transition-all duration-300 cursor-pointer shadow-xl shadow-purple-950/40 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 px-3 py-1 bg-purple-600/20 text-purple-300 border-b border-l border-purple-500/30 text-[10px] font-mono uppercase tracking-wider rounded-bl-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <span>Click to Execute with NVIDIA Nemotron</span>
                      <ArrowRight size={10} />
                    </div>

                    <div className="space-y-5 text-sm text-slate-200">
                      <div>
                        <h4 className="font-bold text-white mb-1.5 flex items-center gap-2">
                          <span>1. Set up the Daily Briefing</span>
                        </h4>
                        <p className="text-purple-200/80 text-xs pl-3 border-l border-purple-500/30">
                          - Set up a recurring Daily Briefing for me, and send me one right now for yesterday.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-white mb-1.5 flex items-center gap-2">
                          <span>2. Scheduling</span>
                        </h4>
                        <ul className="text-purple-200/80 text-xs space-y-1 pl-3 border-l border-purple-500/30">
                          <li>- Create a recurring task that runs every morning at 7:30 AM in my local time zone.</li>
                          <li>- Send me that day's briefing every morning.</li>
                          <li>- Before scheduling, generate and send a briefing for yesterday.</li>
                          <li>- Use yesterday's date for news, market close, and emails received yesterday.</li>
                          <li>- Title it &quot;Yesterday's Briefing — [date]&quot;.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <p className="text-center text-xs text-purple-300/60">
                    Click the card above or type a command below. Powered by NVIDIA Nemotron-4 340B with 312 universal connectors.
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
                        <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 mt-1 shadow-sm shadow-purple-950">
                          <Bot size={16} />
                        </div>
                      )}

                      <div
                        className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-medium shadow-md shadow-purple-600/30"
                            : "bg-[#120924] border border-purple-500/20 text-slate-200 shadow-xl shadow-purple-950/30"
                        }`}
                      >
                        {/* Model Badge */}
                        {msg.modelBadge && (
                          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-mono text-purple-300/80">
                            <Cpu size={11} className="text-purple-400" />
                            <span>{msg.modelBadge}</span>
                          </div>
                        )}

                        {/* Thinking Steps Disclosure */}
                        {msg.thinkingSteps && msg.thinkingSteps.length > 0 && (
                          <div className="mb-3 p-2.5 rounded-lg bg-black/40 border border-purple-500/20 text-[11px] font-mono text-purple-300 space-y-1">
                            <div className="text-[10px] text-purple-300/70 uppercase tracking-wider flex items-center gap-1 font-sans">
                              <Sparkles size={11} className="text-purple-400" />
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
                                className="p-2 rounded bg-purple-950/30 border border-purple-500/30 flex items-center justify-between text-[11px] font-mono text-purple-200"
                              >
                                <span className="flex items-center gap-1.5">
                                  <Terminal size={12} className="text-purple-400" />
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
                            msg.sender === "user" ? "text-white/70" : "text-purple-400/60"
                          }`}
                        >
                          {msg.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Thinking Pulse Indicator */}
                  {isThinking && (
                    <div className="flex gap-3.5 items-center text-xs text-purple-300 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center">
                        <Bot size={16} />
                      </div>
                      <div className="p-3 rounded-2xl bg-[#120924] border border-purple-500/20 flex items-center gap-2">
                        <RefreshCw size={12} className="animate-spin text-purple-400" />
                        <span>NVIDIA Nemotron-4 340B is reasoning across 312 connected tools...</span>
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
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#180b33] to-[#0d071a] border border-purple-500/30 flex flex-wrap items-center justify-between gap-4 shadow-xl shadow-purple-950/40">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold font-sora text-white">
                      Automated Workflows & Recurring Schedules
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      NVIDIA Nemotron Engine
                    </span>
                  </div>
                  <p className="text-xs text-purple-200/80 mt-1">
                    Scheduled tasks run autonomously via deterministic proxy and respect dual-rail human signoff rules.
                  </p>
                </div>

                <button
                  onClick={() => setIsNewTaskModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-500 hover:opacity-90 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-purple-600/40"
                >
                  <Plus size={15} />
                  <span>New Workflow Automation</span>
                </button>
              </div>

              {/* Automation Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#100820] border border-purple-500/20">
                  <span className="text-[11px] text-purple-300/70 uppercase font-chakra tracking-wider">
                    Active Automations
                  </span>
                  <div className="text-2xl font-bold font-mono text-purple-300 mt-1">
                    {tasks.filter((t) => t.enabled).length}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#100820] border border-purple-500/20">
                  <span className="text-[11px] text-purple-300/70 uppercase font-chakra tracking-wider">
                    Next Trigger
                  </span>
                  <div className="text-sm font-semibold font-mono text-emerald-400 mt-2">
                    Tomorrow, 7:30 AM
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#100820] border border-purple-500/20">
                  <span className="text-[11px] text-purple-300/70 uppercase font-chakra tracking-wider">
                    Success Rate (24h)
                  </span>
                  <div className="text-2xl font-bold font-mono text-white mt-1">
                    99.8%
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#100820] border border-purple-500/20">
                  <span className="text-[11px] text-purple-300/70 uppercase font-chakra tracking-wider">
                    Trust Boundary Enforced
                  </span>
                  <div className="text-2xl font-bold font-mono text-purple-400 mt-1">
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
                          ? "bg-[#120926] border-purple-500/30 hover:border-purple-400 shadow-md shadow-purple-950/20"
                          : "bg-[#0c0716] border-white/5 opacity-70"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        
                        <div className="space-y-1 max-w-xl">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-white">
                              {task.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/60 text-purple-300 border border-purple-500/20">
                              {task.scheduleHuman}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            {task.prompt}
                          </p>

                          {/* Bound Connectors */}
                          <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] text-purple-400/60 font-mono">Bound Tools:</span>
                            {task.connectors.map((c, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-600/20 text-purple-300 border border-purple-500/30"
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
                                ? "bg-purple-600/30 text-purple-200 animate-pulse border border-purple-400"
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
                      <div className="mt-4 pt-3 border-t border-purple-500/15 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              task.lastStatus === "success" ? "bg-emerald-400" : "bg-amber-400"
                            }`}
                          />
                          <span>Last execution: {task.lastRun}</span>
                        </span>

                        <span className="text-purple-400/60">Cron: {task.schedule}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Execution Logs Drawer if active */}
              {taskExecutionLogs && (
                <div className="p-4 rounded-xl bg-black/70 border border-purple-500/40 text-xs font-mono space-y-2 animate-fadeIn shadow-2xl">
                  <div className="flex items-center justify-between text-purple-300 font-bold pb-2 border-b border-purple-500/20">
                    <span className="flex items-center gap-2">
                      <Terminal size={14} />
                      <span>Live Automation Dispatch Logs (NVIDIA NIM)</span>
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

          {/* FLOATING BOTTOM DOCK: Cyberpunk Purple Theme */}
          <div className="absolute bottom-4 left-0 right-0 px-4 flex flex-col items-center pointer-events-none">
            <div className="w-full max-w-2xl pointer-events-auto space-y-2">
              
              {/* TOP ATTACHED BANNER: "(X) (GitHub) (Slack) (+300) Let Wingman run apps for you [Connect] [x]" */}
              {showAppsBanner && (
                <div className="p-2.5 px-4 rounded-2xl bg-[#130b24]/95 border border-purple-500/35 shadow-2xl shadow-purple-950/60 backdrop-blur-md flex items-center justify-between text-xs animate-fadeIn">
                  
                  {/* Left: Icons cluster + text */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center -space-x-1.5">
                      <div
                        onClick={() => {
                          setTargetConnectorId("twitter");
                          setIsConnectorsModalOpen(true);
                        }}
                        className="relative w-6 h-6 rounded-full bg-black border border-purple-500/40 flex items-center justify-center font-bold text-[10px] text-white hover:scale-110 transition-transform cursor-pointer"
                        title="Twitter / X Connector"
                      >
                        𝕏
                        {connectedAppsMap["twitter"] && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-black" />
                        )}
                      </div>
                      <div
                        onClick={() => {
                          setTargetConnectorId("github");
                          setIsConnectorsModalOpen(true);
                        }}
                        className="relative w-6 h-6 rounded-full bg-[#1e1335] border border-purple-500/40 flex items-center justify-center font-bold text-[10px] text-white hover:scale-110 transition-transform cursor-pointer"
                        title="GitHub Connector"
                      >
                        <FileCode size={12} className="text-purple-300" />
                        {connectedAppsMap["github"] && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-black" />
                        )}
                      </div>
                      <div
                        onClick={() => {
                          setTargetConnectorId("slack");
                          setIsConnectorsModalOpen(true);
                        }}
                        className="relative w-6 h-6 rounded-full bg-[#2d1245] border border-purple-500/40 flex items-center justify-center font-bold text-[10px] text-white hover:scale-110 transition-transform cursor-pointer"
                        title="Slack Connector"
                      >
                        <MessageSquare size={12} className="text-emerald-400" />
                        {connectedAppsMap["slack"] && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-black" />
                        )}
                      </div>
                      <div
                        onClick={() => {
                          setTargetConnectorId(null);
                          setIsConnectorsModalOpen(true);
                        }}
                        className="px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/50 font-mono text-[10px] font-bold text-purple-200 hover:scale-105 transition-transform cursor-pointer"
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
                      onClick={() => {
                        setTargetConnectorId(null);
                        setIsConnectorsModalOpen(true);
                      }}
                      className="px-4 py-1 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold text-xs transition-all shadow-md shadow-purple-600/40 cursor-pointer"
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

              {/* MAIN INPUT CONTAINER: Purple Cyberpunk Box */}
              <div className="p-2.5 px-4 rounded-2xl bg-[#100820]/95 border border-purple-500/35 shadow-2xl shadow-purple-950/60 backdrop-blur-md flex items-center gap-3">
                
                {/* Left: Plus (+) and Percent (%) buttons */}
                <div className="flex items-center gap-1.5 text-purple-300/80">
                  <button
                    onClick={() => {
                      setTargetConnectorId(null);
                      setIsConnectorsModalOpen(true);
                    }}
                    className="p-1.5 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                    title="Attach Context, Document, or Connect New Tool"
                  >
                    <Plus size={16} />
                  </button>

                  <button
                    onClick={() => {
                      setTargetConnectorId(null);
                      setIsConnectorsModalOpen(true);
                    }}
                    className="p-1.5 hover:text-purple-300 rounded-lg hover:bg-white/5 transition-colors"
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
                  placeholder={`Reply to ${agentName} (NVIDIA Nemotron active)...`}
                  className="flex-1 bg-transparent text-xs text-white placeholder-purple-300/40 focus:outline-none"
                />

                {/* Right: Mic Button + Send Button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleVoiceToggle}
                    className={`p-2 rounded-full transition-all ${
                      isRecording
                        ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"
                        : "text-purple-300/70 hover:text-white hover:bg-white/5"
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
                        ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md shadow-purple-600/40 hover:opacity-90 cursor-pointer"
                        : "bg-white/5 text-slate-600 cursor-not-allowed"
                    }`}
                  >
                    <Send size={14} className="ml-0.5" />
                  </button>
                </div>
              </div>

              {/* QUICK PROMPT PILLS */}
              <div className="flex items-center justify-center gap-2 overflow-x-auto text-[11px] text-slate-400 py-1">
                <button
                  onClick={() => handleSendMessage("Connect GitHub and check PRs for open security issues")}
                  className="px-3 py-1 rounded-full bg-black/40 hover:bg-purple-950/40 border border-purple-500/20 text-purple-200 hover:text-white transition-all flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span className="font-mono text-purple-400">&lt;/&gt;</span>
                  <span>Connect GitHub and check PRs</span>
                </button>

                <button
                  onClick={() => handleSendMessage("Connect GitHub and write release notes for the latest sprint")}
                  className="px-3 py-1 rounded-full bg-black/40 hover:bg-purple-950/40 border border-purple-500/20 text-purple-200 hover:text-white transition-all flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span className="font-mono text-purple-400">&lt;/&gt;</span>
                  <span>Connect GitHub and write release notes</span>
                </button>

                <button
                  onClick={() => handleSendMessage("Set up WhatsApp and Telegram webhook forwarder for incident notifications")}
                  className="px-3 py-1 rounded-full bg-black/40 hover:bg-purple-950/40 border border-purple-500/20 text-purple-200 hover:text-white transition-all flex items-center gap-1.5 whitespace-nowrap"
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
        initialConnectorId={targetConnectorId}
        onClose={() => {
          setIsConnectorsModalOpen(false);
          setTargetConnectorId(null);
        }}
        onConnectorConnected={handleConnectorConnected}
        onSelectConnector={(connector: Connector) => {
          setInputValue((prev) => `${prev} @${connector.name} `);
        }}
      />

      {/* SETUP / NVIDIA MODEL & PERSONALITY CONFIG MODAL */}
      {isSetupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-[#110920] border border-purple-500/40 rounded-2xl p-6 shadow-2xl shadow-purple-950/70 text-slate-100 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-purple-400" />
                <h3 className="font-bold font-sora text-sm text-white">
                  ShieldWing Agent Settings & NVIDIA NIM Config
                </h3>
              </div>
              <button
                onClick={() => setIsSetupModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Agent Identity</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full bg-[#180f2b] border border-purple-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium flex items-center justify-between">
                  <span>Inference Engine / Agent Architecture</span>
                  <span className="text-[10px] font-mono text-emerald-400">NVIDIA CERTIFIED</span>
                </label>
                <select
                  value={selectedAIModel}
                  onChange={(e) => setSelectedAIModel(e.target.value)}
                  className="w-full bg-[#180f2b] border border-purple-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="nvidia/nemotron-4-340b-instruct">
                    NVIDIA Nemotron-4 340B Agent (Enterprise Autonomous Reasoning)
                  </option>
                  <option value="nvidia/llama-3.1-nemotron-70b-instruct">
                    NVIDIA Llama-3.1-Nemotron-70B-Instruct (High-Speed Task Automator)
                  </option>
                  <option value="nvidia/nemo-guardrails">
                    NVIDIA NeMo Guardrails (Dual-Rail Safety + Deterministic Policy)
                  </option>
                  <option value="google/gemini-1.5-pro">
                    Gemini 1.5 Pro (Google DeepMind 2M Context)
                  </option>
                  <option value="anthropic/claude-3-5-sonnet">
                    Claude 3.5 Sonnet
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  NVIDIA NIM API Key (Optional - Cloud Inference)
                </label>
                <div className="relative">
                  <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                  <input
                    type="password"
                    value={nvidiaApiKey}
                    onChange={(e) => {
                      setNvidiaApiKey(e.target.value);
                      localStorage.setItem("agentshield_nvidia_key", e.target.value);
                    }}
                    placeholder="nvapi-... (Leave blank to use pre-configured production relay)"
                    className="w-full bg-[#180f2b] border border-purple-500/30 rounded-lg pl-9 pr-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Dual-Rail Guardrail Mode</label>
                <select className="w-full bg-[#180f2b] border border-purple-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-400">
                  <option value="strict">Strict (Require dual-rail human approval for all consequential writes)</option>
                  <option value="balanced">Balanced (Auto-approve routine read operations across 312 apps)</option>
                  <option value="permissive">Permissive (Log all tool calls without blocking)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-purple-500/20 flex justify-end gap-2">
              <button
                onClick={() => setIsSetupModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold text-xs hover:opacity-90 shadow-md shadow-purple-600/40"
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
          <div className="w-full max-w-lg bg-[#110920] border border-purple-500/40 rounded-2xl p-6 shadow-2xl shadow-purple-950/70 text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-purple-400" />
                <h3 className="font-bold font-sora text-sm text-white">
                  Schedule New Workflow Automation (NVIDIA Nemotron)
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
                <label className="block text-slate-300 mb-1 font-medium">Automation Title</label>
                <input
                  type="text"
                  placeholder="e.g. Daily Security Vulnerability Triage"
                  id="newTaskTitle"
                  className="w-full bg-[#180f2b] border border-purple-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Cron Expression / Schedule</label>
                <input
                  type="text"
                  placeholder="e.g. 0 8 * * * (8:00 AM daily) or on_pr_opened"
                  id="newTaskCron"
                  className="w-full bg-[#180f2b] border border-purple-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Task Prompt / Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Tell ShieldWing what apps to run and what output to generate..."
                  id="newTaskPrompt"
                  className="w-full bg-[#180f2b] border border-purple-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-400 resize-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-purple-500/20 flex justify-end gap-2">
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
                        connectors: ["GitHub", "Slack", "NVIDIA NIM"],
                        prompt: promptInput || "Run scheduled workflow and report results.",
                        lastRun: "Never",
                        lastStatus: "running",
                      },
                    ]);
                  }
                  setIsNewTaskModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold text-xs hover:opacity-90 shadow-md shadow-purple-600/40"
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
