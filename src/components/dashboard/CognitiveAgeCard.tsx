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
 * No badges, no disclaimers, no stacked warnings.
 */

import { motion } from "framer-motion";
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
    <div className="py-2 space-y-6">
      {/* Date range header — minimal, centered */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground/70 uppercase">
          Healthspan
        </span>
        <span className="text-[11px] font-medium text-foreground/80 tracking-wider">
          {rangeLabel}
        </span>
      </div>

      {/* Hero sphere */}
      <CognitiveAgeSphere
        cognitiveAge={displayAge}
        delta={delta}
        chronologicalAge={chronoAge}
      />

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
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-2"
    >
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
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          initial={{ left: "50%" }}
          animate={{ left: `${percent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <div
            className="w-3 h-3 rounded-full ring-4"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 12px ${color}`,
              // @ts-ignore CSS var
              "--tw-ring-color": "hsl(var(--background))",
            } as React.CSSProperties}
          />
        </motion.div>
      </div>

      {/* Scale labels */}
      <div className="flex justify-between mt-2 text-[9px] text-muted-foreground/50 tracking-wider uppercase">
        <span>Slow</span>
        <span>1.0x</span>
        <span>Fast</span>
      </div>
    </motion.div>
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
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mx-2"
    >
      <Link
        to="/app/training"
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
    </motion.div>
  );
}

function useMemo_insight(
  cognitiveAge: number | null,
  chronoAge: number,
  paceX: number | null,
  isCalibrating: boolean,
) {
  if (isCalibrating || cognitiveAge == null) {
    return {
      title: "Calibrating your baseline",
      body: "Keep training daily. After a stable baseline, your Cognitive Age will reflect how your performance compares to your personal benchmark.",
    };
  }

  const diff = chronoAge - cognitiveAge; // positive = younger
  const pace = paceX ?? 1;

  if (diff > 0.5 && pace < 1.05) {
    return {
      title: "Steady and Healthy",
      body: `Your Cognitive Age is ${diff.toFixed(1)}y younger than your chronological age and your Pace of Aging is slow. Continue your current habits to preserve this trajectory.`,
    };
  }
  if (diff > 0.5 && pace >= 1.05) {
    return {
      title: "Younger, but pace rising",
      body: `You're ${diff.toFixed(1)}y younger than your chronological age, but your recent pace has accelerated. A few consistent sessions this week will stabilize the trend.`,
    };
  }
  if (Math.abs(diff) <= 0.5) {
    return {
      title: "Tracking your chronological age",
      body: "You're aligned with your real age. Consistent training and quality sessions will start opening a margin of cognitive youth.",
    };
  }
  // older than chrono
  return {
    title: "Above chronological age",
    body: `Your performance has been ${Math.abs(diff).toFixed(1)}y above your chronological age. This is reversible — most users return below baseline within 2–3 weeks of consistent training.`,
  };
}
