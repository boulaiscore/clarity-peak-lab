/**
 * Reading Cognitive Permissioning Engine v1.3
 * 
 * Extends the podcast permissioning logic to Books and Articles.
 * 
 * NeuroLoop principle: "If it requires understanding, it consumes cognitive resources."
 * 
 * CATEGORIES:
 * - RECOVERY_SAFE: Only needs S1Buffer >= 50, can have low sharpness
 * - NON_FICTION: Requires S2 + S1 + Sharpness >= 60
 * - BOOK: Highest thresholds + Readiness >= 55 + Sharpness >= 65
 * 
 * HARD LIMITS (v1.3 Anti-Catalog):
 * - Max 1 reading item per day (across all types)
 * - Max 3 book sessions per week
 * - LOW_BANDWIDTH_MODE: No readings, no books (only podcasts LOW/MEDIUM)
 * 
 * IMPORTANT: Tasks do NOT give XP in v1.3 - they are cognitive inputs, not rewards
 */

import { useMemo, useState, useEffect } from "react";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { startOfDay, startOfWeek, isAfter, parseISO } from "date-fns";
import { 
  READINGS, 
  Reading, 
  ReadingType,
  ReadingDemand,
  DEMAND_PENALTY,
  READING_THRESHOLDS,
  GLOBAL_READING_OVERRIDES,
} from "@/data/readings";

export type GlobalMode = "RECOVERY_MODE" | "LOW_BANDWIDTH_MODE" | "FULL_CAPACITY_MODE";

export interface ReadingEligibility {
  reading: Reading;
  enabled: boolean;
  withheldReason: string | null;
  fitScore: number;
}

// Track reading completions for anti-catalog limits
interface ReadingCompletion {
  readingId: string;
  readingType: ReadingType;
  timestamp: string;
}

const READING_COMPLETIONS_KEY = "neuroloop_reading_completions";

function getReadingCompletions(): { todayCount: number; weeklyBookCount: number } {
  try {
    const stored = localStorage.getItem(READING_COMPLETIONS_KEY);
    if (!stored) return { todayCount: 0, weeklyBookCount: 0 };
    
    const data: ReadingCompletion[] = JSON.parse(stored);
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    
    const todayCompletions = data.filter(r => 
      isAfter(parseISO(r.timestamp), todayStart)
    );
    
    const weeklyBookCompletions = data.filter(r => 
      r.readingType === "BOOK" && isAfter(parseISO(r.timestamp), weekStart)
    );
    
    return {
      todayCount: todayCompletions.length,
      weeklyBookCount: weeklyBookCompletions.length,
    };
  } catch {
    return { todayCount: 0, weeklyBookCount: 0 };
  }
}

export interface ReadingPermissioningResult {
  // Current cognitive indices
  s2Capacity: number;
  s1Buffer: number;
  sharpness: number;
  readiness: number;
  
  // Global mode
  globalMode: GlobalMode;
  
  // Eligible readings by category (pre-filtered)
  enabledRecoverySafe: ReadingEligibility[];
  enabledNonFiction: ReadingEligibility[];
  enabledBooks: ReadingEligibility[];
  
  // Final enabled list (max 1 per day in v1.3)
  enabledReadings: ReadingEligibility[];
  
  // All withheld readings
  withheldReadings: ReadingEligibility[];
  
  // Whether we're in recovery mode (show special card)
  isRecoveryMode: boolean;
  
  // v1.3: Anti-catalog limits
  todayReadingCount: number;
  weeklyBookCount: number;
  maxDailyReached: boolean;
  maxWeeklyBooksReached: boolean;
  
  // Loading state
  isLoading: boolean;
}

/**
 * Determine the global mode based on cognitive indices
 * v1.3: LOW_BANDWIDTH_MODE means NO readings (only podcasts LOW/MEDIUM allowed)
 */
function determineGlobalMode(s1Buffer: number, s2Capacity: number): GlobalMode {
  if (s1Buffer < 45) {
    return "RECOVERY_MODE";
  }
  if (s2Capacity < 55) {
    return "LOW_BANDWIDTH_MODE";
  }
  return "FULL_CAPACITY_MODE";
}

/**
 * Check if a reading is eligible based on its type and demand thresholds
 * v1.3: LOW_BANDWIDTH_MODE now withholds ALL readings (not just books)
 */
function checkEligibility(
  reading: Reading,
  s1Buffer: number,
  s2Capacity: number,
  sharpness: number,
  readiness: number,
  globalMode: GlobalMode,
  maxDailyReached: boolean,
  maxWeeklyBooksReached: boolean
): { enabled: boolean; reason: string | null } {
  // In RECOVERY_MODE, withhold EVERYTHING
  if (globalMode === "RECOVERY_MODE") {
    return {
      enabled: false,
      reason: "Withheld: recovery is low. Even structured reading would add invisible load today.",
    };
  }
  
  // v1.3: LOW_BANDWIDTH_MODE withholds ALL readings (only podcasts LOW/MEDIUM allowed)
  if (globalMode === "LOW_BANDWIDTH_MODE") {
    return {
      enabled: false,
      reason: "Withheld: low bandwidth mode. Only light podcasts enabled today.",
    };
  }
  
  // v1.3 Anti-catalog: Max 1 reading per day
  if (maxDailyReached) {
    return {
      enabled: false,
      reason: "Withheld: daily reading limit reached. Cognitive load managed.",
    };
  }
  
  // v1.3 Anti-catalog: Max 3 book sessions per week
  if (reading.readingType === "BOOK" && maxWeeklyBooksReached) {
    return {
      enabled: false,
      reason: "Withheld: weekly book session limit reached (3/week).",
    };
  }
  
  const { readingType, demand } = reading;
  
  // === RECOVERY_SAFE READING ===
  if (readingType === "RECOVERY_SAFE") {
    // Recovery-safe only needs S1Buffer >= 50
    if (s1Buffer < 50) {
      return {
        enabled: false,
        reason: "Withheld: recovery too low for any stimulation.",
      };
    }
    return { enabled: true, reason: null };
  }
  
  // === NON_FICTION READING ===
  if (readingType === "NON_FICTION") {
    // Global override: Sharpness < 60 → withhold ALL non-fiction
    if (sharpness < GLOBAL_READING_OVERRIDES.NON_FICTION_MIN_SHARPNESS) {
      return {
        enabled: false,
        reason: "Withheld: sharpness too low for analytical reading.",
      };
    }
    
    // Get thresholds for this demand level
    const thresholds = READING_THRESHOLDS.NON_FICTION[demand as keyof typeof READING_THRESHOLDS.NON_FICTION];
    if (!thresholds) {
      return { enabled: false, reason: "Withheld: invalid demand level." };
    }
    
    if (s1Buffer < thresholds.s1Buffer) {
      return {
        enabled: false,
        reason: `Withheld: today's capacity does not support ${demand} load.`,
      };
    }
    
    if (s2Capacity < thresholds.s2Capacity) {
      return {
        enabled: false,
        reason: `Withheld: insufficient S2 capacity for ${demand} load.`,
      };
    }
    
    if (sharpness < thresholds.sharpness) {
      return {
        enabled: false,
        reason: `Withheld: sharpness too low for ${demand} analytical reading.`,
      };
    }
    
    return { enabled: true, reason: null };
  }
  
  // === BOOK (Long-form) ===
  if (readingType === "BOOK") {
    // Global override: Readiness < 55 → withhold ALL books
    if (readiness < GLOBAL_READING_OVERRIDES.BOOK_MIN_READINESS) {
      return {
        enabled: false,
        reason: "Withheld: readiness too low for sustained reading.",
      };
    }
    
    // Global override: Sharpness < 65 → withhold ALL books
    if (sharpness < GLOBAL_READING_OVERRIDES.BOOK_MIN_SHARPNESS) {
      return {
        enabled: false,
        reason: "Withheld: sharpness too low for long-form reading.",
      };
    }
    
    // Get thresholds for this demand level
    const thresholds = READING_THRESHOLDS.BOOK[demand as keyof typeof READING_THRESHOLDS.BOOK];
    if (!thresholds) {
      return { enabled: false, reason: "Withheld: invalid demand level for books." };
    }
    
    if (s1Buffer < thresholds.s1Buffer) {
      return {
        enabled: false,
        reason: `Withheld: today's capacity does not support ${demand} book.`,
      };
    }
    
    if (s2Capacity < thresholds.s2Capacity) {
      return {
        enabled: false,
        reason: `Withheld: insufficient S2 capacity for ${demand} book.`,
      };
    }
    
    if (sharpness < thresholds.sharpness) {
      return {
        enabled: false,
        reason: `Withheld: sharpness too low for ${demand} book.`,
      };
    }
    
    return { enabled: true, reason: null };
  }
  
  return { enabled: false, reason: "Withheld: unknown reading type." };
}

/**
 * Calculate fit score for ranking enabled readings
 * fitScore = (S2Capacity - penaltyDemand) + 0.35 * (S1Buffer - 50)
 */
function calculateFitScore(
  reading: Reading,
  s2Capacity: number,
  s1Buffer: number
): number {
  const penalty = DEMAND_PENALTY[reading.demand];
  return (s2Capacity - penalty) + 0.35 * (s1Buffer - 50);
}

export function useReadingPermissioning(): ReadingPermissioningResult {
  const { sharpness, readiness, recovery, isLoading } = useTodayMetrics();
  
  // v1.3: Get anti-catalog limits from localStorage
  const [completionLimits, setCompletionLimits] = useState(() => getReadingCompletions());
  
  // Reload on mount and focus
  useEffect(() => {
    const reload = () => setCompletionLimits(getReadingCompletions());
    reload();
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
  }, []);
  
  const { todayCount, weeklyBookCount } = completionLimits;
  const maxDailyReached = todayCount >= 1; // v1.3: Max 1 reading per day
  const maxWeeklyBooksReached = weeklyBookCount >= 3; // v1.3: Max 3 book sessions per week
  
  const result = useMemo(() => {
    // Calculate derived indices
    const s2Capacity = Math.round(0.6 * sharpness + 0.4 * readiness);
    const s1Buffer = recovery;
    
    // Determine global mode
    const globalMode = determineGlobalMode(s1Buffer, s2Capacity);
    
    // Process all readings with anti-catalog limits
    const allEligibility: ReadingEligibility[] = READINGS.map((reading) => {
      const { enabled, reason } = checkEligibility(
        reading,
        s1Buffer,
        s2Capacity,
        sharpness,
        readiness,
        globalMode,
        maxDailyReached,
        maxWeeklyBooksReached
      );
      
      const fitScore = calculateFitScore(reading, s2Capacity, s1Buffer);
      
      return {
        reading,
        enabled,
        withheldReason: reason,
        fitScore,
      };
    });
    
    // Separate by category
    const enabledRecoverySafe = allEligibility
      .filter(e => e.enabled && e.reading.readingType === "RECOVERY_SAFE")
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 1); // Max 1 recovery-safe
    
    const enabledNonFiction = allEligibility
      .filter(e => e.enabled && e.reading.readingType === "NON_FICTION")
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 1); // Max 1 non-fiction
    
    const enabledBooks = allEligibility
      .filter(e => e.enabled && e.reading.readingType === "BOOK")
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 1); // Max 1 book shown
    
    // v1.3: Only 1 reading per day, prioritize books > non-fiction > recovery-safe
    const enabledReadings: ReadingEligibility[] = [];
    
    if (enabledBooks.length > 0) {
      enabledReadings.push(...enabledBooks);
    } else if (enabledNonFiction.length > 0) {
      enabledReadings.push(...enabledNonFiction);
    } else if (enabledRecoverySafe.length > 0) {
      enabledReadings.push(...enabledRecoverySafe);
    }
    
    // v1.3: Limit to 1 reading per day
    const finalEnabledReadings = enabledReadings.slice(0, 1);
    
    // All withheld readings
    const withheldReadings = allEligibility.filter(e => !e.enabled);
    
    return {
      s2Capacity,
      s1Buffer,
      sharpness,
      readiness,
      globalMode,
      enabledRecoverySafe,
      enabledNonFiction,
      enabledBooks,
      enabledReadings: finalEnabledReadings,
      withheldReadings,
      isRecoveryMode: globalMode === "RECOVERY_MODE",
      todayReadingCount: todayCount,
      weeklyBookCount,
      maxDailyReached,
      maxWeeklyBooksReached,
    };
  }, [sharpness, readiness, recovery, maxDailyReached, maxWeeklyBooksReached, todayCount, weeklyBookCount]);
  
  return {
    ...result,
    isLoading,
  };
}
