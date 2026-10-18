import React from "react";
import { Link } from "react-router-dom";
import { Shield, ExternalLink, GitBranch, Terminal } from "lucide-react";

export const SiteFooter: React.FC = () => {
  return (
    <footer className="border-t border-line bg-panel/60 py-12 text-xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-panel border border-ok/50 flex items-center justify-center text-ok rounded-sm">
                <Shield size={14} />
              </div>
              <span className="font-chakra font-bold text-sm tracking-wider uppercase text-fg">
                AgentShield<span className="text-ok">-X</span>
              </span>
            </div>
            <p className="text-mut text-xs leading-relaxed max-w-sm">
              Real-time security platform protecting LLM-based agentic systems from prompt injection,
              tool misuse, data exfiltration, goal hijacking, and behavioral anomalies.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] font-chakra text-mut">
              <span className="w-2 h-2 rounded-full bg-ok" />
              <span>Status: All Operational Systems Online</span>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-2.5">
            <div className="font-chakra font-bold text-xs uppercase tracking-wider text-fg">
              Product
            </div>
            <ul className="space-y-1.5 text-mut">
              <li>
                <Link to="/demo" className="hover:text-ok transition-colors">
                  Interactive Demo
                </Link>
              </li>
              <li>
                <Link to="/architecture" className="hover:text-ok transition-colors">
                  Architecture Explorer
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-ok transition-colors">
                  Plans & Pricing
                </Link>
              </li>
              <li>
                <a href="http://localhost:5173" className="hover:text-ok transition-colors">
                  Operations Console
                </a>
              </li>
            </ul>
          </div>

          {/* Developers & Docs */}
          <div className="space-y-2.5">
            <div className="font-chakra font-bold text-xs uppercase tracking-wider text-fg">
              Documentation
            </div>
            <ul className="space-y-1.5 text-mut">
              <li>
                <Link to="/docs" className="hover:text-ok transition-colors">
                  Quickstart Guide
                </Link>
              </li>
              <li>
                <Link to="/docs?tab=sdk" className="hover:text-ok transition-colors">
                  Python & TS SDKs
                </Link>
              </li>
              <li>
                <Link to="/docs?tab=rego" className="hover:text-ok transition-colors">
                  Rego & OPA Guardrails
                </Link>
              </li>
              <li>
                <Link to="/benchmarks" className="hover:text-ok transition-colors">
                  Measured Benchmarks
                </Link>
              </li>
            </ul>
          </div>

          {/* Compliance & Legal */}
          <div className="space-y-2.5">
            <div className="font-chakra font-bold text-xs uppercase tracking-wider text-fg">
              Legal & Security
            </div>
            <ul className="space-y-1.5 text-mut">
              <li>
                <Link to="/legal?doc=privacy" className="hover:text-ok transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/legal?doc=terms" className="hover:text-ok transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/legal?doc=security" className="hover:text-ok transition-colors">
                  Vulnerability Disclosure
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-line/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-mut font-chakra">
          <div>&copy; 2026 AgentShield-X Engineering. Open Architecture.</div>
          <div className="flex items-center gap-4">
            <span>Commit: 574e067 (Phase 6 Release)</span>
            <span>&bull;</span>
            <span>p95 Latency &lt; 15ms</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
