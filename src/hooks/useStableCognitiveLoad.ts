/**
 * Hook that provides STABLE Cognitive Load values for the UI.
 * 
 * KEY PRINCIPLE: Never show zeros / flicker during refetch.
 * We maintain an in-memory + localStorage snapshot and ONLY update it
 * when fresh data is fully fetched AND meaningful (XP > 0).
 * 
 * Until then, we display the last valid snapshot.
 */

import { useMemo, useEffect, useRef } from "react";
import { useCappedWeeklyProgress, SystemSubTarget } from "@/hooks/useCappedWeeklyProgress";
import { startOfWeek, format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

export interface StableCognitiveLoadData {
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
  gamesSubTargets: SystemSubTarget[];
  // Derived
  cappedTotalXP: number;
  totalProgress: number;
  xpRemaining: number;
  goalReached: boolean;
  // Status
  isLoading: boolean;
  isSyncing: boolean;
}

const STORAGE_KEY_PREFIX = "stable-cognitive-load";

function buildStorageKey(userId: string, weekStart: string) {
  return `${STORAGE_KEY_PREFIX}:${userId}:${weekStart}`;
}

function getPersistedSnapshot(storageKey: string): StableCognitiveLoadData | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    // Basic validation
    if (typeof parsed.rawGamesXP !== "number") return null;
    return parsed as StableCognitiveLoadData;
  } catch {
    return null;
  }
}

function persistSnapshot(storageKey: string, data: StableCognitiveLoadData) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// Module-level cache to survive React re-renders and even Fast Refresh
const moduleCache = new Map<string, StableCognitiveLoadData>();

export function useStableCognitiveLoad(): StableCognitiveLoadData {
  const { user, session } = useAuth();
  
  // Stable userId
  const persistedUserId = (() => {
    try { return localStorage.getItem("nl:lastUserId") || undefined; } catch { return undefined; }
  })();
  const userId = user?.id ?? session?.user?.id ?? persistedUserId;
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const storageKey = userId ? buildStorageKey(userId, weekStart) : null;

  const {
    rawGamesXP,
    rawTasksXP,
    rawDetoxXP,
    totalXPTarget,
    gamesXPTarget,
    tasksXPTarget,
    detoxXPTarget,
    gamesComplete,
    tasksComplete,
    detoxComplete,
    gamesProgress,
    tasksProgress,
    detoxProgress,
    gamesSubTargets,
    isLoading,
    isFetched,
  } = useCappedWeeklyProgress();

  // Build fresh data object
  const freshData = useMemo((): StableCognitiveLoadData => {
    const cappedGames = Math.min(rawGamesXP, gamesXPTarget);
    const cappedTasks = Math.min(rawTasksXP, tasksXPTarget);
    const cappedDetox = Math.min(rawDetoxXP, detoxXPTarget);
    const cappedTotalXP = cappedGames + cappedTasks + cappedDetox;
    const totalProgress = totalXPTarget > 0 ? Math.min(100, (cappedTotalXP / totalXPTarget) * 100) : 0;
    const xpRemaining = Math.max(0, totalXPTarget - cappedTotalXP);
    const goalReached = cappedTotalXP >= totalXPTarget && totalXPTarget > 0;

    return {
      rawGamesXP,
      rawTasksXP,
      rawDetoxXP,
      totalXPTarget,
      gamesXPTarget,
      tasksXPTarget,
      detoxXPTarget,
      gamesComplete,
      tasksComplete,
      detoxComplete,
      gamesProgress,
      tasksProgress,
      detoxProgress,
      gamesSubTargets,
      cappedTotalXP,
      totalProgress,
      xpRemaining,
      goalReached,
      isLoading,
      isSyncing: isLoading,
    };
  }, [
    rawGamesXP, rawTasksXP, rawDetoxXP,
    totalXPTarget, gamesXPTarget, tasksXPTarget, detoxXPTarget,
    gamesComplete, tasksComplete, detoxComplete,
    gamesProgress, tasksProgress, detoxProgress,
    gamesSubTargets, isLoading,
  ]);

  const freshTotal = freshData.rawGamesXP + freshData.rawTasksXP + freshData.rawDetoxXP;
  const hasMeaningfulFresh = !isLoading && isFetched && freshTotal > 0;

  // Get cached snapshot (module-level + localStorage)
  const getCachedSnapshot = (): StableCognitiveLoadData | null => {
    if (!storageKey) return null;
    
    // 1) Module-level cache (fastest)
    const moduleCached = moduleCache.get(storageKey);
    if (moduleCached) return moduleCached;
    
    // 2) localStorage fallback
    const persisted = getPersistedSnapshot(storageKey);
    if (persisted) {
      moduleCache.set(storageKey, persisted);
      return persisted;
    }
    
    return null;
  };

  const cachedSnapshot = getCachedSnapshot();
  const cachedTotal = cachedSnapshot
    ? cachedSnapshot.rawGamesXP + cachedSnapshot.rawTasksXP + cachedSnapshot.rawDetoxXP
    : 0;

  // Update cache only when fresh data is meaningful
  useEffect(() => {
    if (!storageKey) return;
    if (!hasMeaningfulFresh) return;
    
    // Only update if fresh is greater or equal (never downgrade to lower values)
    if (cachedTotal > 0 && freshTotal < cachedTotal) return;
    
    moduleCache.set(storageKey, freshData);
    persistSnapshot(storageKey, freshData);
  }, [storageKey, hasMeaningfulFresh, freshData, freshTotal, cachedTotal]);

  // STABLE OUTPUT: Use cached if fresh is not ready/meaningful
  const stableData = useMemo((): StableCognitiveLoadData => {
    // If we have meaningful fresh data, use it
    if (hasMeaningfulFresh) {
      return freshData;
    }
    
    // If we have a cached snapshot with data, use it (prevents zero flicker)
    if (cachedSnapshot && cachedTotal > 0) {
      return {
        ...cachedSnapshot,
        isLoading,
        isSyncing: isLoading,
      };
    }
    
    // Fallback to fresh (even if zeros) – first load scenario
    return freshData;
  }, [hasMeaningfulFresh, freshData, cachedSnapshot, cachedTotal, isLoading]);

  return stableData;
}
