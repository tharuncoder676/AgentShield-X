import React, { useState, useEffect } from "react";
import { Copy, Check, X, ShieldCheck, Download, ExternalLink } from "lucide-react";

interface DownloadSetupCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  downloadUrl?: string;
  appName?: string;
}

// Generate deterministic 10-char hex hash
function simpleHash(str: string): string {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  return (hex + "abcdef0123456789").slice(0, 10);
}

// Generate base64 setup token
export function generateSetupCode(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const existingTok = params.get("tok");
    if (existingTok && existingTok.startsWith("N1.") || existingTok?.startsWith("C1.")) {
      return existingTok;
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const yyyymmdd = `${yyyy}${mm}${dd}`;

    // Expiration: 30 days in future
    const expDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expYyyymmdd = `${expDate.getFullYear()}${String(expDate.getMonth() + 1).padStart(2, "0")}${String(expDate.getDate()).padStart(2, "0")}`;

    const randHex = Math.random().toString(16).substring(2, 9);
    const aid = params.get("aid") || `act-${yyyymmdd}-${randHex}`;
    const campaign = params.get("utm_campaign") || `growth-os-${aid}`;
    const source = params.get("utm_source") || "website";
    const medium = params.get("utm_medium") || "organic";

    const payload = {
      a: aid,
      c: campaign,
      m: medium,
      s: source,
      x: expYyyymmdd,
    };

    const jsonStr = JSON.stringify(payload);
    // URL-safe base64
    const b64 = btoa(jsonStr).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const sig = simpleHash(b64);
    return `N1.${b64}.${sig}`;
  } catch (e) {
    return "N1.eyJhIjoiYWN0LTIwMjYxMTIzLTBmNjI3ZmIiLCJjIjoiZ3Jvd3RoLW9zIiwibSI6Im9yZ2FuaWMiLCJzIjoid2Vic2l0ZSIsIngiOiIyMDI2MTIyMyJ9.fd42623bde";
  }
}

export const DownloadSetupCodeModal: React.FC<DownloadSetupCodeModalProps> = ({
  isOpen,
  onClose,
  downloadUrl,
  appName = "Chronos",
}) => {
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState("");
  const [linkedMessage, setLinkedMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      const code = generateSetupCode();
      setToken(code);
      setCopied(false);
      setLinkedMessage("");
      try {
        localStorage.setItem("chronos_setup_code", code);
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleLinkExisting = () => {
    setLinkedMessage("Opening Chronos Desktop... If your browser asks, click Open.");
    // Attempt deep links for both chronos:// and nus:// protocol handlers
    const deepLink = `chronos://setup?tok=${encodeURIComponent(token)}`;
    const fallbackLink = `nus://setup?tok=${encodeURIComponent(token)}`;
    
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    iframe.src = deepLink;
    setTimeout(() => {
      try { iframe.src = fallbackLink; } catch {}
      setTimeout(() => {
        try { document.body.removeChild(iframe); } catch {}
      }, 1000);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg rounded-2xl bg-[#0d0b17] border border-purple-500/50 shadow-2xl shadow-purple-950/70 p-6 text-zinc-100 overflow-hidden"
        style={{
          backgroundImage: "radial-gradient(circle at 50% 0%, rgba(168, 85, 247, 0.15) 0%, transparent 70%)"
        }}
      >
        {/* Top Glow Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-cyan-400 to-purple-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-purple-950/50 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Download className="w-4 h-4 text-cyan-300" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-wide">
            Downloading {appName}?
          </h3>
        </div>

        {/* Instruction Message */}
        <p className="text-xs text-zinc-300 leading-relaxed mb-4">
          After installing, open <span className="font-semibold text-purple-300">Settings → Have a setup code?</span> and paste this code so your install links back to where you found it <span className="text-zinc-400">(nothing personal is shared)</span>:
        </p>

        {/* Code Box */}
        <div className="relative mb-4 group">
          <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#06040a] border border-purple-500/30 group-hover:border-purple-500/60 transition-colors">
            <code className="text-[11px] font-mono text-purple-200 select-all break-all overflow-x-auto whitespace-pre-wrap leading-tight">
              {token}
            </code>
            <button
              onClick={handleCopy}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/50"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col gap-2 pt-2 border-t border-purple-950/80">
          <div className="flex items-center justify-between">
            <button
              onClick={handleLinkExisting}
              className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-4 flex items-center gap-1 transition-colors font-medium"
            >
              <span>Already installed? Link this download</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
            >
              Got it
            </button>
          </div>

          {linkedMessage && (
            <p className="text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 rounded-lg p-2 mt-1 animate-fade-in">
              {linkedMessage}
            </p>
          )}

          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-1">
            <ShieldCheck className="w-3 h-3 text-purple-400" />
            <span>Zero-trust privacy: Code securely preserves attribution anonymously</span>
          </div>
        </div>
      </div>
    </div>
  );
};
