import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, BookMarked, Zap, Brain, Shield, Trophy } from "lucide-react";
import { useCappedWeeklyProgress } from "@/hooks/useCappedWeeklyProgress";
import { useWeeklyLoadSnapshot, WeeklyLoadSnapshot } from "@/hooks/useWeeklyLoadSnapshot";
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
    isLoading,
    isFetched,
  } = useCappedWeeklyProgress();

  // Persistent snapshot that survives route changes (stored in React Query cache)
  const { getSnapshot, setSnapshot } = useWeeklyLoadSnapshot();

  // Read from persistent cache early (used by multiple hooks below)
  const cachedSnapshot = getSnapshot();

  // These hooks MUST be called before any early returns
  const [showCelebration, setShowCelebration] = useState(false);
  const prevGoalReached = useRef(false);

  // Debug: log weekly load inputs/outputs (helps diagnose cache/weekStart/user mismatches)
  useEffect(() => {
    // keep logs compact
    console.log("[WeeklyGoalCard]", {
      isLoading,
      isFetched,
      rawGamesXP,
      rawTasksXP,
      rawDetoxXP,
      totalXPTarget,
      gamesXPTarget,
      tasksXPTarget,
      detoxXPTarget,
      cachedAt: cachedSnapshot?.savedAt,
    });
  }, [
    isLoading,
    isFetched,
    rawGamesXP,
    rawTasksXP,
    rawDetoxXP,
    totalXPTarget,
    gamesXPTarget,
    tasksXPTarget,
    detoxXPTarget,
    cachedSnapshot?.savedAt,
  ]);

  // Update the persistent snapshot ONLY when:
  // - not loading AND
  // - queries have fetched at least once AND
  // - either the new data is > 0, OR there is no existing snapshot yet
  //
  // This prevents the "flash to zero" when switching tabs and back:
  // on remount, React Query returns placeholder (0) immediately while
  // refetching from cache; we must NOT overwrite a good snapshot with 0.
  useEffect(() => {
    const newRawTotal = rawGamesXP + rawTasksXP + rawDetoxXP;
    const hasMeaningfulData = newRawTotal > 0;
    const hasExistingSnapshot = cachedSnapshot && cachedSnapshot.savedAt > 0;

    // Only update snapshot if:
    // 1. Not loading AND fetched (query completed), AND
    // 2. Either new data is > 0, OR we don't have any snapshot yet
    if (!isLoading && isFetched && (hasMeaningfulData || !hasExistingSnapshot)) {
      setSnapshot({
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
      });
    }
  }, [
    isLoading,
    isFetched,
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
    setSnapshot,
    cachedSnapshot?.savedAt,
  ]);

  // Build display snapshot:
  // - Prefer fresh data once queries have fetched and are not loading
  // - Otherwise, fall back to cached snapshot (so we don't flash during refetch)
  const freshSnapshot: Omit<WeeklyLoadSnapshot, "savedAt"> = {
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

  const snapshot: Omit<WeeklyLoadSnapshot, "savedAt"> =
    !isLoading && isFetched
      ? freshSnapshot
      : cachedSnapshot
        ? cachedSnapshot
        : freshSnapshot;

  // IMPORTANT: Total XP must use CAPPED values per category (excess doesn't count)
  // Each category can contribute at most its target to the total.
  const cappedGames = Math.min(snapshot.rawGamesXP, snapshot.gamesXPTarget);
  const cappedTasks = Math.min(snapshot.rawTasksXP, snapshot.tasksXPTarget);
  const cappedDetox = Math.min(snapshot.rawDetoxXP, snapshot.detoxXPTarget);
  const cappedTotalXP = cappedGames + cappedTasks + cappedDetox;

  const totalProgressDisplay =
    snapshot.totalXPTarget > 0
      ? Math.min(100, (cappedTotalXP / snapshot.totalXPTarget) * 100)
      : 0;

  const xpRemaining = Math.max(0, snapshot.totalXPTarget - cappedTotalXP);
  const goalReached = cappedTotalXP >= snapshot.totalXPTarget && snapshot.totalXPTarget > 0;

  // Trigger celebration when goal is reached for the first time
  useEffect(() => {
    if (goalReached && !prevGoalReached.current) {
      setShowCelebration(true);
    }
    prevGoalReached.current = goalReached;
  }, [goalReached]);

  // Show skeleton only if loading AND no cached snapshot available
  if (isLoading && !cachedSnapshot) {
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
    <>

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
                {Math.round(cappedTotalXP)}/{Math.round(snapshot.totalXPTarget)} XP
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
                <CategoryCompleteBadge show={snapshot.gamesComplete} />
              </div>
              <div className="text-right">
              <div className="text-[10px] text-muted-foreground">{Math.min(100, Math.round(snapshot.gamesProgress))}%</div>
                <div className="text-[9px] text-muted-foreground/80 tabular-nums">
                  {Math.min(Math.round(snapshot.rawGamesXP), Math.round(snapshot.gamesXPTarget))}/{Math.round(snapshot.gamesXPTarget)} XP
                </div>
              </div>
            </div>
            <div className="h-1.5 bg-blue-500/10 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${snapshot.gamesComplete ? "bg-emerald-400" : "bg-blue-400"}`}
                initial={false}
                animate={{ width: `${snapshot.gamesProgress}%` }}
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
                <CategoryCompleteBadge show={snapshot.tasksComplete} />
              </div>
              <div className="text-right">
              <div className="text-[10px] text-muted-foreground">{Math.min(100, Math.round(snapshot.tasksProgress))}%</div>
                <div className="text-[9px] text-muted-foreground/80 tabular-nums">
                  {Math.min(Math.round(snapshot.rawTasksXP), Math.round(snapshot.tasksXPTarget))}/{Math.round(snapshot.tasksXPTarget)} XP
                </div>
              </div>
            </div>
            <div className="h-1.5 bg-violet-500/10 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${snapshot.tasksComplete ? "bg-emerald-400" : "bg-violet-400"}`}
                initial={false}
                animate={{ width: `${snapshot.tasksProgress}%` }}
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
                <CategoryCompleteBadge show={snapshot.detoxComplete} />
              </div>
              <div className="text-right">
              <div className="text-[10px] text-muted-foreground">{Math.min(100, Math.round(snapshot.detoxProgress))}%</div>
                <div className="text-[9px] text-muted-foreground/80 tabular-nums">
                  {Math.min(Math.round(snapshot.rawDetoxXP), Math.round(snapshot.detoxXPTarget))}/{Math.round(snapshot.detoxXPTarget)} XP
                </div>
              </div>
            </div>
            <div className="h-1.5 bg-teal-500/10 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${snapshot.detoxComplete ? "bg-emerald-400" : "bg-gradient-to-r from-teal-400 to-cyan-400"}`}
                initial={false}
                animate={{ width: `${snapshot.detoxProgress}%` }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
              />
            </div>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground">
          {WEEKLY_GOAL_MESSAGES.getProgressMessage(xpRemaining, snapshot.totalXPTarget)}
        </p>
      </motion.div>
    </>
  );
}
