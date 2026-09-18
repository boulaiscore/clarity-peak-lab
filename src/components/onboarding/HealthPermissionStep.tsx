import { useState } from "react";
import { ArrowRight, HeartPulse, Moon, Footprints, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestPermissions } from "@/lib/capacitor/health";
import { trackProductEvent } from "@/lib/productAnalytics";

interface HealthPermissionStepProps {
  onDone: () => void;
}

const SIGNALS = [
  { icon: Moon, label: "Sleep duration & timing" },
  { icon: Footprints, label: "Daily movement" },
  { icon: Activity, label: "Active minutes" },
  { icon: HeartPulse, label: "Heart signals (with a wearable)" },
];

/**
 * Native-only onboarding step that directly requests HealthKit / Health Connect
 * authorization, framed around passive monitoring value ("no training required").
 */
export function HealthPermissionStep({ onDone }: HealthPermissionStepProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  const finish = (outcome: "granted" | "denied" | "skipped") => {
    trackProductEvent("onboarding_health_permission", { outcome });
    // Let phone-health sync retry immediately after a grant.
    window.dispatchEvent(new Event("looma:health-permissions-changed"));
    onDone();
  };

  const handleEnable = async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      const result = await requestPermissions();
      const anyGranted = result.success
        ? Object.values(result.data?.[0] ?? {}).some((status) => status === "granted")
        : false;
      finish(anyGranted ? "granted" : "denied");
    } catch {
      finish("denied");
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <section className="w-full animate-fade-in">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Automatic tracking</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Monitor yourself without doing anything.</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        LOOMA reads signals your phone already collects and turns them into your daily cognitive state.
        No training required — training only helps you improve what you see.
      </p>

      <div className="mt-7 space-y-2.5">
        {SIGNALS.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/50 px-4 py-3.5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background/70">
              <Icon className="h-4 w-4 text-primary" />
            </span>
            <span className="text-sm font-medium text-foreground/90">{label}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-[11px] leading-relaxed text-muted-foreground">
        Read only · only daily totals and aggregates leave your device · you can revoke access anytime.
      </div>

      <Button
        onClick={handleEnable}
        disabled={isRequesting}
        variant="hero"
        size="xl"
        className="mt-7 w-full"
      >
        {isRequesting ? "Connecting…" : "Enable automatic tracking"} {!isRequesting && <ArrowRight />}
      </Button>
      <button
        type="button"
        onClick={() => finish("skipped")}
        className="mt-2 w-full px-4 py-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Not now — I&apos;ll only see estimates
      </button>
    </section>
  );
}
