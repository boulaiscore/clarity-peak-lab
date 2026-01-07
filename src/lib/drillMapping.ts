// Maps exercise IDs to their appropriate drill component types
// This allows the NeuroLabSessionRunner to render the correct drill for each exercise

export type DrillType = 
  | "dot_target"      // Green/red dots to tap
  | "odd_one_out"     // Find the different item
  | "shape_match"     // Match shapes that appear in sequence
  | "visual_search"   // Find target in grid of distractors
  | "go_no_go"        // Tap on go stimuli, don't tap on no-go
  | "stroop"          // Color-word interference
  | "location_match"  // Remember if location matches previous
  | "digit_span"      // Remember sequence of digits
  | "n_back"          // N-back working memory
  | "pattern_sequence"// Complete the pattern
  | "memory_matrix"   // Remember grid pattern
  | "mental_rotation" // Rotate shapes mentally
  | "category_switch" // Switch between categorization rules
  | "rule_switch"     // Switch between response rules
  | "analogy_match"   // Find analogous pairs
  | "sequence_logic"  // Logical sequence completion
  | "word_association"// Find related words
  | "visual_vibe"     // Match visual/emotional vibe
  | "color_harmony"   // Pick harmonizing colors
  | "gestalt_completion" // Complete partial shapes intuitively
  | "rapid_association"  // Quick emotional/visual associations
  | "open_reflection"    // Open-ended reflection exercises
  | "critical_reasoning_slow" // Socratic/philosophical reasoning drills
  | "focus_slow" // Socratic attention/focus drills
  // NEW Fast Focus drills
  | "target_lock"
  | "flash_count"
  | "peripheral_alert"
  | "color_word_snap"
  | "signal_filter"
  | "one_back_focus"
  | "speed_sort"
  | "dual_target"
  | "false_alarm"
  | "focus_window"
  | "distractor_burst"
  | "odd_precision"
  | "rapid_tracking"
  | "hidden_rule"
  | "temporal_gate"
  | "multi_feature_lock"
  | "cognitive_interference"
  | "acceleration"
  | "error_recovery"
  | "chaos_focus";

// Default configurations for each drill type
export const DRILL_CONFIGS: Record<DrillType, {
  timeLimit: number;
  difficulty: 'easy' | 'medium' | 'hard';
}> = {
  dot_target: { timeLimit: 30, difficulty: 'easy' },
  odd_one_out: { timeLimit: 30, difficulty: 'easy' },
  shape_match: { timeLimit: 30, difficulty: 'medium' },
  visual_search: { timeLimit: 30, difficulty: 'medium' },
  go_no_go: { timeLimit: 30, difficulty: 'easy' },
  stroop: { timeLimit: 30, difficulty: 'medium' },
  location_match: { timeLimit: 30, difficulty: 'medium' },
  digit_span: { timeLimit: 45, difficulty: 'medium' },
  n_back: { timeLimit: 45, difficulty: 'hard' },
  pattern_sequence: { timeLimit: 30, difficulty: 'medium' },
  memory_matrix: { timeLimit: 30, difficulty: 'medium' },
  mental_rotation: { timeLimit: 30, difficulty: 'hard' },
  category_switch: { timeLimit: 30, difficulty: 'medium' },
  rule_switch: { timeLimit: 30, difficulty: 'medium' },
  analogy_match: { timeLimit: 30, difficulty: 'medium' },
  sequence_logic: { timeLimit: 30, difficulty: 'medium' },
  word_association: { timeLimit: 30, difficulty: 'easy' },
  visual_vibe: { timeLimit: 30, difficulty: 'easy' },
  color_harmony: { timeLimit: 30, difficulty: 'easy' },
  gestalt_completion: { timeLimit: 30, difficulty: 'easy' },
  rapid_association: { timeLimit: 30, difficulty: 'easy' },
  open_reflection: { timeLimit: 180, difficulty: 'medium' },
  critical_reasoning_slow: { timeLimit: 60, difficulty: 'hard' },
  focus_slow: { timeLimit: 60, difficulty: 'hard' },
  // Fast Focus Level 1 (Easy)
  target_lock: { timeLimit: 45, difficulty: 'easy' },
  flash_count: { timeLimit: 45, difficulty: 'easy' },
  peripheral_alert: { timeLimit: 45, difficulty: 'easy' },
  color_word_snap: { timeLimit: 45, difficulty: 'easy' },
  signal_filter: { timeLimit: 45, difficulty: 'easy' },
  one_back_focus: { timeLimit: 45, difficulty: 'easy' },
  speed_sort: { timeLimit: 45, difficulty: 'easy' },
  // Fast Focus Level 2 (Medium)
  dual_target: { timeLimit: 45, difficulty: 'medium' },
  false_alarm: { timeLimit: 45, difficulty: 'medium' },
  focus_window: { timeLimit: 45, difficulty: 'medium' },
  distractor_burst: { timeLimit: 45, difficulty: 'medium' },
  odd_precision: { timeLimit: 45, difficulty: 'medium' },
  rapid_tracking: { timeLimit: 45, difficulty: 'medium' },
  // Fast Focus Level 3 (Hard)
  hidden_rule: { timeLimit: 45, difficulty: 'hard' },
  temporal_gate: { timeLimit: 45, difficulty: 'hard' },
  multi_feature_lock: { timeLimit: 45, difficulty: 'hard' },
  cognitive_interference: { timeLimit: 45, difficulty: 'hard' },
  acceleration: { timeLimit: 45, difficulty: 'hard' },
  error_recovery: { timeLimit: 45, difficulty: 'hard' },
  chaos_focus: { timeLimit: 45, difficulty: 'hard' },
};

// Map exercise IDs to drill types
export function getDrillTypeForExercise(exerciseId: string): DrillType {
  const id = exerciseId.toUpperCase();
  
  // NEW Fast Focus exercises (FF_L1_001 - FF_L3_007)
  if (id.startsWith("FF_L1_")) {
    const num = parseInt(id.split("_")[2], 10);
    switch (num) {
      case 1: return "target_lock";
      case 2: return "flash_count";
      case 3: return "peripheral_alert";
      case 4: return "color_word_snap";
      case 5: return "signal_filter";
      case 6: return "one_back_focus";
      case 7: return "speed_sort";
      default: return "target_lock";
    }
  }
  
  if (id.startsWith("FF_L2_")) {
    const num = parseInt(id.split("_")[2], 10);
    switch (num) {
      case 1: return "dual_target";
      case 2: return "false_alarm";
      case 3: return "rule_switch";
      case 4: return "focus_window";
      case 5: return "distractor_burst";
      case 6: return "odd_precision";
      case 7: return "rapid_tracking";
      default: return "dual_target";
    }
  }
  
  if (id.startsWith("FF_L3_")) {
    const num = parseInt(id.split("_")[2], 10);
    switch (num) {
      case 1: return "hidden_rule";
      case 2: return "temporal_gate";
      case 3: return "multi_feature_lock";
      case 4: return "cognitive_interference";
      case 5: return "acceleration";
      case 6: return "error_recovery";
      case 7: return "chaos_focus";
      default: return "hidden_rule";
    }
  }
  
  // Focus Arena Fast Thinking exercises (FA_FAST_001 - FA_FAST_050) - legacy
  if (id.startsWith("FA_FAST_")) {
    const num = parseInt(id.split("_")[2], 10);
    if (num <= 5) return "dot_target";
    if (num <= 10) return "odd_one_out";
    if (num <= 15) return "shape_match";
    if (num <= 20) return "visual_search";
    if (num <= 25) return "go_no_go";
    if (num <= 30) return "stroop";
    if (num <= 35) return "location_match";
    if (num <= 40) return "category_switch";
    if (num <= 45) return "pattern_sequence";
    return "rule_switch";
  }
  
  // Focus Arena Slow Thinking exercises
  if (id.startsWith("FA_S2_") || id.startsWith("FA_SLOW_")) {
    return "focus_slow";
  }
  
  // Memory Core exercises
  if (id.startsWith("MC_") || id.startsWith("MEMORY_")) {
    const num = parseInt(id.split("_").pop() || "0", 10);
    if (num <= 10) return "digit_span";
    if (num <= 20) return "memory_matrix";
    if (num <= 30) return "n_back";
    return "location_match";
  }
  
  // Control Lab exercises
  if (id.startsWith("CL_") || id.startsWith("CONTROL_")) {
    const num = parseInt(id.split("_").pop() || "0", 10);
    if (num <= 15) return "go_no_go";
    if (num <= 30) return "stroop";
    return "rule_switch";
  }
  
  // Critical Reasoning Fast Thinking exercises
  if (id.startsWith("CR_FAST_")) {
    const num = parseInt(id.split("_")[2], 10);
    if (num <= 10) return "sequence_logic";
    if (num <= 20) return "analogy_match";
    if (num <= 30) return "pattern_sequence";
    if (num <= 40) return "odd_one_out";
    return "category_switch";
  }
  
  // Critical Reasoning Slow Thinking exercises
  if (id.startsWith("CR_SLOW_")) {
    return "critical_reasoning_slow";
  }
  
  // Critical Reasoning legacy exercises
  if (id.startsWith("CR_") || id.startsWith("REASONING_")) {
    const num = parseInt(id.split("_").pop() || "0", 10);
    if (num <= 15) return "sequence_logic";
    if (num <= 30) return "analogy_match";
    return "pattern_sequence";
  }
  
  // Creativity Hub Fast Thinking exercises
  if (id.startsWith("CH_FAST_")) {
    const num = parseInt(id.split("_")[2], 10);
    if (num <= 10) return "visual_vibe";
    if (num <= 20) return "rapid_association";
    if (num <= 30) return "color_harmony";
    if (num <= 40) return "gestalt_completion";
    return "visual_vibe";
  }
  
  // Creativity Hub legacy exercises
  if (id.startsWith("CH_") || id.startsWith("CREATIVE_")) {
    const num = parseInt(id.split("_").pop() || "0", 10);
    if (num <= 15) return "odd_one_out";
    if (num <= 30) return "word_association";
    return "analogy_match";
  }
  
  // Neuro exercises (N001-N015)
  if (id.startsWith("N0") || id.startsWith("N1")) {
    const num = parseInt(id.slice(1), 10);
    if (num <= 3) return "dot_target";
    if (num <= 6) return "n_back";
    if (num <= 9) return "go_no_go";
    if (num <= 12) return "visual_search";
    return "stroop";
  }
  
  // Default fallback based on common patterns in ID
  if (id.includes("DOT") || id.includes("TARGET") || id.includes("REACTION")) return "dot_target";
  if (id.includes("ODD") || id.includes("DIFFERENT")) return "odd_one_out";
  if (id.includes("SHAPE") || id.includes("MATCH")) return "shape_match";
  if (id.includes("SEARCH") || id.includes("FIND")) return "visual_search";
  if (id.includes("GO") || id.includes("STOP") || id.includes("INHIBIT")) return "go_no_go";
  if (id.includes("STROOP") || id.includes("COLOR")) return "stroop";
  if (id.includes("LOCATION") || id.includes("POSITION")) return "location_match";
  if (id.includes("DIGIT") || id.includes("SPAN") || id.includes("SEQUENCE")) return "digit_span";
  if (id.includes("NBACK") || id.includes("N-BACK") || id.includes("BACK")) return "n_back";
  if (id.includes("PATTERN")) return "pattern_sequence";
  if (id.includes("MATRIX") || id.includes("GRID")) return "memory_matrix";
  if (id.includes("ROTATE") || id.includes("ROTATION")) return "mental_rotation";
  if (id.includes("SWITCH") || id.includes("CATEGORY")) return "category_switch";
  if (id.includes("RULE")) return "rule_switch";
  if (id.includes("ANALOGY")) return "analogy_match";
  if (id.includes("LOGIC")) return "sequence_logic";
  if (id.includes("WORD") || id.includes("ASSOCIATION")) return "word_association";
  
  // Default to a simple, reliable drill
  return "dot_target";
}
