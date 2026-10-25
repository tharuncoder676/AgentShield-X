import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppShell,
  ShieldwingDrawer,
  ShieldwingChatMessage,
  ShieldwingProposal,
  ShieldwingDrawerConfig,
} from "@agentshield/ui";
import { Bot, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useStream } from "../context/StreamContext";
import { WingshieldVoiceAssistant } from "./WingshieldVoiceAssistant";

export const ConsoleLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, org, activeProject, client } = useAuth();
  const { status } = useStream();

  const [isShieldwingOpen, setIsShieldwingOpen] = useState(false);
  const [shieldwingLoading, setShieldwingLoading] = useState(false);
  const [shieldwingConfig, setShieldwingConfig] = useState<ShieldwingDrawerConfig | undefined>(undefined);
  const [messages, setMessages] = useState<ShieldwingChatMessage[]>([
    {
      id: "initial-msg",
      role: "assistant",
      content:
        "Hello! I am Shieldwing, your autonomous security copilot. I analyze intercepted telemetry, cite real evidence fields, and draft Rego guardrails. How can I assist your operations?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      evidence_citations: ["AgentShield-X Telemetry v1.0"],
      shield_protected: true,
      dogfood_verdict: "ALLOWED",
    },
  ]);

  // Fetch Shieldwing configuration when drawer opens or user is authenticated
  useEffect(() => {
    async function loadConfig() {
      try {
        const cfg = await client.getShieldwingConfig();
        setShieldwingConfig(cfg);
      } catch (err) {
        console.warn("Could not load Shieldwing config:", err);
      }
    }
    if (isShieldwingOpen) {
      loadConfig();
    }
  }, [isShieldwingOpen, client]);

  // Map path to nav id
  const pathParts = location.pathname.split("/").filter(Boolean);
  const currentPathId = pathParts[0] || "overview";
  const entityId = pathParts[1] || undefined;

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

  const handleSendMessage = async (text: string) => {
    const userMsg: ShieldwingChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setShieldwingLoading(true);

    try {
      const res = await client.chatShieldwing(text, {
        view: currentPathId,
        entity_id: entityId,
      });

      const assistantMsg: ShieldwingChatMessage = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: res.message,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        evidence_citations: res.evidence_citations,
        proposals: res.proposals,
        dogfood_verdict: res.dogfood_verdict,
        shield_protected: res.shield_protected,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ShieldwingChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `Error contacting Shieldwing: ${err.message || "Network error"}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        dogfood_verdict: "ERROR",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setShieldwingLoading(false);
    }
  };

  const handleApplyProposal = async (proposal: ShieldwingProposal) => {
    if (proposal.type === "policy_draft" && proposal.rego_code && activeProject) {
      try {
        await client.createPolicy(activeProject.id, {
          name: proposal.title,
          description: proposal.description,
          rules_rego: proposal.rego_code,
          version: "1.0.0",
          is_active: true,
        });
        navigate("/policies");
        setIsShieldwingOpen(false);
      } catch (err: any) {
        alert(`Failed to apply proposal: ${err.message}`);
      }
    }
  };

  const handleUpdateConfig = async (data: { api_key?: string; model?: string; provider?: string }) => {
    const updated = await client.updateShieldwingConfig(data);
    setShieldwingConfig(updated);
  };

  const handleTestConnection = async (data: { api_key?: string; model?: string }) => {
    return await client.testShieldwingConnection(data);
  };

  return (
    <AppShell
      currentPath={currentPathId}
      onNavigate={handleNavigate}
      orgName={org?.name || "Organization"}
      projectName={activeProject?.name || "Default Project"}
      connectionStatus={mappedStatus}
      shieldActive={true}
    >
      <div className="p-6 max-w-7xl mx-auto w-full relative">
        <Outlet />

        {/* Floating Shieldwing Copilot Trigger Button */}
        <button
          onClick={() => setIsShieldwingOpen(true)}
          className="fixed bottom-6 right-24 z-40 px-3.5 py-2.5 bg-panel border border-ok/50 text-ok hover:bg-ok/10 font-chakra font-bold text-xs uppercase tracking-wider rounded-sm shadow-xl flex items-center gap-2 backdrop-blur-md transition-all hover:scale-105"
          title="Open Shieldwing AI Security Copilot"
        >
          <div className="w-2 h-2 rounded-full bg-ok animate-pulse" />
          <Bot size={15} />
          <span>Shieldwing</span>
          {shieldwingConfig?.provider === "nvidia" && shieldwingConfig?.has_api_key && (
            <span className="text-[9px] px-1 bg-[#76b900]/20 text-[#76b900] rounded-sm font-mono border border-[#76b900]/40">
              NVIDIA
            </span>
          )}
        </button>

        {/* Floating Wingshield Copilot Voice Assistant & Autonomous Tour HUD */}
        <WingshieldVoiceAssistant />

        {/* Shieldwing Copilot Drawer */}
        <ShieldwingDrawer
          isOpen={isShieldwingOpen}
          onClose={() => setIsShieldwingOpen(false)}
          messages={messages}
          onSendMessage={handleSendMessage}
          onApplyProposal={handleApplyProposal}
          isLoading={shieldwingLoading}
          activeContext={{
            view: currentPathId,
            entityId,
          }}
          config={shieldwingConfig}
          onUpdateConfig={handleUpdateConfig}
          onTestConnection={handleTestConnection}
        />
      </div>
    </AppShell>
  );
};
