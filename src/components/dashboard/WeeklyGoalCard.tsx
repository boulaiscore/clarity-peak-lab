import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, BookMarked, Brain, Shield, Trophy, Target, Lightbulb } from "lucide-react";
import { useStableCognitiveLoad } from "@/hooks/useStableCognitiveLoad";
import { WEEKLY_GOAL_MESSAGES } from "@/lib/cognitiveFeedback";

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

// Icon mapping for areas - matches GamesLibrary.tsx
const AREA_ICONS = {
  focus: Target,
  reasoning: Brain,
  creativity: Lightbulb,
} as const;

export function WeeklyGoalCard() {
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
  const prevGoalReached = useRef(false);

  // Get S1 and S2 areas
  const s1Areas = gamesSubTargets.find((s) => s.system === "S1")?.areas ?? [];
  const s2Areas = gamesSubTargets.find((s) => s.system === "S2")?.areas ?? [];

  const cappedGames = Math.min(rawGamesXP, gamesXPTarget);
  const cappedTasks = Math.min(rawTasksXP, tasksXPTarget);
  const cappedDetox = Math.min(rawDetoxXP, detoxXPTarget);

  useEffect(() => {
    if (goalReached && !prevGoalReached.current) {
      setShowCelebration(true);
    }
    prevGoalReached.current = goalReached;
  }, [goalReached]);

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

      {/* Games: 6-bar grid (2 rows × 3 cols) */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Gamepad2 className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-medium">Games</span>
          <span className="text-[8px] text-muted-foreground/60 tabular-nums">
            {Math.round(cappedGames)}/{Math.round(gamesXPTarget)}
          </span>
          <CategoryCompleteBadge show={gamesComplete} />
        </div>
        
        {/* Grid header: area icons */}
        <div className="grid grid-cols-[40px_1fr_1fr_1fr] gap-1 mb-1">
          <div />
          <div className="flex justify-center">
            <Target className="w-2.5 h-2.5 text-muted-foreground/40" />
          </div>
          <div className="flex justify-center">
            <Brain className="w-2.5 h-2.5 text-muted-foreground/40" />
          </div>
          <div className="flex justify-center">
            <Lightbulb className="w-2.5 h-2.5 text-muted-foreground/40" />
          </div>
        </div>
        
        {/* S1 row */}
        <div className="grid grid-cols-[40px_1fr_1fr_1fr] gap-1 mb-1">
          <div className="flex items-center">
            <span className="text-[8px] text-amber-400 font-medium">S1</span>
          </div>
          {s1Areas.map((area) => (
            <button
              key={area.area}
              onClick={() => setExpandedCell(expandedCell === `s1-${area.area}` ? null : `s1-${area.area}`)}
              className="h-auto bg-amber-500/10 rounded flex flex-col items-stretch px-1 py-0.5 transition-all"
            >
              <div className="flex items-center">
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
          ))}
        </div>
        
        {/* S2 row */}
        <div className="grid grid-cols-[40px_1fr_1fr_1fr] gap-1">
          <div className="flex items-center">
            <span className="text-[8px] text-violet-400 font-medium">S2</span>
          </div>
          {s2Areas.map((area) => (
            <button
              key={area.area}
              onClick={() => setExpandedCell(expandedCell === `s2-${area.area}` ? null : `s2-${area.area}`)}
              className="h-auto bg-violet-500/10 rounded flex flex-col items-stretch px-1 py-0.5 transition-all"
            >
              <div className="flex items-center">
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
          ))}
        </div>
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

      {/* Detox */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Brain className="w-3 h-3 text-teal-400" />
          <span className="text-[10px] text-muted-foreground font-medium">Detox</span>
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

      <p className="text-[10px] text-muted-foreground">
        {WEEKLY_GOAL_MESSAGES.getProgressMessage(xpRemaining, totalXPTarget)}
      </p>
    </motion.div>
  );
}
