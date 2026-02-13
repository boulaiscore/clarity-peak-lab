import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Brain, Trophy, Target, Lightbulb, ChevronDown, Zap, Timer, Leaf, Footprints, Activity, TrendingUp, ArrowUp, ArrowDown, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useStableCognitiveLoad } from "@/hooks/useStableCognitiveLoad";
import { useTrainingCapacity } from "@/hooks/useTrainingCapacity";
import { WeeklyCompleteCelebration } from "@/components/app/WeeklyCompleteCelebration";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import { TrainingPlanId } from "@/lib/trainingPlans";

// Adaptive range status types
type AdaptiveStatus = "building" | "within" | "above";
interface AdaptiveStatusInfo {
  status: AdaptiveStatus;
  label: string;
}

// Status info with label and description - PREMIUM TONE
interface StatusCopy {
  label: string;
  description: string;
}

/**
 * MIN_MEANINGFUL_XP = 0.35 × planXP_target
 * 
 * This prevents "Optimal zone" from showing too early in onboarding.
 * Users must train enough before they can reach "Optimal zone" status.
 */
function getMinMeaningfulXP(planXP: number): number {
  return Math.round(0.35 * planXP);
}

/**
 * Determine Training Load status based on:
 * 1. MIN_MEANINGFUL_XP threshold (must be met to show "Optimal zone")
 * 2. Whether current XP is in optimal range [optMin, optMax]
 * 3. Whether current XP exceeds optimal max (overtraining)
 * 
 * Status priority:
 * - IF weeklyXP < MIN_MEANINGFUL_XP → "Building capacity" (even if in optimal range)
 * - ELSE IF weeklyXP in [optMin, optMax] → "Optimal zone"
 * - ELSE IF weeklyXP > optMax → "Overtraining risk"
 * - ELSE → "Building capacity" (below optMin)
 */
function getAdaptiveStatus(currentXP: number, optimalRange: {
  min: number;
  max: number;
}, planXP: number): AdaptiveStatusInfo & {
  copy: StatusCopy;
} {
  const minMeaningfulXP = getMinMeaningfulXP(planXP);

  // Gate 1: Must have trained enough to show "Optimal zone"
  if (currentXP < minMeaningfulXP) {
    return {
      status: "building",
      label: "Building capacity",
      copy: {
        label: "Building capacity",
        description: "You're training within your current capacity. Keep going to reach your optimal zone."
      }
    };
  }

  // Gate 2: Check if above optimal range (overtraining)
  if (currentXP > optimalRange.max) {
    return {
      status: "above",
      label: "Overtraining risk",
      copy: {
        label: "Overtraining risk",
        description: "You're exceeding your optimal load. Recovery will limit your gains."
      }
    };
  }

  // Gate 3: In optimal range (and past minimum meaningful threshold)
  if (currentXP >= optimalRange.min) {
    return {
      status: "within",
      label: "Optimal zone",
      copy: {
        label: "Optimal zone",
        description: "You're training at the right level for real cognitive gains."
      }
    };
  }

  // Default: Below optimal range (but past minimum meaningful)
  return {
    status: "building",
    label: "Building capacity",
    copy: {
      label: "Building capacity",
      description: "You're training within your current capacity. Keep going to reach your optimal zone."
    }
  };
}

// Mini celebration badge
function CategoryCompleteBadge({
  show
}: {
  show: boolean;
}) {
  return <AnimatePresence>
      {show && <motion.span initial={{
      scale: 0,
      opacity: 0
    }} animate={{
      scale: 1,
      opacity: 1
    }} exit={{
      scale: 0,
      opacity: 0
    }} transition={{
      type: "spring",
      stiffness: 400,
      damping: 15
    }} className="flex items-center justify-center w-3 h-3">
          <Trophy className="w-2.5 h-2.5 text-emerald-400" />
        </motion.span>}
    </AnimatePresence>;
}

// Icon mapping for 2x2 matrix areas - matches GamesLibrary.tsx
const AREA_ICONS = {
  focus: Target,
  // S1 only
  reasoning: Brain,
  // S2 only
  creativity: Lightbulb // Both systems
} as const;

// Storage key for tracking if user has seen the celebration this week
const CELEBRATION_SEEN_KEY = "weekly-celebration-seen";
function getCelebrationSeenKey(): string {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
  return `${CELEBRATION_SEEN_KEY}:${weekStart.toISOString().split('T')[0]}`;
}
function hasCelebrationBeenSeen(): boolean {
  try {
    return localStorage.getItem(getCelebrationSeenKey()) === "true";
  } catch {
    return false;
  }
}
function markCelebrationSeen(): void {
  try {
    localStorage.setItem(getCelebrationSeenKey(), "true");
  } catch {
    // ignore
  }
}

// Helper to format minutes as hours
function formatRecoveryTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
interface WeeklyGoalCardProps {
  compact?: boolean;
}
export function WeeklyGoalCard({
  compact = false
}: WeeklyGoalCardProps) {
  const {
    user
  } = useAuth();
  const planId = (user?.trainingPlan || "expert") as TrainingPlanId;

  // Use dynamic Training Capacity hook
  const {
    trainingCapacity,
    optimalRange: optimalRangeXP,
    planCap,
    weeklyXPTarget,
    shouldSuggestUpgrade,
    isLoading: tcLoading,
    tcTrend,
    tcDelta
  } = useTrainingCapacity();
  const data = useStableCognitiveLoad();
  const {
    rawGamesXP,
    gamesXPTarget,
    gamesComplete,
    gamesProgress,
    gamesSubTargets,
    cappedTotalXP,
    goalReached,
    recoveryMinutesTarget,
    recoveryMinutesEarned,
    recoveryProgress,
    recoveryComplete,
    isLoading,
    isSyncing
  } = data;
  const [showCelebration, setShowCelebration] = useState(false);
  const [expandedCell, setExpandedCell] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const prevGoalReached = useRef(false);
  const celebrationTriggered = useRef(false);

  // Get S1 and S2 areas
  const s1Areas = gamesSubTargets.find(s => s.system === "S1")?.areas ?? [];
  const s2Areas = gamesSubTargets.find(s => s.system === "S2")?.areas ?? [];
  const cappedGames = Math.min(rawGamesXP, gamesXPTarget);

  // Calculate adaptive status based on actual XP, optimal range, and minimum meaningful threshold
  // v1.5: Use weeklyXPTarget (80/140/200) for status calculation, not planCap
  const adaptiveStatus = useMemo(() => getAdaptiveStatus(rawGamesXP, optimalRangeXP, weeklyXPTarget), [rawGamesXP, optimalRangeXP, weeklyXPTarget]);

  // Calculate bar percentages for optimal range visualization (scale 0 → weeklyXPTarget)
  // v1.5: Use weeklyXPTarget as the bar max, not planCap
  const optimalRangePercent = useMemo(() => ({
    min: optimalRangeXP.min / weeklyXPTarget * 100,
    max: optimalRangeXP.max / weeklyXPTarget * 100
  }), [optimalRangeXP, weeklyXPTarget]);

  // Current progress as percentage of weeklyXPTarget
  const progressPercent = useMemo(() => Math.min(100, rawGamesXP / weeklyXPTarget * 100), [rawGamesXP, weeklyXPTarget]);
  useEffect(() => {
    // Only trigger celebration once per week, when goal transitions from not-reached to reached
    if (goalReached && !prevGoalReached.current && !celebrationTriggered.current) {
      if (!hasCelebrationBeenSeen()) {
        setShowCelebration(true);
        celebrationTriggered.current = true;
      }
    }
    prevGoalReached.current = goalReached;
  }, [goalReached]);
  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    markCelebrationSeen();
  };

  // Show skeleton only on very first load (no data at all)
  const hasNoData = cappedTotalXP === 0 && gamesXPTarget === 0;
  if (isLoading && hasNoData) {
    return <motion.div initial={{
      opacity: 0,
      y: 10
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.3
    }} className="p-4 rounded-xl bg-gradient-to-br from-muted/50 via-muted/30 to-transparent border border-border/50 mb-4 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-40 bg-muted/60 rounded" />
          <div className="h-4 w-20 bg-muted/60 rounded" />
        </div>
        <div className="h-2 bg-muted/60 rounded-full" />
      </motion.div>;
  }

  // Status indicator color - matches reference image
  const getStatusColor = (status: AdaptiveStatus) => {
    switch (status) {
      case "building":
        return "text-amber-400";
      // Yellow = building capacity
      case "within":
        return "text-teal-400";
      // Teal = optimal zone
      case "above":
        return "text-amber-400";
      // Amber = overtraining risk
    }
  };

  // Get marker/bar colors based on status
  const getBarStyles = (status: AdaptiveStatus) => {
    switch (status) {
      case "building":
        return {
          trackBg: "bg-slate-600/40",
          optimalZoneBg: "bg-emerald-500/40",
          optimalZoneBorder: "border-emerald-400/60",
          markerBg: "bg-white",
          markerBorder: "border-white/50"
        };
      case "within":
        return {
          trackBg: "bg-slate-600/40",
          optimalZoneBg: "bg-emerald-500/50",
          optimalZoneBorder: "border-emerald-400/70",
          markerBg: "bg-emerald-400",
          markerBorder: "border-emerald-300/80"
        };
      case "above":
        return {
          trackBg: "bg-amber-900/30",
          optimalZoneBg: "bg-slate-600/20",
          optimalZoneBorder: "border-slate-500/30",
          markerBg: "bg-amber-400",
          markerBorder: "border-amber-300/80"
        };
    }
  };
  const barStyles = getBarStyles(adaptiveStatus.status);

  // Compact version for NeuroLab - Ultra-simplified
  if (compact) {
    // WHOOP/Strava-inspired ring percentage
    const ringPercent = Math.min(100, progressPercent);
    const ringRadius = 38;
    const ringCircumference = 2 * Math.PI * ringRadius;
    const ringOffset = ringCircumference - (ringPercent / 100) * ringCircumference;
    
    // S1/S2 total progress
    const s1Earned = Math.round(gamesSubTargets[0]?.earned ?? 0);
    const s1Target = Math.round(gamesSubTargets[0]?.target ?? 0);
    const s2Earned = Math.round(gamesSubTargets[1]?.earned ?? 0);
    const s2Target = Math.round(gamesSubTargets[1]?.target ?? 0);

    // Ring color based on status
    const getRingColor = () => {
      if (goalReached) return "stroke-emerald-400";
      if (adaptiveStatus.status === "above") return "stroke-amber-400";
      if (adaptiveStatus.status === "within") return "stroke-teal-400";
      return "stroke-white/70";
    };

    return <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <motion.div initial={{
        opacity: 0,
        y: 10
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.3
      }} aria-busy={isSyncing} className="rounded-xl bg-muted/10 border border-border/15 overflow-hidden">
          
          <CollapsibleTrigger className="w-full">
            {/* Hero section: Ring + Status */}
            <div className="p-5 flex items-center gap-5">
              {/* Progress Ring */}
              <div className="relative w-[92px] h-[92px] shrink-0">
                <svg viewBox="0 0 92 92" className="w-full h-full -rotate-90">
                  {/* Track */}
                  <circle cx="46" cy="46" r={ringRadius} fill="none" strokeWidth="5" className="stroke-muted/20" />
                  {/* Optimal zone arc */}
                  {!goalReached && <circle cx="46" cy="46" r={ringRadius} fill="none" strokeWidth="5" className="stroke-emerald-500/20" strokeDasharray={ringCircumference} strokeDashoffset={ringCircumference - ((optimalRangePercent.max - optimalRangePercent.min) / 100) * ringCircumference} style={{ transform: `rotate(${(optimalRangePercent.min / 100) * 360}deg)`, transformOrigin: '46px 46px' }} strokeLinecap="round" />}
                  {/* Progress */}
                  <motion.circle cx="46" cy="46" r={ringRadius} fill="none" strokeWidth="5" className={getRingColor()} strokeDasharray={ringCircumference} initial={false} animate={{ strokeDashoffset: ringOffset }} transition={{ duration: 0.8, ease: "easeOut" }} strokeLinecap="round" />
                </svg>
                {/* Center value */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[22px] font-bold text-foreground tabular-nums leading-none">
                    {Math.round(rawGamesXP)}
                  </span>
                  <span className="text-[9px] text-muted-foreground/50 font-medium mt-0.5">
                    / {weeklyXPTarget} XP
                  </span>
                </div>
              </div>

              {/* Status + metrics */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <Activity className="w-3.5 h-3.5 text-muted-foreground/50" />
                  <span className="text-[11px] text-muted-foreground/60 font-medium uppercase tracking-wider">Cognitive Load</span>
                </div>
                <p className={`text-[14px] font-semibold mb-2 ${goalReached ? "text-emerald-400" : getStatusColor(adaptiveStatus.status)}`}>
                  {goalReached ? "Target Reached" : adaptiveStatus.copy.label}
                </p>
                
                {/* Compact S1/S2 summary */}
                <div className="flex gap-4">
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <Zap className="w-3 h-3 text-muted-foreground/40" />
                      <span className="text-[10px] text-muted-foreground/50">S1</span>
                    </div>
                    <span className="text-[13px] font-semibold text-foreground/80 tabular-nums">{s1Earned}</span>
                    <span className="text-[10px] text-muted-foreground/40 ml-0.5">/{s1Target}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <Timer className="w-3 h-3 text-muted-foreground/40" />
                      <span className="text-[10px] text-muted-foreground/50">S2</span>
                    </div>
                    <span className="text-[13px] font-semibold text-foreground/80 tabular-nums">{s2Earned}</span>
                    <span className="text-[10px] text-muted-foreground/40 ml-0.5">/{s2Target}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <Leaf className="w-3 h-3 text-muted-foreground/40" />
                      <span className="text-[10px] text-muted-foreground/50">Rec</span>
                    </div>
                    <span className="text-[13px] font-semibold text-foreground/80 tabular-nums">{formatRecoveryTime(recoveryMinutesEarned)}</span>
                  </div>
                </div>
              </div>

              {/* Chevron */}
              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
                <ChevronDown className="w-4 h-4 text-muted-foreground/30" />
              </motion.div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-5 space-y-4">
              
              {/* Optimal Range indicator */}
              <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/8 border border-border/10">
                <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium">Optimal Zone</span>
                <span className="text-[12px] font-semibold text-foreground/70 tabular-nums">
                  {optimalRangeXP.min} – {optimalRangeXP.max} <span className="text-[10px] text-muted-foreground/40 font-normal">XP</span>
                </span>
              </div>

              {/* S1 Breakdown */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <Zap className="w-3.5 h-3.5 text-muted-foreground/50" />
                  <span className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">System 1</span>
                  <span className="text-[10px] text-muted-foreground/40 tabular-nums ml-auto">{s1Earned} / {s1Target} XP</span>
                </div>
                <div className="space-y-2.5">
                  {s1Areas.map(area => {
                    const AreaIcon = AREA_ICONS[area.area as keyof typeof AREA_ICONS];
                    const pct = Math.min(100, area.progress);
                    return <div key={area.area}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <AreaIcon className="w-3 h-3 text-muted-foreground/35" />
                          <span className="text-[10px] text-muted-foreground/60 capitalize font-medium">{area.area}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/40 tabular-nums">{Math.round(area.cappedXP)}/{Math.round(area.target)}</span>
                      </div>
                      <div className="h-1.5 bg-muted/15 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full bg-foreground/20" initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
                      </div>
                    </div>;
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border/15" />

              {/* S2 Breakdown */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <Timer className="w-3.5 h-3.5 text-muted-foreground/50" />
                  <span className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">System 2</span>
                  <span className="text-[10px] text-muted-foreground/40 tabular-nums ml-auto">{s2Earned} / {s2Target} XP</span>
                </div>
                <div className="space-y-2.5">
                  {s2Areas.map(area => {
                    const AreaIcon = AREA_ICONS[area.area as keyof typeof AREA_ICONS];
                    const pct = Math.min(100, area.progress);
                    return <div key={area.area}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <AreaIcon className="w-3 h-3 text-muted-foreground/35" />
                          <span className="text-[10px] text-muted-foreground/60 capitalize font-medium">{area.area}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/40 tabular-nums">{Math.round(area.cappedXP)}/{Math.round(area.target)}</span>
                      </div>
                      <div className="h-1.5 bg-muted/15 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full bg-foreground/20" initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
                      </div>
                    </div>;
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border/15" />

              {/* Recovery */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <Leaf className="w-3.5 h-3.5 text-muted-foreground/50" />
                  <span className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">Recovery</span>
                  <CategoryCompleteBadge show={recoveryComplete} />
                  <span className="text-[10px] text-muted-foreground/40 tabular-nums ml-auto">
                    {formatRecoveryTime(recoveryMinutesEarned)} / {formatRecoveryTime(recoveryMinutesTarget)}
                  </span>
                </div>
                <div className="h-2 bg-muted/15 rounded-full overflow-hidden">
                  <motion.div className={`h-full rounded-full ${recoveryComplete ? "bg-teal-400/50" : "bg-foreground/20"}`} initial={false} animate={{ width: `${Math.min(100, recoveryProgress)}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
                </div>
              </div>
            </motion.div>
          </CollapsibleContent>
        </motion.div>

        <WeeklyCompleteCelebration show={showCelebration} onComplete={handleCelebrationComplete} />
      </Collapsible>;
  }

  // Full version
  return <motion.div initial={{
    opacity: 0,
    y: 10
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.3
  }} aria-busy={isSyncing} className="p-4 rounded-xl bg-gradient-to-br from-muted/50 via-muted/30 to-transparent border border-border/50 mb-4">
      {/* Header - Training Load (Weekly) */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-[12px] font-semibold">Cognitive Load (Weekly)</span>
        </div>
        <div className="text-[10px] text-muted-foreground/50 tabular-nums">
          {Math.round(rawGamesXP)} / {weeklyXPTarget} XP
          {isSyncing && <span className="ml-1 text-[8px]">•</span>}
        </div>
      </div>
      
      {/* Your Capacity indicator with trend arrow */}
      <div className="flex items-center gap-1.5 mb-3">
        <TrendingUp className="w-3 h-3 text-muted-foreground/50" />
        <span className="text-[10px] text-muted-foreground/60">
          Your Capacity: {Math.round(trainingCapacity)} XP
        </span>
        {tcTrend === "up" && <ArrowUp className="w-3 h-3 text-teal-400" />}
        {tcTrend === "down" && <ArrowDown className="w-3 h-3 text-amber-400" />}
      </div>
      
      {/* Status Label - Clear actionable message */}
      <div className="mb-3">
        <span className={`text-[14px] font-semibold ${getStatusColor(adaptiveStatus.status)}`}>
          {adaptiveStatus.copy.label}
        </span>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
          {adaptiveStatus.copy.description}
        </p>
      </div>

      {/* Main Progress Bar with Optimal Range Band - marker style */}
      <div className={`relative h-3 ${barStyles.trackBg} rounded-full mb-2`}>
        {/* Optimal Range Band - highlighted zone */}
        <div className={`absolute h-full ${barStyles.optimalZoneBg} border-l border-r ${barStyles.optimalZoneBorder} rounded-sm`} style={{
        left: `${optimalRangePercent.min}%`,
        width: `${optimalRangePercent.max - optimalRangePercent.min}%`
      }} />
        {/* Current Position Marker - circular dot */}
        <motion.div className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full ${barStyles.markerBg} border-2 ${barStyles.markerBorder} shadow-lg`} style={{
        left: `calc(${progressPercent}% - 10px)`
      }} initial={false} animate={{
        left: `calc(${progressPercent}% - 10px)`
      }} transition={{
        duration: 0.5,
        ease: "easeOut"
      }} />
      </div>
      
      {/* Range Labels with optimal range values */}
      <div className="flex justify-between mb-3">
        <span className="text-[9px] text-muted-foreground/60">0 XP</span>
        <span className="text-[9px] text-teal-400/70">
          Optimal: {optimalRangeXP.min}–{optimalRangeXP.max} XP
        </span>
        <span className="text-[9px] text-muted-foreground/60">{weeklyXPTarget} XP</span>
      </div>
      
      {/* Upgrade hint */}
      {shouldSuggestUpgrade && <div className="mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-400 text-center">
          Your capacity is approaching this plan's limit.
        </div>}
      
      {/* XP explanation - minimal */}
      <p className="text-[8px] text-muted-foreground/50 mb-4">
        XP only show how much you trained — not how good you are.
      </p>

      {/* Training mix - simple */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Dumbbell className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-medium">Training mix</span>
        </div>
        
        {/* S1 row */}
        <div className="grid grid-cols-[180px_1fr_1fr] gap-1 mb-1">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5 text-amber-400" />
              <span className="text-[9px] text-amber-400 font-medium">Fast (S1)</span>
            </div>
            <span className="text-[8px] text-amber-400/70 tabular-nums">
              {Math.round(gamesSubTargets[0]?.earned ?? 0)} XP
            </span>
          </div>
          {s1Areas.map(area => {
          const AreaIcon = AREA_ICONS[area.area as keyof typeof AREA_ICONS];
          return <button key={area.area} onClick={() => setExpandedCell(expandedCell === `s1-${area.area}` ? null : `s1-${area.area}`)} className="h-auto bg-amber-500/10 rounded flex flex-col items-stretch px-1 py-0.5 transition-all">
                <div className="flex items-center gap-1">
                  <AreaIcon className="w-2 h-2 text-muted-foreground/50" />
                  <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full bg-amber-400/60" initial={false} animate={{
                  width: `${Math.min(100, area.progress)}%`
                }} transition={{
                  duration: 0.4,
                  ease: "easeOut"
                }} />
                  </div>
                </div>
                <AnimatePresence>
                  {expandedCell === `s1-${area.area}` && <motion.div initial={{
                height: 0,
                opacity: 0
              }} animate={{
                height: "auto",
                opacity: 1
              }} exit={{
                height: 0,
                opacity: 0
              }} transition={{
                duration: 0.15
              }} className="text-[7px] text-amber-300/70 tabular-nums text-center mt-0.5">
                      {Math.round(area.cappedXP)}/{Math.round(area.target)} XP
                    </motion.div>}
                </AnimatePresence>
              </button>;
        })}
        </div>
        
        {/* S2 row */}
        <div className="grid grid-cols-[180px_1fr_1fr] gap-1">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-0.5">
              <Timer className="w-2.5 h-2.5 text-violet-400" />
              <span className="text-[9px] text-violet-400 font-medium">Reasoned (S2)</span>
            </div>
            <span className="text-[8px] text-violet-400/70 tabular-nums">
              {Math.round(gamesSubTargets[1]?.earned ?? 0)} XP
            </span>
          </div>
          {s2Areas.map(area => {
          const AreaIcon = AREA_ICONS[area.area as keyof typeof AREA_ICONS];
          return <button key={area.area} onClick={() => setExpandedCell(expandedCell === `s2-${area.area}` ? null : `s2-${area.area}`)} className="h-auto bg-muted/30 rounded flex flex-col items-stretch px-1 py-0.5 transition-all">
                <div className="flex items-center gap-1">
                  <AreaIcon className="w-2 h-2 text-muted-foreground/50" />
                  <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full bg-violet-400/60" initial={false} animate={{
                  width: `${Math.min(100, area.progress)}%`
                }} transition={{
                  duration: 0.4,
                  ease: "easeOut"
                }} />
                  </div>
                </div>
                <AnimatePresence>
                  {expandedCell === `s2-${area.area}` && <motion.div initial={{
                height: 0,
                opacity: 0
              }} animate={{
                height: "auto",
                opacity: 1
              }} exit={{
                height: 0,
                opacity: 0
              }} transition={{
                duration: 0.15
              }} className="text-[7px] text-violet-300/70 tabular-nums text-center mt-0.5">
                      {Math.round(area.cappedXP)}/{Math.round(area.target)} XP
                    </motion.div>}
                </AnimatePresence>
              </button>;
        })}
        </div>
      </div>

      {/* Recovery Budget Section */}
      <div className="pt-3 border-t border-border/30 mb-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="flex items-center gap-0.5">
            <Leaf className="w-3 h-3 text-teal-400" />
            <Footprints className="w-2.5 h-2.5 text-teal-400" />
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">Recovery Budget</span>
          <span className="text-[8px] text-muted-foreground/60 tabular-nums">
            {formatRecoveryTime(recoveryMinutesEarned)}/{formatRecoveryTime(recoveryMinutesTarget)}
          </span>
          <CategoryCompleteBadge show={recoveryComplete} />
        </div>
        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <motion.div className={`h-full rounded-full ${recoveryComplete ? "bg-emerald-400" : "bg-recovery"}`} initial={false} animate={{
          width: `${Math.min(100, recoveryProgress)}%`
        }} transition={{
          duration: 0.5,
          ease: "easeOut"
        }} />
        </div>
        <p className="text-[8px] text-muted-foreground/50 mt-1.5">
          Recovery doesn't add XP. It helps training turn into real gains.
        </p>
      </div>

      {/* Weekly completion celebration with report popup */}
      <WeeklyCompleteCelebration show={showCelebration} onComplete={handleCelebrationComplete} />
    </motion.div>;
}