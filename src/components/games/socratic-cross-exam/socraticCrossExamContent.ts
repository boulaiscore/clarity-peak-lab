/**
 * SOCRATIC CROSS-EXAM — Content Bank
 * 
 * S2-CT (Critical Thinking) training game.
 * Trains deliberate reasoning through elenchus and maieutics.
 * 
 * Each round has:
 * - claim: The headline assertion
 * - premises: 3-5 supporting statements (P1...P5)
 * - conclusion: The derived conclusion
 * - assumptions: 8 hidden assumptions (A1...A8)
 * - correctAssumptions: 2 load-bearing assumptions
 * - crossExamQuestion: Socratic question with 4 options
 * - contradictionPairs: 6 candidate pairs with minimal marked
 */

export interface SocraticPremise {
  id: string;
  text: string;
}

export interface SocraticAssumption {
  id: string;
  text: string;
  isLoadBearing: boolean;
  isDecorative?: boolean; // Flagged as decorative (penalty if selected)
}

export interface CrossExamQuestion {
  type: "consistency" | "implication";
  question: string;
  options: string[];
  correctIndex: number;
}

export interface ContradictionPair {
  id: string;
  type: "premise-premise" | "premise-assumption" | "assumption-assumption";
  pair: [string, string]; // References to P1, P2, A1, A2, etc.
  label: string; // Human-readable label
  isMinimal: boolean;
  isValid: boolean; // Is it actually a contradiction?
}

export interface SocraticRound {
  id: string;
  claim: string;
  premises: SocraticPremise[];
  conclusion: string;
  assumptions: SocraticAssumption[];
  correctAssumptions: [string, string]; // IDs of the 2 load-bearing assumptions
  crossExamQuestion: CrossExamQuestion;
  contradictionPairs: ContradictionPair[];
  minimalPairId: string;
  domain: "business" | "ethics" | "productivity" | "policy" | "tech" | "learning";
  socraticReviewQuestions: string[]; // 2-3 Socratic questions for review
}

// ============================================
// CONTENT BANK — 25 Rounds
// ============================================

export const SOCRATIC_ROUNDS: SocraticRound[] = [
  // ROUND 1 — Business
  {
    id: "sr-01",
    claim: "Remote work always improves productivity.",
    premises: [
      { id: "P1", text: "Employees report higher job satisfaction when working remotely." },
      { id: "P2", text: "Studies show remote workers log more hours than office workers." },
      { id: "P3", text: "Companies that adopted remote work saw revenue increases." },
      { id: "P4", text: "Commute time savings can be redirected to work tasks." },
    ],
    conclusion: "Therefore, remote work universally enhances productivity.",
    assumptions: [
      { id: "A1", text: "Job satisfaction directly translates to productivity.", isLoadBearing: true },
      { id: "A2", text: "More hours worked means more productive output.", isLoadBearing: true },
      { id: "A3", text: "Revenue increases are caused by remote work, not other factors.", isLoadBearing: false },
      { id: "A4", text: "All job types benefit equally from remote work.", isLoadBearing: false },
      { id: "A5", text: "Employees accurately self-report their hours.", isLoadBearing: false },
      { id: "A6", text: "Commute time saved is actually used for work.", isLoadBearing: false },
      { id: "A7", text: "Technology infrastructure is equally available to all.", isLoadBearing: false, isDecorative: true },
      { id: "A8", text: "Remote work eliminates all workplace distractions.", isLoadBearing: false, isDecorative: true },
    ],
    correctAssumptions: ["A1", "A2"],
    crossExamQuestion: {
      type: "consistency",
      question: "If employees log more hours (P2) but those hours are not productive, can P2 and A2 both hold?",
      options: [
        "Yes, hours and productivity are independent",
        "No, A2 assumes hours equal output, which P2 does not guarantee",
        "Yes, if employees are multitasking",
        "No, but only in certain industries",
      ],
      correctIndex: 1,
    },
    contradictionPairs: [
      { id: "cp1", type: "premise-assumption", pair: ["P2", "A2"], label: "P2 ↔ A2", isMinimal: true, isValid: true },
      { id: "cp2", type: "premise-premise", pair: ["P1", "P3"], label: "P1 ↔ P3", isMinimal: false, isValid: false },
      { id: "cp3", type: "assumption-assumption", pair: ["A1", "A4"], label: "A1 ↔ A4", isMinimal: false, isValid: true },
      { id: "cp4", type: "premise-assumption", pair: ["P3", "A3"], label: "P3 ↔ A3", isMinimal: false, isValid: true },
      { id: "cp5", type: "premise-assumption", pair: ["P4", "A6"], label: "P4 ↔ A6", isMinimal: false, isValid: true },
      { id: "cp6", type: "assumption-assumption", pair: ["A7", "A8"], label: "A7 ↔ A8", isMinimal: false, isValid: false },
    ],
    minimalPairId: "cp1",
    domain: "business",
    socraticReviewQuestions: [
      "If A2 were false, which premise becomes unsupported first?",
      "Can P2 remain true if productivity is measured by output, not hours?",
      "Which assumption is doing the most work to connect P1 → C?",
    ],
  },
  
  // ROUND 2 — Policy
  {
    id: "sr-02",
    claim: "Raising minimum wage will reduce poverty.",
    premises: [
      { id: "P1", text: "Higher wages mean more income for low-wage workers." },
      { id: "P2", text: "More income reduces financial hardship." },
      { id: "P3", text: "Countries with higher minimum wages have lower poverty rates." },
    ],
    conclusion: "Therefore, raising minimum wage directly reduces poverty.",
    assumptions: [
      { id: "A1", text: "Employment levels remain stable after wage increases.", isLoadBearing: true },
      { id: "A2", text: "Prices don't rise to offset wage increases.", isLoadBearing: true },
      { id: "A3", text: "All low-wage workers work enough hours to benefit.", isLoadBearing: false },
      { id: "A4", text: "Correlation in P3 implies causation.", isLoadBearing: false },
      { id: "A5", text: "Poverty is primarily income-based.", isLoadBearing: false },
      { id: "A6", text: "Employers don't reduce other benefits to compensate.", isLoadBearing: false },
      { id: "A7", text: "Informal employment is negligible.", isLoadBearing: false, isDecorative: true },
      { id: "A8", text: "All industries can afford the wage increase equally.", isLoadBearing: false, isDecorative: true },
    ],
    correctAssumptions: ["A1", "A2"],
    crossExamQuestion: {
      type: "implication",
      question: "If A1 is false (employment drops after wage hikes), which premise collapses first?",
      options: [
        "P1 — workers must be employed to earn higher wages",
        "P2 — financial hardship depends on employment",
        "P3 — correlation with poverty rates",
        "None — the argument still holds",
      ],
      correctIndex: 0,
    },
    contradictionPairs: [
      { id: "cp1", type: "premise-assumption", pair: ["P1", "A1"], label: "P1 ↔ A1", isMinimal: true, isValid: true },
      { id: "cp2", type: "premise-assumption", pair: ["P2", "A2"], label: "P2 ↔ A2", isMinimal: false, isValid: true },
      { id: "cp3", type: "premise-assumption", pair: ["P3", "A4"], label: "P3 ↔ A4", isMinimal: false, isValid: true },
      { id: "cp4", type: "assumption-assumption", pair: ["A1", "A3"], label: "A1 ↔ A3", isMinimal: false, isValid: false },
      { id: "cp5", type: "premise-premise", pair: ["P1", "P2"], label: "P1 ↔ P2", isMinimal: false, isValid: false },
      { id: "cp6", type: "assumption-assumption", pair: ["A5", "A6"], label: "A5 ↔ A6", isMinimal: false, isValid: false },
    ],
    minimalPairId: "cp1",
    domain: "policy",
    socraticReviewQuestions: [
      "If employers cut jobs in response, does P1 still support the conclusion?",
      "Which assumption bridges the gap between individual income and systemic poverty?",
      "Can the correlation in P3 be explained by confounding factors?",
    ],
  },
  
  // ROUND 3 — Tech
  {
    id: "sr-03",
    claim: "AI will replace most human jobs within 20 years.",
    premises: [
      { id: "P1", text: "AI systems are becoming increasingly capable at cognitive tasks." },
      { id: "P2", text: "Automation has historically displaced workers in manufacturing." },
      { id: "P3", text: "Companies are investing heavily in AI to reduce labor costs." },
      { id: "P4", text: "AI can work 24/7 without fatigue or benefits." },
    ],
    conclusion: "Therefore, AI will replace the majority of human jobs.",
    assumptions: [
      { id: "A1", text: "Cognitive capability translates to job replacement.", isLoadBearing: true },
      { id: "A2", text: "Historical patterns of automation will repeat.", isLoadBearing: true },
      { id: "A3", text: "New jobs created by AI won't offset losses.", isLoadBearing: false },
      { id: "A4", text: "All job types are equally automatable.", isLoadBearing: false },
      { id: "A5", text: "Regulatory barriers won't slow adoption.", isLoadBearing: false },
      { id: "A6", text: "Social and emotional labor can be automated.", isLoadBearing: false },
      { id: "A7", text: "AI development will continue at current pace.", isLoadBearing: false, isDecorative: true },
      { id: "A8", text: "Workers won't adapt or reskill.", isLoadBearing: false, isDecorative: true },
    ],
    correctAssumptions: ["A1", "A2"],
    crossExamQuestion: {
      type: "consistency",
      question: "Can P2 (historical displacement) and A3 (no offsetting jobs) both be true given that new industries emerged after past automation?",
      options: [
        "Yes, this time is fundamentally different",
        "No, historical patterns suggest job creation follows displacement",
        "Yes, if AI is more comprehensive than past automation",
        "It depends on the timeframe considered",
      ],
      correctIndex: 1,
    },
    contradictionPairs: [
      { id: "cp1", type: "premise-assumption", pair: ["P2", "A3"], label: "P2 ↔ A3", isMinimal: true, isValid: true },
      { id: "cp2", type: "premise-assumption", pair: ["P1", "A1"], label: "P1 ↔ A1", isMinimal: false, isValid: true },
      { id: "cp3", type: "assumption-assumption", pair: ["A2", "A3"], label: "A2 ↔ A3", isMinimal: false, isValid: true },
      { id: "cp4", type: "premise-assumption", pair: ["P4", "A6"], label: "P4 ↔ A6", isMinimal: false, isValid: false },
      { id: "cp5", type: "premise-premise", pair: ["P1", "P2"], label: "P1 ↔ P2", isMinimal: false, isValid: false },
      { id: "cp6", type: "assumption-assumption", pair: ["A4", "A8"], label: "A4 ↔ A8", isMinimal: false, isValid: false },
    ],
    minimalPairId: "cp1",
    domain: "tech",
    socraticReviewQuestions: [
      "If the historical pattern includes job creation, why assume A3 holds?",
      "Which assumption is most vulnerable to evidence about creative professions?",
      "Can P1 be true without implying job replacement?",
    ],
  },
  
  // ROUND 4 — Ethics
  {
    id: "sr-04",
    claim: "Wealthy individuals have a moral obligation to donate most of their wealth.",
    premises: [
      { id: "P1", text: "Extreme wealth disparity causes suffering." },
      { id: "P2", text: "Those with resources can alleviate suffering at minimal personal cost." },
      { id: "P3", text: "Moral agents should reduce suffering when able." },
    ],
    conclusion: "Therefore, the wealthy are morally obligated to give away most of their wealth.",
    assumptions: [
      { id: "A1", text: "Minimal personal cost means the sacrifice is negligible.", isLoadBearing: true },
      { id: "A2", text: "Donations effectively reduce suffering.", isLoadBearing: true },
      { id: "A3", text: "Wealth was acquired through morally neutral means.", isLoadBearing: false },
      { id: "A4", text: "Private charity is more effective than systemic change.", isLoadBearing: false },
      { id: "A5", text: "Moral obligations override property rights.", isLoadBearing: false },
      { id: "A6", text: "The wealthy can identify the best causes.", isLoadBearing: false },
      { id: "A7", text: "No negative consequences from large-scale redistribution.", isLoadBearing: false, isDecorative: true },
      { id: "A8", text: "All wealth above a threshold is excess.", isLoadBearing: false, isDecorative: true },
    ],
    correctAssumptions: ["A1", "A2"],
    crossExamQuestion: {
      type: "implication",
      question: "If A2 is false (donations don't effectively reduce suffering), which premise loses its force?",
      options: [
        "P1 — disparity still causes suffering",
        "P2 — the 'alleviate suffering' clause fails",
        "P3 — the moral imperative remains",
        "None — the obligation stands regardless of effectiveness",
      ],
      correctIndex: 1,
    },
    contradictionPairs: [
      { id: "cp1", type: "premise-assumption", pair: ["P2", "A2"], label: "P2 ↔ A2", isMinimal: true, isValid: true },
      { id: "cp2", type: "premise-assumption", pair: ["P2", "A1"], label: "P2 ↔ A1", isMinimal: false, isValid: true },
      { id: "cp3", type: "assumption-assumption", pair: ["A4", "A7"], label: "A4 ↔ A7", isMinimal: false, isValid: false },
      { id: "cp4", type: "premise-premise", pair: ["P1", "P3"], label: "P1 ↔ P3", isMinimal: false, isValid: false },
      { id: "cp5", type: "premise-assumption", pair: ["P3", "A5"], label: "P3 ↔ A5", isMinimal: false, isValid: true },
      { id: "cp6", type: "assumption-assumption", pair: ["A3", "A8"], label: "A3 ↔ A8", isMinimal: false, isValid: false },
    ],
    minimalPairId: "cp1",
    domain: "ethics",
    socraticReviewQuestions: [
      "If donations often fail to reach those in need, does P2 still justify the conclusion?",
      "Which assumption connects individual action to systemic outcomes?",
      "Can 'most of their wealth' be justified if A1 is false?",
    ],
  },
  
  // ROUND 5 — Learning
  {
    id: "sr-05",
    claim: "Multitasking improves learning efficiency.",
    premises: [
      { id: "P1", text: "Students who multitask report completing more assignments." },
      { id: "P2", text: "Multitasking allows parallel processing of information." },
      { id: "P3", text: "Successful professionals often juggle multiple projects." },
    ],
    conclusion: "Therefore, multitasking enhances learning outcomes.",
    assumptions: [
      { id: "A1", text: "Completing more assignments equals better learning.", isLoadBearing: true },
      { id: "A2", text: "Human cognition can effectively parallel process.", isLoadBearing: true },
      { id: "A3", text: "Self-reported completion rates are accurate.", isLoadBearing: false },
      { id: "A4", text: "Professional success correlates with learning efficiency.", isLoadBearing: false },
      { id: "A5", text: "Quality of work is maintained during multitasking.", isLoadBearing: false },
      { id: "A6", text: "All tasks are equally suitable for multitasking.", isLoadBearing: false },
      { id: "A7", text: "Task-switching costs are negligible.", isLoadBearing: false, isDecorative: true },
      { id: "A8", text: "Attention can be equally divided.", isLoadBearing: false, isDecorative: true },
    ],
    correctAssumptions: ["A1", "A2"],
    crossExamQuestion: {
      type: "consistency",
      question: "If A2 is false (humans cannot parallel process cognitively), can P2 support the conclusion?",
      options: [
        "Yes, P2 describes behavior, not cognitive capacity",
        "No, P2's claim about parallel processing becomes meaningless",
        "Yes, if multitasking means rapid switching",
        "No, but P1 and P3 still support the conclusion",
      ],
      correctIndex: 1,
    },
    contradictionPairs: [
      { id: "cp1", type: "premise-assumption", pair: ["P2", "A2"], label: "P2 ↔ A2", isMinimal: true, isValid: true },
      { id: "cp2", type: "premise-assumption", pair: ["P1", "A1"], label: "P1 ↔ A1", isMinimal: false, isValid: true },
      { id: "cp3", type: "premise-assumption", pair: ["P1", "A3"], label: "P1 ↔ A3", isMinimal: false, isValid: true },
      { id: "cp4", type: "assumption-assumption", pair: ["A2", "A7"], label: "A2 ↔ A7", isMinimal: false, isValid: true },
      { id: "cp5", type: "premise-premise", pair: ["P2", "P3"], label: "P2 ↔ P3", isMinimal: false, isValid: false },
      { id: "cp6", type: "assumption-assumption", pair: ["A5", "A6"], label: "A5 ↔ A6", isMinimal: false, isValid: false },
    ],
    minimalPairId: "cp1",
    domain: "learning",
    socraticReviewQuestions: [
      "If humans actually task-switch rather than parallel process, does P2 become misleading?",
      "Which assumption would neuroscience research most directly challenge?",
      "Can quantity of assignments substitute for depth of learning?",
    ],
  },
  
  // ROUND 6 — Productivity
  {
    id: "sr-06",
    claim: "Early risers are more successful than night owls.",
    premises: [
      { id: "P1", text: "CEOs and executives commonly wake before 6 AM." },
      { id: "P2", text: "Morning hours offer fewer distractions." },
      { id: "P3", text: "Early risers report higher energy levels throughout the day." },
      { id: "P4", text: "Business culture rewards availability during standard hours." },
    ],
    conclusion: "Therefore, waking early causes greater success.",
    assumptions: [
      { id: "A1", text: "Executive schedules reflect optimal productivity, not just convention.", isLoadBearing: true },
      { id: "A2", text: "Self-reported energy levels translate to actual performance.", isLoadBearing: true },
      { id: "A3", text: "Success is defined by corporate advancement.", isLoadBearing: false },
      { id: "A4", text: "Chronotype is changeable without performance cost.", isLoadBearing: false },
      { id: "A5", text: "Fewer distractions always improve work quality.", isLoadBearing: false },
      { id: "A6", text: "Night owls cannot achieve comparable results in evening hours.", isLoadBearing: false },
      { id: "A7", text: "Sleep quality is equal regardless of schedule.", isLoadBearing: false, isDecorative: true },
      { id: "A8", text: "Cultural norms about 'morning people' are universally valid.", isLoadBearing: false, isDecorative: true },
    ],
    correctAssumptions: ["A1", "A2"],
    crossExamQuestion: {
      type: "implication",
      question: "If A4 is false (forcing a new schedule reduces performance), which premise weakens most?",
      options: [
        "P1 — executive behavior may be self-selected, not universally optimal",
        "P2 — distractions exist at all hours",
        "P3 — energy levels depend on natural chronotype",
        "P4 — business culture is the real variable",
      ],
      correctIndex: 2,
    },
    contradictionPairs: [
      { id: "cp1", type: "premise-assumption", pair: ["P3", "A2"], label: "P3 ↔ A2", isMinimal: true, isValid: true },
      { id: "cp2", type: "premise-assumption", pair: ["P1", "A1"], label: "P1 ↔ A1", isMinimal: false, isValid: true },
      { id: "cp3", type: "assumption-assumption", pair: ["A4", "A7"], label: "A4 ↔ A7", isMinimal: false, isValid: true },
      { id: "cp4", type: "premise-assumption", pair: ["P4", "A3"], label: "P4 ↔ A3", isMinimal: false, isValid: true },
      { id: "cp5", type: "premise-premise", pair: ["P1", "P4"], label: "P1 ↔ P4", isMinimal: false, isValid: false },
      { id: "cp6", type: "assumption-assumption", pair: ["A5", "A6"], label: "A5 ↔ A6", isMinimal: false, isValid: false },
    ],
    minimalPairId: "cp1",
    domain: "productivity",
    socraticReviewQuestions: [
      "If energy levels are subjective reports, how reliable is P3?",
      "Which assumption conflates correlation with causation most directly?",
      "Can success be redefined to include night-optimized professions?",
    ],
  },
  
  // ROUND 7 — Policy
  {
    id: "sr-07",
    claim: "Universal basic income will make people lazy.",
    premises: [
      { id: "P1", text: "When basic needs are met, motivation to work decreases." },
      { id: "P2", text: "Lottery winners often quit their jobs." },
      { id: "P3", text: "Welfare programs have historically reduced work participation." },
    ],
    conclusion: "Therefore, UBI will result in widespread laziness.",
    assumptions: [
      { id: "A1", text: "UBI amounts would be sufficient to eliminate work motivation.", isLoadBearing: true },
      { id: "A2", text: "Lottery winners are representative of typical UBI recipients.", isLoadBearing: true },
      { id: "A3", text: "Work motivation is primarily extrinsic (money-driven).", isLoadBearing: false },
      { id: "A4", text: "Historical welfare comparisons apply to universal programs.", isLoadBearing: false },
      { id: "A5", text: "Non-market contributions (caregiving, volunteering) are 'laziness'.", isLoadBearing: false },
      { id: "A6", text: "People have no intrinsic drive to contribute.", isLoadBearing: false },
      { id: "A7", text: "Part-time work and entrepreneurship don't count.", isLoadBearing: false, isDecorative: true },
      { id: "A8", text: "Current employment patterns are optimal.", isLoadBearing: false, isDecorative: true },
    ],
    correctAssumptions: ["A1", "A2"],
    crossExamQuestion: {
      type: "consistency",
      question: "If lottery winners receive far more than proposed UBI amounts, is the comparison in P2 valid under A2?",
      options: [
        "Yes, the psychological effect is similar",
        "No, the amounts differ dramatically, making A2 questionable",
        "Yes, both represent unearned income",
        "Only if controlling for existing wealth",
      ],
      correctIndex: 1,
    },
    contradictionPairs: [
      { id: "cp1", type: "premise-assumption", pair: ["P2", "A2"], label: "P2 ↔ A2", isMinimal: true, isValid: true },
      { id: "cp2", type: "premise-assumption", pair: ["P1", "A1"], label: "P1 ↔ A1", isMinimal: false, isValid: true },
      { id: "cp3", type: "premise-assumption", pair: ["P1", "A3"], label: "P1 ↔ A3", isMinimal: false, isValid: true },
      { id: "cp4", type: "assumption-assumption", pair: ["A3", "A6"], label: "A3 ↔ A6", isMinimal: false, isValid: true },
      { id: "cp5", type: "premise-premise", pair: ["P2", "P3"], label: "P2 ↔ P3", isMinimal: false, isValid: false },
      { id: "cp6", type: "assumption-assumption", pair: ["A5", "A7"], label: "A5 ↔ A7", isMinimal: false, isValid: false },
    ],
    minimalPairId: "cp1",
    domain: "policy",
    socraticReviewQuestions: [
      "If lottery winnings are 100x larger than UBI, can P2 support the conclusion?",
      "Which assumption about human motivation is most easily falsified?",
      "Does 'laziness' adequately describe reduced formal employment?",
    ],
  },
  
  // ROUND 8 — Tech
  {
    id: "sr-08",
    claim: "Social media causes depression in teenagers.",
    premises: [
      { id: "P1", text: "Teen depression rates have risen alongside social media adoption." },
      { id: "P2", text: "Teenagers who use social media more report lower well-being." },
      { id: "P3", text: "Social comparison on platforms creates negative self-image." },
    ],
    conclusion: "Therefore, social media directly causes teenage depression.",
    assumptions: [
      { id: "A1", text: "Correlation in P1 implies causation.", isLoadBearing: true },
      { id: "A2", text: "Self-reported well-being accurately measures depression.", isLoadBearing: true },
      { id: "A3", text: "No confounding variables explain both trends.", isLoadBearing: false },
      { id: "A4", text: "Social comparison effects are universal.", isLoadBearing: false },
      { id: "A5", text: "Direction of causation is clear (not reverse).", isLoadBearing: false },
      { id: "A6", text: "All social media use is equivalent.", isLoadBearing: false },
      { id: "A7", text: "Other factors (economics, pandemic) are negligible.", isLoadBearing: false, isDecorative: true },
      { id: "A8", text: "Depression definitions haven't changed.", isLoadBearing: false, isDecorative: true },
    ],
    correctAssumptions: ["A1", "A2"],
    crossExamQuestion: {
      type: "implication",
      question: "If A5 is false (depressed teens seek out social media), which premise fails to support causation?",
      options: [
        "P1 — the correlation could be reversed",
        "P2 — usage and well-being could both result from a third factor",
        "P3 — comparison effects would still operate",
        "All premises become equally suspect",
      ],
      correctIndex: 0,
    },
    contradictionPairs: [
      { id: "cp1", type: "premise-assumption", pair: ["P1", "A1"], label: "P1 ↔ A1", isMinimal: true, isValid: true },
      { id: "cp2", type: "premise-assumption", pair: ["P2", "A2"], label: "P2 ↔ A2", isMinimal: false, isValid: true },
      { id: "cp3", type: "premise-assumption", pair: ["P1", "A5"], label: "P1 ↔ A5", isMinimal: false, isValid: true },
      { id: "cp4", type: "assumption-assumption", pair: ["A1", "A3"], label: "A1 ↔ A3", isMinimal: false, isValid: true },
      { id: "cp5", type: "premise-premise", pair: ["P1", "P2"], label: "P1 ↔ P2", isMinimal: false, isValid: false },
      { id: "cp6", type: "assumption-assumption", pair: ["A4", "A6"], label: "A4 ↔ A6", isMinimal: false, isValid: false },
    ],
    minimalPairId: "cp1",
    domain: "tech",
    socraticReviewQuestions: [
      "If P1's correlation could run in reverse, what does that imply about causation claims?",
      "Which assumption would randomized experiments most directly test?",
      "Can we distinguish effects of social media from broader digitization?",
    ],
  },
  
  // ROUND 9 — Business
  {
    id: "sr-09",
    claim: "Longer work hours lead to better business outcomes.",
    premises: [
      { id: "P1", text: "Countries with longer work hours have higher GDP." },
      { id: "P2", text: "Startups that 'hustle' are more likely to succeed." },
      { id: "P3", text: "More time invested means more problems solved." },
    ],
    conclusion: "Therefore, working longer hours improves business results.",
    assumptions: [
      { id: "A1", text: "GDP is a valid proxy for business success.", isLoadBearing: true },
      { id: "A2", text: "Hours worked maintain consistent productivity.", isLoadBearing: true },
      { id: "A3", text: "Startup success is primarily due to hours, not idea quality.", isLoadBearing: false },
      { id: "A4", text: "Diminishing returns don't apply.", isLoadBearing: false },
      { id: "A5", text: "Employee burnout doesn't offset gains.", isLoadBearing: false },
      { id: "A6", text: "Quality of work is independent of fatigue.", isLoadBearing: false },
      { id: "A7", text: "All hours are equally productive.", isLoadBearing: false, isDecorative: true },
      { id: "A8", text: "Long hours indicate commitment, not inefficiency.", isLoadBearing: false, isDecorative: true },
    ],
    correctAssumptions: ["A1", "A2"],
    crossExamQuestion: {
      type: "consistency",
      question: "If A4 is true (diminishing returns apply), can P3 and A2 both hold?",
      options: [
        "Yes, diminishing returns still means some return",
        "No, A2 assumes consistent productivity which diminishing returns contradict",
        "Yes, if we measure total output, not hourly output",
        "Only for the first 10 hours",
      ],
      correctIndex: 1,
    },
    contradictionPairs: [
      { id: "cp1", type: "premise-assumption", pair: ["P3", "A2"], label: "P3 ↔ A2", isMinimal: true, isValid: true },
      { id: "cp2", type: "premise-assumption", pair: ["P1", "A1"], label: "P1 ↔ A1", isMinimal: false, isValid: true },
      { id: "cp3", type: "assumption-assumption", pair: ["A2", "A4"], label: "A2 ↔ A4", isMinimal: false, isValid: true },
      { id: "cp4", type: "premise-assumption", pair: ["P2", "A3"], label: "P2 ↔ A3", isMinimal: false, isValid: true },
      { id: "cp5", type: "premise-premise", pair: ["P1", "P2"], label: "P1 ↔ P2", isMinimal: false, isValid: false },
      { id: "cp6", type: "assumption-assumption", pair: ["A5", "A6"], label: "A5 ↔ A6", isMinimal: false, isValid: false },
    ],
    minimalPairId: "cp1",
    domain: "business",
    socraticReviewQuestions: [
      "If productivity per hour declines after 8 hours, does P3 still support the conclusion?",
      "Which assumption ignores well-documented fatigue effects?",
      "Can 'hustle culture' success be attributed to other factors like timing or funding?",
    ],
  },
  
  // ROUND 10 — Ethics
  {
    id: "sr-10",
    claim: "Meat consumption is morally wrong.",
    premises: [
      { id: "P1", text: "Animals are sentient beings capable of suffering." },
      { id: "P2", text: "Industrial farming causes immense animal suffering." },
      { id: "P3", text: "Viable plant-based alternatives exist." },
    ],
    conclusion: "Therefore, eating meat is ethically unjustifiable.",
    assumptions: [
      { id: "A1", text: "All meat production involves industrial farming methods.", isLoadBearing: true },
      { id: "A2", text: "Plant-based alternatives are nutritionally equivalent.", isLoadBearing: true },
      { id: "A3", text: "Sentience creates equal moral status with humans.", isLoadBearing: false },
      { id: "A4", text: "Traditional/cultural practices don't modify the ethics.", isLoadBearing: false },
      { id: "A5", text: "Environmental and health factors align with the ethical argument.", isLoadBearing: false },
      { id: "A6", text: "No morally acceptable meat production is possible.", isLoadBearing: false },
      { id: "A7", text: "Alternatives are accessible to everyone.", isLoadBearing: false, isDecorative: true },
      { id: "A8", text: "Taste preferences are morally irrelevant.", isLoadBearing: false, isDecorative: true },
    ],
    correctAssumptions: ["A1", "A2"],
    crossExamQuestion: {
      type: "implication",
      question: "If A6 is false (humane farming exists), which premise loses its force?",
      options: [
        "P1 — animals still suffer in humane farms",
        "P2 — the suffering argument becomes conditional",
        "P3 — alternatives are still viable",
        "None — the argument applies only to factory farming",
      ],
      correctIndex: 1,
    },
    contradictionPairs: [
      { id: "cp1", type: "premise-assumption", pair: ["P2", "A1"], label: "P2 ↔ A1", isMinimal: true, isValid: true },
      { id: "cp2", type: "premise-assumption", pair: ["P3", "A2"], label: "P3 ↔ A2", isMinimal: false, isValid: true },
      { id: "cp3", type: "premise-assumption", pair: ["P2", "A6"], label: "P2 ↔ A6", isMinimal: false, isValid: true },
      { id: "cp4", type: "assumption-assumption", pair: ["A1", "A6"], label: "A1 ↔ A6", isMinimal: false, isValid: true },
      { id: "cp5", type: "premise-premise", pair: ["P1", "P2"], label: "P1 ↔ P2", isMinimal: false, isValid: false },
      { id: "cp6", type: "assumption-assumption", pair: ["A3", "A4"], label: "A3 ↔ A4", isMinimal: false, isValid: false },
    ],
    minimalPairId: "cp1",
    domain: "ethics",
    socraticReviewQuestions: [
      "If some farms avoid suffering, can P2 still universally condemn meat?",
      "Which assumption about alternatives might fail for specific populations?",
      "Does the argument distinguish between kinds of animal products?",
    ],
  },
  
  // ROUND 11 — Learning
  {
    id: "sr-11",
    claim: "Spaced repetition is the optimal learning method.",
    premises: [
      { id: "P1", text: "Memory retention improves with distributed practice." },
      { id: "P2", text: "Spaced repetition software shows high user retention scores." },
      { id: "P3", text: "Cramming results in rapid forgetting." },
    ],
    conclusion: "Therefore, spaced repetition is universally optimal.",
    assumptions: [
      { id: "A1", text: "Retention scores reflect actual learning.", isLoadBearing: true },
      { id: "A2", text: "All learning types benefit from repetition.", isLoadBearing: true },
      { id: "A3", text: "User engagement with software reflects genuine understanding.", isLoadBearing: false },
      { id: "A4", text: "Optimal means best for all goals (not just retention).", isLoadBearing: false },
      { id: "A5", text: "Initial understanding is sufficient before spacing.", isLoadBearing: false },
      { id: "A6", text: "Time efficiency is maximized.", isLoadBearing: false },
      { id: "A7", text: "Skill-based learning follows the same pattern.", isLoadBearing: false, isDecorative: true },
      { id: "A8", text: "Creative and analytical learning are equivalent.", isLoadBearing: false, isDecorative: true },
    ],
    correctAssumptions: ["A1", "A2"],
    crossExamQuestion: {
      type: "consistency",
      question: "If A2 is false (some learning requires immersion, not repetition), can the claim of universal optimality stand?",
      options: [
        "Yes, spaced repetition still works for memory-based learning",
        "No, 'universal' requires applicability to all learning types",
        "Yes, if we exclude creative learning",
        "Only for language learning",
      ],
      correctIndex: 1,
    },
    contradictionPairs: [
      { id: "cp1", type: "premise-assumption", pair: ["P2", "A1"], label: "P2 ↔ A1", isMinimal: true, isValid: true },
      { id: "cp2", type: "assumption-assumption", pair: ["A2", "A7"], label: "A2 ↔ A7", isMinimal: false, isValid: true },
      { id: "cp3", type: "premise-assumption", pair: ["P1", "A5"], label: "P1 ↔ A5", isMinimal: false, isValid: true },
      { id: "cp4", type: "premise-assumption", pair: ["P2", "A3"], label: "P2 ↔ A3", isMinimal: false, isValid: true },
      { id: "cp5", type: "premise-premise", pair: ["P1", "P3"], label: "P1 ↔ P3", isMinimal: false, isValid: false },
      { id: "cp6", type: "assumption-assumption", pair: ["A4", "A6"], label: "A4 ↔ A6", isMinimal: false, isValid: false },
    ],
    minimalPairId: "cp1",
    domain: "learning",
    socraticReviewQuestions: [
      "If retention scores measure recognition but not application, what does P2 prove?",
      "Which assumption is challenged by research on procedural learning?",
      "Can 'optimal' be defined without specifying the learning goal?",
    ],
  },
  
  // ROUND 12 — Productivity
  {
    id: "sr-12",
    claim: "Meditation improves workplace performance.",
    premises: [
      { id: "P1", text: "Meditation reduces stress hormones." },
      { id: "P2", text: "Lower stress correlates with better decision-making." },
      { id: "P3", text: "Companies offering meditation see lower turnover." },
    ],
    conclusion: "Therefore, meditation directly improves work output.",
    assumptions: [
      { id: "A1", text: "Stress reduction translates to performance gains.", isLoadBearing: true },
      { id: "A2", text: "Meditation is the cause of lower turnover, not selection effects.", isLoadBearing: true },
      { id: "A3", text: "Decision-making improvement is sufficient for overall performance.", isLoadBearing: false },
      { id: "A4", text: "Time spent meditating doesn't reduce work time.", isLoadBearing: false },
      { id: "A5", text: "Benefits persist throughout the workday.", isLoadBearing: false },
      { id: "A6", text: "All employees benefit equally.", isLoadBearing: false },
      { id: "A7", text: "Meditation type doesn't matter.", isLoadBearing: false, isDecorative: true },
      { id: "A8", text: "Placebo effects are negligible.", isLoadBearing: false, isDecorative: true },
    ],
    correctAssumptions: ["A1", "A2"],
    crossExamQuestion: {
      type: "implication",
      question: "If A2 is false (companies with meditation attract less-stressed employees), which premise weakens?",
      options: [
        "P1 — stress reduction may not be from meditation",
        "P2 — correlation still holds",
        "P3 — turnover reduction is due to selection, not meditation",
        "None — the mechanism is irrelevant",
      ],
      correctIndex: 2,
    },
    contradictionPairs: [
      { id: "cp1", type: "premise-assumption", pair: ["P3", "A2"], label: "P3 ↔ A2", isMinimal: true, isValid: true },
      { id: "cp2", type: "premise-assumption", pair: ["P2", "A1"], label: "P2 ↔ A1", isMinimal: false, isValid: true },
      { id: "cp3", type: "assumption-assumption", pair: ["A1", "A4"], label: "A1 ↔ A4", isMinimal: false, isValid: true },
      { id: "cp4", type: "premise-assumption", pair: ["P1", "A5"], label: "P1 ↔ A5", isMinimal: false, isValid: true },
      { id: "cp5", type: "premise-premise", pair: ["P1", "P2"], label: "P1 ↔ P2", isMinimal: false, isValid: false },
      { id: "cp6", type: "assumption-assumption", pair: ["A6", "A7"], label: "A6 ↔ A7", isMinimal: false, isValid: false },
    ],
    minimalPairId: "cp1",
    domain: "productivity",
    socraticReviewQuestions: [
      "If turnover reduction is due to self-selection, what can we conclude about meditation?",
      "Which assumption bridges individual physiological effects to organizational outcomes?",
      "Can we isolate meditation's effect from overall wellness culture?",
    ],
  },
  
  // ROUND 13 — Policy
  {
    id: "sr-13",
    claim: "Carbon taxes are the most effective climate solution.",
    premises: [
      { id: "P1", text: "Carbon taxes create market incentives to reduce emissions." },
      { id: "P2", text: "Countries with carbon taxes have seen emissions decline." },
      { id: "P3", text: "Market-based solutions scale more efficiently than regulations." },
    ],
    conclusion: "Therefore, carbon taxes are superior to other climate policies.",
    assumptions: [
      { id: "A1", text: "Tax levels are set high enough to change behavior.", isLoadBearing: true },
      { id: "A2", text: "Emissions declines are caused by the tax, not other factors.", isLoadBearing: true },
      { id: "A3", text: "Market efficiency is the primary goal.", isLoadBearing: false },
      { id: "A4", text: "Alternatives like direct regulation are less effective.", isLoadBearing: false },
      { id: "A5", text: "Revenue use doesn't undermine effectiveness.", isLoadBearing: false },
      { id: "A6", text: "Carbon leakage to other countries is minimal.", isLoadBearing: false },
      { id: "A7", text: "Political feasibility is equal across solutions.", isLoadBearing: false, isDecorative: true },
      { id: "A8", text: "Equity concerns can be addressed separately.", isLoadBearing: false, isDecorative: true },
    ],
    correctAssumptions: ["A1", "A2"],
    crossExamQuestion: {
      type: "consistency",
      question: "If P2's emissions declines coincided with technological change, is the claim in A2 valid?",
      options: [
        "Yes, the tax may have accelerated adoption",
        "No, confounding factors make attribution uncertain",
        "Yes, if the trend accelerated post-tax",
        "Only if we control for economic changes",
      ],
      correctIndex: 1,
    },
    contradictionPairs: [
      { id: "cp1", type: "premise-assumption", pair: ["P2", "A2"], label: "P2 ↔ A2", isMinimal: true, isValid: true },
      { id: "cp2", type: "premise-assumption", pair: ["P1", "A1"], label: "P1 ↔ A1", isMinimal: false, isValid: true },
      { id: "cp3", type: "premise-assumption", pair: ["P3", "A4"], label: "P3 ↔ A4", isMinimal: false, isValid: true },
      { id: "cp4", type: "assumption-assumption", pair: ["A2", "A6"], label: "A2 ↔ A6", isMinimal: false, isValid: true },
      { id: "cp5", type: "premise-premise", pair: ["P1", "P3"], label: "P1 ↔ P3", isMinimal: false, isValid: false },
      { id: "cp6", type: "assumption-assumption", pair: ["A3", "A8"], label: "A3 ↔ A8", isMinimal: false, isValid: false },
    ],
    minimalPairId: "cp1",
    domain: "policy",
    socraticReviewQuestions: [
      "If technological innovation drove declines, can we credit the tax?",
      "Which assumption about comparative policy effectiveness is least tested?",
      "Does 'most effective' require considering equity and political viability?",
    ],
  },
  
  // ROUND 14 — Tech
  {
    id: "sr-14",
    claim: "Cryptocurrencies will replace traditional banking.",
    premises: [
      { id: "P1", text: "Cryptocurrencies enable peer-to-peer transactions without intermediaries." },
      { id: "P2", text: "Traditional banks charge high fees and are slow." },
      { id: "P3", text: "Crypto adoption is growing exponentially." },
    ],
    conclusion: "Therefore, crypto will make banks obsolete.",
    assumptions: [
      { id: "A1", text: "Peer-to-peer is superior for all financial services.", isLoadBearing: true },
      { id: "A2", text: "Exponential growth will continue indefinitely.", isLoadBearing: true },
      { id: "A3", text: "Regulatory responses won't limit crypto utility.", isLoadBearing: false },
      { id: "A4", text: "Banks cannot adopt similar technologies.", isLoadBearing: false },
      { id: "A5", text: "Volatility and security risks are solvable.", isLoadBearing: false },
      { id: "A6", text: "Consumer trust will transfer to decentralized systems.", isLoadBearing: false },
      { id: "A7", text: "Environmental concerns won't limit adoption.", isLoadBearing: false, isDecorative: true },
      { id: "A8", text: "Complexity won't deter average users.", isLoadBearing: false, isDecorative: true },
    ],
    correctAssumptions: ["A1", "A2"],
    crossExamQuestion: {
      type: "implication",
      question: "If A4 is false (banks adopt blockchain technology), which premise loses its distinctiveness?",
      options: [
        "P1 — banks could offer similar peer-to-peer features",
        "P2 — fees and speed could improve",
        "P3 — growth would include hybrid solutions",
        "All premises remain valid but the conclusion changes",
      ],
      correctIndex: 3,
    },
    contradictionPairs: [
      { id: "cp1", type: "premise-assumption", pair: ["P3", "A2"], label: "P3 ↔ A2", isMinimal: true, isValid: true },
      { id: "cp2", type: "premise-assumption", pair: ["P1", "A1"], label: "P1 ↔ A1", isMinimal: false, isValid: true },
      { id: "cp3", type: "premise-assumption", pair: ["P2", "A4"], label: "P2 ↔ A4", isMinimal: false, isValid: true },
      { id: "cp4", type: "assumption-assumption", pair: ["A2", "A3"], label: "A2 ↔ A3", isMinimal: false, isValid: true },
      { id: "cp5", type: "premise-premise", pair: ["P1", "P2"], label: "P1 ↔ P2", isMinimal: false, isValid: false },
      { id: "cp6", type: "assumption-assumption", pair: ["A5", "A6"], label: "A5 ↔ A6", isMinimal: false, isValid: false },
    ],
    minimalPairId: "cp1",
    domain: "tech",
    socraticReviewQuestions: [
      "If exponential growth curves typically plateau, how reliable is P3?",
      "Which assumption ignores banks' capacity to innovate?",
      "Can 'replace' be true if hybrid models emerge?",
    ],
  },
  
  // ROUND 15 — Business
  {
    id: "sr-15",
    claim: "Customer obsession is the key to business success.",
    premises: [
      { id: "P1", text: "Amazon attributes its success to customer obsession." },
      { id: "P2", text: "Companies with high NPS scores grow faster." },
      { id: "P3", text: "Customer retention is cheaper than acquisition." },
    ],
    conclusion: "Therefore, extreme customer focus guarantees success.",
    assumptions: [
      { id: "A1", text: "Amazon's success is primarily due to customer focus.", isLoadBearing: true },
      { id: "A2", text: "NPS accurately measures customer obsession.", isLoadBearing: true },
      { id: "A3", text: "What works for Amazon works universally.", isLoadBearing: false },
      { id: "A4", text: "Customer obsession doesn't compromise profitability.", isLoadBearing: false },
      { id: "A5", text: "Other success factors are secondary.", isLoadBearing: false },
      { id: "A6", text: "Short-term customer satisfaction aligns with long-term success.", isLoadBearing: false },
      { id: "A7", text: "All customers are worth obsessing over.", isLoadBearing: false, isDecorative: true },
      { id: "A8", text: "Employee satisfaction is a separate concern.", isLoadBearing: false, isDecorative: true },
    ],
    correctAssumptions: ["A1", "A2"],
    crossExamQuestion: {
      type: "consistency",
      question: "If Amazon's success also depends on logistics, technology, and scale, can A1 and P1 both be accurate?",
      options: [
        "Yes, customer obsession enabled those advantages",
        "No, attributing success to one factor oversimplifies",
        "Yes, if customer obsession is the root cause",
        "Only if other factors are consequences of customer focus",
      ],
      correctIndex: 1,
    },
    contradictionPairs: [
      { id: "cp1", type: "premise-assumption", pair: ["P1", "A1"], label: "P1 ↔ A1", isMinimal: true, isValid: true },
      { id: "cp2", type: "premise-assumption", pair: ["P2", "A2"], label: "P2 ↔ A2", isMinimal: false, isValid: true },
      { id: "cp3", type: "assumption-assumption", pair: ["A1", "A3"], label: "A1 ↔ A3", isMinimal: false, isValid: true },
      { id: "cp4", type: "premise-assumption", pair: ["P1", "A5"], label: "P1 ↔ A5", isMinimal: false, isValid: true },
      { id: "cp5", type: "premise-premise", pair: ["P2", "P3"], label: "P2 ↔ P3", isMinimal: false, isValid: false },
      { id: "cp6", type: "assumption-assumption", pair: ["A4", "A7"], label: "A4 ↔ A7", isMinimal: false, isValid: false },
    ],
    minimalPairId: "cp1",
    domain: "business",
    socraticReviewQuestions: [
      "If Amazon's flywheel has multiple components, can we isolate customer obsession?",
      "Which assumption fails when applied to B2B or niche businesses?",
      "Does 'key' mean necessary, sufficient, or merely important?",
    ],
  },
  
  // ROUND 16 — Ethics
  {
    id: "sr-16",
    claim: "Free will is an illusion.",
    premises: [
      { id: "P1", text: "Brain activity precedes conscious decision-making." },
      { id: "P2", text: "Behavior can be predicted from environmental and genetic factors." },
      { id: "P3", text: "No one chooses their initial desires or dispositions." },
    ],
    conclusion: "Therefore, free will does not exist.",
    assumptions: [
      { id: "A1", text: "Temporal precedence of brain activity negates free will.", isLoadBearing: true },
      { id: "A2", text: "Predictability is incompatible with freedom.", isLoadBearing: true },
      { id: "A3", text: "Free will requires originating one's own nature.", isLoadBearing: false },
      { id: "A4", text: "Consciousness has no causal efficacy.", isLoadBearing: false },
      { id: "A5", text: "Quantum indeterminacy doesn't enable meaningful freedom.", isLoadBearing: false },
      { id: "A6", text: "Compatibilist definitions of freedom are invalid.", isLoadBearing: false },
      { id: "A7", text: "Our experience of choosing is entirely illusory.", isLoadBearing: false, isDecorative: true },
      { id: "A8", text: "Moral responsibility requires libertarian free will.", isLoadBearing: false, isDecorative: true },
    ],
    correctAssumptions: ["A1", "A2"],
    crossExamQuestion: {
      type: "implication",
      question: "If A6 is false (compatibilist free will is coherent), which premise fails to support the conclusion?",
      options: [
        "P1 — brain precedence is compatible with agency",
        "P2 — predictability doesn't negate compatibilist freedom",
        "P3 — not choosing one's nature is compatible with freedom",
        "All premises, since compatibilism redefines the question",
      ],
      correctIndex: 3,
    },
    contradictionPairs: [
      { id: "cp1", type: "premise-assumption", pair: ["P2", "A2"], label: "P2 ↔ A2", isMinimal: true, isValid: true },
      { id: "cp2", type: "premise-assumption", pair: ["P1", "A1"], label: "P1 ↔ A1", isMinimal: false, isValid: true },
      { id: "cp3", type: "premise-assumption", pair: ["P3", "A3"], label: "P3 ↔ A3", isMinimal: false, isValid: true },
      { id: "cp4", type: "assumption-assumption", pair: ["A1", "A4"], label: "A1 ↔ A4", isMinimal: false, isValid: true },
      { id: "cp5", type: "premise-premise", pair: ["P1", "P2"], label: "P1 ↔ P2", isMinimal: false, isValid: false },
      { id: "cp6", type: "assumption-assumption", pair: ["A6", "A8"], label: "A6 ↔ A8", isMinimal: false, isValid: false },
    ],
    minimalPairId: "cp1",
    domain: "ethics",
    socraticReviewQuestions: [
      "If predictability is compatible with freedom (as in physics), does P2 prove anything?",
      "Which assumption begs the question about what 'free will' means?",
      "Can 'illusion' be true for libertarian free will but false for compatibilist free will?",
    ],
  },
  
  // ROUND 17 — Learning
  {
    id: "sr-17",
    claim: "IQ tests measure true intelligence.",
    premises: [
      { id: "P1", text: "IQ scores predict academic success." },
      { id: "P2", text: "IQ tests are standardized and reliable." },
      { id: "P3", text: "IQ correlates with job performance across fields." },
    ],
    conclusion: "Therefore, IQ captures genuine intellectual ability.",
    assumptions: [
      { id: "A1", text: "Academic success reflects intelligence, not test-taking skill.", isLoadBearing: true },
      { id: "A2", text: "Reliability implies validity.", isLoadBearing: true },
      { id: "A3", text: "Job performance measures general intelligence.", isLoadBearing: false },
      { id: "A4", text: "Intelligence is a single, measurable construct.", isLoadBearing: false },
      { id: "A5", text: "Cultural and educational biases are negligible.", isLoadBearing: false },
      { id: "A6", text: "Creativity, emotional, and practical intelligence are included.", isLoadBearing: false },
      { id: "A7", text: "High IQ guarantees real-world success.", isLoadBearing: false, isDecorative: true },
      { id: "A8", text: "IQ is fixed and unchangeable.", isLoadBearing: false, isDecorative: true },
    ],
    correctAssumptions: ["A1", "A2"],
    crossExamQuestion: {
      type: "consistency",
      question: "If A2 is false (reliability doesn't imply validity), can P2 support claims about measuring intelligence?",
      options: [
        "Yes, reliability is still valuable",
        "No, consistent measurement of the wrong thing proves nothing",
        "Yes, if combined with other evidence",
        "Only for comparing within populations",
      ],
      correctIndex: 1,
    },
    contradictionPairs: [
      { id: "cp1", type: "premise-assumption", pair: ["P2", "A2"], label: "P2 ↔ A2", isMinimal: true, isValid: true },
      { id: "cp2", type: "premise-assumption", pair: ["P1", "A1"], label: "P1 ↔ A1", isMinimal: false, isValid: true },
      { id: "cp3", type: "assumption-assumption", pair: ["A2", "A4"], label: "A2 ↔ A4", isMinimal: false, isValid: true },
      { id: "cp4", type: "premise-assumption", pair: ["P3", "A3"], label: "P3 ↔ A3", isMinimal: false, isValid: true },
      { id: "cp5", type: "premise-premise", pair: ["P1", "P3"], label: "P1 ↔ P3", isMinimal: false, isValid: false },
      { id: "cp6", type: "assumption-assumption", pair: ["A5", "A6"], label: "A5 ↔ A6", isMinimal: false, isValid: false },
    ],
    minimalPairId: "cp1",
    domain: "learning",
    socraticReviewQuestions: [
      "If tests reliably measure a narrow cognitive domain, is that 'true intelligence'?",
      "Which assumption about intelligence's structure is most contested?",
      "Can correlations with success prove the validity of the construct being measured?",
    ],
  },
  
  // ROUND 18 — Productivity
  {
    id: "sr-18",
    claim: "Open offices boost creativity and collaboration.",
    premises: [
      { id: "P1", text: "Open offices facilitate spontaneous conversations." },
      { id: "P2", text: "Tech giants like Google use open floor plans." },
      { id: "P3", text: "Employees in open offices report more interactions." },
    ],
    conclusion: "Therefore, open offices enhance creative output.",
    assumptions: [
      { id: "A1", text: "Spontaneous conversations lead to creative breakthroughs.", isLoadBearing: true },
      { id: "A2", text: "Google's success is due to office layout, not other factors.", isLoadBearing: true },
      { id: "A3", text: "Quantity of interactions correlates with quality.", isLoadBearing: false },
      { id: "A4", text: "Deep work isn't compromised by interruptions.", isLoadBearing: false },
      { id: "A5", text: "All creative work benefits from collaboration.", isLoadBearing: false },
      { id: "A6", text: "Self-reported interactions reflect actual collaboration.", isLoadBearing: false },
      { id: "A7", text: "Noise and distraction don't reduce productivity.", isLoadBearing: false, isDecorative: true },
      { id: "A8", text: "Introverts perform equally well in open spaces.", isLoadBearing: false, isDecorative: true },
    ],
    correctAssumptions: ["A1", "A2"],
    crossExamQuestion: {
      type: "implication",
      question: "If studies show face-to-face interactions actually decrease in open offices, which premise fails?",
      options: [
        "P1 — spontaneous conversations may decrease, not increase",
        "P2 — Google may have succeeded despite office layout",
        "P3 — self-reports may be inaccurate",
        "None — the studies might be flawed",
      ],
      correctIndex: 0,
    },
    contradictionPairs: [
      { id: "cp1", type: "premise-assumption", pair: ["P1", "A1"], label: "P1 ↔ A1", isMinimal: true, isValid: true },
      { id: "cp2", type: "premise-assumption", pair: ["P2", "A2"], label: "P2 ↔ A2", isMinimal: false, isValid: true },
      { id: "cp3", type: "premise-assumption", pair: ["P3", "A3"], label: "P3 ↔ A3", isMinimal: false, isValid: true },
      { id: "cp4", type: "assumption-assumption", pair: ["A1", "A4"], label: "A1 ↔ A4", isMinimal: false, isValid: true },
      { id: "cp5", type: "premise-premise", pair: ["P1", "P3"], label: "P1 ↔ P3", isMinimal: false, isValid: false },
      { id: "cp6", type: "assumption-assumption", pair: ["A5", "A8"], label: "A5 ↔ A8", isMinimal: false, isValid: false },
    ],
    minimalPairId: "cp1",
    domain: "productivity",
    socraticReviewQuestions: [
      "If people avoid conversations in open offices (to escape noise), does P1 hold?",
      "Which assumption ignores research on focused work and creativity?",
      "Can we attribute success to a single architectural choice?",
    ],
  },
  
  // ROUND 19 — Policy
  {
    id: "sr-19",
    claim: "Immigration is a net economic benefit.",
    premises: [
      { id: "P1", text: "Immigrants contribute to GDP growth." },
      { id: "P2", text: "Immigrant entrepreneurs start businesses at higher rates." },
      { id: "P3", text: "Labor shortages in key sectors are filled by immigrants." },
    ],
    conclusion: "Therefore, immigration produces overall economic gains.",
    assumptions: [
      { id: "A1", text: "GDP growth benefits all residents, not just aggregate numbers.", isLoadBearing: true },
      { id: "A2", text: "Entrepreneurship rates translate to net job creation.", isLoadBearing: true },
      { id: "A3", text: "Public service costs are offset by contributions.", isLoadBearing: false },
      { id: "A4", text: "Wage effects on existing workers are negligible or positive.", isLoadBearing: false },
      { id: "A5", text: "Cultural and social factors don't offset economic benefits.", isLoadBearing: false },
      { id: "A6", text: "Labor shortages would persist without immigration.", isLoadBearing: false },
      { id: "A7", text: "All immigrant types contribute equally.", isLoadBearing: false, isDecorative: true },
      { id: "A8", text: "Economic benefit is the primary metric for policy.", isLoadBearing: false, isDecorative: true },
    ],
    correctAssumptions: ["A1", "A2"],
    crossExamQuestion: {
      type: "consistency",
      question: "If P1's GDP growth primarily benefits capital owners, can A1 support the claim of 'net benefit'?",
      options: [
        "Yes, aggregate benefit is still positive",
        "No, 'net benefit' implies broad distribution",
        "Yes, if we include immigrants in the calculation",
        "Only if combined with redistribution policies",
      ],
      correctIndex: 1,
    },
    contradictionPairs: [
      { id: "cp1", type: "premise-assumption", pair: ["P1", "A1"], label: "P1 ↔ A1", isMinimal: true, isValid: true },
      { id: "cp2", type: "premise-assumption", pair: ["P2", "A2"], label: "P2 ↔ A2", isMinimal: false, isValid: true },
      { id: "cp3", type: "assumption-assumption", pair: ["A1", "A4"], label: "A1 ↔ A4", isMinimal: false, isValid: true },
      { id: "cp4", type: "premise-assumption", pair: ["P3", "A6"], label: "P3 ↔ A6", isMinimal: false, isValid: true },
      { id: "cp5", type: "premise-premise", pair: ["P1", "P2"], label: "P1 ↔ P2", isMinimal: false, isValid: false },
      { id: "cp6", type: "assumption-assumption", pair: ["A3", "A7"], label: "A3 ↔ A7", isMinimal: false, isValid: false },
    ],
    minimalPairId: "cp1",
    domain: "policy",
    socraticReviewQuestions: [
      "If GDP gains accrue to specific groups, is 'net benefit' an accurate description?",
      "Which assumption about labor market effects is most contested by economists?",
      "Can we evaluate immigration on economic terms alone?",
    ],
  },
  
  // ROUND 20 — Tech
  {
    id: "sr-20",
    claim: "Quantum computing will break all encryption.",
    premises: [
      { id: "P1", text: "Quantum computers can run Shor's algorithm efficiently." },
      { id: "P2", text: "Current encryption relies on factoring large numbers." },
      { id: "P3", text: "Quantum computing power is advancing rapidly." },
    ],
    conclusion: "Therefore, all current encryption will become insecure.",
    assumptions: [
      { id: "A1", text: "Quantum computers will scale sufficiently.", isLoadBearing: true },
      { id: "A2", text: "Post-quantum cryptography won't replace current methods.", isLoadBearing: true },
      { id: "A3", text: "Error correction challenges will be solved.", isLoadBearing: false },
      { id: "A4", text: "Symmetric encryption is equally vulnerable.", isLoadBearing: false },
      { id: "A5", text: "Quantum-resistant algorithms won't be deployed in time.", isLoadBearing: false },
      { id: "A6", text: "All sensitive data will still be worth decrypting.", isLoadBearing: false },
      { id: "A7", text: "Quantum computing development is inevitable.", isLoadBearing: false, isDecorative: true },
      { id: "A8", text: "No new cryptographic paradigms will emerge.", isLoadBearing: false, isDecorative: true },
    ],
    correctAssumptions: ["A1", "A2"],
    crossExamQuestion: {
      type: "implication",
      question: "If A2 is false (post-quantum crypto is already being deployed), which premise loses urgency?",
      options: [
        "P1 — Shor's algorithm becomes irrelevant",
        "P2 — new encryption doesn't rely on factoring",
        "P3 — advancement continues but threat is mitigated",
        "All premises, the conclusion requires new framing",
      ],
      correctIndex: 2,
    },
    contradictionPairs: [
      { id: "cp1", type: "premise-assumption", pair: ["P3", "A2"], label: "P3 ↔ A2", isMinimal: true, isValid: true },
      { id: "cp2", type: "premise-assumption", pair: ["P1", "A1"], label: "P1 ↔ A1", isMinimal: false, isValid: true },
      { id: "cp3", type: "premise-assumption", pair: ["P2", "A5"], label: "P2 ↔ A5", isMinimal: false, isValid: true },
      { id: "cp4", type: "assumption-assumption", pair: ["A1", "A3"], label: "A1 ↔ A3", isMinimal: false, isValid: true },
      { id: "cp5", type: "premise-premise", pair: ["P1", "P2"], label: "P1 ↔ P2", isMinimal: false, isValid: false },
      { id: "cp6", type: "assumption-assumption", pair: ["A4", "A8"], label: "A4 ↔ A8", isMinimal: false, isValid: false },
    ],
    minimalPairId: "cp1",
    domain: "tech",
    socraticReviewQuestions: [
      "If cryptographers are already preparing, does P3's urgency support the conclusion?",
      "Which assumption ignores the distinction between asymmetric and symmetric encryption?",
      "Can 'all encryption' be broken if symmetric methods remain secure?",
    ],
  },
  
  // ROUND 21 — Business
  {
    id: "sr-21",
    claim: "Disruption always benefits consumers.",
    premises: [
      { id: "P1", text: "Disruptive companies offer lower prices." },
      { id: "P2", text: "New entrants increase competition." },
      { id: "P3", text: "Innovation creates new capabilities and convenience." },
    ],
    conclusion: "Therefore, disruption universally improves consumer welfare.",
    assumptions: [
      { id: "A1", text: "Lower prices are sustained, not predatory.", isLoadBearing: true },
      { id: "A2", text: "Competition persists after disruption.", isLoadBearing: true },
      { id: "A3", text: "Job losses don't reduce consumer purchasing power.", isLoadBearing: false },
      { id: "A4", text: "Privacy, security, and quality aren't traded for convenience.", isLoadBearing: false },
      { id: "A5", text: "All consumers have access to new innovations.", isLoadBearing: false },
      { id: "A6", text: "Winner-take-all dynamics don't emerge.", isLoadBearing: false },
      { id: "A7", text: "Traditional options remain available.", isLoadBearing: false, isDecorative: true },
      { id: "A8", text: "Regulatory gaps don't harm consumers.", isLoadBearing: false, isDecorative: true },
    ],
    correctAssumptions: ["A1", "A2"],
    crossExamQuestion: {
      type: "consistency",
      question: "If disruptors often achieve monopoly power (violating A2), can P2's competition claim hold long-term?",
      options: [
        "Yes, initial competition phase benefits consumers",
        "No, monopoly outcomes undermine sustained benefits",
        "Yes, if new disruptors continue to emerge",
        "Only in regulated markets",
      ],
      correctIndex: 1,
    },
    contradictionPairs: [
      { id: "cp1", type: "premise-assumption", pair: ["P2", "A2"], label: "P2 ↔ A2", isMinimal: true, isValid: true },
      { id: "cp2", type: "premise-assumption", pair: ["P1", "A1"], label: "P1 ↔ A1", isMinimal: false, isValid: true },
      { id: "cp3", type: "assumption-assumption", pair: ["A2", "A6"], label: "A2 ↔ A6", isMinimal: false, isValid: true },
      { id: "cp4", type: "premise-assumption", pair: ["P3", "A4"], label: "P3 ↔ A4", isMinimal: false, isValid: true },
      { id: "cp5", type: "premise-premise", pair: ["P1", "P3"], label: "P1 ↔ P3", isMinimal: false, isValid: false },
      { id: "cp6", type: "assumption-assumption", pair: ["A5", "A7"], label: "A5 ↔ A7", isMinimal: false, isValid: false },
    ],
    minimalPairId: "cp1",
    domain: "business",
    socraticReviewQuestions: [
      "If increased competition leads to monopoly, does P2 support long-term benefit?",
      "Which assumption ignores evidence from platform economics?",
      "Can 'universally' be true if some consumer segments lose options?",
    ],
  },
  
  // ROUND 22 — Ethics
  {
    id: "sr-22",
    claim: "Lying is always morally wrong.",
    premises: [
      { id: "P1", text: "Lying involves intentional deception." },
      { id: "P2", text: "Deception undermines trust, which is essential for society." },
      { id: "P3", text: "If everyone lied, social cooperation would collapse." },
    ],
    conclusion: "Therefore, lying is never morally permissible.",
    assumptions: [
      { id: "A1", text: "All lies equally undermine trust.", isLoadBearing: true },
      { id: "A2", text: "Kantian universalizability is the correct moral test.", isLoadBearing: true },
      { id: "A3", text: "Consequences don't affect the moral status of lying.", isLoadBearing: false },
      { id: "A4", text: "White lies and protective lies are morally equivalent.", isLoadBearing: false },
      { id: "A5", text: "Truth-telling never causes greater harm.", isLoadBearing: false },
      { id: "A6", text: "Duty to truth supersedes all other duties.", isLoadBearing: false },
      { id: "A7", text: "The deceived party's interests are irrelevant.", isLoadBearing: false, isDecorative: true },
      { id: "A8", text: "Context doesn't modify moral assessment.", isLoadBearing: false, isDecorative: true },
    ],
    correctAssumptions: ["A1", "A2"],
    crossExamQuestion: {
      type: "implication",
      question: "If A3 is false (consequences matter), which premise loses its force for cases like lying to save a life?",
      options: [
        "P1 — intention is irrelevant if outcomes are good",
        "P2 — trust may be preserved if the lie prevents greater harm",
        "P3 — universalizability may permit exceptions",
        "None — the rule still applies without exception",
      ],
      correctIndex: 2,
    },
    contradictionPairs: [
      { id: "cp1", type: "premise-assumption", pair: ["P3", "A2"], label: "P3 ↔ A2", isMinimal: true, isValid: true },
      { id: "cp2", type: "premise-assumption", pair: ["P2", "A1"], label: "P2 ↔ A1", isMinimal: false, isValid: true },
      { id: "cp3", type: "assumption-assumption", pair: ["A2", "A3"], label: "A2 ↔ A3", isMinimal: false, isValid: true },
      { id: "cp4", type: "premise-assumption", pair: ["P1", "A4"], label: "P1 ↔ A4", isMinimal: false, isValid: true },
      { id: "cp5", type: "premise-premise", pair: ["P1", "P2"], label: "P1 ↔ P2", isMinimal: false, isValid: false },
      { id: "cp6", type: "assumption-assumption", pair: ["A5", "A6"], label: "A5 ↔ A6", isMinimal: false, isValid: false },
    ],
    minimalPairId: "cp1",
    domain: "ethics",
    socraticReviewQuestions: [
      "If universalizability permits exceptions (e.g., 'lying to murderers'), does P3 prove 'never permissible'?",
      "Which assumption is most challenged by consequentialist ethics?",
      "Can 'always wrong' coexist with duties to protect others?",
    ],
  },
  
  // ROUND 23 — Learning
  {
    id: "sr-23",
    claim: "Reading is superior to listening for learning.",
    premises: [
      { id: "P1", text: "Readers can control pace and re-read difficult passages." },
      { id: "P2", text: "Reading activates more brain regions for processing." },
      { id: "P3", text: "Academic success correlates with reading ability." },
    ],
    conclusion: "Therefore, reading is always the better learning modality.",
    assumptions: [
      { id: "A1", text: "Pace control is necessary for comprehension.", isLoadBearing: true },
      { id: "A2", text: "More brain activation means better learning.", isLoadBearing: true },
      { id: "A3", text: "Auditory learners don't exist or don't matter.", isLoadBearing: false },
      { id: "A4", text: "Academic success measures all types of learning.", isLoadBearing: false },
      { id: "A5", text: "Audio can't be paused or replayed.", isLoadBearing: false },
      { id: "A6", text: "Context (driving, exercising) is irrelevant.", isLoadBearing: false },
      { id: "A7", text: "Visual impairment doesn't change the calculation.", isLoadBearing: false, isDecorative: true },
      { id: "A8", text: "Narrative content benefits equally from reading.", isLoadBearing: false, isDecorative: true },
    ],
    correctAssumptions: ["A1", "A2"],
    crossExamQuestion: {
      type: "consistency",
      question: "If A5 is false (audio can be replayed), does P1's pace control argument remain distinctive?",
      options: [
        "Yes, visual control is still more precise",
        "No, the key differentiator is neutralized",
        "Yes, re-reading is easier than rewinding",
        "Only for complex technical material",
      ],
      correctIndex: 1,
    },
    contradictionPairs: [
      { id: "cp1", type: "premise-assumption", pair: ["P1", "A1"], label: "P1 ↔ A1", isMinimal: true, isValid: true },
      { id: "cp2", type: "premise-assumption", pair: ["P2", "A2"], label: "P2 ↔ A2", isMinimal: false, isValid: true },
      { id: "cp3", type: "assumption-assumption", pair: ["A1", "A5"], label: "A1 ↔ A5", isMinimal: false, isValid: true },
      { id: "cp4", type: "premise-assumption", pair: ["P3", "A4"], label: "P3 ↔ A4", isMinimal: false, isValid: true },
      { id: "cp5", type: "premise-premise", pair: ["P1", "P2"], label: "P1 ↔ P2", isMinimal: false, isValid: false },
      { id: "cp6", type: "assumption-assumption", pair: ["A3", "A6"], label: "A3 ↔ A6", isMinimal: false, isValid: false },
    ],
    minimalPairId: "cp1",
    domain: "learning",
    socraticReviewQuestions: [
      "If audiobooks can be paused and rewound, is P1's advantage still decisive?",
      "Which assumption about brain activation confuses correlation with causation?",
      "Can 'always better' be true across all learner types and contexts?",
    ],
  },
  
  // ROUND 24 — Productivity
  {
    id: "sr-24",
    claim: "Goal-setting guarantees motivation.",
    premises: [
      { id: "P1", text: "Specific goals improve performance over vague intentions." },
      { id: "P2", text: "Measurable goals allow tracking progress." },
      { id: "P3", text: "High achievers commonly set ambitious goals." },
    ],
    conclusion: "Therefore, setting goals will make anyone more motivated.",
    assumptions: [
      { id: "A1", text: "Improved performance reflects increased motivation.", isLoadBearing: true },
      { id: "A2", text: "High achievers succeed because of goal-setting, not other traits.", isLoadBearing: true },
      { id: "A3", text: "Goals don't create anxiety or fear of failure.", isLoadBearing: false },
      { id: "A4", text: "External goals motivate intrinsic behavior.", isLoadBearing: false },
      { id: "A5", text: "Failure to meet goals doesn't demotivate.", isLoadBearing: false },
      { id: "A6", text: "All goal types (approach vs. avoidance) work equally.", isLoadBearing: false },
      { id: "A7", text: "Individual differences in response to goals are negligible.", isLoadBearing: false, isDecorative: true },
      { id: "A8", text: "Goals align with authentic desires.", isLoadBearing: false, isDecorative: true },
    ],
    correctAssumptions: ["A1", "A2"],
    crossExamQuestion: {
      type: "implication",
      question: "If A3 is false (goals create anxiety), which premise's positive framing becomes incomplete?",
      options: [
        "P1 — performance may improve but at psychological cost",
        "P2 — tracking can become a source of stress",
        "P3 — achievers may succeed despite goal anxiety",
        "All premises, since motivation includes psychological wellbeing",
      ],
      correctIndex: 0,
    },
    contradictionPairs: [
      { id: "cp1", type: "premise-assumption", pair: ["P1", "A1"], label: "P1 ↔ A1", isMinimal: true, isValid: true },
      { id: "cp2", type: "premise-assumption", pair: ["P3", "A2"], label: "P3 ↔ A2", isMinimal: false, isValid: true },
      { id: "cp3", type: "premise-assumption", pair: ["P1", "A3"], label: "P1 ↔ A3", isMinimal: false, isValid: true },
      { id: "cp4", type: "assumption-assumption", pair: ["A1", "A5"], label: "A1 ↔ A5", isMinimal: false, isValid: true },
      { id: "cp5", type: "premise-premise", pair: ["P1", "P2"], label: "P1 ↔ P2", isMinimal: false, isValid: false },
      { id: "cp6", type: "assumption-assumption", pair: ["A4", "A8"], label: "A4 ↔ A8", isMinimal: false, isValid: false },
    ],
    minimalPairId: "cp1",
    domain: "productivity",
    socraticReviewQuestions: [
      "If performance improves but stress increases, is that 'motivation'?",
      "Which assumption confuses correlation (achievers set goals) with causation?",
      "Can 'guarantees' be true when individual responses vary?",
    ],
  },
  
  // ROUND 25 — Policy
  {
    id: "sr-25",
    claim: "Democracy is the best political system.",
    premises: [
      { id: "P1", text: "Democracies protect individual rights better than alternatives." },
      { id: "P2", text: "Democratic nations have higher GDP per capita on average." },
      { id: "P3", text: "Citizens have voice and accountability mechanisms." },
    ],
    conclusion: "Therefore, democracy is objectively superior to other systems.",
    assumptions: [
      { id: "A1", text: "Rights protection is the primary criterion for 'best'.", isLoadBearing: true },
      { id: "A2", text: "GDP correlation is causal, not selection effect.", isLoadBearing: true },
      { id: "A3", text: "Voice and accountability function as designed.", isLoadBearing: false },
      { id: "A4", text: "Democracies don't have systemic flaws.", isLoadBearing: false },
      { id: "A5", text: "Cultural context doesn't affect system performance.", isLoadBearing: false },
      { id: "A6", text: "Short-term electoral cycles don't compromise long-term planning.", isLoadBearing: false },
      { id: "A7", text: "All democracies function similarly.", isLoadBearing: false, isDecorative: true },
      { id: "A8", text: "Transitions to democracy are always beneficial.", isLoadBearing: false, isDecorative: true },
    ],
    correctAssumptions: ["A1", "A2"],
    crossExamQuestion: {
      type: "consistency",
      question: "If P2's GDP correlation is due to historical factors (colonialism, geography), can A2 and P2 both hold?",
      options: [
        "Yes, democracy may still contribute independently",
        "No, the correlation may be spurious",
        "Yes, if we control for those factors",
        "Only for established democracies",
      ],
      correctIndex: 1,
    },
    contradictionPairs: [
      { id: "cp1", type: "premise-assumption", pair: ["P2", "A2"], label: "P2 ↔ A2", isMinimal: true, isValid: true },
      { id: "cp2", type: "premise-assumption", pair: ["P1", "A1"], label: "P1 ↔ A1", isMinimal: false, isValid: true },
      { id: "cp3", type: "premise-assumption", pair: ["P3", "A3"], label: "P3 ↔ A3", isMinimal: false, isValid: true },
      { id: "cp4", type: "assumption-assumption", pair: ["A2", "A5"], label: "A2 ↔ A5", isMinimal: false, isValid: true },
      { id: "cp5", type: "premise-premise", pair: ["P1", "P3"], label: "P1 ↔ P3", isMinimal: false, isValid: false },
      { id: "cp6", type: "assumption-assumption", pair: ["A4", "A6"], label: "A4 ↔ A6", isMinimal: false, isValid: false },
    ],
    minimalPairId: "cp1",
    domain: "policy",
    socraticReviewQuestions: [
      "If wealthy nations adopted democracy after becoming wealthy, what does P2 prove?",
      "Which assumption about the criteria for 'best' is most value-laden?",
      "Can 'objectively superior' be established when values differ?",
    ],
  },
];

// ============================================
// GAME CONFIGURATION
// ============================================

export const SOCRATIC_CONFIG = {
  rounds: 5,
  baseXP: 18,
  minXP: 6,
  sessionDurationMinutes: { min: 4, max: 6 },
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
 * Generate a 5-round session with varied domains
 */
export function generateSocraticSession(): SocraticRound[] {
  // Ensure domain diversity
  const byDomain = new Map<string, SocraticRound[]>();
  SOCRATIC_ROUNDS.forEach(r => {
    const list = byDomain.get(r.domain) || [];
    list.push(r);
    byDomain.set(r.domain, list);
  });
  
  const domains = Array.from(byDomain.keys());
  const shuffledDomains = shuffle(domains);
  
  const session: SocraticRound[] = [];
  let domainIndex = 0;
  
  while (session.length < SOCRATIC_CONFIG.rounds) {
    const domain = shuffledDomains[domainIndex % shuffledDomains.length];
    const available = byDomain.get(domain)?.filter(r => !session.some(s => s.id === r.id)) || [];
    
    if (available.length > 0) {
      const pick = available[Math.floor(Math.random() * available.length)];
      session.push(pick);
    }
    
    domainIndex++;
    
    // Safety: if we've cycled through domains twice and still don't have 5, just add any
    if (domainIndex > domains.length * 2 && session.length < SOCRATIC_CONFIG.rounds) {
      const remaining = SOCRATIC_ROUNDS.filter(r => !session.some(s => s.id === r.id));
      if (remaining.length > 0) {
        session.push(remaining[0]);
      }
    }
  }
  
  return session.slice(0, SOCRATIC_CONFIG.rounds);
}
