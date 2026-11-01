import { useMemo } from "react";
import { format, parseISO, subDays } from "date-fns";
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useRecoveryTargetHistory } from "@/hooks/useRecoveryTargetHistory";
import { digitalEstimateForDate } from "@/lib/recoveryTargetHistory";
import { digitalRecoveryAdjustment } from "@/lib/recoveryV2";

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** 14-day phone-use view: daily minutes in distracting apps vs the personal median. */
export function PhoneUseCard() {
  const { user } = useAuth();
  const { deviceHistory } = useRecoveryTargetHistory(user?.id);
  const today = format(new Date(), "yyyy-MM-dd");

  const view = useMemo(() => {
    const granted = deviceHistory.filter((r) => r.permission_state === "granted");
    const byDate = new Map(granted.map((r) => [r.snapshot_date, r]));
    const days = Array.from({ length: 14 }, (_, i) => format(subDays(new Date(), 13 - i), "yyyy-MM-dd"));
    const series = days.map((date) => {
      const row = byDate.get(date);
      return {
        date,
        label: format(parseISO(date), "EEEEE"),
        minutes: row?.attention_usage_min ?? null,
        isToday: date === today,
      };
    });
    const typical = median(
      granted.filter((r) => r.snapshot_date < today && r.attention_usage_min != null)
        .slice(-14).map((r) => r.attention_usage_min as number),
    );
    const todayRow = byDate.get(today);
    const estimate = digitalEstimateForDate(deviceHistory, today);
    const effect = digitalRecoveryAdjustment(estimate.score, estimate.confidence);
    return { series, typical, todayRow, effect, hasAny: granted.length > 0 };
  }, [deviceHistory, today]);

  if (!view.hasAny) {
    return (
      <section className="rounded-2xl border border-border/30 bg-card/30 p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Phone use</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground/80">
          Allow usage access in Health & wearables to see how phone use shapes your Recovery.
        </p>
      </section>
    );
  }

  const todayMin = view.todayRow?.attention_usage_min ?? null;
  const delta = todayMin != null && view.typical != null && view.typical > 0
    ? Math.round(((todayMin - view.typical) / view.typical) * 100)
    : null;
  const above = (m: number | null) => m != null && view.typical != null && m > view.typical;

  return (
    <section className="rounded-2xl border border-border/30 bg-card/30 p-4" aria-label="Phone use">
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Phone use</p>
        <p className="text-[10px] text-muted-foreground/60">Distracting apps · 14 days</p>
      </div>

      <div className="mt-3 flex items-end gap-3">
        <p className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
          {todayMin != null ? formatMinutes(todayMin) : "—"}
        </p>
        {delta != null && (
          <p className={`pb-1 text-xs tabular-nums ${delta > 0 ? "text-destructive/80" : "text-muted-foreground"}`}>
            {delta > 0 ? "+" : ""}{delta}% vs your usual
          </p>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground/70">
        Today{view.typical != null ? ` · usual ${formatMinutes(view.typical)}` : " · building your baseline"}
      </p>

      <div className="mt-4 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={view.series} margin={{ top: 4, right: 0, bottom: 0, left: -28 }}>
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} interval={0} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} width={40} />
            {view.typical != null && (
              <ReferenceLine y={view.typical} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.6} />
            )}
            <Bar dataKey="minutes" radius={[3, 3, 0, 0]} maxBarSize={14} isAnimationActive={false}>
              {view.series.map((d) => (
                <Cell
                  key={d.date}
                  fill={above(d.minutes) ? "hsl(var(--destructive))" : "hsl(var(--recovery))"}
                  fillOpacity={d.isToday ? 0.95 : 0.45}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground/60">Dashed line = your usual day. Red bars = above usual.</p>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/20 pt-3">
        <Stat label="App switches" value={view.todayRow?.attention_switch_count} />
        <Stat label="Quick checks" value={view.todayRow?.brief_session_count} />
        <Stat
          label="Recovery effect"
          value={view.effect < 0 ? view.effect.toFixed(1) : "0"}
          tone={view.effect < 0 ? "negative" : "muted"}
        />
      </div>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string | null | undefined; tone?: "negative" | "muted" }) {
  return (
    <div>
      <p className={`text-base font-semibold tabular-nums ${tone === "negative" ? "text-destructive/85" : "text-foreground"}`}>
        {value ?? "—"}
      </p>
      <p className="text-[10px] text-muted-foreground/70">{label}</p>
    </div>
  );
}
