/**
 * ===========================================
 * ANTI-REPETITION ENGINE
 * ===========================================
 * 
 * Prevents perceptual repetition when replaying the same game.
 * Generates combo hashes, validates uniqueness, and filters near-duplicates.
 */

import { supabase } from "@/integrations/supabase/client";

// ────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────

export interface ComboHashParams {
  stimulusIds: string[];
  distractorSet?: string[];
  temporalParams?: Record<string, number>;
  ruleParams?: Record<string, any>;
  difficulty: string;
}

export interface RecentCombo {
  combo_hash: string;
  completed_at: string;
  difficulty: string | null;
}

export interface ValidationResult {
  valid: boolean;
  reason?: "exact_duplicate_today" | "recent_session" | "near_duplicate";
}

export interface SessionGeneratorResult<T> {
  session: T;
  fallbackUsed: boolean;
  duplicatesRejected: number;
  comboHash: string;
}

// ────────────────────────────────────────────────────────────
// CONFIGURATION
// ────────────────────────────────────────────────────────────

const EXCLUSION_WINDOW = {
  S1: 3, // Exclude last 3 sessions for S1 games
  S2: 2, // Exclude last 2 sessions for S2 games (stronger protection)
};

const DAYS_WINDOW = 7; // Also exclude any combo from last 7 days
const SIMILARITY_THRESHOLD = 0.75; // Reject if similarity >= 0.75
const MAX_GENERATION_ATTEMPTS = 10;

// ────────────────────────────────────────────────────────────
// HASH GENERATION
// ────────────────────────────────────────────────────────────

/**
 * Generate a deterministic hash from session parameters.
 * Uses a simple but effective string-based hash.
 */
export function generateComboHash(params: ComboHashParams): string {
  const parts: string[] = [
    params.difficulty,
    ...params.stimulusIds.sort(),
  ];

  if (params.distractorSet?.length) {
    parts.push("D:" + params.distractorSet.sort().join(","));
  }

  if (params.temporalParams) {
    const temporalStr = Object.entries(params.temporalParams)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(";");
    parts.push("T:" + temporalStr);
  }

  if (params.ruleParams) {
    const ruleStr = JSON.stringify(params.ruleParams, Object.keys(params.ruleParams).sort());
    parts.push("R:" + ruleStr);
  }

  // Simple hash function
  const combined = parts.join("|");
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `${params.difficulty.charAt(0)}${Math.abs(hash).toString(36)}`;
}

/**
 * Create a simpler hash for quick comparison (shorter, less collision-resistant).
 */
export function generateQuickHash(stimulusIds: string[], difficulty: string): string {
  const sortedIds = [...stimulusIds].sort();
  const combined = difficulty + ":" + sortedIds.join(",");
  
  let hash = 5381;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) + hash) + combined.charCodeAt(i);
  }
  
  return Math.abs(hash).toString(36);
}

// ────────────────────────────────────────────────────────────
// VALIDATION
// ────────────────────────────────────────────────────────────

/**
 * Check if a combo hash is valid (not recently used).
 */
export function isComboValid(
  comboHash: string,
  recentCombos: RecentCombo[],
  systemType: "S1" | "S2"
): ValidationResult {
  const today = new Date().toISOString().split("T")[0];
  const sessionLimit = EXCLUSION_WINDOW[systemType];

  // Rule 1: Never allow exact combo_hash reuse within same calendar day
  const usedToday = recentCombos.find(
    (c) => c.combo_hash === comboHash && c.completed_at.startsWith(today)
  );
  if (usedToday) {
    return { valid: false, reason: "exact_duplicate_today" };
  }

  // Rule 2: Exclude from last N sessions of the same game
  const recentSessions = recentCombos.slice(0, sessionLimit);
  const inRecentSessions = recentSessions.some((c) => c.combo_hash === comboHash);
  if (inRecentSessions) {
    return { valid: false, reason: "recent_session" };
  }

  return { valid: true };
}

/**
 * Calculate similarity score between two combo parameter sets.
 * Returns a value between 0 (completely different) and 1 (identical).
 */
export function calculateSimilarity(
  combo1: ComboHashParams,
  combo2: ComboHashParams
): number {
  // Weight factors for different dimensions
  const WEIGHTS = {
    stimulus: 0.45,
    distractor: 0.20,
    temporal: 0.15,
    rule: 0.20,
  };

  let totalScore = 0;

  // Stimulus overlap (Jaccard similarity)
  const set1 = new Set(combo1.stimulusIds);
  const set2 = new Set(combo2.stimulusIds);
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  const stimulusSimilarity = union.size > 0 ? intersection.size / union.size : 0;
  totalScore += stimulusSimilarity * WEIGHTS.stimulus;

  // Distractor overlap
  if (combo1.distractorSet && combo2.distractorSet) {
    const dSet1 = new Set(combo1.distractorSet);
    const dSet2 = new Set(combo2.distractorSet);
    const dIntersection = new Set([...dSet1].filter((x) => dSet2.has(x)));
    const dUnion = new Set([...dSet1, ...dSet2]);
    const distractorSimilarity = dUnion.size > 0 ? dIntersection.size / dUnion.size : 0;
    totalScore += distractorSimilarity * WEIGHTS.distractor;
  }

  // Temporal pattern similarity
  if (combo1.temporalParams && combo2.temporalParams) {
    const tKeys = new Set([
      ...Object.keys(combo1.temporalParams),
      ...Object.keys(combo2.temporalParams),
    ]);
    let temporalMatch = 0;
    tKeys.forEach((key) => {
      const v1 = combo1.temporalParams?.[key];
      const v2 = combo2.temporalParams?.[key];
      if (v1 !== undefined && v2 !== undefined) {
        // Consider similar if within 10% of each other
        const diff = Math.abs(v1 - v2) / Math.max(v1, v2, 1);
        if (diff < 0.1) temporalMatch++;
      }
    });
    const temporalSimilarity = tKeys.size > 0 ? temporalMatch / tKeys.size : 0;
    totalScore += temporalSimilarity * WEIGHTS.temporal;
  }

  // Rule structure similarity (exact match for now)
  if (combo1.ruleParams && combo2.ruleParams) {
    const rule1Str = JSON.stringify(combo1.ruleParams);
    const rule2Str = JSON.stringify(combo2.ruleParams);
    totalScore += (rule1Str === rule2Str ? 1 : 0) * WEIGHTS.rule;
  }

  return totalScore;
}

/**
 * Filter out near-duplicates from candidate session.
 */
export function isNearDuplicate(
  candidate: ComboHashParams,
  recentCombos: { params: ComboHashParams }[]
): boolean {
  for (const recent of recentCombos) {
    const similarity = calculateSimilarity(candidate, recent.params);
    if (similarity >= SIMILARITY_THRESHOLD) {
      return true;
    }
  }
  return false;
}

// ────────────────────────────────────────────────────────────
// DATABASE OPERATIONS
// ────────────────────────────────────────────────────────────

/**
 * Fetch recent combo hashes for a specific game.
 */
export async function fetchRecentCombos(
  userId: string,
  gameName: string,
  limit: number = 10
): Promise<RecentCombo[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - DAYS_WINDOW);

  const { data, error } = await supabase
    .from("user_game_history")
    .select("combo_hash, completed_at, difficulty")
    .eq("user_id", userId)
    .eq("game_name", gameName)
    .gte("completed_at", sevenDaysAgo.toISOString())
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[AntiRepetition] Failed to fetch recent combos:", error);
    return [];
  }

  return data || [];
}

/**
 * Record a completed session's combo hash.
 */
export async function recordComboHash(
  userId: string,
  gameName: string,
  comboHash: string,
  difficulty: string,
  qualityScore?: number,
  bonusApplied?: boolean,
  nearDuplicateRejected?: number,
  fallbackUsed?: boolean
): Promise<void> {
  const { error } = await supabase.from("user_game_history").insert({
    user_id: userId,
    game_name: gameName,
    combo_hash: comboHash,
    difficulty,
    quality_score: qualityScore,
    bonus_applied: bonusApplied ?? false,
    near_duplicate_rejected: nearDuplicateRejected ?? 0,
    fallback_used: fallbackUsed ?? false,
  });

  if (error) {
    console.error("[AntiRepetition] Failed to record combo hash:", error);
  } else {
    console.log("[AntiRepetition] Recorded combo hash:", {
      gameName,
      comboHash,
      difficulty,
    });
  }
}

// ────────────────────────────────────────────────────────────
// SESSION GENERATION
// ────────────────────────────────────────────────────────────

/**
 * Generate a valid session with anti-repetition applied.
 * Returns the session along with metadata about the generation process.
 */
export async function generateValidSession<T>(
  userId: string,
  gameName: string,
  systemType: "S1" | "S2",
  generator: () => T,
  getHashParams: (session: T) => ComboHashParams,
  maxAttempts: number = MAX_GENERATION_ATTEMPTS
): Promise<SessionGeneratorResult<T>> {
  // Fetch recent combos
  const recentCombos = await fetchRecentCombos(userId, gameName);
  
  let duplicatesRejected = 0;
  let fallbackUsed = false;
  let bestCandidate: T | null = null;
  let bestHash: string = "";

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = generator();
    const params = getHashParams(candidate);
    const hash = generateComboHash(params);

    const validation = isComboValid(hash, recentCombos, systemType);

    if (validation.valid) {
      // Found a valid, non-duplicate session
      console.log("[AntiRepetition] Valid session generated:", {
        gameName,
        attempt: attempt + 1,
        hash,
        duplicatesRejected,
      });
      
      return {
        session: candidate,
        fallbackUsed: false,
        duplicatesRejected,
        comboHash: hash,
      };
    }

    duplicatesRejected++;
    
    // Keep track of the last candidate in case we need fallback
    if (!bestCandidate) {
      bestCandidate = candidate;
      bestHash = hash;
    }
  }

  // Fallback: use the best candidate we found, even if it's a near-duplicate
  fallbackUsed = true;
  console.warn("[AntiRepetition] Fallback used after exhausting attempts:", {
    gameName,
    duplicatesRejected,
  });

  // Generate one more with randomized temporal params as fallback
  const fallbackSession = generator();
  const fallbackParams = getHashParams(fallbackSession);
  // Add randomization to make it unique
  fallbackParams.temporalParams = {
    ...fallbackParams.temporalParams,
    _fallbackNoise: Math.random(),
  };
  const fallbackHash = generateComboHash(fallbackParams);

  return {
    session: fallbackSession,
    fallbackUsed: true,
    duplicatesRejected,
    comboHash: fallbackHash,
  };
}

// ────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ────────────────────────────────────────────────────────────

/**
 * Get the system type for a game based on its game type.
 */
export function getSystemTypeFromGameType(gameType: string): "S1" | "S2" {
  return gameType.startsWith("S2") ? "S2" : "S1";
}

/**
 * Check if anti-repetition should be skipped (e.g., for testing).
 */
export function shouldSkipAntiRepetition(): boolean {
  // Can be extended to check for dev mode, testing flags, etc.
  return false;
}
