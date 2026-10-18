import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { TaintGraphNode } from "./TaintGraphNode";

const meta: Meta<typeof TaintGraphNode> = {
  title: "Components/TaintGraphNode",
  component: TaintGraphNode,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof TaintGraphNode>;

export const SourceNode: Story = {
  args: {
    id: "src_1",
    type: "source",
    label: "Webpage: https://docs.example.test",
    sublabel: "sha256: 4f98...c01a",
    trust: "untrusted",
    isTainted: false,
  },
};

export const TaintedSinkNode: Story = {
  args: {
    id: "sink_1",
    type: "sink",
    label: "Tool: send_email",
    sublabel: "to: exfil@attacker.example.test",
    trust: "untrusted",
    isTainted: true,
    taintOrigins: ["seg_webpage_4f98"],
  },
};

export const TaintPathVisual: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-3 p-4 bg-bg rounded-sm border border-line max-w-sm">
      <TaintGraphNode
        id="node_1"
        type="source"
        label="Untrusted Inbound Email"
        sublabel="src: attacker@evil.example.test"
        trust="untrusted"
      />
      <div className="text-line text-xs font-mono">↓ extracts context</div>
      <TaintGraphNode
        id="node_2"
        type="context"
        label="ContextSegment #seg_492"
        sublabel="Taint label: UNTRUSTED"
        trust="untrusted"
        isTainted={true}
        taintOrigins={["email_inbox"]}
      />
      <div className="text-bad text-xs font-mono">↓ flows into arguments</div>
      <TaintGraphNode
        id="node_3"
        type="sink"
        label="Target Sink: send_email()"
        sublabel="BLOCKED: Untrusted data exfil"
        trust="untrusted"
        isTainted={true}
        taintOrigins={["seg_492"]}
      />
    </div>
  ),
};
