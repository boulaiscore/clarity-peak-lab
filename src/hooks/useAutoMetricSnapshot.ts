/**
 * ============================================
 * AUTO METRIC SNAPSHOT HOOK
 * ============================================
 * 
 * Automatically saves/updates daily metric snapshots when:
 * 1. All metrics are loaded
 * 2. Today's snapshot doesn't exist yet OR values have changed
 * 
 * Uses upsert to ensure the snapshot always reflects the latest values.
 * Should be called from a top-level component (e.g., Dashboard).
 */

import { useEffect, useRef } from "react";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { useReasoningQuality } from "@/hooks/useReasoningQuality";
import { useDailyMetricSnapshot } from "@/hooks/useDailyMetricSnapshot";
import { useAuth } from "@/contexts/AuthContext";

// Threshold for considering values "changed enough" to warrant an update
const VALUE_CHANGE_THRESHOLD = 0.5;

function valuesChanged(
  current: { readiness: number | null; sharpness: number | null; recovery: number | null; rq: number | null },
  saved: { readiness: number | null; sharpness: number | null; recovery: number | null; reasoning_quality: number | null } | null
): boolean {
  if (!saved) return true;
  
  const diff = (a: number | null, b: number | null) => Math.abs((a ?? 0) - (b ?? 0));
  
  return (
    diff(current.readiness, saved.readiness) > VALUE_CHANGE_THRESHOLD ||
    diff(current.sharpness, saved.sharpness) > VALUE_CHANGE_THRESHOLD ||
    diff(current.recovery, saved.recovery) > VALUE_CHANGE_THRESHOLD ||
    diff(current.rq, saved.reasoning_quality) > VALUE_CHANGE_THRESHOLD
  );
}

export function useAutoMetricSnapshot() {
  const { user } = useAuth();
  const { 
    sharpness, 
    readiness, 
    recovery, 
    S1, 
    S2,
    AE,
    RA,
    CT,
    IN,
    isLoading: metricsLoading 
  } = useTodayMetrics();
  
  const { rq, isLoading: rqLoading } = useReasoningQuality();
  const { todaySnapshot, hasTodaySnapshot, saveSnapshot, isSaving, isLoading: snapshotLoading } = useDailyMetricSnapshot();
  
  // Debounce updates to avoid too frequent saves
  const lastSaveRef = useRef<number>(0);
  const userIdRef = useRef<string | null>(null);
  
  // Reset on user change
  useEffect(() => {
    if (user?.id !== userIdRef.current) {
      lastSaveRef.current = 0;
      userIdRef.current = user?.id ?? null;
    }
  }, [user?.id]);
  
  useEffect(() => {
    // Skip if still loading
    if (metricsLoading || rqLoading || snapshotLoading) return;
    if (isSaving) return;
    if (!user?.id) return;
    
    // Debounce: don't save more than once every 30 seconds
    const now = Date.now();
    if (now - lastSaveRef.current < 30_000) return;
    
    const currentValues = { readiness, sharpness, recovery, rq };
    
    // Only save if values have changed meaningfully
    if (!valuesChanged(currentValues, todaySnapshot)) return;
    
    lastSaveRef.current = now;
    
    saveSnapshot({
      readiness,
      sharpness,
      recovery,
      reasoningQuality: rq,
      s1: S1,
      s2: S2,
      ae: AE,
      ra: RA,
      ct: CT,
      inScore: IN,
    }).catch((err) => {
      console.error("[useAutoMetricSnapshot] Failed to save snapshot:", err);
      // Allow retry
      lastSaveRef.current = 0;
    });
  }, [
    user?.id,
    metricsLoading,
    rqLoading,
    snapshotLoading,
    isSaving,
    sharpness,
    readiness,
    recovery,
    rq,
    S1,
    S2,
    AE,
    RA,
    CT,
    IN,
    todaySnapshot,
    saveSnapshot,
  ]);
  
  return {
    hasTodaySnapshot,
  };
}
