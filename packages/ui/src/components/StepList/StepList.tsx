import React from "react";
import { Check, ShieldAlert, CircleDot } from "lucide-react";
import { cn } from "../../utils/cn";

export type StepStatus = "completed" | "active" | "pending" | "blocked";

export interface StepItem {
  id: string | number;
  title: string;
  description?: React.ReactNode;
  status: StepStatus;
  badge?: React.ReactNode;
}

export interface StepListProps {
  steps: StepItem[];
  className?: string;
  onStepClick?: (step: StepItem) => void;
}

export const StepList: React.FC<StepListProps> = ({
  steps,
  className,
  onStepClick,
}) => {
  return (
    <ol
      className={cn(
        "divide-y divide-line border border-line rounded-sm bg-panel font-sans",
        className
      )}
    >
      {steps.map((step, idx) => {
        const isClickable = !!onStepClick;

        const iconConfig = {
          completed: {
            node: <Check size={14} className="text-ok" />,
            border: "border-ok/50 bg-ok/10",
            numText: "text-ok",
          },
          active: {
            node: <CircleDot size={14} className="text-warn animate-pulse" />,
            border: "border-warn/60 bg-warn/10",
            numText: "text-warn font-bold",
          },
          blocked: {
            node: <ShieldAlert size={14} className="text-bad" />,
            border: "border-bad/60 bg-bad/10",
            numText: "text-bad font-bold",
          },
          pending: {
            node: <span className="font-mono text-xs text-mut">{idx + 1}</span>,
            border: "border-line bg-bg",
            numText: "text-mut",
          },
        }[step.status];

        return (
          <li
            key={step.id}
            onClick={() => isClickable && onStepClick(step)}
            className={cn(
              "flex items-start gap-4 p-4 transition-colors",
              isClickable && "hover:bg-line/20 cursor-pointer",
              step.status === "active" && "bg-line/10",
              step.status === "blocked" && "bg-bad/5"
            )}
          >
            {/* Step Sequence Badge */}
            <div
              className={cn(
                "flex items-center justify-center w-6 h-6 rounded-none border shrink-0 mt-0.5 font-chakra",
                iconConfig.border
              )}
              aria-hidden="true"
            >
              {iconConfig.node}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span
                  className={cn(
                    "font-chakra font-medium text-sm",
                    step.status === "active" ? "text-fg font-semibold" : "text-fg/90"
                  )}
                >
                  {step.title}
                </span>
                {step.badge}
              </div>

              {step.description && (
                <div className="text-xs text-mut mt-1 leading-relaxed">
                  {step.description}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};
