import type { Meta, StoryObj } from "@storybook/react";
import { ErrorState } from "./ErrorState";

const meta: Meta<typeof ErrorState> = {
  title: "Components/ErrorState",
  component: ErrorState,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ErrorState>;

export const ConnectionRefused: Story = {
  args: {
    title: "Decision Service Unreachable",
    error: "HTTPConnectionPool(host='decision-service', port=8001): Read timed out (0.5s limit)",
    remediation: "Check if the decision service container is healthy on port 8001.",
    onRetry: () => {},
  },
};
