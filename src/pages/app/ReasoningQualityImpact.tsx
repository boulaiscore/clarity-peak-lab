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
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useReasoningQuality } from "@/hooks/useReasoningQuality";
import { useCognitiveStates } from "@/hooks/useCognitiveStates";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { TASK_TYPE_WEIGHTS } from "@/lib/reasoningQuality";

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
  const { rq, s2Core, s2Consistency, taskPriming, decay, isDecaying, taskBreakdown, isLoading } = useReasoningQuality();
  const { states } = useCognitiveStates();
  const [selectedDriver, setSelectedDriver] = useState<ImpactDriver | null>(null);

  // Get CT and IN from cognitive states (for display only)
  const CT = states.CT;
  const IN = states.IN;

  // Status badge
  const getStatusBadge = (value: number) => {
    if (value >= 80) return { label: "Strong", color: "text-primary" };
    if (value >= 60) return { label: "Advancing", color: "text-primary/80" };
    return { label: "Developing", color: "text-muted-foreground" };
  };

  const status = getStatusBadge(rq);

  // Calculate actual weighted contributions to RQ using the SAME values as the formula
  // RQ = 50% S2 Core + 30% S2 Consistency + 20% Task Priming - Decay
  // S2 Core = (CT + IN) / 2, so we split the 50% contribution proportionally
  const s2CoreContribution = s2Core * 0.50;
  const ctProportion = CT + IN > 0 ? CT / (CT + IN) : 0.5;
  const inProportion = CT + IN > 0 ? IN / (CT + IN) : 0.5;
  const ctContribution = s2CoreContribution * ctProportion;
  const inContribution = s2CoreContribution * inProportion;
  const s2ConsistencyContribution = s2Consistency * 0.30;
  
  // Task priming breakdown: podcasts, articles, books
  // Total weight = 20%, split by actual contribution
  const podcastContribution = (taskBreakdown?.podcast ?? 0) * 0.20;
  const articleContribution = (taskBreakdown?.article ?? 0) * 0.20;
  const bookContribution = (taskBreakdown?.book ?? 0) * 0.20;
  
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
          frequency: `${Math.round(CT)}% CT skill`,
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
          frequency: `${Math.round(IN)}% IN skill`,
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
          frequency: `${Math.round(s2Consistency)}% consistency`,
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
  const totalContribution = positiveTotal - decayContribution;

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
                    {Math.round(driver.rawValue)}%
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
          
          {/* Total Row - use rq directly to ensure it matches */}
          <div className="p-4 rounded-xl bg-card border border-border/40">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-wide">Total</span>
              <span className="text-lg font-bold tabular-nums">
                {Math.round(rq)}%
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
