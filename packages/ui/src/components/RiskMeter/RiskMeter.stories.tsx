import type { Meta, StoryObj } from "@storybook/react";
import { RiskMeter } from "./RiskMeter";

const meta: Meta<typeof RiskMeter> = {
  title: "Components/RiskMeter",
  component: RiskMeter,
  tags: ["autodocs"],
  args: {
    score: 0.12,
    showNumeric: true,
    size: "md",
  },
};

export default meta;
type Story = StoryObj<typeof RiskMeter>;

export const LowRisk: Story = {
  args: { score: 0.08 },
};

export const MediumRisk: Story = {
  args: { score: 0.24 },
};

export const HighRisk: Story = {
  args: { score: 0.78 },
};

export const CriticalKillSession: Story = {
  args: { score: 0.98 },
};

export const Comparison: Story = {
  render: () => (
    <div className="flex flex-col gap-4 max-w-sm">
      <div>
        <span className="text-xs text-mut mb-1 block">Benign Call (0.04):</span>
        <RiskMeter score={0.04} />
      </div>
      <div>
        <span className="text-xs text-mut mb-1 block">Sanitize Tier (0.22):</span>
        <RiskMeter score={0.22} />
      </div>
      <div>
        <span className="text-xs text-mut mb-1 block">Escalate Tier (0.32):</span>
        <RiskMeter score={0.32} />
      </div>
      <div>
        <span className="text-xs text-mut mb-1 block">Block Tier (0.65):</span>
        <RiskMeter score={0.65} />
      </div>
      <div>
        <span className="text-xs text-mut mb-1 block">Kill Session (0.96):</span>
        <RiskMeter score={0.96} />
      </div>
    </div>
  ),
};
