/**
 * ============================================
 * REASONING QUALITY (RQ) ENGINE
 * ============================================
 * 
 * RQ is a DERIVED METRIC measuring the QUALITY and EFFICIENCY of reasoning.
 * It is NOT a skill, does NOT assign XP, and does NOT replace CT or IN.
 * 
 * FORMULA:
 * RQ = clamp(0.50 × S2_Core + 0.30 × S2_Consistency + 0.20 × Task_Priming, 0, 100)
 * 
 * COMPONENTS:
 * - S2_Core = S2 = (CT + IN) / 2
 * - S2_Consistency = 100 - normalized_variance(S2_game_scores_last_N)
 * - Task_Priming = clamp(40 × depth_weight × continuity_factor, 0, 100)
 * 
 * CT / IN = how much reasoning the user can sustain (capacity)
 * RQ = how well the user reasons (quality)
 * 
 * DECAY:
 * - If no S2 game AND no task for 14 days: -2 points RQ per week
 * - Floor: RQ >= (S2_Core - 10)
 * 
 * COGNITIVE AGE INTEGRATION:
 * RQ MODULATES the effectiveness of improvement:
 * CognitiveAge = BaselineAge - (Improvement / 10) × (0.85 + 0.15 × RQ / 100)
 * Multiplier range: [0.85, 1.00]
 * 
 * TASK RULES:
 * - Tasks do NOT assign XP
 * - Tasks do NOT increase CT or IN
 * - Tasks do NOT unlock games
 * - Tasks influence ONLY Reasoning Quality (RQ)
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
// S2_CONSISTENCY
// ============================================

/**
 * Measures stability of reasoning in S2 games
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
  
  // TEMPORARY PLACEHOLDER VALUES
  // TODO: Replace with editorial-defined depth mapping
  const depth_weight = 0.6;
  const continuity_factor = 1.0;
  
  return clamp(40 * depth_weight * continuity_factor, 0, 100);
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
  
  // 4. Base RQ
  const baseRQ = 0.50 * s2Core + 0.30 * s2Consistency + 0.20 * taskPriming;
  
  // 5. Apply decay
  const { decay, floor } = calculateRQDecay(
    input.lastS2GameAt,
    input.lastTaskAt,
    s2Core,
    today
  );
  
  // 6. Final RQ with floor
  const finalRQ = clamp(baseRQ - decay, floor, 100);
  
  return {
    rq: Math.round(finalRQ * 10) / 10,
    s2Core: Math.round(s2Core * 10) / 10,
    s2Consistency: Math.round(s2Consistency * 10) / 10,
    taskPriming: Math.round(taskPriming * 10) / 10,
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
