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
    const numPoints = 72;
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

    // Orbiting satellites
    const satellites = [
      { radius: 125, speed: 0.02, tilt: 0.35, color: "#00e5ff" },
      { radius: 140, speed: -0.015, tilt: -0.45, color: "#38bdf8" },
      { radius: 115, speed: 0.025, tilt: 0.75, color: "#10b981" },
    ];

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // 1. Central Ambient Volumetric Radial Glow
      const glowGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 160);
      glowGrad.addColorStop(0, "rgba(0, 229, 255, 0.18)");
      glowGrad.addColorStop(0.4, "rgba(0, 163, 255, 0.08)");
      glowGrad.addColorStop(0.8, "rgba(0, 229, 255, 0.02)");
      glowGrad.addColorStop(1, "rgba(6, 11, 19, 0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 160, 0, Math.PI * 2);
      ctx.fill();

      // 2. Outer Cyber Gimbal / Target Rings
      ctx.save();
      ctx.strokeStyle = "rgba(0, 229, 255, 0.22)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.arc(cx, cy, 135, 0, Math.PI * 2);
      ctx.stroke();

      // Gimbal tick marks
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(0, 229, 255, 0.4)";
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
      satellites.forEach((sat, idx) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(sat.tilt);
        ctx.strokeStyle = "rgba(0, 229, 255, 0.25)";
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
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 4. Rotating 3D Sphere Wireframe (Latitude & Longitude Rings)
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Horizontal latitude rings
      const latitudes = [-60, -30, 0, 30, 60];
      latitudes.forEach((latDeg) => {
        const latRad = (latDeg * Math.PI) / 180;
        const rLat = radius * Math.cos(latRad);
        const yLat = radius * Math.sin(latRad);

        ctx.save();
        ctx.strokeStyle =
          latDeg === 0
            ? "rgba(0, 229, 255, 0.45)"
            : "rgba(0, 229, 255, 0.2)";
        ctx.lineWidth = latDeg === 0 ? 1.5 : 1;
        ctx.beginPath();
        ctx.ellipse(cx, cy + yLat, rLat, rLat * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // 5. 3D Rotating Particle Cloud
      const sortedPoints = points
        .map((p) => {
          // Rotate around Y axis
          const xRot = p.x * cosA - p.z * sinA;
          const zRot = p.z * cosA + p.x * sinA;
          // Slight tilt around X axis
          const yRot = p.y * Math.cos(0.25) - zRot * Math.sin(0.25);
          const zFinal = zRot * Math.cos(0.25) + p.y * Math.sin(0.25);

          const scale = (zFinal + 200) / 200;
          const alpha = Math.max(0.12, (zFinal + radius) / (2 * radius));
          return {
            px: cx + xRot,
            py: cy + yRot,
            scale,
            alpha,
            size: p.size,
            z: zFinal,
          };
        })
        .sort((a, b) => a.z - b.z);

      sortedPoints.forEach((pt) => {
        ctx.save();
        ctx.fillStyle = `rgba(0, 229, 255, ${pt.alpha})`;
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = pt.z > 0 ? 6 : 0;
        ctx.beginPath();
        ctx.arc(pt.px, pt.py, Math.max(0.8, pt.size * pt.scale), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      angle += 0.008;
      tick += 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center p-3 w-full">
      {/* 3D Hologram Canvas */}
      <div className="relative w-[380px] h-[260px] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-[380px] h-[260px] pointer-events-none"
        />

        {/* Floating Center Hologram Emblem Badge */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <div className="relative flex items-center justify-center mb-1">
            <div className="w-12 h-12 rounded-full border border-ok/60 bg-bg/80 backdrop-blur-md flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.4)]">
              {/* Dual Cyan Wing Logo */}
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 3L3 7V12C3 17 7 21 12 22C17 21 21 17 21 12V7L12 3Z"
                  stroke="#00e5ff"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 7V17M7 10L12 14L17 10"
                  stroke="#38bdf8"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {/* Pulsing ring */}
            <div className="absolute inset-0 w-12 h-12 rounded-full border border-ok animate-ping opacity-30" />
          </div>

          <div className="text-xl font-chakra font-extrabold tracking-[0.2em] text-white drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]">
            WINGMAN
          </div>
          <div className="text-[11px] font-chakra font-semibold tracking-wider text-ok/90 uppercase drop-shadow-[0_0_6px_rgba(0,229,255,0.5)]">
            AgentShield-X Security Runtime
          </div>
        </div>
      </div>

      {/* Subtitle Badges */}
      <div className="flex flex-col items-center text-center space-y-1 mt-1">
        <div className="text-[10px] font-chakra font-bold tracking-widest text-mut uppercase">
          AI AGENTS: <span className="text-ok">REAL CAPABILITIES</span> &bull;{" "}
          <span className="text-white">ZERO COMPROMISE</span>
        </div>
        <div className="text-[9px] font-chakra tracking-wider text-ok/80 uppercase">
          Autonomous Defense Mesh &bull; Sub-5ms Interception
        </div>
        <div className="text-[8px] font-mono tracking-widest text-mut/70 uppercase">
          SECURE AGENTS &bull; SECURE TOOLS &bull; SECURE TOMORROW
        </div>
      </div>

      {/* Defense Pipeline Badges (DETECT | INTERCEPT | ISOLATE | EXPLAIN | ADAPT) */}
      <div className="mt-3 flex items-center justify-center gap-1.5 flex-wrap">
        {PIPELINE_STEPS.map((step, idx) => (
          <React.Fragment key={step.id}>
            <button
              onClick={() => setActiveStep(step)}
              className="group relative px-2.5 py-1 bg-panel/80 hover:bg-ok/20 border border-line hover:border-ok/70 transition-all rounded-xs text-[10px] font-chakra font-bold tracking-widest uppercase text-fg hover:text-ok shadow-sm"
              title={`Click to inspect ${step.name} telemetry`}
            >
              <span className="group-hover:drop-shadow-[0_0_6px_rgba(0,229,255,0.8)]">
                {step.name}
              </span>
            </button>
            {idx < PIPELINE_STEPS.length - 1 && (
              <span className="text-[10px] text-ok/40 font-mono">|</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Pipeline Detail Modal */}
      {activeStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-[#0b1322] border border-ok/50 rounded-sm p-6 max-w-md w-full shadow-[0_0_30px_rgba(0,229,255,0.25)] relative font-chakra animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setActiveStep(null)}
              className="absolute top-4 right-4 text-mut hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-ok/10 border border-ok/60 flex items-center justify-center text-ok">
                <Zap size={16} />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-wider text-white uppercase">
                  Pipeline: {activeStep.name}
                </h3>
                <div className="text-xs text-ok font-mono">
                  Latency SLA: {activeStep.latency}
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-fg font-medium leading-relaxed">
                {activeStep.description}
              </p>
              <div className="p-3 bg-bg/80 border border-line/60 rounded-xs text-mut font-sans leading-relaxed">
                {activeStep.detail}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-line text-[11px] text-mut font-mono">
                <span>Interception Status: <span className="text-ok">ACTIVE</span></span>
                <span>Sub-system: AgentShield Core</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setActiveStep(null)}
                className="px-4 py-1.5 bg-ok/20 border border-ok text-ok hover:bg-ok hover:text-black font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
