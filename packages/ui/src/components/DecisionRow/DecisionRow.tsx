import React from "react";
import { cn } from "../../utils/cn";
import { VerdictBadge, ShieldActionType } from "../VerdictBadge/VerdictBadge";
import { RiskMeter } from "../RiskMeter/RiskMeter";

export interface DecisionReason {
  code: string;
  evidence?: string;
  detector?: string;
}

export interface DecisionRowProps {
  id: string;
  timestamp: string;
  agentId: string;
  sessionId: string;
  step?: number;
  toolName: string;
  argumentsSummary?: string;
  action: ShieldActionType | string;
  risk: number;
  reasons?: DecisionReason[];
  latencyMs?: number;
  degraded?: boolean;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

export const DecisionRow: React.FC<DecisionRowProps> = ({
  id,
  timestamp,
  agentId,
  sessionId,
  step = 0,
  toolName,
  argumentsSummary,
  action,
  risk,
  reasons = [],
  latencyMs,
  degraded = false,
  onClick,
  selected = false,
  className,
}) => {
  const isBlocked = action.toLowerCase() === "block" || action.toLowerCase() === "kill_session";

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 border-b border-line text-sm font-mono transition-colors",
        "hover:bg-line/20 cursor-pointer focus-visible:bg-line/30 focus-visible:outline-none",
        selected && "bg-line/30 border-l-2 border-l-ok",
        isBlocked && "bg-bad/5 hover:bg-bad/10",
        className
      )}
    >
      {/* Left: Verdict, Tool, & Context */}
      <div className="flex items-start md:items-center gap-3 min-w-0 flex-1">
        <VerdictBadge action={action} size="sm" />

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-chakra font-semibold text-fg tracking-wide">
              {toolName}
            </span>
            <span className="text-xs text-mut font-sans">
              step #{step}
            </span>
            <span className="text-xs text-mut/80 hidden sm:inline" title={sessionId}>
              sess:{sessionId.slice(0, 8)}
            </span>
            {degraded && (
              <span className="text-[10px] bg-warn/10 text-warn border border-warn/30 px-1 py-0.2 rounded-sm font-chakra">
                DEGRADED
              </span>
            )}
          </div>

          {argumentsSummary && (
            <div className="text-xs text-mut/90 truncate max-w-md mt-0.5">
              <span className="text-line mr-1">args:</span>
              <span className="text-fg/80">{argumentsSummary}</span>
            </div>
          )}
        </div>
      </div>

      {/* Middle: Reasons & Detector Tags */}
      {reasons.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
          {reasons.slice(0, 2).map((r, i) => (
            <span
              key={i}
              className="text-[11px] px-1.5 py-0.5 rounded-sm bg-panel border border-line text-mut truncate max-w-[140px]"
              title={r.evidence || r.code}
            >
              {r.code}
            </span>
          ))}
          {reasons.length > 2 && (
            <span className="text-[10px] text-mut px-1">
              +{reasons.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Right: Risk Bar, Latency, & Timestamp */}
      <div className="flex items-center justify-between md:justify-end gap-4 min-w-[200px]">
        <div className="w-24">
          <RiskMeter score={risk} size="sm" showNumeric={true} />
        </div>

        <div className="text-right flex flex-col items-end">
          {latencyMs !== undefined && (
            <span className="text-xs text-mut font-mono tabular-nums">
              {latencyMs.toFixed(1)}ms
            </span>
          )}
          <time className="text-[11px] text-mut/70 font-sans tabular-nums" dateTime={timestamp}>
            {timestamp.includes("T") ? timestamp.split("T")[1]?.slice(0, 8) : timestamp}
          </time>
        </div>
      </div>
    </div>
  );
};
