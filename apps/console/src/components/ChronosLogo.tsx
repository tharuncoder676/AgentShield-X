import React from "react";

interface ChronosLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  animated?: boolean;
  className?: string;
}

export const ChronosLogo: React.FC<ChronosLogoProps> = ({
  size = "md",
  showText = false,
  animated = true,
  className = ""
}) => {
  const sizeMap = {
    xs: { dim: 20, font: "text-xs", sub: "text-[8px]" },
    sm: { dim: 28, font: "text-sm", sub: "text-[9px]" },
    md: { dim: 40, font: "text-base", sub: "text-[10px]" },
    lg: { dim: 56, font: "text-xl", sub: "text-xs" },
    xl: { dim: 80, font: "text-3xl", sub: "text-sm" }
  };

  const { dim, font, sub } = sizeMap[size];

  return (
    <div className={`inline-flex items-center space-x-2.5 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Ambient Neon Backlight Bloom */}
        {animated && (
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#a855f7]/40 via-[#c084fc]/30 to-[#38bdf8]/30 blur-md animate-pulse"
            style={{ width: dim * 1.25, height: dim * 1.25, transform: "translate(-10%, -10%)" }}
          />
        )}

        <svg
          width={dim}
          height={dim}
          viewBox="0 0 128 128"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`relative z-10 ${animated ? "transition-transform hover:scale-105 duration-300" : ""}`}
        >
          <defs>
            <linearGradient id="chrPurple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#e9d5ff" />
              <stop offset="30%" stop-color="#c084fc" />
              <stop offset="70%" stop-color="#9333ea" />
              <stop offset="100%" stop-color="#6b21a8" />
            </linearGradient>

            <linearGradient id="chrCyan" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#38bdf8" />
              <stop offset="60%" stop-color="#818cf8" />
              <stop offset="100%" stop-color="#c084fc" />
            </linearGradient>

            <radialGradient id="chrCenterGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#f5d0fe" stop-opacity="0.9" />
              <stop offset="40%" stop-color="#c084fc" stop-opacity="0.5" />
              <stop offset="80%" stop-color="#7e22ce" stop-opacity="0.15" />
              <stop offset="100%" stop-color="#000000" stop-opacity="0" />
            </radialGradient>

            <filter id="chrBloom" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Central Radial Light Field */}
          <circle cx="64" cy="64" r="54" fill="url(#chrCenterGlow)" />

          {/* Outer Astrolabe Chronometer Ring */}
          <circle
            cx="64"
            cy="64"
            r="58"
            stroke="url(#chrPurple)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            opacity="0.6"
            className={animated ? "origin-center animate-[spin_30s_linear_infinite]" : ""}
          />
          <circle cx="64" cy="64" r="52" stroke="url(#chrCyan)" strokeWidth="1" opacity="0.8" />

          {/* Cardinal Time Ticks */}
          <g stroke="url(#chrPurple)" strokeWidth="1.75" strokeLinecap="round" opacity="0.85">
            <line x1="64" y1="6" x2="64" y2="12" />
            <line x1="64" y1="116" x2="64" y2="122" />
            <line x1="6" y1="64" x2="12" y2="64" />
            <line x1="116" y1="64" x2="122" y2="64" />
          </g>

          {/* The Knot / Infinity Lemniscate Geometry */}
          <g filter="url(#chrBloom)">
            {/* Right Loop */}
            <path
              d="M 64,64 C 74,46 98,44 104,57 C 112,71 100,88 84,88 C 70,88 64,72 64,64 Z"
              fill="none"
              stroke="url(#chrPurple)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Left Loop */}
            <path
              d="M 64,64 C 54,82 30,84 24,71 C 16,57 28,40 44,40 C 58,40 64,56 64,64 Z"
              fill="none"
              stroke="url(#chrCyan)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* Hourglass Facet Overlay */}
          <path
            d="M 48,36 L 80,36 L 68,60 L 80,92 L 48,92 L 60,60 Z"
            fill="none"
            stroke="#e9d5ff"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.75"
          />

          {/* Core Singularity Flare */}
          <circle cx="64" cy="64" r="8" fill="url(#chrPurple)" filter="url(#chrBloom)" />
          <circle cx="64" cy="64" r="3.5" fill="#ffffff" />

          {/* Quantum Orbiting Nodes */}
          <circle cx="94" cy="46" r="2.5" fill="#38bdf8" />
          <circle cx="34" cy="82" r="2.5" fill="#e879f9" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <span className={`font-mono font-black uppercase tracking-wider bg-gradient-to-r from-white via-purple-100 to-[#c084fc] bg-clip-text text-transparent ${font}`}>
              CHRONOS
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#a855f7]/20 text-[#c084fc] border border-[#a855f7]/40 uppercase tracking-widest font-semibold">
              OS
            </span>
          </div>
          <span className={`font-mono text-[#a9a9aa] tracking-widest uppercase ${sub}`}>
            Desktop AI Agent
          </span>
        </div>
      )}
    </div>
  );
};
