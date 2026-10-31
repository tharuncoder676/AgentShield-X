import React, { useEffect, useRef } from "react";

interface CyberRayBeamProps {
  beamColor?: "cyan" | "purple" | "gold" | "dual";
  interactive?: boolean;
}

interface SmokePuff {
  xOffset: number;
  y: number;
  radius: number;
  speed: number;
  baseAlpha: number;
  phase: number;
  phaseSpeed: number;
  scaleX: number;
}

interface Photon {
  xOffset: number;
  y: number;
  length: number;
  speed: number;
  width: number;
  opacity: number;
}

export const CyberRayBeam: React.FC<CyberRayBeamProps> = ({
  beamColor = "purple",
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationId: number;
    let time = 0;
    let width = 0;
    let height = 0;
    let targetBeamX = 0;
    let currentBeamX = 0;
    let mouseTilt = 0;
    let targetMouseTilt = 0;

    // Handle high-DPI scaling and resizing
    const updateDimensions = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.resetTransform();
      ctx.scale(dpr, dpr);

      // Default beam position at ~66% across desktop width, or center on mobile
      const initialX = width > 768 ? width * 0.64 : width * 0.5;
      if (currentBeamX === 0) {
        currentBeamX = initialX;
        targetBeamX = initialX;
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    // Initialize procedural volumetric smoke puffs (the cloudy mist in AgentShield-X)
    const smokePuffs: SmokePuff[] = Array.from({ length: 42 }, () => ({
      xOffset: (Math.random() - 0.5) * 220,
      y: Math.random() * (height || 800),
      radius: Math.random() * 80 + 50,
      speed: Math.random() * 0.5 + 0.25,
      baseAlpha: Math.random() * 0.12 + 0.05,
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: Math.random() * 0.02 + 0.01,
      scaleX: Math.random() * 0.6 + 0.8,
    }));

    // Initialize upward streaming photon fibers
    const photons: Photon[] = Array.from({ length: 70 }, () => ({
      xOffset: (Math.random() - 0.5) * 50,
      y: Math.random() * (height || 800),
      length: Math.random() * 35 + 15,
      speed: Math.random() * 4.5 + 2.5,
      width: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.6 + 0.3,
    }));

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const defaultX = width > 768 ? width * 0.64 : width * 0.5;
      // Slight parallax tracking (beam follows mouse slightly)
      targetBeamX = defaultX + (relX - defaultX) * 0.12;
      targetMouseTilt = ((relX - defaultX) / width) * 0.08;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Color theme palettes
    const getPalette = () => {
      switch (beamColor) {
        case "purple":
          return {
            hazeCore: "rgba(168, 85, 247, 0.40)",
            hazeMid: "rgba(147, 51, 234, 0.22)",
            hazeOuter: "rgba(88, 28, 135, 0.08)",
            pillarMid: "rgba(192, 132, 252, 0.85)",
            pillarOuter: "rgba(147, 51, 234, 0.35)",
            horizonGradient: ["rgba(168, 85, 247, 0.65)", "rgba(126, 34, 206, 0.35)", "rgba(15, 10, 30, 0.95)"],
            contourStroke: "rgba(216, 180, 254, 0.95)",
            contourGlow: "rgba(168, 85, 247, 1)",
            smokeColor: "rgba(168, 85, 247, ",
            sparkGold: ["rgba(255, 255, 255, 1)", "rgba(255, 215, 0, 0.95)", "rgba(245, 166, 35, 0.6)"],
            photonColor: "rgba(235, 215, 255, ",
          };
        case "gold":
          return {
            hazeCore: "rgba(245, 166, 35, 0.45)",
            hazeMid: "rgba(255, 184, 0, 0.25)",
            hazeOuter: "rgba(180, 83, 9, 0.08)",
            pillarMid: "rgba(253, 224, 71, 0.85)",
            pillarOuter: "rgba(245, 166, 35, 0.35)",
            horizonGradient: ["rgba(245, 166, 35, 0.65)", "rgba(217, 119, 6, 0.35)", "rgba(25, 15, 8, 0.95)"],
            contourStroke: "rgba(254, 240, 138, 0.95)",
            contourGlow: "rgba(245, 166, 35, 1)",
            smokeColor: "rgba(245, 166, 35, ",
            sparkGold: ["rgba(255, 255, 255, 1)", "rgba(255, 235, 150, 0.95)", "rgba(255, 140, 0, 0.7)"],
            photonColor: "rgba(255, 245, 210, ",
          };
        case "dual":
          return {
            hazeCore: "rgba(41, 171, 226, 0.40)",
            hazeMid: "rgba(168, 85, 247, 0.25)",
            hazeOuter: "rgba(245, 166, 35, 0.10)",
            pillarMid: "rgba(180, 240, 255, 0.85)",
            pillarOuter: "rgba(41, 171, 226, 0.35)",
            horizonGradient: ["rgba(41, 171, 226, 0.70)", "rgba(168, 85, 247, 0.35)", "rgba(8, 9, 11, 0.95)"],
            contourStroke: "rgba(200, 245, 255, 0.95)",
            contourGlow: "rgba(56, 189, 248, 1)",
            smokeColor: "rgba(56, 189, 248, ",
            sparkGold: ["rgba(255, 255, 255, 1)", "rgba(255, 215, 0, 0.95)", "rgba(245, 166, 35, 0.7)"],
            photonColor: "rgba(220, 245, 255, ",
          };
        case "cyan":
        default:
          // The exact AgentShield-X signature look
          return {
            hazeCore: "rgba(41, 171, 226, 0.45)",
            hazeMid: "rgba(59, 130, 246, 0.25)",
            hazeOuter: "rgba(29, 78, 216, 0.08)",
            pillarMid: "rgba(147, 230, 255, 0.90)",
            pillarOuter: "rgba(41, 171, 226, 0.40)",
            horizonGradient: ["rgba(41, 171, 226, 0.75)", "rgba(30, 58, 138, 0.40)", "rgba(6, 10, 20, 0.98)"],
            contourStroke: "rgba(220, 250, 255, 0.98)",
            contourGlow: "rgba(56, 189, 248, 1)",
            smokeColor: "rgba(41, 171, 226, ",
            sparkGold: ["rgba(255, 255, 255, 1)", "rgba(255, 215, 0, 0.98)", "rgba(245, 166, 35, 0.75)"],
            photonColor: "rgba(215, 245, 255, ",
          };
      }
    };

    const render = () => {
      time += 0.02;
      const palette = getPalette();

      // Smooth beam tracking and tilt
      currentBeamX += (targetBeamX - currentBeamX) * 0.04;
      mouseTilt += (targetMouseTilt - mouseTilt) * 0.05;

      const beamX = currentBeamX;
      // Horizon line located near bottom of canvas
      const horizonY = height - 45;

      ctx.clearRect(0, 0, width, height);

      // --- 1. Ambient Volumetric Atmospheric Glow ---
      const breathe = Math.sin(time * 1.8) * 0.08 + 0.92;
      const baseGrad = ctx.createRadialGradient(
        beamX,
        horizonY - 90,
        15,
        beamX,
        horizonY - 90,
        Math.max(width * 0.55, 420) * breathe
      );
      baseGrad.addColorStop(0, palette.hazeCore);
      baseGrad.addColorStop(0.35, palette.hazeMid);
      baseGrad.addColorStop(0.70, palette.hazeOuter);
      baseGrad.addColorStop(1, "rgba(8, 9, 11, 0)");

      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // --- 2. Procedural Volumetric Smoke Clouds / Mist Wisps ---
      // This creates the soft, organic cloud texture billowing around the beam
      ctx.save();
      ctx.globalCompositeOperation = "screen";

      for (let i = 0; i < smokePuffs.length; i++) {
        const puff = smokePuffs[i];
        puff.y -= puff.speed;
        puff.phase += puff.phaseSpeed;

        // Reset puff when it travels above screen
        if (puff.y < -puff.radius) {
          puff.y = horizonY + Math.random() * 30;
          puff.xOffset = (Math.random() - 0.5) * 220;
        }

        const currentX = beamX + puff.xOffset + Math.sin(puff.phase) * 18;
        const currentY = puff.y;
        // Fade puffs out as they rise or get too far from the horizon
        const heightFade = Math.min(1, Math.max(0, currentY / (height * 0.75)));
        const alpha = puff.baseAlpha * heightFade * (0.8 + 0.2 * Math.sin(puff.phase * 2));

        const puffGrad = ctx.createRadialGradient(
          currentX,
          currentY,
          0,
          currentX,
          currentY,
          puff.radius
        );
        puffGrad.addColorStop(0, `${palette.smokeColor}${alpha})`);
        puffGrad.addColorStop(0.5, `${palette.smokeColor}${alpha * 0.45})`);
        puffGrad.addColorStop(1, `${palette.smokeColor}0)`);

        ctx.fillStyle = puffGrad;
        ctx.beginPath();
        ctx.arc(currentX, currentY, puff.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // --- 3. The Iconic Trumpet Flare / Exponential Horn Horizon ---
      // This is the signature AgentShield-X curved baseline where light sweeps outward
      ctx.save();

      // Outer sweep geometry:
      const flareWidth = Math.max(width * 0.48, 380);
      const flareLift = 38;

      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, horizonY + 18);

      // Left trumpet curve approaching the beam
      ctx.bezierCurveTo(
        beamX - flareWidth * 0.65,
        horizonY + 16,
        beamX - 110,
        horizonY - flareLift * 0.35,
        beamX,
        horizonY - flareLift
      );

      // Right trumpet curve sweeping out
      ctx.bezierCurveTo(
        beamX + 110,
        horizonY - flareLift * 0.35,
        beamX + flareWidth * 0.65,
        horizonY + 16,
        width,
        horizonY + 18
      );

      ctx.lineTo(width, height);
      ctx.closePath();

      // Horizon Gradient fill
      const groundGrad = ctx.createLinearGradient(0, horizonY - flareLift, 0, height);
      groundGrad.addColorStop(0, palette.horizonGradient[0]);
      groundGrad.addColorStop(0.35, palette.horizonGradient[1]);
      groundGrad.addColorStop(1, palette.horizonGradient[2]);
      ctx.fillStyle = groundGrad;
      ctx.fill();

      // Sharp glowing crest line along the trumpet horn
      ctx.beginPath();
      ctx.moveTo(0, horizonY + 18);
      ctx.bezierCurveTo(
        beamX - flareWidth * 0.65,
        horizonY + 16,
        beamX - 110,
        horizonY - flareLift * 0.35,
        beamX,
        horizonY - flareLift
      );
      ctx.bezierCurveTo(
        beamX + 110,
        horizonY - flareLift * 0.35,
        beamX + flareWidth * 0.65,
        horizonY + 16,
        width,
        horizonY + 18
      );

      ctx.strokeStyle = palette.contourStroke;
      ctx.lineWidth = 3.0;
      ctx.shadowColor = palette.contourGlow;
      ctx.shadowBlur = 24;
      ctx.stroke();

      // Secondary soft under-glow line
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      ctx.shadowBlur = 8;
      ctx.stroke();

      ctx.restore();

      // --- 4. The Vertical Volumetric Light Pillar ---
      ctx.save();
      // Slight tilt following mouse
      ctx.translate(beamX, horizonY - flareLift);
      ctx.rotate(mouseTilt);
      ctx.translate(-beamX, -(horizonY - flareLift));

      // 4a. Broad Atmospheric Aura
      const auraWidth = 150 * breathe;
      const auraGrad = ctx.createLinearGradient(beamX - auraWidth, 0, beamX + auraWidth, 0);
      auraGrad.addColorStop(0, "rgba(41, 171, 226, 0)");
      auraGrad.addColorStop(0.25, palette.pillarOuter);
      auraGrad.addColorStop(0.50, palette.pillarMid);
      auraGrad.addColorStop(0.75, palette.pillarOuter);
      auraGrad.addColorStop(1, "rgba(41, 171, 226, 0)");

      ctx.fillStyle = auraGrad;
      ctx.fillRect(beamX - auraWidth, 0, auraWidth * 2, horizonY - flareLift + 5);

      // 4b. Inner Dense Column
      const colWidth = 38 * breathe;
      const colGrad = ctx.createLinearGradient(beamX - colWidth, 0, beamX + colWidth, 0);
      colGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
      colGrad.addColorStop(0.35, palette.pillarMid);
      colGrad.addColorStop(0.50, "rgba(255, 255, 255, 0.95)");
      colGrad.addColorStop(0.65, palette.pillarMid);
      colGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = colGrad;
      ctx.fillRect(beamX - colWidth, 0, colWidth * 2, horizonY - flareLift + 5);

      // 4c. Flaring Trumpet Neck at Base (smooth transition into the horizon)
      ctx.beginPath();
      ctx.moveTo(beamX - 60, horizonY - flareLift);
      ctx.quadraticCurveTo(beamX - 12, horizonY - flareLift - 100, beamX - 3, 0);
      ctx.lineTo(beamX + 3, 0);
      ctx.quadraticCurveTo(beamX + 12, horizonY - flareLift - 100, beamX + 60, horizonY - flareLift);
      ctx.closePath();

      const neckGrad = ctx.createLinearGradient(0, horizonY - flareLift - 120, 0, horizonY - flareLift);
      neckGrad.addColorStop(0, "rgba(255, 255, 255, 0.15)");
      neckGrad.addColorStop(0.5, palette.pillarMid);
      neckGrad.addColorStop(1, "rgba(255, 255, 255, 0.98)");
      ctx.fillStyle = neckGrad;
      ctx.fill();

      // 4d. Ultra-Sharp Central Laser Spine
      ctx.beginPath();
      ctx.moveTo(beamX, 0);
      ctx.lineTo(beamX, horizonY - flareLift);
      ctx.lineWidth = 4.2;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.98)";
      ctx.shadowColor = "rgba(255, 255, 255, 1.0)";
      ctx.shadowBlur = 18;
      ctx.stroke();

      // 4e. Upward Streaming Photons & Micro-Fibers
      for (let i = 0; i < photons.length; i++) {
        const p = photons[i];
        p.y -= p.speed;

        if (p.y < 0) {
          p.y = horizonY - flareLift + Math.random() * 15;
          p.xOffset = (Math.random() - 0.5) * 44;
        }

        const px = beamX + p.xOffset;
        const py = p.y;
        const dist = Math.abs(p.xOffset);
        const alpha = Math.max(0, p.opacity * (1 - dist / 40));

        ctx.strokeStyle = `${palette.photonColor}${alpha})`;
        ctx.lineWidth = p.width;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, py + p.length);
        ctx.stroke();
      }

      ctx.restore();

      // --- 5. Golden Ignition Spark & Anamorphic Lens Flare ---
      // This is the iconic yellow/amber spark at the center root of AgentShield-X's beam
      const sparkY = horizonY - flareLift + 2;
      ctx.save();

      // 5a. Core golden radial explosion
      const sparkGrad = ctx.createRadialGradient(beamX, sparkY, 0, beamX, sparkY, 48);
      sparkGrad.addColorStop(0, palette.sparkGold[0]);
      sparkGrad.addColorStop(0.20, palette.sparkGold[1]);
      sparkGrad.addColorStop(0.50, palette.sparkGold[2]);
      sparkGrad.addColorStop(0.80, "rgba(255, 100, 0, 0.25)");
      sparkGrad.addColorStop(1, "rgba(255, 100, 0, 0)");

      ctx.fillStyle = sparkGrad;
      ctx.beginPath();
      ctx.arc(beamX, sparkY, 48, 0, Math.PI * 2);
      ctx.fill();

      // 5b. Anamorphic Horizontal Flare Line across the spark
      const flareLen = Math.min(width * 0.45, 360);
      ctx.beginPath();
      ctx.moveTo(beamX - flareLen, sparkY);
      ctx.lineTo(beamX + flareLen, sparkY);
      ctx.lineWidth = 2.8;
      ctx.strokeStyle = "rgba(255, 240, 180, 0.98)";
      ctx.shadowColor = "rgba(255, 200, 50, 1.0)";
      ctx.shadowBlur = 16;
      ctx.stroke();

      // 5c. Secondary subtle cross flare
      ctx.beginPath();
      ctx.moveTo(beamX, sparkY - 30);
      ctx.lineTo(beamX, sparkY + 30);
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.shadowBlur = 10;
      ctx.stroke();

      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", updateDimensions);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [beamColor, interactive]);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover pointer-events-auto cursor-crosshair"
      />
    </div>
  );
};
