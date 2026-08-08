import { format } from "date-fns";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { useAdaptiveCoachValidation } from "@/hooks/useAdaptiveCoachShadow";
import { getCoachActionLabel } from "@/lib/adaptiveCoach";
import { cn } from "@/lib/utils";

function formatPercent(value: number | null): string {
  return value == null ? "—" : `${Math.round(value * 100)}%`;
}

function formatSigned(value: number): string {
  if (Math.abs(value) < 0.05) return "0.0";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border border-border/30 bg-card/50 p-4">
      <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/55">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground/70">{note}</p>
    </div>
  );
}

function GateRow({ code, label, passed, value }: { code: string; label: string; passed: boolean; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="w-12 rounded-md border border-border/50 bg-background/40 px-2 py-1 text-center text-[9px] font-semibold tracking-[0.1em]">
        {code}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-foreground/90">{label}</p>
        <p className="text-[10px] text-muted-foreground">{value}</p>
      </div>
      <span
        className={cn(
          "rounded-full border px-2 py-1 text-[8px] uppercase tracking-[0.1em]",
          passed
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            : "border-border/40 text-muted-foreground",
        )}
      >
        {passed ? "Pass" : "Collecting"}
      </span>
    </div>
  );
}

export default function AdaptiveCoach() {
  const {
    validation,
    latestOutcome,
    totalPredictions,
    observedPredictions,
    modelVersion,
    isLoading,
    error,
  } = useAdaptiveCoachValidation();

  const statusLabel = validation.status === "ready_for_review"
    ? "Ready for manual review"
    : validation.status === "needs_revision"
      ? "Needs model revision"
      : "Collecting evidence";

  return (
    <AppShell>
      <div className="mx-auto max-w-lg space-y-6 px-5 pb-12 pt-5">
        <div>
          <Link
            to="/app/settings"
            className="inline-flex rounded-full bg-muted/40 px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/80"
          >
            ← Settings
          </Link>
        </div>

        <header className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-primary">
              Shadow mode
            </span>
            <span className="text-[9px] text-muted-foreground">{modelVersion}</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Adaptive Cognitive Coach</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The coach makes explainable forecasts and checks them against later performance. It cannot change your plan, training order, gating, or difficulty.
            </p>
          </div>
        </header>

        {error ? (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs leading-relaxed text-muted-foreground">
            Coach validation data is temporarily unavailable. Your active training remains unaffected.
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3" aria-label="Coach validation summary">
              <Stat
                label="Evaluated"
                value={isLoading ? "—" : `${validation.sampleSize}/30`}
                note={`${observedPredictions} observed · ${totalPredictions} stored`}
              />
              <Stat
                label="Direction"
                value={isLoading ? "—" : formatPercent(validation.directionalAccuracy)}
                note="Correct forecast direction"
              />
              <Stat
                label="MAE lift"
                value={isLoading ? "—" : formatPercent(validation.maeLift)}
                note="Versus predicting no change"
              />
              <Stat
                label="Coverage"
                value={isLoading ? "—" : `${validation.coveredSkills}/4`}
                note="Skills with at least 5 outcomes"
              />
            </section>

            <section className="rounded-2xl border border-border/30 bg-card/40 p-4">
              <div className="flex items-start justify-between gap-3 border-b border-border/25 pb-3">
                <div>
                  <h2 className="text-sm font-medium">Activation evidence gate</h2>
                  <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                    Passing every gate permits review only. Activation still requires an explicit product release.
                  </p>
                </div>
                <span className="shrink-0 text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                  {statusLabel}
                </span>
              </div>
              <div className="divide-y divide-border/20">
                <GateRow code="N" label="Minimum evidence" passed={validation.gates.minimumSample} value={`${validation.sampleSize}/30 evaluable outcomes`} />
                <GateRow code="DIR" label="Directional accuracy" passed={validation.gates.directionalAccuracy} value={`${formatPercent(validation.directionalAccuracy)} / 60% required`} />
                <GateRow code="LIFT" label="Beat no-change baseline" passed={validation.gates.beatsNoChange} value={`${formatPercent(validation.maeLift)} / 10% required`} />
                <GateRow code="COV" label="Cross-skill coverage" passed={validation.gates.actionCoverage} value={`${validation.coveredSkills}/3 skills required`} />
              </div>
            </section>

            <section className="rounded-2xl border border-border/30 bg-card/40 p-4">
              <h2 className="text-sm font-medium">Latest completed forecast</h2>
              {latestOutcome ? (
                <div className="mt-4 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="rounded-md border border-border/50 px-2 py-1 text-[9px] font-semibold tracking-[0.1em]">
                        {latestOutcome.actionKey.replace("train_", "").toUpperCase()}
                      </span>
                      <p className="mt-2 text-sm font-medium">{getCoachActionLabel(latestOutcome.actionKey)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Forecast {format(new Date(latestOutcome.predictedAt), "MMM d")} · observed {format(new Date(latestOutcome.outcomeAt), "MMM d")}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-right">
                      <div>
                        <p className="text-[8px] uppercase tracking-[0.1em] text-muted-foreground">Predicted</p>
                        <p className="mt-1 text-sm font-semibold tabular-nums">{formatSigned(latestOutcome.predictedDelta)}</p>
                      </div>
                      <div>
                        <p className="text-[8px] uppercase tracking-[0.1em] text-muted-foreground">Observed</p>
                        <p className="mt-1 text-sm font-semibold tabular-nums">{formatSigned(latestOutcome.observedDelta)}</p>
                      </div>
                    </div>
                  </div>
                  {latestOutcome.reasons.length > 0 && (
                    <div className="space-y-2 border-t border-border/25 pt-3">
                      {latestOutcome.reasons.map((reason) => (
                        <div key={reason.code} className="flex gap-3">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                          <div>
                            <p className="text-[11px] text-foreground/85">{reason.label}</p>
                            <p className="text-[10px] leading-relaxed text-muted-foreground">{reason.evidence}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  No forecast has been matched to a later same-skill session yet. Daily candidates are generated automatically and remain hidden from active training.
                </p>
              )}
            </section>
          </>
        )}

        <section className="space-y-3 rounded-2xl border border-border/30 bg-card/40 p-4">
          <div>
            <h2 className="text-sm font-medium">What the model uses</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Current AE, RA, CT and IN states; recent same-skill game scores; time since matching training; and today’s Recovery, Sharpness and Readiness.
            </p>
          </div>
          <div className="border-t border-border/25 pt-3">
            <h2 className="text-sm font-medium">What it does not use</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Name, email, demographics or free text. It does not claim causality and does not personalize active training while in shadow mode.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
