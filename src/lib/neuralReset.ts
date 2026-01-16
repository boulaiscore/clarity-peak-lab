// Neural Reset Configuration
// A short session to stabilize cognitive activity.
// Does NOT award XP, does NOT increase skills, does NOT affect Engagement.
// ONLY contributes to Consolidation (Recovery).

export const NEURAL_RESET_CONFIG = {
  minDuration: 180, // 3 min in seconds
  maxDuration: 300, // 5 min in seconds
  defaultDuration: 240, // 4 min in seconds
  recoveryContribution: 5, // +5% equivalent to Recovery per session
  phases: {
    breathing: 90, // 90 seconds rhythmic breathing
    anchoring: 60, // 60 seconds attention anchoring
    awareness: 60, // 60 seconds open awareness
  },
};

export type NeuralResetTriggerReason = 
  | "high-activity-low-stability" 
  | "post-intensive" 
  | "pre-continuation" 
  | null;

export interface NeuralResetTrigger {
  shouldShow: boolean;
  reason: NeuralResetTriggerReason;
  copy: string;
  cta: string;
}

/**
 * Evaluate whether to show the Neural Reset prompt
 * 
 * RULE 1: High Activity + Low Stability
 * RULE 2: Post-intensive training (handled externally)
 * RULE 3: Replace hard locks (deprecated)
 * RULE 4: Don't show when Activity Low OR Stability already Stable
 */
export function evaluateNeuralResetTrigger(
  activityScore: number, // Behavioral Engagement (BE) score
  stabilityScore: number, // Focus stability (AE) score
  recentSessionsCount: number = 0,
  isPostSession: boolean = false
): NeuralResetTrigger {
  
  // RULE 4: Don't show when Activity is Low
  if (activityScore < 30) {
    return { shouldShow: false, reason: null, copy: "", cta: "" };
  }
  
  // RULE 4: Don't show when Stability is already Stable
  if (stabilityScore >= 50) {
    return { shouldShow: false, reason: null, copy: "", cta: "" };
  }
  
  // RULE 2: Post-intensive session
  if (isPostSession && (recentSessionsCount >= 2 || activityScore >= 80)) {
    return {
      shouldShow: true,
      reason: "post-intensive",
      copy: "Consolidate cognitive activity before continuing.",
      cta: "Start Neural Reset",
    };
  }
  
  // RULE 1: High Activity + Low Stability
  if (activityScore >= 70 && stabilityScore < 40) {
    return {
      shouldShow: true,
      reason: "high-activity-low-stability",
      copy: "Your cognitive activity is high, but the network is unstable.",
      cta: "Stabilize activity (5 min)",
    };
  }
  
  // Default: don't show
  return { shouldShow: false, reason: null, copy: "", cta: "" };
}

/**
 * Get the phase timings for a Neural Reset session
 */
export function getNeuralResetPhases(totalDuration: number = NEURAL_RESET_CONFIG.defaultDuration) {
  const ratio = totalDuration / (NEURAL_RESET_CONFIG.phases.breathing + 
                                  NEURAL_RESET_CONFIG.phases.anchoring + 
                                  NEURAL_RESET_CONFIG.phases.awareness);
  
  return {
    breathing: Math.round(NEURAL_RESET_CONFIG.phases.breathing * ratio),
    anchoring: Math.round(NEURAL_RESET_CONFIG.phases.anchoring * ratio),
    awareness: Math.round(NEURAL_RESET_CONFIG.phases.awareness * ratio),
  };
}
