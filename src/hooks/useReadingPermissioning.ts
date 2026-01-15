/**
 * Reading Cognitive Permissioning Engine
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
 * HARD LIMITS:
 * - Max 1 Recovery-Safe per day
 * - Max 1 Non-Fiction per day  
 * - Max 2 total reading items per day
 * - Prefer diversity: if Book shown, don't show Non-Fiction same day
 */

import { useMemo } from "react";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
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
  
  // Final enabled list (max 2 total, diversity rule applied)
  enabledReadings: ReadingEligibility[];
  
  // All withheld readings
  withheldReadings: ReadingEligibility[];
  
  // Whether we're in recovery mode (show special card)
  isRecoveryMode: boolean;
  
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
 * Check if a reading is eligible based on its type and demand thresholds
 */
function checkEligibility(
  reading: Reading,
  s1Buffer: number,
  s2Capacity: number,
  sharpness: number,
  readiness: number,
  globalMode: GlobalMode
): { enabled: boolean; reason: string | null } {
  // In RECOVERY_MODE, withhold EVERYTHING
  if (globalMode === "RECOVERY_MODE") {
    return {
      enabled: false,
      reason: "Withheld: recovery is low. Even structured reading would add invisible load today.",
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
    // In LOW_BANDWIDTH_MODE, non-fiction is withheld
    if (globalMode === "LOW_BANDWIDTH_MODE") {
      return {
        enabled: false,
        reason: "Withheld: insufficient capacity for active understanding.",
      };
    }
    
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
    // In LOW_BANDWIDTH_MODE, books are withheld
    if (globalMode === "LOW_BANDWIDTH_MODE") {
      return {
        enabled: false,
        reason: "Withheld: long-form reading would accumulate fatigue.",
      };
    }
    
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
  
  const result = useMemo(() => {
    // Calculate derived indices
    const s2Capacity = Math.round(0.6 * sharpness + 0.4 * readiness);
    const s1Buffer = recovery;
    
    // Determine global mode
    const globalMode = determineGlobalMode(s1Buffer, s2Capacity);
    
    // Process all readings
    const allEligibility: ReadingEligibility[] = READINGS.map((reading) => {
      const { enabled, reason } = checkEligibility(
        reading,
        s1Buffer,
        s2Capacity,
        sharpness,
        readiness,
        globalMode
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
      .slice(0, 1); // Max 1 recovery-safe per day
    
    const enabledNonFiction = allEligibility
      .filter(e => e.enabled && e.reading.readingType === "NON_FICTION")
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 1); // Max 1 non-fiction per day
    
    const enabledBooks = allEligibility
      .filter(e => e.enabled && e.reading.readingType === "BOOK")
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 1); // Max 1 book shown at a time
    
    // Apply diversity rule: max 2 total, prefer diversity
    // If we have a book, prioritize it, then add recovery-safe if available
    // Avoid showing book + non-fiction on same day (too much S2 load)
    const enabledReadings: ReadingEligibility[] = [];
    
    if (enabledBooks.length > 0) {
      enabledReadings.push(...enabledBooks);
      // Add recovery-safe as complement (it's S1-leaning, provides balance)
      if (enabledRecoverySafe.length > 0 && enabledReadings.length < 2) {
        enabledReadings.push(...enabledRecoverySafe);
      }
    } else if (enabledNonFiction.length > 0) {
      enabledReadings.push(...enabledNonFiction);
      // Add recovery-safe as complement
      if (enabledRecoverySafe.length > 0 && enabledReadings.length < 2) {
        enabledReadings.push(...enabledRecoverySafe);
      }
    } else if (enabledRecoverySafe.length > 0) {
      enabledReadings.push(...enabledRecoverySafe);
    }
    
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
      enabledReadings,
      withheldReadings,
      isRecoveryMode: globalMode === "RECOVERY_MODE",
    };
  }, [sharpness, readiness, recovery]);
  
  return {
    ...result,
    isLoading,
  };
}
