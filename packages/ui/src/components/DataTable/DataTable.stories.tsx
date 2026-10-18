import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { DataTable } from "./DataTable";
import { VerdictBadge } from "../VerdictBadge/VerdictBadge";

interface AuditLogRow {
  id: string;
  timestamp: string;
  tool: string;
  verdict: "allow" | "block" | "sanitize";
  risk: number;
  latencyMs: number;
}

const mockData: AuditLogRow[] = [
  { id: "ev_1", timestamp: "00:14:01", tool: "read_webpage", verdict: "allow", risk: 0.02, latencyMs: 11.2 },
  { id: "ev_2", timestamp: "00:14:03", tool: "search_customers", verdict: "allow", risk: 0.05, latencyMs: 14.8 },
  { id: "ev_3", timestamp: "00:14:09", tool: "send_email", verdict: "block", risk: 0.94, latencyMs: 16.4 },
  { id: "ev_4", timestamp: "00:14:15", tool: "run_sql", verdict: "sanitize", risk: 0.28, latencyMs: 12.9 },
  { id: "ev_5", timestamp: "00:14:22", tool: "read_pdf", verdict: "allow", risk: 0.01, latencyMs: 9.7 },
];

const meta: Meta<typeof DataTable> = {
  title: "Components/DataTable",
  component: DataTable,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DataTable>;

export const AuditGrid: Story = {
  render: () => (
    <DataTable<AuditLogRow>
      columns={[
        { key: "id", header: "Event ID", cell: (r) => <span className="font-mono text-xs">{r.id}</span> },
        { key: "timestamp", header: "Time", cell: (r) => <span>{r.timestamp}</span>, sortable: true },
        { key: "tool", header: "Tool Name", cell: (r) => <span className="font-chakra font-medium">{r.tool}</span>, sortable: true },
        { key: "verdict", header: "Verdict", cell: (r) => <VerdictBadge action={r.verdict} size="sm" /> },
        { key: "risk", header: "Risk", cell: (r) => <span className="tabular-nums font-mono">{r.risk.toFixed(2)}</span>, sortable: true },
        { key: "latencyMs", header: "Latency", cell: (r) => <span className="text-mut font-mono">{r.latencyMs}ms</span> },
      ]}
      data={mockData}
      keyExtractor={(r) => r.id}
      pageSize={5}
    />
  ),
};
