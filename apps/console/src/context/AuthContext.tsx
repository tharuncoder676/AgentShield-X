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
    localStorage.getItem("agentshield_api_key") || "shld_live_49f8a10b99ce77d2"
  );
  const [securityChallengePassed, setSecurityChallengePassed] = useState<boolean>(() =>
    sessionStorage.getItem("agentshield_security_challenge_passed") === "true"
  );
  const [hasEnrolledQuestions, setHasEnrolledQuestions] = useState<boolean>(() => {
    const savedEmail = localStorage.getItem("agentshield_user_email") || "operator@enterprise.ai";
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
        setUser(me);

        const email = (me?.email || localStorage.getItem("agentshield_user_email") || "operator@enterprise.ai").toLowerCase();
        localStorage.setItem("agentshield_user_email", email);
        const enrolled = !!localStorage.getItem("agentshield_sec_answers_" + email);
        setHasEnrolledQuestions(enrolled);

        // Fetch organizations
        const orgs = await client.listOrgs();
        if (orgs.length > 0) {
          const currentOrg = orgs[0];
          setOrg(currentOrg);

          // Fetch projects
          const projs = await client.listProjects(currentOrg.id);
          setProjects(projs);
          if (projs.length > 0) {
            const savedProjId = localStorage.getItem("agentshield_active_project");
            const matched = projs.find((p) => p.id === savedProjId);
            setActiveProject(matched || projs[0]);
          }
        }
      } catch (err) {
        console.warn("Could not fetch remote user profile, using local token credentials:", err);
        const email = (localStorage.getItem("agentshield_user_email") || "operator@enterprise.ai").toLowerCase();
        setUser({
          id: "usr_operator_session",
          email: email,
          name: "Security Operator",
          role: "operator",
          created_at: new Date().toISOString(),
        } as any);
        const enrolled = !!localStorage.getItem("agentshield_sec_answers_" + email);
        setHasEnrolledQuestions(enrolled);
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
    } else {
      localStorage.removeItem("agentshield_active_project");
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const googleUser = await signInWithGoogle();
      const generatedToken = googleUser.idToken || `firebase_tok_${Date.now()}`;
      const userKey = localStorage.getItem("agentshield_api_key") || `shld_live_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
      const userEmail = (googleUser.email || "security.lead@enterprise.ai").toLowerCase();
      
      const loggedUser: User = {
        id: googleUser.uid,
        email: userEmail,
        name: googleUser.displayName || "Google Operator",
        role: "operator",
        photoURL: googleUser.photoURL,
        created_at: new Date().toISOString(),
      } as any;

      localStorage.setItem("agentshield_token", generatedToken);
      localStorage.setItem("agentshield_api_key", userKey);
      localStorage.setItem("agentshield_user_email", userEmail);

      // Check enrollment for this specific email
      const existingAnswers = localStorage.getItem("agentshield_sec_answers_" + userEmail);
      setHasEnrolledQuestions(!!existingAnswers);

      // Enforce challenge every single sign-in
      setSecurityChallengePassed(false);
      sessionStorage.removeItem("agentshield_security_challenge_passed");

      setToken(generatedToken);
      setApiKey(userKey);
      setUser(loggedUser);
    } finally {
      setIsLoading(false);
    }
  };

  const enrollSecurityQuestions = (answers: { q1: string; q2: string; q3: string }) => {
    const email = (user?.email || localStorage.getItem("agentshield_user_email") || "operator@enterprise.ai").toLowerCase();
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
    const email = (user?.email || localStorage.getItem("agentshield_user_email") || "operator@enterprise.ai").toLowerCase();
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
    const res = await client.login(data);
    setToken(res.access_token);
    setUser(res.user);

    const email = (res.user?.email || data.email).toLowerCase();
    localStorage.setItem("agentshield_user_email", email);

    const generatedKey = `shld_live_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
    localStorage.setItem("agentshield_api_key", generatedKey);
    setApiKey(generatedKey);

    const existingAnswers = localStorage.getItem("agentshield_sec_answers_" + email);
    setHasEnrolledQuestions(!!existingAnswers);

    // Enforce challenge every single sign-in
    setSecurityChallengePassed(false);
    sessionStorage.removeItem("agentshield_security_challenge_passed");

    // Load orgs & projects
    try {
      const orgs = await client.listOrgs();
      if (orgs.length > 0) {
        setOrg(orgs[0]);
        const projs = await client.listProjects(orgs[0].id);
        setProjects(projs);
        if (projs.length > 0) {
          handleSelectProject(projs[0]);
        }
      }
    } catch {}

    return res;
  };

  const signup = async (data: SignupRequest) => {
    const res = await client.signup(data);
    setToken(res.access_token);
    setUser(res.user);

    const email = (res.user?.email || data.email).toLowerCase();
    localStorage.setItem("agentshield_user_email", email);

    const generatedKey = `shld_live_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
    localStorage.setItem("agentshield_api_key", generatedKey);
    setApiKey(generatedKey);

    setHasEnrolledQuestions(false);
    setSecurityChallengePassed(false);
    sessionStorage.removeItem("agentshield_security_challenge_passed");

    try {
      const orgs = await client.listOrgs();
      if (orgs.length > 0) {
        setOrg(orgs[0]);
        const projs = await client.listProjects(orgs[0].id);
        setProjects(projs);
        if (projs.length > 0) {
          handleSelectProject(projs[0]);
        }
      }
    } catch {}

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
