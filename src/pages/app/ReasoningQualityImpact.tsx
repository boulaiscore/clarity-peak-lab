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

  // Calculate actual weighted contributions to RQ
  // RQ = 50% S2 Core + 30% S2 Consistency + 20% Task Priming
  const s2CoreContribution = s2Core * 0.50;
  const s2ConsistencyContribution = s2Consistency * 0.30;
  const taskPrimingContribution = taskPriming * 0.20;

  // Generate impact drivers based on actual RQ components
  const drivers = useMemo((): ImpactDriver[] => {
    const items: ImpactDriver[] = [];

    // S2 Core contribution (50% weight) - always show
    items.push({
      id: "s2-core",
      name: "System 2 Skill Level",
      impact: Math.round(s2CoreContribution),
      type: s2Core >= 50 ? "positive" : s2Core >= 30 ? "neutral" : "negative",
      description: "Your current System 2 skill level (Critical Thinking and Intuition scores) forms the foundation of reasoning quality.",
      details: {
        period: "Current skills",
        frequency: `${Math.round(s2Core)}% skill level`,
        direction: s2Core >= 50 ? "Positive" : "Neutral",
        note: "S2 Core accounts for 50% of your Reasoning Quality score.",
      },
    });

    // S2 Consistency contribution (30% weight) - always show
    items.push({
      id: "s2-consistency",
      name: "Response Consistency",
      impact: Math.round(s2ConsistencyContribution),
      type: s2Consistency >= 50 ? "positive" : s2Consistency >= 30 ? "neutral" : "negative",
      description: "Stability and reliability of your performance across System 2 reasoning sessions.",
      details: {
        period: "Last 10 sessions",
        frequency: `${Math.round(s2Consistency)}% consistency`,
        direction: s2Consistency >= 50 ? "Positive" : "Neutral",
        note: "S2 Consistency accounts for 30% of your Reasoning Quality score.",
      },
    });

    // Task Priming contribution (20% weight) - always show
    items.push({
      id: "task-priming",
      name: "Conceptual Engagement",
      impact: Math.round(taskPrimingContribution),
      type: taskPriming >= 30 ? "positive" : taskPriming >= 10 ? "neutral" : "negative",
      description: "Engagement with structured content (podcasts, readings, books) that primes deliberate reasoning.",
      details: {
        period: "Last 7 days",
        frequency: taskPriming > 0 ? "Active engagement" : "Low engagement",
        direction: taskPriming >= 30 ? "Positive" : "Neutral",
        note: "Task Priming accounts for 20% of your Reasoning Quality score.",
      },
    });

    // Sort by absolute impact (highest first)
    return items.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  }, [s2Core, s2Consistency, taskPriming, s2CoreContribution, s2ConsistencyContribution, taskPrimingContribution]);

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
          className="p-5 rounded-2xl bg-card border border-border/40 mb-6"
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
                {Math.round(rq)}%
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

        {/* Breakdown Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-card/50 border border-border/30 mb-8"
        >
          <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-4">
            Score Breakdown
          </h3>
          
          <div className="space-y-3">
            {/* S2 Core */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">S2 Core</span>
                <span className="text-[10px] text-muted-foreground/60">× 50%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {Math.round(s2Core)}%
                </span>
                <span className="text-sm font-semibold tabular-nums w-12 text-right">
                  {s2CoreContribution.toFixed(1)}
                </span>
              </div>
            </div>
            
            {/* S2 Consistency */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">Consistency</span>
                <span className="text-[10px] text-muted-foreground/60">× 30%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {Math.round(s2Consistency)}%
                </span>
                <span className="text-sm font-semibold tabular-nums w-12 text-right">
                  {s2ConsistencyContribution.toFixed(1)}
                </span>
              </div>
            </div>
            
            {/* Task Priming */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">Task Priming</span>
                <span className="text-[10px] text-muted-foreground/60">× 20%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {Math.round(taskPriming)}%
                </span>
                <span className="text-sm font-semibold tabular-nums w-12 text-right">
                  {taskPrimingContribution.toFixed(1)}
                </span>
              </div>
            </div>
            
            {/* Total */}
            <div className="pt-3 mt-2 border-t border-border/30 flex items-center justify-between">
              <span className="text-sm font-medium">Total</span>
              <span className="text-sm font-bold tabular-nums w-12 text-right">
                {(s2CoreContribution + s2ConsistencyContribution + taskPrimingContribution).toFixed(1)}%
              </span>
            </div>
          </div>
        </motion.div>

        {/* Section Title */}
        <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3 px-1">
          Component Details
        </h3>

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
