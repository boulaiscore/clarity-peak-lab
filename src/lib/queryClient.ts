/**
 * ============================================
 * QUERY CLIENT SINGLETON
 * ============================================
 * 
 * Centralized QueryClient instance to avoid circular
 * dependency issues when importing from contexts.
 */

import {
  QueryClient,
  dehydrate,
  hydrate,
  type DehydratedState,
  type Query,
} from "@tanstack/react-query";

const QUERY_CACHE_STORAGE_KEY = "looma:query-cache:v1";
const QUERY_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60_000;

// Persist only compact performance/activity summaries needed to paint the
// primary tabs. Raw Health, wearable, calendar and device-usage rows remain
// cloud-only and are never copied into this unencrypted acceleration cache.
const PERSISTED_QUERY_PREFIXES = new Set([
  "user-metrics",
  "baseline-status",
  "weekly-progress",
  "weekly-exercise-xp",
  "games-xp-breakdown",
  "weekly-content-count",
  "weekly-detox-xp",
  "weekly-recovery-breakdown",
  "today-detox-minutes",
  "training-capacity",
  "rolling-xp-for-tc",
  "rolling-rec-for-tc",
  "game-sessions-today",
  "game-sessions-weekly",
  "daily-training-today",
  "daily-training-streak",
  "today-activities",
  "reasoning-quality-persisted",
  "cognitive-age-weekly",
  "cognitive-age-daily",
  "cognitive-baselines",
  "cognitive-age-last-activity",
  "daily-snapshots-30d",
  "yesterday-metrics",
  "recovery-snapshot",
]);

function shouldPersistQuery(query: Query): boolean {
  const prefix = String(query.queryKey[0] ?? "");
  return query.state.status === "success" && PERSISTED_QUERY_PREFIXES.has(prefix);
}

function readPersistedQueryState(): DehydratedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(QUERY_CACHE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt?: number; state?: DehydratedState };
    if (!parsed.savedAt || !parsed.state || Date.now() - parsed.savedAt > QUERY_CACHE_MAX_AGE_MS) {
      window.localStorage.removeItem(QUERY_CACHE_STORAGE_KEY);
      return null;
    }
    return parsed.state;
  } catch {
    return null;
  }
}

export function clearPersistedQueryCache(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(QUERY_CACHE_STORAGE_KEY);
  } catch {
    // Cache removal must never block sign-out.
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // App routes remount often on mobile. Keep recently resolved server state
      // warm so returning Home or opening a breakdown does not repeat the same
      // Supabase requests before an explicit mutation invalidates them.
      staleTime: 60_000,
      gcTime: 30 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

const persistedState = readPersistedQueryState();
if (persistedState) hydrate(queryClient, persistedState);

if (typeof window !== "undefined") {
  let persistenceTimer: number | undefined;
  queryClient.getQueryCache().subscribe(() => {
    window.clearTimeout(persistenceTimer);
    persistenceTimer = window.setTimeout(() => {
      try {
        const state = dehydrate(queryClient, { shouldDehydrateQuery: shouldPersistQuery });
        window.localStorage.setItem(
          QUERY_CACHE_STORAGE_KEY,
          JSON.stringify({ savedAt: Date.now(), state }),
        );
      } catch {
        // Cloud is authoritative; a full/disabled cache only removes the speed-up.
      }
    }, 250);
  });
}
