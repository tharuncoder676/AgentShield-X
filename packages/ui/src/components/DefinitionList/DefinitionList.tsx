import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "../../utils/cn";

export interface DefinitionItem {
  label: string;
  value: React.ReactNode;
  copyable?: boolean;
  rawCopyValue?: string;
}

export interface DefinitionListProps {
  items: DefinitionItem[];
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export const DefinitionList: React.FC<DefinitionListProps> = ({
  items,
  className,
  orientation = "horizontal",
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <dl
      className={cn(
        "divide-y divide-line border border-line rounded-sm bg-panel font-sans text-xs",
        className
      )}
    >
      {items.map((item, idx) => {
        const copyText = item.rawCopyValue || (typeof item.value === "string" ? item.value : "");

        return (
          <div
            key={idx}
            className={cn(
              "p-3 flex gap-2 transition-colors hover:bg-line/10",
              orientation === "horizontal"
                ? "flex-col sm:flex-row sm:items-center sm:justify-between"
                : "flex-col"
            )}
          >
            <dt className="font-chakra text-mut tracking-wider uppercase font-medium min-w-[140px] select-none">
              {item.label}
            </dt>

            <dd className="font-mono text-fg flex items-center justify-between sm:justify-end gap-2 break-all flex-1">
              <span>{item.value}</span>

              {item.copyable && copyText && (
                <button
                  type="button"
                  onClick={() => handleCopy(item.label, copyText)}
                  className="p-1 rounded-sm text-mut hover:text-ok transition-colors focus-visible:outline-none"
                  title="Copy value"
                  aria-label={`Copy ${item.label}`}
                >
                  {copiedKey === item.label ? (
                    <Check size={13} className="text-ok" />
                  ) : (
                    <Copy size={13} />
                  )}
                </button>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
};
