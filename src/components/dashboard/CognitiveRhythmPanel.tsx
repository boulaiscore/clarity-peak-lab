import { MonitorPanel } from "@/components/dashboard/MonitorUI";
import { useMobileCognitiveRhythm } from "@/hooks/useMobileCognitiveRhythm";
import { MOBILE_RHYTHM_RELIABLE_DAYS } from "@/lib/mobileCognitiveRhythm";
import { cn } from "@/lib/utils";

function RhythmValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground/55">{label}</p>
      <p className="mt-1 text-[14px] font-medium tabular-nums text-foreground/90">{value}</p>
    </div>
  );
}

export function CognitiveRhythmPanel() {
  const { rhythm, isLoading, error } = useMobileCognitiveRhythm();
  const status = rhythm.status === "reliable"
    ? "Reliable"
    : rhythm.status === "emerging" ? "Emerging" : "Learning";
  const driver = rhythm.topDriver
    ? `${rhythm.topDriver.label} ${rhythm.topDriver.direction}`
    : "—";

  return (
    <section aria-labelledby="cognitive-rhythm-title">
      <MonitorPanel className="overflow-hidden p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/65">
              Personal baseline
            </p>
            <h2 id="cognitive-rhythm-title" className="mt-1 text-[17px] font-semibold tracking-tight">
              State drivers
            </h2>
          </div>
          <span className={cn(
            "rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-[0.12em]",
            rhythm.status === "reliable"
              ? "border-primary/25 bg-primary/10 text-primary"
              : "border-border/40 text-muted-foreground/65",
          )}>
            {status}
          </span>
        </div>

        {isLoading ? (
          <div className="mt-5 h-20 animate-pulse rounded-xl bg-muted/20" />
        ) : error ? (
          <p className="mt-5 border-t border-border/25 pt-4 text-[11px] text-muted-foreground">
            Mobile context is temporarily unavailable.
          </p>
        ) : rhythm.observedDays === 0 ? (
          <div className="mt-5 border-t border-border/25 pt-4">
            <p className="text-[13px] font-medium text-foreground/90">Learning your patterns</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Health, attention and schedule update automatically.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-3 gap-x-4 border-t border-border/25 pt-5">
            <RhythmValue label="Attention" value={rhythm.attentionLoad ?? "—"} />
            <RhythmValue label="Schedule" value={rhythm.scheduleLoad ?? "—"} />
            <RhythmValue label="Strongest link" value={driver} />
          </div>
        )}

        <div className="mt-5 border-t border-border/25 pt-4">
          <div className="flex items-center justify-between text-[9px] text-muted-foreground/60">
            <span>{rhythm.observedDays}/{MOBILE_RHYTHM_RELIABLE_DAYS} days</span>
            <span>Private aggregates</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted/45">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${Math.round(rhythm.progress * 100)}%` }}
            />
          </div>
        </div>
      </MonitorPanel>
    </section>
  );
}
