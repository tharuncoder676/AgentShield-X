import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { Switch } from "./Switch";

const meta: Meta<typeof Switch> = {
  title: "Components/Switch",
  component: Switch,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  render: () => {
    const [checked, setChecked] = useState(true);
    return (
      <Switch
        checked={checked}
        onCheckedChange={setChecked}
        label="Autonomous Interception"
        description="Block adversarial calls before tool dispatch"
      />
    );
  },
};

export const Disabled: Story = {
  args: {
    checked: false,
    disabled: true,
    label: "Honeytools Decoys (Enterprise Only)",
    description: "Requires Enterprise tier license",
  },
};
