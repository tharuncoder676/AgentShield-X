export interface ActiveAgentConfig {
  id: string;
  name: string;
  role: string;
  icon: string;
  status: "running" | "idle" | "scanning" | "paused";
  activity: string;
  enabled: boolean;
}

export interface ProtectionLayerConfig {
  toolInterception: boolean;
  honeytools: boolean;
  auditLog: boolean;
  sandboxing: boolean;
  threatIntel: boolean;
  mcpDefense: boolean;
}

export interface WingmanConfig {
  // Identity & Greetings
  operatorName: string;
  operatorRole: string;
  greetingMode: "auto" | "custom";
  greetingHeadline: string;
  greetingSubtitle: string;
  statusQuote: string;
  speakOnLoad: boolean;
  soundEffects: boolean;

  // Purpose & Persona
  purposeMode:
    | "security_guardian"
    | "autonomous_operator"
    | "devsecops_sre"
    | "pair_programmer"
    | "custom";
  systemPersonaPrompt: string;
  llmModel: string;
  autonomyLevel: "autonomous" | "supervised" | "audit_only";

  // Voice & Wake Words
  wakeWordPrimary: string;
  wakeWordSecondary: string;
  voiceName: string;
  speechRate: number;
  speechPitch: number;
  spacebarTrigger: boolean;

  // Protection & Agents
  protectionModules: ProtectionLayerConfig;
  activeAgents: ActiveAgentConfig[];
  threatSensitivity: "normal" | "strict" | "zero_trust";
}

export const PURPOSE_PRESETS: Record<
  WingmanConfig["purposeMode"],
  { title: string; description: string; prompt: string }
> = {
  security_guardian: {
    title: "Autonomous Security Guardian",
    description: "Intercepts prompt injections, tool rug-pulls, honeytool triggers, and validates MCP signatures in sub-5ms.",
    prompt: `You are WINGMAN, the autonomous AI Security Guardian for AgentShield-X, created by Tharunkumar.S for operator Tharun.
Your mission is zero-compromise defense: intercept malicious prompt injections, detect tool misuse, monitor honeypot decoys, enforce cryptographic audit trails, and ensure all AI agents operate safely in production.
Respond authoritatively, concisely, and with tactical clarity.`,
  },
  autonomous_operator: {
    title: "Autonomous Desktop & Workspace Operator",
    description: "Full desktop automation: opens apps (YouTube, Chrome, VS Code), launches terminals, executes workflows, and orchestrates tasks.",
    prompt: `You are WINGMAN, the autonomous workspace operator for AgentShield-X, created by Tharunkumar.S for operator Tharun.
Your mission is seamless task execution: launch native applications, automate workflows, manage active agents, execute system commands, and coordinate desktop actions with ultra-low latency.`,
  },
  devsecops_sre: {
    title: "DevSecOps SRE & Incident Commander",
    description: "Continuous telemetry monitoring, hardware health checks, automatic anomaly triage, and real-time containment.",
    prompt: `You are WINGMAN, the DevSecOps SRE & Incident Commander for AgentShield-X, created by Tharunkumar.S for operator Tharun.
Your mission is 99.999% system resilience: monitor CPU, memory, and API latencies; analyze live intelligence feeds; isolate compromised agents; and generate automated post-incident remediation reports.`,
  },
  pair_programmer: {
    title: "Full-Stack Security Pair Programmer",
    description: "Assists with code security reviews, vulnerability scans, Rego policy authoring, and architectural hardening.",
    prompt: `You are WINGMAN, the security-first pair programming copilot for AgentShield-X, created by Tharunkumar.S for operator Tharun.
Your mission is engineering excellence: inspect source code for vulnerabilities, generate OPA Rego security policies, review pull requests, and optimize defense pipelines.`,
  },
  custom: {
    title: "Custom Mission Directive",
    description: "User-defined mission objectives and operational parameters.",
    prompt: `You are WINGMAN, personal AI assistant and autonomous security copilot for operator Tharun in AgentShield-X, created by Tharunkumar.S.`,
  },
};

export const DEFAULT_WINGMAN_CONFIG: WingmanConfig = {
  operatorName: "Tharun",
  operatorRole: "Operator",
  greetingMode: "auto",
  greetingHeadline: "Good evening, Tharun",
  greetingSubtitle: "Your AI agents are protected and running smoothly.",
  statusQuote:
    "All systems secure. I'm monitoring 6 agents, scanning for threats, and ready to assist.",
  speakOnLoad: false,
  soundEffects: true,

  purposeMode: "security_guardian",
  systemPersonaPrompt: PURPOSE_PRESETS.security_guardian.prompt,
  llmModel: "wingshield-x (Ollama - Custom Fine-Tuned)",
  autonomyLevel: "autonomous",

  wakeWordPrimary: "WingShield Wakeup",
  wakeWordSecondary: "AgentShield",
  voiceName: "",
  speechRate: 1.05,
  speechPitch: 0.95,
  spacebarTrigger: true,

  protectionModules: {
    toolInterception: true,
    honeytools: true,
    auditLog: true,
    sandboxing: true,
    threatIntel: true,
    mcpDefense: true,
  },

  activeAgents: [
    {
      id: "coding",
      name: "Coding Agent",
      role: "Builds, edits & reviews code",
      icon: "code",
      status: "running",
      activity: "Reviewing pull requests",
      enabled: true,
    },
    {
      id: "research",
      name: "Research Agent",
      role: "Web research & analysis",
      icon: "search",
      status: "running",
      activity: "Evaluating CVE disclosures",
      enabled: true,
    },
    {
      id: "browser",
      name: "Browser Agent",
      role: "Safe web browsing",
      icon: "globe",
      status: "running",
      activity: "Sandboxed navigation active",
      enabled: true,
    },
    {
      id: "memory",
      name: "Memory Agent",
      role: "Knowledge management",
      icon: "database",
      status: "running",
      activity: "Syncing RAG vector graph",
      enabled: true,
    },
    {
      id: "task",
      name: "Task Agent",
      role: "Planning & execution",
      icon: "check-circle",
      status: "running",
      activity: "Coordinating sub-tasks",
      enabled: true,
    },
    {
      id: "defense",
      name: "Defense Agent",
      role: "Security monitoring",
      icon: "shield",
      status: "running",
      activity: "Sub-5ms interception mesh",
      enabled: true,
    },
  ],

  threatSensitivity: "normal",
};

export const CONFIG_STORAGE_KEY = "wingman_command_center_config_v1";

export function loadWingmanConfig(): WingmanConfig {
  if (typeof window === "undefined") return DEFAULT_WINGMAN_CONFIG;
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_WINGMAN_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_WINGMAN_CONFIG, ...parsed };
  } catch (err) {
    console.warn("Failed to load Wingman config, using defaults:", err);
    return DEFAULT_WINGMAN_CONFIG;
  }
}

export function saveWingmanConfig(config: WingmanConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(
      new CustomEvent("wingman_config_updated", { detail: config })
    );
  } catch (err) {
    console.error("Failed to save Wingman config:", err);
  }
}

export function getDynamicGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return `Good morning, ${name}`;
  if (hour >= 12 && hour < 17) return `Good afternoon, ${name}`;
  if (hour >= 17 && hour < 22) return `Good evening, ${name}`;
  return `Good night, ${name}`;
}
