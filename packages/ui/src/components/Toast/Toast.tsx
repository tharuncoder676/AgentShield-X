import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "../../utils/cn";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  remediation?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss, className }) => {
  const config = {
    success: {
      icon: <CheckCircle2 size={16} className="text-ok shrink-0 mt-0.5" />,
      border: "border-ok/40 bg-panel",
      titleColor: "text-ok",
    },
    error: {
      icon: <XCircle size={16} className="text-bad shrink-0 mt-0.5" />,
      border: "border-bad/50 bg-panel",
      titleColor: "text-bad",
    },
    warning: {
      icon: <AlertTriangle size={16} className="text-warn shrink-0 mt-0.5" />,
      border: "border-warn/40 bg-panel",
      titleColor: "text-warn",
    },
    info: {
      icon: <Info size={16} className="text-mut shrink-0 mt-0.5" />,
      border: "border-line bg-panel",
      titleColor: "text-fg",
    },
  }[toast.type];

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 p-4 rounded-sm border shadow-lg max-w-md w-full font-sans transition-all animate-in slide-in-from-top-2 duration-150",
        config.border,
        className
      )}
    >
      {config.icon}

      <div className="flex-1 min-w-0">
        <h4 className={cn("font-chakra text-sm font-semibold tracking-wide", config.titleColor)}>
          {toast.title}
        </h4>
        {toast.message && (
          <p className="text-xs text-fg/80 mt-1 leading-relaxed">
            {toast.message}
          </p>
        )}
        {toast.remediation && (
          <p className="text-xs text-mut font-mono mt-1 bg-bg/50 p-1.5 rounded-sm border border-line/40">
            Fix: {toast.remediation}
          </p>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="mt-2 text-xs font-chakra font-medium text-ok hover:underline uppercase tracking-wider"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="text-mut hover:text-fg p-1 rounded-sm transition-colors"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  className?: string;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  className,
}) => {
  return (
    <div
      aria-live="polite"
      className={cn(
        "fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-auto",
        className
      )}
    >
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
