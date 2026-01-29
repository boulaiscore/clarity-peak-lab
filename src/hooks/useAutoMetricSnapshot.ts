/**
 * ============================================
 * AUTO METRIC SNAPSHOT HOOK
 * ============================================
 * 
 * Automatically saves daily metric snapshots when:
 * 1. All metrics are loaded
 * 2. Today's snapshot doesn't exist yet
 * 
 * Should be called from a top-level component (e.g., Dashboard).
 */

import { useEffect, useRef } from "react";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { useReasoningQuality } from "@/hooks/useReasoningQuality";
import { useDailyMetricSnapshot } from "@/hooks/useDailyMetricSnapshot";
import { useCognitiveStates } from "@/hooks/useCognitiveStates";
import { useAuth } from "@/contexts/AuthContext";

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
  const { hasTodaySnapshot, saveSnapshot, isSaving } = useDailyMetricSnapshot();
  
  // Prevent multiple saves
  const hasSavedRef = useRef(false);
  const userIdRef = useRef<string | null>(null);
  
  // Reset on user change
  useEffect(() => {
    if (user?.id !== userIdRef.current) {
      hasSavedRef.current = false;
      userIdRef.current = user?.id ?? null;
    }
  }, [user?.id]);
  
  useEffect(() => {
    // Skip if already saved, or still loading, or already has snapshot
    if (hasSavedRef.current) return;
    if (metricsLoading || rqLoading) return;
    if (hasTodaySnapshot) {
      hasSavedRef.current = true;
      return;
    }
    if (isSaving) return;
    if (!user?.id) return;
    
    // All conditions met, save snapshot
    hasSavedRef.current = true;
    
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
      // Allow retry on next mount
      hasSavedRef.current = false;
    });
  }, [
    user?.id,
    metricsLoading,
    rqLoading,
    hasTodaySnapshot,
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
    saveSnapshot,
  ]);
  
  return {
    hasTodaySnapshot: hasTodaySnapshot || hasSavedRef.current,
  };
}
