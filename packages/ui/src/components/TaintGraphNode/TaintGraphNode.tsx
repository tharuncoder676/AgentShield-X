import React from "react";
import { Shield, ShieldAlert, ArrowDown, Database, Mail, Globe, Terminal } from "lucide-react";
import { cn } from "../../utils/cn";

export type NodeType = "source" | "context" | "agent_step" | "sink";
export type NodeTrust = "system" | "user" | "tool" | "untrusted";

export interface TaintGraphNodeProps {
  id: string;
  type: NodeType;
  label: string;
  sublabel?: string;
  trust?: NodeTrust;
  isTainted?: boolean;
  taintOrigins?: string[];
  className?: string;
  onClick?: () => void;
}

export const TaintGraphNode: React.FC<TaintGraphNodeProps> = ({
  id,
  type,
  label,
  sublabel,
  trust = "untrusted",
  isTainted = false,
  taintOrigins = [],
  className,
  onClick,
}) => {
  const getIcon = () => {
    switch (type) {
      case "source":
        return <Globe size={14} className="text-warn" />;
      case "context":
        return <Database size={14} className="text-mut" />;
      case "agent_step":
        return <Terminal size={14} className="text-fg" />;
      case "sink":
        return isTainted ? (
          <ShieldAlert size={14} className="text-bad" />
        ) : (
          <Mail size={14} className="text-ok" />
        );
    }
  };

  const borderClass = isTainted
    ? "border-bad/60 bg-bad/10 shadow-glow-bad"
    : trust === "untrusted"
    ? "border-warn/40 bg-warn/5"
    : "border-line bg-panel";

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        "rounded-sm border p-3 min-w-[180px] max-w-[240px] text-xs font-mono transition-all",
        borderClass,
        onClick && "cursor-pointer hover:border-mut/80",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          {getIcon()}
          <span className="font-chakra uppercase font-semibold text-[11px] text-fg">
            {type.replace("_", " ")}
          </span>
        </div>

        <span
          className={cn(
            "text-[9px] px-1 py-0.2 rounded-sm font-chakra uppercase",
            isTainted
              ? "bg-bad/20 text-bad font-bold"
              : trust === "untrusted"
              ? "bg-warn/20 text-warn"
              : "bg-line/40 text-mut"
          )}
        >
          {isTainted ? "TAINTED" : trust}
        </span>
      </div>

      <div className="font-chakra font-medium text-fg text-sm truncate mb-0.5" title={label}>
        {label}
      </div>

      {sublabel && (
        <div className="text-[11px] text-mut truncate font-mono" title={sublabel}>
          {sublabel}
        </div>
      )}

      {isTainted && taintOrigins.length > 0 && (
        <div className="mt-2 pt-1.5 border-t border-bad/30 text-[10px] text-bad flex items-center gap-1">
          <ShieldAlert size={11} className="shrink-0" />
          <span className="truncate">Taint: {taintOrigins.join(", ")}</span>
        </div>
      )}
    </div>
  );
};
