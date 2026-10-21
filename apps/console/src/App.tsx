import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { StreamProvider } from "./context/StreamContext";
import { ConsoleLayout } from "./components/ConsoleLayout";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Onboarding } from "./pages/Onboarding";
import { Overview } from "./pages/Overview";
import { LiveFeed } from "./pages/LiveFeed";
import { ApiKeys } from "./pages/ApiKeys";
import { Incidents } from "./pages/Incidents";
import { IncidentDetail } from "./pages/IncidentDetail";
import { Sessions } from "./pages/Sessions";
import { SessionDetailView } from "./pages/SessionDetail";
import { Agents } from "./pages/Agents";
import { AgentDetailView } from "./pages/AgentDetail";
import { Policies } from "./pages/Policies";
import { Approvals } from "./pages/Approvals";
import { Models } from "./pages/Models";
import { Honeytools } from "./pages/Honeytools";
import { McpProxy } from "./pages/McpProxy";
import { Audit } from "./pages/Audit";
import { Architecture } from "./pages/Architecture";
import { Terminal } from "./pages/Terminal";
import { Scans } from "./pages/Scans";
import { Swarm } from "./pages/Swarm";
import { Debate } from "./pages/Debate";
import { RedTeam } from "./pages/RedTeam";
import { AutoPolicy } from "./pages/AutoPolicy";
import { Attestation } from "./pages/Attestation";
import { Immunity } from "./pages/Immunity";
import { RAGFirewall } from "./pages/RAGFirewall";
import { Panel } from "@agentshield/ui";

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg text-fg flex items-center justify-center font-chakra text-xs tracking-widest uppercase">
        <span className="animate-pulse">Loading Security Context...</span>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Placeholder for phases 3-6 pages
const ComingSoon: React.FC<{ feature: string; phase: string }> = ({
  feature,
  phase,
}) => (
  <div className="py-12 text-center max-w-lg mx-auto space-y-4">
    <Panel title={`${feature} Module`}>
      <div className="space-y-3 py-6">
        <div className="font-chakra font-bold text-sm uppercase text-ok">
          Scheduled for {phase}
        </div>
        <p className="text-xs text-mut leading-relaxed">
          The {feature} subsystem is currently being connected to the live backend engine.
        </p>
        <Link
          to="/overview"
          className="inline-block text-xs font-chakra uppercase font-bold text-ok hover:underline pt-2"
        >
          &larr; Return to Overview
        </Link>
      </div>
    </Panel>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StreamProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Onboarding Wizard (Can be accessed standalone or within console) */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />

            {/* Authenticated Console Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <ConsoleLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/overview" replace />} />
              <Route path="overview" element={<Overview />} />
              <Route path="terminal" element={<Terminal />} />
              <Route path="live" element={<LiveFeed />} />
              <Route path="scans" element={<Scans />} />
              <Route path="swarm" element={<Swarm />} />
              <Route path="debate" element={<Debate />} />
              <Route path="redteam" element={<RedTeam />} />
              <Route path="autopolicy" element={<AutoPolicy />} />
              <Route path="attestation" element={<Attestation />} />
              <Route path="immunity" element={<Immunity />} />
              <Route path="rag-firewall" element={<RAGFirewall />} />
              <Route path="settings/keys" element={<ApiKeys />} />

              {/* Incidents & Taint Trace Subsystem */}
              <Route path="incidents" element={<Incidents />} />
              <Route path="incidents/:id" element={<IncidentDetail />} />

              {/* Sessions & Replay Simulator Subsystem */}
              <Route path="sessions" element={<Sessions />} />
              <Route path="sessions/:id" element={<SessionDetailView />} />

              {/* Agent Registry & Blast-Radius Subsystem */}
              <Route path="agents" element={<Agents />} />
              <Route path="agents/:id" element={<AgentDetailView />} />

              {/* Policies & Simulation Subsystem */}
              <Route path="policies" element={<Policies />} />

              {/* Human-in-the-Loop Approvals Subsystem */}
              <Route path="approvals" element={<Approvals />} />

              {/* Detectors & Model Registry Subsystem */}
              <Route path="models" element={<Models />} />

              {/* Honeytools & Decoy Traps Subsystem */}
              <Route path="honeytools" element={<Honeytools />} />

              {/* MCP Security Proxy & Tool Rug-Pull Subsystem */}
              <Route path="mcp" element={<McpProxy />} />

              {/* Cryptographic Audit Log Subsystem */}
              <Route path="audit" element={<Audit />} />

              {/* Placeholders for Console Features scheduled for upcoming phases */}
              {/* Interactive Architecture Explorer Subsystem */}
              <Route path="architecture" element={<Architecture />} />
              <Route
                path="settings"
                element={<Navigate to="/settings/keys" replace />}
              />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </StreamProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
