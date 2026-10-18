import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { Toast, ToastContainer, ToastItem } from "./Toast";

const meta: Meta<typeof Toast> = {
  title: "Components/Toast",
  component: Toast,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const ErrorWithRemediation: Story = {
  args: {
    toast: {
      id: "err_1",
      type: "error",
      title: "Gateway Authentication Failed",
      message: "The provided API key does not match any registered tenant boundary.",
      remediation: "Verify X-Shield-API-Key header in client config or regenerate under /settings.",
      action: {
        label: "Regenerate Key",
        onClick: () => {},
      },
    },
    onDismiss: () => {},
  },
};

export const SuccessToast: Story = {
  args: {
    toast: {
      id: "suc_1",
      type: "success",
      title: "Policy Deployed Successfully",
      message: "OPA bundle v1.4 active on decision service (reload latency: 12ms).",
    },
    onDismiss: () => {},
  },
};

export const ActiveToastStack: Story = {
  render: () => {
    const [toasts, setToasts] = useState<ToastItem[]>([
      {
        id: "1",
        type: "error",
        title: "Malicious Sink Trapped",
        message: "send_email blocked by taint tracking engine.",
        remediation: "Review tainted context in Incident INC-9482.",
      },
      {
        id: "2",
        type: "warning",
        title: "Model Drift Notice",
        message: "Sequence autoencoder reconstruction loss elevated on Agent-03.",
      },
    ]);

    return (
      <div className="min-h-[250px] relative">
        <ToastContainer
          toasts={toasts}
          onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
        />
      </div>
    );
  },
};
