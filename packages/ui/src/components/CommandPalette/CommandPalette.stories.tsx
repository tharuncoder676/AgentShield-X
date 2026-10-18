import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { CommandPalette } from "./CommandPalette";

const meta: Meta<typeof CommandPalette> = {
  title: "Components/CommandPalette",
  component: CommandPalette,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CommandPalette>;

export const GlobalNavigation: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    const items = [
      { id: "1", title: "Live Feed", category: "Pages", subtitle: "Streaming decisions & trace events", onSelect: () => {} },
      { id: "2", title: "Incidents & Triage", category: "Pages", subtitle: "Review 3 active flagged incidents", onSelect: () => {} },
      { id: "3", title: "Architecture Explorer", category: "Pages", subtitle: "Interactive data plane & ML map", onSelect: () => {} },
      { id: "4", title: "Support-Agent-01", category: "Agents", subtitle: "Customer support LLM agent", onSelect: () => {} },
      { id: "5", title: "Bypass Shield (Emergency)", category: "Actions", subtitle: "Disable interception for testing", onSelect: () => {} },
      { id: "6", title: "Verify Audit Hash-Chain", category: "Actions", subtitle: "Verify SHA-256 tamper-evident logs", onSelect: () => {} },
    ];

    return (
      <div>
        <button
          onClick={() => setOpen(true)}
          className="px-3 py-1.5 rounded-sm bg-panel border border-line text-xs font-chakra uppercase"
        >
          Open Command Palette (Cmd+K)
        </button>

        <CommandPalette
          isOpen={open}
          onClose={() => setOpen(false)}
          items={items}
        />
      </div>
    );
  },
};
