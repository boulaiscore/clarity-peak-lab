import { useMemo, useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { MonitorPanel, MonitorSectionHeader, MonitorSegmentedControl } from "@/components/dashboard/MonitorUI";
import { usePerformanceTrend } from "@/hooks/usePerformanceTrend";
import { METRIC_COLORS } from "@/lib/metricColors";
import type { PerformanceTrendPoint, PerformanceWindow } from "@/lib/performanceTrend";

const WINDOW_OPTIONS = [
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
] as const;

const GRID_COLOR = "hsl(var(--muted-foreground) / 0.14)";
const MUTED_TEXT = "hsl(var(--muted-foreground) / 0.62)";

function TrendDot({
  cx,
  cy,
  payload,
}: {
  cx?: number;
  cy?: number;
  payload?: PerformanceTrendPoint;
}) {
  if (cx === undefined || cy === undefined || !payload || payload.value === null) return null;

  const markerColor = payload.lowSleep
    ? "hsl(var(--warning))"
    : payload.streak
      ? METRIC_COLORS.recovery
      : METRIC_COLORS.reasoningQuality;

  return (
    <g>
      <circle cx={cx} cy={cy} r={payload.lowSleep || payload.streak ? 4 : 2.5} fill="hsl(var(--background))" stroke={markerColor} strokeWidth={1.5} />
      {payload.lowSleep && <circle cx={cx} cy={cy} r={1.3} fill={markerColor} />}
    </g>
  );
}

export function PerformanceTrendCard() {
  const [windowValue, setWindowValue] = useState<"30" | "90">("30");
  const windowDays = Number(windowValue) as PerformanceWindow;
  const { data, isLoading } = usePerformanceTrend(windowDays);

  const observed = useMemo(
    () => data?.points.filter((point) => point.value !== null) ?? [],
    [data?.points],
  );
  const values = observed.map((point) => Number(point.value));
  const minValue = values.length > 0 ? Math.max(0, Math.floor(Math.min(...values) / 10) * 10 - 10) : 0;
  const maxValue = values.length > 0 ? Math.min(100, Math.ceil(Math.max(...values) / 10) * 10 + 10) : 100;

  const headline = !data || data.status === "insufficient"
    ? `Building your performance baseline · ${data?.sessionCount ?? 0} of 6 checks`
    : data.status === "stable"
      ? "Your measured performance is stable"
      : `Your measured performance ${data.status === "improving" ? "improved" : "shifted down"} ${Math.abs(data.changePercent ?? 0).toFixed(1)}%`;

  const detail = !data || data.status === "insufficient"
    ? "Complete short checks on four different days to reveal a trustworthy trend."
    : data.status === "stable"
      ? `No meaningful change yet across ${data.activeDays} measured days.`
      : `Based on ${data.sessionCount} difficulty-adjusted checks across ${data.activeDays} measured days.`;

  return (
    <section className="space-y-3" aria-labelledby="performance-trend-title">
      <MonitorSectionHeader eyebrow="Measured progress" title="Performance trend" />
      <MonitorPanel className="px-4 pb-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 id="performance-trend-title" className="text-[15px] font-semibold leading-snug text-foreground">
              {headline}
            </h3>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground/70">{detail}</p>
          </div>
          <MonitorSegmentedControl
            ariaLabel="Performance period"
            value={windowValue}
            options={WINDOW_OPTIONS}
            onChange={setWindowValue}
            className="w-[116px] shrink-0 [&_button]:min-h-7 [&_button]:px-1 [&_button]:text-[8px] [&_button]:tracking-[0.06em]"
          />
        </div>

        {isLoading ? (
          <div className="mt-5 h-[178px] animate-pulse rounded-lg bg-muted/15" />
        ) : observed.length === 0 ? (
          <div className="mt-5 flex h-[150px] items-center justify-center border-y border-border/40">
            <p className="max-w-[220px] text-center text-[11px] leading-relaxed text-muted-foreground/65">
              Your first completed check will start this timeline.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-4 h-[168px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data?.points} margin={{ top: 12, right: 8, left: -22, bottom: 4 }}>
                  <CartesianGrid horizontal vertical={false} stroke={GRID_COLOR} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    minTickGap={windowDays === 30 ? 34 : 52}
                    tick={{ fontSize: 9, fill: MUTED_TEXT }}
                  />
                  <YAxis
                    domain={[minValue, maxValue]}
                    axisLine={false}
                    tickLine={false}
                    tickCount={4}
                    tick={{ fontSize: 9, fill: MUTED_TEXT }}
                  />
                  <Line
                    type="linear"
                    dataKey="value"
                    stroke={METRIC_COLORS.reasoningQuality}
                    strokeWidth={2}
                    connectNulls
                    dot={(props) => <TrendDot cx={props.cx} cy={props.cy} payload={props.payload as PerformanceTrendPoint} />}
                    activeDot={{ r: 5, fill: "hsl(var(--background))", stroke: METRIC_COLORS.reasoningQuality, strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border/35 pt-3 text-[8px] uppercase tracking-[0.1em] text-muted-foreground/55">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-warning" /> Low sleep
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-recovery" /> 3-day check streak
              </span>
              <span className="ml-auto">Difficulty adjusted</span>
            </div>
          </>
        )}
      </MonitorPanel>
    </section>
  );
}