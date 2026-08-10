import { MonitorPanel } from "@/components/dashboard/MonitorUI";
import {
  isDesktopFocusStorageError,
  useFocusPatterns,
} from "@/hooks/useDesktopFocusPatterns";
import { DESKTOP_PATTERN_RELIABLE_BLOCKS } from "@/lib/workFocusPatterns";
import { cn } from "@/lib/utils";

function PatternValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground/55">{label}</p>
      <p className="mt-1 text-[14px] font-medium tabular-nums text-foreground/90">{value}</p>
    </div>
  );
}

export function FocusPatternsPanel() {
  const { patterns, sensor, isLoading, error } = useFocusPatterns();
  const setupPending = isDesktopFocusStorageError(error);
  const statusLabel = patterns.status === "reliable"
    ? "Reliable"
    : patterns.status === "emerging" ? "Emerging" : "Learning";
  const driver = patterns.topDriver
    ? `${patterns.topDriver.label} ${patterns.topDriver.direction === "supports" ? "supports" : "limits"}`
    : "—";

  return (
    <section aria-labelledby="focus-patterns-title">
      <MonitorPanel className="overflow-hidden p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/65">
              Work rhythm
            </p>
            <h2 id="focus-patterns-title" className="mt-1 text-[17px] font-semibold tracking-tight">
              Focus patterns
            </h2>
          </div>
          <span className={cn(
            "rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-[0.12em]",
            patterns.status === "reliable"
              ? "border-primary/25 bg-primary/10 text-primary"
              : "border-border/40 text-muted-foreground/65",
          )}>
            {sensor.tracking ? "Live" : statusLabel}
          </span>
        </div>

        {isLoading ? (
          <div className="mt-5 h-20 animate-pulse rounded-xl bg-muted/20" />
        ) : error ? (
          <p className="mt-5 text-[11px] text-muted-foreground">
            {setupPending ? "Desktop pattern storage is pending setup." : "Focus patterns are temporarily unavailable."}
          </p>
        ) : !sensor.installed ? (
          <div className="mt-5 border-t border-border/25 pt-4">
            <p className="text-[13px] font-medium text-foreground/90">Desktop signal not connected</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Automatic blocks begin after the sensor is installed.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border/25 pt-5">
            <PatternValue label="Best window" value={patterns.bestWindow ?? "—"} />
            <PatternValue label="Sustainable" value={patterns.sustainableDuration ?? "—"} />
            <PatternValue label="Interruptions" value={patterns.interruptionRisk ?? "—"} />
            <PatternValue label="Driver" value={driver} />
          </div>
        )}

        <div className="mt-5 border-t border-border/25 pt-4">
          <div className="flex items-center justify-between text-[9px] text-muted-foreground/60">
            <span>{patterns.observedBlocks}/{DESKTOP_PATTERN_RELIABLE_BLOCKS} blocks</span>
            <span>{patterns.observedDays} days</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted/45">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${Math.round(patterns.progress * 100)}%` }}
            />
          </div>
        </div>
      </MonitorPanel>
    </section>
  );
}
