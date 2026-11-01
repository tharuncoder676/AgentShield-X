/**
 * Unified API URL Resolver for AgentShield-X Console
 * Ensures all HTTP/WebSocket calls resolve correctly across:
 * - Local Vite Dev Server with proxy (/v1 -> http://localhost:8002)
 * - Vercel Multi-Service Deployment with top-level path rewrites (/v1/(.*) -> control_api)
 * - Custom deployed backend environments via VITE_API_URL
 */

export function getApiBaseUrl(): string {
  if (typeof window === "undefined") return "";

  // 1. Explicit override via Vite environment variable
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) {
    return String(envUrl).replace(/\/+$/, "");
  }

  // 2. Local dev server running on port 3000 or 5173 without active proxy fallback
  // Note: Vite dev server in apps/console already has a proxy for /v1 -> http://127.0.0.1:8002.
  // Using relative path "" works cleanly in both dev (via Vite proxy) and production (via Vercel rewrites).
  return "";
}

/**
 * Returns a full or relative URL for the given API path.
 * e.g. apiUrl("/v1/auth/login") -> "/v1/auth/login" (or "http://localhost:8002/v1/auth/login" if VITE_API_URL set)
 */
export function apiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const clean = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${base}${clean}`;
}

/**
 * Returns WebSocket URL for streaming live decisions
 */
export function getWsUrl(path: string = "/v1/ws/decisions"): string {
  if (typeof window === "undefined") return "";

  const envWs = (import.meta as any).env?.VITE_WS_URL;
  if (envWs) {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${String(envWs).replace(/\/+$/, "")}${cleanPath}`;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${protocol}//${host}${cleanPath}`;
}

