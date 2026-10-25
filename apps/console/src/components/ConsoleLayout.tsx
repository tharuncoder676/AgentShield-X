import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "@agentshield/ui";
import { useAuth } from "../context/AuthContext";
import { useStream } from "../context/StreamContext";
import { WingshieldVoiceAssistant } from "./WingshieldVoiceAssistant";

export const ConsoleLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { org, activeProject } = useAuth();
  const { status } = useStream();

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

        {/* Floating Wingshield Copilot Voice Assistant & Autonomous Tour HUD */}
        <WingshieldVoiceAssistant />
      </div>
    </AppShell>
  );
};
