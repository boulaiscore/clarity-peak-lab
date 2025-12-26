// Content library for NeuroLoop Training Plans
// These are curated content pieces that can be assigned based on plan and session type

export type ContentFormat = "podcast" | "reading" | "book";
export type ContentDifficulty = "light" | "medium" | "dense";
export type ThinkingSystem = "S1" | "S2" | "S1+S2";

export interface ContentItem {
  id: string;
  title: string;
  author?: string;
  format: ContentFormat;
  difficulty: ContentDifficulty;
  thinkingSystems: ThinkingSystem[];
  durationMinutes: number;
  description: string;
  topics: string[];
  source?: string;
  url?: string;
}

// Curated content library
export const CONTENT_LIBRARY: ContentItem[] = [
  // PODCASTS - Light
  {
    id: "pod-thinking-fast-slow-intro",
    title: "Thinking, Fast and Slow - Key Concepts",
    author: "Huberman Lab",
    format: "podcast",
    difficulty: "light",
    thinkingSystems: ["S1+S2"],
    durationMinutes: 15,
    description: "Introduction to dual-process theory and how it affects daily decisions",
    topics: ["decision-making", "cognitive-bias", "system1", "system2"],
  },
  {
    id: "pod-focus-deep-work",
    title: "Deep Work Strategies",
    author: "Cal Newport",
    format: "podcast",
    difficulty: "light",
    thinkingSystems: ["S2"],
    durationMinutes: 20,
    description: "Practical strategies for sustained concentration in a distracted world",
    topics: ["focus", "productivity", "attention"],
  },
  {
    id: "pod-intuition-business",
    title: "The Power of Intuition in Business",
    author: "Harvard Business Review",
    format: "podcast",
    difficulty: "light",
    thinkingSystems: ["S1"],
    durationMinutes: 12,
    description: "How successful executives use intuition alongside analysis",
    topics: ["intuition", "business", "decision-making"],
  },
  
  // PODCASTS - Medium
  {
    id: "pod-cognitive-load",
    title: "Managing Cognitive Load",
    author: "Lex Fridman",
    format: "podcast",
    difficulty: "medium",
    thinkingSystems: ["S2"],
    durationMinutes: 25,
    description: "Understanding and optimizing mental bandwidth for complex tasks",
    topics: ["cognitive-load", "attention", "productivity"],
  },
  {
    id: "pod-mental-models",
    title: "Mental Models for Decision Making",
    author: "Shane Parrish",
    format: "podcast",
    difficulty: "medium",
    thinkingSystems: ["S1+S2"],
    durationMinutes: 30,
    description: "Building a latticework of mental models for better thinking",
    topics: ["mental-models", "reasoning", "decision-making"],
  },
  
  // READINGS - Light
  {
    id: "read-attention-economy",
    title: "Reclaiming Attention in the Digital Age",
    author: "MIT Technology Review",
    format: "reading",
    difficulty: "light",
    thinkingSystems: ["S1"],
    durationMinutes: 8,
    description: "Short article on attention management strategies",
    topics: ["attention", "digital-wellness", "focus"],
  },
  {
    id: "read-cognitive-rest",
    title: "The Science of Cognitive Rest",
    author: "Scientific American",
    format: "reading",
    difficulty: "light",
    thinkingSystems: ["S2"],
    durationMinutes: 10,
    description: "Why rest is essential for cognitive performance",
    topics: ["rest", "recovery", "performance"],
  },
  
  // READINGS - Medium/Dense
  {
    id: "read-bounded-rationality",
    title: "Bounded Rationality in Practice",
    author: "Harvard Business Review",
    format: "reading",
    difficulty: "medium",
    thinkingSystems: ["S2"],
    durationMinutes: 15,
    description: "Understanding the limits of human reasoning in complex decisions",
    topics: ["rationality", "decision-making", "cognitive-limits"],
  },
  {
    id: "read-strategic-intuition",
    title: "Strategic Intuition: The Key to Innovation",
    author: "Columbia Business School",
    format: "reading",
    difficulty: "dense",
    thinkingSystems: ["S1+S2"],
    durationMinutes: 20,
    description: "How breakthrough ideas emerge from the intersection of analysis and intuition",
    topics: ["innovation", "intuition", "strategy"],
  },
  
  // BOOKS (Extracts)
  {
    id: "book-kahneman-tfas",
    title: "Thinking, Fast and Slow - Chapter 1",
    author: "Daniel Kahneman",
    format: "book",
    difficulty: "medium",
    thinkingSystems: ["S1+S2"],
    durationMinutes: 25,
    description: "The Two Systems - Introduction to automatic and deliberate thinking",
    topics: ["dual-process", "cognition", "psychology"],
  },
  {
    id: "book-gigerenzer-gut",
    title: "Gut Feelings - The Intelligence of the Unconscious",
    author: "Gerd Gigerenzer",
    format: "book",
    difficulty: "medium",
    thinkingSystems: ["S1"],
    durationMinutes: 20,
    description: "Why intuition is smarter than we think",
    topics: ["intuition", "heuristics", "decision-making"],
  },
  {
    id: "book-stanovich-rationality",
    title: "Rationality and the Reflective Mind",
    author: "Keith Stanovich",
    format: "book",
    difficulty: "dense",
    thinkingSystems: ["S2"],
    durationMinutes: 30,
    description: "Deep dive into reflective thinking and cognitive decoupling",
    topics: ["rationality", "reflection", "metacognition"],
  },
  {
    id: "book-klein-sources",
    title: "Sources of Power - How People Make Decisions",
    author: "Gary Klein",
    format: "book",
    difficulty: "dense",
    thinkingSystems: ["S1"],
    durationMinutes: 25,
    description: "Recognition-primed decision making in high-stakes environments",
    topics: ["expertise", "intuition", "decision-making"],
  },
  {
    id: "book-tetlock-superforecasting",
    title: "Superforecasting - Chapter 3: Keeping Score",
    author: "Philip Tetlock",
    format: "book",
    difficulty: "dense",
    thinkingSystems: ["S2"],
    durationMinutes: 30,
    description: "How to calibrate predictions and improve judgment",
    topics: ["forecasting", "calibration", "judgment"],
  },
];

// Helper functions
export function getContentByFormat(format: ContentFormat): ContentItem[] {
  return CONTENT_LIBRARY.filter(c => c.format === format);
}

export function getContentByDifficulty(difficulty: ContentDifficulty): ContentItem[] {
  return CONTENT_LIBRARY.filter(c => c.difficulty === difficulty);
}

export function getContentByThinkingSystem(system: ThinkingSystem): ContentItem[] {
  return CONTENT_LIBRARY.filter(c => c.thinkingSystems.includes(system));
}

export function getContentById(id: string): ContentItem | undefined {
  return CONTENT_LIBRARY.find(c => c.id === id);
}
