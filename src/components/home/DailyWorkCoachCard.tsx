import { useEffect, useState } from "react";
import { formatDistanceStrict } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useDailyWorkRecommendation } from "@/hooks/useDailyWorkRecommendation";

interface DailyWorkCoachCardProps {
  sharpness: number;
  readiness: number;
  recovery: number;
  reasoningQuality: number;
  recoveryInitialized: boolean;
  hasWearableData: boolean;
  isLoading: boolean;
}

function RatingScale({
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  value: number | null;
  onChange: (value: number) => void;
  lowLabel: string;
  highLabel: string;
}) {
  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={cn(
              "h-10 rounded-xl border text-xs font-semibold tabular-nums transition-colors",
              value === rating
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/50 bg-background/50 text-muted-foreground hover:border-primary/50",
            )}
          >
            {rating}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[9px] text-muted-foreground/65">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

export function DailyWorkCoachCard(props: DailyWorkCoachCardProps) {
  const {
    recommendation,
    record,
    status,
    isLoading,
    syncError,
    syncPending,
    start,
    submitOutcome,
    dismiss,
    abandon,
    restore,
    isMutating,
  } = useDailyWorkRecommendation(
    {
      sharpness: props.sharpness,
      readiness: props.readiness,
      recovery: props.recovery,
      reasoningQuality: props.reasoningQuality,
      recoveryInitialized: props.recoveryInitialized,
      hasWearableData: props.hasWearableData,
    },
    !props.isLoading,
  );
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const [outcomeAchieved, setOutcomeAchieved] = useState<"yes" | "partly" | "no" | null>(null);
  const [qualityRating, setQualityRating] = useState<number | null>(null);
  const [effortRating, setEffortRating] = useState<number | null>(null);
  const [clockNow, setClockNow] = useState(() => new Date());

  useEffect(() => {
    if (status !== "started") return;
    const timer = window.setInterval(() => setClockNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, [status]);

  const elapsedLabel = record?.started_at
    ? formatDistanceStrict(new Date(record.started_at), clockNow, { roundingMethod: "floor" })
    : null;

  const handle = async (operation: () => Promise<unknown>, successMessage?: string) => {
    try {
      await operation();
      if (successMessage) toast.success(successMessage);
    } catch (error) {
      console.error("[DailyWorkCoach] Cloud update failed:", error);
      toast.error("Could not sync this action. Please try again.");
    }
  };

  const canSubmit = outcomeAchieved !== null && qualityRating !== null && effortRating !== null;
  const loading = props.isLoading || isLoading;

  if (loading && !record) {
    return <div className="mb-5 h-[218px] animate-pulse rounded-3xl border border-border/30 bg-card/45" />;
  }

  if (status === "completed") {
    return (
      <section className="mb-5 rounded-3xl border border-primary/20 bg-card/60 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-primary">Outcome saved</p>
            <h2 className="mt-2 text-[17px] font-semibold tracking-tight">One useful signal from real work.</h2>
          </div>
          <span className="rounded-full border border-border/40 px-3 py-1 text-[10px] tabular-nums text-muted-foreground">
            Quality {record?.quality_rating ?? "—"}/5
          </span>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
          {syncPending
            ? "Saved on this device. LOOMA will retry private cloud sync automatically."
            : "LOOMA will compare this outcome with the conditions and recommendation recorded before the block."}
        </p>
      </section>
    );
  }

  if (status === "dismissed" || status === "abandoned") {
    return (
      <section className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-border/35 bg-card/45 px-4 py-3.5">
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">Today’s work window</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {status === "dismissed" ? "Not planned today." : "Block ended without an outcome."}
          </p>
        </div>
        <button
          type="button"
          disabled={isMutating}
          onClick={() => void handle(restore)}
          className="shrink-0 rounded-full border border-border/50 px-3 py-2 text-[10px] font-medium text-foreground/85"
        >
          Restore
        </button>
      </section>
    );
  }

  const started = status === "started";

  return (
    <>
      <section className="mb-5 overflow-hidden rounded-3xl border border-primary/20 bg-card/65 shadow-[0_18px_60px_-42px_hsl(var(--primary)/0.75)]">
        <div className="p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-primary">
              {started ? "Work block active" : "Today’s work window"}
            </p>
            <span className="rounded-full border border-border/40 bg-background/35 px-2.5 py-1 text-[8px] uppercase tracking-[0.1em] text-muted-foreground">
              {started ? `${elapsedLabel ?? "0 minutes"} elapsed` : recommendation.confidenceLabel}
            </span>
          </div>

          <h2 className="mt-3 text-[20px] font-semibold leading-snug tracking-tight">
            {recommendation.title}
          </h2>
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
            {started ? recommendation.objectivePrompt : recommendation.rationale}
          </p>

          <div className="mt-4 border-t border-border/25 pt-3">
            <p className="text-[9px] uppercase tracking-[0.13em] text-muted-foreground/60">
              {recommendation.plannedDurationMinutes} min · {recommendation.intensity} window
            </p>
            {!started && (
              <p className="mt-1.5 text-[9px] leading-relaxed text-muted-foreground/55">
                {recommendation.evidenceLabel}
              </p>
            )}
          </div>

          {syncError && (
            <p className="mt-3 text-[10px] text-amber-300/80">
              Cloud sync is temporarily unavailable. Actions remain available and will retry from this device.
            </p>
          )}
        </div>

        <div className="flex border-t border-border/30">
          <button
            type="button"
            disabled={isMutating}
            onClick={() => {
              if (started) setOutcomeOpen(true);
              else void handle(start, syncError ? "Work block started; cloud sync will retry" : "Work block started");
            }}
            className="flex-1 bg-primary/95 px-4 py-3.5 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary disabled:opacity-50"
          >
            {isMutating ? "Syncing…" : started ? "Finish and log outcome" : `Start ${recommendation.plannedDurationMinutes} min block`}
          </button>
          {!started && (
            <button
              type="button"
              disabled={isMutating}
              onClick={() => void handle(dismiss)}
              className="border-l border-border/30 px-4 py-3.5 text-[10px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              Not today
            </button>
          )}
        </div>
      </section>

      <Dialog open={outcomeOpen} onOpenChange={setOutcomeOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-3xl border-border/50 p-5">
          <DialogHeader className="text-left">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-primary">Work outcome</p>
            <DialogTitle className="text-xl leading-tight">How did the block go?</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Three answers help LOOMA learn from your work, not judge your ability.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-1">
            <div>
              <p className="mb-2 text-[11px] font-medium text-foreground/90">Did you reach the intended outcome?</p>
              <div className="grid grid-cols-3 gap-2">
                {(["yes", "partly", "no"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setOutcomeAchieved(value)}
                    className={cn(
                      "h-10 rounded-xl border text-[10px] font-medium capitalize transition-colors",
                      outcomeAchieved === value
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border/50 bg-card/50 text-muted-foreground",
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-medium text-foreground/90">Quality of focus</p>
              <RatingScale value={qualityRating} onChange={setQualityRating} lowLabel="Fragmented" highLabel="Deep" />
            </div>

            <div>
              <p className="mb-2 text-[11px] font-medium text-foreground/90">Perceived effort</p>
              <RatingScale value={effortRating} onChange={setEffortRating} lowLabel="Light" highLabel="Heavy" />
            </div>
          </div>

          <button
            type="button"
            disabled={!canSubmit || isMutating}
            onClick={() => {
              if (!canSubmit || !outcomeAchieved || qualityRating == null || effortRating == null) return;
              void handle(
                async () => {
                  await submitOutcome({ outcomeAchieved, qualityRating, effortRating });
                  setOutcomeOpen(false);
                },
                syncError ? "Outcome saved; cloud sync will retry" : "Outcome saved to your private history",
              );
            }}
            className="h-12 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            {isMutating ? "Saving…" : "Save outcome"}
          </button>

          <button
            type="button"
            disabled={isMutating}
            onClick={() => void handle(async () => {
              await abandon();
              setOutcomeOpen(false);
            })}
            className="text-[10px] text-muted-foreground/70 hover:text-muted-foreground"
          >
            End without rating
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
