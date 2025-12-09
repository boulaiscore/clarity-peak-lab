// Maps exercise IDs to their appropriate drill component types
// This allows the NeuroGymSessionRunner to render the correct drill for each exercise

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
  | "open_reflection";   // Open-ended reflection exercises

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
};

// Map exercise IDs to drill types
// FA_FAST = Focus Arena Fast, MC = Memory Core, etc.
export function getDrillTypeForExercise(exerciseId: string): DrillType {
  const id = exerciseId.toUpperCase();
  
  // Focus Arena Fast Thinking exercises (FA_FAST_001 - FA_FAST_050)
  if (id.startsWith("FA_FAST_")) {
    const num = parseInt(id.split("_")[2], 10);
    
    // Distribute exercises across different drill types for variety
    if (num <= 5) return "dot_target";           // 001-005: Dot/target tapping
    if (num <= 10) return "odd_one_out";         // 006-010: Find different item
    if (num <= 15) return "shape_match";         // 011-015: Shape matching
    if (num <= 20) return "visual_search";       // 016-020: Visual search
    if (num <= 25) return "go_no_go";            // 021-025: Go/No-Go
    if (num <= 30) return "stroop";              // 026-030: Stroop effect
    if (num <= 35) return "location_match";      // 031-035: Location memory
    if (num <= 40) return "category_switch";     // 036-040: Category switching
    if (num <= 45) return "pattern_sequence";    // 041-045: Pattern sequences
    return "rule_switch";                         // 046-050: Rule switching
  }
  
  // Focus Arena Slow Thinking exercises (FA_S2_001 - FA_S2_050)
  if (id.startsWith("FA_S2_")) {
    const num = parseInt(id.split("_")[2], 10);
    
    // Slow thinking exercises emphasize rule-based, deliberate decisions
    if (num <= 5) return "rule_switch";          // 001-005: Rule conflict/switching
    if (num <= 10) return "stroop";              // 006-010: Interference tasks
    if (num <= 15) return "go_no_go";            // 011-015: Inhibition tasks
    if (num <= 20) return "category_switch";     // 016-020: Multi-step evaluation
    if (num <= 25) return "n_back";              // 021-025: Memory-based rules
    if (num <= 30) return "odd_one_out";         // 026-030: Pattern detection
    if (num <= 35) return "shape_match";         // 031-035: Condition matching
    if (num <= 40) return "visual_search";       // 036-040: Spatial/directional
    if (num <= 45) return "pattern_sequence";    // 041-045: Sequential logic
    return "rule_switch";                         // 046-050: Rule hierarchy
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
  
  // Critical Reasoning Fast Thinking exercises (CR_FAST_001 - CR_FAST_050)
  if (id.startsWith("CR_FAST_")) {
    const num = parseInt(id.split("_")[2], 10);
    
    // Fast critical reasoning - rapid pattern/logic recognition
    if (num <= 10) return "sequence_logic";       // 001-010: Quick logical sequences
    if (num <= 20) return "analogy_match";        // 011-020: Fast analogy recognition
    if (num <= 30) return "pattern_sequence";     // 021-030: Pattern completion
    if (num <= 40) return "odd_one_out";          // 031-040: Logical odd one out
    return "category_switch";                      // 041-050: Quick category logic
  }
  
  // Critical Reasoning Slow Thinking exercises (CR_SLOW_001 - CR_SLOW_050)
  // These are open-ended reflection exercises, not visual drills
  if (id.startsWith("CR_SLOW_")) {
    return "open_reflection";
  }
  
  // Critical Reasoning legacy exercises
  if (id.startsWith("CR_") || id.startsWith("REASONING_")) {
    const num = parseInt(id.split("_").pop() || "0", 10);
    if (num <= 15) return "sequence_logic";
    if (num <= 30) return "analogy_match";
    return "pattern_sequence";
  }
  
  // Creativity Hub Fast Thinking exercises (CH_FAST_001 - CH_FAST_050)
  // Uses intuitive, fast creativity drills - NOT logical reasoning
  if (id.startsWith("CH_FAST_")) {
    const num = parseInt(id.split("_")[2], 10);
    
    // Intuitive creativity exercises - vibe matching, color sense, rapid association
    if (num <= 10) return "visual_vibe";           // 001-010: Match the vibe/mood
    if (num <= 20) return "rapid_association";     // 011-020: Quick emotional links
    if (num <= 30) return "color_harmony";         // 021-030: Aesthetic color matching
    if (num <= 40) return "gestalt_completion";    // 031-040: Complete partial shapes
    return "visual_vibe";                           // 041-050: More vibe matching
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
