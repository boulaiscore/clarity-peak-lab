/**
 * ============================================
 * CONSTELLATION SNAP – CONTENT DATA (v2)
 * ============================================
 *
 * All tiles are ICONS (lucide-react). No mixed icon/word puzzles.
 * Curated for visual clarity at 15 rounds per session (3 acts × 5).
 */

export type TileType = "icon";
export type AssociationTag = "near" | "mid" | "remote";
export type ThemeTag = "tools" | "nature" | "society" | "time" | "music" | "motion" | "food" | "space" | "emotion" | "work";

export interface ConstellationTile {
  id: string;
  type: TileType;
  value: string; // lucide icon name
  label?: string; // optional short label (a11y); not displayed
}

export interface ConstellationPuzzle {
  id: string;
  constellation: [ConstellationTile, ConstellationTile, ConstellationTile];
  correctOption: ConstellationTile;
  distractors: [ConstellationTile, ConstellationTile, ConstellationTile];
  tag: AssociationTag;
  theme?: ThemeTag;
}

const ic = (id: string, value: string, label?: string): ConstellationTile => ({
  id,
  type: "icon",
  value,
  label,
});

// ============================================
// NEAR ASSOCIATION PUZZLES (icon-only)
// ============================================

const NEAR_PUZZLES: ConstellationPuzzle[] = [
  {
    id: "n1",
    constellation: [ic("n1c1", "Sun"), ic("n1c2", "Cloud"), ic("n1c3", "CloudRain")],
    correctOption: ic("n1o1", "CloudSun", "Weather"),
    distractors: [ic("n1d1", "Music", "Music"), ic("n1d2", "Trophy", "Sport"), ic("n1d3", "UtensilsCrossed", "Food")],
    tag: "near",
    theme: "nature",
  },
  {
    id: "n2",
    constellation: [ic("n2c1", "Hammer"), ic("n2c2", "Wrench"), ic("n2c3", "Drill")],
    correctOption: ic("n2o1", "Cog", "Tools"),
    distractors: [ic("n2d1", "ToyBrick", "Toys"), ic("n2d2", "BookOpen", "Books"), ic("n2d3", "Shirt", "Clothes")],
    tag: "near",
    theme: "tools",
  },
  {
    id: "n3",
    constellation: [ic("n3c1", "Apple"), ic("n3c2", "Banana"), ic("n3c3", "Cherry")],
    correctOption: ic("n3o1", "Grape", "Fruit"),
    distractors: [ic("n3d1", "Hammer", "Metal"), ic("n3d2", "Droplet", "Water"), ic("n3d3", "Mountain", "Stone")],
    tag: "near",
    theme: "food",
  },
  {
    id: "n4",
    constellation: [ic("n4c1", "Car"), ic("n4c2", "Bus"), ic("n4c3", "TrainFront")],
    correctOption: ic("n4o1", "Plane", "Transport"),
    distractors: [ic("n4d1", "Armchair", "Furniture"), ic("n4d2", "PawPrint", "Animals"), ic("n4d3", "Sprout", "Plants")],
    tag: "near",
    theme: "motion",
  },
  {
    id: "n5",
    constellation: [ic("n5c1", "Guitar"), ic("n5c2", "Piano"), ic("n5c3", "Drum")],
    correctOption: ic("n5o1", "Music", "Music"),
    distractors: [ic("n5d1", "FlaskConical", "Science"), ic("n5d2", "Trophy", "Sports"), ic("n5d3", "UtensilsCrossed", "Food")],
    tag: "near",
    theme: "music",
  },
  {
    id: "n6",
    constellation: [ic("n6c1", "Dog"), ic("n6c2", "Cat"), ic("n6c3", "Bird")],
    correctOption: ic("n6o1", "PawPrint", "Pets"),
    distractors: [ic("n6d1", "Mountain", "Rocks"), ic("n6d2", "Cloud", "Clouds"), ic("n6d3", "Star", "Stars")],
    tag: "near",
    theme: "nature",
  },
  {
    id: "n7",
    constellation: [ic("n7c1", "Moon"), ic("n7c2", "Star"), ic("n7c3", "Rocket")],
    correctOption: ic("n7o1", "Orbit", "Space"),
    distractors: [ic("n7d1", "Waves", "Ocean"), ic("n7d2", "Trees", "Forest"), ic("n7d3", "Sun", "Desert")],
    tag: "near",
    theme: "space",
  },
  {
    id: "n8",
    constellation: [ic("n8c1", "Book"), ic("n8c2", "Pencil"), ic("n8c3", "GraduationCap")],
    correctOption: ic("n8o1", "School", "Education"),
    distractors: [ic("n8d1", "ChefHat", "Cooking"), ic("n8d2", "Music", "Dancing"), ic("n8d3", "Waves", "Swimming")],
    tag: "near",
    theme: "work",
  },
  {
    id: "n9",
    constellation: [ic("n9c1", "Heart"), ic("n9c2", "Gift"), ic("n9c3", "Cake")],
    correctOption: ic("n9o1", "PartyPopper", "Birthday"),
    distractors: [ic("n9d1", "Dumbbell", "Workout"), ic("n9d2", "Sparkles", "Cleaning"), ic("n9d3", "Moon", "Sleeping")],
    tag: "near",
    theme: "emotion",
  },
  {
    id: "n10",
    constellation: [ic("n10c1", "Coffee"), ic("n10c2", "Croissant"), ic("n10c3", "Sunrise")],
    correctOption: ic("n10o1", "Sun", "Morning"),
    distractors: [ic("n10d1", "Moon", "Night"), ic("n10d2", "Snowflake", "Winter"), ic("n10d3", "CloudLightning", "Storm")],
    tag: "near",
    theme: "time",
  },
  {
    id: "n11",
    constellation: [ic("n11c1", "Briefcase"), ic("n11c2", "Mail"), ic("n11c3", "Clock")],
    correctOption: ic("n11o1", "Building2", "Office"),
    distractors: [ic("n11d1", "Umbrella", "Beach"), ic("n11d2", "Trees", "Forest"), ic("n11d3", "Mountain", "Mountain")],
    tag: "near",
    theme: "work",
  },
  {
    id: "n12",
    constellation: [ic("n12c1", "Snowflake"), ic("n12c2", "Wind"), ic("n12c3", "ThermometerSnowflake")],
    correctOption: ic("n12o1", "Mountain", "Winter"),
    distractors: [ic("n12d1", "Sun", "Summer"), ic("n12d2", "Flame", "Fire"), ic("n12d3", "Sprout", "Spring")],
    tag: "near",
    theme: "nature",
  },
];

// ============================================
// MID ASSOCIATION PUZZLES (icon-only)
// ============================================

const MID_PUZZLES: ConstellationPuzzle[] = [
  {
    id: "m1",
    constellation: [ic("m1c1", "Lock"), ic("m1c2", "Eye"), ic("m1c3", "Shield")],
    correctOption: ic("m1o1", "ShieldCheck", "Security"),
    distractors: [ic("m1d1", "Gauge", "Speed"), ic("m1d2", "Palette", "Color"), ic("m1d3", "UtensilsCrossed", "Taste")],
    tag: "mid",
    theme: "society",
  },
  {
    id: "m2",
    constellation: [ic("m2c1", "Flame"), ic("m2c2", "Lightbulb"), ic("m2c3", "Zap")],
    correctOption: ic("m2o1", "Battery", "Energy"),
    distractors: [ic("m2d1", "VolumeX", "Silence"), ic("m2d2", "MoonStar", "Darkness"), ic("m2d3", "Anchor", "Weight")],
    tag: "mid",
    theme: "emotion",
  },
  {
    id: "m3",
    constellation: [ic("m3c1", "Compass"), ic("m3c2", "Map"), ic("m3c3", "MapPin")],
    correctOption: ic("m3o1", "Navigation", "Direction"),
    distractors: [ic("m3d1", "Brush", "Texture"), ic("m3d2", "Volume2", "Volume"), ic("m3d3", "Cherry", "Flavor")],
    tag: "mid",
    theme: "motion",
  },
  {
    id: "m4",
    constellation: [ic("m4c1", "Timer"), ic("m4c2", "Target"), ic("m4c3", "AlarmClock")],
    correctOption: ic("m4o1", "Hourglass", "Deadline"),
    distractors: [ic("m4d1", "Music", "Melody"), ic("m4d2", "Flower", "Fragrance"), ic("m4d3", "Brush", "Texture")],
    tag: "mid",
    theme: "time",
  },
  {
    id: "m5",
    constellation: [ic("m5c1", "Leaf"), ic("m5c2", "Recycle"), ic("m5c3", "Sprout")],
    correctOption: ic("m5o1", "TreeDeciduous", "Sustainability"),
    distractors: [ic("m5d1", "Bomb", "Destruction"), ic("m5d2", "Flame", "Explosion"), ic("m5d3", "Factory", "Pollution")],
    tag: "mid",
    theme: "nature",
  },
  {
    id: "m6",
    constellation: [ic("m6c1", "Users"), ic("m6c2", "MessageCircle"), ic("m6c3", "Handshake")],
    correctOption: ic("m6o1", "Network", "Community"),
    distractors: [ic("m6d1", "User", "Solitude"), ic("m6d2", "VolumeX", "Silence"), ic("m6d3", "Milestone", "Distance")],
    tag: "mid",
    theme: "society",
  },
  {
    id: "m7",
    constellation: [ic("m7c1", "Puzzle"), ic("m7c2", "Brain"), ic("m7c3", "Lightbulb")],
    correctOption: ic("m7o1", "Sparkles", "Insight"),
    distractors: [ic("m7d1", "HelpCircle", "Confusion"), ic("m7d2", "Meh", "Boredom"), ic("m7d3", "BatteryLow", "Fatigue")],
    tag: "mid",
    theme: "work",
  },
  {
    id: "m8",
    constellation: [ic("m8c1", "Mic"), ic("m8c2", "Headphones"), ic("m8c3", "Radio")],
    correctOption: ic("m8o1", "Podcast", "Podcast"),
    distractors: [ic("m8d1", "Palette", "Painting"), ic("m8d2", "Hammer", "Sculpture"), ic("m8d3", "Music", "Dance")],
    tag: "mid",
    theme: "music",
  },
  {
    id: "m9",
    constellation: [ic("m9c1", "Sparkles"), ic("m9c2", "Wand2"), ic("m9c3", "Star")],
    correctOption: ic("m9o1", "Stars", "Magic"),
    distractors: [ic("m9d1", "RotateCw", "Routine"), ic("m9d2", "Meh", "Boredom"), ic("m9d3", "Square", "Ordinary")],
    tag: "mid",
    theme: "emotion",
  },
  {
    id: "m10",
    constellation: [ic("m10c1", "Scale"), ic("m10c2", "Gavel"), ic("m10c3", "Landmark")],
    correctOption: ic("m10o1", "BookOpenCheck", "Justice"),
    distractors: [ic("m10d1", "Tornado", "Chaos"), ic("m10d2", "Volume2", "Noise"), ic("m10d3", "Gauge", "Speed")],
    tag: "mid",
    theme: "society",
  },
  {
    id: "m11",
    constellation: [ic("m11c1", "Zap"), ic("m11c2", "Battery"), ic("m11c3", "Plug")],
    correctOption: ic("m11o1", "BatteryFull", "Power"),
    distractors: [ic("m11d1", "VolumeX", "Silence"), ic("m11d2", "Pause", "Stillness"), ic("m11d3", "CircleOff", "Void")],
    tag: "mid",
    theme: "tools",
  },
  {
    id: "m12",
    constellation: [ic("m12c1", "Telescope"), ic("m12c2", "Globe"), ic("m12c3", "Search")],
    correctOption: ic("m12o1", "Compass", "Discovery"),
    distractors: [ic("m12d1", "RotateCw", "Routine"), ic("m12d2", "Meh", "Boredom"), ic("m12d3", "Pause", "Stillness")],
    tag: "mid",
    theme: "space",
  },
];

// ============================================
// REMOTE ASSOCIATION PUZZLES (icon-only)
// ============================================

const REMOTE_PUZZLES: ConstellationPuzzle[] = [
  {
    id: "r1",
    constellation: [ic("r1c1", "Anchor"), ic("r1c2", "TreeDeciduous"), ic("r1c3", "Home")],
    correctOption: ic("r1o1", "Heart", "Belonging"),
    distractors: [ic("r1d1", "Plane", "Flight"), ic("r1d2", "Gauge", "Speed"), ic("r1d3", "Tornado", "Chaos")],
    tag: "remote",
    theme: "emotion",
  },
  {
    id: "r2",
    constellation: [ic("r2c1", "Feather"), ic("r2c2", "Wind"), ic("r2c3", "Cloud")],
    correctOption: ic("r2o1", "CloudFog", "Lightness"),
    distractors: [ic("r2d1", "CloudLightning", "Thunder"), ic("r2d2", "Anchor", "Weight"), ic("r2d3", "Mountain", "Stone")],
    tag: "remote",
    theme: "nature",
  },
  {
    id: "r3",
    constellation: [ic("r3c1", "Hourglass"), ic("r3c2", "Waves"), ic("r3c3", "Clock")],
    correctOption: ic("r3o1", "Timer", "Passage"),
    distractors: [ic("r3d1", "Pause", "Stillness"), ic("r3d2", "Volume2", "Noise"), ic("r3d3", "Palette", "Color")],
    tag: "remote",
    theme: "time",
  },
  {
    id: "r4",
    constellation: [ic("r4c1", "Key"), ic("r4c2", "Sunrise"), ic("r4c3", "DoorOpen")],
    correctOption: ic("r4o1", "Sparkles", "Opportunity"),
    distractors: [ic("r4d1", "Square", "Wall"), ic("r4d2", "Ban", "Barrier"), ic("r4d3", "CircleStop", "Ending")],
    tag: "remote",
    theme: "emotion",
  },
  {
    id: "r5",
    constellation: [ic("r5c1", "Waves"), ic("r5c2", "Activity"), ic("r5c3", "HeartPulse")],
    correctOption: ic("r5o1", "Music", "Rhythm"),
    distractors: [ic("r5d1", "VolumeX", "Silence"), ic("r5d2", "Pause", "Stillness"), ic("r5d3", "CircleOff", "Void")],
    tag: "remote",
    theme: "music",
  },
  {
    id: "r6",
    constellation: [ic("r6c1", "Snowflake"), ic("r6c2", "Fingerprint"), ic("r6c3", "Mic")],
    correctOption: ic("r6o1", "Star", "Uniqueness"),
    distractors: [ic("r6d1", "Equal", "Sameness"), ic("r6d2", "Copy", "Copy"), ic("r6d3", "Users", "Clone")],
    tag: "remote",
    theme: "society",
  },
  {
    id: "r7",
    constellation: [ic("r7c1", "Mountain"), ic("r7c2", "Flag"), ic("r7c3", "Footprints")],
    correctOption: ic("r7o1", "Trophy", "Challenge"),
    distractors: [ic("r7d1", "TreePine", "Valley"), ic("r7d2", "Armchair", "Comfort"), ic("r7d3", "Feather", "Ease")],
    tag: "remote",
    theme: "motion",
  },
  {
    id: "r8",
    constellation: [ic("r8c1", "Sunrise"), ic("r8c2", "Flame"), ic("r8c3", "Sprout")],
    correctOption: ic("r8o1", "Recycle", "Renewal"),
    distractors: [ic("r8d1", "Skull", "Decay"), ic("r8d2", "CircleStop", "Ending"), ic("r8d3", "Snowflake", "Winter")],
    tag: "remote",
    theme: "time",
  },
  {
    id: "r9",
    constellation: [ic("r9c1", "Link"), ic("r9c2", "Cable"), ic("r9c3", "Handshake")],
    correctOption: ic("r9o1", "Network", "Connection"),
    distractors: [ic("r9d1", "Square", "Wall"), ic("r9d2", "SeparatorHorizontal", "Gap"), ic("r9d3", "Scissors", "Divide")],
    tag: "remote",
    theme: "society",
  },
  {
    id: "r10",
    constellation: [ic("r10c1", "Flame"), ic("r10c2", "Bug"), ic("r10c3", "Magnet")],
    correctOption: ic("r10o1", "Heart", "Attraction"),
    distractors: [ic("r10d1", "Ban", "Repulsion"), ic("r10d2", "Milestone", "Distance"), ic("r10d3", "X", "Avoidance")],
    tag: "remote",
    theme: "emotion",
  },
  {
    id: "r11",
    constellation: [ic("r11c1", "Shield"), ic("r11c2", "Umbrella"), ic("r11c3", "VenetianMask")],
    correctOption: ic("r11o1", "ShieldCheck", "Protection"),
    distractors: [ic("r11d1", "EyeOff", "Exposure"), ic("r11d2", "AlertTriangle", "Vulnerability"), ic("r11d3", "DoorOpen", "Openness")],
    tag: "remote",
    theme: "emotion",
  },
  {
    id: "r12",
    constellation: [ic("r12c1", "Infinity"), ic("r12c2", "Mountain"), ic("r12c3", "Cloud")],
    correctOption: ic("r12o1", "Sparkles", "Possibility"),
    distractors: [ic("r12d1", "Minus", "Limit"), ic("r12d2", "Square", "Boundary"), ic("r12d3", "CircleStop", "End")],
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
 * Default: 15 rounds (3 acts × 5).
 */
export function getPuzzlesForSession(
  difficulty: "easy" | "medium" | "hard",
  count: number = 15
): ConstellationPuzzle[] {
  let nearCount: number, midCount: number, remoteCount: number;

  switch (difficulty) {
    case "easy":
      nearCount = Math.ceil(count * 0.6);
      midCount = Math.ceil(count * 0.3);
      remoteCount = Math.max(0, count - nearCount - midCount);
      break;
    case "medium":
      nearCount = Math.ceil(count / 3);
      midCount = Math.ceil(count / 3);
      remoteCount = count - nearCount - midCount;
      break;
    case "hard":
      remoteCount = Math.ceil(count * 0.6);
      midCount = Math.ceil(count * 0.3);
      nearCount = Math.max(0, count - remoteCount - midCount);
      break;
  }

  const nearSample = shuffleArray(NEAR_PUZZLES).slice(0, nearCount);
  const midSample = shuffleArray(MID_PUZZLES).slice(0, midCount);
  const remoteSample = shuffleArray(REMOTE_PUZZLES).slice(0, remoteCount);

  const allPuzzles = shuffleArray([...nearSample, ...midSample, ...remoteSample]);

  return allPuzzles.slice(0, count);
}

/**
 * Shuffle options for a puzzle (returns shuffled array of all 4 options)
 */
export function shuffleOptions(puzzle: ConstellationPuzzle): ConstellationTile[] {
  return shuffleArray([puzzle.correctOption, ...puzzle.distractors]);
}

// ============================================
// ANTI-REPETITION HASH GENERATION
// ============================================

export function getSessionHashParams(
  puzzles: ConstellationPuzzle[],
  difficulty: "easy" | "medium" | "hard"
): { stimulusIds: string[]; distractorSet: string[]; difficulty: string } {
  return {
    stimulusIds: puzzles.map(p => p.correctOption.id),
    distractorSet: puzzles.flatMap(p => p.distractors.map(d => d.id)).slice(0, 20),
    difficulty,
  };
}

export { NEAR_PUZZLES, MID_PUZZLES, REMOTE_PUZZLES };
