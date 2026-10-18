import React, { useState, useEffect } from "react";
import { Search, X, Shield, ArrowRight } from "lucide-react";
import { cn } from "../../utils/cn";

export interface CommandItem {
  id: string;
  title: string;
  category: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items: CommandItem[];
  placeholder?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  items,
  placeholder = "Search pages, agents, incidents, or actions... (Cmd+K)",
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase()) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase()))
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      e.preventDefault();
      filteredItems[selectedIndex].onSelect();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div
        className="fixed inset-0 bg-bg/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-xl bg-panel border border-line shadow-2xl rounded-sm overflow-hidden flex flex-col max-h-[70vh] font-sans">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-line bg-bg/40">
          <Search size={16} className="text-mut shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus
            className="w-full bg-transparent text-sm text-fg placeholder:text-mut/70 focus:outline-none font-mono"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-mut hover:text-fg text-xs"
              aria-label="Clear query"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-line/40 text-mut rounded-sm border border-line">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-line/30">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-mut font-sans">
              No matching commands or resources found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.onSelect();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-sm cursor-pointer transition-colors text-xs font-mono",
                    isSelected ? "bg-ok/10 text-fg border-l-2 border-l-ok" : "text-fg/80 hover:bg-line/20"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="text-mut shrink-0">
                      {item.icon || <Shield size={14} />}
                    </div>
                    <div className="truncate">
                      <span className="font-chakra font-medium text-sm text-fg mr-2">
                        {item.title}
                      </span>
                      {item.subtitle && (
                        <span className="text-mut text-xs">{item.subtitle}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] uppercase font-chakra text-mut px-1.5 py-0.5 rounded-sm bg-line/30 border border-line">
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight size={13} className="text-ok" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-line bg-bg/50 text-[11px] text-mut flex items-center justify-between font-chakra">
          <span>Navigate with ↑ ↓ and Enter</span>
          <span>AgentShield-X Security Hub</span>
        </div>
      </div>
    </div>
  );
};
