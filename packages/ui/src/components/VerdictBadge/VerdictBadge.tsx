import React from "react";
import { cn } from "../../utils/cn";

export type ShieldActionType = "allow" | "sanitize" | "escalate" | "block" | "kill_session";

export interface VerdictBadgeProps {
  action: ShieldActionType | string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showDot?: boolean;
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({
  action,
  className,
  size = "md",
  showDot = true,
}) => {
  const normAction = action.toLowerCase() as ShieldActionType;

  const config = {
    allow: {
      label: "ALLOW",
      border: "border-ok/40",
      bg: "bg-ok/10",
      text: "text-ok",
      dot: "bg-ok",
    },
    sanitize: {
      label: "SANITIZE",
      border: "border-warn/40",
      bg: "bg-warn/10",
      text: "text-warn",
      dot: "bg-warn",
    },
    escalate: {
      label: "ESCALATE",
      border: "border-warn/40",
      bg: "bg-warn/10",
      text: "text-warn",
      dot: "bg-warn animate-pulse",
    },
    block: {
      label: "BLOCK",
      border: "border-bad/40",
      bg: "bg-bad/10",
      text: "text-bad",
      dot: "bg-bad",
    },
    kill_session: {
      label: "KILL SESSION",
      border: "border-bad/60",
      bg: "bg-bad/20",
      text: "text-bad font-bold",
      dot: "bg-bad animate-ping",
    },
  }[normAction] || {
    label: action.toUpperCase(),
    border: "border-line",
    bg: "bg-panel",
    text: "text-mut",
    dot: "bg-mut",
  };

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[10px] gap-1",
    md: "px-2 py-0.5 text-xs gap-1.5",
    lg: "px-3 py-1 text-sm gap-2",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center font-chakra font-semibold tracking-wider rounded-sm border transition-colors",
        config.border,
        config.bg,
        config.text,
        sizeClasses,
        className
      )}
      role="status"
      aria-label={`Verdict: ${config.label}`}
    >
      {showDot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full inline-block", config.dot)}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </span>
  );
};
