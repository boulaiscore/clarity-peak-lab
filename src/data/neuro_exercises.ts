import { Database } from "@/integrations/supabase/types";

type ExerciseCategory = Database["public"]["Enums"]["exercise_category"];
type ExerciseDifficulty = Database["public"]["Enums"]["exercise_difficulty"];
type ExerciseDuration = Database["public"]["Enums"]["exercise_duration"];
type ExerciseType = Database["public"]["Enums"]["exercise_type"];

interface NeuroExercise {
  id: string;
  category: ExerciseCategory;
  type: ExerciseType;
  difficulty: ExerciseDifficulty;
  duration: ExerciseDuration;
  title: string;
  prompt: string;
  options: string[] | null;
  correct_option_index: number | null;
  explanation: string;
  metrics_affected: string[];
  weight: number;
}

// New neuro-cognitive exercises to be upserted
export const newNeuroExercises: NeuroExercise[] = [
  {
    id: "N001",
    category: "attention",
    type: "multiple_choice",
    difficulty: "easy",
    duration: "30s",
    title: "Focused Dot Drill – Selective Attention",
    prompt: "Tap the dot ONLY when it is green. Ignore red and yellow dots.",
    options: ["Tap"],
    correct_option_index: 0,
    explanation: "Selective attention and inhibition under time pressure.",
    metrics_affected: ["focusStability", "fastThinking"],
    weight: 1
  },
  {
    id: "N002",
    category: "working_memory",
    type: "multiple_choice",
    difficulty: "medium",
    duration: "2min",
    title: "1-back Visual Memory",
    prompt: "Tap when the symbol matches the PREVIOUS one.",
    options: ["Match", "No Match"],
    correct_option_index: 0,
    explanation: "Basic n-back task engages working memory updating.",
    metrics_affected: ["workingMemory", "slowThinking"],
    weight: 1
  },
  {
    id: "N003",
    category: "working_memory",
    type: "multiple_choice",
    difficulty: "hard",
    duration: "2min",
    title: "2-back Visual Memory",
    prompt: "Tap when the symbol matches the one from TWO steps earlier.",
    options: ["Match", "No Match"],
    correct_option_index: 0,
    explanation: "2-back activates dorsolateral prefrontal cortex and enhances WM capacity.",
    metrics_affected: ["workingMemory", "slowThinking"],
    weight: 1
  },
  {
    id: "N004",
    category: "inhibition",
    type: "multiple_choice",
    difficulty: "medium",
    duration: "30s",
    title: "Go / No-Go – Motor Inhibition",
    prompt: "Tap on GREEN arrows. DO NOT tap on RED arrows.",
    options: ["Tap"],
    correct_option_index: 0,
    explanation: "Classic Go/No-Go test for inhibitory control.",
    metrics_affected: ["executiveControl", "fastThinking"],
    weight: 1
  },
  {
    id: "N005",
    category: "attention",
    type: "multiple_choice",
    difficulty: "medium",
    duration: "2min",
    title: "Visual Search – Target Detection",
    prompt: "A grid of letters appears. Tap when you see the target letter 'T' hidden among 'L's.",
    options: ["Found", "Not Found"],
    correct_option_index: 0,
    explanation: "Based on Treisman's feature-integration theory.",
    metrics_affected: ["attention", "focusStability"],
    weight: 1
  },
  {
    id: "N006",
    category: "cognitive_control",
    type: "multiple_choice",
    difficulty: "medium",
    duration: "2min",
    title: "Stroop Mini-Test",
    prompt: "Select the COLOR, not the WORD. Example: the word RED printed in BLUE → answer BLUE.",
    options: ["Red", "Blue", "Green", "Yellow"],
    correct_option_index: 1,
    explanation: "Stroop effect measures interference control.",
    metrics_affected: ["executiveControl", "slowThinking"],
    weight: 1
  },
  {
    id: "N007",
    category: "creative",
    type: "open_reflection",
    difficulty: "easy",
    duration: "2min",
    title: "Alternative Uses – Creativity Boost",
    prompt: "List as many unusual uses for a brick as possible in 60 seconds.",
    options: null,
    correct_option_index: null,
    explanation: "Divergent thinking task used widely in creativity research.",
    metrics_affected: ["creativity"],
    weight: 1
  },
  {
    id: "N008",
    category: "creative",
    type: "open_reflection",
    difficulty: "medium",
    duration: "2min",
    title: "Constraint Creativity",
    prompt: "Imagine you must advertise a product with ZERO budget. Generate 3 creative alternatives.",
    options: null,
    correct_option_index: null,
    explanation: "Creativity improves under constrained problem-solving.",
    metrics_affected: ["creativity", "clarityScore"],
    weight: 1
  },
  {
    id: "N009",
    category: "insight",
    type: "open_reflection",
    difficulty: "medium",
    duration: "2min",
    title: "Incubation Break – Insight Prime",
    prompt: "Write your current problem in one sentence. Then take 30s of simple tapping tasks before returning.",
    options: null,
    correct_option_index: null,
    explanation: "Insight often improves after mind-wandering or task switching.",
    metrics_affected: ["philosophicalReasoning", "creativity"],
    weight: 1
  },
  {
    id: "N010",
    category: "reflection",
    type: "open_reflection",
    difficulty: "medium",
    duration: "5min",
    title: "Evidence Counterbalance",
    prompt: "Write 3 pieces of evidence AGAINST your current belief about a decision.",
    options: null,
    correct_option_index: null,
    explanation: "Reduces confirmation bias, strengthens reasoning.",
    metrics_affected: ["slowThinking", "criticalThinkingScore"],
    weight: 1
  },
  {
    id: "N011",
    category: "philosophical",
    type: "open_reflection",
    difficulty: "hard",
    duration: "5min",
    title: "Value Alignment Reflection",
    prompt: "Choose a core value (autonomy, fairness, growth). Write how this value affects a decision you're facing.",
    options: null,
    correct_option_index: null,
    explanation: "Activates high-level abstract reasoning linked to long-term consistency.",
    metrics_affected: ["philosophicalReasoning", "slowThinking"],
    weight: 1
  },
  {
    id: "N012",
    category: "attention",
    type: "multiple_choice",
    difficulty: "medium",
    duration: "30s",
    title: "Rapid Categorization – Semantic Snap",
    prompt: "A word appears quickly. Choose whether it belongs to the category 'TOOLS'.",
    options: ["Yes", "No"],
    correct_option_index: 0,
    explanation: "Tests fast semantic access pathways.",
    metrics_affected: ["fastThinking", "attention"],
    weight: 1
  },
  {
    id: "N013",
    category: "working_memory",
    type: "multiple_choice",
    difficulty: "medium",
    duration: "2min",
    title: "Digit Span Light",
    prompt: "A sequence of numbers flashes (e.g. 3-7-1). Choose the correct sequence from options.",
    options: ["371", "317", "173"],
    correct_option_index: 0,
    explanation: "Short-term memory span task.",
    metrics_affected: ["workingMemory"],
    weight: 1
  },
  {
    id: "N014",
    category: "logic_puzzle",
    type: "multiple_choice",
    difficulty: "medium",
    duration: "2min",
    title: "Mini-Syllogism",
    prompt: "All A are B. Some B are not A. What can we infer?",
    options: [
      "A is a subset of B with extra elements.",
      "B is a subset of A.",
      "A and B are identical.",
      "No relationship is implied."
    ],
    correct_option_index: 0,
    explanation: "Basic deductive structure.",
    metrics_affected: ["reasoningAccuracy"],
    weight: 1
  },
  {
    id: "N015",
    category: "executive_control",
    type: "multiple_choice",
    difficulty: "medium",
    duration: "2min",
    title: "Task Switching – Cognitive Flexibility",
    prompt: "If the number shown is odd, tap 'A'. If even, tap 'B'. Numbers appear rapidly.",
    options: ["A", "B"],
    correct_option_index: 0,
    explanation: "Cognitive flexibility tasks activate prefrontal networks.",
    metrics_affected: ["executiveControl", "fastThinking"],
    weight: 1
  }
];
