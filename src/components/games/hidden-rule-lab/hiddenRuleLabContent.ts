/**
 * HIDDEN RULE LAB — Content Bank
 * 
 * S2-IN (Insight) training game.
 * Abductive reasoning + hypothesis testing.
 * 
 * Each rule set defines:
 * - features: Visual feature types (2-3)
 * - ruleLogic: Hidden function mapping features to output
 * - hypotheses: 3 candidate rules (A, B, C)
 * - testCases: Pre-generated inputs with info gain scores
 */

export type Difficulty = "easy" | "medium" | "hard";
export type Hypothesis = "A" | "B" | "C";
export type RoundType = "discover" | "test" | "lock" | "apply";
export type ActIndex = 1 | 2 | 3;

// Feature value types
export type FeatureValue = string | number | boolean;

// Input object with visual features
export interface InputObject {
  id: string;
  features: Record<string, FeatureValue>;
  displayChips: { label: string; color: string }[];
}

// Output produced by hidden rule
export interface OutputResult {
  category: number; // 0-3 for categorical, 0/1 for binary
  label: string;
}

// Test option with information gain
export interface TestOption {
  input: InputObject;
  infoGainScore: number; // 0-100
  outputsByHypothesis: Record<Hypothesis, OutputResult>;
}

// Hypothesis definition
export interface HypothesisDef {
  id: Hypothesis;
  shortLabel: string; // e.g., "Size > 2"
  description: string;
  evaluate: (input: InputObject) => OutputResult;
}

// Example for discovery phase
export interface DiscoverExample {
  input: InputObject;
  output: OutputResult;
}

// Complete rule set for a session
export interface RuleSet {
  id: string;
  difficulty: Difficulty;
  name: string;
  featureTypes: string[];
  correctHypothesis: Hypothesis;
  hypotheses: HypothesisDef[];
  discoverExamples: DiscoverExample[];
  testOptions: TestOption[][];  // 4 arrays of 3 options each
  applyInputs: InputObject[];   // 3 final apply inputs
}

// XP configuration
export const XP_BASE: Record<Difficulty, number> = {
  easy: 20,
  medium: 25,
  hard: 30,
};

export const CLEAN_LOCK_BONUS = 5;

// Round configuration
export const SESSION_CONFIG = {
  totalRounds: 12,
  actsCount: 3,
  roundsPerAct: 4,
  idleHintMs: 18000,
};

// Feature chip colors
const CHIP_COLORS = {
  size: "bg-blue-500/20 text-blue-300",
  shape: "bg-violet-500/20 text-violet-300",
  pattern: "bg-amber-500/20 text-amber-300",
  weight: "bg-emerald-500/20 text-emerald-300",
  speed: "bg-rose-500/20 text-rose-300",
  count: "bg-cyan-500/20 text-cyan-300",
};

// Helper to create input object
function createInput(
  id: string,
  features: Record<string, FeatureValue>,
  featureTypes: string[]
): InputObject {
  const displayChips = featureTypes.map(ft => ({
    label: `${ft}: ${features[ft]}`,
    color: CHIP_COLORS[ft as keyof typeof CHIP_COLORS] || "bg-muted text-muted-foreground",
  }));
  return { id, features, displayChips };
}

// Output label generator
function outputLabel(cat: number): OutputResult {
  const labels = ["Alpha", "Beta", "Gamma", "Delta"];
  return { category: cat, label: labels[cat] || "Unknown" };
}

// ============================================
// EASY RULE SETS (2 features, simple logic)
// ============================================

const EASY_RULES: RuleSet[] = [
  {
    id: "easy-01",
    difficulty: "easy",
    name: "Size Threshold",
    featureTypes: ["size", "shape"],
    correctHypothesis: "B",
    hypotheses: [
      {
        id: "A",
        shortLabel: "Shape = Circle",
        description: "Output depends on whether shape is Circle",
        evaluate: (input) => outputLabel(input.features.shape === "circle" ? 1 : 0),
      },
      {
        id: "B",
        shortLabel: "Size > 2",
        description: "Output depends on whether size exceeds 2",
        evaluate: (input) => outputLabel((input.features.size as number) > 2 ? 1 : 0),
      },
      {
        id: "C",
        shortLabel: "Size + Shape",
        description: "Both size and shape must meet criteria",
        evaluate: (input) => outputLabel(
          (input.features.size as number) > 2 && input.features.shape === "circle" ? 1 : 0
        ),
      },
    ],
    discoverExamples: [
      { input: createInput("d1", { size: 3, shape: "circle" }, ["size", "shape"]), output: outputLabel(1) },
      { input: createInput("d2", { size: 1, shape: "circle" }, ["size", "shape"]), output: outputLabel(0) },
      { input: createInput("d3", { size: 4, shape: "square" }, ["size", "shape"]), output: outputLabel(1) },
      { input: createInput("d4", { size: 2, shape: "triangle" }, ["size", "shape"]), output: outputLabel(0) },
    ],
    testOptions: [
      [
        { input: createInput("t1a", { size: 3, shape: "square" }, ["size", "shape"]), infoGainScore: 85, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(1), C: outputLabel(0) } },
        { input: createInput("t1b", { size: 1, shape: "square" }, ["size", "shape"]), infoGainScore: 30, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(0), C: outputLabel(0) } },
        { input: createInput("t1c", { size: 5, shape: "circle" }, ["size", "shape"]), infoGainScore: 45, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(1), C: outputLabel(1) } },
      ],
      [
        { input: createInput("t2a", { size: 2, shape: "circle" }, ["size", "shape"]), infoGainScore: 75, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(0), C: outputLabel(0) } },
        { input: createInput("t2b", { size: 4, shape: "circle" }, ["size", "shape"]), infoGainScore: 35, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(1), C: outputLabel(1) } },
        { input: createInput("t2c", { size: 1, shape: "triangle" }, ["size", "shape"]), infoGainScore: 20, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(0), C: outputLabel(0) } },
      ],
      [
        { input: createInput("t3a", { size: 3, shape: "triangle" }, ["size", "shape"]), infoGainScore: 90, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(1), C: outputLabel(0) } },
        { input: createInput("t3b", { size: 2, shape: "square" }, ["size", "shape"]), infoGainScore: 40, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(0), C: outputLabel(0) } },
        { input: createInput("t3c", { size: 4, shape: "circle" }, ["size", "shape"]), infoGainScore: 25, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(1), C: outputLabel(1) } },
      ],
      [
        { input: createInput("t4a", { size: 1, shape: "circle" }, ["size", "shape"]), infoGainScore: 80, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(0), C: outputLabel(0) } },
        { input: createInput("t4b", { size: 5, shape: "square" }, ["size", "shape"]), infoGainScore: 50, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(1), C: outputLabel(0) } },
        { input: createInput("t4c", { size: 3, shape: "circle" }, ["size", "shape"]), infoGainScore: 30, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(1), C: outputLabel(1) } },
      ],
    ],
    applyInputs: [
      createInput("a1", { size: 4, shape: "triangle" }, ["size", "shape"]),
      createInput("a2", { size: 1, shape: "circle" }, ["size", "shape"]),
      createInput("a3", { size: 3, shape: "square" }, ["size", "shape"]),
    ],
  },
  {
    id: "easy-02",
    difficulty: "easy",
    name: "Pattern Match",
    featureTypes: ["pattern", "count"],
    correctHypothesis: "A",
    hypotheses: [
      {
        id: "A",
        shortLabel: "Striped Pattern",
        description: "Output depends on whether pattern is striped",
        evaluate: (input) => outputLabel(input.features.pattern === "striped" ? 1 : 0),
      },
      {
        id: "B",
        shortLabel: "Count > 3",
        description: "Output depends on whether count exceeds 3",
        evaluate: (input) => outputLabel((input.features.count as number) > 3 ? 1 : 0),
      },
      {
        id: "C",
        shortLabel: "Count Odd",
        description: "Output depends on whether count is odd",
        evaluate: (input) => outputLabel((input.features.count as number) % 2 === 1 ? 1 : 0),
      },
    ],
    discoverExamples: [
      { input: createInput("d1", { pattern: "striped", count: 2 }, ["pattern", "count"]), output: outputLabel(1) },
      { input: createInput("d2", { pattern: "dotted", count: 5 }, ["pattern", "count"]), output: outputLabel(0) },
      { input: createInput("d3", { pattern: "striped", count: 4 }, ["pattern", "count"]), output: outputLabel(1) },
      { input: createInput("d4", { pattern: "solid", count: 1 }, ["pattern", "count"]), output: outputLabel(0) },
    ],
    testOptions: [
      [
        { input: createInput("t1a", { pattern: "striped", count: 5 }, ["pattern", "count"]), infoGainScore: 40, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(1), C: outputLabel(1) } },
        { input: createInput("t1b", { pattern: "dotted", count: 4 }, ["pattern", "count"]), infoGainScore: 85, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(1), C: outputLabel(0) } },
        { input: createInput("t1c", { pattern: "solid", count: 2 }, ["pattern", "count"]), infoGainScore: 30, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(0), C: outputLabel(0) } },
      ],
      [
        { input: createInput("t2a", { pattern: "striped", count: 3 }, ["pattern", "count"]), infoGainScore: 75, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(0), C: outputLabel(1) } },
        { input: createInput("t2b", { pattern: "dotted", count: 6 }, ["pattern", "count"]), infoGainScore: 45, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(1), C: outputLabel(0) } },
        { input: createInput("t2c", { pattern: "solid", count: 4 }, ["pattern", "count"]), infoGainScore: 20, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(1), C: outputLabel(0) } },
      ],
      [
        { input: createInput("t3a", { pattern: "dotted", count: 3 }, ["pattern", "count"]), infoGainScore: 90, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(0), C: outputLabel(1) } },
        { input: createInput("t3b", { pattern: "striped", count: 2 }, ["pattern", "count"]), infoGainScore: 50, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(0), C: outputLabel(0) } },
        { input: createInput("t3c", { pattern: "solid", count: 5 }, ["pattern", "count"]), infoGainScore: 35, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(1), C: outputLabel(1) } },
      ],
      [
        { input: createInput("t4a", { pattern: "striped", count: 6 }, ["pattern", "count"]), infoGainScore: 70, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(1), C: outputLabel(0) } },
        { input: createInput("t4b", { pattern: "dotted", count: 1 }, ["pattern", "count"]), infoGainScore: 80, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(0), C: outputLabel(1) } },
        { input: createInput("t4c", { pattern: "solid", count: 3 }, ["pattern", "count"]), infoGainScore: 25, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(0), C: outputLabel(1) } },
      ],
    ],
    applyInputs: [
      createInput("a1", { pattern: "striped", count: 1 }, ["pattern", "count"]),
      createInput("a2", { pattern: "dotted", count: 2 }, ["pattern", "count"]),
      createInput("a3", { pattern: "striped", count: 6 }, ["pattern", "count"]),
    ],
  },
];

// ============================================
// MEDIUM RULE SETS (2-3 features, exceptions)
// ============================================

const MEDIUM_RULES: RuleSet[] = [
  {
    id: "med-01",
    difficulty: "medium",
    name: "Weighted Logic",
    featureTypes: ["weight", "speed", "shape"],
    correctHypothesis: "C",
    hypotheses: [
      {
        id: "A",
        shortLabel: "Weight Heavy",
        description: "Output 1 if weight is heavy",
        evaluate: (input) => outputLabel(input.features.weight === "heavy" ? 1 : 0),
      },
      {
        id: "B",
        shortLabel: "Speed Fast",
        description: "Output 1 if speed is fast",
        evaluate: (input) => outputLabel(input.features.speed === "fast" ? 1 : 0),
      },
      {
        id: "C",
        shortLabel: "Heavy OR Fast",
        description: "Output 1 if heavy OR fast (but not if shape is star)",
        evaluate: (input) => {
          if (input.features.shape === "star") return outputLabel(0);
          return outputLabel(
            input.features.weight === "heavy" || input.features.speed === "fast" ? 1 : 0
          );
        },
      },
    ],
    discoverExamples: [
      { input: createInput("d1", { weight: "heavy", speed: "slow", shape: "circle" }, ["weight", "speed", "shape"]), output: outputLabel(1) },
      { input: createInput("d2", { weight: "light", speed: "fast", shape: "square" }, ["weight", "speed", "shape"]), output: outputLabel(1) },
      { input: createInput("d3", { weight: "heavy", speed: "fast", shape: "star" }, ["weight", "speed", "shape"]), output: outputLabel(0) },
      { input: createInput("d4", { weight: "light", speed: "slow", shape: "triangle" }, ["weight", "speed", "shape"]), output: outputLabel(0) },
    ],
    testOptions: [
      [
        { input: createInput("t1a", { weight: "heavy", speed: "slow", shape: "star" }, ["weight", "speed", "shape"]), infoGainScore: 95, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(0), C: outputLabel(0) } },
        { input: createInput("t1b", { weight: "light", speed: "slow", shape: "circle" }, ["weight", "speed", "shape"]), infoGainScore: 30, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(0), C: outputLabel(0) } },
        { input: createInput("t1c", { weight: "heavy", speed: "fast", shape: "circle" }, ["weight", "speed", "shape"]), infoGainScore: 20, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(1), C: outputLabel(1) } },
      ],
      [
        { input: createInput("t2a", { weight: "light", speed: "fast", shape: "star" }, ["weight", "speed", "shape"]), infoGainScore: 90, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(1), C: outputLabel(0) } },
        { input: createInput("t2b", { weight: "heavy", speed: "slow", shape: "square" }, ["weight", "speed", "shape"]), infoGainScore: 45, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(0), C: outputLabel(1) } },
        { input: createInput("t2c", { weight: "light", speed: "slow", shape: "star" }, ["weight", "speed", "shape"]), infoGainScore: 25, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(0), C: outputLabel(0) } },
      ],
      [
        { input: createInput("t3a", { weight: "heavy", speed: "fast", shape: "triangle" }, ["weight", "speed", "shape"]), infoGainScore: 40, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(1), C: outputLabel(1) } },
        { input: createInput("t3b", { weight: "light", speed: "fast", shape: "circle" }, ["weight", "speed", "shape"]), infoGainScore: 80, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(1), C: outputLabel(1) } },
        { input: createInput("t3c", { weight: "heavy", speed: "slow", shape: "triangle" }, ["weight", "speed", "shape"]), infoGainScore: 55, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(0), C: outputLabel(1) } },
      ],
      [
        { input: createInput("t4a", { weight: "light", speed: "slow", shape: "star" }, ["weight", "speed", "shape"]), infoGainScore: 35, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(0), C: outputLabel(0) } },
        { input: createInput("t4b", { weight: "heavy", speed: "slow", shape: "star" }, ["weight", "speed", "shape"]), infoGainScore: 85, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(0), C: outputLabel(0) } },
        { input: createInput("t4c", { weight: "light", speed: "fast", shape: "triangle" }, ["weight", "speed", "shape"]), infoGainScore: 50, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(1), C: outputLabel(1) } },
      ],
    ],
    applyInputs: [
      createInput("a1", { weight: "heavy", speed: "fast", shape: "star" }, ["weight", "speed", "shape"]),
      createInput("a2", { weight: "light", speed: "fast", shape: "circle" }, ["weight", "speed", "shape"]),
      createInput("a3", { weight: "heavy", speed: "slow", shape: "triangle" }, ["weight", "speed", "shape"]),
    ],
  },
  {
    id: "med-02",
    difficulty: "medium",
    name: "Inverted Logic",
    featureTypes: ["size", "pattern"],
    correctHypothesis: "B",
    hypotheses: [
      {
        id: "A",
        shortLabel: "Large Size",
        description: "Output 1 if size is large",
        evaluate: (input) => outputLabel(input.features.size === "large" ? 1 : 0),
      },
      {
        id: "B",
        shortLabel: "Large, Invert if Dotted",
        description: "Output 1 if large, but invert if pattern is dotted",
        evaluate: (input) => {
          const isLarge = input.features.size === "large";
          const isDotted = input.features.pattern === "dotted";
          return outputLabel(isDotted ? (isLarge ? 0 : 1) : (isLarge ? 1 : 0));
        },
      },
      {
        id: "C",
        shortLabel: "Not Dotted",
        description: "Output 1 if pattern is not dotted",
        evaluate: (input) => outputLabel(input.features.pattern !== "dotted" ? 1 : 0),
      },
    ],
    discoverExamples: [
      { input: createInput("d1", { size: "large", pattern: "striped" }, ["size", "pattern"]), output: outputLabel(1) },
      { input: createInput("d2", { size: "large", pattern: "dotted" }, ["size", "pattern"]), output: outputLabel(0) },
      { input: createInput("d3", { size: "small", pattern: "dotted" }, ["size", "pattern"]), output: outputLabel(1) },
      { input: createInput("d4", { size: "small", pattern: "solid" }, ["size", "pattern"]), output: outputLabel(0) },
    ],
    testOptions: [
      [
        { input: createInput("t1a", { size: "medium", pattern: "dotted" }, ["size", "pattern"]), infoGainScore: 85, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(1), C: outputLabel(0) } },
        { input: createInput("t1b", { size: "large", pattern: "solid" }, ["size", "pattern"]), infoGainScore: 40, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(1), C: outputLabel(1) } },
        { input: createInput("t1c", { size: "small", pattern: "striped" }, ["size", "pattern"]), infoGainScore: 30, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(0), C: outputLabel(1) } },
      ],
      [
        { input: createInput("t2a", { size: "small", pattern: "solid" }, ["size", "pattern"]), infoGainScore: 90, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(0), C: outputLabel(1) } },
        { input: createInput("t2b", { size: "medium", pattern: "striped" }, ["size", "pattern"]), infoGainScore: 35, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(0), C: outputLabel(1) } },
        { input: createInput("t2c", { size: "large", pattern: "dotted" }, ["size", "pattern"]), infoGainScore: 50, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(0), C: outputLabel(0) } },
      ],
      [
        { input: createInput("t3a", { size: "medium", pattern: "solid" }, ["size", "pattern"]), infoGainScore: 75, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(0), C: outputLabel(1) } },
        { input: createInput("t3b", { size: "small", pattern: "dotted" }, ["size", "pattern"]), infoGainScore: 80, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(1), C: outputLabel(0) } },
        { input: createInput("t3c", { size: "large", pattern: "striped" }, ["size", "pattern"]), infoGainScore: 25, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(1), C: outputLabel(1) } },
      ],
      [
        { input: createInput("t4a", { size: "large", pattern: "solid" }, ["size", "pattern"]), infoGainScore: 70, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(1), C: outputLabel(1) } },
        { input: createInput("t4b", { size: "medium", pattern: "dotted" }, ["size", "pattern"]), infoGainScore: 85, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(1), C: outputLabel(0) } },
        { input: createInput("t4c", { size: "small", pattern: "striped" }, ["size", "pattern"]), infoGainScore: 45, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(0), C: outputLabel(1) } },
      ],
    ],
    applyInputs: [
      createInput("a1", { size: "large", pattern: "dotted" }, ["size", "pattern"]),
      createInput("a2", { size: "small", pattern: "solid" }, ["size", "pattern"]),
      createInput("a3", { size: "medium", pattern: "dotted" }, ["size", "pattern"]),
    ],
  },
];

// ============================================
// HARD RULE SETS (confounder traps)
// ============================================

const HARD_RULES: RuleSet[] = [
  {
    id: "hard-01",
    difficulty: "hard",
    name: "Confounder Trap",
    featureTypes: ["size", "shape", "pattern"],
    correctHypothesis: "C",
    hypotheses: [
      {
        id: "A",
        shortLabel: "Pattern Striped",
        description: "Output 1 if pattern is striped (CONFOUNDER - correlates in early examples)",
        evaluate: (input) => outputLabel(input.features.pattern === "striped" ? 1 : 0),
      },
      {
        id: "B",
        shortLabel: "Size Large",
        description: "Output 1 if size is large",
        evaluate: (input) => outputLabel(input.features.size === "large" ? 1 : 0),
      },
      {
        id: "C",
        shortLabel: "Shape Circle",
        description: "Output 1 if shape is circle (TRUE RULE)",
        evaluate: (input) => outputLabel(input.features.shape === "circle" ? 1 : 0),
      },
    ],
    // Early examples show striped correlating with output (confounder)
    discoverExamples: [
      { input: createInput("d1", { size: "large", shape: "circle", pattern: "striped" }, ["size", "shape", "pattern"]), output: outputLabel(1) },
      { input: createInput("d2", { size: "small", shape: "square", pattern: "solid" }, ["size", "shape", "pattern"]), output: outputLabel(0) },
      { input: createInput("d3", { size: "medium", shape: "circle", pattern: "striped" }, ["size", "shape", "pattern"]), output: outputLabel(1) },
      { input: createInput("d4", { size: "large", shape: "triangle", pattern: "solid" }, ["size", "shape", "pattern"]), output: outputLabel(0) },
    ],
    testOptions: [
      // Test round 1: Circle with solid pattern breaks confounder
      [
        { input: createInput("t1a", { size: "small", shape: "circle", pattern: "solid" }, ["size", "shape", "pattern"]), infoGainScore: 95, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(0), C: outputLabel(1) } },
        { input: createInput("t1b", { size: "large", shape: "square", pattern: "striped" }, ["size", "shape", "pattern"]), infoGainScore: 80, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(1), C: outputLabel(0) } },
        { input: createInput("t1c", { size: "medium", shape: "triangle", pattern: "dotted" }, ["size", "shape", "pattern"]), infoGainScore: 25, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(0), C: outputLabel(0) } },
      ],
      [
        { input: createInput("t2a", { size: "large", shape: "triangle", pattern: "striped" }, ["size", "shape", "pattern"]), infoGainScore: 90, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(1), C: outputLabel(0) } },
        { input: createInput("t2b", { size: "small", shape: "circle", pattern: "dotted" }, ["size", "shape", "pattern"]), infoGainScore: 85, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(0), C: outputLabel(1) } },
        { input: createInput("t2c", { size: "medium", shape: "square", pattern: "solid" }, ["size", "shape", "pattern"]), infoGainScore: 20, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(0), C: outputLabel(0) } },
      ],
      [
        { input: createInput("t3a", { size: "small", shape: "square", pattern: "striped" }, ["size", "shape", "pattern"]), infoGainScore: 88, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(0), C: outputLabel(0) } },
        { input: createInput("t3b", { size: "large", shape: "circle", pattern: "dotted" }, ["size", "shape", "pattern"]), infoGainScore: 75, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(1), C: outputLabel(1) } },
        { input: createInput("t3c", { size: "medium", shape: "triangle", pattern: "striped" }, ["size", "shape", "pattern"]), infoGainScore: 30, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(0), C: outputLabel(0) } },
      ],
      [
        { input: createInput("t4a", { size: "medium", shape: "circle", pattern: "solid" }, ["size", "shape", "pattern"]), infoGainScore: 92, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(0), C: outputLabel(1) } },
        { input: createInput("t4b", { size: "large", shape: "square", pattern: "dotted" }, ["size", "shape", "pattern"]), infoGainScore: 45, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(1), C: outputLabel(0) } },
        { input: createInput("t4c", { size: "small", shape: "triangle", pattern: "striped" }, ["size", "shape", "pattern"]), infoGainScore: 35, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(0), C: outputLabel(0) } },
      ],
    ],
    applyInputs: [
      createInput("a1", { size: "small", shape: "circle", pattern: "solid" }, ["size", "shape", "pattern"]),
      createInput("a2", { size: "large", shape: "triangle", pattern: "striped" }, ["size", "shape", "pattern"]),
      createInput("a3", { size: "medium", shape: "square", pattern: "dotted" }, ["size", "shape", "pattern"]),
    ],
  },
  {
    id: "hard-02",
    difficulty: "hard",
    name: "XOR Trap",
    featureTypes: ["speed", "weight"],
    correctHypothesis: "B",
    hypotheses: [
      {
        id: "A",
        shortLabel: "Fast Speed",
        description: "Output 1 if speed is fast",
        evaluate: (input) => outputLabel(input.features.speed === "fast" ? 1 : 0),
      },
      {
        id: "B",
        shortLabel: "Fast XOR Heavy",
        description: "Output 1 if exactly one of: fast OR heavy (not both, not neither)",
        evaluate: (input) => {
          const isFast = input.features.speed === "fast";
          const isHeavy = input.features.weight === "heavy";
          return outputLabel((isFast && !isHeavy) || (!isFast && isHeavy) ? 1 : 0);
        },
      },
      {
        id: "C",
        shortLabel: "Heavy Weight",
        description: "Output 1 if weight is heavy",
        evaluate: (input) => outputLabel(input.features.weight === "heavy" ? 1 : 0),
      },
    ],
    discoverExamples: [
      { input: createInput("d1", { speed: "fast", weight: "light" }, ["speed", "weight"]), output: outputLabel(1) },
      { input: createInput("d2", { speed: "slow", weight: "heavy" }, ["speed", "weight"]), output: outputLabel(1) },
      { input: createInput("d3", { speed: "fast", weight: "heavy" }, ["speed", "weight"]), output: outputLabel(0) },
      { input: createInput("d4", { speed: "slow", weight: "light" }, ["speed", "weight"]), output: outputLabel(0) },
    ],
    testOptions: [
      [
        { input: createInput("t1a", { speed: "medium", weight: "heavy" }, ["speed", "weight"]), infoGainScore: 85, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(1), C: outputLabel(1) } },
        { input: createInput("t1b", { speed: "fast", weight: "medium" }, ["speed", "weight"]), infoGainScore: 80, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(1), C: outputLabel(0) } },
        { input: createInput("t1c", { speed: "slow", weight: "light" }, ["speed", "weight"]), infoGainScore: 30, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(0), C: outputLabel(0) } },
      ],
      [
        { input: createInput("t2a", { speed: "medium", weight: "light" }, ["speed", "weight"]), infoGainScore: 90, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(0), C: outputLabel(0) } },
        { input: createInput("t2b", { speed: "fast", weight: "heavy" }, ["speed", "weight"]), infoGainScore: 95, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(0), C: outputLabel(1) } },
        { input: createInput("t2c", { speed: "slow", weight: "medium" }, ["speed", "weight"]), infoGainScore: 25, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(0), C: outputLabel(0) } },
      ],
      [
        { input: createInput("t3a", { speed: "medium", weight: "medium" }, ["speed", "weight"]), infoGainScore: 70, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(0), C: outputLabel(0) } },
        { input: createInput("t3b", { speed: "fast", weight: "light" }, ["speed", "weight"]), infoGainScore: 75, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(1), C: outputLabel(0) } },
        { input: createInput("t3c", { speed: "slow", weight: "heavy" }, ["speed", "weight"]), infoGainScore: 80, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(1), C: outputLabel(1) } },
      ],
      [
        { input: createInput("t4a", { speed: "fast", weight: "heavy" }, ["speed", "weight"]), infoGainScore: 92, outputsByHypothesis: { A: outputLabel(1), B: outputLabel(0), C: outputLabel(1) } },
        { input: createInput("t4b", { speed: "slow", weight: "light" }, ["speed", "weight"]), infoGainScore: 35, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(0), C: outputLabel(0) } },
        { input: createInput("t4c", { speed: "medium", weight: "heavy" }, ["speed", "weight"]), infoGainScore: 65, outputsByHypothesis: { A: outputLabel(0), B: outputLabel(1), C: outputLabel(1) } },
      ],
    ],
    applyInputs: [
      createInput("a1", { speed: "fast", weight: "heavy" }, ["speed", "weight"]),
      createInput("a2", { speed: "slow", weight: "heavy" }, ["speed", "weight"]),
      createInput("a3", { speed: "fast", weight: "light" }, ["speed", "weight"]),
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

// ============================================
// ANTI-REPETITION HASH GENERATION
// ============================================

/**
 * Generate combo hash parameters for Hidden Rule Lab session.
 * Used by anti-repetition engine to detect duplicate sessions.
 */
export function getSessionHashParams(
  ruleSet: RuleSet,
  difficulty: Difficulty
): { stimulusIds: string[]; ruleParams: Record<string, any>; difficulty: string } {
  return {
    stimulusIds: [ruleSet.id],
    ruleParams: { correctHypothesis: ruleSet.correctHypothesis },
    difficulty,
  };
}
