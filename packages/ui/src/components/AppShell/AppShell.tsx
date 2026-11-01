import React, { useState } from "react";
import {
  Shield,
  Activity,
  AlertTriangle,
  Radio,
  FileCode,
  Users,
  Cpu,
  Eye,
  History,
  Settings,
  Search,
  CheckCircle,
  Menu,
  X,
  MapPin,
  CheckSquare,
  Lock,
  Terminal,
  Crosshair,
  Scale,
  Network,
  Sparkles,
  KeyRound,
  Database,
  TrendingUp,
  Dna,
  Globe,
  Film,
  Swords,
  BarChart3,
  Code2,
  Award,
  GitFork,
  Bot,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { ThemeToggle } from "../ThemeToggle/ThemeToggle";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  active?: boolean;
  href?: string;
}

export interface AppShellProps {
  children: React.ReactNode;
  currentPath?: string;
  onNavigate?: (id: string) => void;
  orgName?: string;
  projectName?: string;
  shieldActive?: boolean;
  onShieldToggle?: (active: boolean) => void;
  connectionStatus?: "connected" | "reconnecting" | "offline";
  onOpenCommandPalette?: () => void;
  userRole?: "owner" | "admin" | "analyst" | "viewer";
  className?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  currentPath = "overview",
  onNavigate,
  orgName = "Acme Corp",
  projectName = "Customer-Support-Agent",
  shieldActive = true,
  onShieldToggle,
  connectionStatus = "connected",
  onOpenCommandPalette,
  userRole = "owner",
  className,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { id: "shieldwing", label: "ShieldWing Studio", icon: <Bot size={16} />, badge: <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-cyan-500/20 text-cyan-300 font-mono font-bold animate-pulse">300+</span> },
    { id: "overview", label: "Overview", icon: <Activity size={16} /> },
    { id: "terminal", label: "Web Terminal", icon: <Terminal size={16} />, badge: <span className="text-[10px] px-1 py-0.2 rounded-sm bg-ok/20 text-ok font-mono font-bold">CLI</span> },
    { id: "live", label: "Live Feed", icon: <Radio size={16} />, badge: <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse" /> },
    { id: "scans", label: "Repo Scans", icon: <Search size={16} /> },
    { id: "swarm", label: "Swarm Defense", icon: <Network size={16} /> },
    { id: "debate", label: "Debate Judge", icon: <Scale size={16} /> },
    { id: "redteam", label: "Red-Team Swarm", icon: <Crosshair size={16} /> },
    { id: "autopolicy", label: "AutoPolicy", icon: <Sparkles size={16} /> },
    { id: "attestation", label: "A2A Attestation", icon: <KeyRound size={16} />, badge: <span className="text-[10px] px-1 py-0.2 rounded-sm bg-purple-500/20 text-purple-300 font-mono font-bold">ZTA</span> },
    { id: "immunity", label: "Immunity & Drift", icon: <TrendingUp size={16} />, badge: <span className="text-[10px] px-1 py-0.2 rounded-sm bg-emerald-400/20 text-emerald-400 font-mono font-bold">92%</span> },
    { id: "genome", label: "Agent Genome", icon: <Dna size={16} />, badge: <span className="text-[10px] px-1 py-0.2 rounded-sm bg-purple-400/20 text-purple-400 font-mono font-bold">DNA</span> },
    { id: "federation", label: "Federation Mesh", icon: <Globe size={16} />, badge: <span className="text-[10px] px-1 py-0.2 rounded-sm bg-purple-400/20 text-purple-300 font-mono font-bold">MESH</span> },
    { id: "forensics", label: "Attack Forensics", icon: <Film size={16} />, badge: <span className="text-[10px] px-1 py-0.2 rounded-sm bg-purple-400/20 text-purple-300 font-mono font-bold">REPLAY</span> },
    { id: "sim-lab", label: "Simulation Lab", icon: <Swords size={16} />, badge: <span className="text-[10px] px-1 py-0.2 rounded-sm bg-purple-400/20 text-purple-300 font-mono font-bold">WAR GAME</span> },
    { id: "executive", label: "Executive SOC", icon: <BarChart3 size={16} />, badge: <span className="text-[10px] px-1 py-0.2 rounded-sm bg-purple-500/20 text-purple-300 font-mono font-bold">SOC</span> },
    { id: "rbac", label: "RBAC & SSO", icon: <Users size={16} />, badge: <span className="text-[10px] px-1 py-0.2 rounded-sm bg-purple-500/20 text-purple-300 font-mono font-bold">SSO</span> },
    { id: "connectors", label: "Universal SDK", icon: <Code2 size={16} />, badge: <span className="text-[10px] px-1 py-0.2 rounded-sm bg-purple-500/20 text-purple-300 font-mono font-bold">SDK</span> },
    { id: "compliance", label: "Compliance & Trust", icon: <Award size={16} />, badge: <span className="text-[10px] px-1 py-0.2 rounded-sm bg-purple-500/20 text-purple-300 font-mono font-bold">100%</span> },
    { id: "canary", label: "A/B Canary Policies", icon: <GitFork size={16} />, badge: <span className="text-[10px] px-1 py-0.2 rounded-sm bg-purple-500/20 text-purple-300 font-mono font-bold">A/B</span> },
    { id: "chains", label: "Neuro-Symbolic DAG", icon: <Network size={16} />, badge: <span className="text-[10px] px-1 py-0.2 rounded-sm bg-purple-500/20 text-purple-300 font-mono font-bold">DAG</span> },
    { id: "forecasting", label: "Predictive Radar", icon: <TrendingUp size={16} />, badge: <span className="text-[10px] px-1 py-0.2 rounded-sm bg-purple-500/20 text-purple-300 font-mono font-bold">24H</span> },
    { id: "rag-firewall", label: "RAG Firewall", icon: <Database size={16} /> },
    { id: "incidents", label: "Incidents", icon: <AlertTriangle size={16} />, badge: <span className="text-[10px] px-1 py-0.2 rounded-sm bg-bad/20 text-bad font-mono">3</span> },
    { id: "sessions", label: "Sessions & Replay", icon: <History size={16} /> },
    { id: "agents", label: "Agents", icon: <Users size={16} /> },
    { id: "policies", label: "Policies", icon: <FileCode size={16} /> },
    { id: "approvals", label: "Approvals", icon: <CheckSquare size={16} /> },
    { id: "models", label: "Detectors & Models", icon: <Cpu size={16} /> },
    { id: "honeytools", label: "Honeytools", icon: <Eye size={16} /> },
    { id: "mcp", label: "MCP Proxy & Pins", icon: <Lock size={16} /> },
    { id: "audit", label: "Audit Log", icon: <CheckCircle size={16} /> },
    { id: "architecture", label: "Architecture", icon: <MapPin size={16} /> },
    { id: "settings", label: "Settings", icon: <Settings size={16} /> },
  ];

  const handleNav = (id: string) => {
    if (onNavigate) onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className={cn("min-h-screen bg-bg text-fg flex flex-col font-sans", className)}>
      {/* Top Banner if Shield is Bypassed */}
      {!shieldActive && (
        <div className="bg-bad text-white px-4 py-1.5 text-xs font-chakra font-bold tracking-wider uppercase text-center flex items-center justify-center gap-2">
          <AlertTriangle size={14} />
          <span>WARNING: AgentShield-X is currently BYPASSED. Tool calls execute uninspected.</span>
        </div>
      )}

      {/* Main Header */}
      <header className="h-14 border-b border-line bg-panel flex items-center justify-between px-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-mut hover:text-fg border border-line rounded-sm"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Logo / Brand */}
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-square.png"
              alt="AgentShield-X"
              className="w-7 h-7 rounded-lg border border-purple-500/40 object-cover shadow-sm shadow-purple-500/20"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-chakra font-bold text-sm tracking-wider uppercase text-fg leading-none flex items-center gap-1">
                  <span>Agent</span><span className="text-purple-400">Shield</span><span className="text-fuchsia-400">-X</span>
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  v2.4.0
                </span>
              </div>
              <span className="text-[10px] text-mut font-chakra leading-tight mt-0.5">
                {orgName} / {projectName}
              </span>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search / Command Palette Shortcut */}
          <button
            onClick={onOpenCommandPalette}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1 text-xs border border-line rounded-sm text-mut hover:text-fg hover:bg-line/20 transition-colors font-mono"
            aria-label="Search or run command"
          >
            <Search size={13} />
            <span className="hidden md:inline">Quick search...</span>
            <kbd className="px-1 text-[10px] bg-bg border border-line rounded-sm">Cmd+K</kbd>
          </button>

          {/* Connection State Indicator */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-chakra border border-line rounded-sm"
            title={`WebSocket: ${connectionStatus}`}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full inline-block",
                connectionStatus === "connected" && "bg-ok animate-pulse",
                connectionStatus === "reconnecting" && "bg-warn animate-ping",
                connectionStatus === "offline" && "bg-bad"
              )}
            />
            <span className="text-[11px] text-mut uppercase hidden sm:inline">
              {connectionStatus}
            </span>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle variant="segmented" />

          {/* User Role Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 border border-line rounded-sm text-[11px] font-chakra uppercase bg-bg/50">
            <span className="text-mut">Role:</span>
            <span className="text-ok font-semibold">{userRole}</span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-14 left-0 z-30 w-56 border-r border-line bg-panel flex flex-col justify-between transition-transform md:translate-x-0 md:static",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <nav className="p-2 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = currentPath === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-xs font-chakra font-medium tracking-wide rounded-sm transition-colors text-left",
                    isActive
                      ? "bg-line/30 text-fg border-l-2 border-l-ok font-semibold"
                      : "text-mut hover:text-fg hover:bg-line/20"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={cn(isActive ? "text-ok" : "text-mut")}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge}
                </button>
              );
            })}
          </nav>

          {/* Shield Status Widget at Bottom of Sidebar */}
          <div className="p-3 border-t border-line bg-bg/30 text-xs font-chakra">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-mut uppercase text-[10px] font-semibold">
                Autonomous Shield
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold px-1 py-0.2 rounded-sm",
                  shieldActive ? "bg-ok/20 text-ok" : "bg-bad/20 text-bad"
                )}
              >
                {shieldActive ? "ENFORCING" : "BYPASS"}
              </span>
            </div>

            <p className="text-[11px] text-mut font-sans leading-tight">
              {shieldActive
                ? "All tool calls evaluated against policies & ML models."
                : "Calls execute unmonitored."}
            </p>
          </div>
        </aside>

        {/* Backdrop for Mobile Nav */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-20 bg-bg/80 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-bg focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
};
