import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  ConnectionStatus,
  Decision,
  DecisionStreamClient,
  ToolCallEvent,
} from "@agentshield/api-client";
import { useAuth } from "./AuthContext";
import { getWsUrl } from "../lib/api";

export interface StreamItem {
  id: string;
  event: ToolCallEvent;
  decision: Decision;
  timestamp: string;
}

interface StreamContextType {
  status: ConnectionStatus;
  events: StreamItem[];
  isPaused: boolean;
  togglePause: () => void;
  clearEvents: () => void;
  reconnect: () => void;
}

const StreamContext = createContext<StreamContextType | undefined>(undefined);

export const StreamProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token, user, isLoading } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [events, setEvents] = useState<StreamItem[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const streamClientRef = useRef<DecisionStreamClient | null>(null);
  const isPausedRef = useRef<boolean>(false);
  isPausedRef.current = isPaused;

  useEffect(() => {
    // AuthContext validates the persisted session via /me first. Avoid opening
    // an unauthenticated socket during startup or after a session expires.
    if (isLoading) return;
    if (!token || !user) {
      setStatus("disconnected");
      return;
    }

    const client = new DecisionStreamClient({
      wsUrl: getWsUrl(),
      token,
      autoReconnect: true,
      maxReconnectIntervalMs: 10000,
    });
    streamClientRef.current = client;

    const unsubStatus = client.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    const unsubDecision = client.onDecision((event, decision, timestamp) => {
      if (!isPausedRef.current) {
        setEvents((prev) => [
          {
            id: decision.decision_id || event.event_id,
            event,
            decision,
            timestamp,
          },
          ...prev.slice(0, 99), // keep latest 100 items
        ]);
      }
    });

    client.connect();

    return () => {
      unsubStatus();
      unsubDecision();
      client.disconnect();
      streamClientRef.current = null;
    };
  }, [token, user?.id, isLoading]);

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const clearEvents = () => {
    setEvents([]);
  };

  const reconnect = () => {
    if (streamClientRef.current) {
      streamClientRef.current.disconnect();
      streamClientRef.current.connect();
    }
  };

  return (
    <StreamContext.Provider
      value={{
        status,
        events,
        isPaused,
        togglePause,
        clearEvents,
        reconnect,
      }}
    >
      {children}
    </StreamContext.Provider>
  );
};

export const useStream = () => {
  const context = useContext(StreamContext);
  if (!context) {
    throw new Error("useStream must be used within a StreamProvider");
  }
  return context;
};
