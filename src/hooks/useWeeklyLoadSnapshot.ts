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

export function useWeeklyLoadSnapshot() {
  const queryClient = useQueryClient();
  const { user, session } = useAuth();

  // Stable userId across route changes
  const lastUserIdRef = useRef<string | undefined>(undefined);
  const computedUserId = user?.id ?? session?.user?.id;
  if (computedUserId) lastUserIdRef.current = computedUserId;
  const userId = computedUserId ?? lastUserIdRef.current;

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const queryKey = [SNAPSHOT_KEY_PREFIX, userId, weekStart];

  const getSnapshot = useCallback((): WeeklyLoadSnapshot | null => {
    if (!userId) return null;
    return queryClient.getQueryData<WeeklyLoadSnapshot>(queryKey) ?? null;
  }, [queryClient, queryKey, userId]);

  const setSnapshot = useCallback(
    (snapshot: Omit<WeeklyLoadSnapshot, "savedAt">) => {
      if (!userId) return;
      queryClient.setQueryData<WeeklyLoadSnapshot>(queryKey, {
        ...snapshot,
        savedAt: Date.now(),
      });
    },
    [queryClient, queryKey, userId]
  );

  return { getSnapshot, setSnapshot, userId, weekStart };
}
