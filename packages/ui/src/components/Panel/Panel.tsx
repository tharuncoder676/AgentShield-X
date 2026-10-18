import React from "react";
import { cn } from "../../utils/cn";

export interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "default" | "interactive" | "shield" | "critical";
  noPadding?: boolean;
}

export const Panel: React.FC<PanelProps> = ({
  children,
  className,
  title,
  subtitle,
  actions,
  footer,
  variant = "default",
  noPadding = false,
  ...props
}) => {
  const variantClasses = {
    default: "border-line bg-panel",
    interactive: "border-line bg-panel hover:border-mut/60 cursor-pointer transition-colors",
    shield: "border-ok/40 bg-panel shadow-sm",
    critical: "border-bad/40 bg-panel",
  }[variant];

  return (
    <div
      className={cn(
        "rounded-sm border text-fg transition-all duration-150",
        variantClasses,
        className
      )}
      {...props}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            {title && (
              <h3 className="font-chakra text-sm font-semibold tracking-wide uppercase text-fg">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="font-sans text-xs text-mut mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      <div className={cn(!noPadding && "p-4")}>{children}</div>

      {footer && (
        <div className="border-t border-line bg-bg/40 px-4 py-2.5 text-xs text-mut font-sans flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
};
