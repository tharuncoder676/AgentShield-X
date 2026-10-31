import React from "react";

interface CopilotTerminalBannerProps {
  userEmail?: string;
  projectName?: string;
  latencyMs?: number;
  commitHash?: string;
}

export const CopilotTerminalBanner: React.FC<CopilotTerminalBannerProps> = ({
  userEmail = "analyst@agentshield.test",
  projectName = "Customer-Support-Agent",
  latencyMs = 3.4,
  commitHash = "bb54243",
}) => {
  return (
    <div className="font-mono text-sm leading-relaxed select-text space-y-4">
      {/* Outer Bracketed Box matching AgentShield-X Obsidian-Purple Cyber Deck */}
      <div className="relative border border-purple-500/25 p-6 rounded-2xl bg-[#120a24]/85 backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.15)]">
        {/* Crisp Corner Brackets (Vivid Purple) */}
        <div className="absolute top-2 left-2 text-purple-400 text-xl font-bold select-none leading-none">┌</div>
        <div className="absolute top-2 right-2 text-purple-400 text-xl font-bold select-none leading-none">┐</div>
        <div className="absolute bottom-2 left-2 text-purple-400 text-xl font-bold select-none leading-none">└</div>
        <div className="absolute bottom-2 right-2 text-purple-400 text-xl font-bold select-none leading-none">┘</div>

        {/* Top welcome label */}
        <div className="text-purple-300 text-xs tracking-wider mb-2 font-mono pl-3 flex items-center gap-2">
          <span>Welcome to AgentShield-X</span>
          <span className="text-purple-400/50">•</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/40">AgentShield-X Edition</span>
        </div>

        {/* Center content: 3D block text + Pixel Art Mascot */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-2 px-3">
          {/* 3D Block Text */}
          <div className="flex flex-col">
            <pre className="text-purple-300 font-black text-[13px] sm:text-[15px] md:text-[17px] leading-[1.1] tracking-tight filter drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] select-none font-mono">
{`█▀▀█ █▀▀█ █▀▀▀ █▀▀▄ ▀▀█▀▀ █▀▀▀█ █  █ ▀█▀ █▀▀▀ █   █▀▀▄
█▄▄█ █ █▄ █▀▀  █  █   █   ▀▀▀▄▄ █▀▀█  █  █▀▀  █   █  █
▀  ▀ ▀▀▀▀ ▀▀▀▀ ▀  ▀   ▀   █▄▄▄█ ▀  ▀ ▀▀▀ ▀▀▀▀ ▀▀▀ ▀▀▀ `}
            </pre>
            <div className="text-right text-[11px] font-mono text-fuchsia-400/80 mt-2 tracking-wide pr-2">
              CLI Version 2.4.0
            </div>
          </div>

          {/* Pixel-Art Mascot (Cyber Guardian in Amethyst & Neon Orchid) */}
          <div className="flex-shrink-0 flex items-center justify-center p-2 rounded-xl bg-[#0a0518] border border-purple-500/30">
            <svg
              className="w-24 h-24 filter drop-shadow-[0_0_12px_rgba(188,140,255,0.4)]"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              shapeRendering="crispEdges"
            >
              {/* Outer Helmet / Ears / Shell (Cyber Fuchsia #e879f9) */}
              <rect x="7" y="1" width="10" height="2" fill="#e879f9" />
              <rect x="5" y="3" width="14" height="2" fill="#e879f9" />
              <rect x="3" y="5" width="4" height="6" fill="#e879f9" />
              <rect x="17" y="5" width="4" height="6" fill="#e879f9" />
              <rect x="2" y="11" width="4" height="6" fill="#e879f9" />
              <rect x="18" y="11" width="4" height="6" fill="#e879f9" />
              <rect x="3" y="17" width="18" height="2" fill="#e879f9" />
              <rect x="5" y="19" width="14" height="2" fill="#e879f9" />
              <rect x="8" y="21" width="8" height="1" fill="#e879f9" />

              {/* Neon Violet Visor / Face Plate (#c084fc / #a855f7) */}
              <rect x="5" y="5" width="6" height="5" fill="#c084fc" />
              <rect x="13" y="5" width="6" height="5" fill="#c084fc" />
              <rect x="5" y="11" width="14" height="3" fill="#c084fc" />

              {/* Visor Glint / Pupils (Obsidian #0a0518) */}
              <rect x="7" y="7" width="2" height="3" fill="#0a0518" />
              <rect x="15" y="7" width="2" height="3" fill="#0a0518" />

              {/* Status Beacons / Cyber Vent (#34d399) */}
              <rect x="9" y="14" width="2" height="4" fill="#34d399" />
              <rect x="13" y="14" width="2" height="4" fill="#34d399" />
            </svg>
          </div>
        </div>
      </div>

      {/* Meta Version & Attribution Line */}
      <div className="flex flex-wrap items-center gap-x-3 text-xs text-purple-300/80">
        <span className="text-white font-semibold">Version 2.4.0</span>
        <span>•</span>
        <span>Commit <code className="text-purple-300 bg-[#120a24] px-2 py-0.5 rounded border border-purple-500/30">{commitHash}</code></span>
        <span>•</span>
        <span>Lead Architect & Creator: <strong className="text-emerald-400">Tharunkumar.S</strong></span>
      </div>

      {/* Description */}
      <p className="text-xs text-purple-200/70 leading-relaxed max-w-3xl">
        AgentShield-X can verify, intercept, sandbox, and sanitize agentic tool calls right from your terminal. 
        Describe a task to get started or enter <code className="text-purple-300 bg-[#120a24] px-1.5 py-0.5 rounded border border-purple-500/30">?</code> or <code className="text-purple-300 bg-[#120a24] px-1.5 py-0.5 rounded border border-purple-500/30">/help</code> for commands. 
        AgentShield operates deterministically under 5ms with cryptographically attested audit trails.
      </p>

      {/* Connection Bullet List with Purple Dots */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)] flex-shrink-0"></span>
          <span className="text-purple-200/90">Connected to Universal MCP Server & SSE Gateway (Port 8002)</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)] flex-shrink-0"></span>
          <span className="text-purple-200/90">
            Logged in as user: <span className="text-white font-mono font-medium">{userEmail}</span> [Admin] · Project: <span className="text-white font-mono font-medium">{projectName}</span>
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] flex-shrink-0 animate-pulse"></span>
          <span className="text-purple-200/90">
            Deterministic AST Engine Active: <span className="text-emerald-400 font-semibold">{latencyMs}ms avg latency</span> (AgentShield-X Obsidian Mode)
          </span>
        </div>
      </div>
    </div>
  );
};
