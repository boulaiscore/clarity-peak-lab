import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Star, Gamepad2, BookMarked, Target, CheckCircle2, Smartphone, Ban, Gift } from "lucide-react";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useWeeklyDetoxXP } from "@/hooks/useDetoxProgress";
import { XPCelebration } from "@/components/app/XPCelebration";

// Estimated XP split based on plan structure
const PLAN_XP_SPLIT: Record<string, { gamesPercent: number; tasksPercent: number }> = {
  light: { gamesPercent: 0.75, tasksPercent: 0.25 },      // ~75 games, ~25 tasks
  expert: { gamesPercent: 0.60, tasksPercent: 0.40 },     // ~90 games, ~60 tasks
  superhuman: { gamesPercent: 0.58, tasksPercent: 0.42 }, // ~145 games, ~105 tasks
};

// Bonus XP target for detox (not part of main goal, purely additive)
const DETOX_BONUS_TARGET = 50;

export function WeeklyGoalCard() {
  const { 
    weeklyXPEarned, 
    weeklyXPTarget, 
    weeklyGamesXP, 
    weeklyContentXP,
    plan 
  } = useWeeklyProgress();
  const { data: detoxData } = useWeeklyDetoxXP();
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

  // Check if each category is complete
  const gamesComplete = weeklyGamesXP >= gamesXPTarget;
  const tasksComplete = weeklyContentXP >= tasksXPTarget;

  // Real detox XP from database
  const weeklyDetoxXP = detoxData?.totalXP || 0;
  const detoxProgress = Math.min(100, (weeklyDetoxXP / DETOX_BONUS_TARGET) * 100);

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
        className="p-4 rounded-xl bg-gradient-to-br from-muted/50 via-muted/30 to-transparent border border-border/50 mb-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-foreground" />
            <span className="text-[12px] font-semibold">Weekly Goal</span>
          </div>
          <span className="text-[12px] font-bold text-foreground">
            {weeklyXPEarned} / {weeklyXPTarget} XP
          </span>
        </div>

        {/* Total XP Progress Bar - multi-color gradient */}
        <div className="h-2 bg-muted/50 rounded-full overflow-hidden mb-4">
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-400 via-violet-400 to-teal-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* XP Breakdown by Source */}
        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30 mb-3">
          <div className="flex items-center gap-1.5 mb-3">
            <Star className="w-3 h-3 text-muted-foreground" />
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
                {gamesComplete && (
                  <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Completato
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-blue-400">
                {weeklyGamesXP} / {gamesXPTarget} XP
              </span>
            </div>
            <div className="h-1.5 bg-blue-500/10 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full rounded-full ${gamesComplete ? 'bg-emerald-400' : 'bg-blue-400'}`}
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
                <div className="w-5 h-5 rounded bg-violet-500/15 flex items-center justify-center">
                  <BookMarked className="w-3 h-3 text-violet-400" />
                </div>
                <span className="text-[11px] font-medium text-foreground">Tasks</span>
                {tasksComplete && (
                  <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Completato
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-violet-400">
                {weeklyContentXP} / {tasksXPTarget} XP
              </span>
            </div>
            <div className="h-1.5 bg-violet-500/10 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full rounded-full ${tasksComplete ? 'bg-emerald-400' : 'bg-violet-400'}`}
                initial={{ width: 0 }}
                animate={{ width: `${tasksProgress}%` }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              />
            </div>
          </div>
        </div>

        {/* Detox Bonus Section */}
        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30 mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Star className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
              Bonus XP
            </span>
          </div>
          
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-teal-500/15 flex items-center justify-center relative">
                <Smartphone className="w-3 h-3 text-teal-400" />
                <Ban className="w-2 h-2 text-teal-400 absolute -bottom-0.5 -right-0.5" />
              </div>
              <span className="text-[11px] font-medium text-foreground">Detox</span>
            </div>
            <span className="text-[11px] font-semibold text-teal-400">
              +{weeklyDetoxXP} / {DETOX_BONUS_TARGET} XP
            </span>
          </div>
          <div className="h-1.5 bg-teal-500/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-400"
              initial={{ width: 0 }}
              animate={{ width: `${detoxProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
            />
          </div>
          <p className="text-[9px] text-muted-foreground mt-1.5">
            Earn bonus XP by completing detox challenges in NeuroLab
          </p>
        </div>
        
        {xpRemaining > 0 ? (
          <p className="text-[10px] text-muted-foreground">
            <span className="text-foreground font-medium">{xpRemaining} XP</span> remaining to reach weekly target
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
