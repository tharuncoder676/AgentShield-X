import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "./EmptyState";

const meta: Meta<typeof EmptyState> = {
  title: "Components/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const NoIncidents: Story = {
  args: {
    title: "Zero Security Incidents",
    description: "All agents are executing within calibrated policy contracts and least-privilege tool bounds.",
    actionLabel: "View Live Feed",
    onAction: () => {},
  },
};

export const NoHoneytools: Story = {
  args: {
    title: "No Honeytools Configured",
    description: "Deploy decoy tools such as export_all_customers to instantly detect autonomous reconnaissance.",
    actionLabel: "Create Honeytool Decoy",
    onAction: () => {},
  },
};
