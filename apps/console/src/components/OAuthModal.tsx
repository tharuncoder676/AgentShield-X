import React, { useState } from "react";
import { X, Check, Shield, User, ArrowRight } from "lucide-react";

export interface OAuthModalProps {
  isOpen: boolean;
  provider: "google" | "apple" | null;
  onClose: () => void;
  onSuccess: (profile: { email: string; name: string; provider: "google" | "apple" }) => void;
}

export const OAuthModal: React.FC<OAuthModalProps> = ({
  isOpen,
  provider,
  onClose,
  onSuccess,
}) => {
  const [selectedGoogleAccount, setSelectedGoogleAccount] = useState<string>("tharuncoder676@gmail.com");
  const [customEmail, setCustomEmail] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [appleEmailOption, setAppleEmailOption] = useState<"share" | "hide">("share");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !provider) return null;

  const handleGoogleSelect = (email: string, name: string) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess({ email, name, provider: "google" });
    }, 600);
  };

  const handleAppleConfirm = () => {
    setIsSubmitting(true);
    const chosenEmail =
      appleEmailOption === "share"
        ? "tharuncoder676@icloud.com"
        : "t_privaterelay@appleid.com";
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess({ email: chosenEmail, name: "Apple User", provider: "apple" });
    }, 600);
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

            <h3 className="text-xl font-bold text-white tracking-tight">Choose an account</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              to continue to <strong className="text-white">ShieldWing</strong>
            </p>
          </div>

          {/* Account Selector List */}
          <div className="p-3 divide-y divide-[#3c4043]/60 max-h-[320px] overflow-y-auto">
            
            {/* Account 1: Tharunkumar S */}
            <div
              onClick={() => handleGoogleSelect("tharuncoder676@gmail.com", "Tharunkumar S")}
              className="p-3.5 rounded-xl hover:bg-[#303134] cursor-pointer flex items-center justify-between transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-sm text-white shadow-md">
                  T
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                    Tharunkumar S
                  </div>
                  <div className="text-xs text-zinc-400 font-mono">
                    tharuncoder676@gmail.com
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Primary
              </span>
            </div>

            {/* Account 2: Developer Operator */}
            <div
              onClick={() => handleGoogleSelect("operator@agentshield.io", "Lead Operator")}
              className="p-3.5 rounded-xl hover:bg-[#303134] cursor-pointer flex items-center justify-between transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center font-bold text-sm text-white shadow-md">
                  O
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                    Security Operator
                  </div>
                  <div className="text-xs text-zinc-400 font-mono">
                    operator@agentshield.io
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Workspace
              </span>
            </div>

            {/* Custom Account Input Option */}
            <div className="p-3">
              {showCustomInput ? (
                <div className="space-y-2 pt-1">
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="Enter another Google email"
                    className="w-full bg-[#18191c] border border-[#5f6368] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#8ab4f8]"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(false)}
                      className="px-3 py-1 rounded-lg text-xs text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (customEmail.includes("@")) {
                          handleGoogleSelect(customEmail, customEmail.split("@")[0]);
                        }
                      }}
                      className="px-4 py-1.5 rounded-lg bg-[#8ab4f8] text-[#202124] text-xs font-bold hover:bg-[#aecbfa]"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="w-full py-2.5 px-3 rounded-xl hover:bg-[#303134] text-left text-xs text-[#8ab4f8] font-medium flex items-center space-x-2 transition-colors"
                >
                  <User size={15} />
                  <span>Use another Google account</span>
                </button>
              )}
            </div>

          </div>

          {/* Footer Note */}
          <div className="p-4 bg-[#18191c] border-t border-[#3c4043] text-[11px] text-zinc-400 leading-relaxed text-left">
            To continue, Google will share your name, email address, language preference, and profile picture with ShieldWing.
          </div>
        </div>
      )}

      {/* APPLE SIGN IN MODAL */}
      {provider === "apple" && (
        <div className="w-full max-w-[420px] bg-[#1c1c1e] text-white rounded-3xl shadow-2xl border border-zinc-700/80 overflow-hidden animate-in zoom-in-95 duration-150">
          
          {/* Header with Apple Logo */}
          <div className="p-6 text-center border-b border-zinc-800 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Crisp 24x24 Vector Apple Logo */}
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-black border border-zinc-700 mb-3 shadow-md">
              <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.87-.96.04-2.12.64-2.79 1.43-.59.68-1.1 1.76-1.03 2.81 1.06.08 2.19-.62 2.81-1.37z" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight">Sign in with Apple</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
              Use your Apple ID to sign in to <strong className="text-white">ShieldWing</strong>.
            </p>
          </div>

          {/* Privacy Options */}
          <div className="p-6 space-y-4">
            
            {/* Apple ID Account Pill */}
            <div className="p-3.5 rounded-2xl bg-[#2c2c2e] border border-zinc-700/80 flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Apple ID</span>
              <span className="text-white font-mono font-semibold">tharuncoder676@icloud.com</span>
            </div>

            {/* Email Relay Radio */}
            <div className="space-y-2 text-left">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Email Preference
              </label>

              {/* Option 1: Share my email */}
              <div
                onClick={() => setAppleEmailOption("share")}
                className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  appleEmailOption === "share"
                    ? "bg-[#2c2c2e] border-white text-white"
                    : "bg-[#222224] border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div>
                  <div className="text-xs font-semibold">Share My Email</div>
                  <div className="text-[11px] text-zinc-400 font-mono">tharuncoder676@icloud.com</div>
                </div>
                {appleEmailOption === "share" && <Check size={16} className="text-white" />}
              </div>

              {/* Option 2: Hide my email */}
              <div
                onClick={() => setAppleEmailOption("hide")}
                className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  appleEmailOption === "hide"
                    ? "bg-[#2c2c2e] border-white text-white"
                    : "bg-[#222224] border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div>
                  <div className="text-xs font-semibold">Hide My Email</div>
                  <div className="text-[11px] text-zinc-400 font-mono">Forward to personal iCloud address</div>
                </div>
                {appleEmailOption === "hide" && <Check size={16} className="text-white" />}
              </div>
            </div>

            {/* Apple Primary Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAppleConfirm}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-full bg-white text-black hover:bg-zinc-200 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-lg"
              >
                {isSubmitting ? (
                  <span>Authenticating with Face ID...</span>
                ) : (
                  <>
                    <span>Continue with Passkey</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>

            <div className="text-[11px] text-zinc-500 text-center leading-relaxed">
              Your biometric data is encrypted on device and never sent to ShieldWing.
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

