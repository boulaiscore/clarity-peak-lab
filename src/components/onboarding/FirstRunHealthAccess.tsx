import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useWearableSync } from "@/hooks/useWearableSync";
import { getPlatform, isNativePlatform } from "@/lib/capacitor/health";
import { trackProductEvent } from "@/lib/productAnalytics";

const HEALTH_PROMPT_KEY = "looma-health-access-prompt-v1";

interface FirstRunHealthAccessProps {
  onVisibilityChange?: (visible: boolean) => void;
}

function decisionKey(userId: string, platform: string): string {
  return `${HEALTH_PROMPT_KEY}:${platform}:${userId}`;
}

export function FirstRunHealthAccess({ onVisibilityChange }: FirstRunHealthAccessProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const wearable = useWearableSync();
  const platform = getPlatform();
  const native = isNativePlatform();
  const [visible, setVisible] = useState(false);
  const viewedRef = useRef(false);

  const platformName = platform === "ios" ? "Apple Health" : "Health Connect";
  const sourceName = "Your device and health data";
  const key = useMemo(
    () => (user?.id ? decisionKey(user.id, platform) : null),
    [platform, user?.id],
  );

  const updateVisibility = useCallback((next: boolean) => {
    setVisible(next);
    onVisibilityChange?.(next);
  }, [onVisibilityChange]);

  useEffect(() => {
    if (!native || !user?.id || !user.onboardingCompleted) {
      updateVisibility(false);
      return;
    }

    if (wearable.isCheckingAvailability) {
      onVisibilityChange?.(true);
      return;
    }

    const hasDecision = key ? localStorage.getItem(key) !== null : false;
    const unavailableOnIos = platform === "ios" && !wearable.isAvailable;

    if (wearable.isConnected || hasDecision || unavailableOnIos) {
      updateVisibility(false);
      return;
    }

    const timer = window.setTimeout(() => updateVisibility(true), 350);
    return () => window.clearTimeout(timer);
  }, [
    key,
    native,
    onVisibilityChange,
    platform,
    updateVisibility,
    user?.id,
    user?.onboardingCompleted,
    wearable.isAvailable,
    wearable.isCheckingAvailability,
    wearable.isConnected,
  ]);

  useEffect(() => {
    if (!visible || viewedRef.current) return;
    viewedRef.current = true;
    trackProductEvent("health_permission_prompt_viewed", {
      platform,
      source: "first_home",
    });
  }, [platform, visible]);

  const rememberDecision = useCallback((decision: "device_selected" | "deferred") => {
    if (key) {
      localStorage.setItem(key, JSON.stringify({ decision, decidedAt: new Date().toISOString() }));
    }
  }, [key]);

  const handleChooseDevice = () => {
    rememberDecision("device_selected");
    updateVisibility(false);
    navigate("/app/wearable");
  };

  const handleDefer = () => {
    rememberDecision("deferred");
    trackProductEvent("health_permission_prompt_deferred", {
      platform,
      source: "first_home",
    });
    updateVisibility(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="health-access-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/80 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-16 backdrop-blur-sm sm:items-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.985 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md overflow-hidden rounded-[26px] border border-white/[0.1] bg-[#101216] shadow-2xl"
          >
            <div className="h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
            <div className="px-6 pb-6 pt-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/55">
                {platformName}
              </p>
              <h2 id="health-access-title" className="mt-3 text-[27px] font-semibold leading-[1.08] tracking-tight">
                Make today’s metrics personal
              </h2>
              <p className="mt-4 text-[14px] leading-6 text-muted-foreground">
                Sleep, HRV, resting heart rate and activity help Recovery and Readiness reflect how your day actually starts.
              </p>

              <div className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-foreground/70">{sourceName}</span>
                  <span className="text-[10px] uppercase tracking-[0.14em] text-foreground/40">Read only</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[9px] font-semibold tracking-[0.14em] text-foreground/55">
                  <span className="rounded-md border border-white/[0.08] px-2 py-1">SLP</span>
                  <span className="rounded-md border border-white/[0.08] px-2 py-1">HRV</span>
                  <span className="rounded-md border border-white/[0.08] px-2 py-1">RHR</span>
                  <span className="rounded-md border border-white/[0.08] px-2 py-1">MOV</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleChooseDevice}
                className="mt-6 w-full rounded-xl bg-foreground px-4 py-3.5 text-sm font-semibold text-background transition-opacity active:opacity-80 disabled:opacity-45"
              >
                Choose my device
              </button>
              <button
                type="button"
                onClick={handleDefer}
                className="mt-2 w-full px-4 py-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-45"
              >
                Not now
              </button>
              <p className="mt-2 text-center text-[9px] leading-relaxed text-muted-foreground/50">
                Optional · choose each data type in the system screen · change access anytime
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
