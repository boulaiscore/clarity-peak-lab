/**
 * Hook to fetch games XP broken down by gym_area + thinking_mode.
 * Returns XP for each of the 6 sub-targets:
 * - Focus Fast, Focus Slow
 * - Reasoning Fast, Reasoning Slow
 * - Creativity Fast, Creativity Slow
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfWeek, format } from "date-fns";
import { useRef } from "react";

export type GymArea = "focus" | "reasoning" | "creativity";
export type ThinkingMode = "fast" | "slow";

export interface AreaModeXP {
  area: GymArea;
  mode: ThinkingMode;
  xp: number;
}

export interface GamesXPBreakdown {
  // Individual sub-target XP
  focusFast: number;
  focusSlow: number;
  reasoningFast: number;
  reasoningSlow: number;
  creativityFast: number;
  creativitySlow: number;
  
  // Aggregated by thinking mode
  system1Total: number; // All fast XP
  system2Total: number; // All slow XP
  
  // Total games XP
  totalGamesXP: number;
  
  // Raw completions count
  completionsCount: number;
}

const EMPTY_BREAKDOWN: GamesXPBreakdown = {
  focusFast: 0,
  focusSlow: 0,
  reasoningFast: 0,
  reasoningSlow: 0,
  creativityFast: 0,
  creativitySlow: 0,
  system1Total: 0,
  system2Total: 0,
  totalGamesXP: 0,
  completionsCount: 0,
};

function getCurrentWeekStart(): string {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  return format(weekStart, "yyyy-MM-dd");
}

export function useGamesXPBreakdown() {
  const { user, session } = useAuth();
  const weekStart = getCurrentWeekStart();

  // Keep a stable userId across route changes
  const lastUserIdRef = useRef<string | undefined>(undefined);
  const computedUserId = user?.id ?? session?.user?.id;
  if (computedUserId) lastUserIdRef.current = computedUserId;
  const userId = computedUserId ?? lastUserIdRef.current;

  return useQuery({
    queryKey: ["games-xp-breakdown", userId, weekStart],
    queryFn: async (): Promise<GamesXPBreakdown> => {
      if (!userId) return EMPTY_BREAKDOWN;

      // Fetch exercise_completions for games (exclude content- prefix)
      const { data, error } = await supabase
        .from("exercise_completions")
        .select("exercise_id, xp_earned, gym_area, thinking_mode")
        .eq("user_id", userId)
        .eq("week_start", weekStart);

      if (error) throw error;

      // Filter out content completions (they start with "content-")
      const gameCompletions = (data || []).filter(
        (c) => !c.exercise_id?.startsWith("content-")
      );

      // Aggregate by gym_area + thinking_mode
      const breakdown: GamesXPBreakdown = { ...EMPTY_BREAKDOWN };
      breakdown.completionsCount = gameCompletions.length;

      for (const c of gameCompletions) {
        const xp = c.xp_earned || 0;
        const area = c.gym_area as GymArea | null;
        const mode = c.thinking_mode as ThinkingMode | null;

        breakdown.totalGamesXP += xp;

        // Aggregate by thinking mode first
        if (mode === "fast") {
          breakdown.system1Total += xp;
        } else if (mode === "slow") {
          breakdown.system2Total += xp;
        }

        // Aggregate by area + mode
        if (area === "focus") {
          if (mode === "fast") breakdown.focusFast += xp;
          else if (mode === "slow") breakdown.focusSlow += xp;
        } else if (area === "reasoning") {
          if (mode === "fast") breakdown.reasoningFast += xp;
          else if (mode === "slow") breakdown.reasoningSlow += xp;
        } else if (area === "creativity") {
          if (mode === "fast") breakdown.creativityFast += xp;
          else if (mode === "slow") breakdown.creativitySlow += xp;
        }
      }

      return breakdown;
    },
    enabled: !!userId,
    staleTime: 60_000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev ?? EMPTY_BREAKDOWN,
  });
}
