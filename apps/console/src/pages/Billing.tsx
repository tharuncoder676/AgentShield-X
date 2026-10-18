import React, { useEffect, useState } from "react";
import {
  CreditCard,
  Check,
  Zap,
  TrendingUp,
  FileText,
  Download,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  Panel,
  cn,
} from "@agentshield/ui";
import { useAuth } from "../context/AuthContext";
import {
  Subscription,
  BillingUsage,
  Invoice,
} from "@agentshield/api-client";

export const Billing: React.FC = () => {
  const { activeProject, client } = useAuth();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<BillingUsage | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadBillingData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [subData, usageData, invData] = await Promise.all([
        client.getSubscription(activeProject?.id),
        client.getBillingUsage(activeProject?.id),
        client.listInvoices(activeProject?.id),
      ]);
      setSubscription(subData);
      setUsage(usageData);
      setInvoices(invData);
    } catch (err: any) {
      console.error("Failed to load billing data:", err);
      setError(err?.message || "Failed to load billing");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, [activeProject]);

  const handleSelectPlan = async (plan: "free" | "team" | "enterprise") => {
    if (!activeProject) return;
    if (subscription?.plan === plan) return;

    if (!window.confirm(`Confirm changing subscription plan to '${plan.toUpperCase()}'?`)) {
      return;
    }

    setIsUpdatingPlan(true);
    try {
      const updated = await client.updateSubscription(activeProject.id, { plan });
      setSubscription(updated);
      loadBillingData();
    } catch (err: any) {
      console.error("Failed to update plan:", err);
      alert(`Plan update failed: ${err?.message || "Unknown error"}`);
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  const PLANS = [
    {
      id: "free" as const,
      name: "Free Tier",
      price: "$0",
      cadence: "forever free",
      limit: "10,000 tool calls / mo",
      features: [
        "Up to 3 active LLM agents",
        "Deterministic Rego policies",
        "Standard rule detectors & honeypots",
        "Community support & docs",
        "7-day cryptographic audit log",
      ],
    },
    {
      id: "team" as const,
      name: "Team Plan",
      price: "$99",
      cadence: "per month",
      limit: "250,000 tool calls / mo",
      popular: true,
      features: [
        "Unlimited registered agents",
        "GPU-accelerated DeBERTa ONNX inference",
        "Sequence anomaly autoencoder & intent drift",
        "Human-in-the-Loop approvals queue",
        "30-day cryptographic audit log",
        "Priority Slack & email support",
      ],
    },
    {
      id: "enterprise" as const,
      name: "Enterprise",
      price: "$499",
      cadence: "per month",
      limit: "5,000,000 tool calls / mo",
      features: [
        "Custom ML model fine-tuning on org data",
        "Dedicated isolated inference gateway",
        "Role-based access control (RBAC)",
        "365-day tamper-evident audit retention",
        "Custom SLA (99.99% uptime)",
        "Dedicated solutions engineer",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-chakra uppercase font-bold text-xs tracking-widest text-ok">
              Metering & Subscriptions
            </span>
            <span className="text-line">&bull;</span>
            <span className="text-xs text-mut font-mono">Stripe Billing Portal</span>
          </div>
          <h1 className="text-2xl font-chakra font-bold text-fg uppercase tracking-wider mt-1">
            Usage & Billing
          </h1>
          <p className="text-xs text-mut mt-0.5">
            Monitor real-time tool-call consumption, manage subscription plans, and download receipts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadBillingData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-line bg-panel text-xs text-mut hover:text-fg hover:border-mut transition-colors"
            title="Refresh usage"
          >
            <RefreshCw size={13} className={cn(isLoading && "animate-spin")} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Usage Progress Meter */}
      <Panel
        title="Monthly Tool-Call Ingestion Quota"
        actions={
          <span className="text-[10px] font-mono text-ok uppercase px-1.5 py-0.5 rounded-sm bg-ok/10 border border-ok/30">
            {subscription?.plan.toUpperCase()} TIER ACTIVE
          </span>
        }
      >
        {usage && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <div className="font-chakra font-bold text-2xl text-fg">
                {usage.calls_used.toLocaleString()}{" "}
                <span className="text-sm text-mut font-normal">
                  / {usage.calls_limit.toLocaleString()} calls used
                </span>
              </div>
              <div className="text-xs font-mono text-ok font-semibold">
                {usage.quota_used_pct.toFixed(1)}% consumed
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-bg rounded-sm overflow-hidden border border-line p-0.5">
              <div
                style={{ width: `${Math.min(100, Math.max(2, usage.quota_used_pct))}%` }}
                className={cn(
                  "h-full rounded-sm transition-all",
                  usage.quota_used_pct > 90
                    ? "bg-bad"
                    : usage.quota_used_pct > 75
                    ? "bg-warn"
                    : "bg-ok"
                )}
              />
            </div>

            {/* Actions Breakdown Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/40 text-xs font-mono">
              <span className="text-[10px] font-chakra uppercase text-mut font-semibold mr-1">
                Interceptions Breakdown:
              </span>
              <span className="px-2 py-0.5 rounded-sm bg-ok/10 text-ok border border-ok/30">
                Allowed: {usage.actions_breakdown.allow || 0}
              </span>
              <span className="px-2 py-0.5 rounded-sm bg-bad/10 text-bad border border-bad/30">
                Blocked: {usage.actions_breakdown.block || 0}
              </span>
              <span className="px-2 py-0.5 rounded-sm bg-info/10 text-info border border-info/30">
                Sanitized: {usage.actions_breakdown.sanitize || 0}
              </span>
              <span className="px-2 py-0.5 rounded-sm bg-warn/10 text-warn border border-warn/30">
                Escalated: {usage.actions_breakdown.escalate || 0}
              </span>
              <span className="px-2 py-0.5 rounded-sm bg-purple/10 text-purple border border-purple/30">
                Terminated: {usage.actions_breakdown.kill_session || 0}
              </span>
            </div>

            <div className="text-[11px] text-mut font-sans">
              Billing cycle renews on{" "}
              <span className="text-fg font-mono">
                {new Date(usage.billing_period_end).toLocaleDateString()}
              </span>
              . Ingestion calls that exceed plan limits are automatically queued or upgraded.
            </div>
          </div>
        )}
      </Panel>

      {/* Subscription Tier Cards */}
      <div className="space-y-3">
        <div className="font-chakra font-bold text-base text-fg uppercase tracking-wider">
          Available Subscription Plans
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = subscription?.plan === plan.id;
            return (
              <Panel
                key={plan.id}
                className={cn(
                  "flex flex-col justify-between transition-all",
                  isCurrent && "border-ok/60 shadow-md",
                  plan.popular && !isCurrent && "border-warn/40"
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-chakra font-bold text-sm text-fg uppercase tracking-wider">
                      {plan.name}
                    </span>
                    {isCurrent ? (
                      <span className="px-2 py-0.5 rounded-sm bg-ok/20 text-ok border border-ok/40 text-[10px] font-chakra font-bold uppercase">
                        CURRENT PLAN
                      </span>
                    ) : plan.popular ? (
                      <span className="px-2 py-0.5 rounded-sm bg-warn/20 text-warn border border-warn/40 text-[10px] font-chakra font-bold uppercase">
                        MOST POPULAR
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-chakra font-bold text-fg">
                      {plan.price}
                    </span>
                    <span className="text-xs text-mut font-sans">/ {plan.cadence}</span>
                  </div>

                  <div className="mt-2 text-xs font-mono text-ok font-semibold">
                    {plan.limit}
                  </div>

                  <ul className="mt-4 pt-4 border-t border-line/40 space-y-2 text-xs font-sans text-mut">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check size={13} className="text-ok shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-line">
                  <button
                    type="button"
                    disabled={isCurrent || isUpdatingPlan}
                    onClick={() => handleSelectPlan(plan.id)}
                    className={cn(
                      "w-full py-2 rounded-sm font-chakra font-bold text-xs uppercase tracking-wider transition-opacity",
                      isCurrent
                        ? "bg-line/40 text-mut cursor-default"
                        : "bg-ok text-bg hover:opacity-90"
                    )}
                  >
                    {isCurrent ? "Active Plan" : `Select ${plan.name}`}
                  </button>
                </div>
              </Panel>
            );
          })}
        </div>
      </div>

      {/* Invoices History Table */}
      <Panel title="Billing & Invoices History">
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-xs text-mut font-chakra uppercase">
            No invoices generated yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-line bg-bg/40 text-[10px] font-chakra uppercase text-mut tracking-wider">
                  <th className="py-2.5 px-4 font-semibold">Invoice ID</th>
                  <th className="py-2.5 px-4 font-semibold">Billing Date</th>
                  <th className="py-2.5 px-4 font-semibold">Amount</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-line/10 transition-colors">
                    <td className="py-3 px-4 font-semibold text-fg">
                      {inv.id}
                    </td>

                    <td className="py-3 px-4 text-mut font-sans">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 font-bold text-fg">
                      ${(inv.amount_cents / 100).toFixed(2)} {inv.currency.toUpperCase()}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-1.5 py-0.5 rounded-sm bg-ok/10 text-ok border border-ok/30 text-[10px] font-chakra font-bold uppercase">
                        {inv.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => alert(`Receipt downloaded for ${inv.id}`)}
                        className="p-1 text-mut hover:text-fg hover:bg-line/30 rounded-sm transition-colors"
                        title="Download Receipt"
                      >
                        <Download size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
};
