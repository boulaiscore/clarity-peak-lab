// Neuro Gym Types and Configuration

import { CognitiveExercise } from "./exercises";

export type NeuroGymArea = "focus" | "memory" | "control" | "reasoning" | "creativity" | "visual" | "fast-thinking" | "slow-thinking" | "neuro-activation";
export type NeuroGymDuration = "30s" | "2min" | "5min" | "7min";

export interface NeuroGymAreaConfig {
  id: NeuroGymArea;
  title: string;
  subtitle: string;
  description: string;
  categories: string[];
  icon: string;
}

export const NEURO_GYM_AREAS: NeuroGymAreaConfig[] = [
  {
    id: "fast-thinking",
    title: "Fast Thinking",
    subtitle: "Quick Intuition & Rapid Decisions",
    description: "Train System 1 thinking: rapid pattern recognition, intuition, and fast responses.",
    categories: ["fast", "attention", "cognitive_control"],
    icon: "Zap",
  },
  {
    id: "slow-thinking",
    title: "Slow Thinking",
    subtitle: "Deep Analysis & Structured Reasoning",
    description: "Train System 2 thinking: careful analysis, structured reasoning, and deliberate decision-making.",
    categories: ["slow", "reasoning", "bias", "philosophical", "decision"],
    icon: "Clock",
  },
  {
    id: "focus",
    title: "Focus Arena",
    subtitle: "Selective Attention & Sustained Focus",
    description: "Train selective attention, visual search, and sustained focus.",
    categories: ["attention", "inhibition", "cognitive_control", "fast"],
    icon: "Target",
  },
  {
    id: "memory",
    title: "Memory Core",
    subtitle: "Working Memory Capacity",
    description: "Strengthen working memory capacity and mental updating.",
    categories: ["working_memory"],
    icon: "Brain",
  },
  {
    id: "control",
    title: "Control Lab",
    subtitle: "Inhibition & Cognitive Flexibility",
    description: "Improve inhibition and cognitive flexibility.",
    categories: ["executive_control", "inhibition", "cognitive_control"],
    icon: "Sliders",
  },
  {
    id: "reasoning",
    title: "Critical Reasoning Studio",
    subtitle: "Logic & Structured Analysis",
    description: "Sharpen logical thinking, bias detection, and structured analysis.",
    categories: ["reasoning", "bias", "logic_puzzle", "philosophical", "slow"],
    icon: "Lightbulb",
  },
  {
    id: "creativity",
    title: "Creativity Hub",
    subtitle: "Divergent Thinking & Reframing",
    description: "Boost divergent thinking, analogies, and high-level reframing.",
    categories: ["creative", "insight", "clarity"],
    icon: "Sparkles",
  },
  {
    id: "visual",
    title: "Visual & Game Drills",
    subtitle: "Interactive Cognitive Games",
    description: "Train visual processing, spatial reasoning, and reaction speed with interactive drills.",
    categories: ["visual", "spatial", "game", "visual_memory"],
    icon: "Gamepad2",
  },
];

// Neuro Activation Session - Fixed sequence of exercise IDs
export const NEURO_ACTIVATION_SEQUENCE = [
  "N001", // Neural Warm-Up (Focus) - Focused Dot Drill
  "N015", // Executive Control Switch - Task Switching
  "N002", // Working Memory Prime - 1-back
  "N009", // Insight Incubation
  "N007", // Creative Divergence Burst - Alternative Uses
  "N010", // Slow Thinking Recenter - Evidence Counterbalance
  "N011", // Value Alignment Reflection
];

// Exercise count configuration for Neuro Gym sessions based on user preference
export function getNeuroGymExerciseCount(duration: NeuroGymDuration): { min: number; max: number } {
  switch (duration) {
    case "30s":
      return { min: 1, max: 1 };
    case "2min":
      return { min: 2, max: 3 };
    case "5min":
      return { min: 3, max: 4 };
    case "7min":
      return { min: 4, max: 5 };
    default:
      return { min: 2, max: 3 };
  }
}

// Generate exercises for a Neuro Gym session
export function generateNeuroGymSession(
  area: NeuroGymArea,
  duration: NeuroGymDuration,
  allExercises: CognitiveExercise[]
): CognitiveExercise[] {
  if (area === "neuro-activation") {
    // Return fixed sequence for Neuro Activation
    return NEURO_ACTIVATION_SEQUENCE
      .map(id => allExercises.find(e => e.id === id))
      .filter((e): e is CognitiveExercise => e !== undefined);
  }

  const areaConfig = NEURO_GYM_AREAS.find(a => a.id === area);
  if (!areaConfig) return [];

  // Filter exercises by area categories
  let areaExercises = allExercises.filter(e => 
    areaConfig.categories.includes(e.category)
  );

  // Filter by duration - prefer exercises matching user's duration preference
  const durationMatched = areaExercises.filter(e => e.duration === duration);
  
  // If we have enough exercises matching the duration, use them
  // Otherwise, fall back to any exercises in the area
  if (durationMatched.length >= 2) {
    areaExercises = durationMatched;
  }

  if (areaExercises.length === 0) {
    // Fallback: use any available exercises
    return shuffleAndSelect(allExercises, duration);
  }

  return shuffleAndSelect(areaExercises, duration);
}

function shuffleAndSelect(exercises: CognitiveExercise[], duration: NeuroGymDuration): CognitiveExercise[] {
  const { min, max } = getNeuroGymExerciseCount(duration);
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  
  // Shuffle
  const shuffled = [...exercises].sort(() => Math.random() - 0.5);
  
  // Try to balance difficulty
  const easy = shuffled.filter(e => e.difficulty === "easy");
  const medium = shuffled.filter(e => e.difficulty === "medium");
  const hard = shuffled.filter(e => e.difficulty === "hard");
  
  const selected: CognitiveExercise[] = [];
  
  // Add at least one easy exercise at the start
  if (easy.length > 0) {
    selected.push(easy[0]);
  }
  
  // Fill with medium exercises
  const remainingCount = count - selected.length;
  const mediumToAdd = medium.filter(e => !selected.includes(e)).slice(0, remainingCount);
  selected.push(...mediumToAdd);
  
  // If still need more, add from any category
  if (selected.length < count) {
    const remaining = shuffled.filter(e => !selected.includes(e));
    selected.push(...remaining.slice(0, count - selected.length));
  }
  
  return selected.slice(0, count);
}

export interface NeuroGymSession {
  id: string;
  user_id: string;
  area: NeuroGymArea;
  duration_option: NeuroGymDuration;
  exercises_used: string[];
  score: number;
  correct_answers: number;
  total_questions: number;
  completed_at: string;
  created_at: string;
}
