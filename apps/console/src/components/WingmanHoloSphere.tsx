import React, { useEffect, useRef, useState } from "react";
import { Shield, Zap, Lock, Eye, RefreshCw, X, CheckCircle } from "lucide-react";

interface PipelineStep {
  id: string;
  name: string;
  latency: string;
  description: string;
  detail: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "detect",
    name: "DETECT",
    latency: "< 1.2ms",
    description: "Multi-vector heuristic & embedding scanning of incoming prompts and tool invocations.",
    detail: "Scans for indirect prompt injections, jailbreaks, hidden unicode payloads, and polymorphic exploits before any LLM inference occurs.",
  },
  {
    id: "intercept",
    name: "INTERCEPT",
    latency: "< 0.8ms",
    description: "Sub-5ms kernel-level hook and MCP proxy interception.",
    detail: "Freezes execution in transit. If an untrusted tool signature, path traversal (/etc/passwd), or unauthorized API call is identified, execution is immediately severed.",
  },
  {
    id: "isolate",
    name: "ISOLATE",
    latency: "< 2.1ms",
    description: "Quarantine blast-radius containment & ephemeral sandboxing.",
    detail: "Restricts memory, file access, and network egress for the suspect agent. Spawns an isolated throwaway Docker/Wasm container to analyze the payload harmlessly.",
  },
  {
    id: "explain",
    name: "EXPLAIN",
    latency: "< 3.4ms",
    description: "Cryptographic taint attribution & plain-English operator briefing.",
    detail: "Wingshield Copilot decodes the attack tree, correlates honeypot hits, cites exact telemetry fields, and produces an immutable SHA-256 audit log entry.",
  },
  {
    id: "adapt",
    name: "ADAPT",
    latency: "< 4.6ms",
    description: "Real-time OPA Rego policy compilation & global defense mesh distribution.",
    detail: "Synthesizes an immediate zero-trust guardrail rule and distributes it to all 6 active agents across the cluster, preventing subsequent variant attacks.",
  },
];

export const WingmanHoloSphere: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeStep, setActiveStep] = useState<PipelineStep | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;
    let tick = 0;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const width = 380;
    const height = 300;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Particle nodes on the sphere surface
    const numPoints = 76;
    const points: { x: number; y: number; z: number; size: number }[] = [];
    const radius = 95;

    for (let i = 0; i < numPoints; i++) {
      const phi = Math.acos(-1 + (2 * i) / numPoints);
      const theta = Math.sqrt(numPoints * Math.PI) * phi;
      points.push({
        x: radius * Math.cos(theta) * Math.sin(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(phi),
        size: Math.random() * 1.5 + 1.2,
      });
    }

    // Orbiting satellites (AgentShield-X Violet & Neon Amethyst Palette)
    const satellites = [
      { radius: 125, speed: 0.02, tilt: 0.35, color: "#c084fc" },
      { radius: 140, speed: -0.015, tilt: -0.45, color: "#a855f7" },
      { radius: 115, speed: 0.025, tilt: 0.75, color: "#e879f9" },
    ];

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // 1. Central Ambient Volumetric Radial Glow (Luminous Cyber Purple)
      const glowGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 160);
      glowGrad.addColorStop(0, "rgba(168, 85, 247, 0.28)");
      glowGrad.addColorStop(0.35, "rgba(192, 132, 252, 0.12)");
      glowGrad.addColorStop(0.75, "rgba(147, 51, 234, 0.04)");
      glowGrad.addColorStop(1, "rgba(9, 5, 20, 0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 160, 0, Math.PI * 2);
      ctx.fill();

      // 2. Outer Cyber Gimbal / Target Rings
      ctx.save();
      ctx.strokeStyle = "rgba(192, 132, 252, 0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.arc(cx, cy, 135, 0, Math.PI * 2);
      ctx.stroke();

      // Gimbal tick marks
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(216, 180, 254, 0.45)";
      for (let i = 0; i < 4; i++) {
        const rad = (i * Math.PI) / 2 + angle * 0.2;
        const x1 = cx + Math.cos(rad) * 130;
        const y1 = cy + Math.sin(rad) * 130;
        const x2 = cx + Math.cos(rad) * 140;
        const y2 = cy + Math.sin(rad) * 140;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Orbiting Satellite Rings (Ellipses)
      satellites.forEach((sat) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(sat.tilt);
        ctx.strokeStyle = "rgba(168, 85, 247, 0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, sat.radius, sat.radius * 0.38, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Satellite point
        const satAngle = tick * sat.speed;
        const sx = sat.radius * Math.cos(satAngle);
        const sy = sat.radius * 0.38 * Math.sin(satAngle);

        ctx.fillStyle = sat.color;
        ctx.shadowColor = sat.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 4. Rotating 3D Holographic Particle Sphere
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const cosB = Math.cos(angle * 0.4);
      const sinB = Math.sin(angle * 0.4);

      // Sort points by z for proper depth buffer rendering
      const transformed = points.map((p) => {
        // Rotate around Y
        const x1 = p.x * cosA - p.z * sinA;
        const z1 = p.z * cosA + p.x * sinA;
        // Rotate around X
        const y2 = p.y * cosB - z1 * sinB;
        const z2 = z1 * cosB + p.y * sinB;

        const scale = 220 / (220 + z2);
        return {
          px: cx + x1 * scale,
          py: cy + y2 * scale,
          pz: z2,
          scale: scale,
          size: p.size * scale,
        };
      });

      transformed.sort((a, b) => a.pz - b.pz);

      // Draw subtle connecting mesh lines between close nodes
      ctx.strokeStyle = "rgba(168, 85, 247, 0.14)";
      ctx.lineWidth = 0.6;
      for (let i = 0; i < transformed.length; i += 2) {
        for (let j = i + 1; j < Math.min(i + 5, transformed.length); j++) {
          const dx = transformed[i].px - transformed[j].px;
          const dy = transformed[i].py - transformed[j].py;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 45) {
            ctx.beginPath();
            ctx.moveTo(transformed[i].px, transformed[i].py);
            ctx.lineTo(transformed[j].px, transformed[j].py);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      transformed.forEach((p) => {
        const alpha = Math.max(0.15, Math.min(0.95, (p.pz + radius) / (2 * radius)));
        ctx.fillStyle = `rgba(192, 132, 252, ${alpha})`;
        ctx.shadowColor = "#c084fc";
        ctx.shadowBlur = p.pz > 0 ? 6 : 0;
        ctx.beginPath();
        ctx.arc(p.px, p.py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      angle += 0.007;
      tick++;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center p-3 select-none">
      {/* 3D WebGL/Canvas Holographic Sphere */}
      <div className="relative cursor-pointer group" title="Click any stage below to inspect sub-5ms zero-trust defense mechanics">
        <canvas
          ref={canvasRef}
          style={{ width: "380px", height: "270px" }}
          className="filter drop-shadow-[0_0_25px_rgba(168,85,247,0.35)]"
        />

        {/* Center Overlay Logo & Runtime Tag */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
          <div className="w-14 h-14 rounded-full border border-purple-400/40 bg-purple-950/40 backdrop-blur-md flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.5)] group-hover:scale-110 transition-transform duration-500">
            <Shield size={26} className="text-purple-300 drop-shadow-[0_0_8px_#c084fc]" />
          </div>
          <div className="mt-2 text-center">
            <span className="text-xs font-chakra font-extrabold tracking-[0.25em] text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
              WINGMAN
            </span>
            <div className="text-[9px] font-mono tracking-widest text-purple-300/80">
              AGENTSHIELD-X SECURITY RUNTIME
            </div>
          </div>
        </div>
      </div>

      {/* Philosophy Statement */}
      <div className="text-center max-w-sm mt-1 px-4">
        <div className="text-[11px] font-chakra font-bold tracking-wider text-purple-200">
          AI AGENTS: <span className="text-purple-400">REAL CAPABILITIES</span> &bull; <span className="text-white">ZERO COMPROMISE</span>
        </div>
        <p className="text-[10px] text-mut/80 font-sans mt-0.5 leading-relaxed">
          AUTONOMOUS DEFENSE MESH &bull; SUB-5MS INTERCEPTION &bull; ZERO-TRUST RUNTIME
        </p>
      </div>

      {/* 5-Stage Interactive Pipeline Pills */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 max-w-md">
        {PIPELINE_STEPS.map((step, idx) => (
          <React.Fragment key={step.id}>
            <button
              onClick={() => setActiveStep(step)}
              className="px-2.5 py-1 rounded-sm border border-purple-500/30 bg-purple-950/30 hover:bg-purple-600/30 hover:border-purple-400 text-[10px] font-chakra font-bold tracking-wider text-purple-200 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(168,85,247,0.15)] flex items-center gap-1.5"
            >
              <span>{step.name}</span>
              <span className="text-[8px] font-mono text-purple-400 opacity-80">{step.latency}</span>
            </button>
            {idx < PIPELINE_STEPS.length - 1 && (
              <span className="text-purple-500/40 text-[10px]">&bull;</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Detail Modal for Selected Pipeline Step */}
      {activeStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#120a22] border border-purple-500/40 rounded-sm p-5 shadow-[0_0_40px_rgba(168,85,247,0.3)] space-y-4">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-purple-500/20 text-purple-300">
                  <Zap size={16} />
                </div>
                <div>
                  <h3 className="font-chakra font-extrabold text-sm tracking-wider text-white">
                    STAGE: {activeStep.name}
                  </h3>
                  <span className="text-[10px] font-mono text-purple-400">
                    Target Ingress Overhead: {activeStep.latency}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveStep(null)}
                className="p-1 text-mut hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-purple-200">{activeStep.description}</div>
              <p className="text-mut/90 leading-relaxed font-sans">{activeStep.detail}</p>
            </div>

            <div className="p-2.5 rounded bg-black/40 border border-purple-500/20 text-[10px] font-mono text-purple-300 flex items-center justify-between">
              <span>SLA ENFORCEMENT: DETERMINISTIC &bull; 100% NON-BLOCKING</span>
              <span className="text-emerald-400 font-bold">ACTIVE</span>
            </div>

            <button
              onClick={() => setActiveStep(null)}
              className="w-full py-1.5 rounded-sm bg-purple-600 hover:bg-purple-500 text-white font-chakra font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
