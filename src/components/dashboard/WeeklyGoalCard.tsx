import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, BookMarked, Brain, Shield, Trophy, Target, Lightbulb, ChevronDown } from "lucide-react";
import { useStableCognitiveLoad } from "@/hooks/useStableCognitiveLoad";
import { WEEKLY_GOAL_MESSAGES } from "@/lib/cognitiveFeedback";
import { WeeklyCompleteCelebration } from "@/components/app/WeeklyCompleteCelebration";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
// S1: focus (Attentional Efficiency), creativity (Rapid Association)
// S2: reasoning (Critical Thinking), creativity (Deliberate Association)
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

interface WeeklyGoalCardProps {
  compact?: boolean;
}

export function WeeklyGoalCard({ compact = false }: WeeklyGoalCardProps) {
  const data = useStableCognitiveLoad();
  
  const {
    rawGamesXP,
    rawTasksXP,
    rawDetoxXP,
    totalXPTarget,
    gamesXPTarget,
    tasksXPTarget,
    detoxXPTarget,
    gamesComplete,
    tasksComplete,
    detoxComplete,
    gamesProgress,
    tasksProgress,
    detoxProgress,
    gamesSubTargets,
    cappedTotalXP,
    totalProgress,
    xpRemaining,
    goalReached,
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
  const cappedTasks = Math.min(rawTasksXP, tasksXPTarget);
  const cappedDetox = Math.min(rawDetoxXP, detoxXPTarget);

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
  const hasNoData = cappedTotalXP === 0 && totalXPTarget === 0;
  
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
            {/* Compact Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-semibold">Weekly Load</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-[10px] font-medium text-muted-foreground tabular-nums">
                  {Math.round(cappedTotalXP)}/{Math.round(totalXPTarget)} XP
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </motion.div>
              </div>
            </div>

            {/* Total Progress Bar - Always visible */}
            <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-400 via-violet-400 to-teal-400 rounded-full"
                initial={false}
                animate={{ width: `${totalProgress}%` }}
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
              {/* Tasks */}
              <div className="mb-2">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <BookMarked className="w-3 h-3 text-violet-400" />
                  <span className="text-[10px] text-muted-foreground font-medium">Tasks</span>
                  <span className="text-[8px] text-muted-foreground/60 tabular-nums">
                    {Math.round(cappedTasks)}/{Math.round(tasksXPTarget)}
                  </span>
                  <CategoryCompleteBadge show={tasksComplete} />
                </div>
                <div className="h-1.5 bg-violet-500/10 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${tasksComplete ? "bg-emerald-400" : "bg-violet-400"}`}
                    initial={false}
                    animate={{ width: `${Math.min(100, tasksProgress)}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Walk & Detox */}
              <div className="mb-2">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Brain className="w-3 h-3 text-teal-400" />
                  <span className="text-[10px] text-muted-foreground font-medium">Walk & Detox</span>
                  <span className="text-[8px] text-muted-foreground/60 tabular-nums">
                    {Math.round(cappedDetox)}/{Math.round(detoxXPTarget)}
                  </span>
                  <CategoryCompleteBadge show={detoxComplete} />
                </div>
                <div className="h-1.5 bg-teal-500/10 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${detoxComplete ? "bg-emerald-400" : "bg-teal-400"}`}
                    initial={false}
                    animate={{ width: `${Math.min(100, detoxProgress)}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Challenges: 6-bar grid (2 rows × 3 cols) */}
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Dumbbell className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-medium">Training</span>
                  <span className="text-[8px] text-muted-foreground/60 tabular-nums">
                    {Math.round(cappedGames)}/{Math.round(gamesXPTarget)}
                  </span>
                  <CategoryCompleteBadge show={gamesComplete} />
                </div>
                
                {/* 2x2 Matrix: S1 has focus+creativity, S2 has reasoning+creativity */}
                {/* Column headers per row since each system has different areas */}
                
                {/* S1 row: focus + creativity (2 columns) */}
                <div className="grid grid-cols-[40px_1fr_1fr] gap-1 mb-1">
                  <div className="flex items-center">
                    <span className="text-[8px] text-amber-400 font-medium">S1</span>
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
                
                {/* S2 row: reasoning + creativity (2 columns) */}
                <div className="grid grid-cols-[40px_1fr_1fr] gap-1">
                  <div className="flex items-center">
                    <span className="text-[8px] text-violet-400 font-medium">S2</span>
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

              <p className="text-[9px] text-muted-foreground">
                {WEEKLY_GOAL_MESSAGES.getProgressMessage(xpRemaining, totalXPTarget)}
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-busy={isSyncing}
      className="p-4 rounded-xl bg-gradient-to-br from-muted/50 via-muted/30 to-transparent border border-border/50 mb-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <div>
            <span className="text-[12px] font-semibold">{WEEKLY_GOAL_MESSAGES.headline}</span>
            <p className="text-[9px] text-muted-foreground">{WEEKLY_GOAL_MESSAGES.subtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-medium text-muted-foreground">
            {Math.round(totalProgress)}%
            {isSyncing && <span className="ml-1 text-[8px] text-muted-foreground/50">•</span>}
          </div>
          <div className="text-[9px] text-muted-foreground/80 tabular-nums">
            {Math.round(cappedTotalXP)}/{Math.round(totalXPTarget)} XP
          </div>
        </div>
      </div>

      {/* Total Progress Bar */}
      <div className="h-2 bg-muted/50 rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-400 via-violet-400 to-teal-400 rounded-full"
          initial={false}
          animate={{ width: `${totalProgress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Tasks */}
      <div className="mb-2">
        <div className="flex items-center gap-1.5 mb-1.5">
          <BookMarked className="w-3 h-3 text-violet-400" />
          <span className="text-[10px] text-muted-foreground font-medium">Tasks</span>
          <span className="text-[8px] text-muted-foreground/60 tabular-nums">
            {Math.round(cappedTasks)}/{Math.round(tasksXPTarget)}
          </span>
          <CategoryCompleteBadge show={tasksComplete} />
        </div>
        <div className="h-1.5 bg-violet-500/10 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${tasksComplete ? "bg-emerald-400" : "bg-violet-400"}`}
            initial={false}
            animate={{ width: `${Math.min(100, tasksProgress)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Walk & Detox */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Brain className="w-3 h-3 text-teal-400" />
          <span className="text-[10px] text-muted-foreground font-medium">Walk & Detox</span>
          <span className="text-[8px] text-muted-foreground/60 tabular-nums">
            {Math.round(cappedDetox)}/{Math.round(detoxXPTarget)}
          </span>
          <CategoryCompleteBadge show={detoxComplete} />
        </div>
        <div className="h-1.5 bg-teal-500/10 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${detoxComplete ? "bg-emerald-400" : "bg-teal-400"}`}
            initial={false}
            animate={{ width: `${Math.min(100, detoxProgress)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Challenges: 2x2 matrix (2 rows × 2 cols per system) */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Dumbbell className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-medium">Training</span>
          <span className="text-[8px] text-muted-foreground/60 tabular-nums">
            {Math.round(cappedGames)}/{Math.round(gamesXPTarget)}
          </span>
          <CategoryCompleteBadge show={gamesComplete} />
        </div>
        
        {/* 2x2 Matrix: S1 has focus+creativity, S2 has reasoning+creativity */}
        {/* Column headers per row since each system has different areas */}
        
        {/* S1 row: focus + creativity (2 columns) */}
        <div className="grid grid-cols-[40px_1fr_1fr] gap-1 mb-1">
          <div className="flex items-center">
            <span className="text-[8px] text-amber-400 font-medium">S1</span>
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
        
        {/* S2 row: reasoning + creativity (2 columns) */}
        <div className="grid grid-cols-[40px_1fr_1fr] gap-1">
          <div className="flex items-center">
            <span className="text-[8px] text-violet-400 font-medium">S2</span>
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

      <p className="text-[10px] text-muted-foreground">
        {WEEKLY_GOAL_MESSAGES.getProgressMessage(xpRemaining, totalXPTarget)}
      </p>

      {/* Weekly completion celebration with report popup */}
      <WeeklyCompleteCelebration 
        show={showCelebration} 
        onComplete={handleCelebrationComplete} 
      />
    </motion.div>
  );
}
