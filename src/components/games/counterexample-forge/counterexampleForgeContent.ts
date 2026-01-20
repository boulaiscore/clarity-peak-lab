/**
 * COUNTEREXAMPLE FORGE — Content Bank
 * 
 * S2-IN (Insight) training game.
 * Disprove rules, patch them, stress-test.
 * 
 * Each rule set has:
 * - claim: Proposed rule with features
 * - groundTruth: Actual hidden mechanism
 * - breakCases: Test cases for Act I (with one that breaks claim)
 * - patches: Two patch options
 * - stressCases: Test cases for Act III with infoGain scores
 */

export type Difficulty = "easy" | "medium" | "hard";
export type ActIndex = 1 | 2 | 3;
export type RoundType = "break" | "patch_choice" | "stress";

// Feature chip for visual display
export interface FeatureChip {
  label: string;
  value: string;
  color: string;
}

// Test case for breaking/stress-testing
export interface TestCase {
  id: string;
  features: FeatureChip[];
  actualOutcome: "success" | "failure";
  claimPredicts: "success" | "failure";
  isCounterexample: boolean;
  infoGainScore: number; // 0-100
}

// Patch option
export interface PatchOption {
  id: "patch1" | "patch2";
  description: string;
  chips: FeatureChip[];
  isBetter: boolean;
}

// Complete rule set for a session
export interface RuleSet {
  id: string;
  difficulty: Difficulty;
  name: string;
  
  // Original claim
  claimChips: FeatureChip[];
  claimOutcome: string;
  claimDescription: string;
  
  // Break cases for Act I (4 rounds, 3 options each)
  breakCases: TestCase[][];
  
  // Patch options for Act II
  patches: PatchOption[];
  patchedClaimChips: FeatureChip[];
  patchedClaimDescription: string;
  
  // Stress cases for Act III (3 rounds, 3 options each)
  stressCases: TestCase[][];
}

// XP configuration
export const XP_BASE: Record<Difficulty, number> = {
  easy: 20,
  medium: 25,
  hard: 30,
};

export const CLEAN_BREAK_BONUS = 5;

// Session configuration
export const SESSION_CONFIG = {
  totalRounds: 10,
  actIRounds: 4,
  actIIRounds: 3,
  actIIIRounds: 3,
  maxBreakAttempts: 2,
  idleHintMs: 18000,
};

// Chip colors
const CHIP_COLORS = {
  size: "bg-blue-500/20 text-blue-300",
  speed: "bg-emerald-500/20 text-emerald-300",
  type: "bg-violet-500/20 text-violet-300",
  quality: "bg-amber-500/20 text-amber-300",
  source: "bg-rose-500/20 text-rose-300",
  duration: "bg-cyan-500/20 text-cyan-300",
  verified: "bg-green-500/20 text-green-300",
  category: "bg-purple-500/20 text-purple-300",
};

function chip(label: string, value: string, colorKey: keyof typeof CHIP_COLORS): FeatureChip {
  return { label, value, color: CHIP_COLORS[colorKey] };
}

// ============================================
// EASY RULES (2 features, simple exception)
// ============================================

const EASY_RULES: RuleSet[] = [
  {
    id: "easy-01",
    difficulty: "easy",
    name: "Size-Speed Rule",
    claimChips: [chip("Size", "Large", "size"), chip("Speed", "Fast", "speed")],
    claimOutcome: "Success",
    claimDescription: "Large + Fast → Success",
    
    breakCases: [
      // Round 1
      [
        { id: "b1a", features: [chip("Size", "Large", "size"), chip("Speed", "Fast", "speed")], actualOutcome: "success", claimPredicts: "success", isCounterexample: false, infoGainScore: 20 },
        { id: "b1b", features: [chip("Size", "Large", "size"), chip("Speed", "Slow", "speed")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 30 },
        { id: "b1c", features: [chip("Size", "Small", "size"), chip("Speed", "Fast", "speed")], actualOutcome: "success", claimPredicts: "failure", isCounterexample: true, infoGainScore: 90 },
      ],
      // Round 2
      [
        { id: "b2a", features: [chip("Size", "Medium", "size"), chip("Speed", "Fast", "speed")], actualOutcome: "success", claimPredicts: "failure", isCounterexample: true, infoGainScore: 85 },
        { id: "b2b", features: [chip("Size", "Large", "size"), chip("Speed", "Medium", "speed")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 25 },
        { id: "b2c", features: [chip("Size", "Large", "size"), chip("Speed", "Fast", "speed")], actualOutcome: "success", claimPredicts: "success", isCounterexample: false, infoGainScore: 15 },
      ],
      // Round 3
      [
        { id: "b3a", features: [chip("Size", "Small", "size"), chip("Speed", "Slow", "speed")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 20 },
        { id: "b3b", features: [chip("Size", "Medium", "size"), chip("Speed", "Medium", "speed")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 30 },
        { id: "b3c", features: [chip("Size", "Small", "size"), chip("Speed", "Fast", "speed")], actualOutcome: "success", claimPredicts: "failure", isCounterexample: true, infoGainScore: 90 },
      ],
      // Round 4
      [
        { id: "b4a", features: [chip("Size", "Large", "size"), chip("Speed", "Fast", "speed")], actualOutcome: "success", claimPredicts: "success", isCounterexample: false, infoGainScore: 15 },
        { id: "b4b", features: [chip("Size", "Medium", "size"), chip("Speed", "Fast", "speed")], actualOutcome: "success", claimPredicts: "failure", isCounterexample: true, infoGainScore: 88 },
        { id: "b4c", features: [chip("Size", "Small", "size"), chip("Speed", "Medium", "speed")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 25 },
      ],
    ],
    
    patches: [
      { id: "patch1", description: "Size doesn't matter — only Speed Fast", chips: [chip("Speed", "Fast", "speed")], isBetter: true },
      { id: "patch2", description: "Add Medium Size as valid", chips: [chip("Size", "Large OR Medium", "size"), chip("Speed", "Fast", "speed")], isBetter: false },
    ],
    patchedClaimChips: [chip("Speed", "Fast", "speed")],
    patchedClaimDescription: "Fast → Success (Size irrelevant)",
    
    stressCases: [
      // Round 8
      [
        { id: "s1a", features: [chip("Size", "Tiny", "size"), chip("Speed", "Fast", "speed")], actualOutcome: "success", claimPredicts: "success", isCounterexample: false, infoGainScore: 85 },
        { id: "s1b", features: [chip("Size", "Large", "size"), chip("Speed", "Fast", "speed")], actualOutcome: "success", claimPredicts: "success", isCounterexample: false, infoGainScore: 20 },
        { id: "s1c", features: [chip("Size", "Medium", "size"), chip("Speed", "Slow", "speed")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 30 },
      ],
      // Round 9
      [
        { id: "s2a", features: [chip("Size", "Large", "size"), chip("Speed", "Medium", "speed")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 40 },
        { id: "s2b", features: [chip("Size", "Small", "size"), chip("Speed", "Fast", "speed")], actualOutcome: "success", claimPredicts: "success", isCounterexample: false, infoGainScore: 75 },
        { id: "s2c", features: [chip("Size", "Tiny", "size"), chip("Speed", "Slow", "speed")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 35 },
      ],
      // Round 10
      [
        { id: "s3a", features: [chip("Size", "Medium", "size"), chip("Speed", "Fast", "speed")], actualOutcome: "success", claimPredicts: "success", isCounterexample: false, infoGainScore: 25 },
        { id: "s3b", features: [chip("Size", "Giant", "size"), chip("Speed", "Slow", "speed")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 80 },
        { id: "s3c", features: [chip("Size", "Small", "size"), chip("Speed", "Medium", "speed")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 45 },
      ],
    ],
  },
];

// ============================================
// MEDIUM RULES (2-3 features, rare interaction)
// ============================================

const MEDIUM_RULES: RuleSet[] = [
  {
    id: "med-01",
    difficulty: "medium",
    name: "Quality-Source Rule",
    claimChips: [chip("Quality", "Premium", "quality"), chip("Source", "Verified", "source")],
    claimOutcome: "Success",
    claimDescription: "Premium + Verified → Success",
    
    breakCases: [
      [
        { id: "b1a", features: [chip("Quality", "Premium", "quality"), chip("Source", "Verified", "source"), chip("Duration", "Short", "duration")], actualOutcome: "failure", claimPredicts: "success", isCounterexample: true, infoGainScore: 92 },
        { id: "b1b", features: [chip("Quality", "Premium", "quality"), chip("Source", "Verified", "source"), chip("Duration", "Long", "duration")], actualOutcome: "success", claimPredicts: "success", isCounterexample: false, infoGainScore: 25 },
        { id: "b1c", features: [chip("Quality", "Standard", "quality"), chip("Source", "Verified", "source"), chip("Duration", "Medium", "duration")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 30 },
      ],
      [
        { id: "b2a", features: [chip("Quality", "Premium", "quality"), chip("Source", "Unverified", "source"), chip("Duration", "Long", "duration")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 35 },
        { id: "b2b", features: [chip("Quality", "Premium", "quality"), chip("Source", "Verified", "source"), chip("Duration", "Short", "duration")], actualOutcome: "failure", claimPredicts: "success", isCounterexample: true, infoGainScore: 90 },
        { id: "b2c", features: [chip("Quality", "Premium", "quality"), chip("Source", "Verified", "source"), chip("Duration", "Medium", "duration")], actualOutcome: "success", claimPredicts: "success", isCounterexample: false, infoGainScore: 20 },
      ],
      [
        { id: "b3a", features: [chip("Quality", "Standard", "quality"), chip("Source", "Verified", "source"), chip("Duration", "Long", "duration")], actualOutcome: "success", claimPredicts: "failure", isCounterexample: true, infoGainScore: 88 },
        { id: "b3b", features: [chip("Quality", "Budget", "quality"), chip("Source", "Unverified", "source"), chip("Duration", "Short", "duration")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 15 },
        { id: "b3c", features: [chip("Quality", "Premium", "quality"), chip("Source", "Verified", "source"), chip("Duration", "Long", "duration")], actualOutcome: "success", claimPredicts: "success", isCounterexample: false, infoGainScore: 25 },
      ],
      [
        { id: "b4a", features: [chip("Quality", "Standard", "quality"), chip("Source", "Verified", "source"), chip("Duration", "Long", "duration")], actualOutcome: "success", claimPredicts: "failure", isCounterexample: true, infoGainScore: 85 },
        { id: "b4b", features: [chip("Quality", "Premium", "quality"), chip("Source", "Verified", "source"), chip("Duration", "Medium", "duration")], actualOutcome: "success", claimPredicts: "success", isCounterexample: false, infoGainScore: 20 },
        { id: "b4c", features: [chip("Quality", "Budget", "quality"), chip("Source", "Verified", "source"), chip("Duration", "Medium", "duration")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 30 },
      ],
    ],
    
    patches: [
      { id: "patch1", description: "Verified + Long Duration (Quality irrelevant)", chips: [chip("Source", "Verified", "source"), chip("Duration", "Long", "duration")], isBetter: true },
      { id: "patch2", description: "Add Duration ≠ Short condition", chips: [chip("Quality", "Premium", "quality"), chip("Source", "Verified", "source"), chip("Duration", "NOT Short", "duration")], isBetter: false },
    ],
    patchedClaimChips: [chip("Source", "Verified", "source"), chip("Duration", "Long", "duration")],
    patchedClaimDescription: "Verified + Long → Success",
    
    stressCases: [
      [
        { id: "s1a", features: [chip("Quality", "Budget", "quality"), chip("Source", "Verified", "source"), chip("Duration", "Long", "duration")], actualOutcome: "success", claimPredicts: "success", isCounterexample: false, infoGainScore: 90 },
        { id: "s1b", features: [chip("Quality", "Premium", "quality"), chip("Source", "Verified", "source"), chip("Duration", "Long", "duration")], actualOutcome: "success", claimPredicts: "success", isCounterexample: false, infoGainScore: 25 },
        { id: "s1c", features: [chip("Quality", "Standard", "quality"), chip("Source", "Unverified", "source"), chip("Duration", "Long", "duration")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 40 },
      ],
      [
        { id: "s2a", features: [chip("Quality", "Premium", "quality"), chip("Source", "Verified", "source"), chip("Duration", "Short", "duration")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 75 },
        { id: "s2b", features: [chip("Quality", "Standard", "quality"), chip("Source", "Verified", "source"), chip("Duration", "Long", "duration")], actualOutcome: "success", claimPredicts: "success", isCounterexample: false, infoGainScore: 80 },
        { id: "s2c", features: [chip("Quality", "Premium", "quality"), chip("Source", "Verified", "source"), chip("Duration", "Medium", "duration")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 35 },
      ],
      [
        { id: "s3a", features: [chip("Quality", "Budget", "quality"), chip("Source", "Verified", "source"), chip("Duration", "Long", "duration")], actualOutcome: "success", claimPredicts: "success", isCounterexample: false, infoGainScore: 85 },
        { id: "s3b", features: [chip("Quality", "Premium", "quality"), chip("Source", "Unverified", "source"), chip("Duration", "Long", "duration")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 45 },
        { id: "s3c", features: [chip("Quality", "Standard", "quality"), chip("Source", "Verified", "source"), chip("Duration", "Medium", "duration")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 50 },
      ],
    ],
  },
];

// ============================================
// HARD RULES (decoy feature trap)
// ============================================

const HARD_RULES: RuleSet[] = [
  {
    id: "hard-01",
    difficulty: "hard",
    name: "Type-Category Trap",
    // Decoy: Type correlates early but Category is the real driver
    claimChips: [chip("Type", "Premium", "type"), chip("Verified", "Yes", "verified")],
    claimOutcome: "Success",
    claimDescription: "Premium Type + Verified → Success",
    
    breakCases: [
      // Early cases show Type correlation (decoy)
      [
        { id: "b1a", features: [chip("Type", "Premium", "type"), chip("Verified", "Yes", "verified"), chip("Category", "A", "category")], actualOutcome: "success", claimPredicts: "success", isCounterexample: false, infoGainScore: 30 },
        { id: "b1b", features: [chip("Type", "Standard", "type"), chip("Verified", "Yes", "verified"), chip("Category", "A", "category")], actualOutcome: "success", claimPredicts: "failure", isCounterexample: true, infoGainScore: 95 },
        { id: "b1c", features: [chip("Type", "Budget", "type"), chip("Verified", "No", "verified"), chip("Category", "B", "category")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 20 },
      ],
      [
        { id: "b2a", features: [chip("Type", "Premium", "type"), chip("Verified", "Yes", "verified"), chip("Category", "B", "category")], actualOutcome: "failure", claimPredicts: "success", isCounterexample: true, infoGainScore: 92 },
        { id: "b2b", features: [chip("Type", "Premium", "type"), chip("Verified", "Yes", "verified"), chip("Category", "A", "category")], actualOutcome: "success", claimPredicts: "success", isCounterexample: false, infoGainScore: 25 },
        { id: "b2c", features: [chip("Type", "Standard", "type"), chip("Verified", "No", "verified"), chip("Category", "B", "category")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 15 },
      ],
      [
        { id: "b3a", features: [chip("Type", "Budget", "type"), chip("Verified", "Yes", "verified"), chip("Category", "A", "category")], actualOutcome: "success", claimPredicts: "failure", isCounterexample: true, infoGainScore: 90 },
        { id: "b3b", features: [chip("Type", "Premium", "type"), chip("Verified", "No", "verified"), chip("Category", "A", "category")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 40 },
        { id: "b3c", features: [chip("Type", "Premium", "type"), chip("Verified", "Yes", "verified"), chip("Category", "A", "category")], actualOutcome: "success", claimPredicts: "success", isCounterexample: false, infoGainScore: 20 },
      ],
      [
        { id: "b4a", features: [chip("Type", "Standard", "type"), chip("Verified", "Yes", "verified"), chip("Category", "A", "category")], actualOutcome: "success", claimPredicts: "failure", isCounterexample: true, infoGainScore: 88 },
        { id: "b4b", features: [chip("Type", "Premium", "type"), chip("Verified", "Yes", "verified"), chip("Category", "B", "category")], actualOutcome: "failure", claimPredicts: "success", isCounterexample: true, infoGainScore: 90 },
        { id: "b4c", features: [chip("Type", "Budget", "type"), chip("Verified", "No", "verified"), chip("Category", "B", "category")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 15 },
      ],
    ],
    
    patches: [
      { id: "patch1", description: "Category A + Verified (Type irrelevant)", chips: [chip("Category", "A", "category"), chip("Verified", "Yes", "verified")], isBetter: true },
      { id: "patch2", description: "Premium OR Standard + Verified", chips: [chip("Type", "Premium OR Standard", "type"), chip("Verified", "Yes", "verified")], isBetter: false },
    ],
    patchedClaimChips: [chip("Category", "A", "category"), chip("Verified", "Yes", "verified")],
    patchedClaimDescription: "Category A + Verified → Success",
    
    stressCases: [
      [
        { id: "s1a", features: [chip("Type", "Budget", "type"), chip("Verified", "Yes", "verified"), chip("Category", "A", "category")], actualOutcome: "success", claimPredicts: "success", isCounterexample: false, infoGainScore: 95 },
        { id: "s1b", features: [chip("Type", "Premium", "type"), chip("Verified", "Yes", "verified"), chip("Category", "A", "category")], actualOutcome: "success", claimPredicts: "success", isCounterexample: false, infoGainScore: 25 },
        { id: "s1c", features: [chip("Type", "Standard", "type"), chip("Verified", "No", "verified"), chip("Category", "A", "category")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 50 },
      ],
      [
        { id: "s2a", features: [chip("Type", "Premium", "type"), chip("Verified", "Yes", "verified"), chip("Category", "B", "category")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 85 },
        { id: "s2b", features: [chip("Type", "Standard", "type"), chip("Verified", "Yes", "verified"), chip("Category", "A", "category")], actualOutcome: "success", claimPredicts: "success", isCounterexample: false, infoGainScore: 70 },
        { id: "s2c", features: [chip("Type", "Budget", "type"), chip("Verified", "Yes", "verified"), chip("Category", "B", "category")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 40 },
      ],
      [
        { id: "s3a", features: [chip("Type", "Budget", "type"), chip("Verified", "Yes", "verified"), chip("Category", "A", "category")], actualOutcome: "success", claimPredicts: "success", isCounterexample: false, infoGainScore: 90 },
        { id: "s3b", features: [chip("Type", "Premium", "type"), chip("Verified", "No", "verified"), chip("Category", "A", "category")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 65 },
        { id: "s3c", features: [chip("Type", "Standard", "type"), chip("Verified", "Yes", "verified"), chip("Category", "B", "category")], actualOutcome: "failure", claimPredicts: "failure", isCounterexample: false, infoGainScore: 55 },
      ],
    ],
  },
];

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

export function generateSession(difficulty: Difficulty): RuleSet {
  let pool: RuleSet[];
  switch (difficulty) {
    case "easy":
      pool = EASY_RULES;
      break;
    case "medium":
      pool = MEDIUM_RULES;
      break;
    case "hard":
      pool = HARD_RULES;
      break;
  }
  return shuffle(pool)[0];
}

export function getAllRuleSets(): RuleSet[] {
  return [...EASY_RULES, ...MEDIUM_RULES, ...HARD_RULES];
}
