import React from "react";
import { cn } from "../../utils/cn";

export interface RiskMeterProps {
  score: number; // 0.0 to 1.0
  className?: string;
  showNumeric?: boolean;
  size?: "sm" | "md" | "lg";
}

export const RiskMeter: React.FC<RiskMeterProps> = ({
  score,
  className,
  showNumeric = true,
  size = "md",
}) => {
  const clampedScore = Math.max(0, Math.min(1, score));
  const percent = Math.round(clampedScore * 100);

  // Calibrated tiered color bands
  const colorClass =
    clampedScore >= 0.36
      ? "bg-bad text-bad"
      : clampedScore >= 0.16
      ? "bg-warn text-warn"
      : "bg-ok text-ok";

  const heightClass = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  }[size];

  return (
    <div
      className={cn("flex items-center gap-2 font-mono", className)}
      role="meter"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Risk Score: ${clampedScore.toFixed(2)}`}
    >
      <div className={cn("relative flex-1 bg-line/60 rounded-none overflow-hidden", heightClass)}>
        {/* Tier tick marks */}
        <div className="absolute top-0 bottom-0 left-[16%] w-[1px] bg-bg/60 z-10" title="Sanitize Threshold (0.16)" />
        <div className="absolute top-0 bottom-0 left-[28%] w-[1px] bg-bg/60 z-10" title="Escalate Threshold (0.28)" />
        <div className="absolute top-0 bottom-0 left-[36%] w-[1px] bg-bg/60 z-10" title="Block Threshold (0.36)" />
        <div className="absolute top-0 bottom-0 left-[95%] w-[1px] bg-bg/60 z-10" title="Kill Session Threshold (0.95)" />

        {/* Fill bar */}
        <div
          className={cn("h-full transition-all duration-300 ease-out", colorClass.split(" ")[0])}
          style={{ width: `${percent}%` }}
        />
      </div>

      {showNumeric && (
        <span
          className={cn(
            "text-xs font-semibold tabular-nums min-w-[2.5rem] text-right",
            colorClass.split(" ")[1]
          )}
        >
          {clampedScore.toFixed(2)}
        </span>
      )}
    </div>
  );
};
