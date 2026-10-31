import React, { useState } from "react";
import {
  X,
  Check,
  Sparkles,
  Calendar,
  Users,
  Code2,
  Share2,
  Shield,
  MessageSquare,
  Lock,
  ArrowRight,
  ChevronRight,
  AlertTriangle,
  Send,
  RefreshCw,
  Mail,
  Zap,
  Globe,
  Sliders,
  CheckCircle2
} from "lucide-react";
import {
  ShieldWingBot,
  AVATAR_OPTIONS,
  ROLE_PRESETS,
  DEFAULT_INTEGRATIONS,
  ShieldWingIntegration
} from "../types/shieldwing";

export type { ShieldWingBot };

interface NewWingmanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBot: (bot: ShieldWingBot) => void;
  activeBotsCount?: number;
}

export const NewWingmanModal: React.FC<NewWingmanModalProps> = ({
  isOpen,
  onClose,
  onCreateBot,
  activeBotsCount = 2
}) => {
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>("avatar-orange-hoodie");
  const [selectedRole, setSelectedRole] = useState<"calendar" | "sales" | "dev" | "content">("content");
  const [botName, setBotName] = useState<string>("Nova");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["WhatsApp", "Twitter/X", "LinkedIn"]);
  const [tone, setTone] = useState<string>("Engaging Analytical");

  // Granular Automation Capabilities
  const [capabilities, setCapabilities] = useState({
    calendarBalancing: true,
    inboxDraftBuffer: true,
    leadOutreachPacing: true,
    githubPagesDeploy: true,
    autoUnsubscribe: true
  });

  if (!isOpen) return null;

  const currentAvatar = AVATAR_OPTIONS.find((a) => a.id === selectedAvatarId) || AVATAR_OPTIONS[2];

  const handleRoleSelect = (roleId: "calendar" | "sales" | "dev" | "content") => {
    setSelectedRole(roleId);
    const preset = ROLE_PRESETS.find((p) => p.id === roleId);
    if (preset) {
      setBotName(preset.defaultName);
      setSelectedChannels(preset.defaultChannels);
      setTone(preset.tone);
      setSelectedAvatarId(AVATAR_OPTIONS[preset.avatarIndex].id);
      if (preset.capabilities) {
        setCapabilities(preset.capabilities);
      }
    }
  };

  const toggleChannel = (channel: string) => {
    if (selectedChannels.includes(channel)) {
      setSelectedChannels(selectedChannels.filter((c) => c !== channel));
    } else {
      setSelectedChannels([...selectedChannels, channel]);
    }
  };

  const toggleCapability = (key: keyof typeof capabilities) => {
    setCapabilities((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const preset = ROLE_PRESETS.find((p) => p.id === selectedRole);
    const newBot: ShieldWingBot = {
      id: `wing_${Date.now()}`,
      name: botName.trim() || (preset ? preset.defaultName : "Wingman"),
      role: selectedRole,
      roleTitle: preset ? preset.name : "Custom Operator",
      avatar: currentAvatar.src,
      avatarLg: currentAvatar.largeSrc,
      avatarBg: currentAvatar.bg,
      channels: selectedChannels.length > 0 ? selectedChannels : ["WhatsApp"],
      tone: tone,
      trustBoundaryRule: preset ? preset.boundary : "Consequential operations require 1-click human confirmation",
      status: "active",
      routineActionsCount: 0,
      consequentialPausedCount: 0,
      createdAt: new Date().toISOString(),
      capabilities
    };

    onCreateBot(newBot);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      {/* Modal Container: Matches User's Uploaded Wingman Creation Screen */}
      <div className="relative w-full max-w-xl bg-[#141518] border border-[#2a2d34] rounded-[28px] p-6 sm:p-8 shadow-2xl shadow-purple-950/40 text-center my-6 max-h-[90vh] overflow-y-auto">
        
        {/* Top Close Button (X in circle) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#202226] text-[#a9a9aa] hover:text-white hover:bg-[#2c2f36] flex items-center justify-center transition-all z-10"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header Title & Subtitle */}
        <div className="mb-4">
          <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full bg-[#1e1430] border border-[#a855f7]/40 text-[#c084fc] text-[10px] font-mono uppercase mb-2">
            <span>Active Instance Slots: {activeBotsCount}/3 Allocated</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1.5 font-sans">
            New Wingman
          </h2>
          <p className="text-xs sm:text-sm text-[#9ba1a6] max-w-sm mx-auto leading-relaxed font-sans">
            Setup unique assistants to manage your growth, creativity, or daily essentials.
          </p>
        </div>

        {/* Avatar Selection Section */}
        <div className="mb-6">
          <div className="text-xs font-medium text-[#9ba1a6] mb-3 font-sans">
            Select your avatar
          </div>

          {/* Large Preview Avatar */}
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 mx-auto mb-4 rounded-[24px] overflow-hidden shadow-2xl shadow-black/70 border border-white/10 group">
            <img
              src={currentAvatar.largeSrc}
              alt={currentAvatar.label}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* Subtle glow highlight */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Horizontal 5 Avatar Options Picker */}
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            {AVATAR_OPTIONS.map((avatar) => {
              const isSelected = avatar.id === selectedAvatarId;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setSelectedAvatarId(avatar.id)}
                  className={`relative rounded-full transition-all duration-200 p-0.5 ${
                    isSelected
                      ? "ring-2 ring-white scale-110 shadow-lg shadow-white/30"
                      : "opacity-60 hover:opacity-100 hover:scale-105"
                  }`}
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-[#202226] border border-white/20">
                    <img
                      src={avatar.src}
                      alt={avatar.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSubmit} className="text-left space-y-4 pt-4 border-t border-[#23262c]">
          
          {/* Bot Name & Role Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-[#9ba1a6] mb-1.5 uppercase tracking-wider">
                Wingman Name
              </label>
              <input
                type="text"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                placeholder="e.g. Atlas, Nova, Echo"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-[#0d0e11] border border-[#2a2d34] text-white text-xs font-sans focus:outline-none focus:border-[#a855f7] transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#9ba1a6] mb-1.5 uppercase tracking-wider">
                Operating Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => handleRoleSelect(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-[#0d0e11] border border-[#2a2d34] text-white text-xs font-sans focus:outline-none focus:border-[#a855f7] transition-all"
              >
                {ROLE_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Core Automation Capabilities Flow */}
          <div>
            <label className="block text-[11px] font-mono text-[#9ba1a6] mb-2 uppercase tracking-wider">
              Automated Capabilities & Flow
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => toggleCapability("calendarBalancing")}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-start space-x-2 ${
                  capabilities.calendarBalancing
                    ? "bg-[#1f1638] border-[#a855f7] text-white"
                    : "bg-[#0d0e11] border-[#2a2d34] text-[#a9a9aa]"
                }`}
              >
                <Calendar className="w-4 h-4 text-[#a855f7] mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-[11px]">Calendar & Schedule Balancing</div>
                  <div className="text-[10px] text-[#9ba1a6]">Fits focus time & video syncs into tight blocks</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => toggleCapability("inboxDraftBuffer")}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-start space-x-2 ${
                  capabilities.inboxDraftBuffer
                    ? "bg-[#1f1638] border-[#a855f7] text-white"
                    : "bg-[#0d0e11] border-[#2a2d34] text-[#a9a9aa]"
                }`}
              >
                <Mail className="w-4 h-4 text-[#3b82f6] mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-[11px]">Inbox Triage & Drafts Saver</div>
                  <div className="text-[10px] text-[#9ba1a6]">Drafts contextual replies with safety buffer</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => toggleCapability("leadOutreachPacing")}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-start space-x-2 ${
                  capabilities.leadOutreachPacing
                    ? "bg-[#1f1638] border-[#a855f7] text-white"
                    : "bg-[#0d0e11] border-[#2a2d34] text-[#a9a9aa]"
                }`}
              >
                <Users className="w-4 h-4 text-[#f59e0b] mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-[11px]">Lead Gen & Timed Outreach Pacing</div>
                  <div className="text-[10px] text-[#9ba1a6]">Throttled campaigns to avoid spam filters</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => toggleCapability("githubPagesDeploy")}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-start space-x-2 ${
                  capabilities.githubPagesDeploy
                    ? "bg-[#1f1638] border-[#a855f7] text-white"
                    : "bg-[#0d0e11] border-[#2a2d34] text-[#a9a9aa]"
                }`}
              >
                <Code2 className="w-4 h-4 text-[#10b981] mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-[11px]">GitHub & GitHub Pages Deploy</div>
                  <div className="text-[10px] text-[#9ba1a6]">Manage repos & deploy with AST security gate</div>
                </div>
              </button>
            </div>
          </div>

          {/* Connect Channels: WhatsApp, Telegram, iMessage First */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono text-[#9ba1a6] uppercase tracking-wider">
                Messaging & 300+ Single-Click Tool OAuth
              </label>
              <span className="text-[10px] font-mono text-[#22c55e]">Single-Tap Revocable</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                "WhatsApp",
                "Telegram",
                "iMessage",
                "Slack",
                "Gmail",
                "Google Calendar",
                "GitHub",
                "HubSpot",
                "Twitter/X"
              ].map((channel) => {
                const isChecked = selectedChannels.includes(channel);
                return (
                  <button
                    key={channel}
                    type="button"
                    onClick={() => toggleChannel(channel)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-sans transition-all flex items-center space-x-1.5 ${
                      isChecked
                        ? "bg-[#a855f7]/20 border border-[#a855f7] text-white font-medium"
                        : "bg-[#0d0e11] border border-[#2a2d34] text-[#a9a9aa] hover:border-[#a855f7]/50"
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 text-[#a855f7]" />}
                    <span>{channel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tiered Action Safeguards / Trust Boundaries Callout */}
          <div className="p-3.5 rounded-xl bg-[#08090b] border border-[#2a2d34] text-xs font-mono space-y-1.5">
            <div className="text-[#22c55e] flex items-center justify-between font-bold text-[11px]">
              <div className="flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Tiered Action Safeguards: Enforcing (0.85ms SLA)</span>
              </div>
              <span className="text-[#a855f7] text-[10px]">Zero API Keys Needed</span>
            </div>
            <p className="text-[11px] text-[#9ba1a6] font-sans leading-relaxed">
              <strong>Routine tasks</strong> (calendar scans, drafts, unreplied emails) execute autonomously. <strong>Consequential tasks</strong> (sending bulk emails, modifying financial data, code merges) pause and require your explicit 1-tap confirmation via chat.
            </p>
          </div>

          {/* Action Button: Matches the User's Screenshot "Create New Wingman ->" */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-[#e2e8f0] text-black font-sans font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-white/10 hover:shadow-white/20 active:scale-[0.99]"
            >
              <span>Create New Wingman</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
