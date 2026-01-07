/**
 * Cognitive Feedback Library
 * 
 * Provides semantic messaging for cognitive activities.
 * Focus: costs avoided, capacity recovered, mental clarity.
 * Tone: sobrio, adulto, orientato alla consapevolezza.
 */

// Game cognitive benefits - what each training type trains and protects against
export const GAME_COGNITIVE_BENEFITS = {
  "focus-fast": {
    trains: "Reaction clarity under visual load",
    protects: "Hesitation in high-pressure decisions",
    continues: "Faster pattern recognition",
    shortBenefit: "Reduces attention interference",
  },
  "focus-slow": {
    trains: "Sustained attention and pattern extraction",
    protects: "Blind spots in complex analysis",
    continues: "Deeper focus capacity",
    shortBenefit: "Builds sustained attention",
  },
  "reasoning-fast": {
    trains: "Rapid pattern discrimination",
    protects: "Impulsive logical errors",
    continues: "Faster reasoning under load",
    shortBenefit: "Sharpens quick logic",
  },
  "reasoning-slow": {
    trains: "Deep reasoning and bias detection",
    protects: "Cognitive blind spots in analysis",
    continues: "Stronger critical thinking",
    shortBenefit: "Reduces reasoning bias",
  },
  "creativity-fast": {
    trains: "Rapid divergent thinking",
    protects: "Mental rigidity under pressure",
    continues: "Faster creative connections",
    shortBenefit: "Expands associative thinking",
  },
  "creativity-slow": {
    trains: "Novel concept generation",
    protects: "Shallow thinking patterns",
    continues: "Deeper creative capacity",
    shortBenefit: "Builds conceptual depth",
  },
} as const;

// Area-level cognitive descriptions
export const AREA_COGNITIVE_DESCRIPTIONS = {
  focus: {
    system1: "Quick visual processing, attention allocation",
    system2: "Sustained concentration, distraction resistance",
    realWorld: "Affects: multitasking efficiency, detail catching, reading comprehension",
  },
  reasoning: {
    system1: "Intuitive pattern matching, heuristic decisions",
    system2: "Logical analysis, bias detection, structured thinking",
    realWorld: "Affects: complex decisions, argument evaluation, strategic planning",
  },
  creativity: {
    system1: "Spontaneous associations, intuitive leaps",
    system2: "Novel concept synthesis, deep exploration",
    realWorld: "Affects: problem solving, innovation, connecting disparate ideas",
  },
} as const;

// Detox cognitive messaging
export const DETOX_COGNITIVE_MESSAGES = {
  // Pre-session messaging
  preSession: {
    headline: "Recover Mental Clarity",
    subtitle: "Every 30 min reduces tomorrow's cognitive load",
    benefit: "Restores decision-making capacity",
  },
  // During session
  activeSession: {
    status: "Clarity recovering...",
    metric: "mental bandwidth restored",
  },
  // Post-session
  completion: {
    headline: "Mental Recovery Complete",
    getDescription: (minutes: number) => 
      `${minutes} minutes of restored cognitive capacity`,
    getBenefit: (minutes: number) => {
      if (minutes >= 120) return "Significant reduction in decision fatigue";
      if (minutes >= 60) return "Measurable reduction in mental overhead";
      return "Foundation for sustained clarity";
    },
  },
  // Weekly context
  weekly: {
    goalLabel: "Weekly Mental Recovery",
    recommendation: "7h weekly recommended for sustained clarity",
    getProgress: (minutes: number, target: number) => {
      const percentage = Math.round((minutes / target) * 100);
      if (percentage >= 100) return "Recovery target reached";
      if (percentage >= 70) return "Strong recovery momentum";
      if (percentage >= 40) return "Building recovery habit";
      return "Starting recovery routine";
    },
  },
} as const;

// Tasks cognitive purposes (expanded)
export const TASK_COGNITIVE_PURPOSES = {
  podcast: {
    trains: "Argument tracking and listening comprehension",
    protects: "Shallow information processing",
    shortPurpose: "Trains attention discipline",
  },
  book: {
    trains: "Deep reading and conceptual integration",
    protects: "Fragmented thinking patterns",
    shortPurpose: "Builds reasoning depth",
  },
  article: {
    trains: "Critical analysis and information filtering",
    protects: "Passive content consumption",
    shortPurpose: "Sharpens analytical focus",
  },
} as const;

// Weekly goal cognitive framing
export const WEEKLY_GOAL_MESSAGES = {
  headline: "Weekly Cognitive Load",
  subtitle: "Compounding cognitive resilience",
  categories: {
    games: {
      label: "Games",
      benefit: "Sharpens execution under pressure",
    },
    tasks: {
      label: "Tasks",
      benefit: "Builds reasoning depth",
    },
    detox: {
      label: "Detox",
      benefit: "Recovers decision capacity",
    },
  },
  getProgressMessage: (remaining: number, total: number) => {
    const percentage = ((total - remaining) / total) * 100;
    if (percentage >= 100) return "Weekly target secured. Cognitive capacity sustained.";
    if (percentage >= 70) return `${remaining} more to lock in this week's gains`;
    if (percentage >= 40) return `${remaining} more to maintain momentum`;
    return `${remaining} more to establish this week's baseline`;
  },
  // Messages for target exceeded warning
  targetExceededWarning: {
    title: "Target Reached",
    description: "You've already reached this week's target for this category. Additional activity won't contribute to your Weekly Cognitive Load.",
    confirmLabel: "Continue anyway",
    cancelLabel: "Go back",
  },
} as const;

// SCI/Dashboard interpretations
export const SCI_INTERPRETATIONS = {
  performance: {
    label: "Performance",
    description: "How sharp your thinking is today",
    weight: "50%",
  },
  engagement: {
    label: "Engagement",
    description: "How consistently you're building capacity",
    weight: "30%",
  },
  recovery: {
    label: "Recovery",
    description: "How well you're protecting your resources",
    weight: "20%",
  },
} as const;

// FastSlowBrainMap real-world implications
export const BRAIN_SYSTEM_IMPLICATIONS = {
  fast: {
    label: "System 1",
    affects: "First impressions, quick decisions, pattern recognition",
    description: "Intuitive, automatic responses",
  },
  slow: {
    label: "System 2",
    affects: "Complex planning, bias detection, strategic thinking",
    description: "Deliberate, analytical processing",
  },
} as const;

// Cognitive readiness interpretations
export const READINESS_INTERPRETATIONS = {
  high: {
    threshold: 75,
    status: "Peak mental clarity",
    implication: "Optimal window for complex decisions",
    recommendation: "Push cognitive limits today",
  },
  moderate: {
    threshold: 55,
    status: "Solid cognitive foundation",
    implication: "Good capacity for focused work",
    recommendation: "Maintain steady effort",
  },
  low: {
    threshold: 0,
    status: "Recovery phase",
    implication: "Higher decision fatigue today",
    recommendation: "Lighter load recommended",
  },
} as const;

// Home ring semantic labels
export const HOME_RING_LABELS = {
  readiness: {
    label: "Readiness",
    subtitle: "Mental clarity",
  },
  performance: {
    label: "Performance",
    subtitle: "Cognitive sharpness",
  },
  weekly: {
    label: "Weekly Load",
    subtitle: "Training volume",
  },
} as const;

// Post-action micro-feedback templates
export const POST_ACTION_FEEDBACK = {
  game: {
    getTemplate: (areaId: string, mode: "fast" | "slow") => {
      const key = `${areaId}-${mode}` as keyof typeof GAME_COGNITIVE_BENEFITS;
      const benefit = GAME_COGNITIVE_BENEFITS[key];
      if (!benefit) return null;
      return {
        trained: benefit.trains,
        protects: `What this protects against: ${benefit.protects}`,
        continues: `Continue for: ${benefit.continues}`,
      };
    },
  },
  detox: {
    getTemplate: (minutes: number) => ({
      recovered: `${minutes} minutes of mental bandwidth restored`,
      reduces: "This reduces: tomorrow's cognitive fatigue",
      continues: "Continue for: sustained clarity across the week",
    }),
  },
  task: {
    getTemplate: (type: keyof typeof TASK_COGNITIVE_PURPOSES) => {
      const purpose = TASK_COGNITIVE_PURPOSES[type];
      if (!purpose) return null;
      return {
        trained: purpose.trains,
        reduces: `This reduces: ${purpose.protects}`,
        continues: `Continue for: stronger ${purpose.shortPurpose.toLowerCase()}`,
      };
    },
  },
} as const;

// Helper function to get cognitive age interpretation
export function getCognitiveAgeInterpretation(delta: number, chronologicalAge?: number) {
  if (delta < -5) {
    return {
      status: "Significantly younger cognitive profile",
      implication: chronologicalAge 
        ? `Your decision speed matches someone ${Math.abs(delta)} years younger`
        : "Superior processing efficiency",
    };
  }
  if (delta < 0) {
    return {
      status: "Younger cognitive profile",
      implication: "Above-average processing speed",
    };
  }
  if (delta === 0) {
    return {
      status: "Age-appropriate cognitive profile",
      implication: "Standard processing efficiency",
    };
  }
  return {
    status: "Room for cognitive optimization",
    implication: "Training can improve processing efficiency",
  };
}

// Helper to get mental state summary
export function getMentalStateSummary(
  readiness: number,
  sessionsThisWeek: number,
  detoxMinutesThisWeek: number
): { status: string; level: "high" | "moderate" | "low"; recommendation: string } {
  const hasTraining = sessionsThisWeek > 0;
  const hasRecovery = detoxMinutesThisWeek >= 60;
  
  if (readiness >= 75 && hasTraining && hasRecovery) {
    return {
      status: "High clarity",
      level: "high",
      recommendation: "Optimal for demanding cognitive work",
    };
  }
  if (readiness >= 55 || (hasTraining && hasRecovery)) {
    return {
      status: "Moderate load",
      level: "moderate",
      recommendation: "Good for steady, focused work",
    };
  }
  return {
    status: "Recovery needed",
    level: "low",
    recommendation: "Lighter cognitive load recommended",
  };
}
