import React from "react";
import { ShieldCheck, Plus } from "lucide-react";
import { cn } from "../../utils/cn";

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center border border-dashed border-line rounded-sm bg-panel/50 font-sans",
        className
      )}
    >
      <div className="w-12 h-12 rounded-none border border-line flex items-center justify-center bg-bg text-mut mb-4">
        {icon || <ShieldCheck size={24} className="text-ok" />}
      </div>

      <h3 className="font-chakra text-base font-semibold tracking-wide text-fg mb-1">
        {title}
      </h3>

      <p className="text-xs text-mut max-w-sm mb-5 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-ok text-bg font-chakra font-semibold text-xs tracking-wider uppercase hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ok"
        >
          <Plus size={14} />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
