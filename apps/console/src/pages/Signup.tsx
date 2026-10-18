import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Lock, Mail, User, Building, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signup({
        full_name: fullName,
        email,
        password,
        organization_name: orgName.trim() || undefined,
      });
      // Directly transition into Onboarding Wizard
      navigate("/onboarding");
    } catch (err: any) {
      setError(err.message || "Sign-up failed. Please review your details.");
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
            Create Security Tenant & Provision Workspace
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-panel border border-line p-8 shadow-hairline">
          <h2 className="text-lg font-chakra font-bold tracking-wide uppercase mb-6 text-fg flex items-center justify-between">
            <span>Register Operator Account</span>
            <span className="text-[10px] text-ok border border-ok/40 px-1.5 py-0.5 font-mono">
              Self-Serve
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
                Operator Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Vance"
                  className="w-full bg-bg border border-line px-3 py-2 pl-9 text-sm text-fg placeholder:text-mut/50 focus:border-ok focus:outline-none"
                />
                <User size={16} className="absolute left-3 top-2.5 text-mut" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-chakra uppercase tracking-wider text-mut mb-1">
                Organization Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Apex Security Labs"
                  className="w-full bg-bg border border-line px-3 py-2 pl-9 text-sm text-fg placeholder:text-mut/50 focus:border-ok focus:outline-none"
                />
                <Building size={16} className="absolute left-3 top-2.5 text-mut" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-chakra uppercase tracking-wider text-mut mb-1">
                Work Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@apexlabs.test"
                  className="w-full bg-bg border border-line px-3 py-2 pl-9 text-sm text-fg placeholder:text-mut/50 focus:border-ok focus:outline-none"
                />
                <Mail size={16} className="absolute left-3 top-2.5 text-mut" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-chakra uppercase tracking-wider text-mut mb-1">
                Password (minimum 8 characters)
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={8}
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
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Initialize & Continue to Onboarding</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-line text-center text-xs text-mut">
            Already have an active account?{" "}
            <Link
              to="/login"
              className="text-ok hover:underline font-chakra font-semibold"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
