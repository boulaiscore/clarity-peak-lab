/**
 * ============================================
 * FLASH CONNECT – CONTENT DATA
 * ============================================
 * 
 * Word puzzles for the Flash Connect game.
 * Each puzzle has 3 cue words and 4 connector options.
 * The correct connector integrates multiple cues.
 */

export interface FlashConnectPuzzle {
  id: string;
  cues: string[];
  options: {
    id: string;
    word: string;
    integrationScore: number; // 1.0 = all 3, 0.66 = 2, 0.33 = 1, 0 = irrelevant
    isCorrect: boolean;
  }[];
  difficulty: "easy" | "medium" | "hard";
}

// ============================================
// EASY PUZZLES - Strong, close associations
// ============================================

const EASY_PUZZLES: FlashConnectPuzzle[] = [
  {
    id: "e1",
    cues: ["SUN", "BEACH", "WAVE"],
    options: [
      { id: "e1a", word: "OCEAN", integrationScore: 1.0, isCorrect: true },
      { id: "e1b", word: "MOUNTAIN", integrationScore: 0, isCorrect: false },
      { id: "e1c", word: "FOREST", integrationScore: 0, isCorrect: false },
      { id: "e1d", word: "CITY", integrationScore: 0, isCorrect: false },
    ],
    difficulty: "easy",
  },
  {
    id: "e2",
    cues: ["PEN", "PAPER", "DESK"],
    options: [
      { id: "e2a", word: "OFFICE", integrationScore: 1.0, isCorrect: true },
      { id: "e2b", word: "KITCHEN", integrationScore: 0, isCorrect: false },
      { id: "e2c", word: "GARDEN", integrationScore: 0, isCorrect: false },
      { id: "e2d", word: "GARAGE", integrationScore: 0, isCorrect: false },
    ],
    difficulty: "easy",
  },
  {
    id: "e3",
    cues: ["FLOUR", "OVEN", "SUGAR"],
    options: [
      { id: "e3a", word: "BAKING", integrationScore: 1.0, isCorrect: true },
      { id: "e3b", word: "WASHING", integrationScore: 0, isCorrect: false },
      { id: "e3c", word: "DRIVING", integrationScore: 0, isCorrect: false },
      { id: "e3d", word: "READING", integrationScore: 0, isCorrect: false },
    ],
    difficulty: "easy",
  },
  {
    id: "e4",
    cues: ["BALL", "GOAL", "FIELD"],
    options: [
      { id: "e4a", word: "SOCCER", integrationScore: 1.0, isCorrect: true },
      { id: "e4b", word: "CHESS", integrationScore: 0, isCorrect: false },
      { id: "e4c", word: "POKER", integrationScore: 0, isCorrect: false },
      { id: "e4d", word: "DARTS", integrationScore: 0, isCorrect: false },
    ],
    difficulty: "easy",
  },
  {
    id: "e5",
    cues: ["KEY", "LOCK", "DOOR"],
    options: [
      { id: "e5a", word: "HOUSE", integrationScore: 1.0, isCorrect: true },
      { id: "e5b", word: "WINDOW", integrationScore: 0.33, isCorrect: false },
      { id: "e5c", word: "FLOOR", integrationScore: 0, isCorrect: false },
      { id: "e5d", word: "LAMP", integrationScore: 0, isCorrect: false },
    ],
    difficulty: "easy",
  },
  {
    id: "e6",
    cues: ["WHEEL", "ENGINE", "ROAD"],
    options: [
      { id: "e6a", word: "CAR", integrationScore: 1.0, isCorrect: true },
      { id: "e6b", word: "BOAT", integrationScore: 0.33, isCorrect: false },
      { id: "e6c", word: "PLANE", integrationScore: 0.33, isCorrect: false },
      { id: "e6d", word: "TRAIN", integrationScore: 0.66, isCorrect: false },
    ],
    difficulty: "easy",
  },
  {
    id: "e7",
    cues: ["MOON", "STARS", "NIGHT"],
    options: [
      { id: "e7a", word: "SKY", integrationScore: 1.0, isCorrect: true },
      { id: "e7b", word: "GROUND", integrationScore: 0, isCorrect: false },
      { id: "e7c", word: "WATER", integrationScore: 0, isCorrect: false },
      { id: "e7d", word: "FIRE", integrationScore: 0, isCorrect: false },
    ],
    difficulty: "easy",
  },
  {
    id: "e8",
    cues: ["BRUSH", "CANVAS", "COLOR"],
    options: [
      { id: "e8a", word: "PAINTING", integrationScore: 1.0, isCorrect: true },
      { id: "e8b", word: "SCULPTING", integrationScore: 0.33, isCorrect: false },
      { id: "e8c", word: "DANCING", integrationScore: 0, isCorrect: false },
      { id: "e8d", word: "SINGING", integrationScore: 0, isCorrect: false },
    ],
    difficulty: "easy",
  },
  {
    id: "e9",
    cues: ["NEEDLE", "THREAD", "FABRIC"],
    options: [
      { id: "e9a", word: "SEWING", integrationScore: 1.0, isCorrect: true },
      { id: "e9b", word: "COOKING", integrationScore: 0, isCorrect: false },
      { id: "e9c", word: "CLEANING", integrationScore: 0, isCorrect: false },
      { id: "e9d", word: "BUILDING", integrationScore: 0, isCorrect: false },
    ],
    difficulty: "easy",
  },
  {
    id: "e10",
    cues: ["RAIN", "UMBRELLA", "CLOUD"],
    options: [
      { id: "e10a", word: "STORM", integrationScore: 1.0, isCorrect: true },
      { id: "e10b", word: "SUNSHINE", integrationScore: 0.33, isCorrect: false },
      { id: "e10c", word: "RAINBOW", integrationScore: 0.66, isCorrect: false },
      { id: "e10d", word: "DROUGHT", integrationScore: 0, isCorrect: false },
    ],
    difficulty: "easy",
  },
  {
    id: "e11",
    cues: ["BOOK", "SHELF", "QUIET"],
    options: [
      { id: "e11a", word: "LIBRARY", integrationScore: 1.0, isCorrect: true },
      { id: "e11b", word: "THEATER", integrationScore: 0.33, isCorrect: false },
      { id: "e11c", word: "STADIUM", integrationScore: 0, isCorrect: false },
      { id: "e11d", word: "MALL", integrationScore: 0.33, isCorrect: false },
    ],
    difficulty: "easy",
  },
  {
    id: "e12",
    cues: ["GUITAR", "DRUMS", "STAGE"],
    options: [
      { id: "e12a", word: "CONCERT", integrationScore: 1.0, isCorrect: true },
      { id: "e12b", word: "MUSEUM", integrationScore: 0, isCorrect: false },
      { id: "e12c", word: "OFFICE", integrationScore: 0, isCorrect: false },
      { id: "e12d", word: "SCHOOL", integrationScore: 0, isCorrect: false },
    ],
    difficulty: "easy",
  },
];

// ============================================
// MEDIUM PUZZLES - One far-but-valid option
// ============================================

const MEDIUM_PUZZLES: FlashConnectPuzzle[] = [
  {
    id: "m1",
    cues: ["ICE", "GLASS", "NOTE"],
    options: [
      { id: "m1a", word: "CRYSTAL", integrationScore: 1.0, isCorrect: true },
      { id: "m1b", word: "CLEAR", integrationScore: 0.66, isCorrect: false },
      { id: "m1c", word: "COLD", integrationScore: 0.33, isCorrect: false },
      { id: "m1d", word: "WATER", integrationScore: 0.33, isCorrect: false },
    ],
    difficulty: "medium",
  },
  {
    id: "m2",
    cues: ["BRIDGE", "GAP", "MIND"],
    options: [
      { id: "m2a", word: "CONNECT", integrationScore: 1.0, isCorrect: true },
      { id: "m2b", word: "JUMP", integrationScore: 0.66, isCorrect: false },
      { id: "m2c", word: "THINK", integrationScore: 0.33, isCorrect: false },
      { id: "m2d", word: "BUILD", integrationScore: 0.33, isCorrect: false },
    ],
    difficulty: "medium",
  },
  {
    id: "m3",
    cues: ["FIRE", "LADDER", "HERO"],
    options: [
      { id: "m3a", word: "FIREFIGHTER", integrationScore: 1.0, isCorrect: true },
      { id: "m3b", word: "RESCUE", integrationScore: 0.66, isCorrect: false },
      { id: "m3c", word: "DANGER", integrationScore: 0.33, isCorrect: false },
      { id: "m3d", word: "CLIMB", integrationScore: 0.33, isCorrect: false },
    ],
    difficulty: "medium",
  },
  {
    id: "m4",
    cues: ["CROWN", "THRONE", "CASTLE"],
    options: [
      { id: "m4a", word: "KING", integrationScore: 1.0, isCorrect: true },
      { id: "m4b", word: "GOLD", integrationScore: 0.33, isCorrect: false },
      { id: "m4c", word: "STONE", integrationScore: 0.33, isCorrect: false },
      { id: "m4d", word: "ROYAL", integrationScore: 0.66, isCorrect: false },
    ],
    difficulty: "medium",
  },
  {
    id: "m5",
    cues: ["SEED", "SOIL", "WATER"],
    options: [
      { id: "m5a", word: "GROWTH", integrationScore: 1.0, isCorrect: true },
      { id: "m5b", word: "PLANT", integrationScore: 0.66, isCorrect: false },
      { id: "m5c", word: "GARDEN", integrationScore: 0.66, isCorrect: false },
      { id: "m5d", word: "DIRT", integrationScore: 0.33, isCorrect: false },
    ],
    difficulty: "medium",
  },
  {
    id: "m6",
    cues: ["LIGHT", "SHADOW", "TIME"],
    options: [
      { id: "m6a", word: "SUNDIAL", integrationScore: 1.0, isCorrect: true },
      { id: "m6b", word: "CLOCK", integrationScore: 0.33, isCorrect: false },
      { id: "m6c", word: "DARKNESS", integrationScore: 0.33, isCorrect: false },
      { id: "m6d", word: "DAY", integrationScore: 0.66, isCorrect: false },
    ],
    difficulty: "medium",
  },
  {
    id: "m7",
    cues: ["WAVE", "PARTICLE", "ENERGY"],
    options: [
      { id: "m7a", word: "LIGHT", integrationScore: 1.0, isCorrect: true },
      { id: "m7b", word: "SOUND", integrationScore: 0.66, isCorrect: false },
      { id: "m7c", word: "HEAT", integrationScore: 0.33, isCorrect: false },
      { id: "m7d", word: "WATER", integrationScore: 0.33, isCorrect: false },
    ],
    difficulty: "medium",
  },
  {
    id: "m8",
    cues: ["MASK", "STAGE", "EMOTION"],
    options: [
      { id: "m8a", word: "THEATER", integrationScore: 1.0, isCorrect: true },
      { id: "m8b", word: "DRAMA", integrationScore: 0.66, isCorrect: false },
      { id: "m8c", word: "ACTOR", integrationScore: 0.66, isCorrect: false },
      { id: "m8d", word: "COSTUME", integrationScore: 0.33, isCorrect: false },
    ],
    difficulty: "medium",
  },
  {
    id: "m9",
    cues: ["RHYTHM", "BEAT", "DANCE"],
    options: [
      { id: "m9a", word: "MUSIC", integrationScore: 1.0, isCorrect: true },
      { id: "m9b", word: "DRUM", integrationScore: 0.66, isCorrect: false },
      { id: "m9c", word: "MOVE", integrationScore: 0.33, isCorrect: false },
      { id: "m9d", word: "SOUND", integrationScore: 0.33, isCorrect: false },
    ],
    difficulty: "medium",
  },
  {
    id: "m10",
    cues: ["NEEDLE", "COMPASS", "NORTH"],
    options: [
      { id: "m10a", word: "DIRECTION", integrationScore: 1.0, isCorrect: true },
      { id: "m10b", word: "MAGNET", integrationScore: 0.66, isCorrect: false },
      { id: "m10c", word: "NAVIGATE", integrationScore: 0.66, isCorrect: false },
      { id: "m10d", word: "POINT", integrationScore: 0.33, isCorrect: false },
    ],
    difficulty: "medium",
  },
  {
    id: "m11",
    cues: ["ECHO", "CAVE", "SOUND"],
    options: [
      { id: "m11a", word: "REFLECTION", integrationScore: 1.0, isCorrect: true },
      { id: "m11b", word: "HOLLOW", integrationScore: 0.66, isCorrect: false },
      { id: "m11c", word: "DARK", integrationScore: 0.33, isCorrect: false },
      { id: "m11d", word: "VOICE", integrationScore: 0.33, isCorrect: false },
    ],
    difficulty: "medium",
  },
  {
    id: "m12",
    cues: ["SCALE", "BALANCE", "JUSTICE"],
    options: [
      { id: "m12a", word: "LAW", integrationScore: 1.0, isCorrect: true },
      { id: "m12b", word: "COURT", integrationScore: 0.66, isCorrect: false },
      { id: "m12c", word: "WEIGHT", integrationScore: 0.33, isCorrect: false },
      { id: "m12d", word: "EQUAL", integrationScore: 0.66, isCorrect: false },
    ],
    difficulty: "medium",
  },
];

// ============================================
// HARD PUZZLES - Remote but coherent associations
// ============================================

const HARD_PUZZLES: FlashConnectPuzzle[] = [
  {
    id: "h1",
    cues: ["SPRING", "BOARD", "DIVING"],
    options: [
      { id: "h1a", word: "LEAP", integrationScore: 1.0, isCorrect: true },
      { id: "h1b", word: "JUMP", integrationScore: 0.66, isCorrect: false },
      { id: "h1c", word: "POOL", integrationScore: 0.66, isCorrect: false },
      { id: "h1d", word: "WATER", integrationScore: 0.33, isCorrect: false },
    ],
    difficulty: "hard",
  },
  {
    id: "h2",
    cues: ["MERCURY", "VENUS", "MARS"],
    options: [
      { id: "h2a", word: "ORBIT", integrationScore: 1.0, isCorrect: true },
      { id: "h2b", word: "PLANET", integrationScore: 0.66, isCorrect: false },
      { id: "h2c", word: "SPACE", integrationScore: 0.66, isCorrect: false },
      { id: "h2d", word: "GOD", integrationScore: 0.66, isCorrect: false },
    ],
    difficulty: "hard",
  },
  {
    id: "h3",
    cues: ["DIAMOND", "PRESSURE", "CARBON"],
    options: [
      { id: "h3a", word: "FORMATION", integrationScore: 1.0, isCorrect: true },
      { id: "h3b", word: "JEWEL", integrationScore: 0.33, isCorrect: false },
      { id: "h3c", word: "COAL", integrationScore: 0.66, isCorrect: false },
      { id: "h3d", word: "HARD", integrationScore: 0.33, isCorrect: false },
    ],
    difficulty: "hard",
  },
  {
    id: "h4",
    cues: ["BUTTERFLY", "STORM", "EFFECT"],
    options: [
      { id: "h4a", word: "CHAOS", integrationScore: 1.0, isCorrect: true },
      { id: "h4b", word: "WINGS", integrationScore: 0.33, isCorrect: false },
      { id: "h4c", word: "CHANGE", integrationScore: 0.66, isCorrect: false },
      { id: "h4d", word: "RIPPLE", integrationScore: 0.66, isCorrect: false },
    ],
    difficulty: "hard",
  },
  {
    id: "h5",
    cues: ["BLACK", "HOLE", "GRAVITY"],
    options: [
      { id: "h5a", word: "SINGULARITY", integrationScore: 1.0, isCorrect: true },
      { id: "h5b", word: "SPACE", integrationScore: 0.66, isCorrect: false },
      { id: "h5c", word: "PULL", integrationScore: 0.33, isCorrect: false },
      { id: "h5d", word: "DARK", integrationScore: 0.33, isCorrect: false },
    ],
    difficulty: "hard",
  },
  {
    id: "h6",
    cues: ["TROJAN", "HORSE", "GATE"],
    options: [
      { id: "h6a", word: "DECEPTION", integrationScore: 1.0, isCorrect: true },
      { id: "h6b", word: "WAR", integrationScore: 0.66, isCorrect: false },
      { id: "h6c", word: "TROY", integrationScore: 0.66, isCorrect: false },
      { id: "h6d", word: "WOODEN", integrationScore: 0.33, isCorrect: false },
    ],
    difficulty: "hard",
  },
  {
    id: "h7",
    cues: ["APPLE", "GRAVITY", "NEWTON"],
    options: [
      { id: "h7a", word: "DISCOVERY", integrationScore: 1.0, isCorrect: true },
      { id: "h7b", word: "FALL", integrationScore: 0.66, isCorrect: false },
      { id: "h7c", word: "PHYSICS", integrationScore: 0.66, isCorrect: false },
      { id: "h7d", word: "TREE", integrationScore: 0.33, isCorrect: false },
    ],
    difficulty: "hard",
  },
  {
    id: "h8",
    cues: ["SILK", "ROAD", "TRADE"],
    options: [
      { id: "h8a", word: "EXCHANGE", integrationScore: 1.0, isCorrect: true },
      { id: "h8b", word: "JOURNEY", integrationScore: 0.66, isCorrect: false },
      { id: "h8c", word: "ANCIENT", integrationScore: 0.33, isCorrect: false },
      { id: "h8d", word: "CARAVAN", integrationScore: 0.66, isCorrect: false },
    ],
    difficulty: "hard",
  },
  {
    id: "h9",
    cues: ["DREAM", "LAYER", "INCEPTION"],
    options: [
      { id: "h9a", word: "SUBCONSCIOUS", integrationScore: 1.0, isCorrect: true },
      { id: "h9b", word: "SLEEP", integrationScore: 0.33, isCorrect: false },
      { id: "h9c", word: "DEPTH", integrationScore: 0.66, isCorrect: false },
      { id: "h9d", word: "MIND", integrationScore: 0.66, isCorrect: false },
    ],
    difficulty: "hard",
  },
  {
    id: "h10",
    cues: ["CHESS", "KING", "MATE"],
    options: [
      { id: "h10a", word: "CHECKMATE", integrationScore: 1.0, isCorrect: true },
      { id: "h10b", word: "STRATEGY", integrationScore: 0.66, isCorrect: false },
      { id: "h10c", word: "BOARD", integrationScore: 0.33, isCorrect: false },
      { id: "h10d", word: "GAME", integrationScore: 0.66, isCorrect: false },
    ],
    difficulty: "hard",
  },
  {
    id: "h11",
    cues: ["PHOENIX", "ASH", "REBIRTH"],
    options: [
      { id: "h11a", word: "RENEWAL", integrationScore: 1.0, isCorrect: true },
      { id: "h11b", word: "FIRE", integrationScore: 0.66, isCorrect: false },
      { id: "h11c", word: "BIRD", integrationScore: 0.33, isCorrect: false },
      { id: "h11d", word: "MYTH", integrationScore: 0.66, isCorrect: false },
    ],
    difficulty: "hard",
  },
  {
    id: "h12",
    cues: ["DNA", "HELIX", "CODE"],
    options: [
      { id: "h12a", word: "GENETIC", integrationScore: 1.0, isCorrect: true },
      { id: "h12b", word: "LIFE", integrationScore: 0.66, isCorrect: false },
      { id: "h12c", word: "SPIRAL", integrationScore: 0.33, isCorrect: false },
      { id: "h12d", word: "SEQUENCE", integrationScore: 0.66, isCorrect: false },
    ],
    difficulty: "hard",
  },
];

// ============================================
// SHUFFLE HELPER
// ============================================

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================
// GET PUZZLES FOR SESSION
// ============================================

export function getPuzzlesForSession(
  difficulty: "easy" | "medium" | "hard",
  count: number = 12
): FlashConnectPuzzle[] {
  const pool = difficulty === "easy" 
    ? EASY_PUZZLES 
    : difficulty === "medium" 
      ? MEDIUM_PUZZLES 
      : HARD_PUZZLES;
  
  // Shuffle and pick
  const shuffled = shuffleArray(pool);
  const selected = shuffled.slice(0, Math.min(count, pool.length));
  
  // Also shuffle options within each puzzle
  return selected.map(puzzle => ({
    ...puzzle,
    options: shuffleArray(puzzle.options),
  }));
}
