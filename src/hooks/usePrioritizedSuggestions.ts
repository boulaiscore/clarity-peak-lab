/**
 * Smart Suggestions Engine
 * Prioritizes home page CTAs based on metrics, lab progress, and cognitive state
 */

import { useMemo } from "react";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { useRecoveryEffective } from "@/hooks/useRecoveryEffective";
import { useCappedWeeklyProgress } from "@/hooks/useCappedWeeklyProgress";
import { useStableCognitiveLoad } from "@/hooks/useStableCognitiveLoad";
import { useReasoningQuality } from "@/hooks/useReasoningQuality";
import { useAuth } from "@/contexts/AuthContext";
import { TrainingPlanId } from "@/lib/trainingPlans";
import { 
  Dumbbell, 
  BookMarked, 
  Smartphone, 
  Ban, 
  Battery,
  Brain,
  Zap
} from "lucide-react";

export type SuggestionType = 
  | "recovery_critical"      // Recovery < 30% - urgent
  | "recovery_low"           // Recovery < 45% - suggest detox/reading
  | "training_behind"        // < 50% weekly progress
  | "training_catchup"       // 50-80% weekly progress
  | "detox_incomplete"       // Detox target not met
  | "s2_opportunity"         // S2 games available (high recovery)
  | "rq_declining"           // RQ is decaying - suggest tasks
  | "on_track"               // Everything good - maintain rhythm
  | "goal_reached";          // Weekly goal complete

export interface Suggestion {
  id: SuggestionType;
  priority: number;          // Lower = higher priority
  headline: string;
  body: string;
  action: string;
  route: string;
  icon: React.ElementType;
  iconSecondary?: React.ElementType;
  colorClass: string;        // Tailwind gradient classes
  urgency: "critical" | "high" | "medium" | "low";
  progress?: number;         // Optional progress bar (0-100)
}

interface UsePrioritizedSuggestionsResult {
  suggestions: Suggestion[];
  topSuggestion: Suggestion | null;
  isLoading: boolean;
}

export function usePrioritizedSuggestions(): UsePrioritizedSuggestionsResult {
  const { user } = useAuth();
  const { sharpness, readiness, recovery: recoveryRaw, isLoading: metricsLoading } = useTodayMetrics();
  const { recoveryEffective, isLoading: recoveryLoading } = useRecoveryEffective();
  const { 
    cappedGamesXP, 
    gamesXPTarget,
    totalProgress,
  } = useCappedWeeklyProgress();
  const { 
    rawDetoxXP, 
    detoxXPTarget, 
    detoxProgress, 
    detoxComplete 
  } = useStableCognitiveLoad();
  const { isDecaying: rqIsDecaying, isLoading: rqLoading } = useReasoningQuality();

  const planId = (user?.trainingPlan || "light") as TrainingPlanId;
  
  const isLoading = metricsLoading || recoveryLoading || rqLoading;

  const suggestions = useMemo((): Suggestion[] => {
    if (isLoading) return [];

    const result: Suggestion[] = [];
    const xpRemaining = Math.max(0, gamesXPTarget - cappedGamesXP);
    const gamesNeeded = Math.ceil(xpRemaining / 20);
    const detoxRemaining = Math.max(0, detoxXPTarget - rawDetoxXP);
    const detoxMinutesRemaining = Math.round(detoxRemaining / 2);

    // Priority 1: CRITICAL RECOVERY (< 30%)
    if (recoveryEffective < 30) {
      result.push({
        id: "recovery_critical",
        priority: 1,
        headline: "Recovery critically low",
        body: "Start a detox session to restore cognitive capacity.",
        action: "Start Detox",
        route: "/neuro-lab?tab=detox",
        icon: Battery,
        colorClass: "from-red-500/15 via-red-500/5 to-transparent border-red-500/30 hover:border-red-500/50",
        urgency: "critical",
      });
    }

    // Priority 2: LOW RECOVERY (< 45%) - Suggest recovery actions
    if (recoveryEffective >= 30 && recoveryEffective < 45) {
      result.push({
        id: "recovery_low",
        priority: 2,
        headline: "Today: recover first",
        body: "Recovery is low — detox or passive reading recommended.",
        action: "Start Recovery",
        route: "/neuro-lab?tab=detox",
        icon: Smartphone,
        iconSecondary: Ban,
        colorClass: "from-teal-500/10 via-teal-500/5 to-transparent border-teal-500/20 hover:border-teal-500/40",
        urgency: "high",
      });
    }

    // Priority 3: TRAINING BEHIND (< 50% progress, recovery OK)
    if (recoveryEffective >= 45 && totalProgress < 50 && xpRemaining > 0) {
      result.push({
        id: "training_behind",
        priority: 3,
        headline: "Today: train to catch up",
        body: `${xpRemaining} XP behind — ~${gamesNeeded} game${gamesNeeded > 1 ? 's' : ''} to get back on track.`,
        action: "Start Training",
        route: "/neuro-lab",
        icon: Dumbbell,
        colorClass: "from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20 hover:border-amber-500/40",
        urgency: "high",
      });
    }

    // Priority 4: TRAINING CATCHUP (50-80% progress)
    if (recoveryEffective >= 45 && totalProgress >= 50 && totalProgress < 80 && xpRemaining > 0) {
      result.push({
        id: "training_catchup",
        priority: 4,
        headline: "Today: train to stay on track",
        body: `${xpRemaining} XP left — ~${gamesNeeded} game${gamesNeeded > 1 ? 's' : ''} to hit target.`,
        action: "Start Training",
        route: "/neuro-lab",
        icon: Dumbbell,
        colorClass: "from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20 hover:border-blue-500/40",
        urgency: "medium",
      });
    }

    // Priority 5: DETOX INCOMPLETE (if recovery is OK but detox not done)
    if (recoveryEffective >= 45 && !detoxComplete && detoxMinutesRemaining > 0) {
      result.push({
        id: "detox_incomplete",
        priority: 5,
        headline: detoxProgress === 0 ? "Today: start your detox" : "Today: continue detox",
        body: `${detoxMinutesRemaining} min left to complete recovery target.`,
        action: "Start Detox",
        route: "/neuro-lab?tab=detox",
        icon: Smartphone,
        iconSecondary: Ban,
        colorClass: "from-primary/10 via-primary/5 to-transparent border-primary/20 hover:border-primary/40",
        urgency: "medium",
        progress: detoxProgress,
      });
    }

    // Priority 6: S2 OPPORTUNITY (high recovery, push for deliberate training)
    if (recoveryEffective >= 70 && totalProgress < 100 && xpRemaining > 0) {
      result.push({
        id: "s2_opportunity",
        priority: 6,
        headline: "High recovery: S2 games unlocked",
        body: "Optimal window for deliberate reasoning training.",
        action: "Train S2",
        route: "/neuro-lab",
        icon: Brain,
        colorClass: "from-indigo-500/10 via-indigo-500/5 to-transparent border-indigo-500/20 hover:border-indigo-500/40",
        urgency: "low",
      });
    }

    // Priority 7: RQ DECLINING (suggest tasks to boost priming)
    if (rqIsDecaying && recoveryEffective >= 30) {
      result.push({
        id: "rq_declining",
        priority: 7,
        headline: "Today: read or reflect",
        body: "Reasoning Quality needs maintenance — complete a task.",
        action: "View Tasks",
        route: "/neuro-lab?tab=tasks",
        icon: BookMarked,
        colorClass: "from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20 hover:border-emerald-500/40",
        urgency: "low",
      });
    }

    // Priority 8: GOAL REACHED
    if (totalProgress >= 100) {
      result.push({
        id: "goal_reached",
        priority: 8,
        headline: "Weekly goal complete",
        body: "Maintain rhythm with optional sessions.",
        action: "View Lab",
        route: "/neuro-lab",
        icon: Zap,
        colorClass: "from-green-500/10 via-green-500/5 to-transparent border-green-500/20 hover:border-green-500/40",
        urgency: "low",
      });
    }

    // Priority 9: ON TRACK (nothing urgent)
    if (result.length === 0 && totalProgress >= 80) {
      result.push({
        id: "on_track",
        priority: 9,
        headline: "Today: maintain rhythm",
        body: "You're on track — continue at your pace.",
        action: "Continue",
        route: "/neuro-lab",
        icon: Dumbbell,
        colorClass: "from-muted/30 via-muted/10 to-transparent border-border/40 hover:border-border/60",
        urgency: "low",
      });
    }

    // Sort by priority (lower = higher priority)
    return result.sort((a, b) => a.priority - b.priority);
  }, [
    isLoading,
    recoveryEffective,
    totalProgress,
    cappedGamesXP,
    gamesXPTarget,
    rawDetoxXP,
    detoxXPTarget,
    detoxProgress,
    detoxComplete,
    rqIsDecaying,
    planId,
  ]);

  return {
    suggestions,
    topSuggestion: suggestions[0] || null,
    isLoading,
  };
}
