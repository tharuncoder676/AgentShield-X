import React, { useEffect, useRef } from "react";

interface CyberRayBeamProps {
  beamColor?: "purple" | "cyan" | "gold";
  interactive?: boolean;
}

interface FogPuff {
  xOffset: number;
  y: number;
  radiusX: number;
  radiusY: number;
  speed: number;
  baseAlpha: number;
  phase: number;
  phaseSpeed: number;
}

interface Photon {
  xOffset: number;
  y: number;
  length: number;
  speed: number;
  width: number;
  opacity: number;
}

/**
 * CyberRayBeam - BridgeMind.ai Inspired Pure Volumetric Light Pillar
 * Features:
 * - Glowing elliptical floor aperture pool of light at base
 * - Hyperbolic inward-curving light filaments gathering into the vertical beam
 * - Ultra-crisp razor-sharp white laser spine with volumetric purple aura
 * - Low stage mist billowing organically around the aperture
 * - Floating upward photon motes drifting into the obsidian void
 */
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

      const initialX = width * 0.5;
      if (currentBeamX === 0) {
        currentBeamX = initialX;
        targetBeamX = initialX;
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    // Initialize low ground fog puffs around the aperture
    const fogPuffs: FogPuff[] = Array.from({ length: 28 }, () => ({
      xOffset: (Math.random() - 0.5) * 240,
      y: 0,
      radiusX: Math.random() * 65 + 45,
      radiusY: Math.random() * 26 + 18,
      speed: Math.random() * 0.25 + 0.12,
      baseAlpha: Math.random() * 0.14 + 0.06,
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: Math.random() * 0.015 + 0.008,
    }));

    // Initialize upward-streaming photons
    const photons: Photon[] = Array.from({ length: 55 }, () => ({
      xOffset: (Math.random() - 0.5) * 36,
      y: Math.random() * (height || 700),
      length: Math.random() * 28 + 12,
      speed: Math.random() * 3.8 + 1.8,
      width: Math.random() * 1.6 + 0.6,
      opacity: Math.random() * 0.65 + 0.25,
    }));

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const defaultX = width * 0.5;
      // Gentle parallax tracking
      targetBeamX = defaultX + (relX - defaultX) * 0.10;
      targetMouseTilt = ((relX - defaultX) / width) * 0.045;
    };

    window.addEventListener("mousemove", handleMouseMove);

    const render = () => {
      time += 0.02;

      currentBeamX += (targetBeamX - currentBeamX) * 0.05;
      mouseTilt += (targetMouseTilt - mouseTilt) * 0.05;

      const beamX = currentBeamX;
      const floorY = height - 52;

      ctx.clearRect(0, 0, width, height);

      const breathe = Math.sin(time * 1.6) * 0.06 + 0.94;

      // =========================================================================
      // 1. Broad Volumetric Background Haze (BridgeMind Atmospheric Fill)
      // =========================================================================
      const bgGrad = ctx.createRadialGradient(
        beamX,
        floorY - 60,
        20,
        beamX,
        floorY - 60,
        Math.max(width * 0.55, 380) * breathe
      );
      bgGrad.addColorStop(0, "rgba(168, 85, 247, 0.32)");
      bgGrad.addColorStop(0.32, "rgba(126, 34, 206, 0.18)");
      bgGrad.addColorStop(0.65, "rgba(88, 28, 135, 0.06)");
      bgGrad.addColorStop(1, "rgba(8, 9, 11, 0)");

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // =========================================================================
      // 2. Low Ground Stage Mist (Hovering at the Base Floor Aperture)
      // =========================================================================
      ctx.save();
      ctx.globalCompositeOperation = "screen";

      for (let i = 0; i < fogPuffs.length; i++) {
        const puff = fogPuffs[i];
        puff.phase += puff.phaseSpeed;
        const puffY = floorY - 14 + Math.sin(puff.phase) * 12;
        const puffX = beamX + puff.xOffset + Math.cos(puff.phase * 0.7) * 16;
        const distFromCenter = Math.abs(puff.xOffset);
        const centerFalloff = Math.max(0, 1 - distFromCenter / 150);
        const alpha = puff.baseAlpha * centerFalloff * (0.8 + 0.2 * Math.sin(puff.phase * 2));

        const fogGrad = ctx.createRadialGradient(
          puffX,
          puffY,
          0,
          puffX,
          puffY,
          puff.radiusX
        );
        fogGrad.addColorStop(0, `rgba(192, 132, 252, ${alpha * 1.2})`);
        fogGrad.addColorStop(0.45, `rgba(168, 85, 247, ${alpha * 0.55})`);
        fogGrad.addColorStop(1, "rgba(147, 51, 234, 0)");

        ctx.fillStyle = fogGrad;
        ctx.beginPath();
        ctx.ellipse(puffX, puffY, puff.radiusX, puff.radiusY, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // =========================================================================
      // 3. Glowing Floor Aperture Ellipse (The Horizontal Disc of Light)
      // =========================================================================
      const baseRx = Math.min(width * 0.42, 280) * breathe;
      const baseRy = 22 * breathe;

      // 3a. Broad Outer Floor Glow Pool
      const outerFloorGrad = ctx.createRadialGradient(
        beamX,
        floorY,
        5,
        beamX,
        floorY,
        baseRx
      );
      outerFloorGrad.addColorStop(0, "rgba(216, 180, 254, 0.75)");
      outerFloorGrad.addColorStop(0.25, "rgba(168, 85, 247, 0.55)");
      outerFloorGrad.addColorStop(0.60, "rgba(126, 34, 206, 0.22)");
      outerFloorGrad.addColorStop(1, "rgba(15, 10, 30, 0)");

      ctx.save();
      ctx.fillStyle = outerFloorGrad;
      ctx.beginPath();
      ctx.ellipse(beamX, floorY, baseRx, baseRy, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3b. Inner Bright Core Disc
      const innerRx = baseRx * 0.48;
      const innerRy = baseRy * 0.55;
      const innerFloorGrad = ctx.createRadialGradient(
        beamX,
        floorY,
        0,
        beamX,
        floorY,
        innerRx
      );
      innerFloorGrad.addColorStop(0, "rgba(255, 255, 255, 0.98)");
      innerFloorGrad.addColorStop(0.35, "rgba(235, 215, 255, 0.85)");
      innerFloorGrad.addColorStop(0.70, "rgba(192, 132, 252, 0.40)");
      innerFloorGrad.addColorStop(1, "rgba(168, 85, 247, 0)");

      ctx.fillStyle = innerFloorGrad;
      ctx.beginPath();
      ctx.ellipse(beamX, floorY, innerRx, innerRy, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3c. Horizon Razor Rim Line
      ctx.beginPath();
      ctx.ellipse(beamX, floorY, baseRx * 0.85, baseRy * 0.40, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 1.6;
      ctx.shadowColor = "#c084fc";
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.restore();

      // =========================================================================
      // 4. Inward-Curving Hyperbolic Light Filaments (BridgeMind Curved Rays)
      // =========================================================================
      ctx.save();
      ctx.globalCompositeOperation = "screen";

      const filamentPairs = [
        { spread: baseRx * 0.80, height: 180, alpha: 0.55, width: 1.4 },
        { spread: baseRx * 0.62, height: 240, alpha: 0.65, width: 1.6 },
        { spread: baseRx * 0.45, height: 320, alpha: 0.75, width: 1.8 },
        { spread: baseRx * 0.30, height: 410, alpha: 0.85, width: 2.0 },
        { spread: baseRx * 0.18, height: 490, alpha: 0.90, width: 2.2 },
      ];

      for (const f of filamentPairs) {
        // Left hyperbolic curve sweeping into vertical column
        ctx.beginPath();
        ctx.moveTo(beamX - f.spread, floorY);
        ctx.bezierCurveTo(
          beamX - f.spread * 0.42,
          floorY - 12,
          beamX - 16,
          floorY - f.height * 0.45,
          beamX - 4,
          floorY - f.height
        );
        ctx.strokeStyle = `rgba(216, 180, 254, ${f.alpha * breathe})`;
        ctx.lineWidth = f.width;
        ctx.shadowColor = "#a855f7";
        ctx.shadowBlur = 14;
        ctx.stroke();

        // Right hyperbolic curve sweeping into vertical column
        ctx.beginPath();
        ctx.moveTo(beamX + f.spread, floorY);
        ctx.bezierCurveTo(
          beamX + f.spread * 0.42,
          floorY - 12,
          beamX + 16,
          floorY - f.height * 0.45,
          beamX + 4,
          floorY - f.height
        );
        ctx.strokeStyle = `rgba(216, 180, 254, ${f.alpha * breathe})`;
        ctx.lineWidth = f.width;
        ctx.shadowColor = "#a855f7";
        ctx.shadowBlur = 14;
        ctx.stroke();
      }
      ctx.restore();

      // =========================================================================
      // 5. The Pure Vertical Volumetric Light Column
      // =========================================================================
      ctx.save();
      ctx.translate(beamX, floorY);
      ctx.rotate(mouseTilt);
      ctx.translate(-beamX, -floorY);

      // 5a. Broad Atmospheric Violet Aura
      const auraWidth = 85 * breathe;
      const auraGrad = ctx.createLinearGradient(beamX - auraWidth, 0, beamX + auraWidth, 0);
      auraGrad.addColorStop(0, "rgba(88, 28, 135, 0)");
      auraGrad.addColorStop(0.25, "rgba(147, 51, 234, 0.28)");
      auraGrad.addColorStop(0.50, "rgba(192, 132, 252, 0.65)");
      auraGrad.addColorStop(0.75, "rgba(147, 51, 234, 0.28)");
      auraGrad.addColorStop(1, "rgba(88, 28, 135, 0)");

      // Vertical fade towards the ceiling
      ctx.fillStyle = auraGrad;
      ctx.fillRect(beamX - auraWidth, 0, auraWidth * 2, floorY);

      // 5b. Inner Luminous Column
      const colWidth = 22 * breathe;
      const colGrad = ctx.createLinearGradient(beamX - colWidth, 0, beamX + colWidth, 0);
      colGrad.addColorStop(0, "rgba(168, 85, 247, 0)");
      colGrad.addColorStop(0.35, "rgba(216, 180, 254, 0.85)");
      colGrad.addColorStop(0.50, "rgba(255, 255, 255, 0.98)");
      colGrad.addColorStop(0.65, "rgba(216, 180, 254, 0.85)");
      colGrad.addColorStop(1, "rgba(168, 85, 247, 0)");

      ctx.fillStyle = colGrad;
      ctx.fillRect(beamX - colWidth, 0, colWidth * 2, floorY);

      // 5c. Ultra-Sharp Razor White Central Laser Spine
      ctx.beginPath();
      ctx.moveTo(beamX, 0);
      ctx.lineTo(beamX, floorY);
      ctx.lineWidth = 3.6;
      ctx.strokeStyle = "rgba(255, 255, 255, 1.0)";
      ctx.shadowColor = "#c084fc";
      ctx.shadowBlur = 26;
      ctx.stroke();

      // 5d. Vertical Ceiling Dissipate Mask (Soft falloff near top of screen)
      const topFadeGrad = ctx.createLinearGradient(0, 0, 0, 90);
      topFadeGrad.addColorStop(0, "rgba(8, 9, 11, 0.85)");
      topFadeGrad.addColorStop(1, "rgba(8, 9, 11, 0)");
      ctx.fillStyle = topFadeGrad;
      ctx.fillRect(beamX - auraWidth, 0, auraWidth * 2, 90);

      // =========================================================================
      // 6. Upward Streaming Photon Fibers & Energy Motes
      // =========================================================================
      for (let i = 0; i < photons.length; i++) {
        const p = photons[i];
        p.y -= p.speed;

        if (p.y < 0) {
          p.y = floorY + Math.random() * 10;
          p.xOffset = (Math.random() - 0.5) * 32;
        }

        const px = beamX + p.xOffset;
        const py = p.y;
        const dist = Math.abs(p.xOffset);
        const alpha = Math.max(0, p.opacity * (1 - dist / 30) * Math.min(1, py / 120));

        ctx.strokeStyle = `rgba(240, 225, 255, ${alpha})`;
        ctx.lineWidth = p.width;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, py + p.length);
        ctx.stroke();
      }

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
