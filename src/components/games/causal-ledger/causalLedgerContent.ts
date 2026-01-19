/**
 * CAUSAL LEDGER — Content Bank
 * 
 * S2-CT (Critical Thinking) training game.
 * Deliberate evaluation of causal claims under uncertainty.
 * 
 * Each scenario has:
 * - scenario: Neutral factual description
 * - claim: Causal statement to evaluate
 * - correctDecision: "supported" | "underspecified" | "flawed"
 * - act: 1 | 2 | 3 (difficulty tier)
 * - explanation: Brief post-hoc explanation for review
 */

export type Decision = "supported" | "underspecified" | "flawed";

export interface CausalScenario {
  id: string;
  scenario: string;
  claim: string;
  correctDecision: Decision;
  act: 1 | 2 | 3;
  explanation: string;
}

// ============================================
// ACT I — Clear Logical Flaws (Rounds 1-4)
// Correlation ≠ causation, obvious confounders
// ============================================

const ACT_I_SCENARIOS: CausalScenario[] = [
  {
    id: "a1-01",
    scenario: "A company introduced flexible working hours. Three months later, productivity increased by 12%.",
    claim: "Flexible working hours caused the productivity increase.",
    correctDecision: "underspecified",
    act: 1,
    explanation: "The claim lacks control for alternative explanations such as new hires, seasonal changes, or management initiatives.",
  },
  {
    id: "a1-02",
    scenario: "Countries with more ice cream sales per capita also report higher drowning rates.",
    claim: "Ice cream consumption causes drowning.",
    correctDecision: "flawed",
    act: 1,
    explanation: "Classic confounding: both are caused by hot weather, not by each other.",
  },
  {
    id: "a1-03",
    scenario: "A hospital reported that patients in private rooms recovered 20% faster than those in shared wards.",
    claim: "Private rooms accelerate patient recovery.",
    correctDecision: "underspecified",
    act: 1,
    explanation: "Selection bias: patients assigned to private rooms may have different conditions or insurance status.",
  },
  {
    id: "a1-04",
    scenario: "Students who eat breakfast daily score 15% higher on standardized tests.",
    claim: "Eating breakfast improves test performance.",
    correctDecision: "underspecified",
    act: 1,
    explanation: "Breakfast eating correlates with stable home environments, which may independently affect performance.",
  },
  {
    id: "a1-05",
    scenario: "A city installed more streetlights in high-crime areas. Crime rates dropped by 25% over the next year.",
    claim: "Streetlights reduced crime.",
    correctDecision: "underspecified",
    act: 1,
    explanation: "Other interventions (police presence, community programs) may have occurred simultaneously.",
  },
  {
    id: "a1-06",
    scenario: "People who own pets report 30% lower rates of depression than non-pet owners.",
    claim: "Owning pets prevents depression.",
    correctDecision: "underspecified",
    act: 1,
    explanation: "Reverse causation: people with depression may be less likely to adopt pets.",
  },
  {
    id: "a1-07",
    scenario: "Countries with higher chocolate consumption win more Nobel Prizes per capita.",
    claim: "Chocolate consumption leads to more Nobel Prizes.",
    correctDecision: "flawed",
    act: 1,
    explanation: "Spurious correlation. Both relate to national wealth and education investment, not to each other.",
  },
  {
    id: "a1-08",
    scenario: "After a company implemented open-plan offices, employee collaboration increased by 40%.",
    claim: "Open-plan offices boost collaboration.",
    correctDecision: "underspecified",
    act: 1,
    explanation: "Self-reported collaboration may be biased; the change may have coincided with other cultural shifts.",
  },
];

// ============================================
// ACT II — Missing Controls, Ambiguous Evidence (Rounds 5-8)
// Alternative explanations plausible
// ============================================

const ACT_II_SCENARIOS: CausalScenario[] = [
  {
    id: "a2-01",
    scenario: "A pharmaceutical trial showed that patients on Drug X had 35% lower blood pressure after 8 weeks. The trial was double-blind and placebo-controlled with 2,000 participants.",
    claim: "Drug X effectively lowers blood pressure.",
    correctDecision: "supported",
    act: 2,
    explanation: "Proper RCT methodology with adequate sample size supports the causal inference.",
  },
  {
    id: "a2-02",
    scenario: "After implementing a new curriculum, math scores in District A rose by 18%. Neighboring District B, which kept the old curriculum, saw scores rise by 14%.",
    claim: "The new curriculum improved math performance.",
    correctDecision: "underspecified",
    act: 2,
    explanation: "A 4% difference is modest. Without controlling for teacher quality, student demographics, and random variation, causation is uncertain.",
  },
  {
    id: "a2-03",
    scenario: "A study tracked 10,000 adults over 20 years. Those who meditated regularly had 28% lower rates of cardiovascular disease.",
    claim: "Meditation prevents cardiovascular disease.",
    correctDecision: "underspecified",
    act: 2,
    explanation: "Meditators may differ systematically in diet, exercise, and stress management, creating confounds.",
  },
  {
    id: "a2-04",
    scenario: "Employees who took the company's leadership training program were 45% more likely to be promoted within two years.",
    claim: "The leadership program accelerates career advancement.",
    correctDecision: "underspecified",
    act: 2,
    explanation: "Selection effect: employees chosen for or choosing the program may already be on promotion tracks.",
  },
  {
    id: "a2-05",
    scenario: "A randomized trial assigned 500 students to either receive tutoring or not. Tutored students scored 22% higher on final exams.",
    claim: "Tutoring improves exam performance.",
    correctDecision: "supported",
    act: 2,
    explanation: "Randomized assignment controls for confounders, supporting the causal claim.",
  },
  {
    id: "a2-06",
    scenario: "After a factory installed air filtration systems, worker sick days decreased by 40%. No other changes were reported.",
    claim: "Air filtration reduced worker illness.",
    correctDecision: "underspecified",
    act: 2,
    explanation: "Seasonal variation in illness and awareness effects (Hawthorne effect) could explain some of the reduction.",
  },
  {
    id: "a2-07",
    scenario: "A tech company saw a 60% drop in bugs after switching to pair programming. The change was implemented across all teams simultaneously.",
    claim: "Pair programming reduces software bugs.",
    correctDecision: "underspecified",
    act: 2,
    explanation: "Without a control group or phased rollout, other simultaneous changes (tools, processes) cannot be ruled out.",
  },
  {
    id: "a2-08",
    scenario: "In a controlled experiment, plants given classical music grew 15% taller than plants in silence. The study was replicated three times.",
    claim: "Classical music promotes plant growth.",
    correctDecision: "underspecified",
    act: 2,
    explanation: "Music speakers may generate vibrations or heat; the mechanism is unclear and requires isolation of variables.",
  },
];

// ============================================
// ACT III — Borderline Cases (Rounds 9-12)
// Epistemically fragile, requires careful judgment
// ============================================

const ACT_III_SCENARIOS: CausalScenario[] = [
  {
    id: "a3-01",
    scenario: "A vaccine trial with 30,000 participants showed 95% efficacy in preventing disease. The trial used randomized double-blind methodology and was independently verified.",
    claim: "The vaccine prevents the disease.",
    correctDecision: "supported",
    act: 3,
    explanation: "Large-scale RCT with replication and independent verification provides strong causal evidence.",
  },
  {
    id: "a3-02",
    scenario: "After a country banned smoking in restaurants, hospitalizations for heart attacks dropped 17% within the first year.",
    claim: "The smoking ban reduced heart attacks.",
    correctDecision: "underspecified",
    act: 3,
    explanation: "Plausible but needs comparison with control regions and accounting for concurrent health campaigns.",
  },
  {
    id: "a3-03",
    scenario: "A meta-analysis of 47 studies found that cognitive training games showed a small but consistent effect on working memory (d = 0.23).",
    claim: "Cognitive training games improve working memory.",
    correctDecision: "supported",
    act: 3,
    explanation: "Meta-analyses aggregating multiple studies provide robust evidence despite small individual effect sizes.",
  },
  {
    id: "a3-04",
    scenario: "Countries that implemented universal basic income pilots saw poverty rates decrease, but economic growth also slowed slightly.",
    claim: "Universal basic income reduces poverty.",
    correctDecision: "underspecified",
    act: 3,
    explanation: "Poverty reduction observed, but without long-term data and broader economic analysis, full causal picture is incomplete.",
  },
  {
    id: "a3-05",
    scenario: "A natural experiment occurred when a factory closed unexpectedly. Nearby residents' air quality improved and respiratory illness rates dropped 30%.",
    claim: "The factory's emissions caused respiratory illness.",
    correctDecision: "supported",
    act: 3,
    explanation: "Natural experiments with clear intervention points can support causal inference when confounders are limited.",
  },
  {
    id: "a3-06",
    scenario: "Athletes who visualized their performance before competitions performed 12% better than those who didn't. Both groups trained equally.",
    claim: "Visualization improves athletic performance.",
    correctDecision: "underspecified",
    act: 3,
    explanation: "Self-selection and expectation effects (placebo) may confound results. Mechanism needs clarification.",
  },
  {
    id: "a3-07",
    scenario: "A longitudinal study found that children who learned musical instruments scored higher on math tests throughout their schooling.",
    claim: "Learning music improves mathematical ability.",
    correctDecision: "underspecified",
    act: 3,
    explanation: "Families who provide music lessons may provide other educational advantages. Transfer effects are debated.",
  },
  {
    id: "a3-08",
    scenario: "After implementing mandatory seat belt laws, traffic fatalities dropped 40% over five years. Vehicle safety technology also improved during this period.",
    claim: "Seat belt laws reduced traffic fatalities.",
    correctDecision: "underspecified",
    act: 3,
    explanation: "Concurrent improvements in vehicle safety make it difficult to isolate the law's specific contribution.",
  },
];

// ============================================
// GAME CONFIGURATION
// ============================================

export const CAUSAL_LEDGER_CONFIG = {
  rounds: 12,
  actsPerSession: 3,
  roundsPerAct: 4,
  recommendedTimePerRound: 35000, // 35 seconds soft guidance
  softTimeGuidanceMs: 35000,
};

// ============================================
// SESSION GENERATION
// ============================================

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate a balanced 12-round session:
 * - 4 from Act I
 * - 4 from Act II
 * - 4 from Act III
 */
export function generateSessionScenarios(): CausalScenario[] {
  const act1 = shuffle(ACT_I_SCENARIOS).slice(0, 4);
  const act2 = shuffle(ACT_II_SCENARIOS).slice(0, 4);
  const act3 = shuffle(ACT_III_SCENARIOS).slice(0, 4);
  
  return [...act1, ...act2, ...act3];
}

// Decision labels for UI
export const DECISION_LABELS: Record<Decision, { label: string; description: string }> = {
  supported: { 
    label: "Supported", 
    description: "Evidence adequately supports the causal claim" 
  },
  underspecified: { 
    label: "Underspecified", 
    description: "Claim plausible but evidence insufficient" 
  },
  flawed: { 
    label: "Flawed Reasoning", 
    description: "Logical error or obvious confounding" 
  },
};
