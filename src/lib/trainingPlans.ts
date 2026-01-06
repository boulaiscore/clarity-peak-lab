// NeuroLoop Official Training Plans

export type TrainingPlanId = "light" | "expert" | "superhuman";

export type SessionType = "fast-focus" | "mixed" | "consolidation" | "fast-control" | "slow-reasoning" | "dual-process" | "heavy-slow" | "dual-stress" | "reflection";

export type ContentType = "podcast" | "reading" | "book-extract" | "none";

export interface SessionConfig {
  id: SessionType;
  name: string;
  description: string;
  duration: string; // e.g. "15-18 min"
  thinkingSystems: ("S1" | "S2")[];
  content: {
    type: ContentType;
    required: boolean;
    duration?: string; // e.g. "5-10 min"
    description: string;
  } | null;
  games: {
    focus: "S1" | "S2" | "S1+S2";
    intensity: "light" | "medium" | "heavy";
  };
}

export interface DetoxRequirement {
  weeklyMinutes: number;      // Target minutes per week
  minSessionMinutes: number;  // Minimum session length to count
  xpPerMinute: number;        // XP earned per minute
  bonusXP: number;            // Bonus for hitting weekly target
}

export interface TrainingPlan {
  id: TrainingPlanId;
  name: string;
  tagline: string;
  description: string;
  philosophy: string;
  targetAudience: string[];
  sessionsPerWeek: number;
  sessionDuration: string; // e.g. "15-18 min"
  contentPerWeek: number;
  contentTypes: ContentType[];
  intensity: "low" | "medium" | "high";
  color: string;
  icon: "leaf" | "target" | "flame";
  weeklyXPTarget: number; // Target XP to earn per week
  detox: DetoxRequirement; // Required detox configuration
  sessions: SessionConfig[];
}

// XP Points configuration
export const XP_VALUES = {
  // Games (full session of ~5 exercises)
  gameComplete: 25,        // Per game session completed
  gamePerfect: 10,         // Bonus for 90%+ score
  // Individual exercise XP by difficulty
  exerciseEasy: 3,
  exerciseMedium: 5,
  exerciseHard: 8,
  // Content - reduced values to require multiple pieces
  podcastComplete: 8,        // Per podcast listened
  readingComplete: 10,       // Per reading/article completed
  bookChapterComplete: 12,   // Per book chapter read
  // Detox - uniform rate across all plans
  detoxPerMinute: 0.05,      // XP per minute of detox (same for all plans)
  detoxWeeklyBonus: 5,       // Average bonus for hitting weekly target
} as const;

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
    tagline: "Maintain & Sharpen",
    description: "Smart and light training. Content helps, not burdens.",
    philosophy: "For those who want to stay sharp without overexerting. Ideal entry point.",
    targetAudience: [
      "Busy professionals",
      "Cognitive maintenance seekers",
      "New users"
    ],
    sessionsPerWeek: 3,
    sessionDuration: "15-18 min",
    contentPerWeek: 1,
    contentTypes: ["podcast", "reading"],
    intensity: "low",
    color: "emerald",
    icon: "leaf",
    // 3 sessions × ~5 exercises × 5 avg XP = 75 + 1 content (15-20) + detox = ~90-95
    weeklyXPTarget: 100,
    detox: {
      weeklyMinutes: 60,       // 1 hour per week
      minSessionMinutes: 10,   // Min 10 min to count
      xpPerMinute: 0.05,       // 60 min × 0.05 = 3 XP base
      bonusXP: 2,              // Total ~5 XP from detox
    },
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
    tagline: "Build Depth & Control",
    description: "Balance speed and depth. Think better under pressure.",
    philosophy: "For decision-makers who want control, not just speed.",
    targetAudience: [
      "Engaged users",
      "Decision-makers",
      "Depth seekers"
    ],
    sessionsPerWeek: 3,
    sessionDuration: "22-25 min",
    contentPerWeek: 2,
    contentTypes: ["podcast", "reading", "book-extract"],
    intensity: "medium",
    color: "blue",
    icon: "target",
    // 3 sessions × ~6 exercises × 5 avg XP = 90 + 2 content (35) + detox = ~125
    weeklyXPTarget: 150,
    detox: {
      weeklyMinutes: 90,       // 1.5 hours per week
      minSessionMinutes: 15,   // Min 15 min to count
      xpPerMinute: 0.05,       // 90 min × 0.05 = 4.5 XP base
      bonusXP: 3,              // Total ~7.5 XP from detox
    },
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
    tagline: "Elite Cognitive Conditioning",
    description: "Content doesn't accompany training. It's part of the load.",
    philosophy: "For high performers with tolerance for cognitive effort.",
    targetAudience: [
      "Advanced users",
      "High performers",
      "Elite seekers"
    ],
    sessionsPerWeek: 3,
    sessionDuration: "30-35 min",
    contentPerWeek: 3,
    contentTypes: ["podcast", "reading", "book-extract"],
    intensity: "high",
    color: "red",
    icon: "flame",
    // 3 sessions × ~8 exercises × 6 avg XP = 144 + 3 content (65) + detox = ~210
    weeklyXPTarget: 250,
    detox: {
      weeklyMinutes: 180,      // 3 hours per week
      minSessionMinutes: 20,   // Min 20 min to count
      xpPerMinute: 0.05,       // 180 min × 0.05 = 9 XP base
      bonusXP: 5,              // Total ~14 XP from detox
    },
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
