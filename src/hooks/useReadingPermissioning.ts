/**
 * Reading Cognitive Permissioning Engine v2.0
 * 
 * OFFICIAL NEUROLOOP RULES:
 * - Passive Tasks (Reading) are ALWAYS accessible
 * - RECOVERY_SAFE is ALWAYS enabled without any threshold
 * - Recovery and cognitive state govern SUGGESTION, not BLOCKING
 * - Tasks are cognitive support, not training
 * 
 * CATEGORIES:
 * - RECOVERY_SAFE: ALWAYS enabled, no threshold required
 * - NON_FICTION: ALWAYS accessible, suggested based on cognitive state
 * - BOOK: ALWAYS accessible, suggested based on cognitive state
 * 
 * ANTI-CATALOG LIMITS (still apply):
 * - Max 1 reading item per day (across all types)
 * - Max 3 book sessions per week
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
  enabled: boolean;        // v2.0: ALWAYS true for passive tasks
  suggested: boolean;      // v2.0: Based on cognitive state
  withheldReason: string | null;  // Now: suggestion reason, not block reason
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
  
  // All withheld readings (now: not-suggested but still accessible)
  withheldReadings: ReadingEligibility[];
  
  // Whether we're in recovery mode (show supportive messaging)
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
 * v2.0: Check if a reading is SUGGESTED (not blocked) based on cognitive state
 * All readings are ALWAYS accessible - this only determines suggestion priority
 * RECOVERY_SAFE is ALWAYS suggested regardless of cognitive state
 */
function checkSuggestion(
  reading: Reading,
  s1Buffer: number,
  s2Capacity: number,
  sharpness: number,
  readiness: number,
  globalMode: GlobalMode,
  maxDailyReached: boolean,
  maxWeeklyBooksReached: boolean
): { suggested: boolean; reason: string | null } {
  
  const { readingType, demand } = reading;
  
  // === RECOVERY_SAFE READING ===
  // v2.0: ALWAYS suggested, no threshold required (official rule)
  if (readingType === "RECOVERY_SAFE") {
    if (maxDailyReached) {
      return {
        suggested: false,
        reason: "Daily reading limit reached. Available tomorrow.",
      };
    }
    return { 
      suggested: true, 
      reason: "Recovery reading is always available for decompression." 
    };
  }
  
  // v2.0 Anti-catalog: Max 1 reading per day affects suggestion
  if (maxDailyReached) {
    return {
      suggested: false,
      reason: "Daily reading limit reached. Cognitive load managed.",
    };
  }
  
  // v2.0 Anti-catalog: Max 3 book sessions per week
  if (readingType === "BOOK" && maxWeeklyBooksReached) {
    return {
      suggested: false,
      reason: "Weekly book session limit reached (3/week).",
    };
  }
  
  // === NON_FICTION READING ===
  if (readingType === "NON_FICTION") {
    // In RECOVERY_MODE or LOW_BANDWIDTH_MODE, not suggested but accessible
    if (globalMode === "RECOVERY_MODE") {
      return {
        suggested: false,
        reason: "Available but not suggested during recovery. Light reading preferred today.",
      };
    }
    if (globalMode === "LOW_BANDWIDTH_MODE") {
      return {
        suggested: false,
        reason: "Available but cognitive bandwidth limited today.",
      };
    }
    
    // FULL_CAPACITY: Check thresholds for suggestion
    if (sharpness < GLOBAL_READING_OVERRIDES.NON_FICTION_MIN_SHARPNESS) {
      return {
        suggested: false,
        reason: "Available but sharpness below optimal for analytical reading.",
      };
    }
    
    const thresholds = READING_THRESHOLDS.NON_FICTION[demand as keyof typeof READING_THRESHOLDS.NON_FICTION];
    if (!thresholds) {
      return { suggested: false, reason: "Available." };
    }
    
    if (s1Buffer < thresholds.s1Buffer) {
      return {
        suggested: false,
        reason: `Available but recovery below optimal for ${demand} content.`,
      };
    }
    
    if (s2Capacity < thresholds.s2Capacity) {
      return {
        suggested: false,
        reason: `Available but deep work capacity limited for ${demand} content.`,
      };
    }
    
    if (sharpness < thresholds.sharpness) {
      return {
        suggested: false,
        reason: `Available but sharpness below optimal for ${demand} analytical reading.`,
      };
    }
    
    return { suggested: true, reason: null };
  }
  
  // === BOOK (Long-form) ===
  if (readingType === "BOOK") {
    // In RECOVERY_MODE or LOW_BANDWIDTH_MODE, not suggested but accessible
    if (globalMode === "RECOVERY_MODE") {
      return {
        suggested: false,
        reason: "Available but not suggested during recovery. Light reading preferred today.",
      };
    }
    if (globalMode === "LOW_BANDWIDTH_MODE") {
      return {
        suggested: false,
        reason: "Available but cognitive bandwidth limited for sustained reading today.",
      };
    }
    
    // FULL_CAPACITY: Check thresholds for suggestion
    if (readiness < GLOBAL_READING_OVERRIDES.BOOK_MIN_READINESS) {
      return {
        suggested: false,
        reason: "Available but readiness below optimal for sustained reading.",
      };
    }
    
    if (sharpness < GLOBAL_READING_OVERRIDES.BOOK_MIN_SHARPNESS) {
      return {
        suggested: false,
        reason: "Available but sharpness below optimal for long-form reading.",
      };
    }
    
    const thresholds = READING_THRESHOLDS.BOOK[demand as keyof typeof READING_THRESHOLDS.BOOK];
    if (!thresholds) {
      return { suggested: false, reason: "Available." };
    }
    
    if (s1Buffer < thresholds.s1Buffer) {
      return {
        suggested: false,
        reason: `Available but today's capacity below optimal for ${demand} book.`,
      };
    }
    
    if (s2Capacity < thresholds.s2Capacity) {
      return {
        suggested: false,
        reason: `Available but S2 capacity below optimal for ${demand} book.`,
      };
    }
    
    if (sharpness < thresholds.sharpness) {
      return {
        suggested: false,
        reason: `Available but sharpness below optimal for ${demand} book.`,
      };
    }
    
    return { suggested: true, reason: null };
  }
  
  return { suggested: false, reason: "Available." };
}

/**
 * Calculate fit score for ranking readings
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
    // v2.0: ALL readings are enabled, suggested determines priority
    const allEligibility: ReadingEligibility[] = READINGS.map((reading) => {
      const { suggested, reason } = checkSuggestion(
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
        enabled: true,  // v2.0: ALWAYS true for passive tasks
        suggested,
        withheldReason: reason,
        fitScore,
      };
    });
    
    // Separate by category - all are enabled, filter by suggested for display
    const enabledRecoverySafe = allEligibility
      .filter(e => e.suggested && e.reading.readingType === "RECOVERY_SAFE")
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 1);
    
    const enabledNonFiction = allEligibility
      .filter(e => e.suggested && e.reading.readingType === "NON_FICTION")
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 1);
    
    const enabledBooks = allEligibility
      .filter(e => e.suggested && e.reading.readingType === "BOOK")
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 1);
    
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
    
    // Non-suggested readings (still accessible, just not optimal)
    const withheldReadings = allEligibility.filter(e => !e.suggested);
    
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
