// ============= Training Data Models =============

export type TrainingMode = "fast" | "slow";
export type TrainingDifficulty = "beginner" | "intermediate" | "advanced";
export type TrainingDuration = "30s" | "2min" | "5min";
export type StepType = "info" | "multiple_choice" | "open_reflection";

export interface TrainingStep {
  id: string;
  trainingId: string;
  orderIndex: number;
  type: StepType;
  title: string;
  instruction: string;
  timeHintSeconds?: number;
  options?: string[];
  correctOptionIndex?: number;
  reflectionPlaceholder?: string;
}

export interface Training {
  id: string;
  mode: TrainingMode;
  title: string;
  subtitle: string;
  description: string;
  estimatedDuration: TrainingDuration;
  difficulty: TrainingDifficulty;
  steps: TrainingStep[];
}

export interface TrainingResult {
  id: string;
  trainingId: string;
  mode: TrainingMode;
  scoreContribution: number;
  completedAt: string;
  responses: TrainingResponse[];
}

export interface TrainingResponse {
  stepId: string;
  selectedOptionIndex?: number;
  reflectionText?: string;
  isCorrect?: boolean;
}

// ============= Seed Data =============

export const trainings: Training[] = [
  // FAST THINKING TRAINING
  {
    id: "fast-drill-1",
    mode: "fast",
    title: "Fast Thinking Drill 1",
    subtitle: "System 1 – Intuition & Snap Judgements",
    description: "A short session to train rapid pattern recognition and intuitive judgment under time pressure.",
    estimatedDuration: "2min",
    difficulty: "beginner",
    steps: [
      {
        id: "fast-1-step-1",
        trainingId: "fast-drill-1",
        orderIndex: 0,
        type: "info",
        title: "Fast Thinking Primer",
        instruction: "Fast thinking (System 1) is quick, automatic, and intuitive. In this drill you'll answer quickly without overthinking. Focus on speed and gut feeling.",
        timeHintSeconds: 20,
      },
      {
        id: "fast-1-step-2",
        trainingId: "fast-drill-1",
        orderIndex: 1,
        type: "multiple_choice",
        title: "Odd One Out",
        instruction: "Pick the item that does NOT belong with the others. Answer quickly.",
        options: ["Dog", "Cat", "Horse", "Table"],
        correctOptionIndex: 3,
        timeHintSeconds: 10,
      },
      {
        id: "fast-1-step-3",
        trainingId: "fast-drill-1",
        orderIndex: 2,
        type: "multiple_choice",
        title: "Quick Probability Intuition",
        instruction: "Which event is more likely, intuitively?",
        options: [
          "Flip a fair coin and get Heads 3 times in a row",
          "Flip a fair coin and get Heads 10 times in a row",
        ],
        correctOptionIndex: 0,
        timeHintSeconds: 10,
      },
      {
        id: "fast-1-step-4",
        trainingId: "fast-drill-1",
        orderIndex: 3,
        type: "multiple_choice",
        title: "Bias Snap Check",
        instruction: "A company doubled its revenue after hiring a new CEO. Which thought is more rigorous?",
        options: [
          "The CEO definitely caused the growth.",
          "The CEO may have helped, but we need to consider other factors.",
        ],
        correctOptionIndex: 1,
        timeHintSeconds: 12,
      },
      {
        id: "fast-1-step-5",
        trainingId: "fast-drill-1",
        orderIndex: 4,
        type: "info",
        title: "Fast Thinking Reflection",
        instruction: "Fast thinking is useful when the cost of a quick mistake is low and the environment is familiar. Use it deliberately, not by default.",
        timeHintSeconds: 20,
      },
    ],
  },
  // SLOW THINKING TRAINING
  {
    id: "slow-drill-1",
    mode: "slow",
    title: "Slow Thinking Drill 1",
    subtitle: "System 2 – Structured Reasoning",
    description: "A short session to practice breaking down a problem, separating facts from assumptions, and thinking deliberately.",
    estimatedDuration: "5min",
    difficulty: "beginner",
    steps: [
      {
        id: "slow-1-step-1",
        trainingId: "slow-drill-1",
        orderIndex: 0,
        type: "info",
        title: "Slow Thinking Primer",
        instruction: "Slow thinking (System 2) is deliberate, structured, and effortful. In this drill you will take a problem and reason through it step by step. Take your time.",
        timeHintSeconds: 30,
      },
      {
        id: "slow-1-step-2",
        trainingId: "slow-drill-1",
        orderIndex: 1,
        type: "open_reflection",
        title: "Define the Problem",
        instruction: "Write one sentence that describes a real decision or problem you're facing this week. Be specific.",
        reflectionPlaceholder: "E.g. Whether to accept a new job offer...",
        timeHintSeconds: 60,
      },
      {
        id: "slow-1-step-3",
        trainingId: "slow-drill-1",
        orderIndex: 2,
        type: "open_reflection",
        title: "Facts vs Assumptions",
        instruction: "List the key facts you know for sure, and the key assumptions you're making. Use two short lists: Facts vs Assumptions.",
        reflectionPlaceholder: "Facts: ...\nAssumptions: ...",
        timeHintSeconds: 90,
      },
      {
        id: "slow-1-step-4",
        trainingId: "slow-drill-1",
        orderIndex: 3,
        type: "open_reflection",
        title: "Options & Trade-offs",
        instruction: "List 2–3 realistic options. For each, note one upside and one downside. Don't aim for perfection, aim for clarity.",
        reflectionPlaceholder: "Option A: ... Upside: ... Downside: ...",
        timeHintSeconds: 120,
      },
      {
        id: "slow-1-step-5",
        trainingId: "slow-drill-1",
        orderIndex: 4,
        type: "open_reflection",
        title: "Bias Check & Slow Conclusion",
        instruction: "Ask yourself: which bias might influence me here (e.g., loss aversion, sunk cost, confirmation bias)? Then write your best, slow-thinking conclusion.",
        reflectionPlaceholder: "Possible bias: ...\nConclusion: ...",
        timeHintSeconds: 90,
      },
    ],
  },
];

// ============= Helper Functions =============

export function getTrainingsByMode(mode: TrainingMode): Training[] {
  return trainings.filter((t) => t.mode === mode);
}

export function getTrainingById(id: string): Training | undefined {
  return trainings.find((t) => t.id === id);
}

export function calculateFastThinkingScore(responses: TrainingResponse[], training: Training): number {
  const mcSteps = training.steps.filter((s) => s.type === "multiple_choice");
  if (mcSteps.length === 0) return 0;
  
  let correct = 0;
  mcSteps.forEach((step) => {
    const response = responses.find((r) => r.stepId === step.id);
    if (response?.selectedOptionIndex === step.correctOptionIndex) {
      correct++;
    }
  });
  
  return Math.round((correct / mcSteps.length) * 100);
}

export function calculateSlowThinkingScore(responses: TrainingResponse[], training: Training): number {
  const reflectionSteps = training.steps.filter((s) => s.type === "open_reflection");
  if (reflectionSteps.length === 0) return 0;
  
  let filled = 0;
  reflectionSteps.forEach((step) => {
    const response = responses.find((r) => r.stepId === step.id);
    if (response?.reflectionText && response.reflectionText.trim().length > 10) {
      filled++;
    }
  });
  
  const ratio = filled / reflectionSteps.length;
  if (ratio === 1) return 100;
  if (ratio >= 0.75) return 75;
  if (ratio >= 0.5) return 50;
  return 0;
}

export function getDifficultyLabel(difficulty: TrainingDifficulty): string {
  switch (difficulty) {
    case "beginner": return "Beginner";
    case "intermediate": return "Intermediate";
    case "advanced": return "Advanced";
  }
}

export function getDurationLabel(duration: TrainingDuration): string {
  switch (duration) {
    case "30s": return "30 sec";
    case "2min": return "2 min";
    case "5min": return "5 min";
  }
}
