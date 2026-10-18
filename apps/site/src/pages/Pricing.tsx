import React from "react";
import { Link } from "react-router-dom";
import { Check, Shield, Zap, Lock, CreditCard, ArrowRight } from "lucide-react";

export const Pricing: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <h1 className="font-chakra text-3xl sm:text-4xl font-bold uppercase tracking-wide text-fg">
          Predictable Pricing for Autonomous Security
        </h1>
        <p className="text-xs sm:text-sm text-mut leading-relaxed">
          Open architecture designed for production AI systems. Deploy as SaaS or self-host within
          your private VPC with zero data egress.
        </p>
        <div className="inline-block px-3 py-1 bg-panel border border-warn/40 rounded-sm text-[11px] font-chakra text-warn uppercase">
          * Note: Prices shown below are standard launch placeholders *
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Free Plan */}
        <div className="p-6 bg-panel border border-line rounded-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-chakra uppercase font-bold text-mut">
                Developer Tier
              </span>
              <h2 className="font-chakra text-2xl font-bold text-fg uppercase">Free</h2>
              <div className="pt-2 flex items-baseline gap-1">
                <span className="font-chakra text-3xl font-bold text-fg">$0</span>
                <span className="text-xs text-mut font-chakra">/ month</span>
              </div>
            </div>
            <p className="text-xs text-mut leading-relaxed">
              Essential boundary guards and deterministic prompt injection protection for early prototypes.
            </p>

            <ul className="space-y-2.5 text-xs text-fg font-sans pt-2 border-t border-line">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-ok" />
                <span>10,000 tool calls / month</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-ok" />
                <span>Deterministic Rules & Boundary Guard</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-ok" />
                <span>2 Active Honeytool Decoys</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-ok" />
                <span>7-day Cryptographic Audit Retention</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-ok" />
                <span>Community Discord Support</span>
              </li>
            </ul>
          </div>

          <a
            href="http://localhost:5173/signup"
            className="w-full py-2.5 bg-panel border border-line hover:border-ok/50 text-fg font-chakra font-bold text-xs uppercase tracking-wider rounded-sm text-center block transition-colors"
          >
            Get Started Free
          </a>
        </div>

        {/* Team Plan (Highlighted) */}
        <div className="p-6 bg-panel border border-ok rounded-sm space-y-6 flex flex-col justify-between relative shadow-xl">
          <div className="absolute -top-3 right-4 px-2 py-0.5 bg-ok text-bg font-chakra font-bold text-[10px] uppercase rounded-sm">
            Most Popular
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-chakra uppercase font-bold text-ok">
                Production Tier
              </span>
              <h2 className="font-chakra text-2xl font-bold text-fg uppercase">Team</h2>
              <div className="pt-2 flex items-baseline gap-1">
                <span className="font-chakra text-3xl font-bold text-ok">$99</span>
                <span className="text-xs text-mut font-chakra">/ month (placeholder)</span>
              </div>
            </div>
            <p className="text-xs text-mut leading-relaxed">
              Full calibrated risk stacker, custom OPA Rego policies, and Shieldwing AI copilot.
            </p>

            <ul className="space-y-2.5 text-xs text-fg font-sans pt-2 border-t border-line">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-ok" />
                <span>250,000 tool calls / month</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-ok" />
                <span>Full Calibrated ML Risk Stacker</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-ok" />
                <span>Unlimited Honeytools & Canary Traps</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-ok" />
                <span>OPA Rego Guardrails with Dry-Run</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-ok" />
                <span>Shieldwing AI Security Copilot</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-ok" />
                <span>90-day Merkle Audit Log Retention</span>
              </li>
            </ul>
          </div>

          <a
            href="http://localhost:5173/signup"
            className="w-full py-2.5 bg-ok text-bg font-chakra font-bold text-xs uppercase tracking-wider rounded-sm text-center block hover:opacity-90 transition-opacity"
          >
            Start 14-Day Free Trial
          </a>
        </div>

        {/* Enterprise Plan */}
        <div className="p-6 bg-panel border border-line rounded-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-chakra uppercase font-bold text-mut">
                Dedicated / Air-Gapped
              </span>
              <h2 className="font-chakra text-2xl font-bold text-fg uppercase">Enterprise</h2>
              <div className="pt-2 flex items-baseline gap-1">
                <span className="font-chakra text-3xl font-bold text-fg">Custom</span>
              </div>
            </div>
            <p className="text-xs text-mut leading-relaxed">
              Self-hosted Kubernetes deployment (Helm), private VPC mTLS, and custom SLA.
            </p>

            <ul className="space-y-2.5 text-xs text-fg font-sans pt-2 border-t border-line">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-ok" />
                <span>Unlimited monthly tool calls</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-ok" />
                <span>Air-Gapped & Local Privacy Modes</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-ok" />
                <span>1-Year Tamper-Evident S3 Audit Export</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-ok" />
                <span>Custom DeBERTa Fine-Tuning Pipeline</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-ok" />
                <span>99.99% Uptime SLA Guarantee</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-ok" />
                <span>Dedicated Security Architect & Slack</span>
              </li>
            </ul>
          </div>

          <a
            href="mailto:tharunkumarjee@gmail.com"
            className="w-full py-2.5 bg-panel border border-line hover:border-ok/50 text-fg font-chakra font-bold text-xs uppercase tracking-wider rounded-sm text-center block transition-colors"
          >
            Contact Security Team
          </a>
        </div>
      </div>
    </div>
  );
};
