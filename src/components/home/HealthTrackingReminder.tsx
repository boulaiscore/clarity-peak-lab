import { useState } from "react";
import { HeartPulse, X } from "lucide-react";
import { isNativePlatform, requestPermissions } from "@/lib/capacitor/health";
import { trackProductEvent } from "@/lib/productAnalytics";

const DECISION_KEY = "looma:health-tracking-decision";
const DISMISS_KEY = "looma:health-tracking-reminder-dismissed";

export function markHealthTrackingDecision(outcome: "granted" | "denied" | "skipped") {
  try {
    if (outcome === "granted") {
      localStorage.removeItem(DECISION_KEY);
      localStorage.removeItem(DISMISS_KEY);
    } else {
      localStorage.setItem(DECISION_KEY, outcome);
    }
  } catch {
    // storage unavailable — ignore
  }
}

interface HealthTrackingReminderProps {
  /** Only render when the daily state is running on estimates (Basic coverage). */
  visible: boolean;
}

/**
 * Discreet one-shot card shown on Home when the user skipped/denied the
 * Health permission during onboarding and metrics are still estimates.
 * Mobile-only: never renders on web.
 */
export function HealthTrackingReminder({ visible }: HealthTrackingReminderProps) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return true;
    }
  });
  const [isRequesting, setIsRequesting] = useState(false);

  const pendingDecision = (() => {
    try {
      return localStorage.getItem(DECISION_KEY);
    } catch {
      return null;
    }
  })();

  if (!visible || dismissed || !isNativePlatform() || !pendingDecision) return null;

  const handleEnable = async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      const result = await requestPermissions();
      const anyGranted = result.success
        ? Object.values(result.data?.[0] ?? {}).some((status) => status === "granted")
        : false;
      trackProductEvent("health_tracking_reminder_result", {
        outcome: anyGranted ? "granted" : "denied",
      });
      if (anyGranted) {
        markHealthTrackingDecision("granted");
        window.dispatchEvent(new Event("looma:health-permissions-changed"));
        setDismissed(true);
      }
    } catch {
      trackProductEvent("health_tracking_reminder_result", { outcome: "denied" });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    trackProductEvent("health_tracking_reminder_dismissed");
    setDismissed(true);
  };

  return (
    <section className="relative mx-5 mb-5 overflow-hidden rounded-2xl border border-border/50 bg-card/60 p-4">
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground/50 transition-colors hover:text-muted-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background/70">
          <HeartPulse className="h-4 w-4 text-recovery" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Your metrics are estimates</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Enable automatic tracking — LOOMA reads sleep and movement your phone already collects. Read only, daily totals only.
          </p>
          <button
            type="button"
            onClick={handleEnable}
            disabled={isRequesting}
            className="mt-3 text-xs font-semibold text-primary transition-opacity active:opacity-70 disabled:opacity-50"
          >
            {isRequesting ? "Connecting…" : "Enable automatic tracking →"}
          </button>
        </div>
      </div>
    </section>
  );
}
