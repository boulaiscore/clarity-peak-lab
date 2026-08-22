import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type CognitiveMetricsInsert = Database["public"]["Tables"]["user_cognitive_metrics"]["Insert"];

const PENDING_CALIBRATION_PREFIX = "looma:pending-calibration:v1:";

function pendingCalibrationKey(userId: string): string {
  return `${PENDING_CALIBRATION_PREFIX}${userId}`;
}

export function savePendingCalibration(
  userId: string,
  payload: CognitiveMetricsInsert,
): void {
  try {
    window.localStorage.setItem(pendingCalibrationKey(userId), JSON.stringify(payload));
  } catch {
    // Cloud persistence can still succeed when local storage is unavailable.
  }
}

export function clearPendingCalibration(userId: string): void {
  try {
    window.localStorage.removeItem(pendingCalibrationKey(userId));
  } catch {
    // Nothing else is required after a successful cloud write.
  }
}

export async function flushPendingCalibration(userId: string): Promise<boolean> {
  let payload: CognitiveMetricsInsert | null = null;

  try {
    const raw = window.localStorage.getItem(pendingCalibrationKey(userId));
    if (!raw) return true;
    payload = JSON.parse(raw) as CognitiveMetricsInsert;
  } catch {
    return false;
  }

  if (!payload || payload.user_id !== userId) return false;

  const { error } = await supabase
    .from("user_cognitive_metrics")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    console.warn("[Calibration] Pending metric sync deferred:", error.message, error.code);
    return false;
  }

  clearPendingCalibration(userId);
  return true;
}
