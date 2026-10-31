import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  Activity,
  Bot,
  Cpu,
  Layers,
  Database,
  Terminal,
  Play,
  Box,
  FileText,
  Settings,
  Bell,
  Radio,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ExternalLink,
  ChevronRight,
  Maximize2,
  HelpCircle,
  User,
  Zap,
  Network,
  Search,
  Globe,
  Sliders,
  Check,
  Code,
  Dna,
  TerminalSquare,
  Flame,
} from "lucide-react";
import {
  WingmanConfig,
  loadWingmanConfig,
  getDynamicGreeting,
} from "../types/wingman";
import { WingmanHoloSphere } from "../components/WingmanHoloSphere";
import { WingmanMemoryGraph } from "../components/WingmanMemoryGraph";
import { WingmanConfigModal } from "../components/WingmanConfigModal";
import { WingmanTalkModal } from "../components/WingmanTalkModal";

export const WingmanCommandCenter: React.FC = () => {
  const navigate = useNavigate();

  // Wingman configuration state
  const [config, setConfig] = useState<WingmanConfig>(() => loadWingmanConfig());
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isTalkOpen, setIsTalkOpen] = useState(false);

  // Time & Clock state
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  // Simulated live hardware & telemetry
  const [telemetry, setTelemetry] = useState({
    cpu: 18,
    ram: 52,
    riskScore: 8,
    blockedAttacks: 127,
    activeSessions: 6,
    toolCalls: 1248,
    threatsDetected: 23,
    tokenVelocity: 842,
  });

  const [activeWorkspaceMode, setActiveWorkspaceMode] = useState<"agents" | "mesh" | "code" | "mcp">("agents");
  const [workflowToast, setWorkflowToast] = useState<string | null>(null);

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setCurrentDate(
        now
          .toLocaleDateString("en-US", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })
          .toUpperCase()
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for config update events
  useEffect(() => {
    const handleConfigChange = (e: any) => {
      if (e.detail) {
        setConfig(e.detail);
      }
    };
    window.addEventListener("wingman_config_updated", handleConfigChange);
    return () =>
      window.removeEventListener("wingman_config_updated", handleConfigChange);
  }, []);

  // Subtle telemetry jitter for realistic live cyber cockpit feel
  useEffect(() => {
    const jitter = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        cpu: Math.min(85, Math.max(12, prev.cpu + (Math.floor(Math.random() * 5) - 2))),
        ram: Math.min(90, Math.max(48, prev.ram + (Math.floor(Math.random() * 3) - 1))),
        tokenVelocity: Math.min(1200, Math.max(450, prev.tokenVelocity + (Math.floor(Math.random() * 60) - 30))),
      }));
    }, 3200);
    return () => clearInterval(jitter);
  }, []);

  // Spacebar hotkey listener to open talk modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        config.spacebarTrigger &&
        e.code === "Space" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        setIsTalkOpen(true);
      } else if (
        (e.key === "l" || e.key === "L") &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
      ) {
        navigate("/audit");
      } else if (
        (e.key === "s" || e.key === "S") &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
      ) {
        navigate("/terminal");
      } else if (
        (e.key === "g" || e.key === "G") &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
      ) {
        navigate("/genome");
      } else if (
        (e.key === "r" || e.key === "R") &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
      ) {
        triggerWorkflow();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [config.spacebarTrigger, navigate]);

  const triggerWorkflow = () => {
    setWorkflowToast(
      "Executing Autonomous Defense Workflow: Sandboxed CVE Scan & Taint Tracing initiated..."
    );
    setTimeout(() => {
      setWorkflowToast("Workflow Completed: 0 vulnerabilities found, all agent hooks verified.");
      setTimeout(() => setWorkflowToast(null), 3500);
    }, 2500);
  };

  const calculatedGreeting =
    config.greetingMode === "auto"
      ? getDynamicGreeting(config.operatorName)
      : config.greetingHeadline;

  // Render SVG Circular Gauge helper with AgentShield-X purple/violet styling
  const renderCircularGauge = (
    value: number,
    label: string,
    sublabel: string,
    color: string = "#c084fc"
  ) => {
    const radius = 32;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (value / 100) * circ;

    return (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg className="w-20 h-20 transform -rotate-90">
            {/* Background track */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth="5"
              fill="transparent"
            />
            {/* Value progress arc */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke={color}
              strokeWidth="5"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
              style={{ filter: `drop-shadow(0 0 8px ${color})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[10px] font-chakra font-bold text-mut uppercase">
              {label}
            </span>
            <span className="text-base font-chakra font-extrabold text-white">
              {sublabel}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#080410] text-[#f1edfa] font-sans flex flex-col overflow-x-hidden selection:bg-purple-600/30 selection:text-purple-300 relative">
      {/* Background Subtle Cyber-Purple Radial Ambient Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(168,85,247,0.18),rgba(255,255,255,0))]" />
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20 bg-[radial-gradient(#3b1d60_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* 1. TOP BRIDGE-STYLE CYBER COMMAND HEADER */}
      <header className="h-16 border-b border-purple-500/20 bg-[#0c061a]/85 backdrop-blur-xl px-5 flex items-center justify-between shrink-0 z-30 relative shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
        {/* Left Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-purple-500/10 border border-purple-500/50 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.35)]">
            <Shield size={22} className="drop-shadow-[0_0_8px_#c084fc]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-chakra font-extrabold tracking-[0.2em] bg-gradient-to-r from-white via-purple-100 to-purple-400 bg-clip-text text-transparent">
                WINGMAN
              </span>
              <span className="text-xs font-chakra font-bold text-purple-400 tracking-wider">
                AgentShield-X
              </span>
            </div>
            <div className="text-[10px] text-mut font-chakra tracking-wider">
              Autonomous Agent Defense & Biometric Mesh
            </div>
          </div>
        </div>

        {/* Center Mode Switcher Tabs (Inspired by AgentShield-X Agent Super App) */}
        <div className="hidden md:flex items-center p-1 bg-black/40 border border-purple-500/25 rounded-full backdrop-blur-md shadow-inner">
          {[
            { id: "agents", label: "Agent Mesh", icon: Bot },
            { id: "mesh", label: "Immunity Mesh", icon: Dna, badge: "DNA" },
            { id: "code", label: "Sandbox Terminal", icon: TerminalSquare },
            { id: "mcp", label: "MCP Rug-Pull Guard", icon: Network },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeWorkspaceMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveWorkspaceMode(tab.id as any);
                  if (tab.id === "mesh") navigate("/genome");
                  if (tab.id === "code") navigate("/terminal");
                  if (tab.id === "mcp") navigate("/mcp");
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-chakra uppercase transition-all duration-300 ${
                  isActive
                    ? "bg-purple-600/40 text-purple-200 border border-purple-400/50 font-bold shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                    : "text-mut hover:text-white border border-transparent"
                }`}
              >
                <Icon size={13} className={isActive ? "text-purple-300" : "text-mut"} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[9px] font-mono px-1 rounded bg-purple-500/30 text-purple-300 font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Status, Clock & Operator Controls */}
        <div className="flex items-center gap-3">
          {/* Digital Clock readout */}
          <div className="hidden xl:flex flex-col text-right">
            <span className="text-[10px] font-mono text-purple-300/80">{currentDate}</span>
            <span className="text-xs font-mono font-bold text-white drop-shadow-[0_0_6px_rgba(192,132,252,0.6)]">
              {currentTime}
            </span>
          </div>

          {/* System Secure Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#120a24] border border-purple-500/30 rounded-xs text-xs font-chakra shadow-[0_0_10px_rgba(168,85,247,0.15)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-bold">Biometric Mesh Active</span>
            <span className="text-mut text-[11px]">&bull; 6/6 Online</span>
          </div>

          {/* Notification Bell */}
          <button
            onClick={() => navigate("/incidents")}
            className="relative p-2 bg-[#120a24] border border-purple-500/30 hover:border-purple-400 text-mut hover:text-white rounded-xs transition-colors"
            title="3 Recent Security Incidents"
          >
            <Bell size={16} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]" />
          </button>

          {/* Operator Profile Pill -> Opens Config Studio */}
          <button
            onClick={() => setIsConfigOpen(true)}
            className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 bg-[#120a24] hover:bg-purple-900/30 border border-purple-500/30 hover:border-purple-400 rounded-xs transition-all group"
            title="Configure Wingman AI, Greetings, Purpose & Personas"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-chakra font-extrabold text-xs flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.5)]">
              {config.operatorName.charAt(0).toUpperCase() || "T"}
            </div>
            <div className="text-left font-chakra">
              <div className="text-xs font-bold text-white leading-none group-hover:text-purple-300 transition-colors">
                {config.operatorName}
              </div>
              <div className="text-[10px] text-purple-400/90 leading-none mt-0.5">
                {config.operatorRole}
              </div>
            </div>
            <Settings size={13} className="text-mut group-hover:text-purple-300 group-hover:rotate-45 transition-all ml-1" />
          </button>
        </div>
      </header>

      {/* 2. MAIN 3-COLUMN COCKPIT LAYOUT */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* ======================================================== */}
        {/* COLUMN 1: LEFT CYBER NAVIGATION & VOICE ASSISTANT WIDGET */}
        {/* ======================================================== */}
        <aside className="w-56 shrink-0 border-r border-purple-500/20 bg-[#0a0518]/90 backdrop-blur-md flex flex-col justify-between p-3 z-20">
          {/* Navigation Links */}
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-chakra font-bold text-purple-300/70 uppercase tracking-[0.2em]">
              Console Modules
            </div>

            {[
              { id: "command-center", label: "Command Center", icon: Activity, path: "/command-center", active: true },
              { id: "genome", label: "Agent Genome", icon: Dna, path: "/genome", badge: "DNA" },
              { id: "ai-core", label: "AI Models & ML", icon: Cpu, path: "/models" },
              { id: "agents", label: "Agents Fleet", icon: Bot, path: "/agents", badge: "6" },
              { id: "security", label: "Threat Incidents", icon: Shield, path: "/incidents", badge: "3" },
              { id: "tasks", label: "Sessions & Replay", icon: Layers, path: "/sessions" },
              { id: "memory", label: "RAG Firewall", icon: Database, path: "/rag-firewall" },
              { id: "logs", label: "Audit Ledger", icon: FileText, path: "/audit" },
              { id: "workflows", label: "Policies & OPA", icon: Play, path: "/policies" },
              { id: "tools-mcp", label: "MCP Rug-Pull Proxy", icon: Network, path: "/mcp" },
            ].map((nav) => {
              const Icon = nav.icon;
              return (
                <button
                  key={nav.id}
                  onClick={() => {
                    if (nav.active) return;
                    navigate(nav.path);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-chakra font-semibold rounded-xs transition-all ${
                    nav.active
                      ? "bg-purple-600/25 text-purple-200 border border-purple-500/60 shadow-[0_0_14px_rgba(168,85,247,0.3)] font-bold"
                      : "text-mut hover:text-white hover:bg-purple-900/20 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={14} className={nav.active ? "text-purple-300" : "text-mut"} />
                    <span>{nav.label}</span>
                  </div>
                  {nav.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-xs">
                      {nav.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Settings link opens the Config Studio */}
            <button
              onClick={() => setIsConfigOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-chakra font-semibold text-mut hover:text-white hover:bg-purple-900/20 border border-transparent rounded-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Settings size={14} className="text-mut" />
                <span>Settings</span>
              </div>
              <span className="text-[9px] font-mono text-purple-400 bg-purple-500/10 px-1 rounded-xs">
                CONFIG
              </span>
            </button>
          </div>

          {/* Bottom Left Voice Assistant Widget (ShieldVoice Style Waveform) */}
          <div className="mt-4 p-3.5 bg-[#120a24]/90 border border-purple-500/25 rounded-sm flex flex-col items-center text-center shadow-[0_0_20px_rgba(168,85,247,0.15)] relative overflow-hidden group">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-[10px] font-chakra font-bold text-purple-300/90 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                ShieldVoice Active
              </span>
              <span className="text-[9px] font-mono text-emerald-400">Ready</span>
            </div>

            {/* Sound Equalizer Waveform */}
            <div className="flex items-center justify-center gap-0.5 h-6 w-full mb-3">
              {[25, 45, 80, 100, 60, 90, 40, 70, 95, 50, 85, 30].map((h, idx) => (
                <div
                  key={idx}
                  className="w-1 bg-gradient-to-t from-purple-600 to-fuchsia-400 rounded-full animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${idx * 75}ms`,
                  }}
                />
              ))}
            </div>

            {/* Glowing Holographic Mic Button */}
            <div className="relative my-1 flex items-center justify-center">
              <div className="absolute inset-0 w-16 h-16 rounded-full border border-purple-500/40 animate-ping opacity-25 pointer-events-none" />
              <button
                onClick={() => setIsTalkOpen(true)}
                className="w-16 h-16 rounded-full bg-gradient-to-b from-purple-900/80 to-[#120a24] border-2 border-purple-400 hover:border-white shadow-[0_0_25px_rgba(168,85,247,0.5)] flex flex-col items-center justify-center text-purple-300 hover:text-white transition-all transform hover:scale-105 active:scale-95 group/btn"
                title={`Click to talk with Wingman or press Spacebar`}
              >
                <Mic size={22} className="group-hover/btn:drop-shadow-[0_0_8px_#c084fc]" />
              </button>
            </div>

            <div className="mt-2 text-xs font-chakra font-bold text-white tracking-wider">
              "{config.wakeWordPrimary}"
            </div>
            <div className="text-[9px] text-mut font-sans mt-0.5">
              Press Space or say "{config.wakeWordPrimary}."
            </div>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* COLUMN 2: CENTER OPERATIONS & DEFENSE COCKPIT            */}
        {/* ======================================================== */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent">
          {/* Toast Banner for Workflows */}
          {workflowToast && (
            <div className="p-3 bg-purple-950/60 border border-purple-500 text-purple-200 text-xs font-chakra font-bold uppercase tracking-wider flex items-center justify-between rounded-xs animate-in fade-in duration-150 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              <div className="flex items-center gap-2">
                <Zap size={15} className="animate-bounce text-purple-400" />
                <span>{workflowToast}</span>
              </div>
              <button
                onClick={() => setWorkflowToast(null)}
                className="text-mut hover:text-white"
              >
                &times;
              </button>
            </div>
          )}

          {/* TOP SECTION: GREETING CARD (LEFT) & HOLOGRAPHIC SPHERE (RIGHT/CENTER) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* GREETING & STATUS CARD (Span 5) */}
            <div className="lg:col-span-5 bg-[#120a24]/80 backdrop-blur-md border border-purple-500/25 hover:border-purple-400/50 transition-all p-4 rounded-sm flex flex-col justify-between relative group shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-purple-400">
                    <div className="w-7 h-7 rounded-full bg-purple-500/10 border border-purple-500/40 flex items-center justify-center">
                      <Radio size={14} className="animate-pulse" />
                    </div>
                    <span className="text-base font-chakra font-bold text-white">
                      {calculatedGreeting}
                    </span>
                  </div>

                  <button
                    onClick={() => setIsConfigOpen(true)}
                    className="p-1.5 text-mut hover:text-purple-300 hover:bg-purple-900/20 rounded-xs transition-colors"
                    title="Configure Greeting & Persona"
                  >
                    <Settings size={14} />
                  </button>
                </div>

                <div className="text-xs text-purple-300/90 font-medium font-sans mb-3">
                  {config.greetingSubtitle}
                </div>

                <div className="p-3 bg-black/40 border border-purple-500/20 rounded-xs text-xs text-mut font-sans italic leading-relaxed relative">
                  <span className="text-purple-400 font-mono text-sm mr-1">"</span>
                  {config.statusQuote}
                  <span className="text-purple-400 font-mono text-sm ml-1">"</span>
                </div>
              </div>

              {/* Bottom Equalizer and Quick Mode Badge */}
              <div className="flex items-center justify-between pt-3 border-t border-purple-500/20 mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-chakra font-bold uppercase tracking-wider text-mut">
                    Mission:
                  </span>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded-xs border border-purple-500/40">
                    {config.purposeMode.replace("_", " ").toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {[30, 60, 45, 90, 70, 40].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-purple-400/80 rounded-full animate-pulse"
                      style={{ height: `${h * 0.25}px`, animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* HOLOGRAPHIC 3D SPHERE RUNTIME (Span 7) */}
            <div className="lg:col-span-7 bg-[#120a24]/80 backdrop-blur-md border border-purple-500/25 rounded-sm flex items-center justify-center relative overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
              <WingmanHoloSphere />
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION: AGENTSHIELD-X PROTECTION LAYER (6 MODULES)      */}
          {/* ======================================================== */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-chakra font-bold tracking-[0.2em] uppercase text-white flex items-center gap-2">
                <Shield size={14} className="text-purple-400" />
                <span>AgentShield-X Protection Layer</span>
              </h2>
              <span className="text-[10px] font-mono text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-xs border border-purple-500/30">
                Autonomous Defense Mesh Active
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {[
                {
                  id: "toolInterception",
                  name: "Tool Interception",
                  desc: "Monitors & filters tool calls",
                  icon: Code,
                  path: "/policies",
                },
                {
                  id: "honeytools",
                  name: "Honeytools",
                  desc: "Deception tools & traps",
                  icon: AlertTriangle,
                  path: "/honeytools",
                },
                {
                  id: "auditLog",
                  name: "Audit Log",
                  desc: "Full agent activity trace",
                  icon: FileText,
                  path: "/audit",
                },
                {
                  id: "sandboxing",
                  name: "Sandboxing",
                  desc: "Isolated execution env",
                  icon: Box,
                  path: "/terminal",
                },
                {
                  id: "threatIntel",
                  name: "Threat Intel",
                  desc: "Real-time threat detection",
                  icon: Zap,
                  path: "/scans",
                },
                {
                  id: "mcpDefense",
                  name: "MCP Defense",
                  desc: "Validates MCP integrations",
                  icon: Network,
                  path: "/mcp",
                },
              ].map((mod) => {
                const isEnabled =
                  (config.protectionModules as any)[mod.id] ?? true;
                const Icon = mod.icon;

                return (
                  <button
                    key={mod.id}
                    onClick={() => navigate(mod.path)}
                    className="p-3 bg-[#120a24]/70 hover:bg-[#190f33] border border-purple-500/20 hover:border-purple-400/50 text-left rounded-sm transition-all group flex flex-col justify-between h-28 shadow-sm hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="w-6 h-6 rounded-xs bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                          <Icon size={13} />
                        </div>
                        <span
                          className={`text-[9px] font-mono font-bold flex items-center gap-1 ${
                            isEnabled ? "text-emerald-400" : "text-mut"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isEnabled ? "bg-emerald-400 animate-pulse" : "bg-mut"
                            }`}
                          />
                          {isEnabled ? "ACTIVE" : "OFF"}
                        </span>
                      </div>
                      <div className="text-xs font-chakra font-bold text-white group-hover:text-purple-300 transition-colors">
                        {mod.name}
                      </div>
                    </div>
                    <div className="text-[10px] text-mut font-sans leading-tight">
                      {mod.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION: ACTIVE AGENTS MATRIX (6 RUNNING AGENTS)         */}
          {/* ======================================================== */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-chakra font-bold tracking-[0.2em] uppercase text-white flex items-center gap-2">
                <Bot size={14} className="text-purple-400" />
                <span>Active Autonomous Agents</span>
              </h2>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-xs border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {config.activeAgents.filter((a) => a.enabled).length}/
                {config.activeAgents.length} Online
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {config.activeAgents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => navigate("/agents")}
                  className="p-3 bg-[#120a24]/70 hover:bg-[#1a0f35] border border-purple-500/20 hover:border-purple-400/60 rounded-sm transition-all cursor-pointer flex flex-col justify-between h-28 shadow-sm hover:shadow-[0_0_15px_rgba(168,85,247,0.25)]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="w-6 h-6 rounded-xs bg-purple-500/15 border border-purple-500/40 flex items-center justify-center text-purple-300">
                        {agent.id === "coding" && <Code size={13} />}
                        {agent.id === "research" && <Search size={13} />}
                        {agent.id === "browser" && <Globe size={13} />}
                        {agent.id === "memory" && <Database size={13} />}
                        {agent.id === "task" && <CheckCircle size={13} />}
                        {agent.id === "defense" && <Shield size={13} />}
                      </div>
                      <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Online
                      </span>
                    </div>
                    <div className="text-xs font-chakra font-bold text-white">
                      {agent.name}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[9px] text-mut font-sans truncate mr-1">
                      {agent.role}
                    </span>
                    {/* Mini Waveform / Sparkline */}
                    <div className="flex items-center gap-0.5 h-3 shrink-0">
                      {[30, 80, 50, 100].map((h, i) => (
                        <div
                          key={i}
                          className="w-0.5 bg-purple-400/80 rounded-full"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ======================================================== */}
          {/* BOTTOM SPLIT: SECURITY MONITOR & MEMORY/CONTEXT GRAPH   */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* CARD 1: SECURITY MONITOR (Span 6) */}
            <div className="lg:col-span-6 bg-[#120a24]/80 backdrop-blur-md border border-purple-500/25 hover:border-purple-400/40 transition-colors p-4 rounded-sm flex flex-col justify-between shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity size={15} className="text-purple-400" />
                  <span className="text-xs font-chakra font-bold uppercase tracking-wider text-white">
                    Biometric & Security Telemetry
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-xs border border-emerald-500/30">
                  Sub-5ms Interception Active
                </span>
              </div>

              {/* 3 Circular SVG Progress Rings */}
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-purple-500/20">
                {renderCircularGauge(
                  telemetry.cpu,
                  "CPU Load",
                  `${telemetry.cpu}%`,
                  "#c084fc"
                )}
                {renderCircularGauge(
                  telemetry.ram,
                  "Memory",
                  `${telemetry.ram}%`,
                  "#a855f7"
                )}
                {renderCircularGauge(
                  telemetry.riskScore,
                  "Risk Score",
                  `${telemetry.riskScore}/100`,
                  "#10b981"
                )}
              </div>

              {/* 4 Bottom Metric Indicators */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 font-chakra">
                <div>
                  <div className="text-[10px] text-mut uppercase">Blocked Threats</div>
                  <div className="text-sm font-extrabold text-white flex items-center gap-1 font-mono">
                    <span>{telemetry.blockedAttacks}</span>
                    <span className="text-[10px] text-rose-400 font-sans">&uarr; +12%</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-mut uppercase">Active Sessions</div>
                  <div className="text-sm font-extrabold text-white flex items-center gap-1 font-mono">
                    <span>{telemetry.activeSessions}</span>
                    <span className="text-[10px] text-purple-300 font-sans">&uarr; +2</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-mut uppercase">Token Velocity</div>
                  <div className="text-sm font-extrabold text-white flex items-center gap-1 font-mono">
                    <span>{telemetry.tokenVelocity} tok/s</span>
                    <span className="text-[10px] text-emerald-400 font-sans">&uarr; +5%</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-mut uppercase">Audit Entries</div>
                  <div className="text-sm font-extrabold text-white flex items-center gap-1 font-mono">
                    <span>{telemetry.toolCalls.toLocaleString()}</span>
                    <span className="text-[10px] text-purple-400 font-sans">SHA-256</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: MEMORY & CONTEXT INTERACTIVE GRAPH (Span 6) */}
            <div className="lg:col-span-6">
              <WingmanMemoryGraph />
            </div>
          </div>
        </main>

        {/* ======================================================== */}
        {/* COLUMN 3: RIGHT THREAT INTELLIGENCE & QUICK COMMANDS     */}
        {/* ======================================================== */}
        <aside className="w-80 shrink-0 border-l border-purple-500/20 bg-[#0a0518]/90 backdrop-blur-md flex flex-col justify-between p-3.5 space-y-3 z-20 overflow-y-auto">
          {/* SECTION A: LIVE INTELLIGENCE FEED */}
          <div className="p-3 bg-[#120a24]/80 border border-purple-500/25 rounded-sm space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-chakra font-bold uppercase tracking-wider text-white">
                  Live Intelligence Feed
                </span>
              </div>
              <span className="text-[9px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-xs border border-rose-500/30 font-bold">
                STREAM
              </span>
            </div>

            {/* Scrollable Alerts */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {[
                {
                  time: "10:45 PM",
                  title: "Prompt injection neutralized",
                  desc: "Cognitive boundary escape intercepted in Research Agent",
                  severity: "HIGH",
                  color: "bg-rose-500/20 text-rose-300 border border-rose-500/40",
                },
                {
                  time: "10:42 PM",
                  title: "Tool call rug-pull blocked",
                  desc: "Schema mutation prevented for weather_api",
                  severity: "HIGH",
                  color: "bg-rose-500/20 text-rose-300 border border-rose-500/40",
                },
                {
                  time: "10:40 PM",
                  title: "Behavioral drift alert",
                  desc: "Genome divergence &Delta; 0.48 on Coding Agent",
                  severity: "MEDIUM",
                  color: "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold",
                },
                {
                  time: "10:38 PM",
                  title: "Canary token breached",
                  desc: "Honeypot AS-CANARY-992 tripped by external curl",
                  severity: "MEDIUM",
                  color: "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold",
                },
                {
                  time: "10:36 PM",
                  title: "A2A Token attestation",
                  desc: "Ephemeral HMAC signed token verified for TaskBot",
                  severity: "LOW",
                  color: "bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold",
                },
              ].map((alert, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-black/40 border border-purple-500/20 hover:border-purple-400/40 rounded-xs transition-colors flex items-start justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono text-mut">
                        {alert.time}
                      </span>
                      <span className="text-xs font-chakra font-bold text-white leading-tight">
                        {alert.title}
                      </span>
                    </div>
                    <div className="text-[10px] text-mut font-sans leading-tight">
                      {alert.desc}
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-chakra px-1.5 py-0.5 rounded-xs shrink-0 ${alert.color}`}
                  >
                    {alert.severity}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-1 text-right">
              <Link
                to="/incidents"
                className="text-[11px] font-chakra font-bold text-purple-400 hover:text-white uppercase tracking-wider flex items-center justify-end gap-1"
              >
                <span>View All Threats</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>

          {/* SECTION B: QUICK COMMANDS */}
          <div className="p-3 bg-[#120a24]/80 border border-purple-500/25 rounded-sm space-y-2 shadow-sm">
            <div className="text-xs font-chakra font-bold uppercase tracking-wider text-white">
              AgentShield-X Quick Commands
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsTalkOpen(true)}
                className="p-2.5 bg-black/40 hover:bg-purple-600/20 border border-purple-500/25 hover:border-purple-400 rounded-xs text-left transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <Mic size={14} className="text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-mono text-mut">SPACE</span>
                </div>
                <div className="text-[11px] font-chakra font-bold text-white group-hover:text-purple-300">
                  Voice Dictation
                </div>
                <div className="text-[9px] text-mut">Talk to Wingman</div>
              </button>

              <button
                onClick={() => navigate("/genome")}
                className="p-2.5 bg-black/40 hover:bg-purple-600/20 border border-purple-500/25 hover:border-purple-400 rounded-xs text-left transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <Dna size={14} className="text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-mono text-mut font-bold">G</span>
                </div>
                <div className="text-[11px] font-chakra font-bold text-white group-hover:text-purple-300">
                  Agent Genome
                </div>
                <div className="text-[9px] text-mut">Biometric DNA profile</div>
              </button>

              <button
                onClick={triggerWorkflow}
                className="p-2.5 bg-black/40 hover:bg-purple-600/20 border border-purple-500/25 hover:border-purple-400 rounded-xs text-left transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <Play size={14} className="text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-mono text-mut font-bold">R</span>
                </div>
                <div className="text-[11px] font-chakra font-bold text-white group-hover:text-purple-300">
                  Run Workflow
                </div>
                <div className="text-[9px] text-mut">Execute auto defense</div>
              </button>

              <button
                onClick={() => navigate("/terminal")}
                className="p-2.5 bg-black/40 hover:bg-purple-600/20 border border-purple-500/25 hover:border-purple-400 rounded-xs text-left transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <Box size={14} className="text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-mono text-mut font-bold">S</span>
                </div>
                <div className="text-[11px] font-chakra font-bold text-white group-hover:text-purple-300">
                  Sandbox Shell
                </div>
                <div className="text-[9px] text-mut">Isolated agent exec</div>
              </button>
            </div>
          </div>

          {/* SECTION C: LLM & PROVIDER STATUS */}
          <div className="p-3 bg-[#120a24]/80 border border-purple-500/25 rounded-sm space-y-2 shadow-sm">
            <div className="flex items-center justify-between pb-1.5 border-b border-purple-500/20">
              <div className="text-xs font-chakra font-bold uppercase tracking-wider text-white">
                Multi-Agent Gateways
              </div>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-xs border border-emerald-500/30">
                5/6 Connected
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-chakra">
              {[
                { name: "Claude 3.7", status: "Online", latency: "145ms", color: "#10b981" },
                { name: "Gemini 2.5", status: "Online", latency: "112ms", color: "#10b981" },
                { name: "Cursor Agent", status: "Online", latency: "88ms", color: "#10b981" },
                { name: "OpenAI o3", status: "Online", latency: "165ms", color: "#10b981" },
                { name: "Local Ollama", status: "Online", latency: "42ms", color: "#10b981" },
                { name: "MCP Gateway", status: "Enforcing", latency: "3.4ms", color: "#c084fc" },
              ].map((prov) => (
                <div
                  key={prov.name}
                  className="p-2 bg-black/40 border border-purple-500/20 rounded-xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[11px]">{prov.name}</span>
                    <span
                      className="text-[9px] font-mono flex items-center gap-1"
                      style={{ color: prov.color }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: prov.color }}
                      />
                      {prov.status}
                    </span>
                  </div>
                  <div className="text-[9px] text-mut font-mono mt-1 text-right">
                    {prov.latency}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-1 text-right">
              <Link
                to="/models"
                className="text-[11px] font-chakra font-bold text-purple-400 hover:text-white uppercase tracking-wider flex items-center justify-end gap-1"
              >
                <span>Manage Models</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* 3. BOTTOM FLOATING ACTION BAR */}
      <footer className="h-14 border-t border-purple-500/20 bg-[#0c061a]/95 backdrop-blur-xl px-6 flex items-center justify-between shrink-0 z-30 relative shadow-2xl">
        {/* Left Subsystem Tag */}
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-purple-400" />
          <span className="text-xs font-chakra font-bold text-white tracking-wider">
            AgentShield-X
          </span>
          <span className="text-[11px] text-purple-300/70 font-sans">
            Universal Zero-Trust Runtime for Autonomous AI Agents
          </span>
        </div>

        {/* Center Live Threat Status */}
        <div className="hidden md:flex items-center gap-3 text-xs font-chakra font-bold">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle size={14} />
            <span>0 ACTIVE BREACHES</span>
          </div>
          <span className="text-purple-500/40">&bull;</span>
          <div className="flex items-center gap-1.5 text-purple-300">
            <Zap size={14} />
            <span>SUB-5MS LATENCY BUDGET</span>
          </div>
          <span className="text-purple-500/40">&bull;</span>
          <div className="flex items-center gap-1.5 text-mut">
            <Dna size={14} className="text-purple-400" />
            <span>BIOMETRIC DNA ENFORCING</span>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTalkOpen(true)}
            className="px-3 py-1.5 rounded-sm bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/50 text-xs font-chakra font-bold uppercase tracking-wider text-purple-200 hover:text-white transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
          >
            <Mic size={13} />
            <span>Voice Copilot</span>
          </button>
          <button
            onClick={() => navigate("/terminal")}
            className="px-3 py-1.5 rounded-sm bg-black/40 hover:bg-purple-900/30 border border-purple-500/30 text-xs font-chakra font-bold uppercase tracking-wider text-purple-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            <Terminal size={13} />
            <span>Terminal</span>
          </button>
        </div>
      </footer>

      {/* Floating Modals */}
      {isConfigOpen && (
        <WingmanConfigModal
          isOpen={isConfigOpen}
          config={config}
          onClose={() => setIsConfigOpen(false)}
          onUpdate={(newCfg: WingmanConfig) => setConfig(newCfg)}
        />
      )}

      {isTalkOpen && (
        <WingmanTalkModal
          isOpen={isTalkOpen}
          config={config}
          onClose={() => setIsTalkOpen(false)}
        />
      )}
    </div>
  );
};
