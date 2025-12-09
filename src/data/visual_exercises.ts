// Visual & Game-Style Cognitive Drills
// These exercises require interactive UI components for rendering

export interface VisualExerciseConfig {
  drillType: 'dot_target' | 'n_back_visual' | 'pattern_sequence' | 'visual_search' | 
             'spatial_rotation' | 'memory_matrix' | 'dual_task' | 'stroop_visual' |
             'creative_visual' | 'reaction_decision' | 'shape_match' | 'mental_rotation' |
             'digit_span' | 'go_no_go' | 'location_match';
  timeLimit: number; // seconds
  difficulty: 'easy' | 'medium' | 'hard';
  config: Record<string, any>;
}

export interface VisualExercise {
  id: string;
  category: 'visual' | 'spatial' | 'game' | 'visual_memory';
  type: 'visual_drill';
  difficulty: 'easy' | 'medium' | 'hard';
  duration: '30s' | '90s' | '2min' | '3min' | '5min';
  title: string;
  prompt: string;
  instructions: string;
  options: null;
  correct_option_index: null;
  explanation: string;
  metrics_affected: string[];
  weight: number;
  visual_config: VisualExerciseConfig;
}

export const visualExercises: VisualExercise[] = [
  {
    id: "V001",
    category: "visual",
    type: "visual_drill",
    difficulty: "easy",
    duration: "30s",
    title: "Visual Target Drill",
    prompt: "Tap the GREEN dots as fast as possible. Avoid RED and YELLOW dots.",
    instructions: "Focus on speed and accuracy. Green = tap, Red/Yellow = ignore.",
    options: null,
    correct_option_index: null,
    explanation: "Tests selective visual attention and response inhibition under time pressure.",
    metrics_affected: ["focus_stability", "reaction_speed", "fast_thinking"],
    weight: 1.2,
    visual_config: {
      drillType: "dot_target",
      timeLimit: 30,
      difficulty: "easy",
      config: {
        targetColor: "green",
        distractorColors: ["red", "yellow"],
        dotSize: 48,
        spawnInterval: 800,
        dotLifetime: 1500
      }
    }
  },
  {
    id: "V002",
    category: "visual_memory",
    type: "visual_drill",
    difficulty: "medium",
    duration: "2min",
    title: "1-Back Visual Memory",
    prompt: "Tap MATCH when the current shape matches the PREVIOUS shape.",
    instructions: "Shapes appear one at a time. Remember the previous shape and compare.",
    options: null,
    correct_option_index: null,
    explanation: "Basic n-back task for working memory updating using visual stimuli.",
    metrics_affected: ["visual_processing", "focus_stability", "slow_thinking"],
    weight: 1.3,
    visual_config: {
      drillType: "n_back_visual",
      timeLimit: 120,
      difficulty: "medium",
      config: {
        nBack: 1,
        shapes: ["circle", "square", "triangle", "star", "diamond"],
        displayTime: 1500,
        intervalTime: 500,
        totalTrials: 20
      }
    }
  },
  {
    id: "V003",
    category: "visual",
    type: "visual_drill",
    difficulty: "medium",
    duration: "2min",
    title: "Pattern Sequence Recognition",
    prompt: "Watch the pattern sequence, then recreate it in order.",
    instructions: "A sequence of colored cells will flash. Tap them in the same order.",
    options: null,
    correct_option_index: null,
    explanation: "Tests visual sequential memory and pattern recognition abilities.",
    metrics_affected: ["visual_processing", "focus_stability", "spatial_reasoning"],
    weight: 1.2,
    visual_config: {
      drillType: "pattern_sequence",
      timeLimit: 120,
      difficulty: "medium",
      config: {
        gridSize: 3,
        startingLength: 3,
        maxLength: 7,
        flashDuration: 500,
        flashInterval: 300
      }
    }
  },
  {
    id: "V004",
    category: "visual",
    type: "visual_drill",
    difficulty: "medium",
    duration: "2min",
    title: "Visual Search Grid",
    prompt: "Find the target shape among distractors as quickly as possible.",
    instructions: "Look for the unique shape in each grid. Speed matters!",
    options: null,
    correct_option_index: null,
    explanation: "Based on feature-integration theory. Tests visual search efficiency.",
    metrics_affected: ["focus_stability", "visual_processing", "reaction_speed"],
    weight: 1.2,
    visual_config: {
      drillType: "visual_search",
      timeLimit: 120,
      difficulty: "medium",
      config: {
        gridSize: 5,
        targetShape: "T",
        distractorShape: "L",
        trialsCount: 12,
        timePerTrial: 8000
      }
    }
  },
  {
    id: "V005",
    category: "spatial",
    type: "visual_drill",
    difficulty: "hard",
    duration: "3min",
    title: "Spatial Rotation Puzzle",
    prompt: "Identify which rotated shape matches the original.",
    instructions: "The original shape is shown. Select the correctly rotated version.",
    options: null,
    correct_option_index: null,
    explanation: "Mental rotation task that activates spatial processing networks.",
    metrics_affected: ["spatial_reasoning", "visual_processing", "slow_thinking"],
    weight: 1.5,
    visual_config: {
      drillType: "spatial_rotation",
      timeLimit: 180,
      difficulty: "hard",
      config: {
        shapeComplexity: "medium",
        rotationAngles: [90, 180, 270],
        includeReflections: true,
        trialsCount: 10,
        timePerTrial: 15000
      }
    }
  },
  {
    id: "V006",
    category: "visual_memory",
    type: "visual_drill",
    difficulty: "medium",
    duration: "90s",
    title: "Memory Matrix",
    prompt: "Watch the pattern light up, then repeat the sequence.",
    instructions: "Like Simon Says - remember and repeat the sequence of colors.",
    options: null,
    correct_option_index: null,
    explanation: "Classic memory task testing visual-spatial working memory capacity.",
    metrics_affected: ["focus_stability", "visual_processing", "fast_thinking"],
    weight: 1.3,
    visual_config: {
      drillType: "memory_matrix",
      timeLimit: 90,
      difficulty: "medium",
      config: {
        gridSize: 2, // 2x2 = 4 buttons
        colors: ["#ef4444", "#22c55e", "#3b82f6", "#eab308"],
        startingLength: 2,
        maxLength: 9,
        flashDuration: 400,
        pauseBetween: 200
      }
    }
  },
  {
    id: "V007",
    category: "game",
    type: "visual_drill",
    difficulty: "hard",
    duration: "2min",
    title: "Dual Task Challenge",
    prompt: "Identify shapes AND answer quick logic questions.",
    instructions: "Alternate between shape matching and simple logic checks. Stay sharp!",
    options: null,
    correct_option_index: null,
    explanation: "Dual-task paradigm testing cognitive load management and task switching.",
    metrics_affected: ["focus_stability", "fast_thinking", "critical_thinking_score"],
    weight: 1.5,
    visual_config: {
      drillType: "dual_task",
      timeLimit: 120,
      difficulty: "hard",
      config: {
        visualTask: "shape_match",
        logicTask: "quick_math",
        switchInterval: 3,
        totalRounds: 12
      }
    }
  },
  {
    id: "V008",
    category: "game",
    type: "visual_drill",
    difficulty: "medium",
    duration: "2min",
    title: "Stroop Visual Test",
    prompt: "Select the COLOR of the word, not what it says.",
    instructions: "Words will appear in different colors. Tap the COLOR you see.",
    options: null,
    correct_option_index: null,
    explanation: "Classic Stroop effect measures interference control and executive function.",
    metrics_affected: ["focus_stability", "slow_thinking", "bias_resistance"],
    weight: 1.3,
    visual_config: {
      drillType: "stroop_visual",
      timeLimit: 120,
      difficulty: "medium",
      config: {
        words: ["RED", "BLUE", "GREEN", "YELLOW"],
        colors: ["#ef4444", "#3b82f6", "#22c55e", "#eab308"],
        trialsCount: 20,
        timePerTrial: 5000
      }
    }
  },
  {
    id: "V009",
    category: "visual",
    type: "visual_drill",
    difficulty: "medium",
    duration: "3min",
    title: "Creative Visual Prompt",
    prompt: "View the ambiguous image and provide 3 different interpretations.",
    instructions: "Think creatively - what could this abstract image represent?",
    options: null,
    correct_option_index: null,
    explanation: "Divergent visual thinking task activating creative networks.",
    metrics_affected: ["creativity", "visual_processing", "philosophical_reasoning"],
    weight: 1.2,
    visual_config: {
      drillType: "creative_visual",
      timeLimit: 180,
      difficulty: "medium",
      config: {
        imageType: "abstract",
        requiredInterpretations: 3,
        showTimer: true
      }
    }
  },
  {
    id: "V010",
    category: "game",
    type: "visual_drill",
    difficulty: "hard",
    duration: "2min",
    title: "Reaction + Decision Challenge",
    prompt: "TAP on green, HOLD on blue, then choose the best option.",
    instructions: "React to colors with different actions, then make quick decisions.",
    options: null,
    correct_option_index: null,
    explanation: "Combines reaction time with decision-making under cognitive load.",
    metrics_affected: ["reaction_speed", "decision_quality", "fast_thinking"],
    weight: 1.4,
    visual_config: {
      drillType: "reaction_decision",
      timeLimit: 120,
      difficulty: "hard",
      config: {
        tapColor: "#22c55e",
        holdColor: "#3b82f6",
        holdDuration: 500,
        decisionOptions: 2,
        trialsCount: 15
      }
    }
  }
];

// Mapping from new exercise IDs to visual configs
const VISUAL_TASK_CONFIGS: Record<string, VisualExerciseConfig> = {
  // Focus Area - Fast
  "FA_FAST_001": { // Green Dot Reaction
    drillType: "dot_target",
    timeLimit: 30,
    difficulty: "easy",
    config: { targetColor: "green", distractorColors: ["red"], dotSize: 48, spawnInterval: 700, dotLifetime: 1200 }
  },
  "FA_FAST_002": { // Visual Search Snap
    drillType: "visual_search",
    timeLimit: 30,
    difficulty: "medium",
    config: { gridSize: 4, targetShape: "T", distractorShape: "L", trialsCount: 8, timePerTrial: 3000 }
  },
  
  // Memory Area - Fast
  "MC_FAST_001": { // Quick Digit Span
    drillType: "digit_span",
    timeLimit: 30,
    difficulty: "medium",
    config: { startingLength: 3, maxLength: 6, displayTime: 600, trialsPerLength: 1 }
  },
  "MC_FAST_002": { // 1-back Flash
    drillType: "n_back_visual",
    timeLimit: 60,
    difficulty: "medium",
    config: { nBack: 1, shapes: ["circle", "square", "triangle", "star"], displayTime: 1200, intervalTime: 400, totalTrials: 12 }
  },
  "MC_FAST_003": { // Location Match
    drillType: "location_match",
    timeLimit: 60,
    difficulty: "hard",
    config: { gridSize: 3, trialsCount: 12, displayTime: 1200, matchProbability: 0.3 }
  },
  
  // Control Area - Fast
  "CL_FAST_001": { // Go / No-Go Flash
    drillType: "go_no_go",
    timeLimit: 30,
    difficulty: "medium",
    config: { goColor: "#22c55e", noGoColor: "#ef4444", trialsCount: 15, displayTime: 800, goProbability: 0.7 }
  },
  "CL_FAST_002": { // Color vs Word Stroop
    drillType: "stroop_visual",
    timeLimit: 30,
    difficulty: "medium",
    config: { words: ["RED", "BLUE", "GREEN", "YELLOW"], colors: ["#ef4444", "#3b82f6", "#22c55e", "#eab308"], trialsCount: 10, timePerTrial: 3000 }
  },
  
  // Visual Game Area - Fast
  "VG_FAST_001": { // Pattern Sequence Snap
    drillType: "pattern_sequence",
    timeLimit: 30,
    difficulty: "medium",
    config: { gridSize: 3, startingLength: 3, maxLength: 5, flashDuration: 400, flashInterval: 200 }
  },
  "VG_FAST_002": { // Shape Match
    drillType: "shape_match",
    timeLimit: 30,
    difficulty: "medium",
    config: { shapes: ["circle", "square", "triangle", "diamond", "star"], displayTime: 1000, totalTrials: 10, matchProbability: 0.3 }
  },
  "VG_FAST_003": { // Target in Motion - use dot_target with moving dots
    drillType: "dot_target",
    timeLimit: 30,
    difficulty: "medium",
    config: { targetColor: "green", distractorColors: ["yellow"], dotSize: 40, spawnInterval: 600, dotLifetime: 1000 }
  },
  
  // Visual Game Area - Slow
  "VG_SLOW_001": { // Mental Rotation
    drillType: "mental_rotation",
    timeLimit: 120,
    difficulty: "medium",
    config: { trialsCount: 8, timePerTrial: 15000 }
  },
  "VG_SLOW_002": { // Path Planning - use pattern_sequence as placeholder
    drillType: "pattern_sequence",
    timeLimit: 180,
    difficulty: "hard",
    config: { gridSize: 4, startingLength: 4, maxLength: 8, flashDuration: 500, flashInterval: 300 }
  },
};

// Helper to check if an exercise is a visual drill/task
export function isVisualDrill(exerciseId: string): boolean {
  return exerciseId.startsWith("V") || exerciseId in VISUAL_TASK_CONFIGS;
}

// Get visual config for an exercise
export function getVisualConfig(exerciseId: string): VisualExerciseConfig | null {
  // Check new exercise ID mappings first
  if (exerciseId in VISUAL_TASK_CONFIGS) {
    return VISUAL_TASK_CONFIGS[exerciseId];
  }
  // Fall back to legacy V-prefixed exercises
  const exercise = visualExercises.find(e => e.id === exerciseId);
  return exercise?.visual_config || null;
}
