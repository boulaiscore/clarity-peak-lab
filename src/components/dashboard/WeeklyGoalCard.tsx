import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Brain, Trophy, Target, Lightbulb, ChevronDown, Zap, Timer, Leaf, Footprints, Activity } from "lucide-react";
import { useStableCognitiveLoad } from "@/hooks/useStableCognitiveLoad";
import { WeeklyCompleteCelebration } from "@/components/app/WeeklyCompleteCelebration";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import { TRAINING_PLANS, TrainingPlanId } from "@/lib/trainingPlans";

// Adaptive range status types
type AdaptiveStatus = "below" | "within" | "above";

interface AdaptiveStatusInfo {
  status: AdaptiveStatus;
  label: string;
}

// Optimal range percentages per training plan
function getOptimalRange(planId: TrainingPlanId): { min: number; max: number } {
  switch (planId) {
    case "light":
      return { min: 40, max: 70 };
    case "expert":
      return { min: 60, max: 85 };
    case "superhuman":
      return { min: 75, max: 95 };
    default:
      return { min: 60, max: 85 };
  }
}

// Helper to determine adaptive status based on progress and optimal range
function getAdaptiveStatus(progress: number, optimalRange: { min: number; max: number }): AdaptiveStatusInfo {
  if (progress < optimalRange.min) {
    return {
      status: "below",
      label: "Below adaptive range",
    };
  }
  if (progress <= optimalRange.max) {
    return {
      status: "within",
      label: "Within adaptive range",
    };
  }
  return {
    status: "above",
    label: "Above adaptive range",
  };
}

// Mini celebration badge
function CategoryCompleteBadge({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="flex items-center justify-center w-3 h-3"
        >
          <Trophy className="w-2.5 h-2.5 text-emerald-400" />
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// Icon mapping for 2x2 matrix areas - matches GamesLibrary.tsx
const AREA_ICONS = {
  focus: Target,       // S1 only
  reasoning: Brain,    // S2 only
  creativity: Lightbulb, // Both systems
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

export function WeeklyGoalCard({ compact = false }: WeeklyGoalCardProps) {
  const { user } = useAuth();
  const planId = (user?.trainingPlan || "expert") as TrainingPlanId;
  const optimalRange = useMemo(() => getOptimalRange(planId), [planId]);
  
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
    isSyncing,
  } = data;

  const [showCelebration, setShowCelebration] = useState(false);
  const [expandedCell, setExpandedCell] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const prevGoalReached = useRef(false);
  const celebrationTriggered = useRef(false);

  // Get S1 and S2 areas
  const s1Areas = gamesSubTargets.find((s) => s.system === "S1")?.areas ?? [];
  const s2Areas = gamesSubTargets.find((s) => s.system === "S2")?.areas ?? [];

  const cappedGames = Math.min(rawGamesXP, gamesXPTarget);
  
  // Calculate adaptive status
  const adaptiveStatus = useMemo(() => getAdaptiveStatus(gamesProgress, optimalRange), [gamesProgress, optimalRange]);

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
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 rounded-xl bg-gradient-to-br from-muted/50 via-muted/30 to-transparent border border-border/50 mb-4 animate-pulse"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-40 bg-muted/60 rounded" />
          <div className="h-4 w-20 bg-muted/60 rounded" />
        </div>
        <div className="h-2 bg-muted/60 rounded-full" />
      </motion.div>
    );
  }

  // Status indicator color
  const getStatusColor = (status: AdaptiveStatus) => {
    switch (status) {
      case "below": return "text-muted-foreground";
      case "within": return "text-emerald-400";
      case "above": return "text-muted-foreground";
    }
  };

  // Compact version for NeuroLab
  if (compact) {
    return (
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          aria-busy={isSyncing}
          className="p-3 rounded-xl bg-gradient-to-br from-muted/50 via-muted/30 to-transparent border border-border/50 mb-4"
        >
          <CollapsibleTrigger className="w-full">
            {/* Header - Training Capacity */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-semibold">Training Capacity (Weekly)</span>
              </div>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </motion.div>
              </div>
            </div>
            
            {/* Sub-label */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] text-muted-foreground/70">Maximum tolerable cognitive load</p>
              <span className="text-[9px] text-muted-foreground/50 tabular-nums">
                {Math.round(gamesXPTarget)} XP max
              </span>
            </div>
            
            {/* Status Label */}
            <div className="mb-2">
              <span className={`text-[10px] font-medium ${getStatusColor(adaptiveStatus.status)}`}>
                {adaptiveStatus.label}
              </span>
            </div>

            {/* Main Progress Bar with Optimal Range */}
            <div className="relative h-3 bg-muted/30 rounded-full overflow-hidden">
              {/* Optimal Range Band - Highlighted */}
              <div 
                className="absolute h-full bg-emerald-400/20 border-l border-r border-emerald-400/50"
                style={{ 
                  left: `${optimalRange.min}%`, 
                  width: `${optimalRange.max - optimalRange.min}%` 
                }}
              />
              {/* Current Progress */}
              <motion.div
                className={`absolute h-full rounded-full ${
                  adaptiveStatus.status === "within" 
                    ? "bg-emerald-400" 
                    : "bg-muted-foreground/50"
                }`}
                initial={false}
                animate={{ width: `${Math.min(100, gamesProgress)}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            
            {/* Range Labels */}
            <div className="flex justify-between mt-1">
              <span className="text-[8px] text-muted-foreground/50">0</span>
              <span className="text-[8px] text-emerald-400/70">Optimal Range</span>
              <span className="text-[8px] text-muted-foreground/50">max</span>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 pt-3 border-t border-border/30"
            >
              {/* Explanatory Micro-copy */}
              <p className="text-[9px] text-muted-foreground/70 mb-3 leading-relaxed">
                Optimal training drives cognitive adaptation without overload.
                Training beyond this range does not increase benefit.
              </p>
              
              {/* Training breakdown: S1/S2 */}
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Dumbbell className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-medium">Load Distribution</span>
                </div>
                
                {/* S1 row - Fast skills */}
                <div className="grid grid-cols-[80px_1fr_1fr] gap-1 mb-1">
                  <div className="flex items-center gap-0.5">
                    <Zap className="w-2 h-2 text-amber-400" />
                    <span className="text-[8px] text-amber-400 font-medium">S1 — Fast</span>
                  </div>
                  {s1Areas.map((area) => {
                    const AreaIcon = AREA_ICONS[area.area as keyof typeof AREA_ICONS];
                    return (
                      <button
                        key={area.area}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCell(expandedCell === `s1-${area.area}` ? null : `s1-${area.area}`);
                        }}
                        className="h-auto bg-amber-500/10 rounded flex flex-col items-stretch px-1 py-0.5 transition-all"
                      >
                        <div className="flex items-center gap-1">
                          <AreaIcon className="w-2 h-2 text-muted-foreground/50" />
                          <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-amber-400/60"
                              initial={false}
                              animate={{ width: `${Math.min(100, area.progress)}%` }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                        <AnimatePresence>
                          {expandedCell === `s1-${area.area}` && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="text-[7px] text-amber-300/70 tabular-nums text-center mt-0.5"
                            >
                              {Math.round(area.cappedXP)}/{Math.round(area.target)} XP
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    );
                  })}
                </div>
                
                {/* S2 row - Reasoning skills */}
                <div className="grid grid-cols-[80px_1fr_1fr] gap-1">
                  <div className="flex items-center gap-0.5">
                    <Timer className="w-2 h-2 text-violet-400" />
                    <span className="text-[8px] text-violet-400 font-medium">S2 — Reasoning</span>
                  </div>
                  {s2Areas.map((area) => {
                    const AreaIcon = AREA_ICONS[area.area as keyof typeof AREA_ICONS];
                    return (
                      <button
                        key={area.area}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCell(expandedCell === `s2-${area.area}` ? null : `s2-${area.area}`);
                        }}
                        className="h-auto bg-violet-500/10 rounded flex flex-col items-stretch px-1 py-0.5 transition-all"
                      >
                        <div className="flex items-center gap-1">
                          <AreaIcon className="w-2 h-2 text-muted-foreground/50" />
                          <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-violet-400/60"
                              initial={false}
                              animate={{ width: `${Math.min(100, area.progress)}%` }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                        <AnimatePresence>
                          {expandedCell === `s2-${area.area}` && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="text-[7px] text-violet-300/70 tabular-nums text-center mt-0.5"
                            >
                              {Math.round(area.cappedXP)}/{Math.round(area.target)} XP
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recovery Budget Section */}
              <div className="pt-3 border-t border-border/30">
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
                  <motion.div
                    className={`h-full rounded-full ${recoveryComplete ? "bg-emerald-400" : "bg-teal-400"}`}
                    initial={false}
                    animate={{ width: `${Math.min(100, recoveryProgress)}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <p className="text-[8px] text-muted-foreground/60 mt-1">
                  Recovery restores training capacity and affects availability.
                  It does not provide XP.
                </p>
              </div>
            </motion.div>
          </CollapsibleContent>
        </motion.div>

        <WeeklyCompleteCelebration 
          show={showCelebration} 
          onComplete={handleCelebrationComplete} 
        />
      </Collapsible>
    );
  }

  // Full version
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-busy={isSyncing}
      className="p-4 rounded-xl bg-gradient-to-br from-muted/50 via-muted/30 to-transparent border border-border/50 mb-4"
    >
      {/* Header - Training Capacity */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-[12px] font-semibold">Training Capacity (Weekly)</span>
        </div>
        <div className="text-[10px] text-muted-foreground/50 tabular-nums">
          {Math.round(gamesXPTarget)} XP max
          {isSyncing && <span className="ml-1 text-[8px]">•</span>}
        </div>
      </div>
      
      {/* Sub-label */}
      <p className="text-[10px] text-muted-foreground/70 mb-4">
        Maximum tolerable cognitive load
      </p>
      
      {/* Status Label - Neutral and prominent */}
      <div className="mb-3">
        <span className={`text-[13px] font-medium ${getStatusColor(adaptiveStatus.status)}`}>
          {adaptiveStatus.label}
        </span>
      </div>

      {/* Main Progress Bar with Optimal Range Band */}
      <div className="relative h-4 bg-muted/30 rounded-full overflow-hidden mb-2">
        {/* Optimal Range Band - Visually Dominant */}
        <div 
          className="absolute h-full bg-emerald-400/25 border-l-2 border-r-2 border-emerald-400/60"
          style={{ 
            left: `${optimalRange.min}%`, 
            width: `${optimalRange.max - optimalRange.min}%` 
          }}
        />
        {/* Current Progress */}
        <motion.div
          className={`absolute h-full rounded-full ${
            adaptiveStatus.status === "within" 
              ? "bg-emerald-400" 
              : "bg-muted-foreground/40"
          }`}
          initial={false}
          animate={{ width: `${Math.min(100, gamesProgress)}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      
      {/* Range Labels */}
      <div className="flex justify-between mb-4">
        <span className="text-[9px] text-muted-foreground/50">0 XP</span>
        <span className="text-[9px] text-emerald-400/80 font-medium">Optimal Range</span>
        <span className="text-[9px] text-muted-foreground/50">{Math.round(gamesXPTarget)} XP</span>
      </div>
      
      {/* Explanatory Micro-copy - Always visible */}
      <p className="text-[10px] text-muted-foreground/70 mb-4 leading-relaxed">
        Optimal training drives cognitive adaptation without overload.
        Training beyond this range does not increase benefit.
      </p>

      {/* Load Distribution: S1/S2 breakdown */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Dumbbell className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-medium">Load Distribution</span>
        </div>
        
        {/* S1 row - Fast skills */}
        <div className="grid grid-cols-[100px_1fr_1fr] gap-1 mb-1">
          <div className="flex items-center gap-0.5">
            <Zap className="w-2.5 h-2.5 text-amber-400" />
            <span className="text-[9px] text-amber-400 font-medium">S1 — Fast skills</span>
          </div>
          {s1Areas.map((area) => {
            const AreaIcon = AREA_ICONS[area.area as keyof typeof AREA_ICONS];
            return (
              <button
                key={area.area}
                onClick={() => setExpandedCell(expandedCell === `s1-${area.area}` ? null : `s1-${area.area}`)}
                className="h-auto bg-amber-500/10 rounded flex flex-col items-stretch px-1 py-0.5 transition-all"
              >
                <div className="flex items-center gap-1">
                  <AreaIcon className="w-2 h-2 text-muted-foreground/50" />
                  <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-amber-400/60"
                      initial={false}
                      animate={{ width: `${Math.min(100, area.progress)}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                </div>
                <AnimatePresence>
                  {expandedCell === `s1-${area.area}` && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-[7px] text-amber-300/70 tabular-nums text-center mt-0.5"
                    >
                      {Math.round(area.cappedXP)}/{Math.round(area.target)} XP
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
        
        {/* S2 row - Reasoning skills */}
        <div className="grid grid-cols-[100px_1fr_1fr] gap-1">
          <div className="flex items-center gap-0.5">
            <Timer className="w-2.5 h-2.5 text-violet-400" />
            <span className="text-[9px] text-violet-400 font-medium">S2 — Reasoning skills</span>
          </div>
          {s2Areas.map((area) => {
            const AreaIcon = AREA_ICONS[area.area as keyof typeof AREA_ICONS];
            return (
              <button
                key={area.area}
                onClick={() => setExpandedCell(expandedCell === `s2-${area.area}` ? null : `s2-${area.area}`)}
                className="h-auto bg-violet-500/10 rounded flex flex-col items-stretch px-1 py-0.5 transition-all"
              >
                <div className="flex items-center gap-1">
                  <AreaIcon className="w-2 h-2 text-muted-foreground/50" />
                  <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-violet-400/60"
                      initial={false}
                      animate={{ width: `${Math.min(100, area.progress)}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                </div>
                <AnimatePresence>
                  {expandedCell === `s2-${area.area}` && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-[7px] text-violet-300/70 tabular-nums text-center mt-0.5"
                    >
                      {Math.round(area.cappedXP)}/{Math.round(area.target)} XP
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            );
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
          <motion.div
            className={`h-full rounded-full ${recoveryComplete ? "bg-emerald-400" : "bg-teal-400"}`}
            initial={false}
            animate={{ width: `${Math.min(100, recoveryProgress)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <p className="text-[9px] text-muted-foreground/60 mt-1.5 leading-relaxed">
          Recovery restores training capacity and affects availability.
          It does not provide XP.
        </p>
      </div>

      {/* Weekly completion celebration with report popup */}
      <WeeklyCompleteCelebration 
        show={showCelebration} 
        onComplete={handleCelebrationComplete} 
      />
    </motion.div>
  );
}
