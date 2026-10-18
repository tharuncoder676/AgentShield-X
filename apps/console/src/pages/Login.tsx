import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      navigate("/overview");
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-panel border border-ok/50 text-ok mb-3 shadow-glow">
            <Shield size={24} />
          </div>
          <h1 className="text-2xl font-chakra font-bold tracking-wider uppercase text-fg">
            AgentShield<span className="text-ok">-X</span>
          </h1>
          <p className="text-xs text-mut font-chakra uppercase tracking-widest mt-1">
            Autonomous LLM Defense & Security Console
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-panel border border-line p-8 shadow-hairline">
          <h2 className="text-lg font-chakra font-bold tracking-wide uppercase mb-6 text-fg flex items-center justify-between">
            <span>Operator Sign In</span>
            <span className="text-[10px] text-ok border border-ok/40 px-1.5 py-0.5 font-mono">
              v1.0.0
            </span>
          </h2>

          {error && (
            <div className="mb-6 p-3 bg-bad/10 border border-bad/30 text-bad text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-chakra uppercase tracking-wider text-mut mb-1">
                Security Identity / Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@agentshield-x.dev"
                  className="w-full bg-bg border border-line px-3 py-2 pl-9 text-sm text-fg placeholder:text-mut/50 focus:border-ok focus:outline-none"
                />
                <Mail size={16} className="absolute left-3 top-2.5 text-mut" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-chakra uppercase tracking-wider text-mut mb-1">
                Access Token / Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-bg border border-line px-3 py-2 pl-9 text-sm text-fg placeholder:text-mut/50 focus:border-ok focus:outline-none"
                />
                <Lock size={16} className="absolute left-3 top-2.5 text-mut" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-ok text-black font-chakra font-bold text-xs uppercase tracking-wider py-2.5 px-4 flex items-center justify-center gap-2 hover:bg-ok/90 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Authenticate Session</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-line text-center text-xs text-mut">
            Don't have an operator organization?{" "}
            <Link
              to="/signup"
              className="text-ok hover:underline font-chakra font-semibold"
            >
              Initialize Workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
