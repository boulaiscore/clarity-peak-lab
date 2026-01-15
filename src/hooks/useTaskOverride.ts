/**
 * Task Override Management Hook
 * 
 * Manages override state, limits, and consequences.
 * 
 * LIMITS:
 * - Max 1 override per day
 * - Max 3 overrides per week
 * - Override disabled if S1Buffer < 40
 * 
 * CONSEQUENCES:
 * - Temporary -3 to S2Capacity for further tasks (same day)
 * - Session tagged as overridden
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { startOfDay, startOfWeek, isAfter, parseISO } from "date-fns";

interface OverrideRecord {
  taskId: string;
  taskType: "podcast" | "reading" | "book";
  timestamp: string;
  s2CapacityAtOverride: number;
  s1BufferAtOverride: number;
}

interface OverrideState {
  todayOverrides: OverrideRecord[];
  weekOverrides: OverrideRecord[];
}

const STORAGE_KEY = "neuroloop_task_overrides";
const MAX_DAILY_OVERRIDES = 1;
const MAX_WEEKLY_OVERRIDES = 3;
const S2_PENALTY_PER_OVERRIDE = 3;

/**
 * Load override state from localStorage
 */
function loadOverrideState(): OverrideState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { todayOverrides: [], weekOverrides: [] };
    }
    
    const data = JSON.parse(stored) as OverrideRecord[];
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    
    // Filter to today's and this week's overrides
    const todayOverrides = data.filter(r => 
      isAfter(parseISO(r.timestamp), todayStart)
    );
    const weekOverrides = data.filter(r => 
      isAfter(parseISO(r.timestamp), weekStart)
    );
    
    return { todayOverrides, weekOverrides };
  } catch {
    return { todayOverrides: [], weekOverrides: [] };
  }
}

/**
 * Save override record to localStorage
 */
function saveOverrideRecord(record: OverrideRecord): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data: OverrideRecord[] = stored ? JSON.parse(stored) : [];
    
    // Add new record
    data.push(record);
    
    // Clean up old records (older than 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const cleaned = data.filter(r => isAfter(parseISO(r.timestamp), weekAgo));
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  } catch {
    // Silently fail
  }
}

export interface UseTaskOverrideResult {
  // Whether override is available (S1Buffer >= 40 and within limits)
  canOverride: boolean;
  
  // Reason why override is disabled
  overrideDisabledReason: string | null;
  
  // Current override counts
  todayOverrideCount: number;
  weekOverrideCount: number;
  
  // S2 penalty from previous overrides today
  s2Penalty: number;
  
  // Adjusted S2 capacity after penalty
  adjustedS2Capacity: number;
  
  // Record an override
  recordOverride: (taskId: string, taskType: "podcast" | "reading" | "book") => void;
  
  // Check if a specific task was already overridden today
  wasOverriddenToday: (taskId: string) => boolean;
  
  // Remaining overrides
  remainingDailyOverrides: number;
  remainingWeeklyOverrides: number;
}

export function useTaskOverride(
  s1Buffer: number,
  s2Capacity: number
): UseTaskOverrideResult {
  const [state, setState] = useState<OverrideState>(() => loadOverrideState());
  
  // Reload state on mount and when window focuses
  useEffect(() => {
    const reload = () => setState(loadOverrideState());
    reload();
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
  }, []);
  
  const todayOverrideCount = state.todayOverrides.length;
  const weekOverrideCount = state.weekOverrides.length;
  
  // Calculate S2 penalty from today's overrides
  const s2Penalty = todayOverrideCount * S2_PENALTY_PER_OVERRIDE;
  const adjustedS2Capacity = Math.max(0, s2Capacity - s2Penalty);
  
  // Determine if override is available
  const { canOverride, overrideDisabledReason } = useMemo(() => {
    // Check S1Buffer first
    if (s1Buffer < 40) {
      return {
        canOverride: false,
        overrideDisabledReason: "System protection active. Override unavailable today.",
      };
    }
    
    // Check daily limit
    if (todayOverrideCount >= MAX_DAILY_OVERRIDES) {
      return {
        canOverride: false,
        overrideDisabledReason: "Daily override limit reached. Try again tomorrow.",
      };
    }
    
    // Check weekly limit
    if (weekOverrideCount >= MAX_WEEKLY_OVERRIDES) {
      return {
        canOverride: false,
        overrideDisabledReason: "Overrides exhausted. System protection active.",
      };
    }
    
    return { canOverride: true, overrideDisabledReason: null };
  }, [s1Buffer, todayOverrideCount, weekOverrideCount]);
  
  const recordOverride = useCallback((taskId: string, taskType: "podcast" | "reading" | "book") => {
    const record: OverrideRecord = {
      taskId,
      taskType,
      timestamp: new Date().toISOString(),
      s2CapacityAtOverride: s2Capacity,
      s1BufferAtOverride: s1Buffer,
    };
    
    saveOverrideRecord(record);
    setState(loadOverrideState());
  }, [s2Capacity, s1Buffer]);
  
  const wasOverriddenToday = useCallback((taskId: string): boolean => {
    return state.todayOverrides.some(r => r.taskId === taskId);
  }, [state.todayOverrides]);
  
  return {
    canOverride,
    overrideDisabledReason,
    todayOverrideCount,
    weekOverrideCount,
    s2Penalty,
    adjustedS2Capacity,
    recordOverride,
    wasOverriddenToday,
    remainingDailyOverrides: MAX_DAILY_OVERRIDES - todayOverrideCount,
    remainingWeeklyOverrides: MAX_WEEKLY_OVERRIDES - weekOverrideCount,
  };
}
