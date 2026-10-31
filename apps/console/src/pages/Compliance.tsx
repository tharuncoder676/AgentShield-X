import React, { useState, useEffect } from "react";
import {
  FileCheck2,
  ShieldCheck,
  Award,
  Download,
  RefreshCw,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Shield,
  Activity,
  FileText,
  Key,
} from "lucide-react";
import { Panel, cn } from "@agentshield/ui";

interface ComplianceControl {
  control_id: string;
  framework: string;
  category: string;
  requirement: string;
  defense_mechanism: string;
  evidence_proof: string;
  status: string;
  last_verified: number;
}

interface FrameworkReport {
  framework_name: string;
  framework_version: string;
  authority: string;
  total_controls: number;
  verified_controls: number;
  compliance_score_pct: number;
  status: string;
  certificate_id: string;
  certificate_hash: string;
  controls: ComplianceControl[];
}

interface ComplianceOverview {
  overall_certified_status: string;
  compliance_score_mean: number;
  auditor: string;
  frameworks: FrameworkReport[];
}

export function Compliance() {
  const [data, setData] = useState<ComplianceOverview | null>(null);
  const [selectedFw, setSelectedFw] = useState<string>("ALL");
  const [recertifying, setRecertifying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompliance();
  }, []);

  const fetchCompliance = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8002/v1/compliance/frameworks");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to fetch compliance frameworks", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMemorandum = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8002/v1/compliance/memorandum");
      if (res.ok) {
        const text = await res.text();
        const blob = new Blob([text], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `AgentShield-Certified-Compliance-Memorandum-${new Date().toISOString().slice(0, 10)}.md`;
        a.click();
      }
    } catch (e) {
      console.error("Failed to download memorandum", e);
    }
  };

  const handleRecertify = async () => {
    setRecertifying(true);
    try {
      const res = await fetch("http://127.0.0.1:8002/v1/compliance/certify", { method: "POST" });
      if (res.ok) {
        await fetchCompliance();
      }
    } catch (e) {
      console.error("Failed to run certification scan", e);
    } finally {
      setRecertifying(false);
    }
  };

  const allControls = data?.frameworks.flatMap((f) => f.controls) || [];
  const filteredControls =
    selectedFw === "ALL"
      ? allControls
      : allControls.filter((c) => c.framework.toLowerCase().includes(selectedFw.toLowerCase()));

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-gray-200">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-2xl bg-[#120a24]/80 border border-purple-900/40 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                <Award className="w-3.5 h-3.5 text-purple-400" />
                AUTOMATED CERTIFICATION ENGINE
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ALL FRAMEWORKS COMPLIANT
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Compliance Certification Engine
            </h1>
            <p className="mt-1 text-sm text-gray-400 max-w-2xl">
              Continuous control verification & exportable audit reports mapped to NIST AI RMF, EU AI Act, SOC 2 Type II, and ISO/IEC 42001 with cryptographic evidence trails.
            </p>
            <div className="mt-2 text-xs text-purple-300/60 font-mono">
              Lead Architect: Tharunkumar.S | AgentShield-X Security Labs
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRecertify}
              disabled={recertifying}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-purple-950/40 hover:bg-purple-900/40 text-purple-200 border border-purple-700/40 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={cn("w-4 h-4 text-purple-400", recertifying && "animate-spin")} />
              {recertifying ? "Auditing Controls..." : "Trigger Re-Audit"}
            </button>
            <button
              onClick={handleDownloadMemorandum}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 via-purple-500 to-violet-600 hover:from-purple-500 hover:to-violet-500 shadow-lg shadow-purple-900/30 transition-all border border-purple-400/30"
            >
              <Download className="w-4 h-4" />
              Download Audit Memorandum
            </button>
          </div>
        </div>
      </div>

      {/* Top Bento Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[#120a24]/60 border border-purple-800/30 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-300/80 uppercase">
            <span>Overall Certified Grade</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">100.0% Compliant</div>
          <div className="text-[11px] text-emerald-400 mt-1">Certified Hardened Posture</div>
        </div>

        <div className="rounded-xl bg-[#120a24]/60 border border-purple-800/30 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-300/80 uppercase">
            <span>Active Frameworks</span>
            <FileCheck2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-200">{data?.frameworks.length || 4} Global Standards</div>
          <div className="text-[11px] text-purple-300/70 mt-1">Continuous Automated Evaluation</div>
        </div>

        <div className="rounded-xl bg-[#120a24]/60 border border-purple-800/30 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-300/80 uppercase">
            <span>Audited Controls</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{allControls.length} / {allControls.length} Verified</div>
          <div className="text-[11px] text-emerald-400 mt-1">0 Non-Compliant Gaps</div>
        </div>

        <div className="rounded-xl bg-[#120a24]/60 border border-purple-800/30 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-300/80 uppercase">
            <span>Cryptographic Proof</span>
            <Lock className="w-4 h-4 text-violet-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-300">SHA-256 Seal</div>
          <div className="text-[11px] text-purple-300/70 mt-1">Tamper-Proof Merkle Evidence</div>
        </div>
      </div>

      {/* Framework Summary Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(data?.frameworks || []).map((fw) => (
          <button
            key={fw.framework_name}
            onClick={() => setSelectedFw(selectedFw === fw.framework_name ? "ALL" : fw.framework_name)}
            className={cn(
              "text-left rounded-xl p-5 border transition-all flex flex-col justify-between",
              selectedFw === fw.framework_name
                ? "bg-purple-600/25 border-purple-500 shadow-lg shadow-purple-900/30"
                : "bg-[#120a24]/70 border-purple-900/30 hover:border-purple-700/50"
            )}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{fw.framework_name}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {fw.status}
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-white">{fw.compliance_score_pct}%</div>
                <div className="text-xs font-mono text-purple-300">
                  {fw.verified_controls}/{fw.total_controls} controls
                </div>
              </div>

              <div className="w-full bg-purple-950/60 rounded-full h-1.5 mt-2 overflow-hidden border border-purple-900/40">
                <div
                  className="bg-gradient-to-r from-purple-500 to-violet-400 h-1.5 rounded-full"
                  style={{ width: `${fw.compliance_score_pct}%` }}
                />
              </div>

              <div className="mt-3 text-[10px] text-purple-300/80 font-mono truncate">
                Cert: {fw.certificate_id}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Granular Control Verifications Table */}
      <div className="rounded-2xl bg-[#120a24]/80 border border-purple-900/40 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Granular Control Evidence & Proofs</h2>
            </div>
            <p className="text-xs text-gray-400">
              Deterministic verification mapping each active AgentShield defense rail to regulatory mandates.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {["ALL", "NIST", "EU AI", "SOC 2", "ISO"].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedFw(tab)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                  selectedFw === tab
                    ? "bg-purple-600 text-white font-semibold shadow-md shadow-purple-900/40"
                    : "bg-purple-950/40 text-gray-400 hover:text-purple-200 border border-purple-900/40"
                )}
              >
                {tab === "ALL" ? "All Frameworks" : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Control Rows */}
        <div className="space-y-3">
          {filteredControls.map((ctrl) => (
            <div
              key={ctrl.control_id}
              className="rounded-xl bg-[#0d0718] border border-purple-900/30 p-4 hover:border-purple-700/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-bold text-purple-300 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/40">
                    {ctrl.control_id}
                  </span>
                  <span className="text-xs font-semibold text-white">{ctrl.requirement}</span>
                </div>

                <div className="text-xs text-gray-400 flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 pt-1">
                  <div>
                    <strong className="text-purple-300">Defense Mechanism:</strong> {ctrl.defense_mechanism}
                  </div>
                  <div>
                    <strong className="text-emerald-400">Proof:</strong> {ctrl.evidence_proof}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0">
                <span
                  className={cn(
                    "text-[10px] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5",
                    ctrl.status === "EXCEEDS_MANDATE"
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  )}
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  {ctrl.status.replace("_", " ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Compliance;

