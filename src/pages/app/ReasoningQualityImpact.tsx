/**
 * Reasoning Quality – Impact Analysis
 * 
 * WHOOP-inspired premium analysis page for daily RQ monitoring.
 * Features: Central ring display, dark immersive background, clean impact breakdown.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Brain, BookOpen, Headphones, FileText, AlertTriangle, Sparkles, Target, Lightbulb } from "lucide-react";
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
  icon: React.ReactNode;
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

  // Get CT and IN from cognitive states
  const CT = states.CT;
  const IN = states.IN;

  // Status badge with WHOOP-style classification
  const getStatusBadge = (value: number) => {
    if (value >= 80) return { label: "Elite", color: "text-primary", ring: "stroke-primary" };
    if (value >= 60) return { label: "Strong", color: "text-primary/80", ring: "stroke-primary/70" };
    if (value >= 40) return { label: "Building", color: "text-muted-foreground", ring: "stroke-muted-foreground/60" };
    return { label: "Developing", color: "text-muted-foreground/70", ring: "stroke-muted-foreground/40" };
  };

  const status = getStatusBadge(rq);

  // Split s2CoreContribution between CT and IN proportionally
  const ctProportion = CT + IN > 0 ? CT / (CT + IN) : 0.5;
  const inProportion = CT + IN > 0 ? IN / (CT + IN) : 0.5;
  const ctContribution = s2CoreContribution * ctProportion;
  const inContribution = s2CoreContribution * inProportion;
  
  // Task priming breakdown
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
  
  const decayContribution = decay;

  // Generate impact drivers
  const drivers = useMemo((): ImpactDriver[] => {
    const driverList: ImpactDriver[] = [
      {
        id: "ct",
        name: "Critical Thinking",
        rawValue: CT,
        weight: "25%",
        contribution: ctContribution,
        type: CT >= 50 ? "positive" : CT >= 30 ? "neutral" : "negative",
        icon: <Target className="w-4 h-4" />,
        description: "Your Critical Thinking skill level contributes to S2 Core, the foundation of reasoning quality.",
        details: {
          period: "Current skill level",
          frequency: `${Math.round(CT)}% CT skill`,
          direction: CT >= 50 ? "Positive" : "Neutral",
          note: "Critical Thinking (CT) contributes 25% to RQ as part of S2 Core = (CT + IN) / 2 × 50%.",
        },
      },
      {
        id: "in",
        name: "Insight",
        rawValue: IN,
        weight: "25%",
        contribution: inContribution,
        type: IN >= 50 ? "positive" : IN >= 30 ? "neutral" : "negative",
        icon: <Lightbulb className="w-4 h-4" />,
        description: "Your Insight skill level contributes to S2 Core, the foundation of reasoning quality.",
        details: {
          period: "Current skill level",
          frequency: `${Math.round(IN)}% IN skill`,
          direction: IN >= 50 ? "Positive" : "Neutral",
          note: "Insight (IN) contributes 25% to RQ as part of S2 Core = (CT + IN) / 2 × 50%.",
        },
      },
      {
        id: "s2-consistency",
        name: "Consistency",
        rawValue: s2Consistency,
        weight: "30%",
        contribution: s2ConsistencyContribution,
        type: s2Consistency >= 50 ? "positive" : s2Consistency >= 30 ? "neutral" : "negative",
        icon: <Sparkles className="w-4 h-4" />,
        description: "Stability and reliability of your performance across System 2 reasoning sessions.",
        details: {
          period: "Last 10 S2 sessions",
          frequency: `${Math.round(s2Consistency)}% consistency`,
          direction: s2Consistency >= 50 ? "Positive" : "Neutral",
          note: "Measures how reliably you perform in deliberate thinking games. It accounts for 30% of your Reasoning Quality score.",
        },
      },
    ];
    
    // Task Priming breakdown
    if (podcastContribution > 0) {
      driverList.push({
        id: "task-podcast",
        name: "Podcasts",
        rawValue: taskBreakdown?.podcast ?? 0,
        weight: "20%",
        contribution: podcastContribution,
        type: "positive",
        icon: <Headphones className="w-4 h-4" />,
        description: "Podcast listening primes deliberate reasoning by exposing you to structured arguments.",
        details: {
          period: "Last 7 days",
          frequency: `${taskBreakdown?.podcastCount ?? 0} podcast(s)`,
          direction: "Positive",
          note: `Each podcast contributes ${TASK_TYPE_WEIGHTS.podcast} base points to Task Priming.`,
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
        icon: <FileText className="w-4 h-4" />,
        description: "Reading articles engages analytical thinking and strengthens conceptual frameworks.",
        details: {
          period: "Last 7 days",
          frequency: `${taskBreakdown?.articleCount ?? 0} article(s)`,
          direction: "Positive",
          note: `Each article contributes ${TASK_TYPE_WEIGHTS.article} base points to Task Priming.`,
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
        icon: <BookOpen className="w-4 h-4" />,
        description: "Book reading provides deep engagement with complex ideas.",
        details: {
          period: "Last 7 days",
          frequency: `${taskBreakdown?.bookCount ?? 0} book(s)`,
          direction: "Positive",
          note: `Each book contributes ${TASK_TYPE_WEIGHTS.book} base points to Task Priming.`,
        },
      });
    }
    
    // Empty task priming placeholder
    if (podcastContribution === 0 && articleContribution === 0 && bookContribution === 0) {
      driverList.push({
        id: "task-priming-empty",
        name: "Task Priming",
        rawValue: 0,
        weight: "20%",
        contribution: 0,
        type: "neutral",
        icon: <Brain className="w-4 h-4" />,
        description: "Complete podcasts, articles, or books to prime your deliberate reasoning.",
        details: {
          period: "Last 7 days",
          frequency: "No tasks completed",
          direction: "Neutral",
          note: "Task Priming accounts for 20% of RQ.",
        },
      });
    }
    
    // Decay
    if (isDecaying && decayContribution > 0) {
      driverList.push({
        id: "decay",
        name: "Inactivity",
        rawValue: decayContribution,
        weight: "−",
        contribution: -decayContribution,
        type: "negative",
        icon: <AlertTriangle className="w-4 h-4" />,
        description: "Extended inactivity gradually reduces Reasoning Quality.",
        details: {
          period: "14+ days inactivity",
          frequency: `-${decayContribution.toFixed(1)} points`,
          direction: "Negative",
          note: "RQ decays at -2 points per week beyond 14 days of inactivity.",
        },
      });
    }
    
    return driverList;
  }, [CT, IN, s2Consistency, ctContribution, inContribution, s2ConsistencyContribution, 
      podcastContribution, articleContribution, bookContribution, taskBreakdown, 
      isDecaying, decayContribution]);

  const positiveTotal = ctContribution + inContribution + s2ConsistencyContribution + 
                        podcastContribution + articleContribution + bookContribution;

  // Ring calculations
  const ringRadius = 72;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringProgress = (rq / 100) * ringCircumference;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(220,15%,4%)]">
      {/* Header - Minimal */}
      <header className="sticky top-0 z-50 bg-[hsl(220,15%,4%)]/95 backdrop-blur-sm">
        <div className="flex items-center justify-between h-14 px-5">
          <button
            onClick={() => navigate("/app")}
            className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/80" />
          </button>
          <span className="text-[11px] uppercase tracking-[0.15em] text-white/40 font-medium">
            Daily Monitoring
          </span>
          <div className="w-9" /> {/* Spacer */}
        </div>
      </header>

      <main className="px-5 pb-24 max-w-lg mx-auto">
        {/* Hero Ring Section */}
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center py-10"
        >
          {/* Central Ring */}
          <div className="relative w-48 h-48 mb-6">
            {/* Background glow */}
            <div className="absolute inset-0 rounded-full bg-primary/5 blur-2xl" />
            
            {/* Ring SVG */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              {/* Background ring */}
              <circle
                cx="80"
                cy="80"
                r={ringRadius}
                fill="none"
                stroke="hsl(220, 10%, 12%)"
                strokeWidth="6"
              />
              {/* Progress ring */}
              <motion.circle
                cx="80"
                cy="80"
                r={ringRadius}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                initial={{ strokeDashoffset: ringCircumference }}
                animate={{ strokeDashoffset: ringCircumference - ringProgress }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="text-5xl font-bold text-white tabular-nums tracking-tight"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {rq.toFixed(1)}
              </motion.span>
              <span className="text-xs text-white/40 uppercase tracking-wider mt-1">
                RQ Score
              </span>
            </div>
          </div>
          
          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={cn(
              "px-4 py-1.5 rounded-full bg-white/5 border border-white/10",
              status.color
            )}
          >
            <span className="text-sm font-medium tracking-wide">{status.label}</span>
          </motion.div>
          
          {/* Subtitle */}
          <p className="text-sm text-white/30 text-center mt-4 max-w-xs leading-relaxed">
            Reasoning Quality measures the depth and consistency of your deliberate thinking
          </p>
        </motion.section>

        {/* Divider */}
        <div className="h-px bg-white/5 mb-8" />

        {/* Impact Breakdown */}
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.15em] text-white/40 mb-4">
            Impact Breakdown
          </h2>
          
          <div className="space-y-3">
            {drivers.map((driver, index) => (
              <motion.button
                key={driver.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                onClick={() => setSelectedDriver(driver)}
                className="w-full group"
              >
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all">
                  {/* Icon */}
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    driver.type === "positive" && "bg-primary/10 text-primary",
                    driver.type === "neutral" && "bg-white/5 text-white/40",
                    driver.type === "negative" && "bg-amber-500/10 text-amber-400"
                  )}>
                    {driver.icon}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-white/90 truncate">
                        {driver.name}
                      </span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[11px] text-white/30 tabular-nums">
                          {driver.weight}
                        </span>
                        <span className={cn(
                          "text-sm font-semibold tabular-nums",
                          driver.type === "positive" && "text-primary",
                          driver.type === "neutral" && "text-white/40",
                          driver.type === "negative" && "text-amber-400"
                        )}>
                          {driver.contribution >= 0 ? "+" : ""}{driver.contribution.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className={cn(
                          "h-full rounded-full",
                          driver.type === "positive" && "bg-primary",
                          driver.type === "neutral" && "bg-white/20",
                          driver.type === "negative" && "bg-amber-500"
                        )}
                        initial={{ width: 0 }}
                        animate={{ 
                          width: positiveTotal > 0 
                            ? `${Math.abs(driver.contribution / positiveTotal) * 100}%` 
                            : "0%" 
                        }}
                        transition={{ duration: 0.6, delay: 0.3 + index * 0.05 }}
                      />
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
          
          {/* Total */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white/60 uppercase tracking-wide">
                Total RQ
              </span>
              <span className="text-xl font-bold text-white tabular-nums">
                {rq.toFixed(1)}%
              </span>
            </div>
          </motion.div>
        </section>

        {/* Footer note */}
        <p className="text-[11px] text-white/20 text-center mt-10 leading-relaxed">
          Updated daily based on your training patterns and content engagement
        </p>
      </main>

      {/* Detail Sheet */}
      <Sheet open={!!selectedDriver} onOpenChange={() => setSelectedDriver(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl h-auto max-h-[70vh] bg-[hsl(220,12%,8%)] border-white/10">
          {selectedDriver && (
            <div className="pb-8">
              <SheetHeader className="text-left mb-6">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    selectedDriver.type === "positive" && "bg-primary/10 text-primary",
                    selectedDriver.type === "neutral" && "bg-white/5 text-white/40",
                    selectedDriver.type === "negative" && "bg-amber-500/10 text-amber-400"
                  )}>
                    {selectedDriver.icon}
                  </div>
                  <SheetTitle className="text-lg font-semibold text-white">
                    {selectedDriver.name}
                  </SheetTitle>
                </div>
              </SheetHeader>

              <p className="text-sm text-white/50 leading-relaxed mb-6">
                {selectedDriver.description}
              </p>

              <div className="space-y-3">
                <div className="flex justify-between py-3 border-b border-white/5">
                  <span className="text-xs text-white/30 uppercase tracking-wide">Period</span>
                  <span className="text-sm text-white/80">{selectedDriver.details.period}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/5">
                  <span className="text-xs text-white/30 uppercase tracking-wide">Value</span>
                  <span className="text-sm text-white/80">{selectedDriver.details.frequency}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/5">
                  <span className="text-xs text-white/30 uppercase tracking-wide">Impact</span>
                  <span className={cn(
                    "text-sm font-medium",
                    selectedDriver.type === "positive" && "text-primary",
                    selectedDriver.type === "neutral" && "text-white/60",
                    selectedDriver.type === "negative" && "text-amber-400"
                  )}>
                    {selectedDriver.contribution >= 0 ? "+" : ""}{selectedDriver.contribution.toFixed(1)} pts
                  </span>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-xs text-white/40 leading-relaxed">
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
