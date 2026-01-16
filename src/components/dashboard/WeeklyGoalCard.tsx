import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Brain, Trophy, Target, Lightbulb, ChevronDown, Zap, Timer, Leaf, Footprints, TrendingDown, CheckCircle2, AlertTriangle } from "lucide-react";
import { useStableCognitiveLoad } from "@/hooks/useStableCognitiveLoad";
import { WeeklyCompleteCelebration } from "@/components/app/WeeklyCompleteCelebration";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Training status types
type TrainingStatus = "low" | "ok" | "high";

interface TrainingStatusInfo {
  status: TrainingStatus;
  label: string;
  subtitle: string;
  footerMessage: string;
  color: string;
  icon: React.ElementType;
}

// Helper to determine training status based on progress
function getTrainingStatus(progress: number): TrainingStatusInfo {
  if (progress < 40) {
    return {
      status: "low",
      label: "Too little training",
      subtitle: "You're not training enough to improve.",
      footerMessage: "Train more this week to reach an effective level.",
      color: "text-amber-400",
      icon: TrendingDown,
    };
  }
  if (progress <= 100) {
    return {
      status: "ok",
      label: "Training at the right level",
      subtitle: "This amount of training is effective.",
      footerMessage: "Keep this rhythm to improve.",
      color: "text-emerald-400",
      icon: CheckCircle2,
    };
  }
  return {
    status: "high",
    label: "Too much training",
    subtitle: "More training won't help right now.",
    footerMessage: "Recovery is required before more training.",
    color: "text-orange-400",
    icon: AlertTriangle,
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
  
  // Calculate training status
  const trainingStatus = useMemo(() => getTrainingStatus(gamesProgress), [gamesProgress]);

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
            {/* Compact Header - Training Load */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-semibold">Training Load</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-[10px] font-medium text-muted-foreground tabular-nums">
                  {Math.round(cappedGames)}/{Math.round(gamesXPTarget)} XP
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </motion.div>
              </div>
            </div>
            
            {/* Training Status - Most prominent element */}
            <div className="flex items-center gap-2 mb-2">
              <trainingStatus.icon className={`w-4 h-4 ${trainingStatus.color}`} />
              <div>
                <p className={`text-[12px] font-bold ${trainingStatus.color}`}>{trainingStatus.label}</p>
                <p className="text-[9px] text-muted-foreground">{trainingStatus.subtitle}</p>
              </div>
            </div>

            {/* Training Progress Bar - Always visible */}
            <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${gamesComplete ? "bg-emerald-400" : "bg-gradient-to-r from-amber-400 via-violet-400 to-teal-400"}`}
                initial={false}
                animate={{ width: `${Math.min(100, gamesProgress)}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 pt-3 border-t border-border/30"
            >
              {/* Training breakdown: 2x2 grid */}
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Dumbbell className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-medium">Training</span>
                  <span className="text-[8px] text-muted-foreground/60 tabular-nums">
                    {Math.round(cappedGames)}/{Math.round(gamesXPTarget)}
                  </span>
                  <CategoryCompleteBadge show={gamesComplete} />
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
                              className={`h-full rounded-full ${area.complete ? "bg-emerald-400" : "bg-amber-400"}`}
                              initial={false}
                              animate={{ width: `${Math.min(100, area.progress)}%` }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                            />
                          </div>
                          {area.complete && <Trophy className="w-2 h-2 text-emerald-400 ml-0.5" />}
                        </div>
                        <AnimatePresence>
                          {expandedCell === `s1-${area.area}` && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="text-[7px] text-amber-300 tabular-nums text-center mt-0.5"
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
                              className={`h-full rounded-full ${area.complete ? "bg-emerald-400" : "bg-violet-400"}`}
                              initial={false}
                              animate={{ width: `${Math.min(100, area.progress)}%` }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                            />
                          </div>
                          {area.complete && <Trophy className="w-2 h-2 text-emerald-400 ml-0.5" />}
                        </div>
                        <AnimatePresence>
                          {expandedCell === `s2-${area.area}` && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="text-[7px] text-violet-300 tabular-nums text-center mt-0.5"
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

              {/* Recovery Budget Section - Separate from Training */}
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
                  Restores training capacity
                </p>
              </div>

              <p className="text-[9px] text-muted-foreground mt-3">
                {trainingStatus.footerMessage}
              </p>
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
      {/* Header - Training Load Only */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-primary" />
          <span className="text-[12px] font-semibold">Training Load</span>
        </div>
        <div className="text-[10px] text-muted-foreground/80 tabular-nums">
          {Math.round(cappedGames)}/{Math.round(gamesXPTarget)} XP
          {isSyncing && <span className="ml-1 text-[8px] text-muted-foreground/50">•</span>}
        </div>
      </div>
      
      {/* Training Status - Most prominent element */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-muted/30 border border-border/30">
        <trainingStatus.icon className={`w-6 h-6 ${trainingStatus.color}`} />
        <div>
          <p className={`text-[14px] font-bold ${trainingStatus.color}`}>{trainingStatus.label}</p>
          <p className="text-[10px] text-muted-foreground">{trainingStatus.subtitle}</p>
        </div>
      </div>

      {/* Training Progress Bar */}
      <div className="h-2 bg-muted/50 rounded-full overflow-hidden mb-4">
        <motion.div
          className={`h-full rounded-full ${gamesComplete ? "bg-emerald-400" : "bg-gradient-to-r from-amber-400 via-violet-400 to-teal-400"}`}
          initial={false}
          animate={{ width: `${Math.min(100, gamesProgress)}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Training breakdown: 2x2 matrix */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Dumbbell className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-medium">Training</span>
          <span className="text-[8px] text-muted-foreground/60 tabular-nums">
            {Math.round(cappedGames)}/{Math.round(gamesXPTarget)}
          </span>
          <CategoryCompleteBadge show={gamesComplete} />
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
                      className={`h-full rounded-full ${area.complete ? "bg-emerald-400" : "bg-amber-400"}`}
                      initial={false}
                      animate={{ width: `${Math.min(100, area.progress)}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                  {area.complete && <Trophy className="w-2 h-2 text-emerald-400 ml-0.5" />}
                </div>
                <AnimatePresence>
                  {expandedCell === `s1-${area.area}` && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-[7px] text-amber-300 tabular-nums text-center mt-0.5"
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
                      className={`h-full rounded-full ${area.complete ? "bg-emerald-400" : "bg-violet-400"}`}
                      initial={false}
                      animate={{ width: `${Math.min(100, area.progress)}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                  {area.complete && <Trophy className="w-2 h-2 text-emerald-400 ml-0.5" />}
                </div>
                <AnimatePresence>
                  {expandedCell === `s2-${area.area}` && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-[7px] text-violet-300 tabular-nums text-center mt-0.5"
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

      {/* Recovery Budget Section - Separate from Training */}
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
        <p className="text-[9px] text-muted-foreground/60 mt-1">
          Restores training capacity
        </p>
      </div>

      <p className="text-[10px] text-muted-foreground">
        {trainingStatus.footerMessage}
      </p>

      {/* Weekly completion celebration with report popup */}
      <WeeklyCompleteCelebration 
        show={showCelebration} 
        onComplete={handleCelebrationComplete} 
      />
    </motion.div>
  );
}
