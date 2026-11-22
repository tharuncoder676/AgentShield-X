import React, { createContext, useContext, useEffect, useState } from "react";
import {
  AgentShieldClient,
  AuthResponse,
  LoginRequest,
  Organization,
  Project,
  SignupRequest,
  User,
} from "@agentshield/api-client";
import { signInWithGoogle, signOutUser } from "../lib/firebase";

export interface AuthContextType {
  user: User | null;
  token: string | null;
  apiKey: string | null;
  securityChallengePassed: boolean;
  hasEnrolledQuestions: boolean;
  org: Organization | null;
  projects: Project[];
  activeProject: Project | null;
  isLoading: boolean;
  client: AgentShieldClient;
  login: (data: LoginRequest) => Promise<AuthResponse>;
  loginWithGoogle: () => Promise<void>;
  enrollSecurityQuestions: (answers: { q1: string; q2: string; q3: string }) => void;
  verifySecurityQuestions: (answers: { q1: string; q2: string; q3: string }) => boolean;
  signup: (data: SignupRequest) => Promise<AuthResponse>;
  logout: () => void;
  setActiveProject: (proj: Project | null) => void;
  refreshProjects: () => Promise<void>;
}

const client = new AgentShieldClient({
  baseUrl: (import.meta as any).env?.VITE_API_URL || "",
});

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("agentshield_token")
  );
  const [apiKey, setApiKey] = useState<string | null>(() =>
    localStorage.getItem("agentshield_api_key")
  );
  const [securityChallengePassed, setSecurityChallengePassed] = useState<boolean>(false);
  const [hasEnrolledQuestions, setHasEnrolledQuestions] = useState<boolean>(() => {
    const savedEmail = localStorage.getItem("agentshield_user_email") || "user@agentshield.ai";
    return !!localStorage.getItem("agentshield_sec_answers_" + savedEmail.toLowerCase());
  });

  const [org, setOrg] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Synchronize client token whenever token state changes
  useEffect(() => {
    client.setToken(token);
    if (token) {
      localStorage.setItem("agentshield_token", token);
    } else {
      localStorage.removeItem("agentshield_token");
    }
  }, [token]);

  // Initial load / re-hydration
  useEffect(() => {
    async function hydrate() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        client.setToken(token);
        const me = await client.getMe();
        if (!me?.id || !me.email) {
          throw new Error("The server did not return a verified user.");
        }

        const orgs = await client.listOrgs();
        if (orgs.length === 0) {
          throw new Error("This account is not a member of a workspace.");
        }

        const projs = await client.listProjects(orgs[0].id);
        const savedProjId = localStorage.getItem("agentshield_active_project");
        setUser(me);
        setOrg(orgs[0]);
        setProjects(projs);
        setActiveProject(projs.find((project) => project.id === savedProjId) || projs[0] || null);
        setSecurityChallengePassed(true);
        sessionStorage.setItem("agentshield_security_challenge_passed", "true");
        localStorage.setItem("agentshield_user_email", me.email);
      } catch {
        setToken(null);
        setUser(null);
        setOrg(null);
        setProjects([]);
        setActiveProject(null);
        setSecurityChallengePassed(false);
        sessionStorage.removeItem("agentshield_security_challenge_passed");
        localStorage.removeItem("agentshield_active_project");
      } finally {
        setIsLoading(false);
      }
    }

    hydrate();
  }, [token]);

  const refreshProjects = async () => {
    if (!org) return;
    try {
      const projs = await client.listProjects(org.id);
      setProjects(projs);
      if (projs.length > 0 && !activeProject) {
        setActiveProject(projs[0]);
      }
    } catch (err) {
      console.error("Failed to refresh projects:", err);
    }
  };

  const handleSelectProject = (proj: Project | null) => {
    setActiveProject(proj);
    if (proj) {
      localStorage.setItem("agentshield_active_project", proj.id);
      localStorage.setItem("agentshield_active_proj_data", JSON.stringify(proj));
    } else {
      localStorage.removeItem("agentshield_active_project");
    }
  };

  const loginWithGoogle = async () => {
    throw new Error("Google sign-in is unavailable until verified server-side identity exchange is configured.");
  };

  const enrollSecurityQuestions = (answers: { q1: string; q2: string; q3: string }) => {
    const email = (user?.email || localStorage.getItem("agentshield_user_email") || "user@agentshield.ai").toLowerCase();
    const payload = {
      a1: answers.q1.trim().toLowerCase(),
      a2: answers.q2.trim().toLowerCase(),
      a3: answers.q3.trim().toLowerCase(),
    };
    localStorage.setItem("agentshield_sec_answers_" + email, JSON.stringify(payload));
    setHasEnrolledQuestions(true);
    setSecurityChallengePassed(true);
    sessionStorage.setItem("agentshield_security_challenge_passed", "true");
  };

  const verifySecurityQuestions = (answers: { q1: string; q2: string; q3: string }): boolean => {
    const email = (user?.email || localStorage.getItem("agentshield_user_email") || "user@agentshield.ai").toLowerCase();
    const storedRaw = localStorage.getItem("agentshield_sec_answers_" + email);
    if (!storedRaw) {
      return false;
    }

    try {
      const stored = JSON.parse(storedRaw);
      const inputA1 = answers.q1.trim().toLowerCase();
      const inputA2 = answers.q2.trim().toLowerCase();
      const inputA3 = answers.q3.trim().toLowerCase();

      if (inputA1 === stored.a1 && inputA2 === stored.a2 && inputA3 === stored.a3) {
        setSecurityChallengePassed(true);
        sessionStorage.setItem("agentshield_security_challenge_passed", "true");
        return true;
      }
    } catch {}

    return false;
  };

  const login = async (data: LoginRequest) => {
    const email = data.email.trim().toLowerCase();
    const name = email.split("@")[0].replace(/[\._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    localStorage.setItem("agentshield_user_email", email);
    localStorage.setItem("agentshield_user_name", name);

    const res = await client.login(data);
    if (!res.access_token) throw new Error("The server did not issue a session.");
    client.setToken(res.access_token);
    const orgs = await client.listOrgs();
    if (orgs.length === 0) throw new Error("Your account is not a member of a workspace.");
    const projs = await client.listProjects(orgs[0].id);
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem("agentshield_token", res.access_token);
    localStorage.setItem("agentshield_user_email", res.user.email);
    setOrg(orgs[0]);
    setProjects(projs);
    setActiveProject(projs[0] || null);
    setSecurityChallengePassed(true);
    sessionStorage.setItem("agentshield_security_challenge_passed", "true");

    return res;
  };

  const signup = async (data: SignupRequest) => {
    const email = data.email.trim().toLowerCase();
    const name = data.full_name?.trim() || email.split("@")[0].replace(/[\._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    localStorage.setItem("agentshield_user_email", email);
    localStorage.setItem("agentshield_user_name", name);

    const res = await client.signup(data);
    if (!res.access_token) throw new Error("The server did not issue a session.");
    client.setToken(res.access_token);
    const orgs = await client.listOrgs();
    if (orgs.length === 0) throw new Error("Workspace setup did not complete.");
    const projs = await client.listProjects(orgs[0].id);
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem("agentshield_token", res.access_token);
    localStorage.setItem("agentshield_user_email", res.user.email);
    setOrg(orgs[0]);
    setProjects(projs);
    setActiveProject(projs[0] || null);
    setSecurityChallengePassed(true);
    sessionStorage.setItem("agentshield_security_challenge_passed", "true");

    return res;
  };

  const logout = () => {
    signOutUser();
    setToken(null);
    setUser(null);
    setOrg(null);
    setProjects([]);
    setActiveProject(null);
    setSecurityChallengePassed(false);
    sessionStorage.removeItem("agentshield_security_challenge_passed");
    localStorage.removeItem("agentshield_token");
    localStorage.removeItem("agentshield_active_project");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        apiKey,
        securityChallengePassed,
        hasEnrolledQuestions,
        org,
        projects,
        activeProject,
        isLoading,
        client,
        login,
        loginWithGoogle,
        enrollSecurityQuestions,
        verifySecurityQuestions,
        signup,
        logout,
        setActiveProject: handleSelectProject,
        refreshProjects,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
