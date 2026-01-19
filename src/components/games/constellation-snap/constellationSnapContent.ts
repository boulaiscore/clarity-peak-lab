/**
 * ============================================
 * CONSTELLATION SNAP – CONTENT DATA
 * ============================================
 * 
 * Visual association puzzles for the Constellation Snap game.
 * Each puzzle has a 3-tile constellation and 4 candidate options.
 * The player must find the tile that "closes" the constellation.
 * 
 * Association distances:
 * - near: obvious, category-level associations
 * - mid: functional or contextual associations  
 * - remote: metaphorical, abstract associations
 */

export type TileType = "icon" | "word";
export type AssociationTag = "near" | "mid" | "remote";
export type ThemeTag = "tools" | "nature" | "society" | "time" | "music" | "motion" | "food" | "space" | "emotion" | "work";

export interface ConstellationTile {
  id: string;
  type: TileType;
  value: string; // icon name (lucide) or word
  label?: string; // display label for words
}

export interface ConstellationPuzzle {
  id: string;
  constellation: [ConstellationTile, ConstellationTile, ConstellationTile];
  correctOption: ConstellationTile;
  distractors: [ConstellationTile, ConstellationTile, ConstellationTile];
  tag: AssociationTag;
  theme?: ThemeTag;
}

// ============================================
// NEAR ASSOCIATION PUZZLES (Category/Direct)
// ============================================

const NEAR_PUZZLES: ConstellationPuzzle[] = [
  {
    id: "n1",
    constellation: [
      { id: "n1c1", type: "icon", value: "Sun" },
      { id: "n1c2", type: "icon", value: "Cloud" },
      { id: "n1c3", type: "icon", value: "CloudRain" },
    ],
    correctOption: { id: "n1o1", type: "word", value: "Weather" },
    distractors: [
      { id: "n1d1", type: "word", value: "Music" },
      { id: "n1d2", type: "word", value: "Sport" },
      { id: "n1d3", type: "word", value: "Food" },
    ],
    tag: "near",
    theme: "nature",
  },
  {
    id: "n2",
    constellation: [
      { id: "n2c1", type: "icon", value: "Hammer" },
      { id: "n2c2", type: "icon", value: "Wrench" },
      { id: "n2c3", type: "icon", value: "Drill" },
    ],
    correctOption: { id: "n2o1", type: "word", value: "Tools" },
    distractors: [
      { id: "n2d1", type: "word", value: "Toys" },
      { id: "n2d2", type: "word", value: "Books" },
      { id: "n2d3", type: "word", value: "Clothes" },
    ],
    tag: "near",
    theme: "tools",
  },
  {
    id: "n3",
    constellation: [
      { id: "n3c1", type: "icon", value: "Apple" },
      { id: "n3c2", type: "icon", value: "Banana" },
      { id: "n3c3", type: "icon", value: "Cherry" },
    ],
    correctOption: { id: "n3o1", type: "word", value: "Fruit" },
    distractors: [
      { id: "n3d1", type: "word", value: "Metal" },
      { id: "n3d2", type: "word", value: "Water" },
      { id: "n3d3", type: "word", value: "Stone" },
    ],
    tag: "near",
    theme: "food",
  },
  {
    id: "n4",
    constellation: [
      { id: "n4c1", type: "icon", value: "Car" },
      { id: "n4c2", type: "icon", value: "Bus" },
      { id: "n4c3", type: "icon", value: "Train" },
    ],
    correctOption: { id: "n4o1", type: "word", value: "Transport" },
    distractors: [
      { id: "n4d1", type: "word", value: "Furniture" },
      { id: "n4d2", type: "word", value: "Animals" },
      { id: "n4d3", type: "word", value: "Plants" },
    ],
    tag: "near",
    theme: "motion",
  },
  {
    id: "n5",
    constellation: [
      { id: "n5c1", type: "icon", value: "Guitar" },
      { id: "n5c2", type: "icon", value: "Piano" },
      { id: "n5c3", type: "icon", value: "Drum" },
    ],
    correctOption: { id: "n5o1", type: "word", value: "Music" },
    distractors: [
      { id: "n5d1", type: "word", value: "Science" },
      { id: "n5d2", type: "word", value: "Sports" },
      { id: "n5d3", type: "word", value: "Food" },
    ],
    tag: "near",
    theme: "music",
  },
  {
    id: "n6",
    constellation: [
      { id: "n6c1", type: "icon", value: "Dog" },
      { id: "n6c2", type: "icon", value: "Cat" },
      { id: "n6c3", type: "icon", value: "Bird" },
    ],
    correctOption: { id: "n6o1", type: "word", value: "Pets" },
    distractors: [
      { id: "n6d1", type: "word", value: "Rocks" },
      { id: "n6d2", type: "word", value: "Clouds" },
      { id: "n6d3", type: "word", value: "Stars" },
    ],
    tag: "near",
    theme: "nature",
  },
  {
    id: "n7",
    constellation: [
      { id: "n7c1", type: "icon", value: "Shirt" },
      { id: "n7c2", type: "icon", value: "Footprints" },
      { id: "n7c3", type: "icon", value: "Watch" },
    ],
    correctOption: { id: "n7o1", type: "word", value: "Fashion" },
    distractors: [
      { id: "n7d1", type: "word", value: "Cooking" },
      { id: "n7d2", type: "word", value: "Reading" },
      { id: "n7d3", type: "word", value: "Sleeping" },
    ],
    tag: "near",
    theme: "society",
  },
  {
    id: "n8",
    constellation: [
      { id: "n8c1", type: "icon", value: "Moon" },
      { id: "n8c2", type: "icon", value: "Star" },
      { id: "n8c3", type: "icon", value: "Rocket" },
    ],
    correctOption: { id: "n8o1", type: "word", value: "Space" },
    distractors: [
      { id: "n8d1", type: "word", value: "Ocean" },
      { id: "n8d2", type: "word", value: "Forest" },
      { id: "n8d3", type: "word", value: "Desert" },
    ],
    tag: "near",
    theme: "space",
  },
  {
    id: "n9",
    constellation: [
      { id: "n9c1", type: "icon", value: "Book" },
      { id: "n9c2", type: "icon", value: "Pencil" },
      { id: "n9c3", type: "icon", value: "GraduationCap" },
    ],
    correctOption: { id: "n9o1", type: "word", value: "Education" },
    distractors: [
      { id: "n9d1", type: "word", value: "Cooking" },
      { id: "n9d2", type: "word", value: "Dancing" },
      { id: "n9d3", type: "word", value: "Swimming" },
    ],
    tag: "near",
    theme: "work",
  },
  {
    id: "n10",
    constellation: [
      { id: "n10c1", type: "icon", value: "Heart" },
      { id: "n10c2", type: "icon", value: "Gift" },
      { id: "n10c3", type: "icon", value: "Cake" },
    ],
    correctOption: { id: "n10o1", type: "word", value: "Birthday" },
    distractors: [
      { id: "n10d1", type: "word", value: "Workout" },
      { id: "n10d2", type: "word", value: "Cleaning" },
      { id: "n10d3", type: "word", value: "Sleeping" },
    ],
    tag: "near",
    theme: "emotion",
  },
  {
    id: "n11",
    constellation: [
      { id: "n11c1", type: "icon", value: "Coffee" },
      { id: "n11c2", type: "icon", value: "Croissant" },
      { id: "n11c3", type: "icon", value: "Sunrise" },
    ],
    correctOption: { id: "n11o1", type: "word", value: "Morning" },
    distractors: [
      { id: "n11d1", type: "word", value: "Night" },
      { id: "n11d2", type: "word", value: "Winter" },
      { id: "n11d3", type: "word", value: "Storm" },
    ],
    tag: "near",
    theme: "time",
  },
  {
    id: "n12",
    constellation: [
      { id: "n12c1", type: "icon", value: "Briefcase" },
      { id: "n12c2", type: "icon", value: "Mail" },
      { id: "n12c3", type: "icon", value: "Clock" },
    ],
    correctOption: { id: "n12o1", type: "word", value: "Office" },
    distractors: [
      { id: "n12d1", type: "word", value: "Beach" },
      { id: "n12d2", type: "word", value: "Forest" },
      { id: "n12d3", type: "word", value: "Mountain" },
    ],
    tag: "near",
    theme: "work",
  },
];

// ============================================
// MID ASSOCIATION PUZZLES (Functional/Contextual)
// ============================================

const MID_PUZZLES: ConstellationPuzzle[] = [
  {
    id: "m1",
    constellation: [
      { id: "m1c1", type: "icon", value: "Lock" },
      { id: "m1c2", type: "icon", value: "Eye" },
      { id: "m1c3", type: "word", value: "Trust" },
    ],
    correctOption: { id: "m1o1", type: "word", value: "Security" },
    distractors: [
      { id: "m1d1", type: "word", value: "Speed" },
      { id: "m1d2", type: "word", value: "Color" },
      { id: "m1d3", type: "word", value: "Taste" },
    ],
    tag: "mid",
    theme: "society",
  },
  {
    id: "m2",
    constellation: [
      { id: "m2c1", type: "icon", value: "Flame" },
      { id: "m2c2", type: "icon", value: "Lightbulb" },
      { id: "m2c3", type: "word", value: "Passion" },
    ],
    correctOption: { id: "m2o1", type: "word", value: "Energy" },
    distractors: [
      { id: "m2d1", type: "word", value: "Silence" },
      { id: "m2d2", type: "word", value: "Darkness" },
      { id: "m2d3", type: "word", value: "Weight" },
    ],
    tag: "mid",
    theme: "emotion",
  },
  {
    id: "m3",
    constellation: [
      { id: "m3c1", type: "icon", value: "Compass" },
      { id: "m3c2", type: "icon", value: "Map" },
      { id: "m3c3", type: "word", value: "Goal" },
    ],
    correctOption: { id: "m3o1", type: "word", value: "Direction" },
    distractors: [
      { id: "m3d1", type: "word", value: "Texture" },
      { id: "m3d2", type: "word", value: "Volume" },
      { id: "m3d3", type: "word", value: "Flavor" },
    ],
    tag: "mid",
    theme: "motion",
  },
  {
    id: "m4",
    constellation: [
      { id: "m4c1", type: "icon", value: "Timer" },
      { id: "m4c2", type: "icon", value: "Target" },
      { id: "m4c3", type: "word", value: "Rush" },
    ],
    correctOption: { id: "m4o1", type: "word", value: "Deadline" },
    distractors: [
      { id: "m4d1", type: "word", value: "Melody" },
      { id: "m4d2", type: "word", value: "Fragrance" },
      { id: "m4d3", type: "word", value: "Texture" },
    ],
    tag: "mid",
    theme: "time",
  },
  {
    id: "m5",
    constellation: [
      { id: "m5c1", type: "icon", value: "Leaf" },
      { id: "m5c2", type: "icon", value: "Recycle" },
      { id: "m5c3", type: "word", value: "Future" },
    ],
    correctOption: { id: "m5o1", type: "word", value: "Sustainability" },
    distractors: [
      { id: "m5d1", type: "word", value: "Destruction" },
      { id: "m5d2", type: "word", value: "Explosion" },
      { id: "m5d3", type: "word", value: "Pollution" },
    ],
    tag: "mid",
    theme: "nature",
  },
  {
    id: "m6",
    constellation: [
      { id: "m6c1", type: "icon", value: "Users" },
      { id: "m6c2", type: "icon", value: "MessageCircle" },
      { id: "m6c3", type: "word", value: "Bond" },
    ],
    correctOption: { id: "m6o1", type: "word", value: "Community" },
    distractors: [
      { id: "m6d1", type: "word", value: "Solitude" },
      { id: "m6d2", type: "word", value: "Silence" },
      { id: "m6d3", type: "word", value: "Distance" },
    ],
    tag: "mid",
    theme: "society",
  },
  {
    id: "m7",
    constellation: [
      { id: "m7c1", type: "icon", value: "Puzzle" },
      { id: "m7c2", type: "icon", value: "Brain" },
      { id: "m7c3", type: "word", value: "Click" },
    ],
    correctOption: { id: "m7o1", type: "word", value: "Insight" },
    distractors: [
      { id: "m7d1", type: "word", value: "Confusion" },
      { id: "m7d2", type: "word", value: "Boredom" },
      { id: "m7d3", type: "word", value: "Fatigue" },
    ],
    tag: "mid",
    theme: "work",
  },
  {
    id: "m8",
    constellation: [
      { id: "m8c1", type: "icon", value: "Mic" },
      { id: "m8c2", type: "icon", value: "Headphones" },
      { id: "m8c3", type: "word", value: "Story" },
    ],
    correctOption: { id: "m8o1", type: "word", value: "Podcast" },
    distractors: [
      { id: "m8d1", type: "word", value: "Painting" },
      { id: "m8d2", type: "word", value: "Sculpture" },
      { id: "m8d3", type: "word", value: "Dance" },
    ],
    tag: "mid",
    theme: "music",
  },
  {
    id: "m9",
    constellation: [
      { id: "m9c1", type: "icon", value: "Sparkles" },
      { id: "m9c2", type: "icon", value: "Wand2" },
      { id: "m9c3", type: "word", value: "Wonder" },
    ],
    correctOption: { id: "m9o1", type: "word", value: "Magic" },
    distractors: [
      { id: "m9d1", type: "word", value: "Routine" },
      { id: "m9d2", type: "word", value: "Boredom" },
      { id: "m9d3", type: "word", value: "Ordinary" },
    ],
    tag: "mid",
    theme: "emotion",
  },
  {
    id: "m10",
    constellation: [
      { id: "m10c1", type: "icon", value: "Scale" },
      { id: "m10c2", type: "icon", value: "Gavel" },
      { id: "m10c3", type: "word", value: "Fair" },
    ],
    correctOption: { id: "m10o1", type: "word", value: "Justice" },
    distractors: [
      { id: "m10d1", type: "word", value: "Chaos" },
      { id: "m10d2", type: "word", value: "Noise" },
      { id: "m10d3", type: "word", value: "Speed" },
    ],
    tag: "mid",
    theme: "society",
  },
  {
    id: "m11",
    constellation: [
      { id: "m11c1", type: "icon", value: "Zap" },
      { id: "m11c2", type: "icon", value: "Battery" },
      { id: "m11c3", type: "word", value: "Boost" },
    ],
    correctOption: { id: "m11o1", type: "word", value: "Power" },
    distractors: [
      { id: "m11d1", type: "word", value: "Silence" },
      { id: "m11d2", type: "word", value: "Stillness" },
      { id: "m11d3", type: "word", value: "Void" },
    ],
    tag: "mid",
    theme: "tools",
  },
  {
    id: "m12",
    constellation: [
      { id: "m12c1", type: "icon", value: "Telescope" },
      { id: "m12c2", type: "icon", value: "Globe" },
      { id: "m12c3", type: "word", value: "Wonder" },
    ],
    correctOption: { id: "m12o1", type: "word", value: "Discovery" },
    distractors: [
      { id: "m12d1", type: "word", value: "Routine" },
      { id: "m12d2", type: "word", value: "Boredom" },
      { id: "m12d3", type: "word", value: "Stillness" },
    ],
    tag: "mid",
    theme: "space",
  },
];

// ============================================
// REMOTE ASSOCIATION PUZZLES (Metaphorical/Abstract)
// ============================================

const REMOTE_PUZZLES: ConstellationPuzzle[] = [
  {
    id: "r1",
    constellation: [
      { id: "r1c1", type: "icon", value: "Anchor" },
      { id: "r1c2", type: "word", value: "Roots" },
      { id: "r1c3", type: "word", value: "Home" },
    ],
    correctOption: { id: "r1o1", type: "word", value: "Belonging" },
    distractors: [
      { id: "r1d1", type: "word", value: "Flight" },
      { id: "r1d2", type: "word", value: "Speed" },
      { id: "r1d3", type: "word", value: "Chaos" },
    ],
    tag: "remote",
    theme: "emotion",
  },
  {
    id: "r2",
    constellation: [
      { id: "r2c1", type: "icon", value: "Feather" },
      { id: "r2c2", type: "word", value: "Whisper" },
      { id: "r2c3", type: "word", value: "Cloud" },
    ],
    correctOption: { id: "r2o1", type: "word", value: "Lightness" },
    distractors: [
      { id: "r2d1", type: "word", value: "Thunder" },
      { id: "r2d2", type: "word", value: "Weight" },
      { id: "r2d3", type: "word", value: "Stone" },
    ],
    tag: "remote",
    theme: "nature",
  },
  {
    id: "r3",
    constellation: [
      { id: "r3c1", type: "icon", value: "Hourglass" },
      { id: "r3c2", type: "word", value: "Tide" },
      { id: "r3c3", type: "word", value: "Memory" },
    ],
    correctOption: { id: "r3o1", type: "word", value: "Passage" },
    distractors: [
      { id: "r3d1", type: "word", value: "Stillness" },
      { id: "r3d2", type: "word", value: "Noise" },
      { id: "r3d3", type: "word", value: "Color" },
    ],
    tag: "remote",
    theme: "time",
  },
  {
    id: "r4",
    constellation: [
      { id: "r4c1", type: "icon", value: "Key" },
      { id: "r4c2", type: "word", value: "Dawn" },
      { id: "r4c3", type: "word", value: "Door" },
    ],
    correctOption: { id: "r4o1", type: "word", value: "Opportunity" },
    distractors: [
      { id: "r4d1", type: "word", value: "Wall" },
      { id: "r4d2", type: "word", value: "Barrier" },
      { id: "r4d3", type: "word", value: "Ending" },
    ],
    tag: "remote",
    theme: "emotion",
  },
  {
    id: "r5",
    constellation: [
      { id: "r5c1", type: "icon", value: "Waves" },
      { id: "r5c2", type: "word", value: "Breath" },
      { id: "r5c3", type: "word", value: "Pulse" },
    ],
    correctOption: { id: "r5o1", type: "word", value: "Rhythm" },
    distractors: [
      { id: "r5d1", type: "word", value: "Silence" },
      { id: "r5d2", type: "word", value: "Stillness" },
      { id: "r5d3", type: "word", value: "Void" },
    ],
    tag: "remote",
    theme: "music",
  },
  {
    id: "r6",
    constellation: [
      { id: "r6c1", type: "icon", value: "Snowflake" },
      { id: "r6c2", type: "word", value: "Fingerprint" },
      { id: "r6c3", type: "word", value: "Voice" },
    ],
    correctOption: { id: "r6o1", type: "word", value: "Uniqueness" },
    distractors: [
      { id: "r6d1", type: "word", value: "Sameness" },
      { id: "r6d2", type: "word", value: "Copy" },
      { id: "r6d3", type: "word", value: "Clone" },
    ],
    tag: "remote",
    theme: "society",
  },
  {
    id: "r7",
    constellation: [
      { id: "r7c1", type: "icon", value: "Mountain" },
      { id: "r7c2", type: "word", value: "Obstacle" },
      { id: "r7c3", type: "word", value: "Summit" },
    ],
    correctOption: { id: "r7o1", type: "word", value: "Challenge" },
    distractors: [
      { id: "r7d1", type: "word", value: "Valley" },
      { id: "r7d2", type: "word", value: "Comfort" },
      { id: "r7d3", type: "word", value: "Ease" },
    ],
    tag: "remote",
    theme: "motion",
  },
  {
    id: "r8",
    constellation: [
      { id: "r8c1", type: "icon", value: "Sunrise" },
      { id: "r8c2", type: "word", value: "Phoenix" },
      { id: "r8c3", type: "word", value: "Spring" },
    ],
    correctOption: { id: "r8o1", type: "word", value: "Renewal" },
    distractors: [
      { id: "r8d1", type: "word", value: "Decay" },
      { id: "r8d2", type: "word", value: "Ending" },
      { id: "r8d3", type: "word", value: "Winter" },
    ],
    tag: "remote",
    theme: "time",
  },
  {
    id: "r9",
    constellation: [
      { id: "r9c1", type: "icon", value: "Link" },
      { id: "r9c2", type: "word", value: "Bridge" },
      { id: "r9c3", type: "word", value: "Handshake" },
    ],
    correctOption: { id: "r9o1", type: "word", value: "Connection" },
    distractors: [
      { id: "r9d1", type: "word", value: "Wall" },
      { id: "r9d2", type: "word", value: "Gap" },
      { id: "r9d3", type: "word", value: "Divide" },
    ],
    tag: "remote",
    theme: "society",
  },
  {
    id: "r10",
    constellation: [
      { id: "r10c1", type: "icon", value: "Flame" },
      { id: "r10c2", type: "word", value: "Moth" },
      { id: "r10c3", type: "word", value: "Magnet" },
    ],
    correctOption: { id: "r10o1", type: "word", value: "Attraction" },
    distractors: [
      { id: "r10d1", type: "word", value: "Repulsion" },
      { id: "r10d2", type: "word", value: "Distance" },
      { id: "r10d3", type: "word", value: "Avoidance" },
    ],
    tag: "remote",
    theme: "emotion",
  },
  {
    id: "r11",
    constellation: [
      { id: "r11c1", type: "icon", value: "Shield" },
      { id: "r11c2", type: "word", value: "Shell" },
      { id: "r11c3", type: "word", value: "Mask" },
    ],
    correctOption: { id: "r11o1", type: "word", value: "Protection" },
    distractors: [
      { id: "r11d1", type: "word", value: "Exposure" },
      { id: "r11d2", type: "word", value: "Vulnerability" },
      { id: "r11d3", type: "word", value: "Openness" },
    ],
    tag: "remote",
    theme: "emotion",
  },
  {
    id: "r12",
    constellation: [
      { id: "r12c1", type: "icon", value: "Infinity" },
      { id: "r12c2", type: "word", value: "Horizon" },
      { id: "r12c3", type: "word", value: "Dream" },
    ],
    correctOption: { id: "r12o1", type: "word", value: "Possibility" },
    distractors: [
      { id: "r12d1", type: "word", value: "Limit" },
      { id: "r12d2", type: "word", value: "Boundary" },
      { id: "r12d3", type: "word", value: "End" },
    ],
    tag: "remote",
    theme: "space",
  },
];

// ============================================
// PUZZLE SELECTION
// ============================================

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get puzzles for a session based on difficulty.
 * - Easy: mostly near, few mid
 * - Medium: balanced mix
 * - Hard: mostly remote, few mid
 */
export function getPuzzlesForSession(
  difficulty: "easy" | "medium" | "hard",
  count: number = 30
): ConstellationPuzzle[] {
  const roundsPerAct = count / 3; // 10 per act
  
  let nearCount: number, midCount: number, remoteCount: number;
  
  switch (difficulty) {
    case "easy":
      nearCount = 20;
      midCount = 8;
      remoteCount = 2;
      break;
    case "medium":
      nearCount = 10;
      midCount = 10;
      remoteCount = 10;
      break;
    case "hard":
      nearCount = 2;
      midCount = 8;
      remoteCount = 20;
      break;
  }
  
  // Sample puzzles
  const nearSample = shuffleArray(NEAR_PUZZLES).slice(0, nearCount);
  const midSample = shuffleArray(MID_PUZZLES).slice(0, midCount);
  const remoteSample = shuffleArray(REMOTE_PUZZLES).slice(0, remoteCount);
  
  // Combine and shuffle
  const allPuzzles = shuffleArray([...nearSample, ...midSample, ...remoteSample]);
  
  return allPuzzles.slice(0, count);
}

/**
 * Shuffle options for a puzzle (returns shuffled array of all 4 options)
 */
export function shuffleOptions(puzzle: ConstellationPuzzle): ConstellationTile[] {
  return shuffleArray([puzzle.correctOption, ...puzzle.distractors]);
}

export { NEAR_PUZZLES, MID_PUZZLES, REMOTE_PUZZLES };
