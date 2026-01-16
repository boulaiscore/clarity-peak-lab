/**
 * useCappedWeeklyProgress v1.3
 * 
 * Provides capped XP values for weekly progress tracking.
 * v1.3: Tasks don't contribute to XP - only games do.
 * BUT: maintains backward-compatible interface for existing UI components.
 */

import { useMemo } from "react";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useWeeklyDetoxXP } from "@/hooks/useDetoxProgress";
import { useGamesXPBreakdown } from "@/hooks/useGamesXPBreakdown";
import { TRAINING_PLANS, TrainingPlanId } from "@/lib/trainingPlans";
import { useAuth } from "@/contexts/AuthContext";

export interface AreaModeSubTarget {
  area: "focus" | "reasoning" | "creativity";
  mode: "fast" | "slow";
  target: number;
  earned: number;
  capped: number;
  cappedXP: number; // Alias for capped (backward compat)
  progress: number;
  complete: boolean;
}

export interface SystemSubTarget {
  system: "S1" | "S2";
  label: string;
  target: number;
  earned: number;
  capped: number;
  progress: number;
  areas: AreaModeSubTarget[];
}

export interface GamesBreakdownData {
  focusFast: number;
  focusSlow: number;
  reasoningFast: number;
  reasoningSlow: number;
  creativityFast: number;
  creativitySlow: number;
  system1Total: number;
  system2Total: number;
  totalGamesXP: number;
  completionsCount: number;
}

export interface CappedProgressData {
  // Raw values (uncapped)
  rawGamesXP: number;
  rawTasksXP: number; // v1.3: always 0, kept for compat
  rawDetoxXP: number;
  rawTotalXP: number;
  
  // Individual targets - TRAINING XP ONLY (games)
  gamesXPTarget: number;
  tasksXPTarget: number; // v1.3: 0, kept for compat
  detoxXPTarget: number; // DEPRECATED: kept for compat, always 0
  totalXPTarget: number; // v1.4: Games XP ONLY, no detox
  
  // Capped values (can't exceed target)
  cappedGamesXP: number;
  cappedTasksXP: number; // v1.3: 0, kept for compat
  cappedDetoxXP: number; // DEPRECATED: kept for compat
  cappedTotalXP: number; // v1.4: Games XP ONLY
  
  // Completion status
  gamesComplete: boolean;
  tasksComplete: boolean; // v1.3: always true (no tasks to complete)
  detoxComplete: boolean; // DEPRECATED: use recoveryComplete instead
  weekComplete: boolean;
  allCategoriesComplete: boolean; // Alias for weekComplete
  
  // Progress percentages (0-100)
  gamesProgress: number;
  tasksProgress: number; // v1.3: 100 (tasks don't block)
  detoxProgress: number; // DEPRECATED: use recoveryProgress instead
  totalProgress: number; // v1.4: Based on Games XP only
  
  // Sub-targets for games (by system)
  systemSubTargets: SystemSubTarget[];
  gamesSubTargets: SystemSubTarget[]; // Alias for systemSubTargets
  gamesBreakdown: GamesBreakdownData;
  
  // Content completions (count only, no XP in v1.3)
  contentCompletionsCount: number;
  
  // NEW v1.4: Recovery metrics (time-based, NOT XP)
  recoveryMinutesTarget: number;   // plan.detox.weeklyMinutes (480/840/1680)
  recoveryMinutesEarned: number;   // actual detox minutes completed
  recoveryProgress: number;        // 0-100%
  recoveryComplete: boolean;
  
  // Loading states
  isLoading: boolean;
  isFetched: boolean;
  isSyncing: boolean;
}

// Safe progress calculation
function safeProgress(value: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((value / target) * 100));
}

export function useCappedWeeklyProgress(): CappedProgressData {
  const { user } = useAuth();
  const planId = (user?.trainingPlan || "light") as TrainingPlanId;
  const plan = TRAINING_PLANS[planId];
  
  // v1.3: xpTargetWeek is the total (games only)
  const weeklyXPTarget = plan.xpTargetWeek;
  
  const {
    weeklyGamesXP,
    isLoading: progressLoading,
    isFetched: progressFetched,
    isSyncing,
  } = useWeeklyProgress();
  
  const {
    data: detoxData,
    isLoading: detoxLoading,
  } = useWeeklyDetoxXP();
  
  const {
    data: gamesBreakdown,
    isLoading: breakdownLoading,
    isFetched: breakdownFetched,
  } = useGamesXPBreakdown();

  const weeklyDetoxXP = detoxData?.totalXP ?? 0;

  return useMemo(() => {
    // Calculate individual targets (v1.3)
    const detoxXPTarget = Math.round(plan.detox.weeklyMinutes * plan.detox.xpPerMinute);
    const gamesXPTarget = weeklyXPTarget; // v1.3: all XP comes from games
    const tasksXPTarget = 0; // v1.3: tasks don't give XP

    // Each of 4 sub-targets gets 1/4 of gamesXPTarget (2x2 matrix)
    const perSubTarget = gamesXPTarget / 4;

    // Build sub-targets for each area+mode
    const breakdown: GamesBreakdownData = gamesBreakdown ?? {
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

    // Helper to build area subtarget
    const buildAreaSubTarget = (
      area: "focus" | "reasoning" | "creativity",
      mode: "fast" | "slow",
      earned: number,
      target: number
    ): AreaModeSubTarget => {
      const capped = Math.min(earned, target);
      const progress = safeProgress(earned, target);
      return {
        area,
        mode,
        target,
        earned,
        capped,
        cappedXP: capped,
        progress,
        complete: earned >= target,
      };
    };

    // v1.4: Each system has 2 areas (2x2 matrix matching GamesLibrary)
    // S1 = Focus (AE) + Creativity (RA)
    // S2 = Reasoning (CT) + Creativity (IN)
    const areaTarget = perSubTarget / 2; // 2 areas per system, not 3

    // Build area breakdowns for each system (matching GamesLibrary)
    const s1Areas: AreaModeSubTarget[] = [
      buildAreaSubTarget("focus", "fast", breakdown.focusFast, areaTarget),       // S1-AE: Attentional Efficiency
      buildAreaSubTarget("creativity", "fast", breakdown.creativityFast, areaTarget), // S1-RA: Rapid Association
    ];

    const s2Areas: AreaModeSubTarget[] = [
      buildAreaSubTarget("reasoning", "slow", breakdown.reasoningSlow, areaTarget),   // S2-CT: Critical Thinking
      buildAreaSubTarget("creativity", "slow", breakdown.creativitySlow, areaTarget), // S2-IN: Insight
    ];

    const s1Target = gamesXPTarget / 2;
    const s2Target = gamesXPTarget / 2;

    const systemSubTargets: SystemSubTarget[] = [
      {
        system: "S1",
        label: "System 1 (Fast)",
        target: s1Target,
        earned: breakdown.system1Total,
        capped: Math.min(breakdown.system1Total, s1Target),
        progress: safeProgress(breakdown.system1Total, s1Target),
        areas: s1Areas,
      },
      {
        system: "S2",
        label: "System 2 (Slow)",
        target: s2Target,
        earned: breakdown.system2Total,
        capped: Math.min(breakdown.system2Total, s2Target),
        progress: safeProgress(breakdown.system2Total, s2Target),
        areas: s2Areas,
      },
    ];

    // Cap individual categories
    const cappedGamesXP = Math.min(weeklyGamesXP ?? 0, gamesXPTarget);
    const cappedTasksXP = 0; // v1.3: no task XP
    const cappedDetoxXP = 0; // v1.4: Detox is time-based, no XP

    // v1.4: Total XP = Games ONLY (no detox XP)
    const cappedTotalXP = cappedGamesXP;
    const totalXPTarget = gamesXPTarget; // Games XP only!

    // v1.4: Recovery metrics (time-based, NOT XP)
    const recoveryMinutesTarget = plan.detox.weeklyMinutes; // 480/840/1680 based on plan
    const recoveryMinutesEarned = detoxData?.totalMinutes ?? 0;
    const recoveryProgress = safeProgress(recoveryMinutesEarned, recoveryMinutesTarget);
    const recoveryComplete = recoveryMinutesEarned >= recoveryMinutesTarget;

    // Completion status
    const gamesComplete = (weeklyGamesXP ?? 0) >= gamesXPTarget;
    const tasksComplete = true; // v1.3: tasks don't block progress
    const detoxComplete = recoveryComplete; // DEPRECATED: alias for recoveryComplete
    const weekComplete = gamesComplete; // v1.4: Only games matter for weekly completion

    // Progress percentages
    const gamesProgress = safeProgress(weeklyGamesXP ?? 0, gamesXPTarget);
    const tasksProgress = 100; // v1.3: tasks always "complete"
    const detoxProgress = recoveryProgress; // DEPRECATED: alias for recoveryProgress
    const totalProgress = gamesProgress; // v1.4: Based on Games XP only

    return {
      // Raw values
      rawGamesXP: weeklyGamesXP ?? 0,
      rawTasksXP: 0, // v1.3: no task XP
      rawDetoxXP: 0, // v1.4: Detox doesn't give XP
      rawTotalXP: weeklyGamesXP ?? 0, // v1.4: Games only
      
      // Targets
      gamesXPTarget,
      tasksXPTarget,
      detoxXPTarget: 0, // v1.4: Deprecated, always 0
      totalXPTarget,
      
      // Capped values
      cappedGamesXP,
      cappedTasksXP,
      cappedDetoxXP,
      cappedTotalXP,
      
      // Completion status
      gamesComplete,
      tasksComplete,
      detoxComplete,
      weekComplete,
      allCategoriesComplete: weekComplete,
      
      // Progress
      gamesProgress,
      tasksProgress,
      detoxProgress,
      totalProgress,
      
      // Sub-targets
      systemSubTargets,
      gamesSubTargets: systemSubTargets, // Alias
      gamesBreakdown: breakdown,
      
      // Content completions (count only in v1.3)
      contentCompletionsCount: breakdown.completionsCount,
      
      // NEW v1.4: Recovery metrics (time-based)
      recoveryMinutesTarget,
      recoveryMinutesEarned,
      recoveryProgress,
      recoveryComplete,
      
      // Loading states
      isLoading: progressLoading || detoxLoading || breakdownLoading,
      isFetched: progressFetched && breakdownFetched,
      isSyncing,
    };
  }, [
    weeklyGamesXP,
    weeklyDetoxXP,
    gamesBreakdown,
    plan,
    weeklyXPTarget,
    progressLoading,
    detoxLoading,
    breakdownLoading,
    progressFetched,
    breakdownFetched,
    isSyncing,
  ]);
}
