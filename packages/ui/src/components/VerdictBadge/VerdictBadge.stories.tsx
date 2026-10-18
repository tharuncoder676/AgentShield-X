import type { Meta, StoryObj } from "@storybook/react";
import { VerdictBadge } from "./VerdictBadge";

const meta: Meta<typeof VerdictBadge> = {
  title: "Components/VerdictBadge",
  component: VerdictBadge,
  tags: ["autodocs"],
  args: {
    action: "allow",
    size: "md",
    showDot: true,
  },
};

export default meta;
type Story = StoryObj<typeof VerdictBadge>;

export const Allow: Story = {
  args: { action: "allow" },
};

export const Sanitize: Story = {
  args: { action: "sanitize" },
};

export const Escalate: Story = {
  args: { action: "escalate" },
};

export const Block: Story = {
  args: { action: "block" },
};

export const KillSession: Story = {
  args: { action: "kill_session" },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <VerdictBadge action="allow" size="sm" />
        <VerdictBadge action="sanitize" size="sm" />
        <VerdictBadge action="block" size="sm" />
      </div>
      <div className="flex items-center gap-2">
        <VerdictBadge action="allow" size="md" />
        <VerdictBadge action="sanitize" size="md" />
        <VerdictBadge action="block" size="md" />
      </div>
      <div className="flex items-center gap-2">
        <VerdictBadge action="allow" size="lg" />
        <VerdictBadge action="sanitize" size="lg" />
        <VerdictBadge action="block" size="lg" />
      </div>
    </div>
  ),
};
