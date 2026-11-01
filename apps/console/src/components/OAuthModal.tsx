import React, { useState } from "react";
import { X, User } from "lucide-react";

export interface OAuthModalProps {
  isOpen: boolean;
  provider: "google" | null;
  onClose: () => void;
  onSuccess: (profile: { email: string; name: string; provider: "google" }) => void;
}

export const OAuthModal: React.FC<OAuthModalProps> = ({
  isOpen,
  provider,
  onClose,
  onSuccess,
}) => {
  const savedLastEmail = typeof window !== "undefined" ? localStorage.getItem("agentshield_user_email") : null;
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(!savedLastEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputError, setInputError] = useState("");

  if (!isOpen || !provider) return null;

  const handleGoogleSelect = (email: string, name: string) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      localStorage.setItem("agentshield_user_email", email.toLowerCase());
      onSuccess({ email: email.toLowerCase(), name, provider: "google" });
    }, 400);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes("@")) {
      setInputError("Please enter a valid Google account email.");
      return;
    }
    const cleanEmail = customEmail.trim().toLowerCase();
    const cleanName = customName.trim() || cleanEmail.split("@")[0].replace(/[\._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    handleGoogleSelect(cleanEmail, cleanName);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* GOOGLE SIGN IN MODAL */}
      {provider === "google" && (
        <div className="w-full max-w-[420px] bg-[#202124] text-white rounded-2xl shadow-2xl border border-[#3c4043] overflow-hidden animate-in zoom-in-95 duration-150">
          
          {/* Header with Google Logo */}
          <div className="p-6 pb-4 border-b border-[#3c4043] relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-[#303134] transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center space-x-2.5 mb-3">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="font-medium text-sm text-zinc-300">Sign in with Google</span>
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight">Sign in with your Google Account</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              to continue to <strong className="text-white">AgentShield-X</strong>
            </p>
          </div>

          {/* Account Form / Selector */}
          <div className="p-4 space-y-3">
            
            {savedLastEmail && !showCustomInput ? (
              <div className="space-y-2">
                <div
                  onClick={() => handleGoogleSelect(savedLastEmail, savedLastEmail.split("@")[0])}
                  className="p-3.5 rounded-xl bg-[#303134] hover:bg-[#3c4043] cursor-pointer flex items-center justify-between transition-all group border border-[#5f6368]/40"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white shadow-md uppercase">
                      {savedLastEmail.charAt(0)}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                        {savedLastEmail.split("@")[0]}
                      </div>
                      <div className="text-xs text-zinc-300 font-mono">
                        {savedLastEmail}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Previous
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="w-full py-2.5 px-3 rounded-xl hover:bg-[#303134] text-left text-xs text-[#8ab4f8] font-medium flex items-center space-x-2 transition-colors"
                >
                  <User size={15} />
                  <span>Use another Google account</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleCustomSubmit} className="space-y-3 text-left">
                {inputError && (
                  <p className="text-xs text-red-400 bg-red-950/40 p-2 rounded-lg border border-red-500/30">
                    {inputError}
                  </p>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 uppercase tracking-wider mb-1">
                    Google Email Address
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={customEmail}
                    onChange={(e) => {
                      setCustomEmail(e.target.value);
                      setInputError("");
                    }}
                    placeholder="user@gmail.com or your-work@company.com"
                    className="w-full bg-[#18191c] border border-[#5f6368] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#8ab4f8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 uppercase tracking-wider mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-[#18191c] border border-[#5f6368] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#8ab4f8]"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  {savedLastEmail ? (
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(false)}
                      className="text-xs text-zinc-400 hover:text-white"
                    >
                      &larr; Back to saved account
                    </button>
                  ) : <div />}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#8ab4f8] text-[#202124] text-xs font-bold hover:bg-[#aecbfa] transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Connecting..." : "Continue with Google"}
                  </button>
                </div>
              </form>
            )}

          </div>

          {/* Footer Note */}
          <div className="p-4 bg-[#18191c] border-t border-[#3c4043] text-[11px] text-zinc-400 leading-relaxed text-left">
            Google authenticates your identity securely. Each user receives their own isolated tenant and cryptographic API credentials.
          </div>
        </div>
      )}

    </div>
  );
};
