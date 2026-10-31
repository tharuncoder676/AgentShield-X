 import React, { useState } from "react";
import {
  X,
  Check,
  Send,
  MessageSquare,
  Smartphone,
  Mail,
  Calendar,
  Lock,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Shield,
  Key
} from "lucide-react";

interface ChannelSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChannelSetupModal: React.FC<ChannelSetupModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<"telegram" | "whatsapp" | "google">("telegram");

  // Telegram state
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramTestStatus, setTelegramTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
    botUsername?: string;
  }>({ loading: false });
  const [telegramSendStatus, setTelegramSendStatus] = useState<string | null>(null);

  // WhatsApp state
  const [waPhoneId, setWaPhoneId] = useState("");
  const [waToken, setWaToken] = useState("");
  const [waTargetPhone, setWaTargetPhone] = useState("");
  const [waSendStatus, setWaSendStatus] = useState<string | null>(null);
  const [waLoading, setWaLoading] = useState(false);

  // Google state
  const [googleStatus, setGoogleStatus] = useState<string | null>(null);
  const [gmailUnreadResult, setGmailUnreadResult] = useState<any[] | null>(null);
  const [gmailLoading, setGmailLoading] = useState(false);

  if (!isOpen) return null;

  // 1. Test Telegram Token via real backend API
  const handleTestTelegram = async () => {
    if (!telegramToken.trim()) return;
    setTelegramTestStatus({ loading: true });
    try {
      const res = await fetch("http://127.0.0.1:8002/v1/shieldwing/channels/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_token: telegramToken.trim() })
      });
      const data = await res.json();
      if (data.connected) {
        setTelegramTestStatus({
          loading: false,
          success: true,
          message: `Connected to @${data.bot_username} (${data.bot_name})`,
          botUsername: data.bot_username
        });
      } else {
        setTelegramTestStatus({
          loading: false,
          success: false,
          message: data.error || "Failed to connect to Telegram"
        });
      }
    } catch (err: any) {
      setTelegramTestStatus({
        loading: false,
        success: false,
        message: err.message || "Network error"
      });
    }
  };

  // 2. Send Real Telegram Test Alert with Approval Buttons
  const handleSendTelegramAlert = async () => {
    if (!telegramChatId.trim()) return;
    setTelegramSendStatus("Sending test alert with approval buttons to your Telegram...");
    try {
      const res = await fetch("http://127.0.0.1:8002/v1/shieldwing/channels/telegram/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bot_token: telegramToken.trim() || undefined,
          chat_id: telegramChatId.trim(),
          text: "🛡️ *AgentShield-X Trust Boundary Test Alert*\n\nShieldWing intercepted a consequential action. Tap a button below to confirm or reject on your phone.",
          include_approval_buttons: true
        })
      });
      const data = await res.json();
      if (data.ok) {
        setTelegramSendStatus("✅ Message delivered to your Telegram app! Check your phone.");
      } else {
        setTelegramSendStatus(`Error: ${data.description || "Could not deliver message"}`);
      }
    } catch (err: any) {
      setTelegramSendStatus(`Error: ${err.message}`);
    }
  };

  // 3. Send Real WhatsApp Test Message
  const handleSendWhatsAppMessage = async () => {
    if (!waTargetPhone.trim()) return;
    setWaLoading(true);
    setWaSendStatus(null);
    try {
      const res = await fetch("http://127.0.0.1:8002/v1/shieldwing/channels/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number_id: waPhoneId.trim() || undefined,
          access_token: waToken.trim() || undefined,
          to_phone: waTargetPhone.trim(),
          message: "🛡️ Hello from ShieldWing! Your WhatsApp connection is active and protected by AgentShield-X Trust Boundaries.",
          is_interactive: true
        })
      });
      const data = await res.json();
      setWaLoading(false);
      if (data.messages || data.status === "simulated") {
        setWaSendStatus(`✅ Dispatched to ${waTargetPhone}: ${data.message || "Delivered via Meta Cloud API"}`);
      } else {
        setWaSendStatus(`Meta API Response: ${JSON.stringify(data)}`);
      }
    } catch (err: any) {
      setWaLoading(false);
      setWaSendStatus(`Error: ${err.message}`);
    }
  };

  // 4. Test Gmail Unread Scanner
  const handleFetchGmailUnread = async () => {
    setGmailLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8002/v1/shieldwing/channels/gmail/unread");
      const data = await res.json();
      setGmailLoading(false);
      setGmailUnreadResult(data);
    } catch (err: any) {
      setGmailLoading(false);
      setGoogleStatus(`Error fetching emails: ${err.message}`);
    }
  };

  // 5. Test Creating Real Draft in Gmail
  const handleCreateGmailDraft = async () => {
    setGoogleStatus("Creating email draft with 15-minute safety buffer...");
    try {
      const res = await fetch("http://127.0.0.1:8002/v1/shieldwing/channels/gmail/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "partner@enterprise.com",
          subject: "ShieldWing Automated Follow-up (Safety Buffer Active)",
          body: "Hello! ShieldWing prepared this response autonomously with a 15-minute safety buffer before sending."
        })
      });
      const data = await res.json();
      setGoogleStatus(`✅ Draft created successfully: ${data.message || "Saved in Drafts folder"}`);
    } catch (err: any) {
      setGoogleStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#141518] border border-[#2a2d34] rounded-[28px] p-6 sm:p-8 shadow-2xl shadow-purple-950/40 text-left my-6 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#202226] text-[#a9a9aa] hover:text-white hover:bg-[#2c2f36] flex items-center justify-center transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title */}
        <div className="mb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full bg-[#1e1430] border border-[#a855f7]/40 text-[#c084fc] text-[10px] font-mono uppercase mb-2">
            <span>LIVE CHANNELS & OAUTH GATEWAY</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1.5 font-sans">
            Connect Real Channels
          </h2>
          <p className="text-xs sm:text-sm text-[#9ba1a6] leading-relaxed font-sans">
            Configure and test live messaging webhooks for Telegram, WhatsApp, and Google Workspace (Gmail + Calendar).
          </p>
        </div>

        {/* Channel Tabs */}
        <div className="flex border-b border-[#23262c] gap-2 mb-6 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("telegram")}
            className={`pb-3 px-3 flex items-center space-x-2 transition-all border-b-2 ${
              activeTab === "telegram"
                ? "border-[#a855f7] text-white font-bold"
                : "border-transparent text-[#9ba1a6] hover:text-white"
            }`}
          >
            <Send className="w-4 h-4 text-[#38bdf8]" />
            <span>Telegram Bot API</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("whatsapp")}
            className={`pb-3 px-3 flex items-center space-x-2 transition-all border-b-2 ${
              activeTab === "whatsapp"
                ? "border-[#a855f7] text-white font-bold"
                : "border-transparent text-[#9ba1a6] hover:text-white"
            }`}
          >
            <Smartphone className="w-4 h-4 text-[#22c55e]" />
            <span>WhatsApp Cloud API</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("google")}
            className={`pb-3 px-3 flex items-center space-x-2 transition-all border-b-2 ${
              activeTab === "google"
                ? "border-[#a855f7] text-white font-bold"
                : "border-transparent text-[#9ba1a6] hover:text-white"
            }`}
          >
            <Mail className="w-4 h-4 text-[#f59e0b]" />
            <span>Gmail & Google Calendar</span>
          </button>
        </div>

        {/* 1. TELEGRAM TAB */}
        {activeTab === "telegram" && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-[#0d0e11] border border-[#2a2d34] text-xs font-sans space-y-2">
              <div className="font-bold text-white flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                <span>How to connect your Telegram Bot in 30 seconds:</span>
              </div>
              <ol className="list-decimal list-inside text-[#9ba1a6] space-y-1 text-[11px] leading-relaxed">
                <li>Open Telegram and message <strong>@BotFather</strong> to create a new bot.</li>
                <li>Copy the HTTP API Bot Token provided by @BotFather.</li>
                <li>Paste the token below and click <strong>Test Connection</strong>.</li>
              </ol>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#9ba1a6] mb-1.5 uppercase tracking-wider">
                Telegram Bot Token
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  placeholder="e.g. 7123456789:ABCdefGhIjkLmNoPqRsTuVwXyZ"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0d0e11] border border-[#2a2d34] text-white text-xs font-mono focus:outline-none focus:border-[#a855f7] transition-all"
                />
                <button
                  type="button"
                  onClick={handleTestTelegram}
                  disabled={!telegramToken.trim() || telegramTestStatus.loading}
                  className="px-4 py-2.5 rounded-xl bg-[#1f1638] border border-[#a855f7] text-[#c084fc] hover:text-white hover:bg-[#a855f7] font-mono text-xs transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {telegramTestStatus.loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                  <span>Test Connection</span>
                </button>
              </div>

              {telegramTestStatus.message && (
                <div className={`mt-2 p-2.5 rounded-lg text-xs font-mono flex items-center space-x-2 ${
                  telegramTestStatus.success
                    ? "bg-green-950/40 text-green-300 border border-green-500/40"
                    : "bg-red-950/40 text-red-300 border border-red-500/40"
                }`}>
                  {telegramTestStatus.success ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
                  <span>{telegramTestStatus.message}</span>
                </div>
              )}
            </div>

            {/* Test Send to Chat */}
            <div className="pt-3 border-t border-[#23262c]">
              <label className="block text-[11px] font-mono text-[#9ba1a6] mb-1.5 uppercase tracking-wider">
                Send Real Test Notification to Your Telegram Chat ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="Your Telegram User/Chat ID (e.g. 123456789)"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#0d0e11] border border-[#2a2d34] text-white text-xs font-mono focus:outline-none focus:border-[#a855f7] transition-all"
                />
                <button
                  type="button"
                  onClick={handleSendTelegramAlert}
                  disabled={!telegramChatId.trim()}
                  className="px-4 py-2 rounded-xl bg-[#22c55e] text-black font-bold font-sans text-xs hover:bg-[#16a34a] transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Test Alert</span>
                </button>
              </div>

              {telegramSendStatus && (
                <div className="mt-2 text-xs font-mono text-[#c084fc] p-2 rounded bg-[#0d0e11] border border-[#2a2d34]">
                  {telegramSendStatus}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. WHATSAPP TAB */}
        {activeTab === "whatsapp" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#0d0e11] border border-[#2a2d34] text-xs font-sans space-y-2">
              <div className="font-bold text-white flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                <span>Meta WhatsApp Business Cloud API Gateway</span>
              </div>
              <p className="text-[#9ba1a6] text-[11px] leading-relaxed">
                Connect your WhatsApp Business number for instant 2-way conversation and 1-click confirmation buttons.
              </p>
              <div className="p-2 rounded bg-[#141518] text-[10px] font-mono text-[#a855f7]">
                Meta Webhook URL: <code className="text-white">http://127.0.0.1:8002/v1/shieldwing/webhooks/whatsapp</code>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-[#9ba1a6] mb-1.5 uppercase tracking-wider">
                  Phone Number ID
                </label>
                <input
                  type="text"
                  value={waPhoneId}
                  onChange={(e) => setWaPhoneId(e.target.value)}
                  placeholder="e.g. 1045239851234"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0d0e11] border border-[#2a2d34] text-white text-xs font-mono focus:outline-none focus:border-[#a855f7] transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#9ba1a6] mb-1.5 uppercase tracking-wider">
                  System User Access Token
                </label>
                <input
                  type="password"
                  value={waToken}
                  onChange={(e) => setWaToken(e.target.value)}
                  placeholder="EAAG..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0d0e11] border border-[#2a2d34] text-white text-xs font-mono focus:outline-none focus:border-[#a855f7] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#9ba1a6] mb-1.5 uppercase tracking-wider">
                Recipient Phone Number (with Country Code)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={waTargetPhone}
                  onChange={(e) => setWaTargetPhone(e.target.value)}
                  placeholder="+14155552671"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#0d0e11] border border-[#2a2d34] text-white text-xs font-mono focus:outline-none focus:border-[#a855f7] transition-all"
                />
                <button
                  type="button"
                  onClick={handleSendWhatsAppMessage}
                  disabled={!waTargetPhone.trim() || waLoading}
                  className="px-4 py-2 rounded-xl bg-[#22c55e] text-black font-bold font-sans text-xs hover:bg-[#16a34a] transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {waLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5" />}
                  <span>Send Real WhatsApp</span>
                </button>
              </div>

              {waSendStatus && (
                <div className="mt-2 text-xs font-mono text-[#22c55e] p-2.5 rounded bg-[#082813]/60 border border-[#22c55e]/40">
                  {waSendStatus}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. GOOGLE WORKSPACE TAB */}
        {activeTab === "google" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#0d0e11] border border-[#2a2d34] text-xs font-sans space-y-2">
              <div className="font-bold text-white flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                <span>Google Workspace (Gmail & Calendar API)</span>
              </div>
              <p className="text-[#9ba1a6] text-[11px] leading-relaxed">
                Connect your Google account via OAuth 2.0 to scan unreplied messages, write drafts to your Drafts folder with a 15-minute safety buffer, and balance daily focus time blocks.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleFetchGmailUnread}
                disabled={gmailLoading}
                className="p-3 rounded-xl bg-[#141518] border border-[#2a2d34] hover:border-[#a855f7] text-white text-xs font-sans text-left transition-all space-y-1"
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Scan Unread Emails</span>
                  {gmailLoading && <RefreshCw className="w-3 h-3 animate-spin text-[#a855f7]" />}
                </div>
                <div className="text-[10px] text-[#9ba1a6]">Fetches unreplied client emails via Gmail API</div>
              </button>

              <button
                type="button"
                onClick={handleCreateGmailDraft}
                className="p-3 rounded-xl bg-[#141518] border border-[#2a2d34] hover:border-[#a855f7] text-white text-xs font-sans text-left transition-all space-y-1"
              >
                <div className="font-bold">Save Draft with Safety Buffer</div>
                <div className="text-[10px] text-[#9ba1a6]">Creates contextual response in Drafts folder</div>
              </button>
            </div>

            {googleStatus && (
              <div className="p-2.5 rounded-lg bg-[#141518] border border-[#a855f7]/40 text-xs font-mono text-[#c084fc]">
                {googleStatus}
              </div>
            )}

            {gmailUnreadResult && (
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-mono text-[#9ba1a6] uppercase tracking-wider">
                  Unread Messages Scanned:
                </div>
                {gmailUnreadResult.map((email: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-[#08090b] border border-[#2a2d34] text-xs font-sans">
                    <div className="text-white font-medium">{email.subject}</div>
                    <div className="text-[#a9a9aa] text-[10px] flex justify-between mt-0.5">
                      <span>From: {email.from}</span>
                      <span className="text-[#a855f7] font-mono">Unreplied</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Note */}
        <div className="pt-5 border-t border-[#23262c] flex items-center justify-between text-xs font-mono text-[#9ba1a6]">
          <div className="flex items-center space-x-1.5 text-[#22c55e]">
            <Shield className="w-3.5 h-3.5" />
            <span>Single-Tap Revocable Anytime</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#202226] hover:bg-[#2c2f36] text-white transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

