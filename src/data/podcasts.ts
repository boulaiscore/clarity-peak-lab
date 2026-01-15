/**
 * Podcast Tasks Dataset
 * 
 * These podcasts are NOT "cognitive" as theme; they are selected because
 * they train critical reasoning through content (philosophy, debate, history, economics).
 */

export type PodcastDemand = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export interface Podcast {
  id: string;
  title: string;
  demand: PodcastDemand;
  intent: string;
  applePodcastId: string;
  spotifyQuery: string;
}

export const PODCASTS: Podcast[] = [
  {
    id: "in-our-time",
    title: "In Our Time (BBC)",
    demand: "HIGH",
    intent: "Concept compression + rigor (philosophy/history/science).",
    applePodcastId: "73330895",
    spotifyQuery: "In Our Time BBC",
  },
  {
    id: "history-philosophy-without-gaps",
    title: "History of Philosophy Without Any Gaps",
    demand: "VERY_HIGH",
    intent: "Argument chain building (Socrates → Plato → Aristotle → …).",
    applePodcastId: "396903391",
    spotifyQuery: "History of Philosophy Without Any Gaps",
  },
  {
    id: "philosophize-this",
    title: "Philosophize This!",
    demand: "MEDIUM",
    intent: "Fast access to strong ideas (clean primitives, low overhead).",
    applePodcastId: "659155419",
    spotifyQuery: "Philosophize This",
  },
  {
    id: "partially-examined-life",
    title: "The Partially Examined Life",
    demand: "VERY_HIGH",
    intent: "Text-driven critical reading (real argumentation, not summaries).",
    applePodcastId: "318345767",
    spotifyQuery: "Partially Examined Life",
  },
  {
    id: "intelligence-squared",
    title: "Intelligence Squared",
    demand: "HIGH",
    intent: "Debate structure + counterargument (steelman training).",
    applePodcastId: "708371900",
    spotifyQuery: "Intelligence Squared",
  },
  {
    id: "revolutions",
    title: "Revolutions (Mike Duncan)",
    demand: "HIGH",
    intent: "Causal reasoning + systems thinking through historical sequences.",
    applePodcastId: "703889772",
    spotifyQuery: "Revolutions Mike Duncan",
  },
  {
    id: "fall-of-civilizations",
    title: "Fall of Civilizations",
    demand: "HIGH",
    intent: "Deep context + inference; long-form thinking without noise.",
    applePodcastId: "1449884495",
    spotifyQuery: "Fall of Civilizations",
  },
  {
    id: "throughline",
    title: "Throughline (NPR)",
    demand: "MEDIUM",
    intent: "Context building: connect present problems to historical roots.",
    applePodcastId: "1451109634",
    spotifyQuery: "Throughline NPR",
  },
  {
    id: "planet-money",
    title: "Planet Money (NPR)",
    demand: "MEDIUM",
    intent: "Trade-offs + incentives; decision models via real cases.",
    applePodcastId: "290783428",
    spotifyQuery: "Planet Money",
  },
  {
    id: "the-intelligence",
    title: "The Intelligence (The Economist)",
    demand: "HIGH",
    intent: "Synthesis + signal detection; current events without doomscrolling.",
    applePodcastId: "1449631195",
    spotifyQuery: "The Intelligence The Economist",
  },
];

// Demand penalty values for fitScore calculation
export const DEMAND_PENALTY: Record<PodcastDemand, number> = {
  LOW: 5,
  MEDIUM: 12,
  HIGH: 18,
  VERY_HIGH: 28,
};

// Eligibility thresholds by demand level
export const DEMAND_THRESHOLDS: Record<PodcastDemand, { s1Buffer: number; s2Capacity: number; sharpness?: number }> = {
  LOW: { s1Buffer: 50, s2Capacity: 50 },
  MEDIUM: { s1Buffer: 48, s2Capacity: 60 },
  HIGH: { s1Buffer: 50, s2Capacity: 68 },
  VERY_HIGH: { s1Buffer: 55, s2Capacity: 75, sharpness: 70 },
};

// Link generation helpers
export function getApplePodcastUrl(applePodcastId: string): string {
  return `https://podcasts.apple.com/podcast/id${applePodcastId}`;
}

export function getSpotifySearchUrl(spotifyQuery: string): string {
  return `https://open.spotify.com/search/${encodeURIComponent(spotifyQuery)}`;
}

// "When to use" copy by demand level
export function getWhenToUse(demand: PodcastDemand): string {
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
