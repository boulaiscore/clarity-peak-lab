// Neuro Lab Types and Configuration

import { CognitiveExercise, GymArea, ThinkingMode } from "./exercises";
import { TrainingGoal } from "@/contexts/AuthContext";

export type NeuroLabArea = GymArea | "neuro-activation";
export type NeuroLabDuration = "30s" | "1min" | "2min" | "3min" | "5min" | "7min";

export interface NeuroLabAreaConfig {
  id: NeuroLabArea;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
}

export const NEURO_LAB_AREAS: NeuroLabAreaConfig[] = [
  {
    id: "focus",
    title: "Focus Arena",
    subtitle: "Selective Attention & Sustained Focus",
    description: "Train selective attention, visual search, and sustained focus.",
    icon: "Target",
  },
  {
    id: "reasoning",
    title: "Critical Reasoning Studio",
    subtitle: "Logic & Structured Analysis",
    description: "Sharpen logical thinking, bias detection, and structured analysis.",
    icon: "Lightbulb",
  },
  {
    id: "creativity",
    title: "Creativity Hub",
    subtitle: "Divergent Thinking & Reframing",
    description: "Boost divergent thinking, analogies, and high-level reframing.",
    icon: "Sparkles",
  },
];

// Neuro Activation Session - Fixed sequence of exercise IDs
export const NEURO_ACTIVATION_SEQUENCE = [
  "FOCUS_DOT_001",    // Focus - Green Dot Reaction
  "CONTROL_GONO_001", // Control - Go / No-Go Flash
  "MEMORY_DIGIT_001", // Memory - Quick Digit Span
  "REASON_SEQ_001",   // Reasoning - Sequence Logic
  "CREATE_ODD_001",   // Creativity - Odd One Out
  "FOCUS_SEARCH_001", // Focus - Visual Search
  "REASON_ANALOG_001",// Reasoning - Analogy
];

// Exercise count configuration for Neuro Lab sessions
// All exercises are 30s, so count = total session time / 30s
export function getNeuroLabExerciseCount(duration: NeuroLabDuration): { min: number; max: number } {
  switch (duration) {
    case "30s":
      return { min: 1, max: 1 };     // 1 × 30s = 30s
    case "1min":
      return { min: 2, max: 2 };     // 2 × 30s = 1min
    case "2min":
      return { min: 4, max: 4 };     // 4 × 30s = 2min
    case "3min":
      return { min: 6, max: 6 };     // 6 × 30s = 3min
    case "5min":
      return { min: 10, max: 10 };   // 10 × 30s = 5min
    case "7min":
      return { min: 14, max: 14 };   // 14 × 30s = 7min
    default:
      return { min: 4, max: 4 };
  }
}

// Weighted random selection using exercise weight
function weightedRandomSelect(exercises: CognitiveExercise[], count: number): CognitiveExercise[] {
  const selected: CognitiveExercise[] = [];
  const remaining = [...exercises];
  
  while (selected.length < count && remaining.length > 0) {
    // Calculate total weight
    const totalWeight = remaining.reduce((sum, e) => sum + (e.weight || 1), 0);
    
    // Generate random value
    let random = Math.random() * totalWeight;
    
    // Select based on weight
    for (let i = 0; i < remaining.length; i++) {
      random -= remaining[i].weight || 1;
      if (random <= 0) {
        selected.push(remaining[i]);
        remaining.splice(i, 1);
        break;
      }
    }
  }
  
  return selected;
}

// Generate exercises for a Neuro Lab session
export function generateNeuroLabSession(
  area: NeuroLabArea,
  duration: NeuroLabDuration,
  allExercises: CognitiveExercise[],
  trainingGoals?: TrainingGoal[],
  explicitThinkingMode?: "fast" | "slow"
): CognitiveExercise[] {
  if (area === "neuro-activation") {
    // Return fixed sequence for Neuro Activation
    return NEURO_ACTIVATION_SEQUENCE
      .map(id => allExercises.find(e => e.id === id))
      .filter((e): e is CognitiveExercise => e !== undefined);
  }

  // Filter exercises by gym_area field (database column name unchanged)
  const areaExercises = allExercises.filter(e => e.gym_area === area);
  
  // If no exercises found for this area, return empty array
  if (areaExercises.length === 0) {
    return [];
  }

  // If explicit thinking mode is provided, use it directly
  if (explicitThinkingMode) {
    const filteredExercises = areaExercises.filter(e => e.thinking_mode === explicitThinkingMode);
    
    // Fallback to all area exercises if no matches
    if (filteredExercises.length === 0) {
      const { min, max } = getNeuroLabExerciseCount(duration);
      const count = Math.floor(Math.random() * (max - min + 1)) + min;
      return weightedRandomSelect(areaExercises, count);
    }
    
    const { min, max } = getNeuroLabExerciseCount(duration);
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    return weightedRandomSelect(filteredExercises, count);
  }

  // Legacy: Determine thinking mode filter based on training goals
  const hasFast = trainingGoals?.includes("fast_thinking");
  const hasSlow = trainingGoals?.includes("slow_thinking");
  
  let filteredExercises: CognitiveExercise[];
  
  if (hasFast && hasSlow) {
    // Both selected: create balanced mix (prefer 2 fast + 2 slow)
    const fastExercises = areaExercises.filter(e => e.thinking_mode === "fast");
    const slowExercises = areaExercises.filter(e => e.thinking_mode === "slow");
    
    // FALLBACK: if no exercises have thinking_mode, use all area exercises
    if (fastExercises.length === 0 && slowExercises.length === 0) {
      const { min, max } = getNeuroLabExerciseCount(duration);
      const count = Math.floor(Math.random() * (max - min + 1)) + min;
      return weightedRandomSelect(areaExercises, count);
    }
    
    const { min, max } = getNeuroLabExerciseCount(duration);
    const targetCount = Math.floor(Math.random() * (max - min + 1)) + min;
    const halfCount = Math.ceil(targetCount / 2);
    
    // Select balanced mix
    const selectedFast = weightedRandomSelect(fastExercises, halfCount);
    const selectedSlow = weightedRandomSelect(slowExercises, targetCount - selectedFast.length);
    
    // Return fast exercises first, then slow (for warm-up progression)
    return [...selectedFast, ...selectedSlow];
  } else if (hasFast && !hasSlow) {
    // Only fast thinking
    filteredExercises = areaExercises.filter(e => e.thinking_mode === "fast");
  } else if (hasSlow && !hasFast) {
    // Only slow thinking
    filteredExercises = areaExercises.filter(e => e.thinking_mode === "slow");
  } else {
    // No preference: use all exercises from the area
    filteredExercises = areaExercises;
  }

  // If no exercises match the filter, fall back to all area exercises
  if (filteredExercises.length === 0) {
    filteredExercises = areaExercises;
  }

  // Get exercise count and select using weighted random
  const { min, max } = getNeuroLabExerciseCount(duration);
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  
  const selected = weightedRandomSelect(filteredExercises, count);
  
  // Sort selected: fast exercises first, then slow (for natural progression)
  return selected.sort((a, b) => {
    if (a.thinking_mode === "fast" && b.thinking_mode === "slow") return -1;
    if (a.thinking_mode === "slow" && b.thinking_mode === "fast") return 1;
    return 0;
  });
}

// Helper to check if exercise is a visual/interactive task
export function isVisualTaskExercise(exercise: CognitiveExercise): boolean {
  return exercise.type === "visual_task" || exercise.type === "visual_drill";
}

export interface NeuroLabSession {
  id: string;
  user_id: string;
  area: NeuroLabArea;
  duration_option: NeuroLabDuration;
  exercises_used: string[];
  score: number;
  correct_answers: number;
  total_questions: number;
  completed_at: string;
  created_at: string;
}
