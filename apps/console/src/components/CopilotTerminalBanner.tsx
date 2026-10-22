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
  commitHash = "60bcce3",
}) => {
  return (
    <div className="font-mono text-sm leading-relaxed select-text space-y-4">
      {/* Outer Bracketed Box */}
      <div className="relative border-l-2 border-r-2 border-t-2 border-b-2 border-transparent p-4 pb-3 rounded bg-[#0d1117]/80 backdrop-blur-sm shadow-xl">
        {/* Corner Brackets */}
        <div className="absolute -top-1 -left-1 text-zinc-400 text-lg leading-none font-bold select-none">┌</div>
        <div className="absolute -top-1 -right-1 text-zinc-400 text-lg leading-none font-bold select-none">┐</div>
        <div className="absolute -bottom-1 -left-1 text-zinc-400 text-lg leading-none font-bold select-none">└</div>
        <div className="absolute -bottom-1 -right-1 text-zinc-400 text-lg leading-none font-bold select-none">┘</div>

        {/* Top welcome label */}
        <div className="text-zinc-400 text-xs tracking-wider mb-2 font-mono">
          Welcome to AgentShield-X Security Suite
        </div>

        {/* Center content: 3D block text + Pixel Art Mascot */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-2">
          {/* 3D Block Text */}
          <div className="flex flex-col">
            <pre className="text-[#58a6ff] font-extrabold text-[11px] sm:text-[13px] md:text-[15px] leading-[1.12] tracking-tight filter drop-shadow-[2px_2px_0px_#161b22] select-none">
{`   _____   ______ _____ _   _ _______ _____ _    _ _____ ______ _      _____  
  / ____| |  ____|_   _| \\ | |__   __/ ____| |  | |_   _|  ____| |    |  __ \\ 
 | |  __  | |__    | | |  \\| |  | | | (___ | |__| | | | | |__  | |    | |  | |
 | | |_ | |  __|   | | | . \` |  | |  \\___ \\|  __  | | | |  __| | |    | |  | |
 | |__| | | |____ _| |_| |\\  |  | |  ____) | |  | |_| |_| |____| |____| |__| |
  \\_____| |______|_____|_| \\_|  |_| |_____/|_|  |_|_____|______|______|_____/ `}
            </pre>
            <div className="text-right text-[11px] font-mono text-zinc-400 mt-2 tracking-wide">
              CLI Version 2.4.0 · Security Gateway
            </div>
          </div>

          {/* Pixel-Art Mascot (Cyber Guardian Octopus / Shield Drone matching reference image) */}
          <div className="flex-shrink-0 flex items-center justify-center">
            <svg
              className="w-28 h-28 filter drop-shadow-[0_0_12px_rgba(188,140,255,0.35)]"
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
        <span>Commit <code className="text-[#58a6ff] bg-[#161b22] px-1.5 py-0.5 rounded">{commitHash}</code></span>
        <span>•</span>
        <span>Architect & Creator: <strong className="text-emerald-400">Tharunkumar.S</strong></span>
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl">
        AgentShield-X can verify, intercept, sandbox, and sanitize agentic tool calls right from your terminal. 
        Describe a task to get started or enter <code className="text-[#38bdf8] bg-[#161b22] px-1 py-0.5 rounded">?</code> or <code className="text-[#38bdf8] bg-[#161b22] px-1 py-0.5 rounded">/help</code> for commands. 
        AgentShield operates deterministically under 5ms with cryptographically attested audit trails.
      </p>

      {/* Connection Bullet List */}
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse"></span>
          <span className="text-zinc-300">Connected to Universal MCP Server & SSE Gateway (Port 8002)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#58a6ff]"></span>
          <span className="text-zinc-300">
            Logged in as user: <span className="text-zinc-100 font-mono">{userEmail}</span> [Admin] · Project: <span className="text-zinc-100 font-mono">{projectName}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#3fb950]"></span>
          <span className="text-zinc-300">
            Deterministic AST Engine Active: <span className="text-emerald-400 font-semibold">{latencyMs}ms avg latency</span> (Zero-dependency sandbox)
          </span>
        </div>
      </div>
    </div>
  );
};
