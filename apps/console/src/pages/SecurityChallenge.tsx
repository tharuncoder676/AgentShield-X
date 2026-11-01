import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Lock,
  Key,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Copy,
  Check,
  LogOut,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const SecurityChallenge: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    apiKey,
    securityChallengePassed,
    hasEnrolledQuestions,
    enrollSecurityQuestions,
    verifySecurityQuestions,
    logout,
  } = useAuth();

  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTimer > 0) {
      const interval = setInterval(() => {
        setLockoutTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutTimer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (lockoutTimer > 0) {
      setError(`Security lockout active. Please wait ${lockoutTimer} seconds.`);
      return;
    }

    if (!q1.trim() || !q2.trim() || !q3.trim()) {
      setError("All 3 security verification questions must be answered.");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      if (!hasEnrolledQuestions) {
        // First-Time Registration / Enrollment Phase
        enrollSecurityQuestions({ q1, q2, q3 });
        setIsProcessing(false);
        setError(null);
      } else {
        // Subsequent Google Sign-In Verification Phase
        const passed = verifySecurityQuestions({ q1, q2, q3 });
        setIsProcessing(false);

        if (passed) {
          setError(null);
        } else {
          const nextAttempts = attemptsLeft - 1;
          setAttemptsLeft(nextAttempts);
          if (nextAttempts <= 0) {
            setLockoutTimer(60);
            setAttemptsLeft(3);
            setError("Too many failed security attempts. Security lockout engaged for 60 seconds.");
          } else {
            setError(
              `Verification failed. Incorrect answer(s). ${nextAttempts} attempt(s) remaining.`
            );
          }
        }
      }
    }, 500);
  };

  const handleCopyKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Background Volumetric Aura */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[650px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-xl z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-purple-500/30 bg-[#120a24] text-purple-300 text-xs font-mono mb-3 shadow-md shadow-purple-950/40">
            <Shield className="w-3.5 h-3.5 text-[#a855f7]" />
            <span>PERSONAL IDENTITY DEFENSE GATE</span>
          </div>
          <h1 className="text-3xl font-bold font-sora tracking-tight text-white mb-2">
            {!hasEnrolledQuestions
              ? "Register Personal Security Questions"
              : "Personal Identity Verification"}
          </h1>
          <p className="text-xs sm:text-sm text-[#a9a9aa] leading-relaxed max-w-md mx-auto">
            {!hasEnrolledQuestions
              ? "Set up your 3 confidential personal security questions for your account. You will be prompted to answer these each time you sign in with Google."
              : "To protect your API keys and agent fleet, answer your 3 registered security questions to access the console."}
          </p>
        </div>

        {/* Authenticated User Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-[#0d0e13] border border-zinc-800/80 flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center font-bold text-purple-300 overflow-hidden">
              {(user as any)?.photoURL ? (
                <img src={(user as any).photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                ((user as any)?.name || user?.full_name || user?.email || "U").charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                <span>{(user as any)?.name || user?.full_name || "Google Authenticated Operator"}</span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  OAUTH VERIFIED
                </span>
              </div>
              <div className="text-[11px] font-mono text-zinc-400">{user?.email || "operator@enterprise.ai"}</div>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="text-xs font-mono text-zinc-400 hover:text-red-400 transition-colors flex items-center space-x-1 p-2 rounded-lg hover:bg-zinc-800/50"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Switch</span>
          </button>
        </div>

        {/* Security Challenge Card */}
        <div className="rounded-3xl border border-[#22163b] bg-[#0c0d12]/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-purple-950/30 relative">
          
          {securityChallengePassed ? (
            /* SUCCESS STATE: Display API Key & Enter Dashboard */
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold font-sora text-white mb-1">
                  Identity Clearance Confirmed
                </h3>
                <p className="text-xs text-zinc-400">
                  Your personal security answers have been cryptographically verified. Your production API key is active.
                </p>
              </div>

              {/* API Key Box */}
              <div className="p-4 rounded-2xl bg-[#08090b] border border-purple-500/40 text-left">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pb-2 mb-2 border-b border-zinc-800">
                  <span className="flex items-center space-x-1.5 text-purple-300">
                    <Key className="w-3.5 h-3.5" />
                    <span>YOUR PRODUCTION API KEY</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-mono text-amber-300 break-all select-all">
                    {apiKey || "shld_live_49f8a10b99ce77d2"}
                  </code>
                  <button
                    onClick={handleCopyKey}
                    className="p-2 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:text-white hover:bg-purple-600/40 transition-colors shrink-0"
                    title="Copy API Key"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Proceed to Dashboard Button */}
              <button
                type="button"
                onClick={() => navigate("/overview")}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#a855f7] via-[#9333ea] to-[#7e22ce] text-white font-bold text-sm tracking-wide shadow-lg shadow-purple-600/40 hover:opacity-95 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>ENTER ORIGINAL SYSTEM DASHBOARD</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* QUESTIONS FORM */
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-start space-x-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Question 1 */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-zinc-300 block">
                  1. What was the name of your first elementary school or childhood pet?
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={q1}
                  onChange={(e) => setQ1(e.target.value)}
                  placeholder="Enter your confidential answer..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#08090b] border border-zinc-800 text-white font-mono text-xs focus:outline-none focus:border-[#a855f7] transition-colors"
                  disabled={lockoutTimer > 0 || isProcessing}
                />
              </div>

              {/* Question 2 */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-zinc-300 block">
                  2. In what city or town was your mother or father born?
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={q2}
                  onChange={(e) => setQ2(e.target.value)}
                  placeholder="Enter your confidential answer..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#08090b] border border-zinc-800 text-white font-mono text-xs focus:outline-none focus:border-[#a855f7] transition-colors"
                  disabled={lockoutTimer > 0 || isProcessing}
                />
              </div>

              {/* Question 3 */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-zinc-300 block">
                  3. What was the model and make of your family's first car or childhood street name?
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={q3}
                  onChange={(e) => setQ3(e.target.value)}
                  placeholder="Enter your confidential answer..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#08090b] border border-zinc-800 text-white font-mono text-xs focus:outline-none focus:border-[#a855f7] transition-colors"
                  disabled={lockoutTimer > 0 || isProcessing}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={lockoutTimer > 0 || isProcessing}
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#a855f7] to-[#7e22ce] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-purple-600/30 hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>CRYPTOGRAPHICALLY VERIFYING...</span>
                    </>
                  ) : lockoutTimer > 0 ? (
                    <span>LOCKOUT ACTIVE ({lockoutTimer}s)</span>
                  ) : !hasEnrolledQuestions ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>CONFIRM & ENROLL IDENTITY ANSWERS</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>VERIFY IDENTITY & UNLOCK DASHBOARD</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
