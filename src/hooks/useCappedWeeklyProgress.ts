/**
 * Hook that provides capped XP values for the Weekly Cognitive Load.
 * XP beyond category targets does NOT count towards the total.
 */

import { useMemo } from "react";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useWeeklyDetoxXP } from "@/hooks/useDetoxProgress";

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
  // Use 0 only when we have no cached data at all
  const weeklyDetoxXP = detoxData?.totalXP ?? 0;

  return useMemo(() => {
    // Calculate individual targets
    const detoxXPTarget = Math.round(plan.detox.weeklyMinutes * plan.detox.xpPerMinute);
    const tasksXPTarget = plan.contentXPTarget;
    const gamesXPTarget = Math.max(0, weeklyXPTarget - detoxXPTarget - tasksXPTarget);

    // Raw values
    const rawGamesXP = weeklyGamesXP;
    const rawTasksXP = weeklyContentXP;
    const rawDetoxXP = weeklyDetoxXP;

    // Capped values (cannot exceed target)
    const cappedGamesXP = Math.min(rawGamesXP, gamesXPTarget);
    const cappedTasksXP = Math.min(rawTasksXP, tasksXPTarget);
    const cappedDetoxXP = Math.min(rawDetoxXP, detoxXPTarget);

    // Total is sum of capped values only
    const cappedTotalXP = cappedGamesXP + cappedTasksXP + cappedDetoxXP;
    const totalXPTarget = weeklyXPTarget;

    // Completion status
    const gamesComplete = rawGamesXP >= gamesXPTarget && gamesXPTarget > 0;
    const tasksComplete = rawTasksXP >= tasksXPTarget && tasksXPTarget > 0;
    const detoxComplete = rawDetoxXP >= detoxXPTarget && detoxXPTarget > 0;
    const allCategoriesComplete = gamesComplete && tasksComplete && detoxComplete;

    // Progress percentages
    const gamesProgress = safeProgress(cappedGamesXP, gamesXPTarget);
    const tasksProgress = safeProgress(cappedTasksXP, tasksXPTarget);
    const detoxProgress = safeProgress(cappedDetoxXP, detoxXPTarget);
    const totalProgress = safeProgress(cappedTotalXP, totalXPTarget);

    // isLoading must include syncing/fetching states so WeeklyGoalCard doesn't update snapshot mid-refetch
    const isLoading = progressLoading || detoxLoading || progressSyncing || detoxFetching;
    
    // isFetched = both queries have successfully fetched at least once
    const isFetched = progressFetched && detoxFetched;

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
      isLoading,
      isFetched,
      plan,
    };
    // IMPORTANT: include ALL flags to keep isLoading/isFetched accurate
  }, [weeklyGamesXP, weeklyContentXP, weeklyDetoxXP, weeklyXPTarget, plan, progressLoading, detoxLoading, progressSyncing, detoxFetching, progressFetched, detoxFetched]);
}
