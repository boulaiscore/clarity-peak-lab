// Types for cognitive exercises from the database

export type ExerciseCategory = 
  | "reasoning"
  | "clarity"
  | "decision"
  | "fast"
  | "slow"
  | "bias"
  | "logic_puzzle"
  | "creative"
  | "attention"
  | "working_memory"
  | "inhibition"
  | "cognitive_control"
  | "executive_control"
  | "insight"
  | "reflection"
  | "philosophical";

export type ExerciseType = 
  | "multiple_choice"
  | "detect_fallacy"
  | "open_reflection"
  | "logic_puzzle"
  | "scenario_choice"
  | "probability_estimation";

export type ExerciseDifficulty = "easy" | "medium" | "hard";
export type ExerciseDuration = "30s" | "2min" | "5min" | "3min" | "7min";

export interface CognitiveExercise {
  id: string;
  category: ExerciseCategory;
  type: ExerciseType;
  difficulty: ExerciseDifficulty;
  duration: ExerciseDuration;
  title: string;
  prompt: string;
  options?: string[];
  correct_option_index?: number;
  explanation?: string;
  metrics_affected: string[];
  weight: number;
  created_at?: string;
  updated_at?: string;
}

export interface TrainingSession {
  id: string;
  user_id: string;
  training_mode: ExerciseCategory;
  duration_option: ExerciseDuration;
  exercises_used: string[];
  score: number;
  correct_answers: number;
  total_questions: number;
  completed_at: string;
  created_at: string;
}

export interface UserCognitiveMetrics {
  id: string;
  user_id: string;
  reasoning_accuracy: number;
  clarity_score: number;
  decision_quality: number;
  fast_thinking: number;
  slow_thinking: number;
  bias_resistance: number;
  critical_thinking_score: number;
  creativity: number;
  philosophical_reasoning: number;
  total_sessions: number;
  updated_at: string;
  created_at: string;
}

// Category display names and descriptions
export const CATEGORY_INFO: Record<ExerciseCategory, { title: string; subtitle: string; description: string }> = {
  reasoning: {
    title: "Reasoning Workout",
    subtitle: "Analytical & Critical Thinking",
    description: "Train your ability to identify assumptions, evaluate evidence, and construct valid arguments.",
  },
  clarity: {
    title: "Clarity Lab",
    subtitle: "Mental Sharpness & Problem Decomposition",
    description: "Develop precision in defining problems, separating facts from assumptions, and structuring thoughts.",
  },
  decision: {
    title: "Decision Studio",
    subtitle: "Strategic Decision-Making",
    description: "Improve judgment under uncertainty, evaluate trade-offs, and make higher-quality decisions.",
  },
  fast: {
    title: "Fast Thinking",
    subtitle: "System 1 – Intuition",
    description: "Train rapid pattern recognition and intuitive judgment under time pressure.",
  },
  slow: {
    title: "Slow Thinking",
    subtitle: "System 2 – Structured Reasoning",
    description: "Practice deliberate, effortful reasoning by taking problems step by step.",
  },
  bias: {
    title: "Bias Lab",
    subtitle: "Cognitive Bias Resistance",
    description: "Build awareness of common cognitive biases and learn to counter them.",
  },
  logic_puzzle: {
    title: "Logic Puzzles",
    subtitle: "Formal Reasoning",
    description: "Sharpen deductive and formal reasoning through classic logic challenges.",
  },
  creative: {
    title: "Creative Thinking",
    subtitle: "Divergent & Lateral Thinking",
    description: "Expand your thinking patterns with creativity and lateral problem-solving exercises.",
  },
  attention: {
    title: "Focus Arena",
    subtitle: "Selective Attention",
    description: "Train selective attention, visual search, and sustained focus.",
  },
  working_memory: {
    title: "Memory Core",
    subtitle: "Working Memory Capacity",
    description: "Strengthen working memory capacity and mental updating.",
  },
  inhibition: {
    title: "Inhibition Training",
    subtitle: "Motor & Cognitive Inhibition",
    description: "Improve ability to suppress automatic responses and control impulses.",
  },
  cognitive_control: {
    title: "Cognitive Control",
    subtitle: "Interference Control",
    description: "Enhance ability to manage conflicting information and maintain task focus.",
  },
  executive_control: {
    title: "Executive Control",
    subtitle: "Task Switching & Flexibility",
    description: "Improve cognitive flexibility and ability to switch between tasks efficiently.",
  },
  insight: {
    title: "Insight Lab",
    subtitle: "Aha Moments & Incubation",
    description: "Foster creative insight through incubation and mind-wandering techniques.",
  },
  reflection: {
    title: "Deep Reflection",
    subtitle: "Evidence-Based Thinking",
    description: "Develop skills for counterbalancing beliefs and reducing confirmation bias.",
  },
  philosophical: {
    title: "Philosophical Reasoning",
    subtitle: "Value Alignment & Abstract Thought",
    description: "Engage with high-level abstract reasoning and value-based decision making.",
  },
};

// Get number of exercises for a duration
export function getExerciseCountForDuration(duration: ExerciseDuration): number {
  switch (duration) {
    case "30s":
      return 1;
    case "2min":
      return 3;
    case "5min":
      return 5;
    default:
      return 3;
  }
}

// Shuffle array helper
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Check if exercise type has a correct answer
export function hasCorrectAnswer(type: ExerciseType): boolean {
  return ["multiple_choice", "detect_fallacy", "logic_puzzle", "scenario_choice"].includes(type);
}

// Calculate score for a session
export function calculateSessionScore(
  exercises: CognitiveExercise[],
  responses: Map<string, { selectedIndex?: number; text?: string }>
): { score: number; correctAnswers: number; totalQuestions: number } {
  let correctAnswers = 0;
  let totalQuestions = 0;

  exercises.forEach((exercise) => {
    if (hasCorrectAnswer(exercise.type) && exercise.correct_option_index !== undefined) {
      totalQuestions++;
      const response = responses.get(exercise.id);
      if (response?.selectedIndex === exercise.correct_option_index) {
        correctAnswers++;
      }
    }
  });

  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  
  // Bonus for completing reflections
  exercises.forEach((exercise) => {
    if (exercise.type === "open_reflection") {
      const response = responses.get(exercise.id);
      if (response?.text && response.text.trim().length > 10) {
        // Add small bonus for completing reflections
      }
    }
  });

  return { score, correctAnswers, totalQuestions };
}

// Get metric updates based on exercise performance
export function getMetricUpdates(
  exercises: CognitiveExercise[],
  responses: Map<string, { selectedIndex?: number; text?: string }>
): Record<string, number> {
  const updates: Record<string, number> = {};
  
  exercises.forEach((exercise) => {
    const response = responses.get(exercise.id);
    const weight = exercise.weight || 1;
    
    let earnedPoints = 0;
    
    if (hasCorrectAnswer(exercise.type) && exercise.correct_option_index !== undefined) {
      if (response?.selectedIndex === exercise.correct_option_index) {
        earnedPoints = 2 * weight; // Correct answer
      } else {
        earnedPoints = 0.5 * weight; // Attempted but wrong
      }
    } else if (exercise.type === "open_reflection") {
      if (response?.text && response.text.trim().length > 20) {
        earnedPoints = 2 * weight; // Meaningful reflection
      } else if (response?.text && response.text.trim().length > 5) {
        earnedPoints = 1 * weight; // Brief reflection
      }
    }
    
    exercise.metrics_affected.forEach((metric) => {
      updates[metric] = (updates[metric] || 0) + earnedPoints;
    });
  });
  
  return updates;
}
