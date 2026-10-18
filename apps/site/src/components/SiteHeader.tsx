import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Shield, ExternalLink, Terminal, Cpu, BookOpen, BarChart3, CreditCard } from "lucide-react";

export const SiteHeader: React.FC = () => {
  const location = useLocation();

  const navLinks = [
    { name: "Live Demo", path: "/demo" },
    { name: "Architecture", path: "/architecture" },
    { name: "Docs", path: "/docs" },
    { name: "Benchmarks", path: "/benchmarks" },
    { name: "Pricing", path: "/pricing" },
  ];

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-panel border border-ok/50 flex items-center justify-center text-ok rounded-sm group-hover:border-ok transition-colors">
            <Shield size={18} />
          </div>
          <div className="flex flex-col">
            <span className="font-chakra font-bold text-base tracking-wider uppercase text-fg leading-none">
              AgentShield<span className="text-ok">-X</span>
            </span>
            <span className="text-[10px] text-mut font-chakra leading-tight mt-0.5">
              Autonomous AI Agent Security
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`font-chakra text-xs uppercase tracking-wider font-semibold transition-colors ${
                  isActive ? "text-ok" : "text-mut hover:text-fg"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/agentshield-x/agentshield-x"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border border-line hover:border-line/80 text-mut hover:text-fg text-xs font-chakra font-bold uppercase rounded-sm transition-colors"
          >
            <span>GitHub</span>
            <ExternalLink size={12} />
          </a>
          <a
            href="http://localhost:5173"
            className="px-3.5 py-1.5 bg-ok text-bg font-chakra font-bold text-xs uppercase tracking-wider rounded-sm hover:opacity-90 flex items-center gap-1.5 shadow-sm transition-opacity"
          >
            <span>Launch Console</span>
          </a>
        </div>
      </div>
    </header>
  );
};
