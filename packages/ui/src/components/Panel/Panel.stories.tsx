import type { Meta, StoryObj } from "@storybook/react";
import { Panel } from "./Panel";

const meta: Meta<typeof Panel> = {
  title: "Components/Panel",
  component: Panel,
  tags: ["autodocs"],
  args: {
    title: "System Telemetry",
    subtitle: "Real-time inspection of decision service latency and health",
  },
};

export default meta;
type Story = StoryObj<typeof Panel>;

export const Default: Story = {
  render: () => (
    <Panel
      title="System Telemetry"
      subtitle="Real-time inspection of decision service latency and health"
      footer={<span>Status: Operational (p95: 18.4ms)</span>}
      className="max-w-lg"
    >
      <p className="text-xs text-mut font-sans leading-relaxed">
        The AgentShield-X gateway is intercepting tool calls. All 7 security detectors
        and calibrated monotonic LightGBM risk stackers are active.
      </p>
    </Panel>
  ),
};

export const ShieldVariant: Story = {
  render: () => (
    <Panel
      variant="shield"
      title="Shield Boundary Active"
      subtitle="Autonomous fail-closed enforcement"
      className="max-w-lg"
    >
      <div className="text-xs text-fg font-mono">
        Active Policy: <span className="text-ok">Strict-Enterprise-v1.4</span>
      </div>
    </Panel>
  ),
};

export const CriticalThreatVariant: Story = {
  render: () => (
    <Panel
      variant="critical"
      title="Critical Incident Detected"
      subtitle="Exfiltration honeytool trigger intercepted"
      className="max-w-lg"
    >
      <div className="text-xs text-bad font-mono">
        Event: <span className="underline">export_all_customers()</span> triggered.
      </div>
    </Panel>
  ),
};
