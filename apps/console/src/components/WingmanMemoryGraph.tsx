import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Database, Network, ArrowRight } from "lucide-react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export const WingmanMemoryGraph: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoverCount, setHoverCount] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const width = 230;
    const height = 140;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const nodes: Node[] = [];
    const colors = ["#00e5ff", "#38bdf8", "#10b981", "#818cf8"];

    for (let i = 0; i < 24; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2.5 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let mouseX = -100;
    let mouseY = -100;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseX = -100;
      mouseY = -100;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Update positions
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 5 || n.x > width - 5) n.vx *= -1;
        if (n.y < 5 || n.y > height - 5) n.vy *= -1;

        // Mouse attraction
        const dx = mouseX - n.x;
        const dy = mouseY - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 50 && dist > 5) {
          n.x += (dx / dist) * 0.4;
          n.y += (dy / dist) * 0.4;
        }
      });

      // Draw edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 46) {
            const alpha = 1 - dist / 46;
            ctx.save();
            ctx.strokeStyle = `rgba(0, 229, 255, ${alpha * 0.4})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // Draw nodes
      nodes.forEach((n) => {
        ctx.save();
        ctx.fillStyle = n.color;
        ctx.shadowColor = n.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div className="bg-[#0b1424] border border-[#162744] hover:border-ok/40 transition-colors p-3.5 rounded-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Database size={14} className="text-ok" />
          <span className="text-xs font-chakra font-bold uppercase tracking-wider text-white">
            Memory & Context
          </span>
        </div>
        <span className="text-[10px] font-mono text-ok/80 bg-ok/10 px-1.5 py-0.5 rounded-xs border border-ok/20">
          RAG Vector Active
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        {/* Interactive Neural Canvas */}
        <div
          ref={containerRef}
          className="relative w-[230px] h-[140px] bg-bg/60 border border-line/40 rounded-xs overflow-hidden flex items-center justify-center shrink-0"
        >
          <div className="absolute top-1.5 left-2 text-[9px] font-chakra text-mut tracking-wider uppercase pointer-events-none">
            Live Memory Graph
          </div>
          <canvas
            ref={canvasRef}
            className="w-[230px] h-[140px] cursor-crosshair"
          />
        </div>

        {/* Stats on the right */}
        <div className="flex-1 space-y-2 font-chakra">
          <div className="flex items-center justify-between text-xs">
            <span className="text-mut text-[11px]">Memory Items</span>
            <span className="font-mono font-bold text-white text-xs">1,432</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-mut text-[11px]">Active Contexts</span>
            <span className="font-mono font-bold text-ok text-xs">22</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-mut text-[11px]">Long-term Memories</span>
            <span className="font-mono font-bold text-white text-xs">8</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-mut text-[11px]">Active RAG Sources</span>
            <span className="font-mono font-bold text-[#10b981] text-xs">3</span>
          </div>

          <div className="pt-2 border-t border-line/50">
            <Link
              to="/rag-firewall"
              className="group text-[11px] text-ok hover:text-white flex items-center gap-1 font-bold tracking-wider uppercase transition-colors"
            >
              <span>View Memory Map</span>
              <ArrowRight
                size={12}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
