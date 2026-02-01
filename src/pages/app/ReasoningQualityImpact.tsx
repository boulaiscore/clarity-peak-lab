/**
 * Reasoning Quality – Impact Analysis
 * 
 * WHOOP-inspired analysis page showing behavioral impacts on RQ.
 * Premium, scientific, S2-focused.
 * 
 * Breakdown: CT/2, IN/2, S2 Consistency, Task Priming (by type), Decay
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, LineChart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useReasoningQuality } from "@/hooks/useReasoningQuality";
import { useCognitiveStates } from "@/hooks/useCognitiveStates";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/app/AppShell";
import { TASK_TYPE_WEIGHTS } from "@/lib/reasoningQuality";
import { getReasoningQualityStatus } from "@/lib/metricStatusLabels";

interface ImpactDriver {
  id: string;
  name: string;
  rawValue: number;
  weight: string;
  contribution: number;
  type: "positive" | "neutral" | "negative";
  description: string;
  details: {
    period: string;
    frequency: string;
    direction: string;
    note: string;
  };
}

export default function ReasoningQualityImpact() {
  const navigate = useNavigate();
  const { 
    rq, 
    s2Core, 
    s2Consistency, 
    s2CoreContribution, 
    s2ConsistencyContribution, 
    taskPrimingContribution,
    decay, 
    isDecaying, 
    taskBreakdown, 
    isLoading 
  } = useReasoningQuality();
  const { states } = useCognitiveStates();
  const [selectedDriver, setSelectedDriver] = useState<ImpactDriver | null>(null);

  // Get CT and IN from cognitive states (for display only)
  const CT = states.CT;
  const IN = states.IN;

  // Status badge - using centralized status labels for consistency
  const getStatusColor = (level: string) => {
    switch (level) {
      case "high": return "text-primary";
      case "good": return "text-primary/80";
      case "moderate": return "text-muted-foreground";
      case "low": return "text-muted-foreground/80";
      default: return "text-muted-foreground/60";
    }
  };

  const statusInfo = getReasoningQualityStatus(rq);
  const status = { 
    label: statusInfo.label, 
    color: getStatusColor(statusInfo.level) 
  };


  // Use pre-calculated contributions from the hook (ensures math adds up)
  // Split s2CoreContribution between CT and IN proportionally
  const ctProportion = CT + IN > 0 ? CT / (CT + IN) : 0.5;
  const inProportion = CT + IN > 0 ? IN / (CT + IN) : 0.5;
  const ctContribution = s2CoreContribution * ctProportion;
  const inContribution = s2CoreContribution * inProportion;
  
  // Task priming breakdown: podcasts, articles, books
  // Split taskPrimingContribution proportionally by type
  const totalTaskPoints = (taskBreakdown?.podcast ?? 0) + (taskBreakdown?.article ?? 0) + (taskBreakdown?.book ?? 0);
  const podcastContribution = totalTaskPoints > 0 
    ? taskPrimingContribution * ((taskBreakdown?.podcast ?? 0) / totalTaskPoints)
    : 0;
  const articleContribution = totalTaskPoints > 0 
    ? taskPrimingContribution * ((taskBreakdown?.article ?? 0) / totalTaskPoints)
    : 0;
  const bookContribution = totalTaskPoints > 0 
    ? taskPrimingContribution * ((taskBreakdown?.book ?? 0) / totalTaskPoints)
    : 0;
  
  // Decay is subtracted
  const decayContribution = decay;

  // Generate impact drivers based on actual RQ components
  const drivers = useMemo((): ImpactDriver[] => {
    const driverList: ImpactDriver[] = [
      // CT contribution (25% weight)
      {
        id: "ct",
        name: "Critical Thinking",
        rawValue: CT,
        weight: "25%",
        contribution: ctContribution,
        type: CT >= 50 ? "positive" : CT >= 30 ? "neutral" : "negative",
        description: "Your Critical Thinking skill level contributes to S2 Core, the foundation of reasoning quality.",
        details: {
          period: "Current skill level",
          frequency: `${Math.round(CT)} CT skill`,
          direction: CT >= 50 ? "Positive" : "Neutral",
          note: "Critical Thinking (CT) contributes 25% to RQ as part of S2 Core = (CT + IN) / 2 × 50%.",
        },
      },
      // IN contribution (25% weight)
      {
        id: "in",
        name: "Insight",
        rawValue: IN,
        weight: "25%",
        contribution: inContribution,
        type: IN >= 50 ? "positive" : IN >= 30 ? "neutral" : "negative",
        description: "Your Insight skill level contributes to S2 Core, the foundation of reasoning quality.",
        details: {
          period: "Current skill level",
          frequency: `${Math.round(IN)} IN skill`,
          direction: IN >= 50 ? "Positive" : "Neutral",
          note: "Insight (IN) contributes 25% to RQ as part of S2 Core = (CT + IN) / 2 × 50%.",
        },
      },
      // S2 Consistency contribution (30% weight)
      {
        id: "s2-consistency",
        name: "How Steady You Think",
        rawValue: s2Consistency,
        weight: "30%",
        contribution: s2ConsistencyContribution,
        type: s2Consistency >= 50 ? "positive" : s2Consistency >= 30 ? "neutral" : "negative",
        description: "Stability and reliability of your performance across System 2 reasoning sessions.",
        details: {
          period: "Last 10 S2 sessions",
          frequency: `${Math.round(s2Consistency)} consistency`,
          direction: s2Consistency >= 50 ? "Positive" : "Neutral",
          note: "Measures how reliably you perform in deliberate thinking games. It accounts for 30% of your Reasoning Quality score.",
        },
      },
    ];
    
    // Task Priming - broken down by content type (only show if > 0)
    if (podcastContribution > 0) {
      driverList.push({
        id: "task-podcast",
        name: "Podcasts",
        rawValue: taskBreakdown?.podcast ?? 0,
        weight: "20%",
        contribution: podcastContribution,
        type: "positive",
        description: "Podcast listening primes deliberate reasoning by exposing you to structured arguments and new ideas.",
        details: {
          period: "Last 7 days",
          frequency: `${taskBreakdown?.podcastCount ?? 0} podcast(s) completed`,
          direction: "Positive",
          note: `Each podcast contributes ${TASK_TYPE_WEIGHTS.podcast} base points to Task Priming, weighted by recency.`,
        },
      });
    }
    
    if (articleContribution > 0) {
      driverList.push({
        id: "task-article",
        name: "Articles",
        rawValue: taskBreakdown?.article ?? 0,
        weight: "20%",
        contribution: articleContribution,
        type: "positive",
        description: "Reading articles engages analytical thinking and strengthens conceptual frameworks.",
        details: {
          period: "Last 7 days",
          frequency: `${taskBreakdown?.articleCount ?? 0} article(s) completed`,
          direction: "Positive",
          note: `Each article contributes ${TASK_TYPE_WEIGHTS.article} base points to Task Priming, weighted by recency.`,
        },
      });
    }
    
    if (bookContribution > 0) {
      driverList.push({
        id: "task-book",
        name: "Books",
        rawValue: taskBreakdown?.book ?? 0,
        weight: "20%",
        contribution: bookContribution,
        type: "positive",
        description: "Book reading provides deep engagement with complex ideas, maximizing conceptual priming.",
        details: {
          period: "Last 7 days",
          frequency: `${taskBreakdown?.bookCount ?? 0} book(s) completed`,
          direction: "Positive",
          note: `Each book contributes ${TASK_TYPE_WEIGHTS.book} base points to Task Priming, weighted by recency.`,
        },
      });
    }
    
    // If no task priming at all, show placeholder
    if (podcastContribution === 0 && articleContribution === 0 && bookContribution === 0) {
      driverList.push({
        id: "task-priming-empty",
        name: "Task Priming",
        rawValue: 0,
        weight: "20%",
        contribution: 0,
        type: "neutral",
        description: "Complete podcasts, articles, or books to prime your deliberate reasoning.",
        details: {
          period: "Last 7 days",
          frequency: "No tasks completed",
          direction: "Neutral",
          note: "Task Priming accounts for 20% of RQ. Complete content from the Library to activate this component.",
        },
      });
    }
    
    // Decay (only show if active)
    if (isDecaying && decayContribution > 0) {
      driverList.push({
        id: "decay",
        name: "Inactivity Decay",
        rawValue: decayContribution,
        weight: "−",
        contribution: -decayContribution,
        type: "negative",
        description: "Extended inactivity (14+ days without S2 games or tasks) gradually reduces Reasoning Quality.",
        details: {
          period: "14+ days inactivity",
          frequency: `-${decayContribution.toFixed(1)} points`,
          direction: "Negative",
          note: "RQ decays at -2 points per week of inactivity beyond 14 days. Floor: S2 Core - 10.",
        },
      });
    }
    
    return driverList;
  }, [CT, IN, s2Consistency, ctContribution, inContribution, s2ConsistencyContribution, 
      podcastContribution, articleContribution, bookContribution, taskBreakdown, 
      isDecaying, decayContribution]);

  // Total contribution (sum of all positive contributions minus decay)
  const positiveTotal = ctContribution + inContribution + s2ConsistencyContribution + 
                        podcastContribution + articleContribution + bookContribution;

  // Use hook's RQ as the canonical total to keep all screens consistent.
  // (Breakdown rows may show small rounding differences at 0-decimal display.)
  const totalContribution = rq;

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="pb-6">
        {/* Page Header */}
        {/* Navigation row */}
        <div className="flex items-center justify-between px-2 pt-3">
          <button 
            onClick={() => navigate("/app")}
            className="px-4 py-1.5 rounded-full bg-muted/40 text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/80 hover:bg-muted/60 transition-colors active:scale-[0.97]"
          >
            ← Today
          </button>
          <button
            onClick={() => navigate("/app/dashboard?tab=training&subtab=trends")}
            className="p-2 rounded-full bg-muted/40 hover:bg-muted/60 transition-colors active:scale-[0.97]"
            title="View Trends"
          >
            <LineChart className="w-4 h-4 text-foreground/70" />
          </button>
        </div>

        {/* Centered title and description */}
        <div className="text-center space-y-2 pt-2">
          <h2 className="text-xl font-semibold tracking-tight">Reasoning Quality</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Your consistency and stability in deliberate thinking
          </p>
        </div>

        <div className="px-5 py-6 max-w-lg mx-auto">

        {/* Main RQ Ring */}
        {(() => {
          const ringSize = 180;
          const ringStrokeWidth = 10;
          const ringRadius = (ringSize - ringStrokeWidth) / 2;
          const ringCircumference = ringRadius * 2 * Math.PI;
          const ringProgress = Math.min(rq / 100, 1);
          const ringStrokeDashoffset = ringCircumference - ringProgress * ringCircumference;
          const rqColor = "hsl(207, 44%, 55%)"; // Steel Blue for RQ
          
          return (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center mb-6"
            >
              {/* Ring */}
              <div className="relative" style={{ width: ringSize, height: ringSize }}>
                <svg className="absolute inset-0 -rotate-90" width={ringSize} height={ringSize}>
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={ringRadius}
                    fill="none"
                    stroke="hsl(var(--muted)/0.25)"
                    strokeWidth={ringStrokeWidth}
                  />
                </svg>
                <svg className="absolute inset-0 -rotate-90" width={ringSize} height={ringSize}>
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={ringRadius}
                    fill="none"
                    stroke={rqColor}
                    strokeWidth={ringStrokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringStrokeDashoffset}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold tabular-nums text-foreground">
                    {rq.toFixed(1)}
                  </span>
                  <span className={cn("text-xs font-medium mt-1", status.color)}>
                    {status.label}
                  </span>
                </div>
              </div>
              
            </motion.div>
          );
        })()}

        {/* Meta info - moved below the ring */}
        <div className="mb-6 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-2">
            Updated daily
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Understand how your behaviors and training patterns have shaped your reasoning quality over the past 90 days.
            <br />
            <span className="text-muted-foreground/60">Tap any factor to explore details.</span>
          </p>
        </div>

        {/* Component Details */}
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
                  <span className="text-sm font-medium uppercase tracking-wide">
                    {driver.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">
                    × {driver.weight}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {Math.round(driver.rawValue)}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      driver.type === "positive" && "text-primary",
                      driver.type === "neutral" && "text-muted-foreground",
                      driver.type === "negative" && "text-amber-500"
                    )}
                  >
                    {driver.contribution >= 0 ? "+" : ""}{driver.contribution.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Progress Bar showing contribution relative to max possible */}
              <div className="relative h-1 bg-muted/20 rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    driver.type === "positive" && "bg-primary",
                    driver.type === "neutral" && "bg-muted-foreground/50",
                    driver.type === "negative" && "bg-amber-500"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.abs(driver.contribution / positiveTotal) * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.05, ease: "easeOut" }}
                />
              </div>
            </motion.button>
          ))}
          
          {/* Total Row - show actual sum of displayed contributions */}
          <div className="p-4 rounded-xl bg-card border border-border/40">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-wide">Total</span>
              <span className="text-lg font-bold tabular-nums">
                {rq.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 px-2">
          <p className="text-[11px] text-muted-foreground/60 leading-relaxed text-center">
            Impact scores are based on longitudinal patterns across multiple sessions.
            <br />
            Single actions do not directly change Reasoning Quality.
          </p>
        </div>
      </div>

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
    </AppShell>
  );
}
