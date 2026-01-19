/**
 * SEMANTIC DRIFT — Content Library
 * 
 * Pre-authored semantic chains for Rapid Association training.
 * Each node has exactly 4 options:
 * - directional: correct continuation (becomes next seed)
 * - literal: obvious but static trap
 * - remote: over-remote association (too far)
 * - distractor: side-related neutral
 */

export interface SemanticOption {
  word: string;
  tag: "directional" | "literal" | "remote" | "distractor";
}

export interface SemanticNode {
  seed: string;
  options: SemanticOption[];
}

export interface SemanticChain {
  difficulty: "easy" | "medium" | "hard";
  nodes: SemanticNode[];
}

// ============================================
// EASY CHAINS — Concrete concepts, shallow drift
// ============================================

const EASY_CHAINS: SemanticChain[] = [
  {
    difficulty: "easy",
    nodes: [
      { seed: "Ocean", options: [
        { word: "Wave", tag: "directional" },
        { word: "Water", tag: "literal" },
        { word: "Cosmos", tag: "remote" },
        { word: "Boat", tag: "distractor" },
      ]},
      { seed: "Wave", options: [
        { word: "Rhythm", tag: "directional" },
        { word: "Beach", tag: "literal" },
        { word: "Quantum", tag: "remote" },
        { word: "Surfboard", tag: "distractor" },
      ]},
      { seed: "Rhythm", options: [
        { word: "Pulse", tag: "directional" },
        { word: "Drum", tag: "literal" },
        { word: "Algorithm", tag: "remote" },
        { word: "Dance", tag: "distractor" },
      ]},
      { seed: "Pulse", options: [
        { word: "Life", tag: "directional" },
        { word: "Heart", tag: "literal" },
        { word: "Electricity", tag: "remote" },
        { word: "Doctor", tag: "distractor" },
      ]},
      { seed: "Life", options: [
        { word: "Growth", tag: "directional" },
        { word: "Living", tag: "literal" },
        { word: "Entropy", tag: "remote" },
        { word: "Birth", tag: "distractor" },
      ]},
      { seed: "Growth", options: [
        { word: "Change", tag: "directional" },
        { word: "Plant", tag: "literal" },
        { word: "Inflation", tag: "remote" },
        { word: "Garden", tag: "distractor" },
      ]},
      { seed: "Change", options: [
        { word: "Transform", tag: "directional" },
        { word: "Different", tag: "literal" },
        { word: "Revolution", tag: "remote" },
        { word: "Coins", tag: "distractor" },
      ]},
    ],
  },
  {
    difficulty: "easy",
    nodes: [
      { seed: "Fire", options: [
        { word: "Heat", tag: "directional" },
        { word: "Flame", tag: "literal" },
        { word: "Passion", tag: "remote" },
        { word: "Matches", tag: "distractor" },
      ]},
      { seed: "Heat", options: [
        { word: "Energy", tag: "directional" },
        { word: "Hot", tag: "literal" },
        { word: "Anger", tag: "remote" },
        { word: "Summer", tag: "distractor" },
      ]},
      { seed: "Energy", options: [
        { word: "Force", tag: "directional" },
        { word: "Power", tag: "literal" },
        { word: "Motivation", tag: "remote" },
        { word: "Battery", tag: "distractor" },
      ]},
      { seed: "Force", options: [
        { word: "Pressure", tag: "directional" },
        { word: "Push", tag: "literal" },
        { word: "Destiny", tag: "remote" },
        { word: "Police", tag: "distractor" },
      ]},
      { seed: "Pressure", options: [
        { word: "Tension", tag: "directional" },
        { word: "Weight", tag: "literal" },
        { word: "Deadline", tag: "remote" },
        { word: "Gauge", tag: "distractor" },
      ]},
      { seed: "Tension", options: [
        { word: "Conflict", tag: "directional" },
        { word: "Stress", tag: "literal" },
        { word: "Electricity", tag: "remote" },
        { word: "Wire", tag: "distractor" },
      ]},
      { seed: "Conflict", options: [
        { word: "Resolution", tag: "directional" },
        { word: "Fight", tag: "literal" },
        { word: "War", tag: "remote" },
        { word: "Argument", tag: "distractor" },
      ]},
    ],
  },
  {
    difficulty: "easy",
    nodes: [
      { seed: "Mountain", options: [
        { word: "Peak", tag: "directional" },
        { word: "Rock", tag: "literal" },
        { word: "Ambition", tag: "remote" },
        { word: "Hiking", tag: "distractor" },
      ]},
      { seed: "Peak", options: [
        { word: "Summit", tag: "directional" },
        { word: "Top", tag: "literal" },
        { word: "Excellence", tag: "remote" },
        { word: "Climber", tag: "distractor" },
      ]},
      { seed: "Summit", options: [
        { word: "Achievement", tag: "directional" },
        { word: "Meeting", tag: "literal" },
        { word: "Enlightenment", tag: "remote" },
        { word: "Flag", tag: "distractor" },
      ]},
      { seed: "Achievement", options: [
        { word: "Success", tag: "directional" },
        { word: "Trophy", tag: "literal" },
        { word: "Legacy", tag: "remote" },
        { word: "Medal", tag: "distractor" },
      ]},
      { seed: "Success", options: [
        { word: "Progress", tag: "directional" },
        { word: "Win", tag: "literal" },
        { word: "Fulfillment", tag: "remote" },
        { word: "Money", tag: "distractor" },
      ]},
      { seed: "Progress", options: [
        { word: "Movement", tag: "directional" },
        { word: "Forward", tag: "literal" },
        { word: "Evolution", tag: "remote" },
        { word: "Bar", tag: "distractor" },
      ]},
      { seed: "Movement", options: [
        { word: "Flow", tag: "directional" },
        { word: "Motion", tag: "literal" },
        { word: "Revolution", tag: "remote" },
        { word: "Dance", tag: "distractor" },
      ]},
    ],
  },
  {
    difficulty: "easy",
    nodes: [
      { seed: "Light", options: [
        { word: "Glow", tag: "directional" },
        { word: "Bright", tag: "literal" },
        { word: "Truth", tag: "remote" },
        { word: "Lamp", tag: "distractor" },
      ]},
      { seed: "Glow", options: [
        { word: "Warmth", tag: "directional" },
        { word: "Shine", tag: "literal" },
        { word: "Pregnancy", tag: "remote" },
        { word: "Firefly", tag: "distractor" },
      ]},
      { seed: "Warmth", options: [
        { word: "Comfort", tag: "directional" },
        { word: "Heat", tag: "literal" },
        { word: "Love", tag: "remote" },
        { word: "Blanket", tag: "distractor" },
      ]},
      { seed: "Comfort", options: [
        { word: "Ease", tag: "directional" },
        { word: "Soft", tag: "literal" },
        { word: "Privilege", tag: "remote" },
        { word: "Couch", tag: "distractor" },
      ]},
      { seed: "Ease", options: [
        { word: "Simplicity", tag: "directional" },
        { word: "Easy", tag: "literal" },
        { word: "Mastery", tag: "remote" },
        { word: "Relax", tag: "distractor" },
      ]},
      { seed: "Simplicity", options: [
        { word: "Clarity", tag: "directional" },
        { word: "Simple", tag: "literal" },
        { word: "Zen", tag: "remote" },
        { word: "Minimalism", tag: "distractor" },
      ]},
      { seed: "Clarity", options: [
        { word: "Focus", tag: "directional" },
        { word: "Clear", tag: "literal" },
        { word: "Enlightenment", tag: "remote" },
        { word: "Glass", tag: "distractor" },
      ]},
    ],
  },
];

// ============================================
// MEDIUM CHAINS — Abstract concepts, increased ambiguity
// ============================================

const MEDIUM_CHAINS: SemanticChain[] = [
  {
    difficulty: "medium",
    nodes: [
      { seed: "Balance", options: [
        { word: "Equilibrium", tag: "directional" },
        { word: "Scale", tag: "literal" },
        { word: "Justice", tag: "remote" },
        { word: "Yoga", tag: "distractor" },
      ]},
      { seed: "Equilibrium", options: [
        { word: "Stability", tag: "directional" },
        { word: "Even", tag: "literal" },
        { word: "Chemistry", tag: "remote" },
        { word: "Physics", tag: "distractor" },
      ]},
      { seed: "Stability", options: [
        { word: "Foundation", tag: "directional" },
        { word: "Steady", tag: "literal" },
        { word: "Government", tag: "remote" },
        { word: "Building", tag: "distractor" },
      ]},
      { seed: "Foundation", options: [
        { word: "Ground", tag: "directional" },
        { word: "Base", tag: "literal" },
        { word: "Charity", tag: "remote" },
        { word: "Concrete", tag: "distractor" },
      ]},
      { seed: "Ground", options: [
        { word: "Root", tag: "directional" },
        { word: "Earth", tag: "literal" },
        { word: "Reality", tag: "remote" },
        { word: "Dirt", tag: "distractor" },
      ]},
      { seed: "Root", options: [
        { word: "Origin", tag: "directional" },
        { word: "Tree", tag: "literal" },
        { word: "Ancestry", tag: "remote" },
        { word: "Vegetable", tag: "distractor" },
      ]},
      { seed: "Origin", options: [
        { word: "Source", tag: "directional" },
        { word: "Beginning", tag: "literal" },
        { word: "Creation", tag: "remote" },
        { word: "Birth", tag: "distractor" },
      ]},
      { seed: "Source", options: [
        { word: "Flow", tag: "directional" },
        { word: "Spring", tag: "literal" },
        { word: "Truth", tag: "remote" },
        { word: "Code", tag: "distractor" },
      ]},
    ],
  },
  {
    difficulty: "medium",
    nodes: [
      { seed: "Connection", options: [
        { word: "Link", tag: "directional" },
        { word: "Wire", tag: "literal" },
        { word: "Intimacy", tag: "remote" },
        { word: "Internet", tag: "distractor" },
      ]},
      { seed: "Link", options: [
        { word: "Chain", tag: "directional" },
        { word: "URL", tag: "literal" },
        { word: "Fate", tag: "remote" },
        { word: "Sausage", tag: "distractor" },
      ]},
      { seed: "Chain", options: [
        { word: "Sequence", tag: "directional" },
        { word: "Metal", tag: "literal" },
        { word: "Slavery", tag: "remote" },
        { word: "Necklace", tag: "distractor" },
      ]},
      { seed: "Sequence", options: [
        { word: "Pattern", tag: "directional" },
        { word: "Order", tag: "literal" },
        { word: "DNA", tag: "remote" },
        { word: "Movie", tag: "distractor" },
      ]},
      { seed: "Pattern", options: [
        { word: "Structure", tag: "directional" },
        { word: "Design", tag: "literal" },
        { word: "Destiny", tag: "remote" },
        { word: "Fabric", tag: "distractor" },
      ]},
      { seed: "Structure", options: [
        { word: "Framework", tag: "directional" },
        { word: "Building", tag: "literal" },
        { word: "Society", tag: "remote" },
        { word: "Bones", tag: "distractor" },
      ]},
      { seed: "Framework", options: [
        { word: "System", tag: "directional" },
        { word: "Frame", tag: "literal" },
        { word: "Philosophy", tag: "remote" },
        { word: "Software", tag: "distractor" },
      ]},
      { seed: "System", options: [
        { word: "Network", tag: "directional" },
        { word: "Computer", tag: "literal" },
        { word: "Universe", tag: "remote" },
        { word: "Solar", tag: "distractor" },
      ]},
    ],
  },
  {
    difficulty: "medium",
    nodes: [
      { seed: "Shadow", options: [
        { word: "Depth", tag: "directional" },
        { word: "Dark", tag: "literal" },
        { word: "Unconscious", tag: "remote" },
        { word: "Sunlight", tag: "distractor" },
      ]},
      { seed: "Depth", options: [
        { word: "Layers", tag: "directional" },
        { word: "Deep", tag: "literal" },
        { word: "Meaning", tag: "remote" },
        { word: "Ocean", tag: "distractor" },
      ]},
      { seed: "Layers", options: [
        { word: "Complexity", tag: "directional" },
        { word: "Cake", tag: "literal" },
        { word: "Identity", tag: "remote" },
        { word: "Onion", tag: "distractor" },
      ]},
      { seed: "Complexity", options: [
        { word: "Nuance", tag: "directional" },
        { word: "Complicated", tag: "literal" },
        { word: "Chaos", tag: "remote" },
        { word: "Math", tag: "distractor" },
      ]},
      { seed: "Nuance", options: [
        { word: "Subtlety", tag: "directional" },
        { word: "Detail", tag: "literal" },
        { word: "Art", tag: "remote" },
        { word: "Color", tag: "distractor" },
      ]},
      { seed: "Subtlety", options: [
        { word: "Finesse", tag: "directional" },
        { word: "Subtle", tag: "literal" },
        { word: "Deception", tag: "remote" },
        { word: "Whisper", tag: "distractor" },
      ]},
      { seed: "Finesse", options: [
        { word: "Grace", tag: "directional" },
        { word: "Skill", tag: "literal" },
        { word: "Manipulation", tag: "remote" },
        { word: "Dance", tag: "distractor" },
      ]},
      { seed: "Grace", options: [
        { word: "Elegance", tag: "directional" },
        { word: "Prayer", tag: "literal" },
        { word: "Divinity", tag: "remote" },
        { word: "Ballet", tag: "distractor" },
      ]},
    ],
  },
  {
    difficulty: "medium",
    nodes: [
      { seed: "Threshold", options: [
        { word: "Boundary", tag: "directional" },
        { word: "Door", tag: "literal" },
        { word: "Transformation", tag: "remote" },
        { word: "Entrance", tag: "distractor" },
      ]},
      { seed: "Boundary", options: [
        { word: "Limit", tag: "directional" },
        { word: "Line", tag: "literal" },
        { word: "Identity", tag: "remote" },
        { word: "Fence", tag: "distractor" },
      ]},
      { seed: "Limit", options: [
        { word: "Edge", tag: "directional" },
        { word: "Maximum", tag: "literal" },
        { word: "Fear", tag: "remote" },
        { word: "Speed", tag: "distractor" },
      ]},
      { seed: "Edge", options: [
        { word: "Margin", tag: "directional" },
        { word: "Sharp", tag: "literal" },
        { word: "Danger", tag: "remote" },
        { word: "Cliff", tag: "distractor" },
      ]},
      { seed: "Margin", options: [
        { word: "Space", tag: "directional" },
        { word: "Border", tag: "literal" },
        { word: "Profit", tag: "remote" },
        { word: "Page", tag: "distractor" },
      ]},
      { seed: "Space", options: [
        { word: "Void", tag: "directional" },
        { word: "Empty", tag: "literal" },
        { word: "Cosmos", tag: "remote" },
        { word: "Room", tag: "distractor" },
      ]},
      { seed: "Void", options: [
        { word: "Absence", tag: "directional" },
        { word: "Nothing", tag: "literal" },
        { word: "Existentialism", tag: "remote" },
        { word: "Black", tag: "distractor" },
      ]},
      { seed: "Absence", options: [
        { word: "Longing", tag: "directional" },
        { word: "Missing", tag: "literal" },
        { word: "Death", tag: "remote" },
        { word: "Vacation", tag: "distractor" },
      ]},
    ],
  },
];

// ============================================
// HARD CHAINS — Conceptual/symbolic, deep drift
// ============================================

const HARD_CHAINS: SemanticChain[] = [
  {
    difficulty: "hard",
    nodes: [
      { seed: "Paradox", options: [
        { word: "Tension", tag: "directional" },
        { word: "Contradiction", tag: "literal" },
        { word: "Enlightenment", tag: "remote" },
        { word: "Logic", tag: "distractor" },
      ]},
      { seed: "Tension", options: [
        { word: "Potential", tag: "directional" },
        { word: "Stress", tag: "literal" },
        { word: "War", tag: "remote" },
        { word: "String", tag: "distractor" },
      ]},
      { seed: "Potential", options: [
        { word: "Latency", tag: "directional" },
        { word: "Possible", tag: "literal" },
        { word: "Destiny", tag: "remote" },
        { word: "Energy", tag: "distractor" },
      ]},
      { seed: "Latency", options: [
        { word: "Dormancy", tag: "directional" },
        { word: "Delay", tag: "literal" },
        { word: "Unconscious", tag: "remote" },
        { word: "Computer", tag: "distractor" },
      ]},
      { seed: "Dormancy", options: [
        { word: "Stillness", tag: "directional" },
        { word: "Sleep", tag: "literal" },
        { word: "Death", tag: "remote" },
        { word: "Winter", tag: "distractor" },
      ]},
      { seed: "Stillness", options: [
        { word: "Presence", tag: "directional" },
        { word: "Quiet", tag: "literal" },
        { word: "Enlightenment", tag: "remote" },
        { word: "Meditation", tag: "distractor" },
      ]},
      { seed: "Presence", options: [
        { word: "Awareness", tag: "directional" },
        { word: "Here", tag: "literal" },
        { word: "Divinity", tag: "remote" },
        { word: "Gift", tag: "distractor" },
      ]},
      { seed: "Awareness", options: [
        { word: "Perception", tag: "directional" },
        { word: "Conscious", tag: "literal" },
        { word: "Awakening", tag: "remote" },
        { word: "Mindfulness", tag: "distractor" },
      ]},
    ],
  },
  {
    difficulty: "hard",
    nodes: [
      { seed: "Emergence", options: [
        { word: "Arising", tag: "directional" },
        { word: "Appear", tag: "literal" },
        { word: "Evolution", tag: "remote" },
        { word: "Emergency", tag: "distractor" },
      ]},
      { seed: "Arising", options: [
        { word: "Genesis", tag: "directional" },
        { word: "Rising", tag: "literal" },
        { word: "Consciousness", tag: "remote" },
        { word: "Morning", tag: "distractor" },
      ]},
      { seed: "Genesis", options: [
        { word: "Creation", tag: "directional" },
        { word: "Bible", tag: "literal" },
        { word: "Big Bang", tag: "remote" },
        { word: "Book", tag: "distractor" },
      ]},
      { seed: "Creation", options: [
        { word: "Formation", tag: "directional" },
        { word: "Art", tag: "literal" },
        { word: "God", tag: "remote" },
        { word: "Artist", tag: "distractor" },
      ]},
      { seed: "Formation", options: [
        { word: "Shaping", tag: "directional" },
        { word: "Structure", tag: "literal" },
        { word: "Destiny", tag: "remote" },
        { word: "Rock", tag: "distractor" },
      ]},
      { seed: "Shaping", options: [
        { word: "Influence", tag: "directional" },
        { word: "Mold", tag: "literal" },
        { word: "Karma", tag: "remote" },
        { word: "Clay", tag: "distractor" },
      ]},
      { seed: "Influence", options: [
        { word: "Impact", tag: "directional" },
        { word: "Power", tag: "literal" },
        { word: "Manipulation", tag: "remote" },
        { word: "Celebrity", tag: "distractor" },
      ]},
      { seed: "Impact", options: [
        { word: "Resonance", tag: "directional" },
        { word: "Hit", tag: "literal" },
        { word: "Legacy", tag: "remote" },
        { word: "Meteor", tag: "distractor" },
      ]},
    ],
  },
  {
    difficulty: "hard",
    nodes: [
      { seed: "Recursion", options: [
        { word: "Loop", tag: "directional" },
        { word: "Repeat", tag: "literal" },
        { word: "Infinity", tag: "remote" },
        { word: "Code", tag: "distractor" },
      ]},
      { seed: "Loop", options: [
        { word: "Cycle", tag: "directional" },
        { word: "Circle", tag: "literal" },
        { word: "Karma", tag: "remote" },
        { word: "Roller", tag: "distractor" },
      ]},
      { seed: "Cycle", options: [
        { word: "Return", tag: "directional" },
        { word: "Bike", tag: "literal" },
        { word: "Reincarnation", tag: "remote" },
        { word: "Season", tag: "distractor" },
      ]},
      { seed: "Return", options: [
        { word: "Echo", tag: "directional" },
        { word: "Back", tag: "literal" },
        { word: "Nostalgia", tag: "remote" },
        { word: "Investment", tag: "distractor" },
      ]},
      { seed: "Echo", options: [
        { word: "Reflection", tag: "directional" },
        { word: "Sound", tag: "literal" },
        { word: "Memory", tag: "remote" },
        { word: "Cave", tag: "distractor" },
      ]},
      { seed: "Reflection", options: [
        { word: "Mirror", tag: "directional" },
        { word: "Image", tag: "literal" },
        { word: "Soul", tag: "remote" },
        { word: "Water", tag: "distractor" },
      ]},
      { seed: "Mirror", options: [
        { word: "Symmetry", tag: "directional" },
        { word: "Glass", tag: "literal" },
        { word: "Truth", tag: "remote" },
        { word: "Bathroom", tag: "distractor" },
      ]},
      { seed: "Symmetry", options: [
        { word: "Harmony", tag: "directional" },
        { word: "Balance", tag: "literal" },
        { word: "Beauty", tag: "remote" },
        { word: "Math", tag: "distractor" },
      ]},
    ],
  },
  {
    difficulty: "hard",
    nodes: [
      { seed: "Entropy", options: [
        { word: "Dissolution", tag: "directional" },
        { word: "Disorder", tag: "literal" },
        { word: "Death", tag: "remote" },
        { word: "Physics", tag: "distractor" },
      ]},
      { seed: "Dissolution", options: [
        { word: "Dispersion", tag: "directional" },
        { word: "Dissolve", tag: "literal" },
        { word: "Ego", tag: "remote" },
        { word: "Marriage", tag: "distractor" },
      ]},
      { seed: "Dispersion", options: [
        { word: "Scatter", tag: "directional" },
        { word: "Spread", tag: "literal" },
        { word: "Diaspora", tag: "remote" },
        { word: "Light", tag: "distractor" },
      ]},
      { seed: "Scatter", options: [
        { word: "Fragment", tag: "directional" },
        { word: "Throw", tag: "literal" },
        { word: "Trauma", tag: "remote" },
        { word: "Seeds", tag: "distractor" },
      ]},
      { seed: "Fragment", options: [
        { word: "Shard", tag: "directional" },
        { word: "Piece", tag: "literal" },
        { word: "Memory", tag: "remote" },
        { word: "Glass", tag: "distractor" },
      ]},
      { seed: "Shard", options: [
        { word: "Edge", tag: "directional" },
        { word: "Broken", tag: "literal" },
        { word: "Pain", tag: "remote" },
        { word: "Pottery", tag: "distractor" },
      ]},
      { seed: "Edge", options: [
        { word: "Threshold", tag: "directional" },
        { word: "Sharp", tag: "literal" },
        { word: "Danger", tag: "remote" },
        { word: "Cliff", tag: "distractor" },
      ]},
      { seed: "Threshold", options: [
        { word: "Transition", tag: "directional" },
        { word: "Door", tag: "literal" },
        { word: "Liminality", tag: "remote" },
        { word: "Entrance", tag: "distractor" },
      ]},
    ],
  },
];

// ============================================
// EXPORTS
// ============================================

export function getSemanticChains(difficulty: "easy" | "medium" | "hard"): SemanticChain[] {
  switch (difficulty) {
    case "easy": return EASY_CHAINS;
    case "medium": return MEDIUM_CHAINS;
    case "hard": return HARD_CHAINS;
  }
}

export function getRandomChain(difficulty: "easy" | "medium" | "hard"): SemanticChain {
  const chains = getSemanticChains(difficulty);
  return chains[Math.floor(Math.random() * chains.length)];
}

/**
 * Generate a full session's worth of nodes by cycling through chains
 * @param difficulty The difficulty level
 * @param roundCount Number of rounds needed
 * @returns Array of semantic nodes for the session
 */
export function generateSessionNodes(
  difficulty: "easy" | "medium" | "hard",
  roundCount: number
): SemanticNode[] {
  const chains = getSemanticChains(difficulty);
  const allNodes: SemanticNode[] = [];
  
  // Shuffle chains
  const shuffledChains = [...chains].sort(() => Math.random() - 0.5);
  
  // Collect nodes from chains until we have enough
  let chainIndex = 0;
  while (allNodes.length < roundCount) {
    const chain = shuffledChains[chainIndex % shuffledChains.length];
    allNodes.push(...chain.nodes);
    chainIndex++;
  }
  
  // Shuffle all collected nodes and take what we need
  const shuffledNodes = allNodes.sort(() => Math.random() - 0.5);
  return shuffledNodes.slice(0, roundCount);
}

export const DIFFICULTY_CONFIG = {
  easy: { rounds: 25, timePerRound: 3000 },
  medium: { rounds: 28, timePerRound: 2500 },
  hard: { rounds: 30, timePerRound: 2000 },
} as const;
