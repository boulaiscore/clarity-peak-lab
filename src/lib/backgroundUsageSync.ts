import AppBlocker, { isNativeAndroid } from "@/lib/capacitor/appBlocker";
import { supabase } from "@/integrations/supabase/client";

const REGISTERED_KEY = "looma.bgUsageSync.user";

/**
 * Registers a revocable device token and starts the native 15-minute
 * phone-use upload. Runs once per signed-in user on this device.
 */
export async function ensureBackgroundUsageSync(userId: string): Promise<void> {
  if (!isNativeAndroid()) return;
  try {
    const { enabled } = await AppBlocker.isBackgroundUsageSyncEnabled();
    if (enabled && localStorage.getItem(REGISTERED_KEY) === userId) return;
    const { data, error } = await supabase.functions.invoke<{ token: string }>("device-usage-ingest", {
      body: { action: "register" },
    });
    if (error || !data?.token) throw error ?? new Error("No device token");
    await AppBlocker.enableBackgroundUsageSync({
      token: data.token,
      endpoint: `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/device-usage-ingest`,
      apiKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    });
    localStorage.setItem(REGISTERED_KEY, userId);
  } catch (error) {
    // Older native builds lack the method; foreground sync still works.
    console.warn("[DeviceUsage] Background sync unavailable", error);
  }
}

export async function stopBackgroundUsageSync(): Promise<void> {
  localStorage.removeItem(REGISTERED_KEY);
  if (!isNativeAndroid()) return;
  await Promise.allSettled([
    AppBlocker.disableBackgroundUsageSync(),
    supabase.functions.invoke("device-usage-ingest", { body: { action: "revoke" } }),
  ]);
}
