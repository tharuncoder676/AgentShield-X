export interface ShieldWingBot {
  id: string;
  name: string;
  role: "calendar" | "sales" | "dev" | "content";
  roleTitle: string;
  avatar: string;
  avatarLg: string;
  avatarBg: string;
  channels: string[];
  tone: string;
  trustBoundaryRule: string;
  status: "active" | "idle" | "paused";
  routineActionsCount: number;
  consequentialPausedCount: number;
  createdAt: string;
  capabilities: {
    calendarBalancing: boolean;
    inboxDraftBuffer: boolean;
    leadOutreachPacing: boolean;
    githubPagesDeploy: boolean;
    autoUnsubscribe: boolean;
  };
}

export interface ShieldWingIntegration {
  id: string;
  name: string;
  category: "email" | "calendar" | "crm" | "code" | "messaging";
  iconName: string;
  connected: boolean;
  lastSynced: string;
  permissions: string[];
  singleTapRevocable: boolean;
}

export const DEFAULT_INTEGRATIONS: ShieldWingIntegration[] = [
  {
    id: "gmail",
    name: "Gmail",
    category: "email",
    iconName: "Mail",
    connected: true,
    lastSynced: "2 mins ago",
    permissions: ["Read metadata", "Draft replies (Safety Buffer)"],
    singleTapRevocable: true
  },
  {
    id: "gcal",
    name: "Google Calendar",
    category: "calendar",
    iconName: "Calendar",
    connected: true,
    lastSynced: "Just now",
    permissions: ["Read availability", "Create focus blocks"],
    singleTapRevocable: true
  },
  {
    id: "outlook",
    name: "Microsoft Outlook",
    category: "email",
    iconName: "Mail",
    connected: true,
    lastSynced: "15 mins ago",
    permissions: ["Read emails", "Schedule appointments"],
    singleTapRevocable: true
  },
  {
    id: "slack",
    name: "Slack Workspaces",
    category: "messaging",
    iconName: "MessageSquare",
    connected: true,
    lastSynced: "Just now",
    permissions: ["Listen to mentions", "Post digests"],
    singleTapRevocable: true
  },
  {
    id: "github",
    name: "GitHub",
    category: "code",
    iconName: "Code2",
    connected: true,
    lastSynced: "5 mins ago",
    permissions: ["Read PRs", "Deploy to GitHub Pages", "AST Linter"],
    singleTapRevocable: true
  },
  {
    id: "hubspot",
    name: "HubSpot CRM",
    category: "crm",
    iconName: "Users",
    connected: true,
    lastSynced: "1 hour ago",
    permissions: ["Update lead stages", "Log pre-call dossiers"],
    singleTapRevocable: true
  },
  {
    id: "whatsapp",
    name: "WhatsApp Native",
    category: "messaging",
    iconName: "Smartphone",
    connected: true,
    lastSynced: "Live Webhook",
    permissions: ["Inbound instructions", "Consequential action confirmation"],
    singleTapRevocable: true
  },
  {
    id: "telegram",
    name: "Telegram Bot",
    category: "messaging",
    iconName: "Send",
    connected: true,
    lastSynced: "Live Bot API",
    permissions: ["Chat prompts", "One-click approval gates"],
    singleTapRevocable: true
  }
];

export const AVATAR_OPTIONS = [
  {
    id: "avatar-suit",
    label: "Suit / Executive & Sales",
    src: "/avatars/avatar-suit.png",
    largeSrc: "/avatars/avatar-suit.png",
    ringColor: "#3b82f6",
    bg: "bg-[#1e1b4b]"
  },
  {
    id: "avatar-detective",
    label: "Detective / Research & Dev",
    src: "/avatars/avatar-detective.png",
    largeSrc: "/avatars/avatar-detective.png",
    ringColor: "#10b981",
    bg: "bg-[#064e3b]"
  },
  {
    id: "avatar-orange-hoodie",
    label: "Orange Hoodie / Creator & Growth",
    src: "/avatars/avatar-orange-hoodie.png",
    largeSrc: "/avatars/avatar-orange-hoodie-lg.png",
    ringColor: "#f59e0b",
    bg: "bg-[#fed7aa]"
  },
  {
    id: "avatar-headphones",
    label: "Headphones / Support & Social",
    src: "/avatars/avatar-headphones.png",
    largeSrc: "/avatars/avatar-headphones.png",
    ringColor: "#ec4899",
    bg: "bg-[#831843]"
  },
  {
    id: "avatar-operator",
    label: "Operator / Calendar & Ops",
    src: "/avatars/avatar-operator.png",
    largeSrc: "/avatars/avatar-operator.png",
    ringColor: "#a855f7",
    bg: "bg-[#3b0764]"
  }
];

export const ROLE_PRESETS = [
  {
    id: "calendar",
    name: "Executive Inbox & Calendar",
    defaultName: "Atlas",
    avatarIndex: 4, // operator
    desc: "Triages overnight messages, balances daily focus blocks, drafts replies with safety buffers. WhatsApp morning briefing.",
    defaultChannels: ["Gmail", "Google Calendar", "WhatsApp"],
    tone: "Executive Concise",
    boundary: "Invites to >5 external people require confirmation",
    capabilities: {
      calendarBalancing: true,
      inboxDraftBuffer: true,
      leadOutreachPacing: false,
      githubPagesDeploy: false,
      autoUnsubscribe: true
    }
  },
  {
    id: "sales",
    name: "Sales & Cold Outreach Pipeline",
    defaultName: "Echo",
    avatarIndex: 0, // suit
    desc: "Extracts verified leads, drafts personalized copy, and runs automated timed outreach with anti-spam pacing.",
    defaultChannels: ["HubSpot", "Outlook", "Telegram"],
    tone: "Warm Professional",
    boundary: "Outbound blasts to >25 leads require confirmation",
    capabilities: {
      calendarBalancing: false,
      inboxDraftBuffer: true,
      leadOutreachPacing: true,
      githubPagesDeploy: false,
      autoUnsubscribe: false
    }
  },
  {
    id: "dev",
    name: "Technical & GitHub Deployment",
    defaultName: "Cipher",
    avatarIndex: 1, // detective
    desc: "AST security linting, unpinned MCP audits, automated PR reviews, and 1-click deployments to GitHub Pages.",
    defaultChannels: ["GitHub", "MCP Protocol", "Slack"],
    tone: "Technical Crisp",
    boundary: "Production merges and secret rotations require confirmation",
    capabilities: {
      calendarBalancing: false,
      inboxDraftBuffer: false,
      leadOutreachPacing: false,
      githubPagesDeploy: true,
      autoUnsubscribe: false
    }
  },
  {
    id: "content",
    name: "Growth & Content Creator",
    defaultName: "Nova",
    avatarIndex: 2, // orange hoodie
    desc: "Monitors niche trends on Twitter/X & LinkedIn, drafts voice-matched social posts, compiles reports.",
    defaultChannels: ["Twitter/X", "LinkedIn", "iMessage"],
    tone: "Engaging Analytical",
    boundary: "Public live post publishing requires confirmation",
    capabilities: {
      calendarBalancing: false,
      inboxDraftBuffer: true,
      leadOutreachPacing: true,
      githubPagesDeploy: false,
      autoUnsubscribe: true
    }
  }
];
