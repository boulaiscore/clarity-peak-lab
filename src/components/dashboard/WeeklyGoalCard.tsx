import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, BookMarked, CheckCircle2, Zap, Brain, Shield, Trophy } from "lucide-react";
import { useCappedWeeklyProgress } from "@/hooks/useCappedWeeklyProgress";
import { XPCelebration } from "@/components/app/XPCelebration";
import { WEEKLY_GOAL_MESSAGES } from "@/lib/cognitiveFeedback";

// Mini celebration badge that appears when a category is completed
function CategoryCompleteBadge({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium"
        >
          <Trophy className="w-2.5 h-2.5" />
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export function WeeklyGoalCard() {
  const {
    rawGamesXP,
    rawTasksXP,
    rawDetoxXP,
    cappedTotalXP,
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
    totalProgress,
    isLoading,
  } = useCappedWeeklyProgress();

  // Avoid "flash to zero" on navigation: keep last stable snapshot while refetching.
  const lastStable = useRef<{
    rawGamesXP: number;
    rawTasksXP: number;
    rawDetoxXP: number;
    totalXPTarget: number;
    gamesXPTarget: number;
    tasksXPTarget: number;
    detoxXPTarget: number;
    gamesComplete: boolean;
    tasksComplete: boolean;
    detoxComplete: boolean;
    gamesProgress: number;
    tasksProgress: number;
    detoxProgress: number;
  } | null>(null);

  useEffect(() => {
    if (!isLoading) {
      lastStable.current = {
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
      };
    }
  }, [
    isLoading,
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
  ]);

  const snapshot = isLoading && lastStable.current ? lastStable.current : {
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
  };

  // Display should be consistent across Home/Lab/Dashboard:
  // show RAW earned XP, while progress remains capped to the weekly target.
  const rawTotalXP = snapshot.rawGamesXP + snapshot.rawTasksXP + snapshot.rawDetoxXP;
  const cappedTotalForProgress = Math.min(rawTotalXP, snapshot.totalXPTarget);
  const totalProgressDisplay =
    snapshot.totalXPTarget > 0
      ? Math.min(100, (cappedTotalForProgress / snapshot.totalXPTarget) * 100)
      : 0;

  const xpRemaining = Math.max(0, snapshot.totalXPTarget - cappedTotalForProgress);
  const goalReached = cappedTotalForProgress >= snapshot.totalXPTarget && snapshot.totalXPTarget > 0;

  const [showCelebration, setShowCelebration] = useState(false);
  const prevGoalReached = useRef(false);

  // Trigger celebration when goal is reached for the first time
  useEffect(() => {
    if (goalReached && !prevGoalReached.current) {
      setShowCelebration(true);
    }
    prevGoalReached.current = goalReached;
  }, [goalReached]);

  return (
    <>
      <XPCelebration
        show={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          aria-busy={isLoading}
          className="p-4 rounded-xl bg-gradient-to-br from-muted/50 via-muted/30 to-transparent border border-border/50 mb-4"
        >
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
                {Math.round(totalProgressDisplay)}% complete
              </div>
              <div className="text-[9px] text-muted-foreground/80 tabular-nums">
                {Math.round(rawTotalXP)}/{Math.round(totalXPTarget)} XP
              </div>
            </div>
          </div>

        {/* Total XP Progress Bar - multi-color gradient */}
          <div className="h-2 bg-muted/50 rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 via-violet-400 to-teal-400 rounded-full"
              initial={false}
              animate={{ width: `${totalProgressDisplay}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

        {/* Weekly Load Breakdown */}
        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30 mb-3">
          <div className="flex items-center gap-1.5 mb-3">
            <Zap className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
              Load breakdown
            </span>
          </div>

          {/* Games */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-blue-500/15 flex items-center justify-center">
                  <Gamepad2 className="w-3 h-3 text-blue-400" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-foreground">{WEEKLY_GOAL_MESSAGES.categories.games.label}</span>
                  <p className="text-[8px] text-muted-foreground">{WEEKLY_GOAL_MESSAGES.categories.games.benefit}</p>
                </div>
                <CategoryCompleteBadge show={gamesComplete} />
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground">{Math.round(gamesProgress)}%</div>
                <div className="text-[9px] text-muted-foreground/80 tabular-nums">
                  {Math.round(rawGamesXP)}/{Math.round(gamesXPTarget)} XP
                </div>
              </div>
            </div>
            <div className="h-1.5 bg-blue-500/10 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${gamesComplete ? "bg-emerald-400" : "bg-blue-400"}`}
                initial={false}
                animate={{ width: `${gamesProgress}%` }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
              />
            </div>
          </div>

          {/* Tasks */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-violet-500/15 flex items-center justify-center">
                  <BookMarked className="w-3 h-3 text-violet-400" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-foreground">{WEEKLY_GOAL_MESSAGES.categories.tasks.label}</span>
                  <p className="text-[8px] text-muted-foreground">{WEEKLY_GOAL_MESSAGES.categories.tasks.benefit}</p>
                </div>
                <CategoryCompleteBadge show={tasksComplete} />
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground">{Math.round(tasksProgress)}%</div>
                <div className="text-[9px] text-muted-foreground/80 tabular-nums">
                  {Math.round(rawTasksXP)}/{Math.round(tasksXPTarget)} XP
                </div>
              </div>
            </div>
            <div className="h-1.5 bg-violet-500/10 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${tasksComplete ? "bg-emerald-400" : "bg-violet-400"}`}
                initial={false}
                animate={{ width: `${tasksProgress}%` }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              />
            </div>
          </div>

          {/* Detox */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-teal-500/15 flex items-center justify-center relative">
                  <Brain className="w-3 h-3 text-teal-400" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-foreground">{WEEKLY_GOAL_MESSAGES.categories.detox.label}</span>
                  <p className="text-[8px] text-muted-foreground">{WEEKLY_GOAL_MESSAGES.categories.detox.benefit}</p>
                </div>
                <CategoryCompleteBadge show={detoxComplete} />
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground">{Math.round(detoxProgress)}%</div>
                <div className="text-[9px] text-muted-foreground/80 tabular-nums">
                  {Math.round(rawDetoxXP)}/{Math.round(detoxXPTarget)} XP
                </div>
              </div>
            </div>
            <div className="h-1.5 bg-teal-500/10 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${detoxComplete ? "bg-emerald-400" : "bg-gradient-to-r from-teal-400 to-cyan-400"}`}
                initial={false}
                animate={{ width: `${detoxProgress}%` }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
              />
            </div>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground">
          {WEEKLY_GOAL_MESSAGES.getProgressMessage(xpRemaining, totalXPTarget)}
        </p>
      </motion.div>
    </>
  );
}
