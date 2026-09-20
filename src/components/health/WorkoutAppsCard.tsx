import { ChevronRight, Footprints } from "lucide-react";
import { getPlatform, isNativePlatform, openHealthSettings } from "@/lib/capacitor/health";
import { trackProductEvent } from "@/lib/productAnalytics";
import { toast } from "sonner";

/**
 * Workout apps (Strava, Runna, Nike Run Club, Garmin Connect...) already write their
 * sessions into Apple Health / Health Connect. LOOMA never talks to them directly:
 * the user only has to allow the app to share workouts with the system health hub.
 */
export function WorkoutAppsCard() {
  const platform = getPlatform();
  const native = isNativePlatform();
  const hubName = platform === "android" ? "Health Connect" : "Apple Health";

  const steps = [
    `Open Strava, Runna, Nike Run Club or your training app`,
    `In its settings, allow it to write workouts to ${hubName}`,
    `LOOMA reads duration, heart rate and effort from there — nothing else`,
  ];

  const openSettings = async () => {
    trackProductEvent("workout_apps_settings_opened", { platform });
    if (!native) {
      toast.message("Continue in the LOOMA mobile app", {
        description: `Workout sharing is managed in ${hubName} on your phone.`,
      });
      return;
    }
    await openHealthSettings();
  };

  return (
    <section className="rounded-[20px] bg-white/[0.03] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]">
      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/20">
          <Footprints size={20} className="text-white/70" strokeWidth={1.6} />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Add your training apps</h2>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Runs, rides and workouts help LOOMA explain your Recovery and Readiness.
          </p>
        </div>
      </div>

      <ol className="mt-4 space-y-2.5 border-t border-white/[0.06] pt-4">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3 text-[11px] leading-relaxed text-white/70">
            <span className="mt-[1px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-[9px] text-white/60">
              {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={() => void openSettings()}
        className="mt-4 flex w-full items-center justify-between rounded-xl bg-white/[0.055] px-4 py-3 text-[11px] font-medium text-white/80"
      >
        Open {hubName}
        <ChevronRight className="h-4 w-4 text-white/35" />
      </button>
    </section>
  );
}
