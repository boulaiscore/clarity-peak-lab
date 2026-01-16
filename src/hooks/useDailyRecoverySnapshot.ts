/**
 * ============================================
 * NEUROLOOP PRO – DAILY RECOVERY SNAPSHOT
 * ============================================
 * 
 * Tracks daily REC value and consecutive low-REC streak.
 * Called once per day to update decay tracking state.
 * 
 * IDEMPOTENCY:
 * - Uses user's local date (derived from browser timezone)
 * - Compares `rec_snapshot_date` to current local date
 * - Only updates if dates differ (prevents double-counting)
 * 
 * STREAK LOGIC:
 * - If REC < 40: increment low_rec_streak_days
 * - If REC >= 40: reset low_rec_streak_days to 0
 * 
 * TIMEZONE HANDLING:
 * - snapshot_date is stored as DATE (no time component)
 * - Uses user's local date for day boundary detection
 * - Comparison is done as ISO date strings (YYYY-MM-DD)
 */

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { LOW_RECOVERY_THRESHOLD } from "@/lib/decayConstants";

interface RecoverySnapshotData {
  rec_snapshot_date: string | null;
  rec_snapshot_value: number | null;
  low_rec_streak_days: number;
}

/**
 * Get the user's local date as YYYY-MM-DD string.
 * This ensures day boundaries are calculated in user's timezone.
 */
function getUserLocalDate(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * Hook to read and update the daily recovery snapshot.
 * Ensures idempotent updates - running multiple times on the same day
 * will not change the streak.
 */
export function useDailyRecoverySnapshot() {
  const { user, session } = useAuth();
  const userId = user?.id ?? session?.user?.id;
  const queryClient = useQueryClient();
  
  // Fetch current snapshot state
  const { data: snapshotData, isLoading } = useQuery({
    queryKey: ["recovery-snapshot", userId],
    queryFn: async (): Promise<RecoverySnapshotData | null> => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("user_cognitive_metrics")
        .select("rec_snapshot_date, rec_snapshot_value, low_rec_streak_days")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) {
        console.error("[RecoverySnapshot] Fetch error:", error);
        throw error;
      }
      
      return data ? {
        rec_snapshot_date: data.rec_snapshot_date,
        rec_snapshot_value: data.rec_snapshot_value ? Number(data.rec_snapshot_value) : null,
        low_rec_streak_days: data.low_rec_streak_days ?? 0,
      } : null;
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
  
  // Mutation to update the daily snapshot
  const updateSnapshot = useMutation({
    mutationFn: async (recovery: number) => {
      if (!userId) throw new Error("No user ID");
      
      const todayLocal = getUserLocalDate();
      const currentSnapshotDate = snapshotData?.rec_snapshot_date;
      
      // IDEMPOTENCY CHECK: If already updated today, do nothing
      if (currentSnapshotDate === todayLocal) {
        console.log("[RecoverySnapshot] Already updated today, skipping");
        return { 
          updated: false, 
          streakDays: snapshotData?.low_rec_streak_days ?? 0 
        };
      }
      
      // Calculate new streak
      const isLowRecovery = recovery < LOW_RECOVERY_THRESHOLD;
      const currentStreak = snapshotData?.low_rec_streak_days ?? 0;
      
      // If REC >= 40, reset streak to 0
      // If REC < 40, increment streak by 1
      const newStreak = isLowRecovery ? currentStreak + 1 : 0;
      
      // Update the snapshot
      const { error } = await supabase
        .from("user_cognitive_metrics")
        .update({
          rec_snapshot_date: todayLocal,
          rec_snapshot_value: recovery,
          low_rec_streak_days: newStreak,
        })
        .eq("user_id", userId);
      
      if (error) {
        console.error("[RecoverySnapshot] Update error:", error);
        throw error;
      }
      
      console.log(
        `[RecoverySnapshot] Updated: date=${todayLocal}, REC=${recovery.toFixed(1)}, ` +
        `lowRec=${isLowRecovery}, streak=${newStreak}`
      );
      
      return { updated: true, streakDays: newStreak };
    },
    onSuccess: () => {
      // Invalidate queries that depend on decay tracking
      queryClient.invalidateQueries({ queryKey: ["recovery-snapshot"] });
      queryClient.invalidateQueries({ queryKey: ["readiness-decay-tracking"] });
      queryClient.invalidateQueries({ queryKey: ["decay-tracking"] });
    },
  });
  
  /**
   * Update the daily recovery snapshot.
   * Call this once per day (e.g., on app load or on Home mount).
   * 
   * @param recovery - Current recovery value (0-100)
   * @returns Object with { updated: boolean, streakDays: number }
   */
  const persistDailySnapshot = useCallback(
    async (recovery: number) => {
      return updateSnapshot.mutateAsync(recovery);
    },
    [updateSnapshot]
  );
  
  /**
   * Check if today's snapshot has already been persisted.
   */
  const isSnapshotCurrentToday = useCallback(() => {
    if (!snapshotData?.rec_snapshot_date) return false;
    return snapshotData.rec_snapshot_date === getUserLocalDate();
  }, [snapshotData]);
  
  return {
    // Current snapshot data
    snapshotDate: snapshotData?.rec_snapshot_date ?? null,
    snapshotValue: snapshotData?.rec_snapshot_value ?? null,
    lowRecStreakDays: snapshotData?.low_rec_streak_days ?? 0,
    
    // Actions
    persistDailySnapshot,
    isSnapshotCurrentToday,
    
    // State
    isLoading,
    isUpdating: updateSnapshot.isPending,
  };
}
