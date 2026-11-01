import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Home, Key, Terminal } from "lucide-react";

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#07080b] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Background Volumetric Aura */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-purple-700/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-lg text-center z-10 space-y-6">
        
        {/* Glowing Shield Icon */}
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto shadow-2xl shadow-red-950/40">
          <ShieldAlert className="w-10 h-10" />
        </div>

        {/* 404 Headline */}
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-red-500/30 bg-[#160a0f] text-red-400 text-xs font-mono uppercase tracking-wider mb-3">
            <span>ERROR 404 · QUARANTINED OR NOT FOUND</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold font-sora tracking-tight text-white mb-2">
            Tactical Route Not Found
          </h1>
          <p className="text-xs sm:text-sm text-[#a9a9aa] leading-relaxed max-w-sm mx-auto">
            The endpoint or resource you requested is either unregistered or was severed by the AgentShield-X Zero-Trust proxy.
          </p>
        </div>

        {/* Diagnostic Terminal Box */}
        <div className="p-4 rounded-2xl bg-[#0d0e13] border border-zinc-800 text-left font-mono text-xs space-y-1.5 shadow-xl">
          <div className="text-zinc-500 text-[10px] pb-1 border-b border-zinc-800 flex items-center justify-between">
            <span>AST ROUTE TELEMETRY</span>
            <span className="text-red-400">STATUS: 404</span>
          </div>
          <div className="text-zinc-400">
            <span className="text-purple-400">$</span> route_lookup: <code className="text-amber-300">{window.location.pathname}</code>
          </div>
          <div className="text-zinc-500 text-[11px]">
            # Verdict: Target URI does not resolve to an active console subsystem.
          </div>
        </div>

        {/* Action Navigation Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors flex items-center justify-center space-x-2 shadow-md"
          >
            <Home className="w-3.5 h-3.5 text-zinc-800" />
            <span>Return to Landing</span>
          </Link>

          <Link
            to="/security-challenge"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-purple-500/40 bg-[#150a26] text-purple-300 hover:text-white hover:border-[#a855f7] font-semibold text-xs transition-colors flex items-center justify-center space-x-2"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Security Challenge</span>
          </Link>

          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-zinc-800 bg-[#0d0e11] text-zinc-400 hover:text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>
        </div>

      </div>
    </div>
  );
};

