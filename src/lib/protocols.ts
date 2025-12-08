export type ProtocolType = "reasoning" | "clarity" | "decision";
export type DurationOption = "30s" | "2min" | "5min";
export type MindsetOption = "scattered" | "focused" | "uncertain" | "sharp" | "overwhelmed";

export interface ProtocolStep {
  title: string;
  description: string;
  durationSeconds: number;
}

export interface Protocol {
  id: string;
  type: ProtocolType;
  durationOption: DurationOption;
  title: string;
  description: string;
  steps: ProtocolStep[];
}

export const protocols: Protocol[] = [
  // Reasoning Workout™ Protocols
  {
    id: "reasoning-30s",
    type: "reasoning",
    durationOption: "30s",
    title: "Logical Snap Drill",
    description: "Rapid fallacy detection and alternative hypothesis generation.",
    steps: [
      {
        title: "Spot the Fallacy",
        description: "A company doubled revenue after hiring a new CEO. Therefore, the CEO caused the growth. → Identify: correlation is not causation.",
        durationSeconds: 15,
      },
      {
        title: "Quick Check",
        description: "What alternative explanations might also be true? Consider market conditions, team changes, or timing factors.",
        durationSeconds: 15,
      },
    ],
  },
  {
    id: "reasoning-2min",
    type: "reasoning",
    durationOption: "2min",
    title: "Reasoning Foundations",
    description: "Distinguish facts from assumptions and evaluate plausibility systematically.",
    steps: [
      {
        title: "Fact vs Assumption",
        description: "In your current challenge: What is a verified fact? What is an assumption you're treating as fact?",
        durationSeconds: 35,
      },
      {
        title: "Plausibility Bet",
        description: "If you had to bet €1,000 on one explanation being correct, which would you choose? Why?",
        durationSeconds: 40,
      },
      {
        title: "Inversion Check",
        description: "What would need to be true for the opposite conclusion to make sense? Consider this perspective.",
        durationSeconds: 45,
      },
    ],
  },
  {
    id: "reasoning-5min",
    type: "reasoning",
    durationOption: "5min",
    title: "Deep Critical Thinking Drill",
    description: "Comprehensive analytical framework with Bayesian reasoning integration.",
    steps: [
      {
        title: "Identify Core Claim",
        description: "What is the central claim or belief you're evaluating? State it in one clear sentence.",
        durationSeconds: 50,
      },
      {
        title: "Evidence Decomposition",
        description: "Break the claim into three parts: What is the evidence? What is your interpretation? What assumptions are you making?",
        durationSeconds: 70,
      },
      {
        title: "Base Rate Check",
        description: "Before knowing anything specific about this situation, how probable was this outcome in general? What's the base rate?",
        durationSeconds: 60,
      },
      {
        title: "Belief Update",
        description: "How much does the new evidence actually shift your belief? Is it strong evidence or merely suggestive?",
        durationSeconds: 60,
      },
      {
        title: "Updated Position",
        description: "Summarize your updated belief in one sentence. What's your confidence level (low/medium/high)?",
        durationSeconds: 60,
      },
    ],
  },

  // Clarity Lab™ Protocols
  {
    id: "clarity-30s",
    type: "clarity",
    durationOption: "30s",
    title: "Cognitive Clean Cut",
    description: "Ruthless prioritization through single-goal focus.",
    steps: [
      {
        title: "Define the One Thing",
        description: "Write down (mentally) the ONE thing you're trying to achieve right now. Be specific.",
        durationSeconds: 15,
      },
      {
        title: "Eliminate Everything Else",
        description: "Remove everything that does not directly support that goal. Close tabs, defer tasks, simplify.",
        durationSeconds: 15,
      },
    ],
  },
  {
    id: "clarity-2min",
    type: "clarity",
    durationOption: "2min",
    title: "Conceptual Precision",
    description: "Decompose complex problems into actionable sub-components.",
    steps: [
      {
        title: "One-Sentence Definition",
        description: "Define the problem you're solving in exactly one sentence. No qualifiers, no hedging.",
        durationSeconds: 35,
      },
      {
        title: "Three Sub-Problems",
        description: "Break this problem into exactly 3 sub-problems. What are the distinct components?",
        durationSeconds: 45,
      },
      {
        title: "Biggest Uncertainty",
        description: "Which sub-problem has the highest uncertainty? This is where your attention should go first.",
        durationSeconds: 40,
      },
    ],
  },
  {
    id: "clarity-5min",
    type: "clarity",
    durationOption: "5min",
    title: "Structure Mastery",
    description: "Build complete mental models with clear constraints and leverage points.",
    steps: [
      {
        title: "Define Parameters",
        description: "Write out: Goal (what success looks like), Constraints (what you cannot change), Unknowns (what you need to learn).",
        durationSeconds: 60,
      },
      {
        title: "Non-Negotiables",
        description: "What are 2-3 things that absolutely must be true for any solution to work? These are your non-negotiables.",
        durationSeconds: 50,
      },
      {
        title: "Mental Model",
        description: "Build a simple if-then model: If A happens, then B. If not A, then C. Map out the decision tree.",
        durationSeconds: 60,
      },
      {
        title: "Identify the Lever",
        description: "What single insight, resource, or action would make everything else easier or irrelevant?",
        durationSeconds: 50,
      },
      {
        title: "Action Clarity",
        description: "Given this structure, what is your next physical action? Be specific: verb + object + context.",
        durationSeconds: 80,
      },
    ],
  },

  // Decision Studio™ Protocols
  {
    id: "decision-30s",
    type: "decision",
    durationOption: "30s",
    title: "Bias Snapshot",
    description: "Rapid cognitive bias detection for cleaner decision-making.",
    steps: [
      {
        title: "State the Decision",
        description: "What decision are you facing? State it in one clear sentence.",
        durationSeconds: 10,
      },
      {
        title: "Bias Check",
        description: "Which bias is most likely affecting you right now? Confirmation bias, loss aversion, sunk cost fallacy, or emotional overreaction?",
        durationSeconds: 20,
      },
    ],
  },
  {
    id: "decision-2min",
    type: "decision",
    durationOption: "2min",
    title: "Strategic Choice Engine",
    description: "Systematic option evaluation with risk-adjusted outcome analysis.",
    steps: [
      {
        title: "Three Options",
        description: "Define the 3 most realistic options. No fantasy scenarios—what could you actually do?",
        durationSeconds: 35,
      },
      {
        title: "Upside Analysis",
        description: "For each option: What is the best plausible upside? Be specific about the outcome.",
        durationSeconds: 35,
      },
      {
        title: "Downside Analysis",
        description: "For each option: What is the worst plausible downside? What would you lose?",
        durationSeconds: 35,
      },
      {
        title: "Risk-Adjusted Choice",
        description: "Which option has the best risk-adjusted outcome? Make your choice.",
        durationSeconds: 15,
      },
    ],
  },
  {
    id: "decision-5min",
    type: "decision",
    durationOption: "5min",
    title: "High-Impact Decision Flow",
    description: "Complete decision framework for consequential choices under uncertainty.",
    steps: [
      {
        title: "Decision + Timeframe",
        description: "Describe the decision and by when you need to make it. Is this urgent or just feeling urgent?",
        durationSeconds: 50,
      },
      {
        title: "Key Uncertainty",
        description: "What do you NOT know that matters most? What information gap is driving your hesitation?",
        durationSeconds: 50,
      },
      {
        title: "Expected Value Check",
        description: "Given the potential upside, downside, and their probabilities—is this distribution attractive?",
        durationSeconds: 60,
      },
      {
        title: "Reversibility Assessment",
        description: "Is this decision easily reversible? High reversibility = decide faster. Low reversibility = gather more data.",
        durationSeconds: 50,
      },
      {
        title: "Final Move",
        description: "Choose one: Act now with conviction, Delay strategically (set specific date), or Gather specific information (define exactly what).",
        durationSeconds: 50,
      },
      {
        title: "Commitment",
        description: "If acting: What is your first concrete action? If delaying/gathering: What is your trigger to revisit?",
        durationSeconds: 40,
      },
    ],
  },
];

export function getProtocol(type: ProtocolType, duration: DurationOption): Protocol | undefined {
  return protocols.find((p) => p.type === type && p.durationOption === duration);
}

export const mindsetOptions: { value: MindsetOption; label: string; description: string }[] = [
  { value: "scattered", label: "Scattered", description: "Mind jumping between topics" },
  { value: "focused", label: "Focused", description: "Ready to think deeply" },
  { value: "uncertain", label: "Uncertain", description: "Unclear on direction" },
  { value: "sharp", label: "Sharp", description: "High cognitive readiness" },
  { value: "overwhelmed", label: "Overwhelmed", description: "Too many inputs" },
];

export const durationOptions: { value: DurationOption; label: string; minutes: string }[] = [
  { value: "30s", label: "30 Seconds", minutes: "0:30" },
  { value: "2min", label: "2 Minutes", minutes: "2:00" },
  { value: "5min", label: "5 Minutes", minutes: "5:00" },
];

export const protocolTypeLabels: Record<ProtocolType, { title: string; subtitle: string }> = {
  reasoning: {
    title: "Reasoning Workout™",
    subtitle: "Train your analytical and critical thinking abilities.",
  },
  clarity: {
    title: "Clarity Lab™",
    subtitle: "Develop mental sharpness, conceptual clarity, and problem decomposition.",
  },
  decision: {
    title: "Decision Studio™",
    subtitle: "Upgrade your strategic decision-making under uncertainty.",
  },
};