import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { useAdaptiveCoachFeatureStatus } from "@/hooks/useAdaptiveCoachShadow";
import { useAdaptiveFocusValidation } from "@/hooks/useAdaptiveFocusCoach";
import { FOCUS_INTEGRITY_VALIDATION_DAYS } from "@/lib/focusIntegrity";
import { cn } from "@/lib/utils";

function percent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

function signed(value: number): string {
  if (Math.abs(value) < 0.05) return "0.0";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
}

function isStorageSetupError(error: unknown): boolean {
  if (!error) return false;
  const serialized = error instanceof Error
    ? error.message
    : typeof error === "string" ? error : JSON.stringify(error);
  return /adaptive_focus_forecasts|passive_focus_observations|PGRST205|42P01|schema cache/i.test(serialized);
}

function Signal({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/25 bg-background/25 px-3 py-2.5">
      <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-primary" : "bg-muted-foreground/25")} />
      <span className={cn("text-[10px] tracking-wide", active ? "text-foreground/85" : "text-muted-foreground/55")}>
        {label}
      </span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground/55">{label}</p>
      <p className="mt-1 text-xl font-medium tabular-nums text-foreground/95">{value}</p>
    </div>
  );
}

export default function AdaptiveCoach() {
  const featureStatus = useAdaptiveCoachFeatureStatus();
  const {
    validation,
    latestOutcome,
    totalForecasts,
    observedForecasts,
    isLoading,
    error,
  } = useAdaptiveFocusValidation();
  const availability = featureStatus.availability;
  const coverage = availability?.coverage ?? 0;
  const setupRequired = isStorageSetupError(error);

  return (
    <AppShell>
      <div className="mx-auto max-w-lg px-5 pb-12 pt-5">
        <Link
          to="/app/settings"
          className="inline-flex rounded-full bg-muted/35 px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/75"
        >
          ← Settings
        </Link>

        <header className="pb-6 pt-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-primary">
              Shadow
            </span>
            <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/55">
              Passive
            </span>
          </div>
          <h1 className="text-[28px] font-semibold tracking-[-0.03em]">Adaptive Coach</h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Learning when your attention holds best.
          </p>
        </header>

        {error && (
          <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
            {setupRequired
              ? "Apply the pending Focus Integrity migration in Lovable."
              : "Coach data is temporarily unavailable."}
          </div>
        )}

        <section className="rounded-2xl border border-border/30 bg-card/45 p-5 shadow-[0_18px_60px_-45px_hsl(var(--primary))]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">Signal coverage</p>
              <p className="mt-2 text-[11px] text-muted-foreground">Your baseline, not other people.</p>
            </div>
            <p className="text-3xl font-medium tabular-nums tracking-tight">
              {featureStatus.isLoading || !availability ? "—" : `${Math.round(coverage * 100)}%`}
            </p>
          </div>

          <div className="mt-4 h-1 overflow-hidden rounded-full bg-muted/50">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${Math.round(coverage * 100)}%` }}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Signal label="METRICS" active={availability?.metricsHistory ?? false} />
            <Signal label="SCHEDULE" active={availability?.calendar ?? false} />
            <Signal label="HEALTH" active={(availability?.phoneHealth ?? false) || (availability?.wearable ?? false)} />
            <Signal label="ATTENTION" active={availability?.deviceUsage ?? false} />
          </div>

          {featureStatus.featureDate && (
            <p className="mt-4 text-[9px] text-muted-foreground/55">
              Updated {format(parseISO(featureStatus.featureDate), "MMM d")}
            </p>
          )}
        </section>

        <section className="mt-4 rounded-2xl border border-border/30 bg-card/45 p-5">
          <div className="flex items-center justify-between gap-3 border-b border-border/25 pb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">Forecast target</p>
              <h2 className="mt-1 text-[17px] font-medium">Focus Integrity</h2>
            </div>
            <span className={cn(
              "rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-[0.12em]",
              availability?.focusIntegrity
                ? "border-primary/25 bg-primary/10 text-primary"
                : "border-border/40 text-muted-foreground/60",
            )}>
              {availability?.focusIntegrity ? "Observed" : "Learning"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-5 py-5">
            <MiniStat
              label="Days"
              value={isLoading ? "—" : `${validation.sampleSize}/${FOCUS_INTEGRITY_VALIDATION_DAYS}`}
            />
            <MiniStat label="Direction" value={isLoading ? "—" : percent(validation.directionalAccuracy)} />
            <MiniStat label="Lift" value={isLoading ? "—" : percent(validation.maeLift)} />
          </div>

          <div className="flex items-center justify-between border-t border-border/25 pt-4 text-[10px] text-muted-foreground/65">
            <span>{observedForecasts} observed</span>
            <span>{totalForecasts} stored</span>
          </div>

          {latestOutcome && (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-background/30 px-4 py-3">
              <div>
                <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/55">
                  {format(parseISO(latestOutcome.targetDate), "MMM d")}
                </p>
                <p className="mt-1 text-[11px] text-foreground/80">Latest check</p>
              </div>
              <div className="flex gap-5 text-right">
                <div>
                  <p className="text-[9px] text-muted-foreground/55">Forecast</p>
                  <p className="text-sm tabular-nums">{signed(latestOutcome.predictedDelta)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground/55">Observed</p>
                  <p className="text-sm tabular-nums">{signed(latestOutcome.observedDelta)}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        <details className="group mt-4 rounded-2xl border border-border/25 bg-card/30 px-5 py-4">
          <summary className="cursor-pointer list-none text-[11px] text-foreground/75">
            <span className="flex items-center justify-between">
              Method & privacy
              <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
            </span>
          </summary>
          <div className="mt-4 space-y-3 border-t border-border/20 pt-4 text-[10px] leading-relaxed text-muted-foreground">
            <p>
              Focus Integrity estimates sustained attention from aggregate usage, interruptions and session continuity. It does not rate intelligence or work quality.
            </p>
            <p>
              No app names, messages, domains or content are stored. Shadow forecasts cannot change your training.
            </p>
          </div>
        </details>
      </div>
    </AppShell>
  );
}
