import React, { useState, useEffect } from "react";
import {
  Swords,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Zap,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Award,
  Terminal,
  Activity,
  Layers,
  Sparkles,
  Lock,
  Target,
  Skull,
  Crosshair,
} from "lucide-react";
import { Panel, cn } from "@agentshield/ui";

interface AdversarialPersona {
  persona_id: string;
  name: string;
  difficulty: string;
  attack_class: string;
  mitre_technique_id: string;
  target_tool: string;
  payload: string;
  evasion_technique: string;
  description: string;
}

interface ScenarioOutcome {
  scenario_id: string;
  persona_name: string;
  difficulty: string;
  attack_class: string;
  target_tool: string;
  blocked: boolean;
  defense_layer: string;
  latency_ms: number;
  confidence_score: number;
  mitre_technique_id: string;
  reason: string;
}

interface WarGameScorecard {
  campaign_id: string;
  timestamp: number;
  total_scenarios: number;
  scenarios_blocked: number;
  scenarios_bypassed: number;
  defense_score_pct: number;
  defense_grade: string;
  average_latency_ms: number;
  mitre_coverage_pct: number;
  outcomes: ScenarioOutcome[];
}

export const SimLab: React.FC = () => {
  const [personas, setPersonas] = useState<AdversarialPersona[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [activeScorecard, setActiveScorecard] = useState<WarGameScorecard | null>(null);
  const [isRunningWarGame, setIsRunningWarGame] = useState<boolean>(false);
  const [loadingPersonas, setLoadingPersonas] = useState<boolean>(true);

  // Fetch personas on mount
  useEffect(() => {
    fetch("/v1/sim-lab/personas")
      .then((res) => res.json())
      .then((data) => {
        setPersonas(data);
      })
      .catch((err) => console.warn("Failed to load sim-lab personas:", err))
      .finally(() => setLoadingPersonas(false));

    // Run baseline initial war game
    handleRunWarGame("ALL");
  }, []);

  const handleRunWarGame = async (difficulty?: string) => {
    const diff = difficulty || selectedDifficulty;
    setIsRunningWarGame(true);
    try {
      const res = await fetch("/v1/sim-lab/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty_filter: diff,
          max_scenarios: 20,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveScorecard(data);
      }
    } catch (e) {
      console.error("War game execution failed:", e);
    } finally {
      setIsRunningWarGame(false);
    }
  };

  const filteredPersonas =
    selectedDifficulty === "ALL"
      ? personas
      : personas.filter((p) => p.difficulty === selectedDifficulty);

  return (
    <div className="space-y-6">
      {/* Top Header - AgentShield-X Style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#120a24]/80 border border-purple-500/20 backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.12)]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 text-[10px] font-chakra font-bold rounded bg-purple-950/80 text-purple-300 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
              FEATURE 4: RED-TEAM WAR GAME ARENA
            </span>
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
              SYNTHETIC ADVERSARIAL SIMULATION
            </span>
            <span className="text-purple-400/50">&bull;</span>
            <span className="text-xs text-purple-300/80 font-mono">20+ Adversarial AI Personas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-chakra font-bold uppercase tracking-wider bg-gradient-to-r from-white via-purple-100 to-purple-400 bg-clip-text text-transparent flex items-center gap-2.5">
            <Swords className="text-purple-400" size={26} />
            Adversarial Agent Simulation Lab
          </h1>
          <p className="text-xs text-purple-200/70 font-chakra mt-1 max-w-2xl">
            Proactive red-team training playground. Launch autonomous adversarial agent personas across 4 difficulty tiers to stress-test and certify your AgentShield-X defense mesh.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleRunWarGame(selectedDifficulty)}
            disabled={isRunningWarGame}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 via-purple-500 to-violet-600 hover:from-purple-500 hover:to-fuchsia-600 text-white font-chakra font-bold text-xs uppercase tracking-wider rounded-lg shadow-[0_0_20px_rgba(168,85,247,0.45)] border border-purple-400/40 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <Zap size={14} className={cn(isRunningWarGame && "animate-bounce")} />
            {isRunningWarGame ? "Executing War Game..." : "Launch War Game"}
          </button>
        </div>
      </div>

      {/* Difficulty Tier Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {["ALL", "Script Kiddie", "Red-Team Operator", "Nation-State APT", "Zero-Day AI Swarm"].map(
          (diff) => {
            const isSel = selectedDifficulty === diff;
            return (
              <button
                key={diff}
                onClick={() => {
                  setSelectedDifficulty(diff);
                  handleRunWarGame(diff);
                }}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-chakra font-bold uppercase tracking-wider transition-all border flex items-center gap-2 backdrop-blur-xl",
                  isSel
                    ? "bg-purple-950/80 border-purple-400 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                    : "bg-[#120a24]/60 border-purple-500/20 text-purple-300/60 hover:text-white hover:border-purple-400/40"
                )}
              >
                <span>{diff === "ALL" ? "All Difficulty Tiers" : diff}</span>
                <span className="text-[10px] font-mono opacity-60">
                  ({diff === "ALL" ? personas.length : personas.filter((p) => p.difficulty === diff).length})
                </span>
              </button>
            );
          }
        )}
      </div>

      {/* Certified Defense Scorecard (Bento Grid) */}
      {activeScorecard && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-purple-500/20 bg-[#120a24]/70 backdrop-blur-xl hover:border-purple-400/40 transition-all shadow-[0_0_20px_rgba(168,85,247,0.08)]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-purple-300/80 uppercase font-chakra tracking-wider">Defense Score</span>
              <ShieldCheck className="text-purple-400" size={16} />
            </div>
            <div className="mt-2 text-2xl font-chakra font-bold text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]">
              {activeScorecard.defense_score_pct.toFixed(1)}%
            </div>
            <div className="mt-1 text-[11px] text-purple-300/70">
              Grade: <strong className="text-white">{activeScorecard.defense_grade}</strong>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-purple-500/20 bg-[#120a24]/70 backdrop-blur-xl hover:border-purple-400/40 transition-all shadow-[0_0_20px_rgba(168,85,247,0.08)]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-purple-300/80 uppercase font-chakra tracking-wider">Attacks Contained</span>
              <Award className="text-purple-400" size={16} />
            </div>
            <div className="mt-2 text-2xl font-chakra font-bold text-white">
              {activeScorecard.scenarios_blocked} / {activeScorecard.total_scenarios}
            </div>
            <div className="mt-1 text-[11px] text-purple-300/70">
              {activeScorecard.scenarios_bypassed === 0
                ? "Zero breaches detected"
                : `${activeScorecard.scenarios_bypassed} partial evasion scenario`}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-purple-500/20 bg-[#120a24]/70 backdrop-blur-xl hover:border-purple-400/40 transition-all shadow-[0_0_20px_rgba(168,85,247,0.08)]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-purple-300/80 uppercase font-chakra tracking-wider">Average Deflection Speed</span>
              <Zap className="text-purple-400" size={16} />
            </div>
            <div className="mt-2 text-2xl font-chakra font-bold text-purple-300 drop-shadow-[0_0_10px_rgba(192,132,252,0.4)]">
              {activeScorecard.average_latency_ms} ms
            </div>
            <div className="mt-1 text-[11px] text-purple-300/70">
              Sub-5ms deterministic SLA
            </div>
          </div>

          <div className="p-4 rounded-xl border border-purple-500/20 bg-[#120a24]/70 backdrop-blur-xl hover:border-purple-400/40 transition-all shadow-[0_0_20px_rgba(168,85,247,0.08)]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-purple-300/80 uppercase font-chakra tracking-wider">MITRE AI Matrix Coverage</span>
              <Target className="text-purple-400" size={16} />
            </div>
            <div className="mt-2 text-2xl font-chakra font-bold text-fuchsia-400 drop-shadow-[0_0_10px_rgba(232,121,249,0.4)]">
              {activeScorecard.mitre_coverage_pct}%
            </div>
            <div className="mt-1 text-[11px] text-purple-300/70">
              Full coverage across 8 tactics
            </div>
          </div>
        </div>
      )}

      {/* Live Battle Arena (War Game Scenario Outcomes) */}
      {activeScorecard && (
        <div className="p-6 rounded-2xl border border-purple-500/25 bg-[#120a24]/85 backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.12)] space-y-4">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
            <h2 className="text-base font-chakra font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Crosshair className="text-purple-400" size={16} />
              War Game Battle Arena Outcomes ({activeScorecard.outcomes.length})
            </h2>
            <span className="text-xs text-purple-300/80 font-mono">
              Campaign: <strong className="text-white">{activeScorecard.campaign_id}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-purple-500/20 text-purple-300/70 uppercase text-[11px]">
                  <th className="pb-2.5">Scenario</th>
                  <th className="pb-2.5">Attacker Persona</th>
                  <th className="pb-2.5">Difficulty</th>
                  <th className="pb-2.5">Attack Class</th>
                  <th className="pb-2.5">Target Sink</th>
                  <th className="pb-2.5">Defense Layer</th>
                  <th className="pb-2.5">Latency</th>
                  <th className="pb-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/10">
                {activeScorecard.outcomes.map((o) => (
                  <tr key={o.scenario_id} className="hover:bg-purple-950/20 transition-colors">
                    <td className="py-3 text-purple-300 font-bold">{o.scenario_id}</td>
                    <td className="py-3 text-white font-bold">{o.persona_name}</td>
                    <td className="py-3">
                      <span className="text-[10px] px-2 py-0.5 rounded border border-purple-500/30 bg-purple-950/60 text-purple-300">
                        {o.difficulty}
                      </span>
                    </td>
                    <td className="py-3 text-purple-200/90">{o.attack_class}</td>
                    <td className="py-3 text-purple-400 font-bold">{o.target_tool}</td>
                    <td className="py-3 text-purple-300">{o.defense_layer}</td>
                    <td className="py-3 text-white font-bold">{o.latency_ms} ms</td>
                    <td className="py-3">
                      {o.blocked ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center gap-1 w-fit">
                          <CheckCircle2 size={12} />
                          DEFLECTED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-950/60 border border-rose-500/40 text-rose-300 flex items-center gap-1 w-fit">
                          <AlertTriangle size={12} />
                          BYPASS
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adversarial Personas Registry Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-chakra font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Skull className="text-purple-400" size={16} />
            Pre-Built Adversarial Personas Directory ({filteredPersonas.length})
          </h2>
          <span className="text-xs text-purple-300/70 font-mono">MITRE ATT&CK for AI Agents Mapped</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPersonas.map((p) => (
            <div
              key={p.persona_id}
              className="p-5 rounded-xl border border-purple-500/20 bg-[#120a24]/75 backdrop-blur-xl flex flex-col justify-between space-y-3 hover:border-purple-400/50 transition-all shadow-[0_0_20px_rgba(168,85,247,0.06)]"
            >
              <div>
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-2.5 mb-2.5">
                  <div className="font-chakra font-bold text-sm text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span>{p.name}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-purple-500/30 bg-purple-950/70 text-purple-300">
                    {p.difficulty}
                  </span>
                </div>

                <p className="text-xs text-purple-200/70 leading-relaxed font-sans mb-3">
                  {p.description}
                </p>

                <div className="space-y-1.5 font-mono text-[11px] text-purple-300/80">
                  <div>
                    <span className="opacity-60">Attack Class: </span>
                    <strong className="text-purple-200">{p.attack_class}</strong>
                  </div>
                  <div>
                    <span className="opacity-60">Target Tool: </span>
                    <strong className="text-purple-400">{p.target_tool}</strong>
                  </div>
                  <div>
                    <span className="opacity-60">MITRE ID: </span>
                    <strong className="text-rose-400">{p.mitre_technique_id}</strong>
                  </div>
                  <div>
                    <span className="opacity-60">Evasion: </span>
                    <span className="text-purple-300">{p.evasion_technique}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-purple-500/10">
                <div className="text-[10px] font-mono text-purple-400/70 uppercase mb-1">Payload Spec:</div>
                <div className="p-2 rounded-lg bg-[#07030e] border border-purple-500/30 font-mono text-[10px] text-purple-300/90 truncate">
                  {p.payload}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

