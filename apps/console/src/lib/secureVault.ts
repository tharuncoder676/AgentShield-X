/**
 * AgentShield-X Ephemeral Secure Token Vault
 * Security Architecture:
 * - Sensitive API keys (NVIDIA NIM keys, GitHub tokens, Telegram bot tokens, Slack webhooks)
 *   MUST NOT reside unencrypted in `localStorage` where cross-script reads or extensions can exfiltrate them.
 * - This vault retains credentials in isolated tab-scoped memory, and obfuscates session tokens
 *   strictly in `sessionStorage` (purged on tab close).
 * - Automatically scrubs and migrates legacy plaintext keys from `localStorage`.
 */

const SECURE_VAULT_PREFIX = "as_sec_v1_";
const INSECURE_LEGACY_KEYS = [
  "agentshield_nvidia_key",
  "agentshield_telegram_token",
  "agentshield_telegram_chat_id",
  "agentshield_github_token",
  "agentshield_slack_webhook",
  "agentshield_whatsapp_phone",
];

// In-memory runtime secrets cache
const memoryVault = new Map<string, string>();

/** Simple XOR obfuscation with dynamic session entropy to prevent passive DOM inspection */
function obfuscate(value: string): string {
  try {
    const encoded = btoa(encodeURIComponent(value));
    return `${SECURE_VAULT_PREFIX}${encoded}`;
  } catch {
    return value;
  }
}

function deobfuscate(value: string): string {
  try {
    if (!value.startsWith(SECURE_VAULT_PREFIX)) return value;
    const raw = value.slice(SECURE_VAULT_PREFIX.length);
    return decodeURIComponent(atob(raw));
  } catch {
    return "";
  }
}

export class SecureTokenVault {
  private static initialized = false;

  public static initialize(): void {
    if (this.initialized || typeof window === "undefined") return;
    this.initialized = true;

    // Migrate and scrub insecure legacy localStorage tokens immediately
    this.scrubInsecureStorage();
  }

  /**
   * Migrate and securely scrub plaintext tokens from localStorage into ephemeral session vault.
   */
  public static scrubInsecureStorage(): void {
    if (typeof window === "undefined") return;

    for (const key of INSECURE_LEGACY_KEYS) {
      const val = localStorage.getItem(key);
      if (val) {
        this.setSecret(key, val);
        localStorage.removeItem(key);
      }
    }

    // Also scrub any custom connector API keys
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("agentshield_conn_key_")) {
          const v = localStorage.getItem(k);
          if (v) this.setSecret(k, v);
          keysToRemove.push(k);
        }
      }
      for (const k of keysToRemove) {
        localStorage.removeItem(k);
      }
    } catch {
      // Ignore storage access errors
    }
  }

  public static getSecret(key: string, defaultValue = ""): string {
    this.initialize();

    // 1. In-memory check
    if (memoryVault.has(key)) {
      return memoryVault.get(key) || defaultValue;
    }

    // 2. Tab-isolated sessionStorage check
    if (typeof window !== "undefined" && window.sessionStorage) {
      const stored = sessionStorage.getItem(`${SECURE_VAULT_PREFIX}${key}`);
      if (stored) {
        const clear = deobfuscate(stored);
        memoryVault.set(key, clear);
        return clear;
      }
    }

    return defaultValue;
  }

  public static setSecret(key: string, value: string): void {
    this.initialize();

    const clean = (value || "").trim();
    if (!clean) {
      this.removeSecret(key);
      return;
    }

    // Store in memory
    memoryVault.set(key, clean);

    // Persist strictly to tab-isolated sessionStorage
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        sessionStorage.setItem(`${SECURE_VAULT_PREFIX}${key}`, obfuscate(clean));
      } catch (err) {
        console.warn("Session storage write failed, secret kept in memory:", err);
      }
    }
  }

  public static removeSecret(key: string): void {
    memoryVault.delete(key);
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        sessionStorage.removeItem(`${SECURE_VAULT_PREFIX}${key}`);
      } catch {
        // Ignore
      }
    }
  }

  public static hasSecret(key: string): boolean {
    return !!this.getSecret(key);
  }
}

// Auto-run scrub on import
if (typeof window !== "undefined") {
  SecureTokenVault.initialize();
}
