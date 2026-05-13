/**
 * RecoveryBatteryCard — Editorial Precision
 *
 * Premium, WHOOP-inspired Cognitive Recovery card.
 * Replaces the chunky horizontal battery with a 20-segment precision bar
 * and a refined editorial header (label · value · delta pill · status indicator).
 */

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { getRecoveryStatus } from "@/lib/metricStatusLabels";
import { getMetricDisplayInfo } from "@/lib/metricDisplayLogic";

interface RecoveryBatteryCardProps {
  recovery: number;
  isLoading?: boolean;
  deltaVsYesterday?: string | null;
  onClick?: () => void;
}

const SEGMENTS = 20;

// Adaptive color: red → orange → yellow-green → bright green
function getRecoveryColor(value: number): string {
  if (value <= 35) {
    const hue = 0 + (value / 35) * 30;
    return `hsl(${hue}, 85%, 50%)`;
  }
  if (value <= 65) {
    const hue = 30 + ((value - 35) / 30) * 40;
    return `hsl(${hue}, 80%, 52%)`;
  }
  const hue = 70 + ((value - 65) / 35) * 70;
  return `hsl(${hue}, 88%, 52%)`;
}

export function RecoveryBatteryCard({
  recovery,
  isLoading,
  deltaVsYesterday,
  onClick,
}: RecoveryBatteryCardProps) {
  if (isLoading) {
    return (
      <div className="px-4 py-5 rounded-2xl bg-card/40 border border-border/40 animate-pulse">
        <div className="h-3 bg-muted rounded w-28 mb-3" />
        <div className="h-8 bg-muted rounded w-24 mb-4" />
        <div className="h-8 bg-muted rounded w-full" />
      </div>
    );
  }

  const value = Math.max(0, Math.min(100, recovery));
  const filled = Math.round((value / 100) * SEGMENTS);
  const color = getRecoveryColor(value);
  const status = getRecoveryStatus(value);
  const displayInfo = getMetricDisplayInfo(status.label, status.level, null, null);

  // Delta sign for color
  const isPositive = deltaVsYesterday?.trim().startsWith("+");
  const isNegative = deltaVsYesterday?.trim().startsWith("-");

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={onClick}
      className="w-full text-left px-4 py-5 rounded-2xl bg-card/40 border border-border/40 transition-colors hover:bg-card/60 active:scale-[0.995]"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground/70 uppercase">
            Cognitive Recovery
          </span>
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-4xl font-light tabular-nums tracking-tight text-foreground leading-none">
              {Math.round(value)}
              <span className="text-xl opacity-50 ml-0.5">%</span>
            </h2>
            {deltaVsYesterday && (
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full border tabular-nums"
                style={{
                  color: isPositive ? color : isNegative ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))",
                  backgroundColor: isPositive
                    ? `${color}1A`
                    : isNegative
                    ? "hsl(var(--destructive) / 0.10)"
                    : "hsl(var(--muted) / 0.3)",
                  borderColor: isPositive
                    ? `${color}33`
                    : isNegative
                    ? "hsl(var(--destructive) / 0.25)"
                    : "hsl(var(--border))",
                }}
              >
                {deltaVsYesterday} vs yesterday
              </span>
            )}
          </div>
        </div>
        <div className="p-1.5 rounded-full bg-muted/30 mt-1">
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
        </div>
      </div>

      {/* Status indicator row */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}99` }}
        />
        <span
          className="text-[11px] font-medium tracking-[0.18em] uppercase"
          style={{ color: `${color}` }}
        >
          {displayInfo.text}
        </span>
        <div
          className="h-px flex-1"
          style={{ background: `linear-gradient(to right, ${color}33, transparent)` }}
        />
      </div>

      {/* Precision segmented bar */}
      <div className="space-y-2.5">
        <div className="flex items-end h-7 gap-[3px]">
          {Array.from({ length: SEGMENTS }).map((_, i) => {
            const active = i < filled;
            return (
              <motion.div
                key={i}
                initial={{ scaleY: 0.4, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.05 + i * 0.018, ease: "easeOut" }}
                className="flex-1 rounded-[1px] origin-bottom"
                style={{
                  height: active ? "100%" : "50%",
                  backgroundColor: active ? color : "hsl(var(--muted) / 0.35)",
                  boxShadow: active ? `0 0 6px ${color}40` : "none",
                }}
              />
            );
          })}
        </div>

        <div className="flex justify-between text-[9px] font-medium tracking-[0.15em] text-muted-foreground/50 uppercase">
          <span>Depleted</span>
          <span>Partial</span>
          <span>Optimal</span>
        </div>
      </div>
    </motion.button>
  );
}
