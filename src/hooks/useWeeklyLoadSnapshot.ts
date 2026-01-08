/**
 * Persistent snapshot for Weekly Cognitive Load.
 * Survives component unmounts by storing in React Query cache.
 */
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { startOfWeek, format } from "date-fns";
import { useRef, useCallback } from "react";

export interface WeeklyLoadSnapshot {
  rawGamesXP: number;
  rawTasksXP: number;
  rawDetoxXP: number;
  totalXPTarget: number;
  gamesXPTarget: number;
  tasksXPTarget: number;
  detoxXPTarget: number;
  gamesComplete: boolean;
  tasksComplete: boolean;
  detoxComplete: boolean;
  gamesProgress: number;
  tasksProgress: number;
  detoxProgress: number;
  savedAt: number; // timestamp to know when it was captured
}

const SNAPSHOT_KEY_PREFIX = "weekly-load-snapshot";

function buildStorageKey(userId: string, weekStart: string) {
  return `${SNAPSHOT_KEY_PREFIX}:${userId}:${weekStart}`;
}

function safeReadLocalSnapshot(storageKey: string): WeeklyLoadSnapshot | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeeklyLoadSnapshot;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.savedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function useWeeklyLoadSnapshot() {
  const queryClient = useQueryClient();
  const { user, session } = useAuth();

  // Stable userId across route changes
  const lastUserIdRef = useRef<string | undefined>(undefined);
  const computedUserId = user?.id ?? session?.user?.id;
  if (computedUserId) lastUserIdRef.current = computedUserId;

  // Critical: when navigating between tabs/routes, the auth context can be temporarily null.
  // We persist the last known userId locally so the snapshot key stays stable across remounts.
  const persistedUserId = (() => {
    try {
      return localStorage.getItem("nl:lastUserId") || undefined;
    } catch {
      return undefined;
    }
  })();

  const userId = computedUserId ?? lastUserIdRef.current ?? persistedUserId;

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const queryKey = [SNAPSHOT_KEY_PREFIX, userId, weekStart];
  const storageKey = userId ? buildStorageKey(userId, weekStart) : null;

  const getSnapshot = useCallback((): WeeklyLoadSnapshot | null => {
    if (!userId) return null;

    // 1) Fast path: in-memory cache
    const cached = queryClient.getQueryData<WeeklyLoadSnapshot>(queryKey) ?? null;
    if (cached) return cached;

    // 2) Fallback: localStorage (survives provider remounts)
    if (!storageKey) return null;
    const persisted = safeReadLocalSnapshot(storageKey);
    if (!persisted) return null;

    // Hydrate React Query cache so subsequent reads are instant
    queryClient.setQueryData<WeeklyLoadSnapshot>(queryKey, persisted);
    return persisted;
  }, [queryClient, queryKey, storageKey, userId]);

  const setSnapshot = useCallback(
    (snapshot: Omit<WeeklyLoadSnapshot, "savedAt">) => {
      if (!userId) return;

      try {
        localStorage.setItem("nl:lastUserId", userId);
      } catch {
        // ignore
      }

      const payload: WeeklyLoadSnapshot = {
        ...snapshot,
        savedAt: Date.now(),
      };

      queryClient.setQueryData<WeeklyLoadSnapshot>(queryKey, payload);

      // Persist to localStorage so it survives tab/route re-mounts (or QueryClient re-creation)
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(payload));
        } catch {
          // ignore
        }
      }
    },
    [queryClient, queryKey, storageKey, userId]
  );

  return { getSnapshot, setSnapshot, userId, weekStart };
}
