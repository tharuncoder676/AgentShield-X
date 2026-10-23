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
      {/* Outer Bracketed Box matching GitHub Copilot CLI exact frame */}
      <div className="relative border border-[#30363d]/60 p-5 rounded-lg bg-[#0d1117] shadow-2xl">
        {/* Crisp Corner Brackets (White / Light Zinc) */}
        <div className="absolute top-2 left-2 text-zinc-300 text-xl font-bold select-none leading-none">┌</div>
        <div className="absolute top-2 right-2 text-zinc-300 text-xl font-bold select-none leading-none">┐</div>
        <div className="absolute bottom-2 left-2 text-zinc-300 text-xl font-bold select-none leading-none">└</div>
        <div className="absolute bottom-2 right-2 text-zinc-300 text-xl font-bold select-none leading-none">┘</div>

        {/* Top welcome label */}
        <div className="text-zinc-300 text-xs tracking-wider mb-2 font-mono pl-3">
          Welcome to AgentShield-X
        </div>

        {/* Center content: 3D block text + Pixel Art Mascot */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-2 px-3">
          {/* 3D Block Text */}
          <div className="flex flex-col">
            <pre className="text-[#58a6ff] font-black text-[13px] sm:text-[15px] md:text-[17px] leading-[1.1] tracking-tight filter drop-shadow-[2px_2px_0px_#090d13] select-none font-mono">
{`█▀▀█ █▀▀█ █▀▀▀ █▀▀▄ ▀▀█▀▀ █▀▀▀█ █  █ ▀█▀ █▀▀▀ █   █▀▀▄
█▄▄█ █ █▄ █▀▀  █  █   █   ▀▀▀▄▄ █▀▀█  █  █▀▀  █   █  █
▀  ▀ ▀▀▀▀ ▀▀▀▀ ▀  ▀   ▀   █▄▄▄█ ▀  ▀ ▀▀▀ ▀▀▀▀ ▀▀▀ ▀▀▀ `}
            </pre>
            <div className="text-right text-[11px] font-mono text-zinc-400 mt-2 tracking-wide pr-2">
              CLI Version 2.4.0
            </div>
          </div>

          {/* Pixel-Art Mascot (Cyber Guardian Octopus / Shield Drone matching reference image) */}
          <div className="flex-shrink-0 flex items-center justify-center p-2 rounded-lg bg-[#161b22]/60 border border-[#30363d]/50">
            <svg
              className="w-24 h-24 filter drop-shadow-[0_0_12px_rgba(188,140,255,0.4)]"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              shapeRendering="crispEdges"
            >
              {/* Outer Helmet / Ears / Shell (Magenta #bc8cff) */}
              <rect x="7" y="1" width="10" height="2" fill="#bc8cff" />
              <rect x="5" y="3" width="14" height="2" fill="#bc8cff" />
              <rect x="3" y="5" width="4" height="6" fill="#bc8cff" />
              <rect x="17" y="5" width="4" height="6" fill="#bc8cff" />
              <rect x="2" y="11" width="4" height="6" fill="#bc8cff" />
              <rect x="18" y="11" width="4" height="6" fill="#bc8cff" />
              <rect x="3" y="17" width="18" height="2" fill="#bc8cff" />
              <rect x="5" y="19" width="14" height="2" fill="#bc8cff" />
              <rect x="8" y="21" width="8" height="1" fill="#bc8cff" />

              {/* Cyan Visor / Face Plate (#58a6ff / #38bdf8) */}
              <rect x="5" y="5" width="6" height="5" fill="#38bdf8" />
              <rect x="13" y="5" width="6" height="5" fill="#38bdf8" />
              <rect x="5" y="11" width="14" height="3" fill="#38bdf8" />

              {/* Visor Glint / Pupils (Dark Navy #0d1117) */}
              <rect x="7" y="7" width="2" height="3" fill="#0d1117" />
              <rect x="15" y="7" width="2" height="3" fill="#0d1117" />

              {/* Green Core Status Beacons / Cyber Vent (#3fb950) */}
              <rect x="9" y="14" width="2" height="4" fill="#3fb950" />
              <rect x="13" y="14" width="2" height="4" fill="#3fb950" />
            </svg>
          </div>
        </div>
      </div>

      {/* Meta Version & Attribution Line */}
      <div className="flex flex-wrap items-center gap-x-3 text-xs text-zinc-400">
        <span className="text-zinc-200 font-semibold">Version 2.4.0</span>
        <span>•</span>
        <span>Commit <code className="text-[#58a6ff] bg-[#161b22] px-1.5 py-0.5 rounded border border-[#30363d]">{commitHash}</code></span>
        <span>•</span>
        <span>Lead Architect & Creator: <strong className="text-emerald-400">Tharunkumar.S</strong></span>
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl">
        AgentShield-X can verify, intercept, sandbox, and sanitize agentic tool calls right from your terminal. 
        Describe a task to get started or enter <code className="text-[#38bdf8] bg-[#161b22] px-1 py-0.5 rounded border border-[#30363d]">?</code> or <code className="text-[#38bdf8] bg-[#161b22] px-1 py-0.5 rounded border border-[#30363d]">/help</code> for commands. 
        AgentShield operates deterministically under 5ms with cryptographically attested audit trails.
      </p>

      {/* Connection Bullet List with Copilot Style Dots */}
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#58a6ff] flex-shrink-0"></span>
          <span className="text-zinc-300">Connected to Universal MCP Server & SSE Gateway (Port 8002)</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#58a6ff] flex-shrink-0"></span>
          <span className="text-zinc-300">
            Logged in as user: <span className="text-zinc-100 font-mono font-medium">{userEmail}</span> [Admin] · Project: <span className="text-zinc-100 font-mono font-medium">{projectName}</span>
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3fb950] flex-shrink-0 animate-pulse"></span>
          <span className="text-zinc-300">
            Deterministic AST Engine Active: <span className="text-emerald-400 font-semibold">{latencyMs}ms avg latency</span> (Zero-dependency sandbox)
          </span>
        </div>
      </div>
    </div>
  );
};
