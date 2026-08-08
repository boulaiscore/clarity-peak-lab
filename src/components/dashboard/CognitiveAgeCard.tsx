/**
 * ============================================
 * COGNITIVE AGE CARD — WHOOP-inspired Premium
 * ============================================
 *
 * Executive Calm aesthetic:
 * - Date range header
 * - Cognitive Age sphere (single hero element)
 * - Pace of Aging dial
 * - Single elegant insight card
 *
 * Cognitive Age remains prominent while its interpretation stays explicit.
 */

import { ChevronRight, Loader2 } from "lucide-react";
import { format, subDays } from "date-fns";
import { Link } from "react-router-dom";
import { useCognitiveAge } from "@/hooks/useCognitiveAge";
import { CognitiveAgeSphere } from "./CognitiveAgeSphere";
import { CognitiveAgeTrendChart } from "./CognitiveAgeTrendChart";
import { cn } from "@/lib/utils";

export function CognitiveAgeCard() {
  const { data, isLoading } = useCognitiveAge();

  if (isLoading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const displayAge = data.cognitiveAge ?? data.chronoAgeAtOnboarding ?? 30;
  const chronoAge = data.chronoAgeAtOnboarding ?? 30;
  const delta = data.delta;

  const today = new Date();
  const rangeStart = subDays(today, 29);
  const rangeLabel = `${format(rangeStart, "MMM d").toUpperCase()} – ${format(today, "MMM d").toUpperCase()}`;

  return (
    <div className="space-y-5 py-1">
      <div className="flex items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/65">
        <span>30-day view</span>
        <span aria-hidden="true">·</span>
        <span className="text-foreground/75">
          {rangeLabel}
        </span>
      </div>

      {/* Hero sphere */}
      <CognitiveAgeSphere
        cognitiveAge={displayAge}
        delta={delta}
        chronologicalAge={chronoAge}
      />

      <p className="mx-auto max-w-xs text-center text-[10px] leading-relaxed text-muted-foreground/65">
        A training-derived estimate from your LOOMA task trend — not biological age, intelligence or a clinical measure.
      </p>

      {/* Pace of Aging dial */}
      <PaceOfAgingDial paceX={data.paceOfAgingX} />

      {/* Trend chart */}
      <CognitiveAgeTrendChart />

      {/* Single elegant insight */}
      <PrimaryInsight
        cognitiveAge={data.cognitiveAge}
        chronoAge={chronoAge}
        paceX={data.paceOfAgingX}
        isCalibrating={data.isCalibrating}
      />
    </div>
  );
}

// ==========================================
// PACE OF AGING DIAL
// ==========================================

function PaceOfAgingDial({ paceX }: { paceX: number | null }) {
  // Range: 0.0x (very slow / improving) → 2.0x (fast aging)
  // 1.0x = matching chronological pace
  const value = paceX ?? 1.0;
  const clamped = Math.max(0, Math.min(2, value));
  const percent = (clamped / 2) * 100;

  const label =
    clamped < 0.7 ? "Slow" : clamped < 1.15 ? "Steady" : clamped < 1.5 ? "Elevated" : "Fast";

  // Subtle color: green → neutral → amber
  const color =
    clamped < 0.85
      ? "hsl(142, 70%, 50%)"
      : clamped < 1.2
        ? "hsl(210, 12%, 70%)"
        : clamped < 1.5
          ? "hsl(38, 90%, 55%)"
          : "hsl(0, 75%, 58%)";

  return (
    <div className="mx-2">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground/70 uppercase">
          Pace of Aging
        </span>
        <span className="text-xs font-medium text-foreground/80">
          {clamped.toFixed(1)}x
          <span className="ml-1.5 text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            {label}
          </span>
        </span>
      </div>

      {/* Track */}
      <div className="relative h-[2px] w-full bg-border/40 rounded-full">
        {/* Center mark (1.0x) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-2 bg-muted-foreground/30" />

        {/* Indicator dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${percent}%` }}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 0 4px hsl(var(--background)), 0 0 12px ${color}`,
            }}
          />
        </div>
      </div>

      {/* Scale labels */}
      <div className="flex justify-between mt-2 text-[9px] text-muted-foreground/50 tracking-wider uppercase">
        <span>Slow</span>
        <span>1.0x</span>
        <span>Fast</span>
      </div>
    </div>
  );
}

// ==========================================
// PRIMARY INSIGHT
// ==========================================

interface PrimaryInsightProps {
  cognitiveAge: number | null;
  chronoAge: number;
  paceX: number | null;
  isCalibrating: boolean;
}

function PrimaryInsight({ cognitiveAge, chronoAge, paceX, isCalibrating }: PrimaryInsightProps) {
  const { title, body } = computeInsight(cognitiveAge, chronoAge, paceX, isCalibrating);

  return (
    <div className="mx-2">
      <Link
        to="/neuro-lab"
        className={cn(
          "block p-4 rounded-2xl bg-card/40 border border-border/40",
          "hover:bg-card/60 hover:border-border/60 transition-colors group",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground mb-1">{title}</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">{body}</p>
            <span className="inline-flex items-center gap-1 mt-3 text-[10px] font-medium tracking-wider uppercase text-foreground/70 group-hover:text-foreground transition-colors">
              View your plan
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

function computeInsight(
  cognitiveAge: number | null,
  chronoAge: number,
  paceX: number | null,
  isCalibrating: boolean,
) {
  if (isCalibrating || cognitiveAge == null) {
    return {
      title: "Calibrating your baseline",
      body: "Keep collecting consistent sessions. After a stable baseline, Cognitive Age will describe changes from your personal task-performance reference.",
    };
  }

  const diff = chronoAge - cognitiveAge; // positive = younger
  const pace = paceX ?? 1;

  if (diff > 0.5 && pace < 1.05) {
    return {
      title: "Trend below chronological age",
      body: `Your Cognitive Age estimate is ${diff.toFixed(1)}y below your chronological age and its recent pace is steady. Continue the habits associated with this trend.`,
    };
  }
  if (diff > 0.5 && pace >= 1.05) {
    return {
      title: "Below age, recent pace rising",
      body: `The estimate is ${diff.toFixed(1)}y below chronological age, while the recent task trend is rising. Add consistent sessions before interpreting the change.`,
    };
  }
  if (Math.abs(diff) <= 0.5) {
    return {
      title: "Near chronological age",
      body: "The current estimate is close to chronological age. Watch the multi-week direction rather than any single reading.",
    };
  }
  // older than chrono
  return {
    title: "Trend above chronological age",
    body: `The current estimate is ${Math.abs(diff).toFixed(1)}y above chronological age based on recent LOOMA tasks. It is changeable; use your plan and watch the multi-week trend.`,
  };
}
