import React from "react";
import { AlertOctagon, RotateCw } from "lucide-react";
import { cn } from "../../utils/cn";

export interface ErrorStateProps {
  title?: string;
  error: string;
  remediation?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Service Interrupted",
  error,
  remediation,
  onRetry,
  className,
}) => {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center border border-bad/40 rounded-sm bg-bad/5 font-sans",
        className
      )}
    >
      <div className="w-12 h-12 rounded-none border border-bad/50 flex items-center justify-center bg-bg text-bad mb-4">
        <AlertOctagon size={24} />
      </div>

      <h3 className="font-chakra text-base font-semibold tracking-wide text-bad uppercase mb-1">
        {title}
      </h3>

      <p className="text-xs text-fg/90 max-w-md font-mono bg-bg/60 p-2 rounded-sm border border-bad/30 my-2 break-all">
        {error}
      </p>

      {remediation && (
        <p className="text-xs text-mut max-w-sm mb-4 leading-relaxed">
          How to fix: {remediation}
        </p>
      )}

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-line bg-panel hover:bg-line/20 text-fg font-chakra font-medium text-xs tracking-wider uppercase transition-colors"
        >
          <RotateCw size={13} />
          <span>Retry connection</span>
        </button>
      )}
    </div>
  );
};
