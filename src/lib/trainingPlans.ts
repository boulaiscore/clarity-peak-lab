/**
 * ============================================
 * NEUROLOOP PRO – TRAINING PLANS v1.4
 * ============================================
 * 
 * Technical Manual v1.4 Aligned
 * 
 * KEY CHANGES (v1.4):
 * - Added dailyEstimate for clear time commitment communication
 * - Added periodType to clarify rolling 7-day windows
 * - Added gatingExplainer to explain S2 unlock requirements
 * - Added whatYouDo and forWhom for simplified UI
 */

export type TrainingPlanId = "light" | "expert" | "superhuman";

export type SessionType = "fast-focus" | "mixed" | "consolidation" | "fast-control" | "slow-reasoning" | "dual-process" | "heavy-slow" | "dual-stress" | "reflection";

export type ContentType = "podcast" | "reading" | "book-extract" | "none";

export interface SessionConfig {
  id: SessionType;
  name: string;
  description: string;
  duration: string;
  thinkingSystems: ("S1" | "S2")[];
  content: {
    type: ContentType;
    required: boolean;
    duration?: string;
    description: string;
  } | null;
  games: {
    focus: "S1" | "S2" | "S1+S2";
    intensity: "light" | "medium" | "heavy";
  };
}

export interface DetoxRequirement {
  weeklyMinutes: number;
  dailyMinimumMinutes: number;
  minSessionMinutes: number;
  xpPerMinute: number;
  bonusXP: number;
  walkingRequired: boolean;
  walkingMinMinutes: number;
}

/**
 * Games Gating Modifiers (v1.3, updated v1.8)
 * Applied to S2 thresholds based on training plan
 */
export interface GamesGatingModifiers {
  s2ThresholdModifier: number; // +3 for Light, 0 for Expert, -5 for Superhuman
  requireRecForS2: number; // Minimum REC for S2 games
  insightMaxPerWeek: number; // Weekly cap for S2-IN
  s2MaxPerWeek: number; // Weekly cap for all S2 games
  dailyGamesWithXP: number; // v1.8: Max games that award XP per day (Light=3, Expert=5, Superhuman=7)
}

/**
 * Daily time estimate breakdown (v1.4)
 */
export interface DailyEstimate {
  total: string;
  games: string;
  recovery: string;
  tasks: string;
}

/**
 * Gating explainer for user education (v1.4)
 */
export interface GatingExplainer {
  s2Requirement: string;
  s1AlwaysAvailable: boolean;
  prerequisiteForS2: string;
}

export interface TrainingPlan {
  id: TrainingPlanId;
  name: string;
  tagline: string;
  description: string;
  philosophy: string;
  targetAudience: string[];
  sessionsPerWeek: number;
  sessionDuration: string;
  contentPerWeek: number; // Protocol adherence tracking (count, not XP)
  contentTypes: ContentType[];
  intensity: "low" | "medium" | "high";
  color: string;
  icon: "leaf" | "target" | "flame";
  // XP target is ONLY from games (v1.3)
  xpTargetWeek: number;
  weeklyXPTarget: number; // Alias for xpTargetWeek (backward compat)
  contentXPTarget: number; // v1.3: always 0 (tasks don't give XP)
  detox: DetoxRequirement;
  gamesGating: GamesGatingModifiers;
  sessions: SessionConfig[];
  // v1.4: New fields for clearer communication
  dailyEstimate: DailyEstimate;
  periodType: "rolling-7-days";
  gatingExplainer: GatingExplainer;
  whatYouDo: string[];
  forWhom: string;
}

// XP Points configuration (Games only in v1.3)
// Note: Content XP values kept at 0 for backward compatibility
export const XP_VALUES = {
  // Games (full session of ~5 exercises)
  gameComplete: 25,
  gamePerfect: 10, // Bonus for 90%+ score
  // Individual exercise XP by difficulty
  exerciseEasy: 3,
  exerciseMedium: 5,
  exerciseHard: 8,
  // Content - v1.3: Tasks don't give XP (values kept for API compat)
  podcastComplete: 0,
  readingComplete: 0,
  bookChapterComplete: 0,
  // Detox - uniform rate across all plans
  detoxPerMinute: 0.05,
  detoxWeeklyBonus: 5,
} as const;

/**
 * Standardized Game XP by Difficulty (v1.5)
 * All games use these uniform values for consistency
 */
export const GAME_XP_BY_DIFFICULTY = {
  easy: { base: 15, perfectBonus: 8 },     // Range: 15-23 XP
  medium: { base: 22, perfectBonus: 10 },  // Range: 22-32 XP
  hard: { base: 30, perfectBonus: 12 },    // Range: 30-42 XP
} as const;

export type GameDifficulty = keyof typeof GAME_XP_BY_DIFFICULTY;

/**
 * Calculate game XP based on difficulty and performance
 * @param difficulty - The game difficulty level
 * @param isPerfect - Whether the player achieved perfect performance
 * @returns Total XP awarded
 */
export function calculateGameXP(difficulty: GameDifficulty, isPerfect: boolean): number {
  const config = GAME_XP_BY_DIFFICULTY[difficulty];
  return config.base + (isPerfect ? config.perfectBonus : 0);
}

// Helper to get XP for exercise difficulty
export function getExerciseXP(difficulty: "easy" | "medium" | "hard"): number {
  switch (difficulty) {
    case "easy": return XP_VALUES.exerciseEasy;
    case "medium": return XP_VALUES.exerciseMedium;
    case "hard": return XP_VALUES.exerciseHard;
    default: return XP_VALUES.exerciseMedium;
  }
}

export const TRAINING_PLANS: Record<TrainingPlanId, TrainingPlan> = {
  light: {
    id: "light",
    name: "Light Training",
    tagline: "Stability-first cognitive training",
    description: "Conservative load window with low pressure on recovery. Prioritizes continuity over intensity.",
    philosophy: "Maintains cognitive function within a narrow effective range, minimizing recovery dependency.",
    targetAudience: [
      "Conservative load preference",
      "Variable availability",
      "Recovery-limited capacity"
    ],
    sessionsPerWeek: 3,
    sessionDuration: "15-18 min",
    contentPerWeek: 1, // Protocol adherence (count only)
    contentTypes: ["podcast", "reading"],
    intensity: "low",
    color: "emerald",
    icon: "leaf",
    // v1.5: Reduced target for sustainability (4-5 games/week)
    xpTargetWeek: 80,
    weeklyXPTarget: 80, // Alias
    contentXPTarget: 0, // v1.3: tasks don't give XP
    detox: {
      weeklyMinutes: 480,
      dailyMinimumMinutes: 30,
      minSessionMinutes: 30,
      xpPerMinute: 0.05,
      bonusXP: 5,
      walkingRequired: true,
      walkingMinMinutes: 30,
    },
    // v1.3: Games gating modifiers
    gamesGating: {
      s2ThresholdModifier: 3, // +3 to S2 thresholds (harder to access)
      requireRecForS2: 50,
      insightMaxPerWeek: 2,
      s2MaxPerWeek: 4,
      dailyGamesWithXP: 3, // v1.8: Max 3 games/day award XP
    },
    // v1.5: Clear communication fields
    dailyEstimate: {
      total: "~15-20 min",
      games: "1 game/day (~15 min)",
      recovery: "~30 min (Detox/Walking)",
      tasks: "Optional"
    },
    periodType: "rolling-7-days",
    gatingExplainer: {
      s2Requirement: "Recovery ≥ 50%",
      s1AlwaysAvailable: true,
      prerequisiteForS2: "Complete a Detox or Walking session"
    },
    whatYouDo: [
      "4-5 games S1 a settimana (Easy/Medium)",
      "S2 sbloccati con Recovery ≥ 50%",
      "Contenuti opzionali"
    ],
    forWhom: "Chi inizia o ha tempo variabile",
    sessions: [
      {
        id: "fast-focus",
        name: "Fast Focus",
        description: "Attention and reactivity",
        duration: "15-18 min",
        thinkingSystems: ["S1"],
        content: null,
        games: { focus: "S1", intensity: "light" }
      },
      {
        id: "mixed",
        name: "Mixed",
        description: "S1 + light S2",
        duration: "15-18 min",
        thinkingSystems: ["S1", "S2"],
        content: {
          type: "podcast",
          required: false,
          duration: "5-10 min",
          description: "Short podcast or non-technical reading (optional)"
        },
        games: { focus: "S1+S2", intensity: "light" }
      },
      {
        id: "consolidation",
        name: "Consolidation",
        description: "Light consolidation",
        duration: "15-18 min",
        thinkingSystems: ["S2"],
        content: {
          type: "reading",
          required: false,
          duration: "10 min",
          description: "Reflective article"
        },
        games: { focus: "S2", intensity: "light" }
      }
    ]
  },
  expert: {
    id: "expert",
    name: "Expert Training",
    tagline: "Balanced adaptive training",
    description: "Wider effective load window with stable recovery requirements. Supports deeper cognitive adaptation.",
    philosophy: "Balances training intensity with recovery capacity for sustained adaptation.",
    targetAudience: [
      "Consistent availability",
      "Stable recovery baseline",
      "Structured depth preference"
    ],
    sessionsPerWeek: 3,
    sessionDuration: "22-25 min",
    contentPerWeek: 2, // Protocol adherence (count only)
    contentTypes: ["podcast", "reading", "book-extract"],
    intensity: "medium",
    color: "blue",
    icon: "target",
    // v1.5: Reduced target for sustainability (6-7 games/week)
    xpTargetWeek: 140,
    weeklyXPTarget: 140,
    contentXPTarget: 0, // v1.3: Tasks don't give XP
    detox: {
      weeklyMinutes: 840,
      dailyMinimumMinutes: 30,
      minSessionMinutes: 30,
      xpPerMinute: 0.05,
      bonusXP: 8,
      walkingRequired: true,
      walkingMinMinutes: 30,
    },
    // v1.3: Games gating modifiers (default thresholds)
    gamesGating: {
      s2ThresholdModifier: 0, // Standard thresholds
      requireRecForS2: 50,
      insightMaxPerWeek: 3,
      s2MaxPerWeek: 7,
      dailyGamesWithXP: 5, // v1.8: Max 5 games/day award XP
    },
    // v1.5: Clear communication fields
    dailyEstimate: {
      total: "~25-35 min",
      games: "1-2 games/day (~20-25 min)",
      recovery: "~30 min (Detox/Walking)",
      tasks: "10-15 min (2/week)"
    },
    periodType: "rolling-7-days",
    gatingExplainer: {
      s2Requirement: "Recovery ≥ 50%",
      s1AlwaysAvailable: true,
      prerequisiteForS2: "Maintain consistent Detox/Walking habit"
    },
    whatYouDo: [
      "6-7 games bilanciati S1+S2 a settimana",
      "Difficoltà Medium standard",
      "2 contenuti prescritti a settimana"
    ],
    forWhom: "Chi ha routine stabile e vuole progredire",
    sessions: [
      {
        id: "fast-control",
        name: "Fast Control",
        description: "Intensive System 1",
        duration: "22-25 min",
        thinkingSystems: ["S1"],
        content: null,
        games: { focus: "S1", intensity: "medium" }
      },
      {
        id: "slow-reasoning",
        name: "Slow Reasoning",
        description: "System 2 with priming",
        duration: "22-25 min",
        thinkingSystems: ["S2"],
        content: {
          type: "podcast",
          required: true,
          duration: "10-15 min",
          description: "Dense podcast or structured reading (prescribed)"
        },
        games: { focus: "S2", intensity: "medium" }
      },
      {
        id: "dual-process",
        name: "Dual Process",
        description: "S1 + S2 integrated",
        duration: "22-25 min",
        thinkingSystems: ["S1", "S2"],
        content: {
          type: "book-extract",
          required: true,
          duration: "10-15 min",
          description: "Book excerpt or MIT/HBR article"
        },
        games: { focus: "S1+S2", intensity: "medium" }
      }
    ]
  },
  superhuman: {
    id: "superhuman",
    name: "Superhuman Training",
    tagline: "High-capacity cognitive training",
    description: "High load tolerance with strong recovery dependency. Emphasis on self-regulation and sustained intensity.",
    philosophy: "Maximizes cognitive throughput for users with established recovery discipline.",
    targetAudience: [
      "High load tolerance",
      "Strong recovery baseline",
      "Self-regulation capacity"
    ],
    sessionsPerWeek: 3,
    sessionDuration: "30-35 min",
    contentPerWeek: 3, // Protocol adherence (count only)
    contentTypes: ["podcast", "reading", "book-extract"],
    intensity: "high",
    color: "red",
    icon: "flame",
    // v1.5: Reduced target for sustainability (8-10 games/week)
    xpTargetWeek: 200,
    weeklyXPTarget: 200,
    contentXPTarget: 0, // v1.3: Tasks don't give XP
    detox: {
      weeklyMinutes: 1680,
      dailyMinimumMinutes: 30,
      minSessionMinutes: 30,
      xpPerMinute: 0.05,
      bonusXP: 15,
      walkingRequired: true,
      walkingMinMinutes: 30,
    },
    // v1.3: Games gating modifiers (easier access to S2)
    gamesGating: {
      s2ThresholdModifier: -5, // -5 from S2 thresholds (easier access)
      requireRecForS2: 55, // Higher REC requirement
      insightMaxPerWeek: 4,
      s2MaxPerWeek: 10,
      dailyGamesWithXP: 7, // v1.8: Max 7 games/day award XP
    },
    // v1.5: Clear communication fields
    dailyEstimate: {
      total: "~45-60 min",
      games: "2-3 games/day (~30-35 min)",
      recovery: "~40 min (Detox/Walking)",
      tasks: "15-20 min (3/week mandatory)"
    },
    periodType: "rolling-7-days",
    gatingExplainer: {
      s2Requirement: "Recovery ≥ 55%",
      s1AlwaysAvailable: true,
      prerequisiteForS2: "28h/week Detox + Walking required"
    },
    whatYouDo: [
      "8-10 games intensivi S1+S2 a settimana",
      "Difficoltà Medium/Hard preferita",
      "3 contenuti obbligatori a settimana"
    ],
    forWhom: "Chi punta a massima performance",
    sessions: [
      {
        id: "heavy-slow",
        name: "Heavy Slow Thinking",
        description: "Mandatory priming + intensive S2",
        duration: "30-35 min",
        thinkingSystems: ["S2"],
        content: {
          type: "podcast",
          required: true,
          duration: "10-15 min",
          description: "Dense podcast or reading (mandatory)"
        },
        games: { focus: "S2", intensity: "heavy" }
      },
      {
        id: "dual-stress",
        name: "Dual-Process Stress",
        description: "Dual-task with interference",
        duration: "30-35 min",
        thinkingSystems: ["S1", "S2"],
        content: {
          type: "reading",
          required: true,
          duration: "10 min",
          description: "Dilemma reading or short essay"
        },
        games: { focus: "S1+S2", intensity: "heavy" }
      },
      {
        id: "reflection",
        name: "Consolidation & Reflection",
        description: "Book + mandatory reflection",
        duration: "30-35 min",
        thinkingSystems: ["S2"],
        content: {
          type: "book-extract",
          required: true,
          duration: "15-20 min",
          description: "Book excerpt + mandatory reflection prompt"
        },
        games: { focus: "S2", intensity: "medium" }
      }
    ]
  }
};

export function getTrainingPlan(id: TrainingPlanId): TrainingPlan {
  return TRAINING_PLANS[id];
}

export function getPlanColor(id: TrainingPlanId): string {
  const colors: Record<TrainingPlanId, string> = {
    light: "emerald",
    expert: "blue",
    superhuman: "red"
  };
  return colors[id];
}

export function getPlanIntensityLabel(intensity: "low" | "medium" | "high"): string {
  const labels: Record<string, string> = {
    low: "Low",
    medium: "Medium",
    high: "High"
  };
  return labels[intensity];
}

/**
 * Get games gating modifiers for a training plan
 */
export function getPlanGamesGatingModifiers(planId: TrainingPlanId): TrainingPlan["gamesGating"] {
  return TRAINING_PLANS[planId].gamesGating;
}
