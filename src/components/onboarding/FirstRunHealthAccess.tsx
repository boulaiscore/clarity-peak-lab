import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, HeartPulse, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useWearableSync } from "@/hooks/useWearableSync";
import { useDeviceUsagePermission } from "@/hooks/useDeviceUsagePermission";
import { getPlatform, isNativePlatform, openHealthSettings } from "@/lib/capacitor/health";
import { trackProductEvent } from "@/lib/productAnalytics";

/**
 * Required data setup. Health / wearable access and phone-use access are
 * core inputs to every metric, so the sheet re-opens on every app session
 * until all available sources are connected, and a persistent reminder
 * stays on Home in between. "Later" only hides it for the current session
 * (store policies forbid hard-blocking the app behind permissions).
 */
const SESSION_SNOOZE_KEY = "looma-data-setup-snoozed";

interface FirstRunHealthAccessProps {
  onVisibilityChange?: (visible: boolean) => void;
}

export function FirstRunHealthAccess({ onVisibilityChange }: FirstRunHealthAccessProps) {
  const { user } = useAuth();
  const health = useWearableSync();
  const usage = useDeviceUsagePermission();
  const platform = getPlatform();
  const native = isNativePlatform();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"health" | "usage" | null>(null);
  const viewedRef = useRef(false);

  const hubName = platform === "android" ? "Health Connect" : "Apple Health";
  const healthApplicable = platform === "android" || health.isAvailable;
  const healthDone = !healthApplicable || health.isConnected;
  const usageDone = !usage.supported || usage.granted;
  const loading = health.isCheckingAvailability || usage.isLoading;
  const totalSteps = (healthApplicable ? 1 : 0) + (usage.supported ? 1 : 0);
  const doneSteps = (healthApplicable && health.isConnected ? 1 : 0) + (usage.supported && usage.granted ? 1 : 0);
  const incomplete = native && !!user?.id && !!user.onboardingCompleted && !loading && totalSteps > 0 && doneSteps < totalSteps;

  const setVisible = useCallback((next: boolean) => {
    setOpen(next);
    onVisibilityChange?.(next);
  }, [onVisibilityChange]);

  // Auto-open once per app session while setup is incomplete.
  useEffect(() => {
    if (!native || !user?.id || !user.onboardingCompleted) return;
    if (loading) { onVisibilityChange?.(true); return; }
    if (!incomplete) { setVisible(false); return; }
    if (sessionStorage.getItem(SESSION_SNOOZE_KEY)) { onVisibilityChange?.(false); return; }
    const t = window.setTimeout(() => setVisible(true), 350);
    return () => window.clearTimeout(t);
  }, [incomplete, loading, native, onVisibilityChange, setVisible, user?.id, user?.onboardingCompleted]);

  useEffect(() => {
    if (!open || viewedRef.current) return;
    viewedRef.current = true;
    trackProductEvent("health_permission_prompt_viewed", { platform, source: "first_home" });
  }, [open, platform]);

  const connectHealth = async () => {
    setBusy("health");
    try {
      if (!health.isAvailable) {
        if (platform === "android") await openHealthSettings();
        toast.error(`Set up ${hubName}, then return to LOOMA`);
        return;
      }
      const ok = await health.connect();
      if (ok) await health.forceSync();
      else toast.error("Health access was not enabled");
    } finally {
      setBusy(null);
    }
  };

  const connectUsage = async () => {
    setBusy("usage");
    try {
      await usage.request();
      toast("Find LOOMA in the list and turn it on", { description: "Then come back to the app." });
    } finally {
      setBusy(null);
    }
  };

  const snooze = () => {
    sessionStorage.setItem(SESSION_SNOOZE_KEY, "1");
    trackProductEvent("health_permission_prompt_deferred", { platform, source: "first_home" });
    setVisible(false);
  };

  return (
    <>
      {incomplete && !open && (
        <button
          type="button"
          onClick={() => setVisible(true)}
          className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-3 right-3 z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-lg"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-primary animate-pulse" />
          <span className="flex-1">
            <span className="block text-[12px] font-semibold text-foreground">Finish data setup · {doneSteps}/{totalSteps}</span>
            <span className="block text-[10px] text-muted-foreground">Your metrics are incomplete without it</span>
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="data-setup-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-end justify-center bg-background/85 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-16 backdrop-blur-sm sm:items-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md overflow-hidden rounded-[26px] border border-border bg-card shadow-2xl"
            >
              <div className="px-6 pb-6 pt-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Required setup · {doneSteps}/{totalSteps}
                </p>
                <h2 id="data-setup-title" className="mt-3 text-[26px] font-semibold leading-[1.08] tracking-tight">
                  Connect your data
                </h2>
                <p className="mt-3 text-[13px] leading-6 text-muted-foreground">
                  Recovery, Readiness and Sharpness are built on these signals. Without them LOOMA can only estimate.
                </p>

                <div className="mt-5 space-y-2">
                  {healthApplicable && (
                    <SetupRow
                      icon={<HeartPulse className="h-4 w-4" />}
                      title={`Health & wearable · ${hubName}`}
                      detail="Sleep, HRV, resting heart rate, movement"
                      done={health.isConnected}
                      busy={busy === "health"}
                      onConnect={() => void connectHealth()}
                    />
                  )}
                  {usage.supported && (
                    <SetupRow
                      icon={<Smartphone className="h-4 w-4" />}
                      title="Phone & social use"
                      detail="Minutes in social and messaging apps · never content"
                      done={usage.granted}
                      busy={busy === "usage"}
                      onConnect={() => void connectUsage()}
                    />
                  )}
                </div>

                {healthDone && usageDone ? (
                  <button
                    type="button"
                    onClick={() => setVisible(false)}
                    className="mt-6 w-full rounded-xl bg-foreground px-4 py-3.5 text-sm font-semibold text-background"
                  >
                    Done
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={snooze}
                    className="mt-4 w-full px-4 py-3 text-xs font-medium text-muted-foreground"
                  >
                    Later — remind me
                  </button>
                )}
                <p className="mt-1 text-center text-[9px] leading-relaxed text-muted-foreground/60">
                  Read only · aggregates only · revoke anytime in Settings
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SetupRow({ icon, title, detail, done, busy, onConnect }: {
  icon: React.ReactNode; title: string; detail: string; done: boolean; busy: boolean; onConnect: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3.5">
      <span className="text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-foreground">{title}</p>
        <p className="text-[10px] text-muted-foreground">{detail}</p>
      </div>
      {done ? (
        <span className="flex items-center gap-1 text-[11px] font-medium text-recovery"><Check className="h-3.5 w-3.5" />On</span>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={onConnect}
          className="rounded-lg bg-foreground px-3 py-1.5 text-[11px] font-semibold text-background disabled:opacity-50"
        >
          {busy ? "…" : "Connect"}
        </button>
      )}
    </div>
  );
}
