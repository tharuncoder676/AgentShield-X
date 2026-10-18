import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Shield, AlertTriangle, FileText, Lock } from "lucide-react";

export const Legal: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialDoc = searchParams.get("doc") || "privacy";

  const [activeDoc, setActiveDoc] = useState<string>(initialDoc);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 font-sans">
      {/* Notice Banner */}
      <div className="p-4 bg-warn/10 border border-warn/40 rounded-sm text-xs text-warn font-chakra flex items-center gap-2">
        <AlertTriangle size={16} />
        <span>
          <strong>LEGAL DRAFT NOTICE:</strong> The documents on this page are draft templates and
          require formal corporate legal review prior to production commercial launch.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Navigation Sidebar (3 cols) */}
        <div className="md:col-span-3 space-y-2 font-chakra">
          <span className="text-[10px] uppercase font-bold text-mut">Legal Documentation</span>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveDoc("privacy")}
              className={`w-full text-left px-3 py-2 text-xs font-semibold uppercase rounded-sm transition-colors ${
                activeDoc === "privacy" ? "bg-ok text-bg font-bold" : "text-mut hover:text-fg hover:bg-panel"
              }`}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setActiveDoc("terms")}
              className={`w-full text-left px-3 py-2 text-xs font-semibold uppercase rounded-sm transition-colors ${
                activeDoc === "terms" ? "bg-ok text-bg font-bold" : "text-mut hover:text-fg hover:bg-panel"
              }`}
            >
              Terms of Service
            </button>
            <button
              onClick={() => setActiveDoc("security")}
              className={`w-full text-left px-3 py-2 text-xs font-semibold uppercase rounded-sm transition-colors ${
                activeDoc === "security" ? "bg-ok text-bg font-bold" : "text-mut hover:text-fg hover:bg-panel"
              }`}
            >
              Security Disclosure
            </button>
          </nav>
        </div>

        {/* Content Body (9 cols) */}
        <div className="md:col-span-9 bg-panel border border-line rounded-sm p-6 sm:p-8 space-y-6 text-xs text-mut leading-relaxed">
          {activeDoc === "privacy" && (
            <div className="space-y-4">
              <h1 className="font-chakra text-2xl font-bold uppercase text-fg">
                Privacy Policy (Draft Template)
              </h1>
              <p>
                AgentShield-X is engineered with privacy-by-design. We provide three selectable
                project privacy modes:
              </p>
              <ul className="list-disc list-inside space-y-1 text-fg">
                <li>
                  <strong>Full Mode:</strong> Stores tool arguments and context segments in your
                  private tenant partition for deep forensic audit.
                </li>
                <li>
                  <strong>Hashed Mode:</strong> Stores only SHA-256 hashes of text payloads and
                  computed mathematical features. Zero raw text leaves your execution environment.
                </li>
                <li>
                  <strong>Local Mode:</strong> The entire data plane and decision pipeline run
                  within your private VPC. Zero telemetry or metadata leaves your network boundary.
                </li>
              </ul>
              <h2 className="font-chakra font-bold text-sm uppercase text-fg pt-3">
                Data Rights & Deletion
              </h2>
              <p>
                Organizations maintain absolute ownership over their data. In compliance with GDPR
                and CCPA, our control API provides automated cryptographic purge endpoints that
                permanently erase all tenant event records upon request.
              </p>
            </div>
          )}

          {activeDoc === "terms" && (
            <div className="space-y-4">
              <h1 className="font-chakra text-2xl font-bold uppercase text-fg">
                Terms of Service (Draft Template)
              </h1>
              <p>
                AgentShield-X provides defensive monitoring and automated enforcement for AI agent
                architectures. By accessing our services or deploying our SDKs, you agree to these
                terms.
              </p>
              <h2 className="font-chakra font-bold text-sm uppercase text-fg pt-3">
                Non-Offensive Tooling Agreement
              </h2>
              <p>
                AgentShield-X must strictly be used for defensive security, red-team benchmarking of
                authorized systems, and production boundary protection. Reverse engineering,
                weaponization, or unconsented exploitation testing against third-party systems is
                strictly prohibited.
              </p>
            </div>
          )}

          {activeDoc === "security" && (
            <div className="space-y-4">
              <h1 className="font-chakra text-2xl font-bold uppercase text-fg">
                Vulnerability Disclosure Policy
              </h1>
              <p>
                We welcome responsible security research into AgentShield-X and its detector
                subsystems. If you discover a bypass, novel jailbreak technique, or implementation
                flaw, please report it to our security response team:
              </p>
              <pre className="p-3 bg-bg border border-line rounded-sm font-mono text-xs text-ok">
                security@agentshield-x.dev
              </pre>
              <p>
                We commit to acknowledging reports within 24 hours and providing an honest,
                reproducible assessment and attribution in our release notes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
