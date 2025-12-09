// Neuro Gym Types and Configuration

import { CognitiveExercise, GymArea, ThinkingMode } from "./exercises";
import { TrainingGoal } from "@/contexts/AuthContext";

export type NeuroGymArea = GymArea | "neuro-activation";
export type NeuroGymDuration = "30s" | "1min" | "2min" | "3min" | "5min" | "7min";

export interface NeuroGymAreaConfig {
  id: NeuroGymArea;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
}

export const NEURO_GYM_AREAS: NeuroGymAreaConfig[] = [
  {
    id: "focus",
    title: "Focus Arena",
    subtitle: "Selective Attention & Sustained Focus",
    description: "Train selective attention, visual search, and sustained focus.",
    icon: "Target",
  },
  {
    id: "memory",
    title: "Memory Core",
    subtitle: "Working Memory Capacity",
    description: "Strengthen working memory capacity and mental updating.",
    icon: "Brain",
  },
  {
    id: "control",
    title: "Control Lab",
    subtitle: "Inhibition & Cognitive Flexibility",
    description: "Improve inhibition and cognitive flexibility.",
    icon: "Sliders",
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
  {
    id: "visual_game",
    title: "Visual & Game Drills",
    subtitle: "Interactive Cognitive Games",
    description: "Train visual processing, spatial reasoning, and reaction speed with interactive drills.",
    icon: "Gamepad2",
  },
];

// Neuro Activation Session - Fixed sequence of exercise IDs
export const NEURO_ACTIVATION_SEQUENCE = [
  "FA_FAST_001", // Focus - Green Dot Reaction
  "CL_FAST_001", // Control - Go / No-Go Flash
  "MC_FAST_001", // Memory - Quick Digit Span
  "RS_FAST_001", // Reasoning - Fallacy Snap
  "CH_FAST_001", // Creativity - Alternative Uses Burst
  "FA_SLOW_001", // Focus - Distraction Mapping
  "RS_SLOW_001", // Reasoning - Argument Breakdown
];

// Exercise count configuration for Neuro Gym sessions based on user preference
export function getNeuroGymExerciseCount(duration: NeuroGymDuration): { min: number; max: number } {
  switch (duration) {
    case "30s":
      return { min: 1, max: 1 };
    case "1min":
      return { min: 1, max: 2 };
    case "2min":
      return { min: 2, max: 3 };
    case "3min":
      return { min: 2, max: 3 };
    case "5min":
      return { min: 3, max: 4 };
    case "7min":
      return { min: 4, max: 5 };
    default:
      return { min: 2, max: 3 };
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

// Generate exercises for a Neuro Gym session
export function generateNeuroGymSession(
  area: NeuroGymArea,
  duration: NeuroGymDuration,
  allExercises: CognitiveExercise[],
  trainingGoals?: TrainingGoal[]
): CognitiveExercise[] {
  if (area === "neuro-activation") {
    // Return fixed sequence for Neuro Activation
    return NEURO_ACTIVATION_SEQUENCE
      .map(id => allExercises.find(e => e.id === id))
      .filter((e): e is CognitiveExercise => e !== undefined);
  }

  // Filter exercises by gym_area field
  let areaExercises = allExercises.filter(e => e.gym_area === area);
  
  // If no exercises found with gym_area, fall back to all exercises
  if (areaExercises.length === 0) {
    areaExercises = allExercises;
  }

  // Determine thinking mode filter based on training goals
  const hasFast = trainingGoals?.includes("fast_thinking");
  const hasSlow = trainingGoals?.includes("slow_thinking");
  
  let filteredExercises: CognitiveExercise[];
  
  if (hasFast && hasSlow) {
    // Both selected: create balanced mix (prefer 2 fast + 2 slow)
    const fastExercises = areaExercises.filter(e => e.thinking_mode === "fast");
    const slowExercises = areaExercises.filter(e => e.thinking_mode === "slow");
    
    const { min, max } = getNeuroGymExerciseCount(duration);
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
  const { min, max } = getNeuroGymExerciseCount(duration);
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