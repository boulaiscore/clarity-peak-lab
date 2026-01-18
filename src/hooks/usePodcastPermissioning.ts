/**
 * Podcast Tasks Permissioning Engine v2.0
 * 
 * OFFICIAL NEUROLOOP RULES:
 * - Passive Tasks (Podcasts) are ALWAYS accessible
 * - Recovery and cognitive state govern SUGGESTION, not BLOCKING
 * - Tasks are cognitive support, not training
 * 
 * MODES determine what is SUGGESTED, not what is BLOCKED:
 * - RECOVERY_MODE: S1Buffer < 45 → suggest LOW only, but all are accessible
 * - LOW_BANDWIDTH_MODE: S1Buffer >= 45 AND S2Capacity < 55 → suggest LOW/MEDIUM
 * - FULL_CAPACITY_MODE: suggest all based on fit score
 */

import { useMemo } from "react";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { 
  PODCASTS, 
  Podcast, 
  PodcastDemand, 
  DEMAND_PENALTY, 
  DEMAND_THRESHOLDS 
} from "@/data/podcasts";

export type GlobalMode = "RECOVERY_MODE" | "LOW_BANDWIDTH_MODE" | "FULL_CAPACITY_MODE";

export interface PodcastEligibility {
  podcast: Podcast;
  enabled: boolean;        // v2.0: ALWAYS true for passive tasks
  suggested: boolean;      // v2.0: Based on cognitive state
  withheldReason: string | null;  // Now: suggestion reason, not block reason
  fitScore: number;
}

export interface PodcastPermissioningResult {
  // Current cognitive indices
  s2Capacity: number;
  s1Buffer: number;
  sharpness: number;
  
  // Global mode
  globalMode: GlobalMode;
  
  // v2.0: Suggested podcasts (cognitive state supports these best)
  suggestedPodcasts: PodcastEligibility[];
  
  // v2.0: All podcasts (always enabled, sorted by fit)
  enabledPodcasts: PodcastEligibility[];
  
  // v2.0: Non-suggested podcasts (accessible but not optimal today)
  notSuggestedPodcasts: PodcastEligibility[];
  
  // Legacy: withheldPodcasts for backwards compatibility
  withheldPodcasts: PodcastEligibility[];
  
  // Whether we're in recovery mode (show supportive messaging)
  isRecoveryMode: boolean;
  
  // Loading state
  isLoading: boolean;
}

/**
 * Determine the global mode based on cognitive indices
 */
function determineGlobalMode(s1Buffer: number, s2Capacity: number): GlobalMode {
  if (s1Buffer < 45) {
    return "RECOVERY_MODE";
  }
  if (s2Capacity < 55) {
    return "LOW_BANDWIDTH_MODE";
  }
  return "FULL_CAPACITY_MODE";
}

/**
 * v2.0: Check if a podcast is SUGGESTED (not blocked) based on cognitive state
 * All podcasts are ALWAYS accessible - this only determines suggestion priority
 */
function checkSuggestion(
  podcast: Podcast,
  s1Buffer: number,
  s2Capacity: number,
  sharpness: number,
  globalMode: GlobalMode
): { suggested: boolean; reason: string | null } {
  // In RECOVERY_MODE, suggest only LOW demand podcasts
  // But all are still ACCESSIBLE (enabled = true always)
  if (globalMode === "RECOVERY_MODE") {
    if (podcast.demand === "LOW") {
      return {
        suggested: true,
        reason: "Suggested: light content supports recovery without adding load.",
      };
    }
    return {
      suggested: false,
      reason: "Available but not suggested during recovery. Light content preferred today.",
    };
  }
  
  // In LOW_BANDWIDTH_MODE, suggest LOW and MEDIUM only
  if (globalMode === "LOW_BANDWIDTH_MODE") {
    if (podcast.demand === "LOW" || podcast.demand === "MEDIUM") {
      return {
        suggested: true,
        reason: null,
      };
    }
    return {
      suggested: false,
      reason: "Available but cognitive bandwidth limited for high-demand content today.",
    };
  }
  
  // FULL_CAPACITY_MODE: check demand-specific thresholds for suggestion
  const thresholds = DEMAND_THRESHOLDS[podcast.demand];
  
  if (s1Buffer < thresholds.s1Buffer) {
    return {
      suggested: false,
      reason: `Available but recovery is below optimal for ${podcast.demand.toLowerCase().replace('_', ' ')} content.`,
    };
  }
  
  if (s2Capacity < thresholds.s2Capacity) {
    return {
      suggested: false,
      reason: `Available but deep work capacity limited for ${podcast.demand.toLowerCase().replace('_', ' ')} content.`,
    };
  }
  
  // VERY_HIGH also checks sharpness for suggestion
  if (podcast.demand === "VERY_HIGH" && thresholds.sharpness) {
    if (sharpness < thresholds.sharpness) {
      return {
        suggested: false,
        reason: `Available but sharpness below optimal for ${podcast.demand.toLowerCase().replace('_', ' ')} content.`,
      };
    }
  }
  
  return {
    suggested: true,
    reason: null,
  };
}

/**
 * Calculate fit score for ranking podcasts
 * fitScore = (S2Capacity - penaltyDemand) + 0.35 * (S1Buffer - 50)
 */
function calculateFitScore(
  podcast: Podcast,
  s2Capacity: number,
  s1Buffer: number
): number {
  const penalty = DEMAND_PENALTY[podcast.demand];
  return (s2Capacity - penalty) + 0.35 * (s1Buffer - 50);
}

export function usePodcastPermissioning(): PodcastPermissioningResult {
  const { sharpness, readiness, recovery, isLoading } = useTodayMetrics();
  
  const result = useMemo(() => {
    // Calculate derived indices
    const s2Capacity = Math.round(0.6 * sharpness + 0.4 * readiness);
    const s1Buffer = recovery;
    
    // Determine global mode
    const globalMode = determineGlobalMode(s1Buffer, s2Capacity);
    
    // Process all podcasts - ALL are enabled (v2.0 rule)
    const allEligibility: PodcastEligibility[] = PODCASTS.map((podcast) => {
      const { suggested, reason } = checkSuggestion(
        podcast,
        s1Buffer,
        s2Capacity,
        sharpness,
        globalMode
      );
      
      const fitScore = calculateFitScore(podcast, s2Capacity, s1Buffer);
      
      return {
        podcast,
        enabled: true,  // v2.0: ALWAYS true for passive tasks
        suggested,
        withheldReason: reason,  // Now used for suggestion reason
        fitScore,
      };
    });
    
    // Separate suggested and not-suggested
    const suggestedAll = allEligibility
      .filter((e) => e.suggested)
      .sort((a, b) => b.fitScore - a.fitScore);
    
    const notSuggestedAll = allEligibility
      .filter((e) => !e.suggested)
      .sort((a, b) => b.fitScore - a.fitScore);
    
    // Show top 3 suggested as "enabled" for display
    const suggestedTop3 = suggestedAll.slice(0, 3);
    
    return {
      s2Capacity,
      s1Buffer,
      sharpness,
      globalMode,
      // v2.0: New fields
      suggestedPodcasts: suggestedTop3,
      // v2.0: All podcasts are enabled
      enabledPodcasts: suggestedTop3,  // For backwards compatibility
      notSuggestedPodcasts: notSuggestedAll,
      // Legacy backwards compatibility: treat non-suggested as "withheld" for UI
      withheldPodcasts: notSuggestedAll,
      isRecoveryMode: globalMode === "RECOVERY_MODE",
    };
  }, [sharpness, readiness, recovery]);
  
  return {
    ...result,
    isLoading,
  };
}
