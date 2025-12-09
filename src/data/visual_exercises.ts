// Visual & Game-Style Cognitive Drills
// All exercises are now visual/interactive - no text input

export interface VisualExerciseConfig {
  drillType: 'dot_target' | 'n_back_visual' | 'pattern_sequence' | 'visual_search' | 
             'memory_matrix' | 'stroop_visual' | 'shape_match' | 'mental_rotation' |
             'digit_span' | 'go_no_go' | 'location_match' | 'odd_one_out' | 
             'sequence_logic' | 'analogy_match' | 'category_switch' | 'word_association' |
             'rule_switch';
  timeLimit: number; // seconds
  difficulty: 'easy' | 'medium' | 'hard';
  config: Record<string, any>;
}

// Mapping from exercise IDs to visual configs
// All exercises across 5 categories: focus, memory, control, reasoning, creativity
export const VISUAL_TASK_CONFIGS: Record<string, VisualExerciseConfig> = {
  // ============ FOCUS ARENA ============
  // Fast Thinking
  "FOCUS_DOT_001": {
    drillType: "dot_target",
    timeLimit: 30,
    difficulty: "easy",
    config: { targetColor: "green", distractorColors: ["red"], dotSize: 48, spawnInterval: 700, dotLifetime: 1200 }
  },
  "FOCUS_DOT_002": {
    drillType: "dot_target",
    timeLimit: 45,
    difficulty: "medium",
    config: { targetColor: "green", distractorColors: ["red", "yellow"], dotSize: 44, spawnInterval: 600, dotLifetime: 1000 }
  },
  "FOCUS_SEARCH_001": {
    drillType: "visual_search",
    timeLimit: 30,
    difficulty: "medium",
    config: { gridSize: 4, targetShape: "T", distractorShape: "L", trialsCount: 8, timePerTrial: 3000 }
  },
  "FOCUS_SEARCH_002": {
    drillType: "visual_search",
    timeLimit: 60,
    difficulty: "hard",
    config: { gridSize: 5, targetShape: "T", distractorShape: "L", trialsCount: 12, timePerTrial: 4000 }
  },
  "FOCUS_SHAPE_001": {
    drillType: "shape_match",
    timeLimit: 30,
    difficulty: "easy",
    config: { shapes: ["circle", "square", "triangle"], displayTime: 1200, totalTrials: 10, matchProbability: 0.3 }
  },
  // Slow Thinking
  "FOCUS_SEARCH_SLOW_001": {
    drillType: "visual_search",
    timeLimit: 120,
    difficulty: "hard",
    config: { gridSize: 6, targetShape: "T", distractorShape: "L", trialsCount: 15, timePerTrial: 6000 }
  },

  // ============ MEMORY CORE ============
  // Fast Thinking
  "MEMORY_DIGIT_001": {
    drillType: "digit_span",
    timeLimit: 30,
    difficulty: "medium",
    config: { startingLength: 3, maxLength: 6, displayTime: 600, trialsPerLength: 1 }
  },
  "MEMORY_DIGIT_002": {
    drillType: "digit_span",
    timeLimit: 60,
    difficulty: "hard",
    config: { startingLength: 4, maxLength: 8, displayTime: 500, trialsPerLength: 1 }
  },
  "MEMORY_NBACK_001": {
    drillType: "n_back_visual",
    timeLimit: 60,
    difficulty: "medium",
    config: { nBack: 1, shapes: ["circle", "square", "triangle", "star"], displayTime: 1200, intervalTime: 400, totalTrials: 12 }
  },
  "MEMORY_NBACK_002": {
    drillType: "n_back_visual",
    timeLimit: 90,
    difficulty: "hard",
    config: { nBack: 2, shapes: ["circle", "square", "triangle", "star", "diamond"], displayTime: 1000, intervalTime: 400, totalTrials: 15 }
  },
  "MEMORY_LOC_001": {
    drillType: "location_match",
    timeLimit: 45,
    difficulty: "medium",
    config: { gridSize: 3, trialsCount: 12, displayTime: 1200, matchProbability: 0.3 }
  },
  "MEMORY_MATRIX_001": {
    drillType: "memory_matrix",
    timeLimit: 60,
    difficulty: "medium",
    config: { gridSize: 2, colors: ["#ef4444", "#22c55e", "#3b82f6", "#eab308"], startingLength: 2, maxLength: 7, flashDuration: 400, pauseBetween: 200 }
  },
  // Slow Thinking
  "MEMORY_PATTERN_001": {
    drillType: "pattern_sequence",
    timeLimit: 120,
    difficulty: "hard",
    config: { gridSize: 4, startingLength: 4, maxLength: 9, flashDuration: 500, flashInterval: 300 }
  },
  "MEMORY_MATRIX_002": {
    drillType: "memory_matrix",
    timeLimit: 120,
    difficulty: "hard",
    config: { gridSize: 2, colors: ["#ef4444", "#22c55e", "#3b82f6", "#eab308"], startingLength: 3, maxLength: 12, flashDuration: 350, pauseBetween: 150 }
  },

  // ============ CONTROL LAB ============
  // Fast Thinking
  "CONTROL_GONO_001": {
    drillType: "go_no_go",
    timeLimit: 30,
    difficulty: "medium",
    config: { goColor: "#22c55e", noGoColor: "#ef4444", trialsCount: 15, displayTime: 800, goProbability: 0.7 }
  },
  "CONTROL_GONO_002": {
    drillType: "go_no_go",
    timeLimit: 45,
    difficulty: "hard",
    config: { goColor: "#22c55e", noGoColor: "#ef4444", trialsCount: 20, displayTime: 600, goProbability: 0.65 }
  },
  "CONTROL_STROOP_001": {
    drillType: "stroop_visual",
    timeLimit: 30,
    difficulty: "medium",
    config: { words: ["RED", "BLUE", "GREEN", "YELLOW"], colors: ["#ef4444", "#3b82f6", "#22c55e", "#eab308"], trialsCount: 10, timePerTrial: 3000 }
  },
  "CONTROL_STROOP_002": {
    drillType: "stroop_visual",
    timeLimit: 60,
    difficulty: "hard",
    config: { words: ["RED", "BLUE", "GREEN", "YELLOW"], colors: ["#ef4444", "#3b82f6", "#22c55e", "#eab308"], trialsCount: 18, timePerTrial: 2500 }
  },
  "CONTROL_RULE_001": {
    drillType: "rule_switch",
    timeLimit: 45,
    difficulty: "medium",
    config: { trialsCount: 15, switchFrequency: 4 }
  },
  // Slow Thinking
  "CONTROL_CAT_001": {
    drillType: "category_switch",
    timeLimit: 90,
    difficulty: "medium",
    config: { trialsCount: 20, timePerTrial: 4000 }
  },
  "CONTROL_RULE_002": {
    drillType: "rule_switch",
    timeLimit: 120,
    difficulty: "hard",
    config: { trialsCount: 25, switchFrequency: 3 }
  },

  // ============ CRITICAL REASONING STUDIO ============
  // Fast Thinking
  "REASON_SEQ_001": {
    drillType: "sequence_logic",
    timeLimit: 30,
    difficulty: "easy",
    config: { trialsCount: 6, timePerTrial: 5000, difficulty: "easy" }
  },
  "REASON_SEQ_002": {
    drillType: "sequence_logic",
    timeLimit: 45,
    difficulty: "medium",
    config: { trialsCount: 8, timePerTrial: 5000, difficulty: "medium" }
  },
  "REASON_ODD_001": {
    drillType: "odd_one_out",
    timeLimit: 30,
    difficulty: "easy",
    config: { trialsCount: 8, timePerTrial: 4000, difficulty: "easy" }
  },
  // Slow Thinking
  "REASON_SEQ_003": {
    drillType: "sequence_logic",
    timeLimit: 120,
    difficulty: "hard",
    config: { trialsCount: 10, timePerTrial: 10000, difficulty: "hard" }
  },
  "REASON_ANALOG_001": {
    drillType: "analogy_match",
    timeLimit: 90,
    difficulty: "medium",
    config: { trialsCount: 10, timePerTrial: 8000, difficulty: "medium" }
  },
  "REASON_ANALOG_002": {
    drillType: "analogy_match",
    timeLimit: 120,
    difficulty: "hard",
    config: { trialsCount: 12, timePerTrial: 10000, difficulty: "hard" }
  },

  // ============ CREATIVITY HUB ============
  // Fast Thinking
  "CREATE_ODD_001": {
    drillType: "odd_one_out",
    timeLimit: 30,
    difficulty: "medium",
    config: { trialsCount: 8, timePerTrial: 3500, difficulty: "medium" }
  },
  "CREATE_ODD_002": {
    drillType: "odd_one_out",
    timeLimit: 45,
    difficulty: "hard",
    config: { trialsCount: 10, timePerTrial: 4000, difficulty: "hard" }
  },
  "CREATE_CAT_001": {
    drillType: "category_switch",
    timeLimit: 45,
    difficulty: "medium",
    config: { trialsCount: 15, timePerTrial: 3000 }
  },
  // Slow Thinking
  "CREATE_ANALOG_001": {
    drillType: "analogy_match",
    timeLimit: 90,
    difficulty: "medium",
    config: { trialsCount: 10, timePerTrial: 8000, difficulty: "medium" }
  },
  "CREATE_WORD_001": {
    drillType: "word_association",
    timeLimit: 90,
    difficulty: "medium",
    config: { trialsCount: 8, timePerTrial: 10000 }
  },
  "CREATE_WORD_002": {
    drillType: "word_association",
    timeLimit: 120,
    difficulty: "hard",
    config: { trialsCount: 10, timePerTrial: 10000 }
  },
};

// Exercise metadata for database seeding
export interface VisualExerciseData {
  id: string;
  category: string;
  type: string;
  difficulty: string;
  duration: string;
  title: string;
  prompt: string;
  explanation: string;
  metrics_affected: string[];
  weight: number;
  gym_area: string;
  thinking_mode: 'fast' | 'slow';
}

// Define which exercises are Slow Thinking (System 2) - deliberate, analytical
// All others default to Fast Thinking (System 1) - automatic, intuitive
const SLOW_THINKING_EXERCISES = new Set([
  // Focus - extended deliberate search
  "FOCUS_SEARCH_SLOW_001",
  // Memory - complex pattern analysis, 2-back requires deliberation
  "MEMORY_NBACK_002",
  "MEMORY_PATTERN_001", 
  "MEMORY_MATRIX_002",
  // Control - complex rule following, category switching
  "CONTROL_CAT_001",
  "CONTROL_RULE_002",
  // Reasoning - complex sequences, analogies require analysis
  "REASON_SEQ_003",
  "REASON_ANALOG_001",
  "REASON_ANALOG_002",
  // Creativity - word association, complex analogies
  "CREATE_ANALOG_001",
  "CREATE_WORD_001",
  "CREATE_WORD_002",
]);

// Generate exercise metadata from configs
function generateExerciseMetadata(): VisualExerciseData[] {
  const exerciseData: VisualExerciseData[] = [];
  
  const drillTitles: Record<string, string> = {
    dot_target: "Dot Target Drill",
    visual_search: "Visual Search",
    shape_match: "Shape Match",
    digit_span: "Digit Span",
    n_back_visual: "N-Back Visual",
    location_match: "Location Match",
    memory_matrix: "Memory Matrix",
    pattern_sequence: "Pattern Sequence",
    go_no_go: "Go/No-Go",
    stroop_visual: "Stroop Test",
    rule_switch: "Rule Switch",
    sequence_logic: "Sequence Logic",
    odd_one_out: "Odd One Out",
    analogy_match: "Analogy Match",
    category_switch: "Category Switch",
    word_association: "Word Association",
    mental_rotation: "Mental Rotation",
  };
  
  const drillPrompts: Record<string, string> = {
    dot_target: "Tap the green dots as fast as possible. Avoid red dots!",
    visual_search: "Find the target shape among the distractors as quickly as possible.",
    shape_match: "Does the current shape match the previous one?",
    digit_span: "Remember the sequence of digits and enter them in order.",
    n_back_visual: "Is the current shape the same as N positions ago?",
    location_match: "Is the position the same as the previous one?",
    memory_matrix: "Repeat the color sequence in the correct order.",
    pattern_sequence: "Remember and reproduce the pattern sequence.",
    go_no_go: "Tap for green (GO), don't tap for red (NO-GO).",
    stroop_visual: "Select the COLOR of the text, not the word itself.",
    rule_switch: "Follow the rule displayed. Rules change during the task!",
    sequence_logic: "Find the pattern and select the next item in the sequence.",
    odd_one_out: "Identify which item doesn't belong with the others.",
    analogy_match: "Complete the analogy: A is to B as C is to ?",
    category_switch: "Switch between different categorization rules.",
    word_association: "Find the word that connects all three given words.",
    mental_rotation: "Are these two shapes the same when rotated?",
  };
  
  const areaMetrics: Record<string, string[]> = {
    focus: ["focus_stability", "reaction_speed", "visual_processing"],
    memory: ["working_memory", "pattern_recognition"],
    control: ["cognitive_control", "inhibition", "reaction_speed"],
    reasoning: ["reasoning_accuracy", "critical_thinking_score", "decision_quality"],
    creativity: ["creativity", "pattern_recognition", "reasoning_accuracy"],
  };
  
  const areaCategories: Record<string, string> = {
    FOCUS: "attention",
    MEMORY: "working_memory",
    CONTROL: "cognitive_control",
    REASON: "reasoning",
    CREATE: "creative",
  };
  
  Object.entries(VISUAL_TASK_CONFIGS).forEach(([id, config]) => {
    const prefix = id.split("_")[0];
    const gymArea = prefix.toLowerCase();
    const category = areaCategories[prefix] || "attention";
    const metrics = areaMetrics[gymArea] || ["focus_stability"];
    
    // Determine duration based on timeLimit
    let duration = "30s";
    if (config.timeLimit >= 90) duration = "2min";
    if (config.timeLimit >= 180) duration = "5min";
    
    // Determine thinking mode - Slow if in set, otherwise Fast
    const thinkingMode = SLOW_THINKING_EXERCISES.has(id) ? 'slow' : 'fast';
    
    exerciseData.push({
      id,
      category,
      type: "visual_drill",
      difficulty: config.difficulty,
      duration,
      title: drillTitles[config.drillType] || "Cognitive Drill",
      prompt: drillPrompts[config.drillType] || "Complete the exercise.",
      explanation: "Visual cognitive training exercise.",
      metrics_affected: metrics,
      weight: 1,
      gym_area: gymArea,
      thinking_mode: thinkingMode,
    });
  });
  
  return exerciseData;
}

export const VISUAL_EXERCISES_DATA = generateExerciseMetadata();

// Helper to check if an exercise is a visual drill/task
export function isVisualDrill(exerciseId: string): boolean {
  return exerciseId in VISUAL_TASK_CONFIGS;
}

// Get visual config for an exercise
export function getVisualConfig(exerciseId: string): VisualExerciseConfig | null {
  return VISUAL_TASK_CONFIGS[exerciseId] || null;
}

// Get all exercise IDs for a gym area
export function getExerciseIdsForArea(area: string): string[] {
  const prefixMap: Record<string, string> = {
    focus: "FOCUS_",
    memory: "MEMORY_",
    control: "CONTROL_",
    reasoning: "REASON_",
    creativity: "CREATE_",
  };
  
  const prefix = prefixMap[area];
  if (!prefix) return [];
  
  return Object.keys(VISUAL_TASK_CONFIGS).filter(id => id.startsWith(prefix));
}
