import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, BookMarked, Zap, Brain, Shield, Trophy, Target, Lightbulb, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useCappedWeeklyProgress, SystemSubTarget, AreaModeSubTarget } from "@/hooks/useCappedWeeklyProgress";
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

// Icon mapping for areas
const AREA_ICONS = {
  focus: Target,
  reasoning: Lightbulb,
  creativity: Sparkles,
} as const;

const AREA_LABELS = {
  focus: "Focus",
  reasoning: "Reasoning",
  creativity: "Creativity",
} as const;

// Sub-target progress bar for each area within a system block
function AreaSubTargetRow({ subTarget }: { subTarget: AreaModeSubTarget }) {
  const Icon = AREA_ICONS[subTarget.area];
  const label = AREA_LABELS[subTarget.area];
  
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3 h-3 text-muted-foreground/70" />
      <span className="text-[9px] text-muted-foreground w-14">{label}</span>
      <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${subTarget.complete ? "bg-emerald-400" : "bg-blue-400/70"}`}
          initial={false}
          animate={{ width: `${Math.min(100, subTarget.progress)}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      <span className="text-[8px] text-muted-foreground/70 tabular-nums w-8 text-right">
        {Math.round(subTarget.cappedXP)}/{Math.round(subTarget.target)}
      </span>
    </div>
  );
}

// System block (S1 or S2) with collapsible details
function SystemBlock({ system, isOpen, onToggle }: { 
  system: SystemSubTarget; 
  isOpen: boolean;
  onToggle: () => void;
}) {
  const isS1 = system.system === "S1";
  const bgColor = isS1 ? "bg-amber-500/10" : "bg-violet-500/10";
  const barColor = system.complete 
    ? "bg-emerald-400" 
    : isS1 ? "bg-amber-400" : "bg-violet-400";
  const textColor = isS1 ? "text-amber-400" : "text-violet-400";
  
  return (
    <div className={`rounded-lg p-2 ${bgColor} border border-border/20`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-1.5"
      >
        <div className="flex items-center gap-2">
          <Zap className={`w-3 h-3 ${textColor}`} />
          <span className="text-[10px] font-medium">{system.label}</span>
          <CategoryCompleteBadge show={system.complete} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground tabular-nums">
            {Math.round(system.totalCappedXP)}/{Math.round(system.totalTarget)} XP
          </span>
          {isOpen ? (
            <ChevronUp className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          )}
        </div>
      </button>
      
      {/* System progress bar */}
      <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden mb-2">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={false}
          animate={{ width: `${Math.min(100, system.progress)}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      
      {/* Collapsible area details */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-1.5 overflow-hidden"
          >
            {system.areas.map((area) => (
              <AreaSubTargetRow key={`${area.area}-${area.mode}`} subTarget={area} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
    gamesSubTargets,
    isLoading,
    isFetched,
  } = useCappedWeeklyProgress();

  // Persistent snapshot that survives route changes (stored in React Query cache)
  const { getSnapshot, setSnapshot } = useWeeklyLoadSnapshot();

  // Read from persistent cache early (used by multiple hooks below)
  const cachedSnapshot = getSnapshot();

  // Collapsible state for system blocks
  const [s1Open, setS1Open] = useState(false);
  const [s2Open, setS2Open] = useState(false);

  // These hooks MUST be called before any early returns
  const [showCelebration, setShowCelebration] = useState(false);
  const prevGoalReached = useRef(false);

  // Update the persistent snapshot ONLY when:
  // - not loading AND
  // - queries have fetched at least once AND
  // - either the new data is > 0, OR there is no existing snapshot yet
  useEffect(() => {
    const newRawTotal = rawGamesXP + rawTasksXP + rawDetoxXP;
    const hasMeaningfulData = newRawTotal > 0;
    const hasExistingSnapshot = cachedSnapshot && cachedSnapshot.savedAt > 0;

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
        gamesSubTargets,
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
    gamesSubTargets,
    setSnapshot,
    cachedSnapshot?.savedAt,
  ]);

  // Build display snapshot
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
    gamesSubTargets,
  };

  const freshTotal = freshSnapshot.rawGamesXP + freshSnapshot.rawTasksXP + freshSnapshot.rawDetoxXP;
  const cachedTotal =
    (cachedSnapshot?.rawGamesXP ?? 0) + (cachedSnapshot?.rawTasksXP ?? 0) + (cachedSnapshot?.rawDetoxXP ?? 0);

  const shouldUseFresh = !isLoading && isFetched && (freshTotal > 0 || !cachedSnapshot || cachedTotal === 0);

  const snapshot: Omit<WeeklyLoadSnapshot, "savedAt"> = shouldUseFresh
    ? freshSnapshot
    : cachedSnapshot
      ? cachedSnapshot
      : freshSnapshot;

  // Use gamesSubTargets from snapshot or fresh data
  const displaySubTargets = snapshot.gamesSubTargets ?? gamesSubTargets;

  // Calculate capped totals
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

      {/* Total XP Progress Bar */}
      <div className="h-2 bg-muted/50 rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-400 via-violet-400 to-teal-400 rounded-full"
          initial={false}
          animate={{ width: `${totalProgressDisplay}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Weekly Load Breakdown */}
      <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30 mb-3">
        <div className="flex items-center gap-1.5 mb-3">
          <Gamepad2 className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
            Games ({Math.round(cappedGames)}/{Math.round(snapshot.gamesXPTarget)} XP)
          </span>
          <CategoryCompleteBadge show={snapshot.gamesComplete} />
        </div>

        {/* System 1 and System 2 blocks */}
        <div className="space-y-2">
          {displaySubTargets.map((system) => (
            <SystemBlock
              key={system.system}
              system={system}
              isOpen={system.system === "S1" ? s1Open : s2Open}
              onToggle={() => system.system === "S1" ? setS1Open(!s1Open) : setS2Open(!s2Open)}
            />
          ))}
        </div>
      </div>

      {/* Tasks and Detox */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Tasks */}
        <div className="p-2 rounded-lg bg-violet-500/10 border border-border/20">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <BookMarked className="w-3 h-3 text-violet-400" />
              <span className="text-[10px] font-medium">{WEEKLY_GOAL_MESSAGES.categories.tasks.label}</span>
            </div>
            <CategoryCompleteBadge show={snapshot.tasksComplete} />
          </div>
          <div className="h-1 bg-violet-500/20 rounded-full overflow-hidden mb-1">
            <motion.div
              className={`h-full rounded-full ${snapshot.tasksComplete ? "bg-emerald-400" : "bg-violet-400"}`}
              initial={false}
              animate={{ width: `${Math.min(100, snapshot.tasksProgress)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className="text-[8px] text-muted-foreground/70 tabular-nums">
            {Math.min(Math.round(snapshot.rawTasksXP), Math.round(snapshot.tasksXPTarget))}/{Math.round(snapshot.tasksXPTarget)} XP
          </div>
        </div>

        {/* Detox */}
        <div className="p-2 rounded-lg bg-teal-500/10 border border-border/20">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Brain className="w-3 h-3 text-teal-400" />
              <span className="text-[10px] font-medium">{WEEKLY_GOAL_MESSAGES.categories.detox.label}</span>
            </div>
            <CategoryCompleteBadge show={snapshot.detoxComplete} />
          </div>
          <div className="h-1 bg-teal-500/20 rounded-full overflow-hidden mb-1">
            <motion.div
              className={`h-full rounded-full ${snapshot.detoxComplete ? "bg-emerald-400" : "bg-teal-400"}`}
              initial={false}
              animate={{ width: `${Math.min(100, snapshot.detoxProgress)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className="text-[8px] text-muted-foreground/70 tabular-nums">
            {Math.min(Math.round(snapshot.rawDetoxXP), Math.round(snapshot.detoxXPTarget))}/{Math.round(snapshot.detoxXPTarget)} XP
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground">
        {WEEKLY_GOAL_MESSAGES.getProgressMessage(xpRemaining, snapshot.totalXPTarget)}
      </p>
    </motion.div>
  );
}
