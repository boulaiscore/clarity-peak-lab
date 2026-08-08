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
import { useRecordIntradayOnAction } from "@/hooks/useRecordIntradayOnAction";
import { metricSnapshotNeedsSave } from "@/lib/metricSnapshotIntegrity";

export function useAutoMetricSnapshot() {
  const { user } = useAuth();
  const { recordMetricsSnapshot } = useRecordIntradayOnAction();
  const { 
    sharpness, 
    readiness, 
    recoveryRaw,
    S1, 
    S2,
    AE,
    RA,
    CT,
    IN,
    isLoading: metricsLoading 
  } = useTodayMetrics();
  
  const { rq, isLoading: rqLoading, persistRQ } = useReasoningQuality();
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
    
    const currentValues = {
      readiness,
      sharpness,
      recovery: recoveryRaw,
      rq,
      s1: S1,
      s2: S2,
      ae: AE,
      ra: RA,
      ct: CT,
      inScore: IN,
    };
    
    // Also backfill canonical S1/S2 and component fields on older summary-only rows.
    if (!metricSnapshotNeedsSave(currentValues, todaySnapshot)) return;
    
    lastSaveRef.current = now;
    
    saveSnapshot({
      readiness,
      sharpness,
      recovery: recoveryRaw, // Use raw value (null if not initialized) instead of 0 fallback
      reasoningQuality: rq,
      s1: S1,
      s2: S2,
      ae: AE,
      ra: RA,
      ct: CT,
      inScore: IN,
    }).then(() => {
      // Record an intraday event so 1d trend charts reflect decay/metric changes on app open
      recordMetricsSnapshot('app_open', { trigger: 'auto_snapshot' }, 500);
      // Keep the cloud summary aligned whenever the computed daily RQ changes.
      persistRQ().catch((err) => {
        console.error("[useAutoMetricSnapshot] Failed to persist RQ:", err);
      });
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
    recoveryRaw,
    rq,
    S1,
    S2,
    AE,
    RA,
    CT,
    IN,
    todaySnapshot,
    saveSnapshot,
    persistRQ,
    recordMetricsSnapshot,
  ]);
  
  return {
    hasTodaySnapshot,
  };
}
