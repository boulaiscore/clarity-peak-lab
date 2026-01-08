/**
 * Hook that provides capped XP values for the Weekly Cognitive Load.
 * XP beyond category targets does NOT count towards the total.
 * 
 * Games target is split into 6 sub-targets:
 * - System 1 (Fast): Focus, Reasoning, Creativity
 * - System 2 (Slow): Focus, Reasoning, Creativity
 */

import { useMemo } from "react";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useWeeklyDetoxXP } from "@/hooks/useDetoxProgress";
import { useGamesXPBreakdown, GamesXPBreakdown } from "@/hooks/useGamesXPBreakdown";

// Sub-target for each area+mode combination
export interface AreaModeSubTarget {
  area: "focus" | "reasoning" | "creativity";
  mode: "fast" | "slow";
  rawXP: number;
  target: number;
  cappedXP: number;
  progress: number; // 0-100
  complete: boolean;
}

// System-level aggregation (S1 = fast, S2 = slow)
export interface SystemSubTarget {
  system: "S1" | "S2";
  label: string;
  areas: AreaModeSubTarget[];
  totalRawXP: number;
  totalTarget: number;
  totalCappedXP: number;
  progress: number;
  complete: boolean;
}

export interface CappedProgressData {
  // Raw values (actual earned)
  rawGamesXP: number;
  rawTasksXP: number;
  rawDetoxXP: number;
  
  // Capped values (max = target)
  cappedGamesXP: number;
  cappedTasksXP: number;
  cappedDetoxXP: number;
  
  // Targets
  gamesXPTarget: number;
  tasksXPTarget: number;
  detoxXPTarget: number;
  
  // Total (sum of capped values)
  cappedTotalXP: number;
  totalXPTarget: number;
  
  // Completion status
  gamesComplete: boolean;
  tasksComplete: boolean;
  detoxComplete: boolean;
  allCategoriesComplete: boolean;
  
  // Progress percentages (based on capped values)
  gamesProgress: number;
  tasksProgress: number;
  detoxProgress: number;
  totalProgress: number;
  
  // Games sub-targets (6 area+mode combinations grouped by system)
  gamesSubTargets: SystemSubTarget[];
  
  // Breakdown data for debugging/display
  gamesBreakdown: GamesXPBreakdown;
  
  // Loading state
  isLoading: boolean;
  
  // Whether queries have fetched at least once (used for snapshot validation)
  isFetched: boolean;
  
  // Plan reference
  plan: ReturnType<typeof useWeeklyProgress>["plan"];
}

function safeProgress(value: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, (value / target) * 100);
}

const AREAS = ["focus", "reasoning", "creativity"] as const;

export function useCappedWeeklyProgress(): CappedProgressData {
  const {
    weeklyGamesXP,
    weeklyContentXP,
    weeklyXPTarget,
    plan,
    isLoading: progressLoading,
    isSyncing: progressSyncing,
    isFetched: progressFetched,
  } = useWeeklyProgress();

  const {
    data: detoxData,
    isLoading: detoxLoading,
    isFetching: detoxFetching,
    isFetched: detoxFetched,
  } = useWeeklyDetoxXP();
  
  const {
    data: gamesBreakdown,
    isLoading: breakdownLoading,
    isFetching: breakdownFetching,
    isFetched: breakdownFetched,
  } = useGamesXPBreakdown();

  // Use 0 only when we have no cached data at all
  const weeklyDetoxXP = detoxData?.totalXP ?? 0;

  return useMemo(() => {
    // Calculate individual targets
    const detoxXPTarget = Math.round(plan.detox.weeklyMinutes * plan.detox.xpPerMinute);
    const tasksXPTarget = plan.contentXPTarget;
    const gamesXPTarget = Math.max(0, weeklyXPTarget - detoxXPTarget - tasksXPTarget);

    // Each of 6 sub-targets gets 1/6 of gamesXPTarget
    const perSubTarget = gamesXPTarget / 6;

    // Build sub-targets for each area+mode
    const breakdown = gamesBreakdown ?? {
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

    const buildAreaSubTarget = (
      area: "focus" | "reasoning" | "creativity",
      mode: "fast" | "slow"
    ): AreaModeSubTarget => {
      const rawXP =
        area === "focus"
          ? mode === "fast"
            ? breakdown.focusFast
            : breakdown.focusSlow
          : area === "reasoning"
            ? mode === "fast"
              ? breakdown.reasoningFast
              : breakdown.reasoningSlow
            : mode === "fast"
              ? breakdown.creativityFast
              : breakdown.creativitySlow;

      const cappedXP = Math.min(rawXP, perSubTarget);
      const progress = safeProgress(cappedXP, perSubTarget);
      const complete = rawXP >= perSubTarget && perSubTarget > 0;

      return { area, mode, rawXP, target: perSubTarget, cappedXP, progress, complete };
    };

    // Build System 1 (fast) sub-targets
    const s1Areas: AreaModeSubTarget[] = AREAS.map((a) => buildAreaSubTarget(a, "fast"));
    const s1TotalRaw = s1Areas.reduce((sum, a) => sum + a.rawXP, 0);
    const s1TotalTarget = s1Areas.reduce((sum, a) => sum + a.target, 0);
    const s1TotalCapped = s1Areas.reduce((sum, a) => sum + a.cappedXP, 0);
    const s1Progress = safeProgress(s1TotalCapped, s1TotalTarget);
    const s1Complete = s1Areas.every((a) => a.complete);

    const system1: SystemSubTarget = {
      system: "S1",
      label: "System 1 (Fast)",
      areas: s1Areas,
      totalRawXP: s1TotalRaw,
      totalTarget: s1TotalTarget,
      totalCappedXP: s1TotalCapped,
      progress: s1Progress,
      complete: s1Complete,
    };

    // Build System 2 (slow) sub-targets
    const s2Areas: AreaModeSubTarget[] = AREAS.map((a) => buildAreaSubTarget(a, "slow"));
    const s2TotalRaw = s2Areas.reduce((sum, a) => sum + a.rawXP, 0);
    const s2TotalTarget = s2Areas.reduce((sum, a) => sum + a.target, 0);
    const s2TotalCapped = s2Areas.reduce((sum, a) => sum + a.cappedXP, 0);
    const s2Progress = safeProgress(s2TotalCapped, s2TotalTarget);
    const s2Complete = s2Areas.every((a) => a.complete);

    const system2: SystemSubTarget = {
      system: "S2",
      label: "System 2 (Slow)",
      areas: s2Areas,
      totalRawXP: s2TotalRaw,
      totalTarget: s2TotalTarget,
      totalCappedXP: s2TotalCapped,
      progress: s2Progress,
      complete: s2Complete,
    };

    const gamesSubTargets: SystemSubTarget[] = [system1, system2];

    // Raw values (use breakdown total for consistency)
    const rawGamesXP = breakdown.totalGamesXP;
    const rawTasksXP = weeklyContentXP;
    const rawDetoxXP = weeklyDetoxXP;

    // Capped values (cannot exceed target)
    // For games, sum of all 6 sub-target capped values
    const cappedGamesXP = s1TotalCapped + s2TotalCapped;
    const cappedTasksXP = Math.min(rawTasksXP, tasksXPTarget);
    const cappedDetoxXP = Math.min(rawDetoxXP, detoxXPTarget);

    // Total is sum of capped values only
    const cappedTotalXP = cappedGamesXP + cappedTasksXP + cappedDetoxXP;
    const totalXPTarget = weeklyXPTarget;

    // Completion status
    const gamesComplete = cappedGamesXP >= gamesXPTarget && gamesXPTarget > 0;
    const tasksComplete = rawTasksXP >= tasksXPTarget && tasksXPTarget > 0;
    const detoxComplete = rawDetoxXP >= detoxXPTarget && detoxXPTarget > 0;
    const allCategoriesComplete = gamesComplete && tasksComplete && detoxComplete;

    // Progress percentages
    const gamesProgress = safeProgress(cappedGamesXP, gamesXPTarget);
    const tasksProgress = safeProgress(cappedTasksXP, tasksXPTarget);
    const detoxProgress = safeProgress(cappedDetoxXP, detoxXPTarget);
    const totalProgress = safeProgress(cappedTotalXP, totalXPTarget);

    // isLoading must include syncing/fetching states so WeeklyGoalCard doesn't update snapshot mid-refetch
    const isLoading =
      progressLoading ||
      detoxLoading ||
      breakdownLoading ||
      progressSyncing ||
      detoxFetching ||
      breakdownFetching;

    // isFetched = all queries have successfully fetched at least once
    const isFetched = progressFetched && detoxFetched && breakdownFetched;

    return {
      rawGamesXP,
      rawTasksXP,
      rawDetoxXP,
      cappedGamesXP,
      cappedTasksXP,
      cappedDetoxXP,
      gamesXPTarget,
      tasksXPTarget,
      detoxXPTarget,
      cappedTotalXP,
      totalXPTarget,
      gamesComplete,
      tasksComplete,
      detoxComplete,
      allCategoriesComplete,
      gamesProgress,
      tasksProgress,
      detoxProgress,
      totalProgress,
      gamesSubTargets,
      gamesBreakdown: breakdown,
      isLoading,
      isFetched,
      plan,
    };
  }, [
    weeklyGamesXP,
    weeklyContentXP,
    weeklyDetoxXP,
    weeklyXPTarget,
    plan,
    progressLoading,
    detoxLoading,
    breakdownLoading,
    progressSyncing,
    detoxFetching,
    breakdownFetching,
    progressFetched,
    detoxFetched,
    breakdownFetched,
    gamesBreakdown,
  ]);
}
