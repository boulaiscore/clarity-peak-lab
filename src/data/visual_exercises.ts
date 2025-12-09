// Visual & Game-Style Cognitive Drills
// These exercises require interactive UI components for rendering

export interface VisualExerciseConfig {
  drillType: 'dot_target' | 'n_back_visual' | 'pattern_sequence' | 'visual_search' | 
             'spatial_rotation' | 'memory_matrix' | 'dual_task' | 'stroop_visual' |
             'creative_visual' | 'reaction_decision';
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

// Helper to check if an exercise is a visual drill
export function isVisualDrill(exerciseId: string): boolean {
  return exerciseId.startsWith("V");
}

// Get visual config for an exercise
export function getVisualConfig(exerciseId: string): VisualExerciseConfig | null {
  const exercise = visualExercises.find(e => e.id === exerciseId);
  return exercise?.visual_config || null;
}
