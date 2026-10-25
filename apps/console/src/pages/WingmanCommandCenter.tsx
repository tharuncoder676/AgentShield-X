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

  // Simulated live hardware telemetry
  const [telemetry, setTelemetry] = useState({
    cpu: 18,
    ram: 52,
    riskScore: 8,
    blockedAttacks: 127,
    activeSessions: 6,
    toolCalls: 1248,
    threatsDetected: 23,
  });

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
      }));
    }, 3500);
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

  // Render SVG Circular Gauge helper
  const renderCircularGauge = (
    value: number,
    label: string,
    sublabel: string,
    color: string = "#00e5ff"
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
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Value progress arc */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke={color}
              strokeWidth="6"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
              style={{ filter: `drop-shadow(0 0 6px ${color})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[11px] font-chakra font-bold text-mut uppercase">
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
    <div className="min-h-screen bg-[#060b13] text-[#e8eef7] font-sans flex flex-col overflow-x-hidden selection:bg-ok/30 selection:text-ok">
      {/* 1. TOP CYBER COMMAND HEADER */}
      <header className="h-16 border-b border-[#14233a] bg-[#080f1c]/90 backdrop-blur-md px-5 flex items-center justify-between shrink-0 z-30">
        {/* Left Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-ok/10 border border-ok/60 flex items-center justify-center text-ok shadow-[0_0_15px_rgba(0,229,255,0.4)]">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 3L3 7V12C3 17 7 21 12 22C17 21 21 17 21 12V7L12 3Z"
                stroke="#00e5ff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 7V17M7 10L12 14L17 10"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-chakra font-extrabold tracking-[0.18em] text-white">
                WINGMAN
              </span>
              <span className="text-xs font-chakra font-bold text-ok tracking-wider">
                AgentShield-X
              </span>
            </div>
            <div className="text-[10px] text-mut font-chakra tracking-wider">
              Your AI Agents. Secured for the Real World.
            </div>
          </div>
        </div>

        {/* Center Digital Clock & Tag */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="text-[10px] font-chakra font-bold uppercase tracking-[0.25em] text-mut">
            AgentShield-X Command Center
          </div>
          <div className="text-[10px] font-mono tracking-widest text-mut/80">
            {currentDate || "MONDAY, 16 JUNE 2025"}
          </div>
          <div className="text-xl font-chakra font-extrabold tracking-[0.15em] text-ok drop-shadow-[0_0_10px_rgba(0,229,255,0.7)] leading-none mt-0.5">
            {currentTime || "10:47:32 PM"}
          </div>
        </div>

        {/* Right Status & Operator Controls */}
        <div className="flex items-center gap-3">
          {/* System Secure Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#0c172a] border border-[#1e3455] rounded-xs text-xs font-chakra">
            <Shield size={14} className="text-ok" />
            <span className="text-white font-bold">System Secure</span>
            <span className="text-mut text-[11px]">&bull; All Agents Online</span>
          </div>

          {/* Threat Level Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0c172a] border border-[#1e3455] rounded-xs text-xs font-chakra">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            <span className="text-mut text-[11px] uppercase">Threat Level:</span>
            <span className="text-[#10b981] font-bold uppercase tracking-wider">LOW</span>
          </div>

          {/* Notification Bell */}
          <button
            onClick={() => navigate("/incidents")}
            className="relative p-2 bg-[#0c172a] border border-[#1e3455] hover:border-ok/60 text-mut hover:text-white rounded-xs transition-colors"
            title="3 Recent Security Incidents"
          >
            <Bell size={16} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-ok shadow-glow" />
          </button>

          {/* Operator Profile Pill -> Opens Config Studio */}
          <button
            onClick={() => setIsConfigOpen(true)}
            className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 bg-[#0c172a] hover:bg-ok/10 border border-[#1e3455] hover:border-ok/60 rounded-xs transition-all group"
            title="Configure Wingman AI, Greetings, Purpose & Personas"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#00e5ff] to-[#38bdf8] text-black font-chakra font-extrabold text-xs flex items-center justify-center shadow-glow">
              {config.operatorName.charAt(0).toUpperCase() || "T"}
            </div>
            <div className="text-left font-chakra">
              <div className="text-xs font-bold text-white leading-none group-hover:text-ok transition-colors">
                {config.operatorName}
              </div>
              <div className="text-[10px] text-ok/80 leading-none mt-0.5">
                {config.operatorRole}
              </div>
            </div>
            <Settings size={13} className="text-mut group-hover:text-ok group-hover:rotate-45 transition-all ml-1" />
          </button>
        </div>
      </header>

      {/* 2. MAIN 3-COLUMN COCKPIT LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        {/* ======================================================== */}
        {/* COLUMN 1: LEFT CYBER NAVIGATION & VOICE ASSISTANT WIDGET */}
        {/* ======================================================== */}
        <aside className="w-56 shrink-0 border-r border-[#14233a] bg-[#070d18] flex flex-col justify-between p-3 z-20">
          {/* Navigation Links */}
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-chakra font-bold text-mut uppercase tracking-[0.2em]">
              Navigation
            </div>

            {[
              { id: "command-center", label: "Command Center", icon: Activity, path: "/command-center", active: true },
              { id: "ai-core", label: "AI Core", icon: Cpu, path: "/models" },
              { id: "agents", label: "Agents", icon: Bot, path: "/agents", badge: "6" },
              { id: "security", label: "Security", icon: Shield, path: "/incidents", badge: "3" },
              { id: "tasks", label: "Tasks", icon: Layers, path: "/sessions" },
              { id: "memory", label: "Memory", icon: Database, path: "/rag-firewall" },
              { id: "logs", label: "Logs", icon: FileText, path: "/audit" },
              { id: "workflows", label: "Workflows", icon: Play, path: "/policies" },
              { id: "knowledge", label: "Knowledge Base", icon: Box, path: "/attestation" },
              { id: "tools-mcp", label: "Tools & MCP", icon: Network, path: "/mcp" },
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
                      ? "bg-ok/15 text-ok border border-ok/60 shadow-[0_0_12px_rgba(0,229,255,0.25)] font-bold"
                      : "text-mut hover:text-white hover:bg-panel/60 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={14} className={nav.active ? "text-ok" : "text-mut"} />
                    <span>{nav.label}</span>
                  </div>
                  {nav.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-ok/20 text-ok border border-ok/30 rounded-xs">
                      {nav.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Settings link opens the Config Studio */}
            <button
              onClick={() => setIsConfigOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-chakra font-semibold text-mut hover:text-white hover:bg-panel/60 border border-transparent rounded-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Settings size={14} className="text-mut" />
                <span>Settings</span>
              </div>
              <span className="text-[9px] font-mono text-ok bg-ok/10 px-1 rounded-xs">
                CONFIG
              </span>
            </button>
          </div>

          {/* Bottom Left Voice Assistant Widget (Pulsing Mic) */}
          <div className="mt-4 p-3 bg-[#0a1322] border border-[#162744] rounded-sm flex flex-col items-center text-center shadow-lg relative overflow-hidden group">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-[10px] font-chakra font-bold text-mut uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-ok animate-ping" />
                Voice Assistant
              </span>
              <span className="text-[9px] font-mono text-ok/80">Listening...</span>
            </div>

            {/* Sound Equalizer Waveform */}
            <div className="flex items-center justify-center gap-0.5 h-6 w-full mb-3">
              {[25, 45, 80, 100, 60, 90, 40, 70, 95, 50, 85, 30].map((h, idx) => (
                <div
                  key={idx}
                  className="w-1 bg-ok/70 rounded-full animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${idx * 80}ms`,
                  }}
                />
              ))}
            </div>

            {/* Big Circular Glowing Holographic Mic Button */}
            <div className="relative my-1 flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 w-16 h-16 rounded-full border border-ok/40 animate-ping opacity-25 pointer-events-none" />
              <button
                onClick={() => setIsTalkOpen(true)}
                className="w-16 h-16 rounded-full bg-gradient-to-b from-[#0e1d33] to-[#081220] border-2 border-ok hover:border-white shadow-[0_0_25px_rgba(0,229,255,0.4)] flex flex-col items-center justify-center text-ok hover:text-white transition-all transform hover:scale-105 active:scale-95 group/btn"
                title={`Click to talk with Wingman or press Spacebar`}
              >
                <Mic size={22} className="group-hover/btn:drop-shadow-[0_0_8px_rgba(0,229,255,0.9)]" />
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
        <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-[#060b13] via-[#070e1a] to-[#050910]">
          {/* Toast Banner for Workflows */}
          {workflowToast && (
            <div className="p-3 bg-ok/10 border border-ok text-ok text-xs font-chakra font-bold uppercase tracking-wider flex items-center justify-between rounded-xs animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <Zap size={15} className="animate-bounce" />
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
            <div className="lg:col-span-5 bg-[#0b1424] border border-[#162744] hover:border-ok/50 transition-colors p-4 rounded-sm flex flex-col justify-between relative group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-ok">
                    <div className="w-7 h-7 rounded-full bg-ok/10 border border-ok/40 flex items-center justify-center">
                      <Radio size={14} className="animate-pulse" />
                    </div>
                    <span className="text-base font-chakra font-bold text-white">
                      {calculatedGreeting}
                    </span>
                  </div>

                  <button
                    onClick={() => setIsConfigOpen(true)}
                    className="p-1.5 text-mut hover:text-ok hover:bg-ok/10 rounded-xs transition-colors"
                    title="Configure Greeting & Persona"
                  >
                    <Settings size={14} />
                  </button>
                </div>

                <div className="text-xs text-ok/90 font-medium font-sans mb-3">
                  {config.greetingSubtitle}
                </div>

                <div className="p-3 bg-[#070d18]/90 border border-line/60 rounded-xs text-xs text-mut font-sans italic leading-relaxed relative">
                  <span className="text-ok font-mono text-sm mr-1">"</span>
                  {config.statusQuote}
                  <span className="text-ok font-mono text-sm ml-1">"</span>
                </div>
              </div>

              {/* Bottom Equalizer and Quick Mode Badge */}
              <div className="flex items-center justify-between pt-3 border-t border-line/40 mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-chakra font-bold uppercase tracking-wider text-mut">
                    Mission:
                  </span>
                  <span className="text-[10px] font-mono text-ok bg-ok/10 px-1.5 py-0.5 rounded-xs border border-ok/30">
                    {config.purposeMode.replace("_", " ").toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {[30, 60, 45, 90, 70, 40].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-ok/60 rounded-full animate-pulse"
                      style={{ height: `${h * 0.25}px`, animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* HOLOGRAPHIC 3D SPHERE RUNTIME (Span 7) */}
            <div className="lg:col-span-7 bg-[#08101e] border border-[#162744] rounded-sm flex items-center justify-center relative overflow-hidden shadow-inner">
              <WingmanHoloSphere />
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION: AGENTSHIELD-X PROTECTION LAYER (6 MODULES)      */}
          {/* ======================================================== */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-chakra font-bold tracking-[0.2em] uppercase text-white flex items-center gap-2">
                <Shield size={14} className="text-ok" />
                <span>AgentShield-X Protection Layer</span>
              </h2>
              <span className="text-[10px] font-mono text-ok bg-ok/10 px-2 py-0.5 rounded-xs border border-ok/30">
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
                    className="p-3 bg-[#0b1424] hover:bg-[#0f1d35] border border-[#162744] hover:border-ok/60 text-left rounded-sm transition-all group flex flex-col justify-between h-28"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="w-6 h-6 rounded-xs bg-ok/10 border border-ok/30 flex items-center justify-center text-ok group-hover:scale-110 transition-transform">
                          <Icon size={13} />
                        </div>
                        <span
                          className={`text-[9px] font-mono font-bold flex items-center gap-1 ${
                            isEnabled ? "text-[#10b981]" : "text-mut"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isEnabled ? "bg-[#10b981] animate-pulse" : "bg-mut"
                            }`}
                          />
                          {isEnabled ? "ACTIVE" : "OFF"}
                        </span>
                      </div>
                      <div className="text-xs font-chakra font-bold text-white group-hover:text-ok transition-colors">
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
                <Bot size={14} className="text-ok" />
                <span>Active Agents</span>
              </h2>
              <span className="text-[10px] font-mono text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded-xs border border-[#10b981]/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                {config.activeAgents.filter((a) => a.enabled).length}/
                {config.activeAgents.length} Online
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {config.activeAgents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => navigate("/agents")}
                  className="p-3 bg-[#0b1424] hover:bg-[#0f1d35] border border-[#162744] hover:border-ok/60 rounded-sm transition-all cursor-pointer flex flex-col justify-between h-28"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="w-6 h-6 rounded-xs bg-ok/10 border border-ok/30 flex items-center justify-center text-ok">
                        {agent.id === "coding" && <Code size={13} />}
                        {agent.id === "research" && <Search size={13} />}
                        {agent.id === "browser" && <Globe size={13} />}
                        {agent.id === "memory" && <Database size={13} />}
                        {agent.id === "task" && <CheckCircle size={13} />}
                        {agent.id === "defense" && <Shield size={13} />}
                      </div>
                      <span className="text-[9px] font-mono text-[#10b981] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
                        Running
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
                          className="w-0.5 bg-ok/70 rounded-full"
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
            <div className="lg:col-span-6 bg-[#0b1424] border border-[#162744] hover:border-ok/40 transition-colors p-4 rounded-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity size={15} className="text-ok" />
                  <span className="text-xs font-chakra font-bold uppercase tracking-wider text-white">
                    Security Monitor
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded-xs border border-[#10b981]/30">
                  Sub-5ms Interception Active
                </span>
              </div>

              {/* 3 Circular SVG Progress Rings */}
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-line/40">
                {renderCircularGauge(
                  telemetry.cpu,
                  "CPU",
                  `${telemetry.cpu}%`,
                  "#00e5ff"
                )}
                {renderCircularGauge(
                  telemetry.ram,
                  "RAM",
                  `${telemetry.ram}%`,
                  "#38bdf8"
                )}
                {renderCircularGauge(
                  telemetry.riskScore,
                  "Risk Score",
                  `${telemetry.riskScore}/100`,
                  "#10b981"
                )}
              </div>

              {/* 4 Bottom Metric Indicators with Sparklines */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 font-chakra">
                <div>
                  <div className="text-[10px] text-mut uppercase">Blocked Attacks</div>
                  <div className="text-sm font-extrabold text-white flex items-center gap-1 font-mono">
                    <span>{telemetry.blockedAttacks}</span>
                    <span className="text-[10px] text-[#ef4444] font-sans">&uarr; +12%</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-mut uppercase">Active Sessions</div>
                  <div className="text-sm font-extrabold text-white flex items-center gap-1 font-mono">
                    <span>{telemetry.activeSessions}</span>
                    <span className="text-[10px] text-[#38bdf8] font-sans">&uarr; +2</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-mut uppercase">Tool Calls (Today)</div>
                  <div className="text-sm font-extrabold text-white flex items-center gap-1 font-mono">
                    <span>{telemetry.toolCalls.toLocaleString()}</span>
                    <span className="text-[10px] text-[#10b981] font-sans">&darr; -18%</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-mut uppercase">Threats Detected</div>
                  <div className="text-sm font-extrabold text-white flex items-center gap-1 font-mono">
                    <span>{telemetry.threatsDetected}</span>
                    <span className="text-[10px] text-[#f59e0b] font-sans">&uarr; +5%</span>
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
        <aside className="w-80 shrink-0 border-l border-[#14233a] bg-[#070d18] flex flex-col justify-between p-3.5 space-y-3 z-20 overflow-y-auto">
          {/* SECTION A: LIVE INTELLIGENCE FEED */}
          <div className="p-3 bg-[#0a1322] border border-[#162744] rounded-sm space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-line/40">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
                <span className="text-xs font-chakra font-bold uppercase tracking-wider text-white">
                  Live Intelligence Feed
                </span>
              </div>
              <span className="text-[9px] font-mono text-[#ef4444] bg-[#ef4444]/10 px-1.5 py-0.5 rounded-xs border border-[#ef4444]/30 font-bold">
                LIVE
              </span>
            </div>

            {/* Scrollable Alerts */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {[
                {
                  time: "10:45 PM",
                  title: "Prompt injection blocked",
                  desc: "Malicious prompt attempt detected in Research Agent",
                  severity: "HIGH",
                  color: "bg-[#ef4444] text-white",
                },
                {
                  time: "10:42 PM",
                  title: "Suspicious tool call denied",
                  desc: "File system access blocked (/etc/passwd)",
                  severity: "HIGH",
                  color: "bg-[#ef4444] text-white",
                },
                {
                  time: "10:40 PM",
                  title: "MCP tool signature mismatch detected",
                  desc: "Unverified MCP server: weather-pro-mcp",
                  severity: "MEDIUM",
                  color: "bg-[#f59e0b] text-black font-bold",
                },
                {
                  time: "10:38 PM",
                  title: "Honeytool access detected",
                  desc: "Attacker attempted to access fake API key",
                  severity: "MEDIUM",
                  color: "bg-[#f59e0b] text-black font-bold",
                },
                {
                  time: "10:36 PM",
                  title: "Anomalous agent behavior",
                  desc: "Browser Agent making unusual requests",
                  severity: "LOW",
                  color: "bg-[#38bdf8] text-black font-bold",
                },
              ].map((alert, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-[#070d18] border border-line/50 hover:border-ok/40 rounded-xs transition-colors flex items-start justify-between gap-2"
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
                className="text-[11px] font-chakra font-bold text-ok hover:text-white uppercase tracking-wider flex items-center justify-end gap-1"
              >
                <span>View All Threats</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>

          {/* SECTION B: QUICK COMMANDS */}
          <div className="p-3 bg-[#0a1322] border border-[#162744] rounded-sm space-y-2">
            <div className="text-xs font-chakra font-bold uppercase tracking-wider text-white">
              Quick Commands
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsTalkOpen(true)}
                className="p-2.5 bg-[#0e1828] hover:bg-ok/20 border border-[#1e3455] hover:border-ok rounded-xs text-left transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <Mic size={14} className="text-ok group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-mono text-mut">VOICE</span>
                </div>
                <div className="text-[11px] font-chakra font-bold text-white group-hover:text-ok">
                  Start Voice Mode
                </div>
                <div className="text-[9px] text-mut">Talk to Wingman</div>
              </button>

              <button
                onClick={() => navigate("/audit")}
                className="p-2.5 bg-[#0e1828] hover:bg-ok/20 border border-[#1e3455] hover:border-ok rounded-xs text-left transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <FileText size={14} className="text-ok group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-mono text-mut font-bold">L</span>
                </div>
                <div className="text-[11px] font-chakra font-bold text-white group-hover:text-ok">
                  Open Security Logs
                </div>
                <div className="text-[9px] text-mut">View recent events</div>
              </button>

              <button
                onClick={triggerWorkflow}
                className="p-2.5 bg-[#0e1828] hover:bg-ok/20 border border-[#1e3455] hover:border-ok rounded-xs text-left transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <Play size={14} className="text-ok group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-mono text-mut font-bold">R</span>
                </div>
                <div className="text-[11px] font-chakra font-bold text-white group-hover:text-ok">
                  Run Workflow
                </div>
                <div className="text-[9px] text-mut">Execute saved workflow</div>
              </button>

              <button
                onClick={() => navigate("/terminal")}
                className="p-2.5 bg-[#0e1828] hover:bg-ok/20 border border-[#1e3455] hover:border-ok rounded-xs text-left transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <Box size={14} className="text-ok group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-mono text-mut font-bold">S</span>
                </div>
                <div className="text-[11px] font-chakra font-bold text-white group-hover:text-ok">
                  Launch Sandbox
                </div>
                <div className="text-[9px] text-mut">Isolated agent env</div>
              </button>
            </div>
          </div>

          {/* SECTION C: LLM & PROVIDER STATUS */}
          <div className="p-3 bg-[#0a1322] border border-[#162744] rounded-sm space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-line/40">
              <div className="text-xs font-chakra font-bold uppercase tracking-wider text-white">
                LLM & Provider Status
              </div>
              <span className="text-[9px] font-mono text-[#10b981] bg-[#10b981]/10 px-1.5 py-0.5 rounded-xs border border-[#10b981]/30">
                5/6 Online
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-chakra">
              {[
                { name: "OpenAI", status: "Online", latency: "152ms", color: "#10b981" },
                { name: "Claude", status: "Online", latency: "182ms", color: "#10b981" },
                { name: "Gemini", status: "Online", latency: "201ms", color: "#10b981" },
                { name: "Cursor", status: "Online", latency: "98ms", color: "#10b981" },
                { name: "Ollama", status: "Online", latency: "66ms", color: "#10b981" },
                { name: "OpenRouter", status: "Degraded", latency: "421ms", color: "#f59e0b" },
              ].map((prov) => (
                <div
                  key={prov.name}
                  className="p-2 bg-[#070d18] border border-line/50 rounded-xs flex flex-col justify-between"
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
                className="text-[11px] font-chakra font-bold text-ok hover:text-white uppercase tracking-wider flex items-center justify-end gap-1"
              >
                <span>Manage Providers</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* 3. BOTTOM FLOATING ACTION BAR */}
      <footer className="h-14 border-t border-[#14233a] bg-[#070e1b]/95 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-30">
        {/* Left Subsystem Tag */}
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-ok" />
          <span className="text-xs font-chakra font-bold text-white tracking-wider">
            AgentShield-X
          </span>
          <span className="text-[11px] text-mut font-sans">
            Autonomous Security for AI Agents
          </span>
        </div>

        {/* Center TALK TO WINGMAN Big Pill Button */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => setIsTalkOpen(true)}
            className="px-8 py-2 bg-gradient-to-r from-[#00e5ff]/20 via-[#00e5ff]/30 to-[#00e5ff]/20 hover:from-[#00e5ff]/40 hover:to-[#00e5ff]/40 border-2 border-ok text-ok hover:text-white rounded-full shadow-[0_0_20px_rgba(0,229,255,0.4)] flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 group font-chakra"
            title={`Talk to Wingman (${config.wakeWordPrimary})`}
          >
            <div className="flex items-center gap-1 h-3">
              {[40, 90, 60, 100, 70, 30].map((h, i) => (
                <div
                  key={i}
                  className="w-0.5 bg-ok rounded-full group-hover:bg-white animate-pulse"
                  style={{ height: `${h}%`, animationDelay: `${i * 120}ms` }}
                />
              ))}
            </div>
            <div className="text-center">
              <span className="text-xs font-extrabold uppercase tracking-[0.2em] block drop-shadow-[0_0_6px_rgba(0,229,255,0.8)]">
                TALK TO WINGMAN
              </span>
              <span className="text-[9px] text-ok/80 font-mono block leading-none">
                "{config.wakeWordPrimary}"
              </span>
            </div>
            <Mic size={15} className="group-hover:drop-shadow-[0_0_8px_rgba(0,229,255,0.9)]" />
          </button>
        </div>

        {/* Right Status Indicators */}
        <div className="flex items-center gap-4 text-xs font-chakra text-mut">
          <span className="font-mono text-mut/80">v0.3.0</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            <span className="text-white font-medium">All Systems Operational</span>
          </div>

          <button
            onClick={() => setIsConfigOpen(true)}
            className="p-1.5 hover:text-white transition-colors"
            title="Configure Wingman"
          >
            <Settings size={15} />
          </button>

          <button
            onClick={() =>
              alert(
                "AgentShield-X & WINGMAN Copilot created by Tharunkumar.S. Autonomous defense mesh with sub-5ms interception."
              )
            }
            className="p-1.5 hover:text-white transition-colors"
            title="System Info"
          >
            <HelpCircle size={15} />
          </button>

          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
            className="p-1.5 hover:text-white transition-colors"
            title="Toggle Fullscreen Command Deck"
          >
            <Maximize2 size={15} />
          </button>
        </div>
      </footer>

      {/* ======================================================== */}
      {/* MODALS: CONFIGURATION STUDIO & TALK HUD                   */}
      {/* ======================================================== */}
      <WingmanConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onUpdate={(newCfg) => setConfig(newCfg)}
      />

      <WingmanTalkModal
        isOpen={isTalkOpen}
        onClose={() => setIsTalkOpen(false)}
        config={config}
        onNavigate={(path) => navigate(path)}
      />
    </div>
  );
};
