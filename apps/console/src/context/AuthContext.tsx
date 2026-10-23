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

interface AuthContextType {
  user: User | null;
  token: string | null;
  org: Organization | null;
  projects: Project[];
  activeProject: Project | null;
  isLoading: boolean;
  client: AgentShieldClient;
  login: (data: LoginRequest) => Promise<AuthResponse>;
  signup: (data: SignupRequest) => Promise<AuthResponse>;
  logout: () => void;
  setActiveProject: (proj: Project | null) => void;
  refreshProjects: () => Promise<void>;
}

const client = new AgentShieldClient({
  baseUrl: window.location.origin.includes("localhost:3000")
    ? "http://localhost:8002"
    : "",
});

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("agentshield_token")
  );
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
        console.warn("Failed to hydrate auth session:", err);
        setToken(null);
        setUser(null);
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

  const login = async (data: LoginRequest) => {
    const res = await client.login(data);
    setToken(res.access_token);
    setUser(res.user);

    // Load orgs & projects
    const orgs = await client.listOrgs();
    if (orgs.length > 0) {
      setOrg(orgs[0]);
      const projs = await client.listProjects(orgs[0].id);
      setProjects(projs);
      if (projs.length > 0) {
        handleSelectProject(projs[0]);
      }
    }
    return res;
  };

  const signup = async (data: SignupRequest) => {
    const res = await client.signup(data);
    setToken(res.access_token);
    setUser(res.user);

    const orgs = await client.listOrgs();
    if (orgs.length > 0) {
      setOrg(orgs[0]);
      const projs = await client.listProjects(orgs[0].id);
      setProjects(projs);
      if (projs.length > 0) {
        handleSelectProject(projs[0]);
      }
    }
    return res;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setOrg(null);
    setProjects([]);
    setActiveProject(null);
    localStorage.removeItem("agentshield_token");
    localStorage.removeItem("agentshield_active_project");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        org,
        projects,
        activeProject,
        isLoading,
        client,
        login,
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
