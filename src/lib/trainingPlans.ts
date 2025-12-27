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
  // Content
  podcastComplete: 15,     // Per podcast listened
  readingComplete: 20,     // Per reading completed
  bookChapterComplete: 30, // Per book chapter read
  // Detox
  detoxPerMinute: 1,       // XP per minute of detox
  detoxWeeklyBonus: 50,    // Bonus for hitting weekly target
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
    description: "Allenamento leggero ma intelligente. I contenuti aiutano, non pesano.",
    philosophy: "Per chi vuole restare lucido senza affaticarsi. Entry point ideale.",
    targetAudience: [
      "Professionisti con poco tempo",
      "Chi vuole mantenimento cognitivo",
      "Nuovi utenti"
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
      xpPerMinute: 1,
      bonusXP: 30,
    },
    sessions: [
      {
        id: "fast-focus",
        name: "Fast Focus",
        description: "Attenzione e reattività",
        duration: "15-18 min",
        thinkingSystems: ["S1"],
        content: null,
        games: { focus: "S1", intensity: "light" }
      },
      {
        id: "mixed",
        name: "Mixed",
        description: "S1 + leggero S2",
        duration: "15-18 min",
        thinkingSystems: ["S1", "S2"],
        content: {
          type: "podcast",
          required: false,
          duration: "5-10 min",
          description: "Podcast breve o reading non tecnico (opzionale)"
        },
        games: { focus: "S1+S2", intensity: "light" }
      },
      {
        id: "consolidation",
        name: "Consolidation",
        description: "Consolidamento leggero",
        duration: "15-18 min",
        thinkingSystems: ["S2"],
        content: {
          type: "reading",
          required: false,
          duration: "10 min",
          description: "Articolo riflessivo"
        },
        games: { focus: "S2", intensity: "light" }
      }
    ]
  },
  expert: {
    id: "expert",
    name: "Expert Training",
    tagline: "Build Depth & Control",
    description: "Bilanciare rapidità e profondità. Pensare meglio sotto pressione.",
    philosophy: "Per decision-maker che vogliono controllo, non solo velocità.",
    targetAudience: [
      "Utenti già ingaggiati",
      "Decision-maker",
      "Chi cerca profondità"
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
      xpPerMinute: 1,
      bonusXP: 50,
    },
    sessions: [
      {
        id: "fast-control",
        name: "Fast Control",
        description: "System 1 intensivo",
        duration: "22-25 min",
        thinkingSystems: ["S1"],
        content: null,
        games: { focus: "S1", intensity: "medium" }
      },
      {
        id: "slow-reasoning",
        name: "Slow Reasoning",
        description: "System 2 con priming",
        duration: "22-25 min",
        thinkingSystems: ["S2"],
        content: {
          type: "podcast",
          required: true,
          duration: "10-15 min",
          description: "Podcast denso o reading strutturato (prescritto)"
        },
        games: { focus: "S2", intensity: "medium" }
      },
      {
        id: "dual-process",
        name: "Dual Process",
        description: "S1 + S2 integrati",
        duration: "22-25 min",
        thinkingSystems: ["S1", "S2"],
        content: {
          type: "book-extract",
          required: true,
          duration: "10-15 min",
          description: "Estratto libro o articolo MIT/HBR"
        },
        games: { focus: "S1+S2", intensity: "medium" }
      }
    ]
  },
  superhuman: {
    id: "superhuman",
    name: "Superhuman Training",
    tagline: "Elite Cognitive Conditioning",
    description: "Il contenuto non accompagna il training. È parte del carico.",
    philosophy: "Per high performers con tolleranza allo sforzo cognitivo.",
    targetAudience: [
      "Utenti avanzati",
      "High performers",
      "Chi cerca l'elite"
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
      xpPerMinute: 1,
      bonusXP: 100,
    },
    sessions: [
      {
        id: "heavy-slow",
        name: "Heavy Slow Thinking",
        description: "Priming obbligatorio + S2 intensivo",
        duration: "30-35 min",
        thinkingSystems: ["S2"],
        content: {
          type: "podcast",
          required: true,
          duration: "10-15 min",
          description: "Podcast o reading denso (obbligatorio)"
        },
        games: { focus: "S2", intensity: "heavy" }
      },
      {
        id: "dual-stress",
        name: "Dual-Process Stress",
        description: "Dual-task con interferenza",
        duration: "30-35 min",
        thinkingSystems: ["S1", "S2"],
        content: {
          type: "reading",
          required: true,
          duration: "10 min",
          description: "Reading dilemma o saggio breve"
        },
        games: { focus: "S1+S2", intensity: "heavy" }
      },
      {
        id: "reflection",
        name: "Consolidation & Reflection",
        description: "Libro + riflessione obbligatoria",
        duration: "30-35 min",
        thinkingSystems: ["S2"],
        content: {
          type: "book-extract",
          required: true,
          duration: "15-20 min",
          description: "Estratto libro + prompt riflessivo obbligatorio"
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
    low: "Basso",
    medium: "Medio",
    high: "Alto"
  };
  return labels[intensity];
}
