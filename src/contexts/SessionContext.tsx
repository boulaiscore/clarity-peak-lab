import React, { createContext, useContext, useState, ReactNode } from "react";
import type { ProtocolType, DurationOption, FeelingOption } from "@/lib/protocols";

export interface Session {
  id: string;
  userId: string;
  type: ProtocolType;
  durationOption: DurationOption;
  feelingBefore: FeelingOption;
  feelingAfterRating?: number;
  createdAt: Date;
  completedAt?: Date;
}

interface SessionContextType {
  sessions: Session[];
  currentSession: {
    type?: ProtocolType;
    durationOption?: DurationOption;
    feelingBefore?: FeelingOption;
  } | null;
  startSession: (type: ProtocolType) => void;
  setSessionParams: (params: { durationOption?: DurationOption; feelingBefore?: FeelingOption }) => void;
  completeSession: (userId: string, feelingAfterRating?: number) => void;
  clearCurrentSession: () => void;
  getSessionsByType: (type: ProtocolType) => Session[];
  getTotalSessions: () => number;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const SESSIONS_STORAGE_KEY = "neuroloop_sessions";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>(() => {
    const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored).map((s: Session) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          completedAt: s.completedAt ? new Date(s.completedAt) : undefined,
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  const [currentSession, setCurrentSession] = useState<{
    type?: ProtocolType;
    durationOption?: DurationOption;
    feelingBefore?: FeelingOption;
  } | null>(null);

  const saveSessions = (newSessions: Session[]) => {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(newSessions));
    setSessions(newSessions);
  };

  const startSession = (type: ProtocolType) => {
    setCurrentSession({ type });
  };

  const setSessionParams = (params: { durationOption?: DurationOption; feelingBefore?: FeelingOption }) => {
    setCurrentSession((prev) => (prev ? { ...prev, ...params } : null));
  };

  const completeSession = (userId: string, feelingAfterRating?: number) => {
    if (currentSession?.type && currentSession?.durationOption && currentSession?.feelingBefore) {
      const newSession: Session = {
        id: crypto.randomUUID(),
        userId,
        type: currentSession.type,
        durationOption: currentSession.durationOption,
        feelingBefore: currentSession.feelingBefore,
        feelingAfterRating,
        createdAt: new Date(),
        completedAt: new Date(),
      };
      saveSessions([...sessions, newSession]);
      setCurrentSession(null);
    }
  };

  const clearCurrentSession = () => {
    setCurrentSession(null);
  };

  const getSessionsByType = (type: ProtocolType) => {
    return sessions.filter((s) => s.type === type);
  };

  const getTotalSessions = () => sessions.length;

  return (
    <SessionContext.Provider
      value={{
        sessions,
        currentSession,
        startSession,
        setSessionParams,
        completeSession,
        clearCurrentSession,
        getSessionsByType,
        getTotalSessions,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
