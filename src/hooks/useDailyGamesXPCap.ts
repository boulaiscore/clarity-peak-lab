/**
 * ============================================
 * NLOOP PRO – DAILY GAMES XP CAP v1.8
 * ============================================
 * 
 * Tracks how many games have awarded XP today and
 * provides the remaining capacity based on training plan.
 * 
 * Caps:
 * - Light: 3 games/day with XP
 * - Expert: 5 games/day with XP
 * - Superhuman: 7 games/day with XP
 * 
 * Games beyond the cap can still be played but award 0 XP.
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TRAINING_PLANS, TrainingPlanId } from "@/lib/trainingPlans";
import { startOfDay, format } from "date-fns";

export interface DailyGamesXPCapResult {
  /** Number of games played today that awarded XP (xp_awarded > 0) */
  gamesWithXPToday: number;
  /** Maximum games that can award XP today based on plan */
  dailyMax: number;
  /** Remaining games that can award XP today */
  remainingWithXP: number;
  /** Whether the user has reached the daily XP cap */
  isCapReached: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Total XP earned today from games */
  xpEarnedToday: number;
}

export function useDailyGamesXPCap(): DailyGamesXPCapResult {
  const { user, session } = useAuth();
  const userId = user?.id ?? session?.user?.id;
  
  // Get plan configuration
  const planId = (user?.trainingPlan || "light") as TrainingPlanId;
  const plan = TRAINING_PLANS[planId];
  const dailyMax = plan.gamesGating.dailyGamesWithXP;
  
  // Today's start timestamp
  const todayStart = format(startOfDay(new Date()), "yyyy-MM-dd'T'HH:mm:ss");
  
  // Fetch today's game sessions that awarded XP
  const { data, isLoading } = useQuery({
    queryKey: ["daily-games-xp-cap", userId, todayStart],
    queryFn: async () => {
      if (!userId) return { count: 0, totalXP: 0 };
      
      const { data, error } = await supabase
        .from("game_sessions")
        .select("xp_awarded")
        .eq("user_id", userId)
        .eq("status", "completed")
        .gt("xp_awarded", 0) // Only count games that actually awarded XP
        .gte("completed_at", todayStart);
      
      if (error) throw error;
      
      const sessions = data || [];
      const totalXP = sessions.reduce((sum, s) => sum + (s.xp_awarded || 0), 0);
      
      return { 
        count: sessions.length,
        totalXP,
      };
    },
    enabled: !!userId,
    staleTime: 30_000, // Refresh every 30 seconds
    refetchOnWindowFocus: true,
  });
  
  return useMemo(() => {
    const gamesWithXPToday = data?.count ?? 0;
    const xpEarnedToday = data?.totalXP ?? 0;
    const remainingWithXP = Math.max(0, dailyMax - gamesWithXPToday);
    const isCapReached = gamesWithXPToday >= dailyMax;
    
    return {
      gamesWithXPToday,
      dailyMax,
      remainingWithXP,
      isCapReached,
      isLoading,
      xpEarnedToday,
    };
  }, [data, dailyMax, isLoading]);
}

/**
 * Calculate XP for a game, applying the daily cap.
 * Returns 0 if the daily cap is reached.
 */
export function calculateCappedGameXP(
  baseXP: number,
  gamesWithXPToday: number,
  dailyMax: number
): { xp: number; capped: boolean } {
  if (gamesWithXPToday >= dailyMax) {
    return { xp: 0, capped: true };
  }
  return { xp: baseXP, capped: false };
}
