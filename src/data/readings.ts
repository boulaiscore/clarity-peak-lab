/**
 * Reading & Books Dataset for Cognitive Permissioning
 * 
 * NeuroLoop principle: "If it requires understanding, it consumes cognitive resources."
 * Reading can feel relaxing emotionally, but it is usually cognitive work.
 * 
 * CATEGORIES:
 * - RECOVERY_SAFE: Narrative/literary reading that does NOT require concept retention
 * - NON_FICTION: Reading that requires understanding concepts, holding arguments, drawing inferences
 * - BOOK: Long-form reading requiring continuity, memory of previous material, sustained focus
 */

export type ReadingType = "RECOVERY_SAFE" | "NON_FICTION" | "BOOK";
export type ReadingDemand = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export interface Reading {
  id: string;
  title: string;
  author?: string;
  readingType: ReadingType;
  demand: ReadingDemand;
  durationMinutes: number;
  description: string;
  url?: string;
  source?: string;
}

// Demand penalty values for fitScore calculation (same as podcasts)
export const DEMAND_PENALTY: Record<ReadingDemand, number> = {
  LOW: 5,
  MEDIUM: 12,
  HIGH: 18,
  VERY_HIGH: 28,
};

// Category-specific eligibility thresholds
export const READING_THRESHOLDS = {
  // Recovery-Safe: Only needs S1Buffer, can have low Sharpness/Readiness
  RECOVERY_SAFE: {
    LOW: { s1Buffer: 50 },
  },
  
  // Non-Fiction: Requires S2 capacity + S1 buffer
  // If Sharpness < 60 → withhold ALL non-fiction
  NON_FICTION: {
    LOW: { s1Buffer: 50, s2Capacity: 55, sharpness: 60 },
    MEDIUM: { s1Buffer: 50, s2Capacity: 65, sharpness: 60 },
    HIGH: { s1Buffer: 55, s2Capacity: 72, sharpness: 68 },
  },
  
  // Books: Highest thresholds, requires sustained cognitive load
  // If Readiness < 55 → withhold ALL books
  // If Sharpness < 65 → withhold ALL books
  BOOK: {
    MEDIUM: { s1Buffer: 55, s2Capacity: 68, sharpness: 65, readiness: 55 },
    HIGH: { s1Buffer: 58, s2Capacity: 75, sharpness: 70, readiness: 55 },
    VERY_HIGH: { s1Buffer: 60, s2Capacity: 80, sharpness: 75, readiness: 55 },
  },
} as const;

// Global thresholds that override individual reading eligibility
export const GLOBAL_READING_OVERRIDES = {
  // If Sharpness < 60, withhold ALL non-fiction
  NON_FICTION_MIN_SHARPNESS: 60,
  // If Readiness < 55, withhold ALL books
  BOOK_MIN_READINESS: 55,
  // If Sharpness < 65, withhold ALL books
  BOOK_MIN_SHARPNESS: 65,
};

// Curated reading library
export const READINGS: Reading[] = [
  // ==================== RECOVERY-SAFE READING ====================
  // Narrative or literary reading that does NOT require concept retention
  {
    id: "fiction-meditations-aurelius",
    title: "Meditations (Narrative Excerpts)",
    author: "Marcus Aurelius",
    readingType: "RECOVERY_SAFE",
    demand: "LOW",
    durationMinutes: 15,
    description: "Reflective passages for decompression. No concept retention required.",
    source: "Public Domain",
  },
  {
    id: "fiction-seneca-letters",
    title: "Letters from a Stoic (Selected)",
    author: "Seneca",
    readingType: "RECOVERY_SAFE",
    demand: "LOW",
    durationMinutes: 12,
    description: "Literary philosophy for emotional regulation, not analytical study.",
    source: "Public Domain",
  },
  {
    id: "fiction-walden-excerpts",
    title: "Walden (Nature Passages)",
    author: "Henry David Thoreau",
    readingType: "RECOVERY_SAFE",
    demand: "LOW",
    durationMinutes: 10,
    description: "Contemplative prose for mental rest. Drop at any time without loss.",
    source: "Public Domain",
  },
  
  // ==================== NON-FICTION READING ====================
  // Reading that requires understanding concepts, holding arguments, drawing inferences
  {
    id: "nf-attention-economy",
    title: "The Attention Merchants (Essay)",
    author: "Tim Wu",
    readingType: "NON_FICTION",
    demand: "LOW",
    durationMinutes: 12,
    description: "How attention became a commodity. Requires concept retention.",
    source: "Columbia Law School",
    url: "https://timwu.org/AttentionMerchants.pdf",
  },
  {
    id: "nf-bounded-rationality",
    title: "Bounded Rationality in Practice",
    author: "Herbert Simon",
    readingType: "NON_FICTION",
    demand: "MEDIUM",
    durationMinutes: 15,
    description: "Understanding the limits of human reasoning in complex decisions.",
    source: "Harvard Business Review",
  },
  {
    id: "nf-heuristics-biases",
    title: "Judgment Under Uncertainty: Heuristics and Biases",
    author: "Tversky & Kahneman",
    readingType: "NON_FICTION",
    demand: "HIGH",
    durationMinutes: 20,
    description: "Foundational paper on cognitive biases. Dense but essential reading.",
    source: "Science (1974)",
  },
  {
    id: "nf-maps-of-meaning",
    title: "The Structure of Belief Systems",
    author: "Various",
    readingType: "NON_FICTION",
    demand: "MEDIUM",
    durationMinutes: 18,
    description: "How beliefs organize into coherent worldviews. Requires inference tracking.",
    source: "Cognitive Science Review",
  },
  {
    id: "nf-critical-thinking",
    title: "The Skeptics' Guide to Critical Thinking",
    readingType: "NON_FICTION",
    demand: "LOW",
    durationMinutes: 10,
    description: "Framework for evaluating claims. Entry-level analytical reading.",
    source: "SGU Foundation",
  },
  
  // ==================== BOOKS (Chapters/Long-form) ====================
  // Long-form reading requiring continuity, memory of previous material, sustained focus
  {
    id: "book-tfas-chapter",
    title: "Thinking, Fast and Slow — Chapter 1",
    author: "Daniel Kahneman",
    readingType: "BOOK",
    demand: "MEDIUM",
    durationMinutes: 25,
    description: "The Two Systems. Introduction to automatic vs deliberate thinking.",
  },
  {
    id: "book-rationality-stanovich",
    title: "Rationality and the Reflective Mind",
    author: "Keith Stanovich",
    readingType: "BOOK",
    demand: "VERY_HIGH",
    durationMinutes: 35,
    description: "Deep dive into cognitive decoupling and reflective thinking.",
  },
  {
    id: "book-superforecasting",
    title: "Superforecasting — Keeping Score",
    author: "Philip Tetlock",
    readingType: "BOOK",
    demand: "HIGH",
    durationMinutes: 30,
    description: "Calibration and judgment improvement. Requires sustained argument tracking.",
  },
  {
    id: "book-sources-power",
    title: "Sources of Power — Recognition-Primed Decisions",
    author: "Gary Klein",
    readingType: "BOOK",
    demand: "HIGH",
    durationMinutes: 28,
    description: "How experts make decisions under pressure. Dense case-study format.",
  },
  {
    id: "book-fooled-randomness",
    title: "Fooled by Randomness — Chapter 3",
    author: "Nassim Taleb",
    readingType: "BOOK",
    demand: "MEDIUM",
    durationMinutes: 22,
    description: "Probability blindness and survivorship bias. Conceptual density moderate.",
  },
];

// Helper functions
export function getReadingsByType(type: ReadingType): Reading[] {
  return READINGS.filter(r => r.readingType === type);
}

export function getReadingById(id: string): Reading | undefined {
  return READINGS.find(r => r.id === id);
}

// Category-specific copy
export function getReadingTypeCopy(type: ReadingType): { 
  enabledPrefix: string; 
  withheldPrefix: string;
  categoryLabel: string;
} {
  switch (type) {
    case "RECOVERY_SAFE":
      return {
        enabledPrefix: "Enabled for decompression. Minimal cognitive demand.",
        withheldPrefix: "Withheld: recovery too low for any stimulation.",
        categoryLabel: "Recovery Reading",
      };
    case "NON_FICTION":
      return {
        enabledPrefix: "Enabled: system supports structured reasoning today.",
        withheldPrefix: "Withheld: insufficient capacity for active understanding.",
        categoryLabel: "Non-Fiction",
      };
    case "BOOK":
      return {
        enabledPrefix: "Enabled: sustained cognitive load supported today.",
        withheldPrefix: "Withheld: long-form reading would accumulate fatigue.",
        categoryLabel: "Book",
      };
  }
}

// "When to use" copy by demand level (similar to podcasts)
export function getWhenToUse(demand: ReadingDemand, readingType: ReadingType): string {
  if (readingType === "RECOVERY_SAFE") {
    return "Use when you need decompression without cognitive load.";
  }
  
  switch (demand) {
    case "LOW":
      return "Use when you have basic cognitive bandwidth available.";
    case "MEDIUM":
      return "Use when you have stable bandwidth for structured thinking.";
    case "HIGH":
      return "Use when you can sustain abstraction and follow multi-step reasoning.";
    case "VERY_HIGH":
      return "Use when your system supports deep, continuous argument tracking.";
  }
}
