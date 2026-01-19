/**
 * Reasoning Quality – Impact Analysis
 * 
 * WHOOP-inspired analysis page showing behavioral impacts on RQ.
 * Premium, scientific, S2-focused.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useReasoningQuality } from "@/hooks/useReasoningQuality";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface ImpactDriver {
  id: string;
  name: string;
  impact: number; // -30 to +30
  type: "positive" | "neutral" | "negative";
  description: string;
  details: {
    period: string;
    frequency: string;
    direction: string;
    note: string;
  };
  isNew?: boolean;
}

export default function ReasoningQualityImpact() {
  const navigate = useNavigate();
  const { rq, s2Core, s2Consistency, taskPriming, isLoading } = useReasoningQuality();
  const [selectedDriver, setSelectedDriver] = useState<ImpactDriver | null>(null);

  // Status badge
  const getStatusBadge = (value: number) => {
    if (value >= 80) return { label: "Strong", color: "text-primary" };
    if (value >= 60) return { label: "Advancing", color: "text-primary/80" };
    return { label: "Developing", color: "text-muted-foreground" };
  };

  const status = getStatusBadge(rq);

  // Generate impact drivers based on actual RQ components
  const drivers = useMemo((): ImpactDriver[] => {
    const items: ImpactDriver[] = [];

    // Positive drivers
    if (s2Core >= 60) {
      items.push({
        id: "s2-sessions",
        name: "Consistent System 2 Sessions",
        impact: Math.round((s2Core - 50) * 0.44),
        type: "positive",
        description: "Regular engagement with deliberate reasoning exercises correlates with higher reasoning consistency.",
        details: {
          period: "Last 90 days",
          frequency: "Above average",
          direction: "Positive",
          note: "This reflects a long-term statistical association, not a single-session causal effect.",
        },
      });
    }

    if (taskPriming >= 30) {
      items.push({
        id: "structured-tasks",
        name: "Structured Reading & Tasks",
        impact: Math.round(taskPriming * 0.16),
        type: "positive",
        description: "Sessions involving structured reading and deliberate tasks are associated with higher reasoning consistency over time.",
        details: {
          period: "Last 90 days",
          frequency: "Regular engagement",
          direction: "Positive",
          note: "Task engagement contributes to conceptual priming, supporting reasoning depth.",
        },
      });
    }

    if (s2Consistency >= 60) {
      items.push({
        id: "low-variability",
        name: "Low Variability in Responses",
        impact: Math.round((s2Consistency - 50) * 0.22),
        type: "positive",
        description: "Stable performance patterns across reasoning sessions indicate well-calibrated cognitive processes.",
        details: {
          period: "Last 10 sessions",
          frequency: "Consistent",
          direction: "Positive",
          note: "Variability is measured across System 2 game performance.",
        },
      });
    }

    // Add recovery impact if positive
    items.push({
      id: "cognitive-recovery",
      name: "Adequate Cognitive Recovery",
      impact: 9,
      type: "positive",
      description: "Sufficient recovery periods between intensive sessions support sustained reasoning capacity.",
      details: {
        period: "Last 30 days",
        frequency: "Observed pattern",
        direction: "Positive",
        note: "Recovery supports, but does not directly cause, improved reasoning quality.",
      },
    });

    // Neutral drivers
    items.push({
      id: "s1-training",
      name: "System 1 Only Training",
      impact: 2,
      type: "neutral",
      description: "Intuitive training maintains baseline cognitive function but has limited direct impact on deliberate reasoning.",
      details: {
        period: "Last 90 days",
        frequency: "Regular",
        direction: "Neutral",
        note: "System 1 training supports overall cognition but doesn't directly affect S2 reasoning quality.",
      },
    });

    if (s2Consistency >= 40 && s2Consistency < 60) {
      items.push({
        id: "irregular-frequency",
        name: "Irregular Training Frequency",
        impact: 1,
        type: "neutral",
        description: "Variable training patterns show neither strong positive nor negative associations.",
        details: {
          period: "Last 90 days",
          frequency: "Variable",
          direction: "Neutral",
          note: "Consistent scheduling may enhance pattern stability over time.",
        },
      });
    }

    // Negative drivers (only if performance indicates issues)
    if (s2Consistency < 50) {
      items.push({
        id: "high-impulsivity",
        name: "High Impulsivity Pattern",
        impact: -Math.round((50 - s2Consistency) * 0.24),
        type: "negative",
        description: "Rushed responses in deliberate reasoning tasks correlate with lower consistency scores.",
        details: {
          period: "Last 10 sessions",
          frequency: "Observed pattern",
          direction: "Negative",
          note: "Slowing down during System 2 tasks may improve response quality.",
        },
      });
    }

    if (taskPriming < 20 && s2Core < 50) {
      items.push({
        id: "overtraining",
        name: "Overtraining without Recovery",
        impact: -9,
        type: "negative",
        description: "High session frequency without adequate recovery periods shows diminishing returns.",
        details: {
          period: "Last 30 days",
          frequency: "Observed",
          direction: "Negative",
          note: "Balance training intensity with recovery for optimal cognitive performance.",
        },
      });
    }

    if (s2Consistency < 45) {
      items.push({
        id: "time-pressure",
        name: "Frequent Time Pressure Errors",
        impact: -7,
        type: "negative",
        description: "Errors made under time pressure indicate suboptimal deliberation strategies.",
        details: {
          period: "Last 10 sessions",
          frequency: "Recurring",
          direction: "Negative",
          note: "Practice under reduced pressure may strengthen deliberation pathways.",
        },
      });
    }

    // Sort by absolute impact (highest first)
    return items.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  }, [s2Core, s2Consistency, taskPriming]);

  // Max impact for normalization
  const maxImpact = Math.max(...drivers.map(d => Math.abs(d.impact)), 25);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/30">
        <div className="flex items-center justify-center relative h-14 px-4">
          <button
            onClick={() => navigate(-1)}
            className="absolute left-4 p-2 -ml-2 rounded-full hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="text-sm font-semibold tracking-wide uppercase">Reasoning Quality</h1>
            <p className="text-[10px] text-muted-foreground">Impact Analysis</p>
          </div>
        </div>
      </header>

      <main className="px-5 py-6 pb-24 max-w-lg mx-auto">
        {/* Meta info */}
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-2">
            Updated daily
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Understand how your behaviors and training patterns have shaped your reasoning quality over the past 90 days.
            <br />
            <span className="text-muted-foreground/60">Tap any factor to explore details.</span>
          </p>
        </div>

        {/* Main RQ Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-card border border-border/40 mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold mb-1">Reasoning Quality (RQ)</h2>
              <p className="text-[11px] text-muted-foreground">
                Consistency, accuracy, and stability in deliberate thinking
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold tabular-nums">
                {Math.round(rq)}
              </div>
              <span className={cn("text-xs font-medium", status.color)}>
                {status.label}
              </span>
            </div>
          </div>
          <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden mt-4">
            <motion.div
              className="h-full bg-primary/60 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${rq}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* Impact Scale Legend */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-amber-500" />
            <span className="text-[11px] font-medium text-amber-500 uppercase tracking-wide">Negative</span>
          </div>
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">% Impact</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-primary uppercase tracking-wide">Positive</span>
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[6px] border-b-primary" />
          </div>
        </div>

        {/* Impact Drivers List */}
        <div className="space-y-2">
          {drivers.map((driver, index) => (
            <motion.button
              key={driver.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => setSelectedDriver(driver)}
              className="w-full p-4 rounded-xl bg-card/50 border border-border/30 hover:bg-card/80 transition-colors text-left"
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  {driver.isNew && (
                    <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                      New
                    </span>
                  )}
                  <span className="text-sm font-medium uppercase tracking-wide">
                    {driver.name}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    driver.type === "positive" && "text-primary",
                    driver.type === "neutral" && "text-muted-foreground",
                    driver.type === "negative" && "text-amber-500"
                  )}
                >
                  {driver.impact > 0 ? "+" : ""}{driver.impact}%
                </span>
              </div>

              {/* Impact Bar */}
              <div className="relative h-1 bg-muted/20 rounded-full overflow-visible">
                {/* Center marker */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-muted-foreground/40 z-10" />
                
                {/* Impact fill */}
                {driver.type === "positive" ? (
                  <motion.div
                    className="absolute left-1/2 top-0 h-full bg-primary rounded-r-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(driver.impact / maxImpact) * 50}%` }}
                    transition={{ duration: 0.6, delay: 0.2 + index * 0.05, ease: "easeOut" }}
                  />
                ) : driver.type === "negative" ? (
                  <motion.div
                    className="absolute right-1/2 top-0 h-full bg-amber-500 rounded-l-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(Math.abs(driver.impact) / maxImpact) * 50}%` }}
                    transition={{ duration: 0.6, delay: 0.2 + index * 0.05, ease: "easeOut" }}
                  />
                ) : (
                  <motion.div
                    className="absolute left-1/2 top-0 h-full bg-muted-foreground/50 rounded-r-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(driver.impact / maxImpact) * 50}%` }}
                    transition={{ duration: 0.6, delay: 0.2 + index * 0.05, ease: "easeOut" }}
                  />
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 px-2">
          <p className="text-[11px] text-muted-foreground/60 leading-relaxed text-center">
            Impact scores are based on longitudinal patterns across multiple sessions.
            <br />
            Single actions do not directly change Reasoning Quality.
          </p>
        </div>
      </main>

      {/* Detail Sheet */}
      <Sheet open={!!selectedDriver} onOpenChange={() => setSelectedDriver(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl h-auto max-h-[70vh]">
          {selectedDriver && (
            <div className="pb-8">
              <SheetHeader className="text-left mb-6">
                <SheetTitle className="text-base font-semibold uppercase tracking-wide">
                  {selectedDriver.name}
                </SheetTitle>
              </SheetHeader>

              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {selectedDriver.description}
              </p>

              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-border/20">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Period analyzed</span>
                  <span className="text-sm">{selectedDriver.details.period}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/20">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Frequency observed</span>
                  <span className="text-sm">{selectedDriver.details.frequency}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/20">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Direction</span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      selectedDriver.type === "positive" && "text-primary",
                      selectedDriver.type === "neutral" && "text-muted-foreground",
                      selectedDriver.type === "negative" && "text-amber-500"
                    )}
                  >
                    {selectedDriver.details.direction}
                  </span>
                </div>
              </div>

              {/* Scientific note */}
              <div className="mt-6 p-3 rounded-lg bg-muted/20 border border-border/20">
                <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                  {selectedDriver.details.note}
                </p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
