/**
 * Podcast Tasks Permissioning Engine
 * 
 * This hook implements cognitive-based permissioning for podcast content.
 * The value is: "today this is enabled because your cognitive state supports it"
 * and "today this is withheld because it would overload you."
 * 
 * METRICS USED:
 * - Sharpness (0-100): immediate cognitive performance
 * - Readiness (0-100): overall readiness for cognitive work
 * - Recovery (0-100): S1 buffer / stability
 * 
 * DERIVED INDICES:
 * - S2Capacity = round(0.6 * Sharpness + 0.4 * Readiness)
 * - S1Buffer = Recovery
 * 
 * GLOBAL MODES:
 * - RECOVERY_MODE: S1Buffer < 45 → withhold everything
 * - LOW_BANDWIDTH_MODE: S1Buffer >= 45 AND S2Capacity < 55 → only LOW/MEDIUM
 * - FULL_CAPACITY_MODE: normal eligibility rules
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
  enabled: boolean;
  withheldReason: string | null;
  fitScore: number;
}

export interface PodcastPermissioningResult {
  // Current cognitive indices
  s2Capacity: number;
  s1Buffer: number;
  sharpness: number;
  
  // Global mode
  globalMode: GlobalMode;
  
  // Eligible podcasts (max 3, sorted by fitScore)
  enabledPodcasts: PodcastEligibility[];
  
  // All withheld podcasts
  withheldPodcasts: PodcastEligibility[];
  
  // Whether we're in recovery mode (show special card)
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
 * Check if a podcast is eligible based on demand thresholds
 */
function checkEligibility(
  podcast: Podcast,
  s1Buffer: number,
  s2Capacity: number,
  sharpness: number,
  globalMode: GlobalMode
): { enabled: boolean; reason: string | null } {
  // In RECOVERY_MODE, everything is withheld
  if (globalMode === "RECOVERY_MODE") {
    return {
      enabled: false,
      reason: "Withheld: system prioritizes restoration over cognitive input.",
    };
  }
  
  // In LOW_BANDWIDTH_MODE, only LOW and MEDIUM are allowed
  if (globalMode === "LOW_BANDWIDTH_MODE") {
    if (podcast.demand === "HIGH" || podcast.demand === "VERY_HIGH") {
      return {
        enabled: false,
        reason: `Withheld: today's capacity does not support ${podcast.demand} load.`,
      };
    }
  }
  
  // Check demand-specific thresholds
  const thresholds = DEMAND_THRESHOLDS[podcast.demand];
  
  if (s1Buffer < thresholds.s1Buffer) {
    return {
      enabled: false,
      reason: `Withheld: today's capacity does not support ${podcast.demand} load.`,
    };
  }
  
  if (s2Capacity < thresholds.s2Capacity) {
    return {
      enabled: false,
      reason: `Withheld: today's capacity does not support ${podcast.demand} load.`,
    };
  }
  
  // VERY_HIGH also requires sharpness check
  if (podcast.demand === "VERY_HIGH" && thresholds.sharpness) {
    if (sharpness < thresholds.sharpness) {
      return {
        enabled: false,
        reason: `Withheld: today's capacity does not support ${podcast.demand} load.`,
      };
    }
  }
  
  return {
    enabled: true,
    reason: null,
  };
}

/**
 * Calculate fit score for ranking enabled podcasts
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
    
    // Process all podcasts
    const allEligibility: PodcastEligibility[] = PODCASTS.map((podcast) => {
      const { enabled, reason } = checkEligibility(
        podcast,
        s1Buffer,
        s2Capacity,
        sharpness,
        globalMode
      );
      
      const fitScore = calculateFitScore(podcast, s2Capacity, s1Buffer);
      
      return {
        podcast,
        enabled,
        withheldReason: reason,
        fitScore,
      };
    });
    
    // Separate enabled and withheld
    const enabledAll = allEligibility
      .filter((e) => e.enabled)
      .sort((a, b) => b.fitScore - a.fitScore);
    
    const withheldAll = allEligibility.filter((e) => !e.enabled);
    
    // Only show top 3 enabled (to avoid "catalog" effect)
    const enabledTop3 = enabledAll.slice(0, 3);
    
    return {
      s2Capacity,
      s1Buffer,
      sharpness,
      globalMode,
      enabledPodcasts: enabledTop3,
      withheldPodcasts: withheldAll,
      isRecoveryMode: globalMode === "RECOVERY_MODE",
    };
  }, [sharpness, readiness, recovery]);
  
  return {
    ...result,
    isLoading,
  };
}
