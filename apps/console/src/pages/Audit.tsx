import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Search,
  CheckCircle2,
  Lock,
  Link as LinkIcon,
  Copy,
  Check,
  AlertTriangle,
  FileCheck2,
} from "lucide-react";
import {
  Panel,
  VerdictBadge,
  EmptyState,
  Drawer,
  cn,
} from "@agentshield/ui";
import { useAuth } from "../context/AuthContext";
import {
  AuditRecord,
  VerifyAuditLogResponse,
} from "@agentshield/api-client";

export const Audit: React.FC = () => {
  const { activeProject, client } = useAuth();

  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [verification, setVerification] = useState<VerifyAuditLogResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Inspect drawer
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [recordsData, verifyData] = await Promise.all([
        client.listAuditRecords(activeProject?.id, 100),
        client.verifyAuditLog(activeProject?.id),
      ]);
      setRecords(recordsData);
      setVerification(verifyData);
    } catch (err: any) {
      console.error("Failed to load audit records:", err);
      setError(err?.message || "Failed to load audit log");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProject]);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await client.verifyAuditLog(activeProject?.id);
      setVerification(res);
    } catch (err: any) {
      console.error("Verification failed:", err);
      alert(`Verification failed: ${err?.message || "Unknown error"}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredRecords = records.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.id.toLowerCase().includes(q) ||
      r.event_id.toLowerCase().includes(q) ||
      r.decision_id.toLowerCase().includes(q) ||
      r.hash.toLowerCase().includes(q) ||
      r.prev_hash.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-chakra uppercase font-bold text-xs tracking-widest text-ok">
              Non-Repudiation
            </span>
            <span className="text-line">&bull;</span>
            <span className="text-xs text-mut font-mono">SHA-256 Hash Chaining</span>
          </div>
          <h1 className="text-2xl font-chakra font-bold text-fg uppercase tracking-wider mt-1">
            Cryptographic Audit Log
          </h1>
          <p className="text-xs text-mut mt-0.5">
            Immutable, append-only Merkle-linked audit records verifying every tool-call decision against tampering.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-line bg-panel text-xs text-mut hover:text-fg hover:border-mut transition-colors"
            title="Refresh audit records"
          >
            <RefreshCw size={13} className={cn(isLoading && "animate-spin")} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-ok text-bg font-chakra font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            <FileCheck2 size={14} className={cn(isVerifying && "animate-spin")} />
            <span>{isVerifying ? "Verifying Chain..." : "Verify Hash Chain"}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Panel className="p-3">
          <div className="text-[11px] font-chakra uppercase text-mut tracking-wider">
            Total Blocks
          </div>
          <div className="text-xl font-chakra font-bold text-fg mt-1">
            {records.length}
          </div>
        </Panel>

        <Panel className="p-3">
          <div className="text-[11px] font-chakra uppercase text-mut tracking-wider">
            Chain Integrity
          </div>
          <div className="text-xl font-chakra font-bold text-ok mt-1 flex items-center gap-2">
            {verification?.valid ? "VERIFIED" : "UNVERIFIED"}
            {verification?.valid && (
              <span className="inline-block w-2 h-2 rounded-full bg-ok animate-pulse" />
            )}
          </div>
        </Panel>

        <Panel className="p-3">
          <div className="text-[11px] font-chakra uppercase text-mut tracking-wider">
            Genesis Anchor
          </div>
          <div className="text-xs font-mono text-mut mt-1.5 truncate" title={verification?.genesis_hash}>
            {verification?.genesis_hash ? `${verification.genesis_hash.slice(0, 16)}...` : "GENESIS_BLOCK"}
          </div>
        </Panel>

        <Panel className="p-3">
          <div className="text-[11px] font-chakra uppercase text-mut tracking-wider">
            Current Head Hash
          </div>
          <div className="text-xs font-mono text-ok mt-1.5 truncate" title={verification?.head_hash}>
            {verification?.head_hash ? `${verification.head_hash.slice(0, 16)}...` : "—"}
          </div>
        </Panel>
      </div>

      {/* Cryptographic Verification Banner */}
      {verification && (
        <div
          className={cn(
            "p-3 rounded-sm border text-xs flex items-center justify-between",
            verification.valid
              ? "bg-ok/10 border-ok/30 text-ok"
              : "bg-bad/10 border-bad/30 text-bad"
          )}
        >
          <div className="flex items-center gap-2">
            {verification.valid ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span className="font-chakra uppercase font-bold text-xs tracking-wider">
              {verification.valid
                ? `Cryptographic Chain Integrity Confirmed: All ${verification.unbroken_count} records cryptographically validated.`
                : `Tampering Detected! Hash mismatch at sequence #${verification.broken_at_sequence}.`}
            </span>
          </div>

          <div className="text-[10px] font-mono text-mut">
            Validated at {new Date(verification.verified_at).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-panel border border-line p-2 rounded-sm">
        <div className="relative flex-1 max-w-md">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mut"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by event, decision ID, or hash..."
            className="w-full bg-bg border border-line rounded-sm pl-8 pr-3 py-1.5 text-xs text-fg placeholder:text-mut/50 focus:outline-none focus:border-ok/60 font-mono"
          />
        </div>

        <div className="text-xs font-mono text-mut">
          Showing {filteredRecords.length} of {records.length} blocks
        </div>
      </div>

      {/* Audit Log Table */}
      <Panel>
        {isLoading && records.length === 0 ? (
          <div className="py-12 text-center text-xs text-mut font-chakra uppercase tracking-wider animate-pulse">
            Loading cryptographic audit log...
          </div>
        ) : error ? (
          <div className="p-6 text-center space-y-2">
            <div className="text-xs text-bad font-chakra uppercase tracking-wider">
              {error}
            </div>
            <button
              onClick={loadData}
              className="text-xs text-ok hover:underline uppercase font-chakra"
            >
              Retry
            </button>
          </div>
        ) : filteredRecords.length === 0 ? (
          <EmptyState
            icon={<Lock size={32} className="text-mut" />}
            title="Audit Chain Empty"
            description="Interception decisions will automatically be committed to the append-only SHA-256 chain."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-line bg-bg/40 text-[10px] font-chakra uppercase text-mut tracking-wider">
                  <th className="py-2.5 px-4 font-semibold">Seq</th>
                  <th className="py-2.5 px-4 font-semibold">Action</th>
                  <th className="py-2.5 px-4 font-semibold">Event ID & Decision ID</th>
                  <th className="py-2.5 px-4 font-semibold">SHA-256 Block Hash</th>
                  <th className="py-2.5 px-4 font-semibold">Prev Hash Link</th>
                  <th className="py-2.5 px-4 font-semibold">Committed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {filteredRecords.map((rec) => (
                  <tr
                    key={rec.id}
                    onClick={() => setSelectedRecord(rec)}
                    className="hover:bg-line/10 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 font-bold text-fg">
                      #{rec.sequence}
                    </td>

                    <td className="py-3 px-4">
                      <VerdictBadge action={rec.action} size="sm" />
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-fg font-semibold group-hover:text-ok transition-colors">
                        {rec.event_id}
                      </div>
                      <div className="text-[10px] text-mut mt-0.5">
                        {rec.decision_id}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-ok font-mono text-[11px]">
                          {rec.hash.slice(0, 16)}...{rec.hash.slice(-8)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(rec.hash);
                          }}
                          className="text-mut hover:text-fg p-0.5"
                          title="Copy hash"
                        >
                          {copiedHash === rec.hash ? (
                            <Check size={11} className="text-ok" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-mut text-[11px]">
                      {rec.prev_hash.startsWith("GENESIS") ? (
                        <span className="text-purple font-semibold">GENESIS</span>
                      ) : (
                        `${rec.prev_hash.slice(0, 12)}...`
                      )}
                    </td>

                    <td className="py-3 px-4 text-[11px] text-mut font-sans">
                      {new Date(rec.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Block Inspector Drawer */}
      <Drawer
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title={`Audit Block #${selectedRecord?.sequence}`}
        size="md"
      >
        {selectedRecord && (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3 bg-panel border border-line rounded-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-chakra uppercase text-mut text-[11px] font-semibold">
                  Block Sequence
                </span>
                <span className="font-bold text-fg">#{selectedRecord.sequence}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-chakra uppercase text-mut text-[11px] font-semibold">
                  Verdict Action
                </span>
                <VerdictBadge action={selectedRecord.action} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-chakra uppercase text-mut text-[11px] font-semibold">
                  Tenant / Project
                </span>
                <span className="text-fg truncate max-w-[200px]">{selectedRecord.project_id}</span>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-chakra uppercase text-mut font-semibold mb-1">
                Current SHA-256 Hash
              </div>
              <div className="p-2 bg-bg border border-line rounded-sm text-ok break-all">
                {selectedRecord.hash}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-chakra uppercase text-mut font-semibold mb-1">
                Previous Block Hash Link
              </div>
              <div className="p-2 bg-bg border border-line rounded-sm text-mut break-all">
                {selectedRecord.prev_hash}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-chakra uppercase text-mut font-semibold mb-1">
                Canonical Hashed Payload
              </div>
              <pre className="p-2.5 bg-bg border border-line rounded-sm text-fg overflow-x-auto text-[11px]">
                {JSON.stringify(
                  {
                    sequence: selectedRecord.sequence,
                    tenant_id: selectedRecord.tenant_id,
                    event_id: selectedRecord.event_id,
                    decision_id: selectedRecord.decision_id,
                    action: selectedRecord.action,
                    timestamp: selectedRecord.timestamp,
                    prev_hash: selectedRecord.prev_hash,
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="pt-3 border-t border-line flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-3 py-1.5 bg-ok text-bg font-chakra font-bold text-xs uppercase tracking-wider rounded-sm"
              >
                Close Inspector
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
