import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { PolicyEditor } from "./PolicyEditor";

const sampleRego = `package agentshield.authz

default allow = false

# Rule 1: Honeytools are unconditionally blocked
deny[msg] {
    input.tool.name == "export_all_customers"
    msg := "Critical honeytool trap triggered"
}

# Rule 2: Tainted context cannot reach external communication sinks
deny[msg] {
    input.tool.sensitivity == "critical"
    count(input.taint) > 0
    msg := "Tainted context segment flowing to sensitive sink"
}

# Rule 3: Allow if no deny rules fired
allow {
    count(deny) == 0
}`;

const meta: Meta<typeof PolicyEditor> = {
  title: "Components/PolicyEditor",
  component: PolicyEditor,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof PolicyEditor>;

export const ValidRegoPolicy: Story = {
  args: {
    value: sampleRego,
    readOnly: true,
    language: "rego",
  },
};

export const EditableWithSyntaxError: Story = {
  render: () => {
    const [code, setCode] = useState(`package agentshield.authz\n\ndefault allow = true\n\n# Missing bracket syntax error:\ndeny[msg {\n    input.risk > 0.7\n}`);
    return (
      <PolicyEditor
        value={code}
        onChange={setCode}
        error="Syntax error at line 6, col 10: unexpected token '{', expected ']'"
      />
    );
  },
};
