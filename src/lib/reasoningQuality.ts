/**
 * ============================================
 * REASONING QUALITY (RQ) ENGINE v2.0
 * ============================================
 * 
 * RQ is a DERIVED METRIC measuring the QUALITY and EFFICIENCY of reasoning.
 * It is NOT a skill, does NOT assign XP, and does NOT replace CT or IN.
 * 
 * FORMULA (updated per Global Game Feedback Spec):
 * RQ = clamp(0.50 × S2_Core + 0.30 × S2_Consistency + 0.20 × Task_Priming, 0, 100)
 * 
 * COMPONENTS:
 * - S2_Core = S2 = (CT + IN) / 2
 * - S2_Consistency = stability/coherence of S2 reasoning (internal, never user-facing)
 * - Task_Priming = conceptual priming from tasks (affects RQ only via Task_Priming)
 * 
 * S2 CONSISTENCY (Internal - Never User-Facing):
 * Per S2 session compute:
 * S2_session_quality = 0.5 × normalized_accuracy + 0.3 × consistency_score + 0.2 × coherence_score
 * 
 * Update rule:
 * - If S2_session_quality >= 0.70 → increase S2_Consistency slightly (+2)
 * - If 0.50–0.69 → no change
 * - If < 0.50 → slight decrease (-1)
 * 
 * Constraints:
 * - Clamp S2_Consistency to [0,100]
 * - NEVER update from S1 games
 * - NEVER update from tasks directly
 * 
 * CONNECTION TO RQ:
 * - S2 games do NOT directly increase RQ
 * - S2 games affect RQ ONLY via S2_Consistency
 * - Tasks affect RQ ONLY via Task_Priming
 * 
 * COGNITIVE AGE INTEGRATION:
 * RQ MODULATES the effectiveness of improvement:
 * CognitiveAge = BaselineAge - (Improvement / 10) × (0.85 + 0.15 × RQ / 100)
 * Multiplier range: [0.85, 1.00]
 */

import { clamp } from "@/lib/cognitiveEngine";

// ============================================
// TYPES
// ============================================

export interface RQInput {
  S2: number; // (CT + IN) / 2, from CognitiveStates
  s2GameScores: number[]; // Last N S2 game scores (0-100 each)
  taskCompletions: TaskCompletion[]; // Last 7 days of tasks
  lastS2GameAt: Date | null;
  lastTaskAt: Date | null;
  today?: Date;
}

export interface TaskCompletion {
  type: "podcast" | "book" | "article";
  completedAt: Date;
  // TODO: Add these when editorial coefficients are defined
  // category?: string; // e.g., "philosophy", "scientific", "classic"
  // depth?: "light" | "medium" | "deep";
}

export interface RQResult {
  rq: number;
  s2Core: number;
  s2Consistency: number;
  taskPriming: number;
  // Pre-calculated contributions (for display consistency)
  s2CoreContribution: number;
  s2ConsistencyContribution: number;
  taskPrimingContribution: number;
  decay: number;
  isDecaying: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const S2_GAME_WINDOW = 10; // Last 10 S2 sessions
const S2_GAME_FALLBACK_CONSISTENCY = 50; // When < 5 sessions
const TASK_WINDOW_DAYS = 7;
const DECAY_INACTIVITY_DAYS = 14;
const DECAY_PER_WEEK = 2;

// ============================================
// S2_CORE
// ============================================

/**
 * S2_Core is simply S2 from cognitive states
 */
export function calculateS2Core(S2: number): number {
  return S2;
}

// ============================================
// S2_CONSISTENCY (Internal - Never User-Facing)
// ============================================

/**
 * S2_Consistency measures stability and coherence of System 2 reasoning over time.
 * 
 * Per S2 session compute:
 * S2_session_quality = 0.5 * normalized_accuracy + 0.3 * consistency_score + 0.2 * coherence_score
 * 
 * Update rule:
 * - If S2_session_quality >= 0.70 → increase S2_Consistency slightly
 * - If 0.50–0.69 → no change
 * - If < 0.50 → slight decrease
 * 
 * For now, we approximate using score variance as a proxy for consistency.
 * S2_Consistency = 100 - normalized_variance(S2_game_scores_last_N)
 * 
 * Uses last 10 S2 sessions. If < 5 sessions, fallback = 50
 */
export function calculateS2Consistency(scores: number[]): number {
  if (scores.length < 5) {
    return S2_GAME_FALLBACK_CONSISTENCY;
  }
  
  // Take last N scores
  const recentScores = scores.slice(-S2_GAME_WINDOW);
  
  if (recentScores.length === 0) {
    return S2_GAME_FALLBACK_CONSISTENCY;
  }
  
  // Calculate mean
  const mean = recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length;
  
  // Calculate variance
  const variance = recentScores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / recentScores.length;
  
  // Standard deviation
  const stdDev = Math.sqrt(variance);
  
  // Normalize: stdDev of 0 = perfect consistency (100), stdDev of 50 = very inconsistent (0)
  // Using a scale where stdDev of 25 maps to ~50% consistency
  const normalizedVariance = clamp((stdDev / 50) * 100, 0, 100);
  
  return clamp(100 - normalizedVariance, 0, 100);
}

/**
 * Calculate S2 session quality for updating S2 Consistency.
 * 
 * S2_session_quality = 0.5 * normalized_accuracy + 0.3 * consistency_score + 0.2 * coherence_score
 * 
 * Returns a value between 0 and 1.
 */
export function calculateS2SessionQuality(
  accuracy: number, // 0-100
  consistencyScore: number, // 0-100 (e.g., low RT variance)
  coherenceScore: number // 0-100 (e.g., deliberation time appropriate)
): number {
  const normalizedAccuracy = clamp(accuracy / 100, 0, 1);
  const normalizedConsistency = clamp(consistencyScore / 100, 0, 1);
  const normalizedCoherence = clamp(coherenceScore / 100, 0, 1);
  
  return 0.5 * normalizedAccuracy + 0.3 * normalizedConsistency + 0.2 * normalizedCoherence;
}

/**
 * Determine S2 Consistency delta based on session quality.
 * 
 * - If quality >= 0.70 → +2 to consistency
 * - If 0.50–0.69 → no change
 * - If < 0.50 → -1 to consistency
 */
export function getS2ConsistencyDelta(sessionQuality: number): number {
  if (sessionQuality >= 0.70) return 2;
  if (sessionQuality >= 0.50) return 0;
  return -1;
}

// ============================================
// TASK_PRIMING
// ============================================

/**
 * Task_Priming measures conceptual priming from cognitive Tasks.
 * 
 * Formula (structural):
 * Task_Priming = clamp(40 × depth_weight × continuity_factor, 0, 100)
 * 
 * TEMPORARY RULES (stub):
 * - If no task in last 7 days → Task_Priming = 0
 * - If >= 1 task → use placeholder values:
 *   depth_weight = 0.6
 *   continuity_factor = 1.0
 * 
 * TODO: Define editorial coefficients for:
 * - Podcast (light / deep)
 * - Reading (essay / scientific / philosophy)
 * - Book (classic philosophy, modern, fiction)
 */
// Base weights for task types
export const TASK_TYPE_WEIGHTS: Record<string, number> = {
  podcast: 12,   // Lighter content
  article: 15,   // Medium depth
  book: 20,      // Deepest engagement
};

/**
 * Calculate the RQ contribution for a SINGLE task.
 * Returns the exact points this task contributes.
 * 
 * If completedAt is provided, applies recency decay.
 * If completedAt is null (new task), returns fresh contribution.
 */
export function calculateSingleTaskRQContribution(
  type: "podcast" | "article" | "book",
  completedAt: Date | null = null,
  today: Date = new Date()
): number {
  const baseScore = TASK_TYPE_WEIGHTS[type] || 12;
  
  if (!completedAt) {
    // New task completed today = full contribution
    return baseScore;
  }
  
  const daysAgo = Math.floor((today.getTime() - completedAt.getTime()) / (1000 * 60 * 60 * 24));
  
  // Recency weight: today=1.0, 7 days ago=0.3
  const recencyWeight = Math.max(0.3, 1 - (daysAgo * 0.1));
  
  return Math.round(baseScore * recencyWeight * 10) / 10;
}

export function calculateTaskPriming(
  tasks: TaskCompletion[],
  today: Date = new Date()
): number {
  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() - TASK_WINDOW_DAYS);
  
  // Filter to last 7 days
  const recentTasks = tasks.filter(t => t.completedAt >= windowStart && t.completedAt <= today);
  
  if (recentTasks.length === 0) {
    return 0;
  }
  
  // Calculate weighted score with recency decay
  let totalScore = 0;
  for (const task of recentTasks) {
    totalScore += calculateSingleTaskRQContribution(task.type, task.completedAt, today);
  }
  
  // Cap at 100, with diminishing returns after 5 tasks
  // First 5 tasks contribute fully, additional tasks at 50%
  const effectiveTasks = Math.min(recentTasks.length, 5) + Math.max(0, recentTasks.length - 5) * 0.5;
  const normalized = Math.min(totalScore, effectiveTasks * 20);
  
  return clamp(normalized, 0, 100);
}

// ============================================
// RQ DECAY
// ============================================

/**
 * If no S2 game AND no task for 14 days: -2 points RQ per week
 * Floor: RQ >= (S2_Core - 10)
 */
export function calculateRQDecay(
  lastS2GameAt: Date | null,
  lastTaskAt: Date | null,
  s2Core: number,
  today: Date = new Date()
): { decay: number; floor: number } {
  const floor = Math.max(0, s2Core - 10);
  
  // Find the most recent activity
  let lastActivityAt: Date | null = null;
  if (lastS2GameAt && lastTaskAt) {
    lastActivityAt = lastS2GameAt > lastTaskAt ? lastS2GameAt : lastTaskAt;
  } else {
    lastActivityAt = lastS2GameAt || lastTaskAt;
  }
  
  if (!lastActivityAt) {
    // No activity ever - no decay (newly onboarded user)
    return { decay: 0, floor };
  }
  
  const daysSinceActivity = Math.floor(
    (today.getTime() - lastActivityAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceActivity < DECAY_INACTIVITY_DAYS) {
    return { decay: 0, floor };
  }
  
  // Calculate weeks of inactivity after the 14-day grace period
  const weeksOfDecay = Math.floor((daysSinceActivity - DECAY_INACTIVITY_DAYS) / 7) + 1;
  const decay = weeksOfDecay * DECAY_PER_WEEK;
  
  return { decay, floor };
}

// ============================================
// MAIN RQ CALCULATION
// ============================================

/**
 * Calculate Reasoning Quality (RQ)
 * 
 * RQ = clamp(0.50 × S2_Core + 0.30 × S2_Consistency + 0.20 × Task_Priming, 0, 100)
 * 
 * Then apply decay if inactive for 14+ days
 * Floor: RQ >= (S2_Core - 10)
 */
export function calculateRQ(input: RQInput): RQResult {
  const today = input.today || new Date();
  
  // 1. S2_Core
  const s2Core = calculateS2Core(input.S2);
  
  // 2. S2_Consistency
  const s2Consistency = calculateS2Consistency(input.s2GameScores);
  
  // 3. Task_Priming
  const taskPriming = calculateTaskPriming(input.taskCompletions, today);
  
  // 4. Calculate contributions (raw, for display consistency)
  const s2CoreContribution = s2Core * 0.50;
  const s2ConsistencyContribution = s2Consistency * 0.30;
  const taskPrimingContribution = taskPriming * 0.20;
  
  // 5. Base RQ
  const baseRQ = s2CoreContribution + s2ConsistencyContribution + taskPrimingContribution;
  
  // 6. Apply decay
  const { decay, floor } = calculateRQDecay(
    input.lastS2GameAt,
    input.lastTaskAt,
    s2Core,
    today
  );
  
  // 7. Final RQ with floor
  const finalRQ = clamp(baseRQ - decay, floor, 100);
  
  return {
    rq: Math.round(finalRQ * 10) / 10,
    s2Core: Math.round(s2Core * 10) / 10,
    s2Consistency: Math.round(s2Consistency * 10) / 10,
    taskPriming: Math.round(taskPriming * 10) / 10,
    s2CoreContribution: Math.round(s2CoreContribution * 10) / 10,
    s2ConsistencyContribution: Math.round(s2ConsistencyContribution * 10) / 10,
    taskPrimingContribution: Math.round(taskPrimingContribution * 10) / 10,
    decay: Math.round(decay * 10) / 10,
    isDecaying: decay > 0,
  };
}

// ============================================
// COGNITIVE AGE MODULATION
// ============================================

/**
 * RQ modulates the effectiveness of cognitive improvement.
 * 
 * NEW FORMULA:
 * CognitiveAge = BaselineAge - (Improvement / 10) × (0.85 + 0.15 × RQ / 100)
 * 
 * Multiplier range: [0.85, 1.00]
 * Max RQ impact: +15% effectiveness
 * If RQ unavailable: use 0.85 (conservative)
 */
export function calculateRQMultiplier(rq: number | null): number {
  if (rq === null || rq === undefined) {
    return 0.85;
  }
  
  const multiplier = 0.85 + 0.15 * (rq / 100);
  return clamp(multiplier, 0.85, 1.0);
}
