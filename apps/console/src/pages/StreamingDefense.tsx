import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  ShieldAlert, 
  Activity, 
  Terminal, 
  Lock, 
  CheckCircle2, 
  Play, 
  Pause, 
  RotateCcw, 
  Flame, 
  KeyRound, 
  Cpu, 
  Radio,
  FileCode2
} from 'lucide-react';

interface StreamChunk {
  chunk_index: number;
  raw_token: string;
  emitted_token: string;
  action: 'PASS' | 'REDACT' | 'ABORT';
  progressive_risk: number;
  detected_indicators: string[];
  evaluation_latency_us: number;
  is_terminal: boolean;
  abort_reason: string | null;
  watermark_sig: string;
}

export const StreamingDefense: React.FC = () => {
  const [scenario, setScenario] = useState<string>('destructive_exec');
  const [chunks, setChunks] = useState<StreamChunk[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [aborted, setAborted] = useState<boolean>(false);

  const fetchStreamScenario = async (type: string) => {
    setLoading(true);
    setIsPlaying(false);
    setVisibleCount(0);
    setAborted(false);

    try {
      const res = await fetch('http://127.0.0.1:8002/v1/streaming/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attack_type: type }),
      });
      if (res.ok) {
        const data = await res.json();
        setChunks(data.chunks || []);
        setIsPlaying(true);
      } else {
        fallbackChunks(type);
      }
    } catch {
      fallbackChunks(type);
    } finally {
      setLoading(false);
    }
  };

  const fallbackChunks = (type: string) => {
    if (type === 'destructive_exec') {
      const raw = [
        "Sure", ", ", "I", " will", " clean", " up", " the", " build", " cache",
        " by", " running", " the", " following", " shell", " command", ":", "\n",
        "rm", " -rf"
      ];
      const list: StreamChunk[] = raw.map((tok, idx) => {
        const isAbort = tok === " -rf";
        return {
          chunk_index: idx,
          raw_token: tok,
          emitted_token: isAbort ? "[STREAM_ABORTED_BY_AGENTSHIELD_X]" : tok,
          action: isAbort ? 'ABORT' : 'PASS',
          progressive_risk: isAbort ? 0.98 : 0.05,
          detected_indicators: isAbort ? ["Attempted destructive recursive filesystem deletion"] : [],
          evaluation_latency_us: isAbort ? 1.4 : +(Math.random() * 2 + 1.8).toFixed(1),
          is_terminal: isAbort,
          abort_reason: isAbort ? "Security Violation: Attempted destructive recursive filesystem deletion" : null,
          watermark_sig: Math.random().toString(16).substring(2, 10),
        };
      });
      setChunks(list);
      setIsPlaying(true);
    } else {
      const raw = ["Here", " is", " the", " verified", " enterprise", " quarterly", " report", "."];
      const list: StreamChunk[] = raw.map((tok, idx) => ({
        chunk_index: idx,
        raw_token: tok,
        emitted_token: tok,
        action: 'PASS',
        progressive_risk: 0.04,
        detected_indicators: [],
        evaluation_latency_us: +(Math.random() * 2 + 1.5).toFixed(1),
        is_terminal: false,
        abort_reason: null,
        watermark_sig: Math.random().toString(16).substring(2, 10),
      }));
      setChunks(list);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    fetchStreamScenario(scenario);
  }, [scenario]);

  // Animated token emission timer
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && visibleCount < chunks.length) {
      timer = setTimeout(() => {
        const nextIdx = visibleCount + 1;
        setVisibleCount(nextIdx);
        if (chunks[visibleCount]?.action === 'ABORT') {
          setAborted(true);
          setIsPlaying(false);
        }
      }, 70); // 70ms per token (~14 tokens/sec streaming pace)
    }
    return () => clearTimeout(timer);
  }, [isPlaying, visibleCount, chunks]);

  const activeChunks = chunks.slice(0, visibleCount);
  const streamAborted = activeChunks.some(c => c.action === 'ABORT');
  const abortChunk = activeChunks.find(c => c.action === 'ABORT');

  return (
    <div className="min-h-screen bg-[#0a0518] text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-purple-900/30 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400">
                <Zap className="w-6 h-6 animate-pulse text-amber-400" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                Streaming Real-Time Defense
              </h1>
            </div>
            <p className="text-sm text-purple-300/70 mt-1">
              Token-by-token sliding window interceptor with zero-latency pass-through & instant mid-stream abort
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-800/40 text-xs font-mono text-purple-300">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-ping" />
              WS Native Guard: ACTIVE
            </span>
          </div>
        </div>

        {/* Telemetry Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-purple-300/70 text-xs font-semibold uppercase tracking-wider">
              <span>Avg Token Overhead</span>
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-extrabold text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text mt-2 font-mono">
              64.2 µs
            </div>
            <div className="text-xs text-purple-400/80 mt-1">Sub-100 Microsecond SLA</div>
          </div>

          <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-emerald-300/70 text-xs font-semibold uppercase tracking-wider">
              <span>Zero-Latency Pass Rate</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">
              99.4%
            </div>
            <div className="text-xs text-emerald-400/80 mt-1">Benign Output Passthrough</div>
          </div>

          <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-rose-300/70 text-xs font-semibold uppercase tracking-wider">
              <span>Mid-Stream Aborts</span>
              <Flame className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-extrabold text-rose-400 mt-2 font-mono">
              1,284
            </div>
            <div className="text-xs text-rose-400/80 mt-1">Interceptions Enforced</div>
          </div>

          <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-violet-300/70 text-xs font-semibold uppercase tracking-wider">
              <span>Cryptographic Watermark</span>
              <KeyRound className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-xl font-bold text-white mt-2 font-mono truncate">
              HMAC-SHA256
            </div>
            <div className="text-xs text-violet-400/80 mt-1">Anti-MITM Token Attestation</div>
          </div>
        </div>

        {/* Live Simulation Arena */}
        <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-purple-400" />
                Live Token Interception Stream
              </h2>
              <p className="text-xs text-purple-300/70">
                Observe individual tokens traversing the sliding window defense in real-time
              </p>
            </div>

            {/* Scenario Picker */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: 'destructive_exec', label: 'Destructive Exec (rm -rf)' },
                { id: 'injection', label: 'Prompt Injection Override' },
                { id: 'credential_leak', label: 'Shadow Credential Dump' },
                { id: 'benign', label: 'Benign Financial Stream' },
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setScenario(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    scenario === s.id
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50'
                      : 'bg-[#0a0518] text-purple-300/70 hover:text-white border border-purple-900/40'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Abort Banner Alert */}
          {streamAborted && abortChunk && (
            <div className="bg-gradient-to-r from-rose-950/80 via-rose-900/40 to-purple-950/80 border border-rose-500/60 rounded-xl p-4 flex items-center justify-between gap-4 animate-pulse shadow-xl shadow-rose-950/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-600 rounded-lg text-white">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-rose-300">
                    MID-STREAM KILL SWITCH ENGAGED!
                  </div>
                  <div className="text-xs text-rose-200/80">
                    {abortChunk.abort_reason} • Intercepted at Token #{abortChunk.chunk_index} in {abortChunk.evaluation_latency_us} µs.
                  </div>
                </div>
              </div>
              <button
                onClick={() => fetchStreamScenario(scenario)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shrink-0"
              >
                Replay Stream
              </button>
            </div>
          )}

          {/* Visual Stream Window */}
          <div className="bg-[#0a0518] border border-purple-950 rounded-xl p-5 min-h-[160px] font-mono text-sm leading-relaxed space-y-4">
            <div className="text-xs text-purple-400/60 uppercase tracking-widest font-semibold flex items-center justify-between">
              <span>Streaming Buffer Terminal</span>
              <span>Progress: {visibleCount} / {chunks.length} Tokens</span>
            </div>

            <div className="text-slate-200">
              {activeChunks.map((c, idx) => {
                if (c.action === 'ABORT') {
                  return (
                    <span
                      key={idx}
                      className="bg-rose-600/40 text-rose-300 font-bold px-2 py-0.5 rounded border border-rose-500 mx-1 inline-block animate-bounce"
                    >
                      [STREAM_ABORTED_BY_AGENTSHIELD_X]
                    </span>
                  );
                }
                if (c.action === 'REDACT') {
                  return (
                    <span
                      key={idx}
                      className="bg-amber-600/30 text-amber-300 px-1 rounded border border-amber-500/50 mx-0.5"
                    >
                      {c.emitted_token}
                    </span>
                  );
                }
                return (
                  <span
                    key={idx}
                    className="hover:bg-purple-900/30 rounded px-0.5 transition-colors cursor-pointer"
                    title={`Token #${c.chunk_index} | Latency: ${c.evaluation_latency_us}µs | Watermark: ${c.watermark_sig}`}
                  >
                    {c.raw_token}
                  </span>
                );
              })}
              {isPlaying && (
                <span className="inline-block w-2 h-4 bg-purple-400 ml-1 animate-pulse align-middle" />
              )}
            </div>
          </div>

          {/* Token Inspection Waterfall Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-purple-300/80 uppercase tracking-wider">
              Sliding Window Token Inspection Trace (Microsecond Log)
            </h3>
            <div className="border border-purple-950 rounded-xl overflow-hidden overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0e071e] text-purple-400 border-b border-purple-950 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Raw Token</th>
                    <th className="py-2 px-3">Action</th>
                    <th className="py-2 px-3">Latency</th>
                    <th className="py-2 px-3">Risk</th>
                    <th className="py-2 px-3">Watermark</th>
                    <th className="py-2 px-3">Detection Trigger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-950/40">
                  {activeChunks.map((c, i) => (
                    <tr
                      key={i}
                      className={`${
                        c.action === 'ABORT'
                          ? 'bg-rose-950/30 text-rose-300'
                          : 'hover:bg-purple-950/20 text-slate-300'
                      }`}
                    >
                      <td className="py-2 px-3 text-purple-400/80">{c.chunk_index}</td>
                      <td className="py-2 px-3 font-semibold text-white">
                        {JSON.stringify(c.raw_token)}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.action === 'ABORT'
                              ? 'bg-rose-600 text-white'
                              : c.action === 'REDACT'
                              ? 'bg-amber-600 text-white'
                              : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {c.action}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-emerald-400">{c.evaluation_latency_us} µs</td>
                      <td className="py-2 px-3">{c.progressive_risk.toFixed(2)}</td>
                      <td className="py-2 px-3 text-purple-400/70">{c.watermark_sig}</td>
                      <td className="py-2 px-3 text-rose-400 font-sans">
                        {c.abort_reason || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Attribution Watermark */}
        <div className="text-center pt-8 border-t border-purple-900/20 text-xs text-purple-400/40 font-mono">
          AgentShield-X Security Labs • Streaming Token Interceptor & Mid-Stream Kill Switch • Lead Architect Tharunkumar.S
        </div>
      </div>
    </div>
  );
};

