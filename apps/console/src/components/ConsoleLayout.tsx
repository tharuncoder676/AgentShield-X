import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "@agentshield/ui";
import { useAuth } from "../context/AuthContext";
import { useStream } from "../context/StreamContext";
import { WingshieldVoiceAssistant } from "./WingshieldVoiceAssistant";
import { ApiKeyPortalModal } from "./ApiKeyPortalModal";
import { Key, Shield, Zap, Copy, CheckCircle, Terminal, Sparkles } from "lucide-react";

export const ConsoleLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { org, activeProject, user, logout } = useAuth();
  const { status } = useStream();

  const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem("agentshield_api_key"));
  const [tier, setTier] = useState<string>(() => localStorage.getItem("agentshield_tier") || "trial");
  const [showKeyModal, setShowKeyModal] = useState<boolean>(!apiKey);
  const [copiedCli, setCopiedCli] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("agentshield_api_key");
    const storedTier = localStorage.getItem("agentshield_tier");
    if (stored) {
      setApiKey(stored);
      if (storedTier) setTier(storedTier);
    } else {
      setShowKeyModal(true);
    }
  }, []);

  const handleCopyCli = () => {
    const keyToUse = apiKey || "asx_trial_demo";
    navigator.clipboard.writeText(`agentshield login --key ${keyToUse}`);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  // Map path to nav id
  const pathParts = location.pathname.split("/").filter(Boolean);
  const currentPathId = pathParts[0] || "command-center";

  const mappedStatus =
    status === "connected"
      ? "connected"
      : status === "reconnecting" || status === "connecting"
      ? "reconnecting"
      : "offline";

  const handleNavigate = (id: string) => {
    if (id === "settings") {
      navigate("/settings/keys");
    } else {
      navigate(`/${id}`);
    }
  };

  const handleKeySuccess = (newKey: string, newTier: string) => {
    setApiKey(newKey);
    setTier(newTier);
    setShowKeyModal(false);
  };

  return (
    <AppShell
      currentPath={currentPathId}
      onNavigate={handleNavigate}
      orgName={org?.name || (user?.email ? `${user.email.split("@")[0]}'s Workspace` : "Primary Workspace")}
      projectName={activeProject?.name || "Production Security Agent"}
      connectionStatus={mappedStatus}
      shieldActive={true}
      userEmail={user?.email || localStorage.getItem("agentshield_user_email") || undefined}
      userName={(user as any)?.name || user?.full_name || localStorage.getItem("agentshield_user_name") || undefined}
      onLogout={logout}
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full relative space-y-4">
        
        {/* Production License & CLI Sync Ribbon */}
        <div className="rounded-xl border border-purple-500/30 bg-[#0f0b1b]/95 backdrop-blur-md px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg shadow-purple-950/20">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 text-[#c084fc] border border-purple-500/40 font-mono font-bold uppercase tracking-wider text-[10px]">
              {tier === "trial" ? (
                <>
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>10-Day Pro Trial (10 Days Left)</span>
                </>
              ) : tier === "free" ? (
                <>
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Community Free (100 req/day)</span>
                </>
              ) : (
                <>
                  <Shield className="w-3 h-3 text-purple-400" />
                  <span>Pro Production Unrestricted</span>
                </>
              )}
            </div>

            <div className="hidden md:flex items-center space-x-1.5 font-mono text-zinc-400 text-[11px]">
              <Key className="w-3.5 h-3.5 text-zinc-500" />
              <span>Key:</span>
              <span className="text-zinc-200">
                {apiKey ? `${apiKey.slice(0, 10)}...${apiKey.slice(-4)}` : "Unauthenticated"}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyCli}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-[#a855f7] text-zinc-300 hover:text-white font-mono text-[11px] transition-all"
              title="Copy terminal CLI login command"
            >
              <Terminal className="w-3 h-3 text-purple-400" />
              <span>Copy CLI Login</span>
              {copiedCli ? (
                <CheckCircle className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 text-zinc-500" />
              )}
            </button>

            <button
              onClick={() => setShowKeyModal(true)}
              className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-[#c084fc] hover:text-white border border-purple-500/40 text-[11px] font-semibold transition-all"
            >
              {apiKey ? "Manage Key" : "Activate License"}
            </button>
          </div>
        </div>

        <Outlet />

        {/* Floating Wingshield Copilot Voice Assistant & Autonomous Tour HUD */}
        <WingshieldVoiceAssistant />

        {/* Licensing & API Key Modal */}
        <ApiKeyPortalModal
          isOpen={showKeyModal}
          onClose={() => {
            // If they have a key, allow closing. If not, auto-generate fallback trial so they can view
            if (!apiKey) {
              const fallbackKey = `asx_trial_${Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('')}`;
              localStorage.setItem("agentshield_api_key", fallbackKey);
              localStorage.setItem("agentshield_tier", "trial");
              setApiKey(fallbackKey);
              setTier("trial");
            }
            setShowKeyModal(false);
          }}
          onSuccess={handleKeySuccess}
        />
      </div>
    </AppShell>
  );
};
