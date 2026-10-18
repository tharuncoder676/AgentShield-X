import type { Meta, StoryObj } from "@storybook/react";
import { DefinitionList } from "./DefinitionList";

const meta: Meta<typeof DefinitionList> = {
  title: "Components/DefinitionList",
  component: DefinitionList,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DefinitionList>;

export const IncidentMetadata: Story = {
  args: {
    items: [
      { label: "Incident ID", value: "inc_84a1e94b-012a", copyable: true },
      { label: "Detected At", value: "2026-10-18T00:14:25Z" },
      { label: "Severity", value: "CRITICAL" },
      { label: "Policy Fired", value: "rego_enforce_no_exfiltration:v1.2" },
      { label: "Audit Hash", value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", copyable: true },
    ],
  },
};
