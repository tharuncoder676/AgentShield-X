import {
  DecisionStreamPayload,
  ToolCallEvent,
  Decision,
  WebSocketMessageSchema,
} from "./types";

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting";

export interface DecisionStreamConfig {
  wsUrl?: string;
  token?: string | null;
  autoReconnect?: boolean;
  maxReconnectIntervalMs?: number;
  heartbeatTimeoutMs?: number;
}

export type DecisionCallback = (
  event: ToolCallEvent,
  decision: Decision,
  timestamp: string
) => void;

export type StatusCallback = (status: ConnectionStatus) => void;
export type ErrorCallback = (err: Error) => void;

export class DecisionStreamClient {
  private wsUrl: string;
  private token: string | null = null;
  private autoReconnect: boolean;
  private maxReconnectIntervalMs: number;
  private heartbeatTimeoutMs: number;

  private ws: WebSocket | null = null;
  private status: ConnectionStatus = "disconnected";
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private isExplicitlyClosed = false;

  private decisionListeners: Set<DecisionCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  private errorListeners: Set<ErrorCallback> = new Set();

  constructor(config: DecisionStreamConfig = {}) {
    this.wsUrl = config.wsUrl || "ws://localhost:8000/v1/ws/decisions";
    this.token = config.token || null;
    this.autoReconnect = config.autoReconnect ?? true;
    this.maxReconnectIntervalMs = config.maxReconnectIntervalMs || 15000;
    this.heartbeatTimeoutMs = config.heartbeatTimeoutMs || 35000;
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public setToken(token: string | null) {
    this.token = token;
  }

  public onDecision(cb: DecisionCallback): () => void {
    this.decisionListeners.add(cb);
    return () => this.decisionListeners.delete(cb);
  }

  public onStatusChange(cb: StatusCallback): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  public onError(cb: ErrorCallback): () => void {
    this.errorListeners.add(cb);
    return () => this.errorListeners.delete(cb);
  }

  private setStatus(newStatus: ConnectionStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      for (const listener of this.statusListeners) {
        try {
          listener(newStatus);
        } catch {
          // ignore callback error
        }
      }
    }
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitlyClosed = false;
    this.setStatus(this.reconnectAttempts > 0 ? "reconnecting" : "connecting");

    let url = this.wsUrl;
    if (this.token) {
      const separator = url.includes("?") ? "&" : "?";
      url = `${url}${separator}token=${encodeURIComponent(this.token)}`;
    }

    try {
      this.ws = new WebSocket(url);
    } catch (err: any) {
      this.handleSocketError(err);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.setStatus("connected");
      this.reconnectAttempts = 0;
      this.resetHeartbeatTimer();
    };

    this.ws.onmessage = (event) => {
      this.resetHeartbeatTimer();
      try {
        const raw = JSON.parse(event.data);
        const parsed = WebSocketMessageSchema.safeParse(raw);
        if (!parsed.success) {
          return;
        }

        const msg = parsed.data;
        if (msg.type === "ping") {
          // respond with pong if socket is open
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: "pong" }));
          }
        } else if (msg.type === "decision") {
          const payload = msg as DecisionStreamPayload;
          for (const listener of this.decisionListeners) {
            listener(payload.data.event, payload.data.decision, payload.timestamp);
          }
        }
      } catch (err: any) {
        // parse error ignored
      }
    };

    this.ws.onerror = (event: any) => {
      this.handleSocketError(new Error("WebSocket encountered an error"));
    };

    this.ws.onclose = () => {
      this.cleanupHeartbeatTimer();
      if (!this.isExplicitlyClosed) {
        this.setStatus("disconnected");
        if (this.autoReconnect) {
          this.scheduleReconnect();
        }
      } else {
        this.setStatus("disconnected");
      }
    };
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    this.cleanupHeartbeatTimer();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus("disconnected");
  }

  private handleSocketError(err: Error) {
    for (const listener of this.errorListeners) {
      try {
        listener(err);
      } catch {
        // ignore callback error
      }
    }
  }

  private scheduleReconnect() {
    if (this.isExplicitlyClosed || this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts++;
    // Exponential backoff with jitter: min(1000 * 2^attempts + jitter, maxReconnectIntervalMs)
    const baseDelay = Math.min(
      1000 * Math.pow(1.8, this.reconnectAttempts),
      this.maxReconnectIntervalMs
    );
    const jitter = Math.random() * 500;
    const delay = Math.floor(baseDelay + jitter);

    this.setStatus("reconnecting");
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private resetHeartbeatTimer() {
    this.cleanupHeartbeatTimer();
    this.heartbeatTimer = setTimeout(() => {
      // Missed heartbeat timeout: force reconnect
      if (this.ws) {
        this.ws.close();
      }
    }, this.heartbeatTimeoutMs);
  }

  private cleanupHeartbeatTimer() {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}
