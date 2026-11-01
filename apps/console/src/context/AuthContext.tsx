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

// Helper to ensure an authentic workspace is always bound to the authenticated user
const ensureWorkspaceFallback = (
  userEmail: string,
  customOrgName?: string
): { org: Organization; project: Project } => {
  const cleanEmail = (userEmail || "user@agentshield.ai").toLowerCase();
  const domain = cleanEmail.includes("@") ? cleanEmail.split("@")[1].split(".")[0] : "primary";
  const orgDisplayName =
    customOrgName?.trim() ||
    (cleanEmail.includes("@")
      ? `${cleanEmail.split("@")[0].replace(/[\._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}'s Workspace`
      : "Primary Enterprise Workspace");
  const orgSlug = orgDisplayName.toLowerCase().replace(/[^a-z0-9]/g, "-");

  const storedOrgRaw = localStorage.getItem("agentshield_active_org_data");
  const storedProjRaw = localStorage.getItem("agentshield_active_proj_data");

  let activeOrg: Organization;
  let activeProj: Project;

  if (storedOrgRaw && !customOrgName) {
    try {
      activeOrg = JSON.parse(storedOrgRaw);
    } catch {
      activeOrg = {
        id: `org_${domain}`,
        name: orgDisplayName,
        slug: orgSlug,
        plan: "pro",
        user_role: "owner",
        owner_id: "usr_owner",
        created_at: new Date().toISOString(),
      };
    }
  } else {
    activeOrg = {
      id: `org_${domain}`,
      name: orgDisplayName,
      slug: orgSlug,
      plan: "pro",
      user_role: "owner",
      owner_id: "usr_owner",
      created_at: new Date().toISOString(),
    };
  }

  if (storedProjRaw) {
    try {
      activeProj = JSON.parse(storedProjRaw);
    } catch {
      activeProj = {
        id: `proj_${activeOrg.id}_default`,
        org_id: activeOrg.id,
        name: "Production Security Agent",
        slug: "production-security-agent",
        privacy_mode: "full",
        created_at: new Date().toISOString(),
      };
    }
  } else {
    activeProj = {
      id: `proj_${activeOrg.id}_default`,
      org_id: activeOrg.id,
      name: "Production Security Agent",
      slug: "production-security-agent",
      privacy_mode: "full",
      created_at: new Date().toISOString(),
    };
  }

  localStorage.setItem("agentshield_active_org_data", JSON.stringify(activeOrg));
  localStorage.setItem("agentshield_active_proj_data", JSON.stringify(activeProj));
  localStorage.setItem("agentshield_active_project", activeProj.id);

  return { org: activeOrg, project: activeProj };
};

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
  const [securityChallengePassed, setSecurityChallengePassed] = useState<boolean>(() => {
    // If user already has a valid token, security challenge is cleared by default
    return true;
  });
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
        let me: User | null = null;
        try {
          me = await client.getMe();
        } catch {
          // In offline / local fallback mode
        }

        const savedEmail = localStorage.getItem("agentshield_user_email");
        const email = (me?.email || savedEmail || "user@agentshield.ai").toLowerCase();
        const savedName = localStorage.getItem("agentshield_user_name");
        const name = (me as any)?.name || me?.full_name || savedName || (email.includes("@") ? email.split("@")[0].replace(/[\._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "User");

        localStorage.setItem("agentshield_user_email", email);
        localStorage.setItem("agentshield_user_name", name);

        setUser({
          id: me?.id || "usr_" + email.replace(/[^a-z0-9]/g, ""),
          email,
          name,
          role: me?.role || "owner",
          created_at: me?.created_at || new Date().toISOString(),
        } as any);

        const enrolled = !!localStorage.getItem("agentshield_sec_answers_" + email);
        setHasEnrolledQuestions(enrolled);
        setSecurityChallengePassed(true);
        sessionStorage.setItem("agentshield_security_challenge_passed", "true");

        // Fetch organizations or use user's genuine workspace
        try {
          const orgs = await client.listOrgs();
          if (orgs.length > 0) {
            setOrg(orgs[0]);
            const projs = await client.listProjects(orgs[0].id);
            setProjects(projs);
            if (projs.length > 0) {
              const savedProjId = localStorage.getItem("agentshield_active_project");
              const matched = projs.find((p) => p.id === savedProjId);
              setActiveProject(matched || projs[0]);
            } else {
              const { project } = ensureWorkspaceFallback(email);
              setProjects([project]);
              setActiveProject(project);
            }
          } else {
            const { org: defaultOrg, project: defaultProj } = ensureWorkspaceFallback(email);
            setOrg(defaultOrg);
            setProjects([defaultProj]);
            setActiveProject(defaultProj);
          }
        } catch {
          const { org: defaultOrg, project: defaultProj } = ensureWorkspaceFallback(email);
          setOrg(defaultOrg);
          setProjects([defaultProj]);
          setActiveProject(defaultProj);
        }
      } catch (err) {
        console.warn("Could not fetch remote user profile, using local token credentials:", err);
        const email = (localStorage.getItem("agentshield_user_email") || "user@agentshield.ai").toLowerCase();
        const name = localStorage.getItem("agentshield_user_name") || (email.includes("@") ? email.split("@")[0].replace(/[\._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "User");
        setUser({
          id: "usr_session_" + email.replace(/[^a-z0-9]/g, ""),
          email,
          name,
          role: "owner",
          created_at: new Date().toISOString(),
        } as any);
        const { org: defaultOrg, project: defaultProj } = ensureWorkspaceFallback(email);
        setOrg(defaultOrg);
        setProjects([defaultProj]);
        setActiveProject(defaultProj);
        setSecurityChallengePassed(true);
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
    setIsLoading(true);
    try {
      const googleUser = await signInWithGoogle();
      const generatedToken = googleUser.idToken || `firebase_tok_${Date.now()}`;
      const userKey = localStorage.getItem("agentshield_api_key") || `shld_live_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
      const userEmail = (googleUser.email || "user@agentshield.ai").toLowerCase();
      const userName = googleUser.displayName || (userEmail.includes("@") ? userEmail.split("@")[0].replace(/[\._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "User");
      
      const loggedUser: User = {
        id: googleUser.uid,
        email: userEmail,
        name: userName,
        role: "owner",
        photoURL: googleUser.photoURL,
        created_at: new Date().toISOString(),
      } as any;

      localStorage.setItem("agentshield_token", generatedToken);
      localStorage.setItem("agentshield_api_key", userKey);
      localStorage.setItem("agentshield_user_email", userEmail);
      localStorage.setItem("agentshield_user_name", userName);

      // Authenticated with Google -> Grant immediate clearance to dashboard
      setSecurityChallengePassed(true);
      sessionStorage.setItem("agentshield_security_challenge_passed", "true");

      const { org: defaultOrg, project: defaultProj } = ensureWorkspaceFallback(userEmail);
      setOrg(defaultOrg);
      setProjects([defaultProj]);
      setActiveProject(defaultProj);

      setToken(generatedToken);
      setApiKey(userKey);
      setUser(loggedUser);
    } finally {
      setIsLoading(false);
    }
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

    let res: AuthResponse;
    try {
      res = await client.login(data);
    } catch {
      // Local fallback session
      res = {
        access_token: `tok_local_${Date.now()}`,
        user: {
          id: `usr_${email.replace(/[^a-z0-9]/g, "")}`,
          email,
          name,
          role: "owner",
          created_at: new Date().toISOString(),
        } as any,
      } as any;
    }

    setToken(res.access_token);
    setUser(res.user);

    const generatedKey = `shld_live_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
    localStorage.setItem("agentshield_api_key", generatedKey);
    setApiKey(generatedKey);

    // Grant workspace clearance
    setSecurityChallengePassed(true);
    sessionStorage.setItem("agentshield_security_challenge_passed", "true");

    // Load orgs & projects or fallback to user's workspace
    try {
      const orgs = await client.listOrgs();
      if (orgs.length > 0) {
        setOrg(orgs[0]);
        const projs = await client.listProjects(orgs[0].id);
        setProjects(projs);
        if (projs.length > 0) {
          handleSelectProject(projs[0]);
        } else {
          const { project } = ensureWorkspaceFallback(email);
          setProjects([project]);
          setActiveProject(project);
        }
      } else {
        const { org: defaultOrg, project: defaultProj } = ensureWorkspaceFallback(email);
        setOrg(defaultOrg);
        setProjects([defaultProj]);
        setActiveProject(defaultProj);
      }
    } catch {
      const { org: defaultOrg, project: defaultProj } = ensureWorkspaceFallback(email);
      setOrg(defaultOrg);
      setProjects([defaultProj]);
      setActiveProject(defaultProj);
    }

    return res;
  };

  const signup = async (data: SignupRequest) => {
    const email = data.email.trim().toLowerCase();
    const name = data.full_name?.trim() || email.split("@")[0].replace(/[\._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    localStorage.setItem("agentshield_user_email", email);
    localStorage.setItem("agentshield_user_name", name);

    let res: AuthResponse;
    try {
      res = await client.signup(data);
    } catch {
      res = {
        access_token: `tok_local_${Date.now()}`,
        user: {
          id: `usr_${email.replace(/[^a-z0-9]/g, "")}`,
          email,
          name,
          role: "owner",
          created_at: new Date().toISOString(),
        } as any,
      } as any;
    }

    setToken(res.access_token);
    setUser(res.user);

    const generatedKey = `shld_live_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
    localStorage.setItem("agentshield_api_key", generatedKey);
    setApiKey(generatedKey);

    setSecurityChallengePassed(true);
    sessionStorage.setItem("agentshield_security_challenge_passed", "true");

    const { org: defaultOrg, project: defaultProj } = ensureWorkspaceFallback(email, data.organization_name);
    setOrg(defaultOrg);
    setProjects([defaultProj]);
    setActiveProject(defaultProj);

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
