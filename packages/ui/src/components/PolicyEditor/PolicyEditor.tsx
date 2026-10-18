import React, { useState } from "react";
import { Check, AlertCircle, Copy } from "lucide-react";
import { cn } from "../../utils/cn";

export interface PolicyEditorProps {
  value: string;
  onChange?: (val: string) => void;
  readOnly?: boolean;
  language?: "rego" | "json" | "yaml";
  diffValue?: string; // If provided, shows side-by-side or inline diff
  className?: string;
  error?: string | null;
}

export const PolicyEditor: React.FC<PolicyEditorProps> = ({
  value,
  onChange,
  readOnly = false,
  language = "rego",
  diffValue,
  className,
  error,
}) => {
  const [copied, setCopied] = useState(false);
  const lines = value.split("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "rounded-sm border border-line bg-panel overflow-hidden font-mono text-xs flex flex-col",
        className
      )}
    >
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-line bg-bg/50">
        <div className="flex items-center gap-2">
          <span className="font-chakra uppercase text-fg font-semibold tracking-wider text-[11px]">
            {language} policy
          </span>
          {readOnly && (
            <span className="text-[10px] text-mut px-1.5 py-0.5 rounded-sm bg-line/40">
              READ-ONLY
            </span>
          )}
          {error ? (
            <span className="flex items-center gap-1 text-[11px] text-bad font-chakra">
              <AlertCircle size={12} /> Syntax Error
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-ok font-chakra">
              <Check size={12} /> Validated
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-mut hover:text-fg text-[11px] px-1.5 py-0.5 rounded-sm hover:bg-line/20 transition-colors"
          title="Copy policy"
        >
          {copied ? <Check size={12} className="text-ok" /> : <Copy size={12} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {/* Editor Surface */}
      <div className="flex flex-1 overflow-auto max-h-[420px] bg-bg/30">
        {/* Line numbers */}
        <div
          className="select-none py-3 pl-3 pr-2 text-right text-mut/40 font-mono text-xs border-r border-line/30 bg-bg/20 min-w-[3rem]"
          aria-hidden="true"
        >
          {lines.map((_, i) => (
            <div key={i} className="leading-5">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code View / Textarea */}
        {readOnly ? (
          <pre className="p-3 text-xs leading-5 text-fg font-mono overflow-x-auto flex-1 whitespace-pre">
            {value}
          </pre>
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
            spellCheck={false}
            className="flex-1 p-3 bg-transparent text-xs leading-5 text-fg font-mono resize-none focus:outline-none min-h-[200px]"
          />
        )}
      </div>

      {/* Optional Syntax Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-bad/10 border-t border-bad/30 text-bad text-xs font-sans">
          {error}
        </div>
      )}
    </div>
  );
};
