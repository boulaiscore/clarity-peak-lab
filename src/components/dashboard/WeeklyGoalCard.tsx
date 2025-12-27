import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Star, Gamepad2, BookMarked, Target } from "lucide-react";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { XPCelebration } from "@/components/app/XPCelebration";

// Estimated XP split based on plan structure
const PLAN_XP_SPLIT: Record<string, { gamesPercent: number; tasksPercent: number }> = {
  light: { gamesPercent: 0.75, tasksPercent: 0.25 },      // ~75 games, ~25 tasks
  expert: { gamesPercent: 0.60, tasksPercent: 0.40 },     // ~90 games, ~60 tasks
  superhuman: { gamesPercent: 0.58, tasksPercent: 0.42 }, // ~145 games, ~105 tasks
};

export function WeeklyGoalCard() {
  const { 
    weeklyXPEarned, 
    weeklyXPTarget, 
    weeklyGamesXP, 
    weeklyContentXP,
    plan 
  } = useWeeklyProgress();
  const [showCelebration, setShowCelebration] = useState(false);
  const prevGoalReached = useRef(false);

  const xpProgress = Math.min(100, (weeklyXPEarned / weeklyXPTarget) * 100);
  const xpRemaining = Math.max(0, weeklyXPTarget - weeklyXPEarned);
  const goalReached = weeklyXPEarned >= weeklyXPTarget && weeklyXPTarget > 0;

  // Calculate XP targets for games and tasks based on plan
  const split = PLAN_XP_SPLIT[plan.id] || PLAN_XP_SPLIT.light;
  const gamesXPTarget = Math.round(weeklyXPTarget * split.gamesPercent);
  const tasksXPTarget = Math.round(weeklyXPTarget * split.tasksPercent);

  // Progress percentages
  const gamesProgress = Math.min(100, (weeklyGamesXP / gamesXPTarget) * 100);
  const tasksProgress = Math.min(100, (weeklyContentXP / tasksXPTarget) * 100);

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
        className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 mb-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-[12px] font-semibold">Weekly Goal</span>
          </div>
          <span className="text-[12px] font-bold text-amber-400">
            {weeklyXPEarned} / {weeklyXPTarget} XP
          </span>
        </div>

        {/* Total XP Progress Bar */}
        <div className="h-2 bg-amber-500/10 rounded-full overflow-hidden mb-4">
          <motion.div 
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* XP Breakdown by Source */}
        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30 mb-3">
          <div className="flex items-center gap-1.5 mb-3">
            <Target className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
              {plan.name} Breakdown
            </span>
          </div>

          {/* Games XP */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-blue-500/15 flex items-center justify-center">
                  <Gamepad2 className="w-3 h-3 text-blue-400" />
                </div>
                <span className="text-[11px] font-medium text-foreground">Games</span>
              </div>
              <span className="text-[11px] font-semibold text-blue-400">
                {weeklyGamesXP} / {gamesXPTarget} XP
              </span>
            </div>
            <div className="h-1.5 bg-blue-500/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-blue-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${gamesProgress}%` }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
              />
            </div>
          </div>

          {/* Tasks XP */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-purple-500/15 flex items-center justify-center">
                  <BookMarked className="w-3 h-3 text-purple-400" />
                </div>
                <span className="text-[11px] font-medium text-foreground">Tasks</span>
              </div>
              <span className="text-[11px] font-semibold text-purple-400">
                {weeklyContentXP} / {tasksXPTarget} XP
              </span>
            </div>
            <div className="h-1.5 bg-purple-500/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-purple-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${tasksProgress}%` }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              />
            </div>
          </div>
        </div>
        
        {xpRemaining > 0 ? (
          <p className="text-[10px] text-muted-foreground">
            <span className="text-amber-400 font-medium">{xpRemaining} XP</span> remaining to reach weekly target
          </p>
        ) : (
          <p className="text-[10px] text-emerald-400 font-medium">
            Weekly goal achieved! Keep training to level up faster.
          </p>
        )}
      </motion.div>
    </>
  );
}
